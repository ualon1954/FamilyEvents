let dashQ123={key:'',loading:false,data:{},at:'',purpose:'invitation'},dashSerialQ123=0,dashRefreshingQ124=false;
function dashboardKeyQ123_(){return JSON.stringify([state.session?.token,String(state.activeEventId||''),dashQ123.purpose]);}
function dashboardMetricsQ123_(guests,seating){
 const statuses=['Confirmed','Pending','Declined'];
 const rsvp=statuses.map(s=>guests.filter(g=>String(g.rsvpStatus||g.status||'Pending').toLowerCase()===s.toLowerCase()).length);
 const eligible=guests.filter(g=>Number(g.confirmedCount)>0),by=new Map((seating?.guests||[]).map(g=>[String(g.guestId),g]));
 const seat=s=>eligible.filter(g=>(by.get(String(g.guestId||g.id))?.seatingStatus||'UNASSIGNED')===s).length;
 return {records:guests.length,people:guests.reduce((n,g)=>n+(Number(g.invitedCount||g.partySize)||1),0),confirmedPeople:guests.reduce((n,g)=>n+(Number(g.confirmedCount)||0),0),rsvp,full:seat('FULL'),partial:seat('PARTIAL'),unassigned:seat('UNASSIGNED'),remaining:eligible.reduce((n,g)=>n+Math.max(0,Number(g.confirmedCount)-(Number(by.get(String(g.guestId||g.id))?.assignedCount)||0)),0),free:(seating?.tables||[]).reduce((n,t)=>n+Math.max(0,Number(t.free)||0),0)};
}
function dashboardRenderQ123_(){
 const root=document.getElementById('managerDashboardQ123'),old=document.getElementById('legacyDashboardQ123');if(!root)return;
 const admin=state.session?.role==='Admin',manager=state.session?.role==='EventManager',enabled=admin||manager;root.hidden=!enabled;old.hidden=enabled;if(!enabled)return;
 const overview=admin?dashboardAdminOverviewQ154_():'';
 const ev=activeEvent();if(!ev){root.innerHTML=overview+'<section class="dash-admin-empty-q154"><h2>בקרת אירוע</h2><p>בחר אירוע בסרגל העליון או ברשימה כדי לראות מוזמנים, הודעות, הושבה ועלויות.</p></section>';return;}
 const gs=state.guests.filter(g=>String(g.eventId)===String(state.activeEventId)),valid=dashQ123.key===dashboardKeyQ123_(),d=valid?dashQ123.data:{},st=d.seating;
 const m=dashboardMetricsQ123_(gs,st),seatEnabled=canManageTables_(),msg=d.messages;
 const counts={};if(msg)msg.entries.forEach(r=>{const s=r.status==='READ'?'DELIVERED':r.status;counts[s]=(counts[s]||0)+1;});
 const card=(label,value,kind,valueFilter='',tone='')=>{
  const zero=value!==null&&Number(String(value).replace(/[₪,\s]/g,''))===0;
  const color=tone||({Confirmed:'green',Declined:'red',Pending:'amber',FULL:'green',PARTIAL:'amber',UNASSIGNED:'red',NEVER:'slate',PROCESSING:'blue',PENDING:'amber',DELIVERED:'green',FAILED:'red',REVIEW:'amber'})[valueFilter]||(kind==='costs'?'violet':'blue');
  return '<button class="dash-card-q123 '+color+(zero?' zero-q124':'')+'" data-dash-kind="'+kind+'" data-dash-value="'+esc(valueFilter)+'" '+(value===null||zero?'disabled':'')+'><span>'+label+'</span><strong>'+(value===null?'—':esc(value))+'</strong><small>'+(value===null?'נתון לא זמין':zero?'אין פריטים להצגה':'לצפייה בפירוט ←')+'</small></button>';
 };
 const section=(title,body)=>'<section class="dash-section-q123"><div class="dash-section-heading-q130"><h2>'+title+'</h2>'+(title==='מוזמנים ואישורי הגעה'?'<p class="muted">מוני אישורי הגעה הם רשומות; מספר אנשים מוצג בנפרד.</p>':'')+'</div><div class="dash-grid-q123">'+body+'</div></section>';
 const date=String(ev.date||ev.eventDate||'').slice(0,10),today=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Jerusalem',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date()),days=/^\d{4}-\d{2}-\d{2}$/.test(date)?Math.round((Date.parse(date)-Date.parse(today))/86400000):null;
 const problems=[];
 if(msg&&counts.FAILED)problems.push(card('הודעות שנכשלו',counts.FAILED,'message','FAILED','alert'));
 if(msg&&counts.REVIEW)problems.push(card('הודעות דורשות בירור',counts.REVIEW,'message','REVIEW','alert'));
 if(st&&m.remaining)problems.push(card('אנשים שנותרו לשיבוץ',m.remaining,'seat','REMAINING','alert'));
 const recover=d.recovery?.items?.filter(x=>String(x.eventId)===String(state.activeEventId))||[];
 if(recover.length)problems.push(card('מסעות שליחה פתוחים',recover.length,'recovery','','alert'));
 root.innerHTML=overview+'<header class="dash-head-q123"><div><p class="muted">'+(admin?'בקרת האירוע הנבחר':'מרכז ניהול האירוע')+'</p><h1>'+esc(ev.name||'האירוע שלי')+'</h1><p>'+esc(date?formatDateHE_(date):'טרם נקבע תאריך')+(days===null?'':days>0?' · עוד '+days+' ימים':days===0?' · האירוע היום':' · האירוע התקיים')+'</p></div><div class="dash-refresh-group-q130"><span class="dash-updated-q124" role="status">'+(valid&&dashQ123.at?refreshStampQ128_(dashQ123.at):'נתוני הבקרה טרם נטענו')+'</span><button class="dash-refresh-q124" data-dash-kind="refresh" aria-label="רענון נתונים" title="רענון נתונים" aria-busy="'+(dashQ123.loading||dashRefreshingQ124)+'" '+(dashQ123.loading||dashRefreshingQ124?'disabled':'')+'>'+refreshButtonContentQ130_(dashQ123.loading||dashRefreshingQ124)+'</button></div></header>'+
 '<nav class="dash-actions-q123" aria-label="פעולות מהירות">'+[['guests','רשימת מוזמנים'],...(seatEnabled?[['tables','ניהול שולחנות']]:[]),['edit','עריכת האירוע'],['log','יומן WhatsApp']].map(([k,l])=>'<button data-dash-kind="'+k+'">'+l+'</button>').join('')+'</nav>'+
 section('מוזמנים ואישורי הגעה',card('רשומות מוזמנים',m.records,'guests')+card('אישרו הגעה',m.rsvp[0],'rsvp','Confirmed')+card('ממתינים לתשובה',m.rsvp[1],'rsvp','Pending')+card('לא מגיעים',m.rsvp[2],'rsvp','Declined'))+
 '<p class="dash-people-q123">סה״כ מוזמנים: <b>'+m.people+' אנשים</b> · אישרו: <b>'+m.confirmedPeople+' אנשים</b></p>'+
 '<section class="dash-section-q123"><div class="dash-message-head-q123"><h2>הודעות WhatsApp</h2><label>סוג הודעה <select id="dashPurposeQ123">'+Object.entries(GM_PURPOSE_Q114).map(([k,l])=>'<option value="'+k+'" '+(dashQ123.purpose===k?'selected':'')+'>'+l+'</option>').join('')+'</select></label></div><div class="dash-grid-q123">'+[['NEVER','טרם נשלחה'],['PROCESSING','בתהליך שליחה'],['PENDING','ממתינות למסירה'],['DELIVERED','נמסרו / נקראו'],['FAILED','נכשלו'],['REVIEW','דורשות בירור']].map(([k,l])=>card(l,msg?(counts[k]||0):null,'message',k)).join('')+'</div>'+(!msg?'<p class="muted">'+(dashQ123.loading?'טוען מצבי הודעות…':'מצבי ההודעות אינם זמינים. יש לרענן.')+'</p>':'')+'</section>'+
 (seatEnabled?section('שיבוץ לשולחנות',card('שובצו במלואם',st?m.full:null,'seat','FULL')+card('שובצו חלקית',st?m.partial:null,'seat','PARTIAL')+card('טרם שובצו',st?m.unassigned:null,'seat','UNASSIGNED')+card('מקומות פנויים',st?m.free:null,'tables')):'')+
 section('עלויות האירוע',card('עלויות בפועל',d.costs?Number(d.costs.summary.actualIls).toLocaleString('he-IL')+' ₪':null,'costs')+card('עלויות צפויות',d.costs?Number(d.costs.summary.expectedIls).toLocaleString('he-IL')+' ₪':null,'costs')+card('אומדן WhatsApp לפי היומן',d.costs?Number(d.costs.summary.whatsappIls).toLocaleString('he-IL')+' ₪':null,'costs'))+
 '<section class="dash-section-q123"><h2>דורש טיפול</h2><div class="dash-grid-q123">'+problems.join('')+'</div>'+(!problems.length?'<p>'+(dashQ123.loading?'בודק נתוני בקרה…':d.messages&&(!seatEnabled||d.seating)&&d.recovery&&!d.recovery.unavailable?'לא נמצאו פריטים הדורשים טיפול לפי הנתונים שנטענו.':'חלק מנתוני הבקרה אינם זמינים. יש לרענן לפני הסקת מסקנות.')+'</p>':'')+'</section>';
}
async function dashboardLoadQ123_(force=false){
 if(!['Admin','EventManager'].includes(state.session?.role)||!state.activeEventId){dashboardRenderQ123_();return;}
 const key=dashboardKeyQ123_();if(dashQ123.key===key&&(dashQ123.loading||!force&&Date.now()-Date.parse(dashQ123.at||0)<60000)){dashboardRenderQ123_();return;}
 const serial=++dashSerialQ123,eid=String(state.activeEventId),purpose=dashQ123.purpose;
 dashQ123={key,loading:true,data:{},at:'',purpose};dashboardRenderQ123_();
 const requests=[['messages','guestMessageControlQ114',{eventId:eid,purpose}],['costs','eventCostsContextZ58',{eventId:eid}],['recovery','listWhatsAppProductionRecoveryQ110',{}],...(canManageTables_()?[['seating','seatingStateV169',{eventId:eid}]]:[])];
 await Promise.allSettled(requests.map(async([name,action,args])=>{try{const r=await API.request(action,args);if(serial!==dashSerialQ123||key!==dashboardKeyQ123_())return;
 if(name==='messages'&&(r.eventId!==eid||r.purpose!==purpose||!Array.isArray(r.entries)||new Set(r.entries.map(x=>String(x.guestId))).size!==r.entries.length||r.entries.some(x=>!GM_STATUS_Q114[x.status])||state.guests.filter(g=>String(g.eventId)===eid).some(g=>!r.entries.some(x=>String(x.guestId)===String(g.guestId||g.id)))))throw Error('invalid messages');
 if(name==='seating'&&(String(r.eventId)!==eid||!Array.isArray(r.guests)||!Array.isArray(r.tables)))throw Error('invalid seating');
 if(name==='costs'&&(String(r.selectedEventId)!==eid||!r.summary||['actualIls','expectedIls','whatsappIls'].some(k=>!Number.isFinite(Number(r.summary[k])))))throw Error('invalid costs');
 if(name==='recovery'&&!Array.isArray(r.items))throw Error('invalid recovery');
 dashQ123.data[name]=r;dashboardRenderQ123_();}catch(e){/* unavailable is displayed as unknown, never zero */}}));
 if(serial===dashSerialQ123&&key===dashboardKeyQ123_()){dashQ123.loading=false;dashQ123.at=new Date().toISOString();dashboardRenderQ123_();}
}
async function dashboardNavigateQ123_(kind,value){
 if(!['Admin','EventManager'].includes(state.session?.role)||!activeEvent())return;
 if(kind==='send')return;
 if(kind==='refresh'){if(dashRefreshingQ124||dashQ123.loading)return;dashRefreshingQ124=true;dashboardRenderQ123_();try{await refreshGuestsAfterRsvpV1189A4_(true);await dashboardLoadQ123_(true);}finally{dashRefreshingQ124=false;dashboardRenderQ123_();}return;}
 if(kind==='edit')return eventForm(activeEvent());
 if(kind==='recovery')return state.session?.role==='Admin'?showPage('whatsappMonitor'):waOfferInterruptedQ22_(true);
 if(kind==='costs'||kind==='log'||kind==='tables')return showPage({costs:'eventCosts',log:'whatsappLog',tables:'seating'}[kind]);
 const ids=['guestSearch','sideFilter','groupFilter','statusFilter','guestSeatingFilterV174','guestTableFilterV174','guestSendFilterA19P2F6','guestMessageStatusQ114'];ids.forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});
 if(kind==='rsvp'){const actual=state.guests.find(g=>String(g.eventId)===String(state.activeEventId)&&String(g.rsvpStatus||g.status||'Pending').toLowerCase()===value.toLowerCase());document.getElementById('statusFilter').value=actual?.rsvpStatus||actual?.status||value;}
 if(kind==='seat'){if(dashQ123.data.seating&&dashQ123.key===dashboardKeyQ123_())state.seating=dashQ123.data.seating;document.getElementById('guestSeatingFilterV174').value=value;}
 if(kind==='message'){document.getElementById('guestMessagePurposeQ114').value=dashQ123.purpose;document.getElementById('guestMessageStatusQ114').value=value;}
 showPage('guests');renderGuests();

}
document.addEventListener('click',e=>{const b=e.target.closest?.('#managerDashboardQ123 [data-dash-kind]');if(b&&!b.disabled)void dashboardNavigateQ123_(b.dataset.dashKind,b.dataset.dashValue||'');});
document.addEventListener('change',e=>{if(e.target.id==='dashPurposeQ123'){dashQ123.purpose=e.target.value;void dashboardLoadQ123_(true);}});
