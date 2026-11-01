/* V1.1.90A19P2F14Z58D5D55Z41FIX67Q174 */
function rsvpEventTimeQ169_(value){const m=String(value||'').trim().match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);return m&&Number(m[1])<24&&Number(m[2])<60?m[1].padStart(2,'0')+':'+m[2]:'';}
function rsvpInitialChoiceQ171_(guest){const s=String(guest?.rsvpStatus||'');return ['Confirmed','Declined'].includes(s)||s==='Pending'&&guest?.hasRespondedQ171===true?s:null;}
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
  out.append(el('h2',data.event.name));
  const eventTimeQ169=rsvpEventTimeQ169_(data.event.eventTime);
  const eventDetailQ170=(label,text,kind,dir)=>{const item=el('span',undefined,'event-detail-q170');item.append(el('span',label,'event-label-q170'));const value=el('strong',text,'event-value-q170 '+(kind||''));if(dir)value.dir=dir;item.append(value);return item;};
  if(data.event.date||eventTimeQ169){const p=el('p',undefined,'event-details-q170');if(data.event.date){const raw=String(data.event.date),m=raw.match(/^(\d{4})-(\d{2})-(\d{2})(?:T.*)?$/);p.append(eventDetailQ170('תאריך:',m?`${m[3]}/${m[2]}/${m[1]}`:raw,'event-date','ltr'));}if(eventTimeQ169)p.append(eventDetailQ170('שעה:',eventTimeQ169,'event-time','ltr'));out.append(p);}
  if(data.event.venue||data.event.navigationAddress){const venue=String(data.event.venue||'').trim(),address=String(data.event.navigationAddress||'').trim(),place=[venue,address&&address!==venue?address:''].filter(Boolean).join(' · '),p=el('p',undefined,'event-details-q170 event-place-q170');p.append(eventDetailQ170('מקום:',place));out.append(p);}
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
  const options=[['Confirmed','מגיע/ה','check'],['Declined','לא מגיע/ה','cross'],['Pending','טרם החלטתי','question']];
  let selected=rsvpInitialChoiceQ171_(data.guest);
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
   const form=el('form'),choices=el('div',undefined,'choices');const question=el('h3','האם תגיעו לאירוע?','rsvp-question');choices.setAttribute('role','group');choices.setAttribute('aria-label','בחירת אישור הגעה');
   const field=el('div',undefined,'field rsvp-count-field'),label=el('label','מספר משתתפים (עד '+data.guest.invitedCount+')'),count=el('input');count.type='number';count.min='1';count.max=String(data.guest.invitedCount);count.step='1';count.inputMode='numeric';count.value=String(savedCount);count.id='rsvp-count';label.htmlFor=count.id;const stepper=el('div',undefined,'rsvp-stepper');const minus=el('button','−','rsvp-stepper-btn'),plus=el('button','+','rsvp-stepper-btn');minus.type=plus.type='button';minus.setAttribute('aria-label','הפחתת משתתף');plus.setAttribute('aria-label','הוספת משתתף');const adjust=delta=>{const current=Number(count.value)||1;count.value=String(Math.min(Number(count.max),Math.max(1,current+delta)));count.dispatchEvent(new Event('input',{bubbles:true}))};minus.onclick=()=>adjust(-1);plus.onclick=()=>adjust(1);stepper.append(plus,count,minus);field.append(label,stepper);
   const save=el('button','שליחת תשובה','save');save.type='submit';const message=el('div');message.setAttribute('aria-live','polite');
   const buttons=[];const choose=status=>{selected=status;buttons.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.status===status)));field.hidden=status!=='Confirmed';save.disabled=false;save.title='';message.replaceChildren()};
   options.forEach(([status,title,iconType])=>{const b=el('button',undefined,'choice');const icon=el('span',iconType==='check'?'✓':iconType==='cross'?'✕':'?','choice-icon');icon.setAttribute('aria-hidden','true');b.append(icon,el('span',title));b.type='button';b.dataset.status=status;b.setAttribute('aria-pressed','false');b.onclick=()=>choose(status);choices.append(b);buttons.push(b)});
   form.append(question,choices,field,save,message);area.replaceChildren(form);if(selected)choose(selected);else{field.hidden=true;save.disabled=true;save.title='יש לבחור אחת מאפשרויות ההגעה לפני שליחת התשובה'}
   form.onsubmit=async e=>{e.preventDefault();if(!selected||isClosed||saveBusy)return;const n=selected==='Confirmed'?Number(count.value):0;
    if(selected==='Confirmed'&&(!Number.isInteger(n)||n<1||n>Number(data.guest.invitedCount))){message.replaceChildren(el('p','יש להזין מספר משתתפים תקין בין 1 ל־'+data.guest.invitedCount,'error'));count.focus();return}
    saveBusy=true;save.disabled=true;save.setAttribute('aria-busy','true');save.title='';save.textContent='שולח…';buttons.forEach(b=>b.disabled=true);message.replaceChildren(loading('שולח תשובה…'));
    try{const r=await call({action:'rsvpSaveV1189A3',key,status:selected,count:n});savedCount=n||1;
     // Same-origin localhost tabs receive this signal immediately; focus refresh is a fallback.
     try{localStorage.setItem('events_rsvp_updated_v1189a4',JSON.stringify({eventId:r.eventId,guestId:r.guestId,at:Date.now()}))}catch(_){}
     data.guest.rsvpStatus=selected;data.guest.confirmedCount=n;data.guest.hasRespondedQ171=true;lastSavedStatus=selected;lastSavedNumber=n;registeredViewQ173_();
    }catch(err){if(/מועד אישור ההגעה הסתיים/.test(err.message||'')){await refreshContext(true);if(data.closed)await closedView();else message.replaceChildren(el('p',err.message,'error'));return}message.replaceChildren(el('p',err.message||'השמירה נכשלה','error'));save.disabled=false;save.textContent='שליחת תשובה';buttons.forEach(b=>b.disabled=false)}
    finally{saveBusy=false;save.setAttribute('aria-busy','false');if(contextQueued){contextQueued=false;refreshContext()}}
   };
  };
  const registeredViewQ173_=()=>{
   if(isClosed)return;const status=rsvpInitialChoiceQ171_(data.guest);if(!status){selected=null;savedCount=Number(data.guest.confirmedCount)||1;formView();return;}
   currentView='registered';selected=status;savedCount=Number(data.guest.confirmedCount)||1;
   const panel=el('section',undefined,'registered-answer-q173'),heading=el('h3','תשובתכם הרשומה במערכת','rsvp-question'),choice=el('div',undefined,'choice registered-choice-q173');choice.dataset.status=status;
   const option=options.find(([value])=>value===status),icon=el('span',status==='Confirmed'?'✓':status==='Declined'?'✕':'?','choice-icon');icon.setAttribute('aria-hidden','true');choice.append(icon,el('strong',option[1]));
   panel.append(heading,choice);if(status==='Confirmed')panel.append(el('p','מספר משתתפים: '+Number(data.guest.confirmedCount),'registered-count-q173'));
   const change=el('button','שינוי בחירה','registered-change-q173');change.type='button';change.onclick=()=>{if(!isClosed){selected=status;savedCount=Number(data.guest.confirmedCount)||1;formView();}};panel.append(change);area.replaceChildren(panel);
  };
  if(!isClosed){if(selected)registeredViewQ173_();else formView();}
  async function refreshContext(force=false){
   if(saveBusy){contextQueued=true;return}
   if(contextBusy)return;
   contextBusy=true;
   try{
    const fresh=await call({action:'rsvpContextV1189A3',key});
    const signature=deadlineSignature(fresh);
    const changed=signature!==lastDeadlineSignature;
    const previousReplyQ173=[data.guest.rsvpStatus,data.guest.confirmedCount,data.guest.hasRespondedQ171].join('|');
    data=fresh;lastDeadlineSignature=signature;
    if(fresh.closed){
     if(!isClosed){isClosed=true;stopTimer();if(clock){clock.remove();clock=null}currentView='closed';area.replaceChildren(el('h3','אישורי ההגעה נסגרו'),el('p',fresh.closedMessage||'מועד אישור ההגעה הסתיים. נא לפנות למנהל האירוע.','note'));if(fresh.contactName)area.append(el('p','איש קשר: '+fresh.contactName));if(fresh.contactPhone){const phone=displayPhone(fresh.contactPhone),p=el('p','טלפון: '),a=el('a',phone);a.href='tel:'+phone.replace(/[^+\d]/g,'');a.dir='ltr';p.append(a);area.append(p)}}
     else if(changed){area.replaceChildren(el('h3','אישורי ההגעה נסגרו'),el('p',fresh.closedMessage||'מועד אישור ההגעה הסתיים. נא לפנות למנהל האירוע.','note'));if(fresh.contactName)area.append(el('p','איש קשר: '+fresh.contactName));if(fresh.contactPhone){const phone=displayPhone(fresh.contactPhone),p=el('p','טלפון: '),a=el('a',phone);a.href='tel:'+phone.replace(/[^+\d]/g,'');a.dir='ltr';p.append(a);area.append(p)}}
    }else{
     if(isClosed){isClosed=false;selected=rsvpInitialChoiceQ171_(fresh.guest);savedCount=Number(fresh.guest.confirmedCount)||1;if(rsvpInitialChoiceQ171_(fresh.guest))registeredViewQ173_();else formView()}
     if(currentView==='registered'&&previousReplyQ173!==[fresh.guest.rsvpStatus,fresh.guest.confirmedCount,fresh.guest.hasRespondedQ171].join('|'))registeredViewQ173_();
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
