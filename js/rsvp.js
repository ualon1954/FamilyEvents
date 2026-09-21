(async function(){
 const themeButton=document.getElementById('theme-toggle');
 const THEME_KEY='events_rsvp_theme';
 let theme='dark';
 try{const stored=localStorage.getItem(THEME_KEY);if(stored==='light'||stored==='dark')theme=stored}catch(_){}
 const applyTheme=()=>{document.documentElement.dataset.theme=theme;themeButton.textContent=theme==='dark'?'☀️ מצב בהיר':'🌙 מצב כהה';themeButton.setAttribute('aria-label',theme==='dark'?'מעבר למצב בהיר':'מעבר למצב כהה');themeButton.setAttribute('aria-pressed',String(theme==='light'))};
 themeButton.onclick=()=>{theme=theme==='dark'?'light':'dark';applyTheme();try{localStorage.setItem(THEME_KEY,theme)}catch(_){}};
 applyTheme();
 const out=document.getElementById('content'),key=new URLSearchParams(location.search).get('key');
 const displayPhone=raw=>{const p=String(raw??'').trim();return /^5\d{8}$/.test(p)?'0'+p:p};
 const el=(tag,content,cls)=>{const n=document.createElement(tag);if(content!==undefined)n.textContent=content;if(cls)n.className=cls;return n};
 const loading=message=>{const n=el('div',undefined,'loading-state');n.setAttribute('role','status');const s=el('span',undefined,'spinner');s.setAttribute('aria-hidden','true');n.append(s,el('span',message));return n};
 const call=async body=>{const r=await fetch(APP_CONFIG.API_URL,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(body)}),d=await r.json();if(!d.ok)throw Error(d.error||'הפעולה נכשלה');return d};
 if(!key){out.textContent='קישור ההזמנה חסר';return}
 if(!APP_CONFIG.API_URL||APP_CONFIG.API_URL.includes('PASTE_')){out.textContent='כתובת השרת אינה מוגדרת';return}
 let countdownTimer=null;
 let contextPollTimer=null,contextBusy=false,contextQueued=false,saveBusy=false;
 const CONTEXT_POLL_MS=15000;
 const stopTimer=()=>{if(countdownTimer){clearInterval(countdownTimer);countdownTimer=null}};
 const parseDeadline=(data)=>{
  const raw=String(data.deadline||'').trim();
  const match=raw.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if(!match)return null;
  const now=Date.parse(data.serverNowIso||'');
  const target=Date.parse(data.deadlineIso||'');
  if(!Number.isFinite(now)||!Number.isFinite(target))return null;
  return target-now;
 };
 const countdown=(data,closedCallback)=>{
  if(!data.deadline)return null;
  const wrap=el('div',undefined,'countdown'),heading=el('div','זמן שנותר לאישור/שינוי הגעה'),value=el('div',undefined,'countdown-units');wrap.append(heading,value);
  const units=[['ימים','days'],['שעות','hours'],['דקות','minutes'],['שניות','seconds']].map(([label,name])=>{const box=el('div',undefined,'countdown-unit'),number=el('strong','00');box.append(number,el('span',label));value.append(box);return number;});
  const remainingAtLoad=parseDeadline(data),start=Date.now();
  if(remainingAtLoad===null){value.replaceWith(el('div','מועד הסגירה אינו זמין כרגע','countdown-unavailable'));return wrap;}
  const tick=()=>{const ms=Math.max(0,remainingAtLoad-(Date.now()-start));const total=Math.floor(ms/1000),days=Math.floor(total/86400),hours=Math.floor(total%86400/3600),minutes=Math.floor(total%3600/60),seconds=total%60;[days,hours,minutes,seconds].forEach((n,i)=>{units[i].textContent=String(n).padStart(2,'0')});if(ms===0){stopTimer();closedCallback()}};
  tick();if(remainingAtLoad>0)countdownTimer=setInterval(tick,1000);return wrap;
 };
 try{
  let data=await call({action:'rsvpContextV1189A3',key});out.replaceChildren();
  out.append(el('h2',data.event.name),el('p','שלום '+data.guest.name,'rsvp-greeting'));
  if(data.event.date){const p=el('p','תאריך: '),date=el('span',undefined,'event-date'),raw=String(data.event.date),m=raw.match(/^(\d{4})-(\d{2})-(\d{2})(?:T.*)?$/);date.dir='ltr';date.textContent=m?`${m[3]}/${m[2]}/${m[1]}`:raw;p.append(date);out.append(p)}
  if(data.event.venue)out.append(el('p','מקום: '+data.event.venue));
  const area=el('section',undefined,'rsvp-area');out.append(area);
  let isClosed=false;
  let currentView="form";
  let lastSavedStatus=null,lastSavedNumber=0;
  let clock=null;
  const deadlineSignature=d=>[d.deadlineIso||"",d.closed,d.closedMessage||"",d.contactName||"",d.contactPhone||""].join("|");
  let lastDeadlineSignature=deadlineSignature(data);
  const updateClock=()=>{stopTimer();if(clock){clock.remove();clock=null}if(!isClosed){clock=countdown(data,closedView);if(clock)out.insertBefore(clock,area)}};
  const closedView=async()=>{
   if(isClosed)return;
   // At zero, confirm the current deadline with the authoritative server.
   try{await refreshContext(true)}catch(_){}
   if(!data.closed){stopTimer();return}
   isClosed=true;stopTimer();
   currentView="closed";
   area.replaceChildren(el('h3','אישורי ההגעה נסגרו'),el('p',data.closedMessage||'מועד אישור ההגעה הסתיים. נא לפנות למנהל האירוע.','note'));
   if(data.contactName)area.append(el('p','איש קשר: '+data.contactName));
   if(data.contactPhone){const phone=displayPhone(data.contactPhone),p=el('p','טלפון: '),a=el('a',phone);a.href='tel:'+phone.replace(/[^+\d]/g,'');a.dir='ltr';p.append(a);area.append(p)}
  };
  if(data.closed){isClosed=true;currentView="closed";area.replaceChildren(el('h3','אישורי ההגעה נסגרו'),el('p',data.closedMessage||'מועד אישור ההגעה הסתיים. נא לפנות למנהל האירוע.','note'));if(data.contactName)area.append(el('p','איש קשר: '+data.contactName));if(data.contactPhone){const phone=displayPhone(data.contactPhone),p=el('p','טלפון: '),a=el('a',phone);a.href='tel:'+phone.replace(/[^+\d]/g,'');a.dir='ltr';p.append(a);area.append(p)}}
  else updateClock();
  const options=[['Confirmed','מגיע/ה'],['Declined','לא מגיע/ה'],['Pending','טרם החלטתי']];
  let selected=options.some(([s])=>s===data.guest.rsvpStatus)?data.guest.rsvpStatus:null;
  let savedCount=Number(data.guest.confirmedCount)||1;
  const resultView=(status,n)=>{
   const messages={Confirmed:['נשמח לראותכם!','אישור ההגעה נשמר בהצלחה. מספר המשתתפים: '+n,'confirmed'],Declined:['תודה שעדכנת אותנו','תשובתך נשמרה. מקווים להיפגש בשמחות!','declined'],Pending:['תודה על העדכון','תשובתך נשמרה. אפשר לחזור ולהחליט עד למועד האחרון.','pending']};
   currentView="result";lastSavedStatus=status;lastSavedNumber=n;
   const [title,body,kind]=messages[status],panel=el('div',undefined,'result '+kind),change=el('button','שינוי תשובה','secondary-action'),close=el('button','סגירה','secondary-action');
   if(status==='Confirmed'){
    const confetti=el('div',undefined,'confetti');confetti.setAttribute('aria-hidden','true');
    for(let i=0;i<32;i++){
     const piece=el('i');piece.style.setProperty('--x',((i*37)%100)+'%');
     piece.style.setProperty('--delay',((i*13)%17/10)+'s');
     piece.style.setProperty('--duration',(2.6+(i%6)*.34)+'s');
     piece.style.setProperty('--hue',String((i*53)%360));confetti.append(piece);
    }
    panel.append(confetti,el('div','🎉','celebration-symbol'));
   }
   panel.append(el('h3',title),el('p',body));change.type=close.type='button';change.onclick=()=>{if(isClosed)return;formView()};close.onclick=()=>{stopTimer();window.close();if(!window.closed){close.textContent='אפשר לסגור את הלשונית בדפדפן';close.disabled=true}};
   panel.append(change,close);area.replaceChildren(panel);
  };
  const formView=()=>{
   currentView="form";
   const form=el('form'),choices=el('div',undefined,'choices');choices.setAttribute('role','group');choices.setAttribute('aria-label','בחירת אישור הגעה');
   const field=el('div',undefined,'field'),label=el('label','מספר משתתפים (עד '+data.guest.invitedCount+')'),count=el('input');count.type='number';count.min='1';count.max=String(data.guest.invitedCount);count.step='1';count.inputMode='numeric';count.value=String(savedCount);count.id='rsvp-count';label.htmlFor=count.id;field.append(label,count);
   const save=el('button','שמירת תשובה','save');save.type='submit';const message=el('div');message.setAttribute('aria-live','polite');
   const buttons=[];const choose=status=>{selected=status;buttons.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.status===status)));field.hidden=status!=='Confirmed';save.disabled=false;message.replaceChildren()};
   options.forEach(([status,title])=>{const b=el('button',undefined,'choice');b.append(el('span','✓','choice-check'),el('span',title));b.type='button';b.dataset.status=status;b.setAttribute('aria-pressed','false');b.onclick=()=>choose(status);choices.append(b);buttons.push(b)});
   form.append(choices,field,save,message);area.replaceChildren(form);if(selected)choose(selected);else{field.hidden=true;save.disabled=true}
   form.onsubmit=async e=>{e.preventDefault();if(!selected||isClosed)return;const n=selected==='Confirmed'?Number(count.value):0;
    if(selected==='Confirmed'&&(!Number.isInteger(n)||n<1||n>Number(data.guest.invitedCount))){message.replaceChildren(el('p','יש להזין מספר משתתפים תקין בין 1 ל־'+data.guest.invitedCount,'error'));count.focus();return}
    saveBusy=true;save.disabled=true;buttons.forEach(b=>b.disabled=true);message.replaceChildren(loading('שומר...'));
    try{const r=await call({action:'rsvpSaveV1189A3',key,status:selected,count:n});savedCount=n||1;
     // Same-origin localhost tabs receive this signal immediately; focus refresh is a fallback.
     try{localStorage.setItem('events_rsvp_updated_v1189a4',JSON.stringify({eventId:r.eventId,guestId:r.guestId,at:Date.now()}))}catch(_){}
     resultView(selected,n);
    }catch(err){if(/מועד אישור ההגעה הסתיים/.test(err.message||'')){await refreshContext(true);if(data.closed)await closedView();else message.replaceChildren(el('p',err.message,'error'));return}message.replaceChildren(el('p',err.message||'השמירה נכשלה','error'));save.disabled=false;buttons.forEach(b=>b.disabled=false)}
    finally{saveBusy=false;if(contextQueued){contextQueued=false;refreshContext()}}
   };
  };
  if(!isClosed)formView();
  async function refreshContext(force=false){
   if(saveBusy){contextQueued=true;return}
   if(contextBusy)return;
   contextBusy=true;
   try{
    const fresh=await call({action:'rsvpContextV1189A3',key});
    const signature=deadlineSignature(fresh);
    const changed=signature!==lastDeadlineSignature;
    data=fresh;lastDeadlineSignature=signature;
    if(fresh.closed){
     if(!isClosed){isClosed=true;stopTimer();if(clock){clock.remove();clock=null}currentView='closed';area.replaceChildren(el('h3','אישורי ההגעה נסגרו'),el('p',fresh.closedMessage||'מועד אישור ההגעה הסתיים. נא לפנות למנהל האירוע.','note'));if(fresh.contactName)area.append(el('p','איש קשר: '+fresh.contactName));if(fresh.contactPhone){const phone=displayPhone(fresh.contactPhone),p=el('p','טלפון: '),a=el('a',phone);a.href='tel:'+phone.replace(/[^+\d]/g,'');a.dir='ltr';p.append(a);area.append(p)}}
     else if(changed){area.replaceChildren(el('h3','אישורי ההגעה נסגרו'),el('p',fresh.closedMessage||'מועד אישור ההגעה הסתיים. נא לפנות למנהל האירוע.','note'));if(fresh.contactName)area.append(el('p','איש קשר: '+fresh.contactName));if(fresh.contactPhone){const phone=displayPhone(fresh.contactPhone),p=el('p','טלפון: '),a=el('a',phone);a.href='tel:'+phone.replace(/[^+\d]/g,'');a.dir='ltr';p.append(a);area.append(p)}}
    }else{
     if(isClosed){isClosed=false;selected=fresh.guest.rsvpStatus||selected;savedCount=Number(fresh.guest.confirmedCount)||1;if(lastSavedStatus&&lastSavedStatus!=='Pending')resultView(lastSavedStatus,lastSavedNumber);else formView()}
     if(changed||!clock)updateClock();
    }
   }catch(err){if(force)console.warn('RSVP deadline check failed',err)}
   finally{contextBusy=false}
  }
  contextPollTimer=setInterval(()=>{if(!document.hidden)refreshContext()},CONTEXT_POLL_MS);
  window.addEventListener('storage',e=>{if(e.key!=='events_rsvp_event_saved_v1190a4'||!e.newValue)return;try{const notice=JSON.parse(e.newValue);if(String(notice.eventId)===String(data.eventId))refreshContext()}catch(_){}});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)refreshContext()});
 }catch(err){out.replaceChildren(el('p',err.message||'שגיאה בטעינת ההזמנה','error'))}
})();
