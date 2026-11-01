/* Guest-centric read-only WhatsApp control, separate from dispatch and RSVP. */
const GM_PURPOSE_Q114={invitation:'הזמנה לאירוע',rsvp_update:'תזכורת לאישור הגעה',table_update:'עדכון שולחן',thank_you:'תודה'};
const GM_STATUS_Q114={NEVER:'טרם נשלחה',PROCESSING:'בתהליך שליחה',PENDING:'ממתינה למסירה',DELIVERED:'נמסרה',READ:'נקראה',FAILED:'נכשלה',REVIEW:'דורשת בירור'};
let gmCacheQ114={key:'',ready:false,loading:false,error:'',entries:new Map(),checkedAt:'',at:0},gmSerialQ114=0,gmHistorySerialQ114=0;
function gmVisiblePurposesQ167_(){const enabled=typeof canManageTables_==='function'?canManageTables_():true;return Object.entries(GM_PURPOSE_Q114).filter(([p])=>enabled||p!=='table_update');}
function gmSyncPurposesQ166_(){
 const select=document.getElementById('guestMessagePurposeQ114');if(!select?.options)return;
 const enabled=typeof canManageTables_==='function'?canManageTables_():true;
 const choices=gmVisiblePurposesQ167_().map(([p])=>p),old=select.value;
 if([...select.options].map(o=>o.value).join('|')!==choices.join('|')){select.innerHTML=choices.map(p=>'<option value="'+p+'">'+GM_PURPOSE_Q114[p]+'</option>').join('');select.value=choices.includes(old)?old:'invitation';}
 if(!enabled&&old==='table_update'){select.value='invitation';const status=document.getElementById('guestMessageStatusQ114');if(status)status.value='';}
}
function gmContextQ114_(){gmSyncPurposesQ166_();return {token:state.session?.token,eventId:String(state.activeEventId||''),purpose:document.getElementById('guestMessagePurposeQ114')?.value||'invitation'};}
function gmKeyQ114_(c){return JSON.stringify([c.token,c.eventId,c.purpose]);}
function gmAllowedQ114_(){return ['Admin','EventManager'].includes(state.session?.role);}
function gmReadyQ114_(){return gmAllowedQ114_()&&gmCacheQ114.ready&&gmCacheQ114.key===gmKeyQ114_(gmContextQ114_());}
function guestMessageRecordQ114_(g){return gmReadyQ114_()?gmCacheQ114.entries.get(String(g.guestId||g.id)):null;}
function guestMessageMatchesQ114_(g){const f=document.getElementById('guestMessageStatusQ114')?.value||'';if(!f||!gmAllowedQ114_())return true;const r=guestMessageRecordQ114_(g);return !!r&&(r.status===f||f==='DELIVERED'&&r.status==='READ');}
function guestMessageCellQ114_(g){
  if(!gmAllowedQ114_())return '';
  const r=guestMessageRecordQ114_(g),label=r?GM_STATUS_Q114[r.status]||'דורשת בירור':gmCacheQ114.error?'לא ניתן לאמת':'טוען מצב…';
  const title=r?[gmReasonQ115_(r,state.session?.role==='Admin'),'לחיצה להצגת כל ההודעות'].filter(Boolean).join(' · '):'יש לרענן את נתוני ההודעות';
  return `<button type="button" class="gm-status-q114 gm-${esc(r?.status||'unavailable')}" data-guest-message-history-q114="${esc(g.guestId||g.id)}" title="${esc(title)}">${esc(label)}</button>`;
}
async function guestMessagesLoadQ114_(force=false){
  if(!gmAllowedQ114_()||!state.activeEventId)return;
  const context=gmContextQ114_(),key=gmKeyQ114_(context);
  if(gmCacheQ114.key===key&&(gmCacheQ114.loading||!force&&Date.now()-gmCacheQ114.at<60000))return;
  const serial=++gmSerialQ114;
  gmCacheQ114={key,ready:false,loading:true,error:'',entries:new Map(),checkedAt:'',at:Date.now()};
  renderGuests();
  try{
    const data=await API.request('guestMessageControlQ114',{eventId:context.eventId,purpose:context.purpose});
    if(serial!==gmSerialQ114||gmKeyQ114_(gmContextQ114_())!==key)return;
    const expected=new Set(state.guests.filter(g=>String(g.eventId)===context.eventId).map(g=>String(g.guestId||g.id)));
    if(data?.eventId!==context.eventId||data.purpose!==context.purpose||!Array.isArray(data.entries)||new Set(data.entries.map(r=>r.guestId)).size!==data.entries.length||data.entries.some(r=>!GM_STATUS_Q114[r.status]))throw Error('נתוני בקרת ההודעות אינם תקינים');
    const entries=new Map(data.entries.map(r=>[String(r.guestId),r]));
    // A stale guest snapshot must never turn a missing result into NEVER.
    if([...expected].some(id=>!entries.has(id)))throw Error('רשימת המוזמנים השתנתה; יש לרענן את הרשימה וההודעות');
    gmCacheQ114={key,ready:true,loading:false,error:'',entries,checkedAt:String(data.checkedAt||''),at:Date.now()};
  }catch(e){if(serial===gmSerialQ114&&gmKeyQ114_(gmContextQ114_())===key)gmCacheQ114={key,ready:false,loading:false,error:String(e?.message||e),entries:new Map(),checkedAt:'',at:Date.now()};}
  finally{if(serial===gmSerialQ114&&gmKeyQ114_(gmContextQ114_())===key)renderGuests();}
}
function guestMessagesRenderQ114_(baseRows){
  const panel=document.getElementById('guestMessageControlQ114');if(!panel)return;panel.hidden=!gmAllowedQ114_();if(panel.hidden)return;
  const info=document.getElementById('guestMessageNoticeQ114'),status=document.getElementById('guestMessageStatusQ114'),ready=gmReadyQ114_(),filter=status.value;
  status.disabled=!ready;
  const button=document.getElementById('guestMessageRefreshQ114');button.disabled=gmCacheQ114.loading||!state.activeEventId;button.setAttribute('aria-busy',String(gmCacheQ114.loading));button.textContent=gmCacheQ114.loading?'טוען…':'רענן מצבי הודעות';
  info.textContent=!state.activeEventId?'יש לבחור אירוע':gmCacheQ114.key!==gmKeyQ114_(gmContextQ114_())?'טוען מצבי הודעות…':gmCacheQ114.error?'לא ניתן לאמת מצבי הודעות כרגע. יש לרענן, ואם הבעיה נמשכת לפנות למנהל המערכת.'+(state.session?.role==='Admin'?' '+gmCacheQ114.error:''):gmCacheQ114.loading?'טוען מצבי הודעות…':ready?'מצבי הודעות רגילות בלבד · עודכן '+new Date(gmCacheQ114.checkedAt).toLocaleTimeString('he-IL')+' · הסיכומים לפי סינוני הרשימה, לפני סינון מצב ההודעה':'';
  const cards=[['NEVER','טרם נשלחה'],['PROCESSING','בתהליך שליחה'],['PENDING','ממתינות למסירה'],['DELIVERED','נמסרו / נקראו'],['FAILED','נכשלו'],['REVIEW','דורשות בירור']];
  document.getElementById('guestMessageCardsQ114').innerHTML=cards.map(([key,label])=>{const n=ready?baseRows.filter(g=>{const r=guestMessageRecordQ114_(g);return r&&(r.status===key||key==='DELIVERED'&&r.status==='READ');}).length:'—';return `<button type="button" class="gm-summary-q114 gm-${key} ${filter===key?'active':''}" data-gm-filter-q114="${key}" ${ready&&n>0?'':'disabled'} aria-pressed="${filter===key}"><span>${label}</span><strong>${n}</strong></button>`;}).join('');
  const heading=document.querySelector('#page-guests th[data-col="messageState"]');if(heading)heading.textContent=({invitation:'מצב הזמנה',rsvp_update:'מצב תזכורת',table_update:'מצב עדכון שולחן',thank_you:'מצב הודעת תודה'})[gmContextQ114_().purpose]||'מצב הודעה';
  if(currentPage==='guests'&&state.activeEventId)void guestMessagesLoadQ114_();
}
function gmOutcomeQ115_(r){
  const status=String(r?.status||''),raw=String(r?.errorMessage||'');
  if(r&&Object.prototype.hasOwnProperty.call(r,'httpStatus')&&['READ','DELIVERED','META_ACCEPTED','SENT'].includes(status)&&(!r.wamid||Number(r.httpStatus)<200||Number(r.httpStatus)>=300))return {label:'נדרשת בדיקה',text:'התיעוד של הניסיון אינו שלם. מנהל המערכת צריך לאמת את התוצאה לפני שליחה נוספת.'};
  if(status==='API_FAILED'&&Object.prototype.hasOwnProperty.call(r,'httpStatus')&&!(Number(r.httpStatus)>=400&&Number(r.httpStatus)<500))return {label:'נדרשת בדיקה',text:'לא התקבלה תוצאת שליחה ודאית לניסיון הזה. אין לשלוח שוב לפני בדיקת מנהל המערכת.'};
  if(status==='READ')return {label:'נקראה',text:'התקבל אישור קריאה של ההודעה.'};
  if(status==='DELIVERED')return {label:'נמסרה',text:'ההודעה הגיעה ל־WhatsApp של הנמען.'};
  if(['META_ACCEPTED','SENT','PENDING'].includes(status))return {label:'ממתינה למסירה',text:'הבקשה לשליחה התקבלה, אך עדיין אין אישור שההודעה הגיעה לנמען.'};
  if(status==='PROCESSING')return {label:'בתהליך שליחה',text:'ההודעה נמצאת בטיפול של מסע שליחה פעיל.'};
  if(status==='NEVER')return {label:'טרם נשלחה',text:'לא מתועדת הודעה ששוגרה לנמען מסוג זה.'};
  if(status==='PRE_SEND_FAILED')return {label:'לא נשלחה',text:'הניסיון נעצר במערכת לפני שיגור ההודעה. בניסיון הזה לא נשלחה הודעה לנמען.'};
  if(['UNKNOWN','REVIEW'].includes(status))return {label:'נדרשת בדיקה',text:'אין תוצאה מאומתת לכל ניסיונות השליחה. יש לפנות למנהל המערכת לפני ניסיון נוסף.'};
  if(['API_FAILED','FAILED'].includes(status)){
    if(/outside.*window|24.?hour|re.engagement/i.test(raw))return {label:'לא נמסרה',text:'ההודעה לא נמסרה בגלל מגבלת זמן של WhatsApp. יש לפנות למנהל המערכת לבדיקת אפשרות ההמשך.'};
    if(/rate limit/i.test(raw))return {label:'לא נמסרה',text:'WhatsApp הגבילה את קצב השליחה. יש לפנות למנהל המערכת לפני ניסיון נוסף.'};
    if(/maintain healthy ecosystem engagement/i.test(raw))return {label:'לא נמסרה',text:'WhatsApp לא מסרה את ההודעה לנמען. מנהל המערכת צריך לבדוק את סיבת הדחייה לפני ניסיון נוסף.'};
    return {label:'לא נמסרה',text:'נרשם כשל בשליחת ההודעה. יש לפנות למנהל המערכת לבדיקת הסיבה לפני ניסיון נוסף.'};
  }
  return {label:'נדרשת בדיקה',text:'לא ניתן להציג תוצאה מאומתת לניסיון הזה. יש לפנות למנהל המערכת.'};
}
function gmReasonQ115_(r,admin=false){
  if(!r)return 'יש לרענן את מצבי ההודעות';
  if(admin)return r.reason||gmOutcomeQ115_(r).text;
  if(['READ','DELIVERED'].includes(r.status)&&r.reason)return 'קיים אישור מסירה קודם. ניסיון נוסף אינו מבטל את האישור.';
  if(r.held||r.status==='REVIEW')return 'נדרשת בדיקת מנהל המערכת לפני שליחה נוספת.';
  return gmOutcomeQ115_(r).text;
}
function gmHistoryHtmlQ115_(guest,data,admin){
  const held=Object.values(data.byPurpose||{}).some(r=>r?.held);
  const summaries=gmVisiblePurposesQ167_().map(([purpose,label])=>{
    const r=data.byPurpose?.[purpose],outcome=gmOutcomeQ115_(r);
    return `<li><span>${esc(label)}</span><strong class="gm-${esc(r?.status||'REVIEW')}">${esc(outcome.label)}</strong>${held&&r?.held&&r.status==='REVIEW'?'':`<small>${esc(gmReasonQ115_(r,admin))}</small>`}</li>`;
  }).join('');
  const entry=r=>{
    const o=gmOutcomeQ115_(r),technical=admin?`<details class="gm-tech-q115"><summary>פרטים טכניים למנהל מערכת</summary><dl><dt>תבנית מקור</dt><dd dir="ltr">${esc(r.templateName||'—')}</dd><dt>קוד שגיאה</dt><dd dir="ltr">${esc(r.errorCode||'—')}</dd><dt>HTTP</dt><dd>${esc(String(r.httpStatus||'—'))}</dd></dl>${r.errorMessage?`<pre dir="auto">${esc(r.errorMessage)}</pre>`:''}</details>`:'';
    return `<article class="gm-history-entry-q115"><div class="gm-history-entry-head-q115"><strong>${esc(GM_PURPOSE_Q114[r.purpose]||'הודעה קודמת')}</strong><span class="gm-status-q114 gm-${esc(r.status||'REVIEW')}">${esc(o.label)}</span></div><time>${esc(formatWaLogDateTimeZ56B1_(r.createdAt))}</time><p>${esc(o.text)}</p>${technical}</article>`;
  };
  const history=Array.isArray(data.history)?data.history:[],recent=history.slice(0,5),older=history.slice(5);
  return `<h2>הודעות WhatsApp · ${esc(guest.name)}</h2><p class="gm-history-intro-q115">מצב ההודעות של המוזמן, לפי סוג ההודעה.</p>${held?'<aside class="gm-history-warning-q115" role="note"><strong>יש תיעוד קודם שדורש בדיקה</strong><p>אישורי מסירה שכבר התקבלו נשמרים. לפני שליחה נוספת יש לפנות למנהל המערכת לבדיקת הניסיונות שלא הושלמו.</p></aside>':''}<ul class="gm-history-summary-q114">${summaries}</ul><h3>ניסיונות השליחה האחרונים</h3><p class="muted">שליחות בדיקה אינן מוצגות כאן. ניסיון מאוחר שנכשל אינו מבטל אישור מסירה קודם.</p><div class="gm-history-list-q114">${recent.map(entry).join('')||'<p>לא תועדו עדיין ניסיונות שליחה רגילים למוזמן הזה.</p>'}${older.length?`<details class="gm-older-q115"><summary>הצג ${older.length} ניסיונות קודמים נוספים</summary>${older.map(entry).join('')}</details>`:''}</div><div class="actions"><button type="button" class="secondary" onclick="closeModal()">סגור</button></div>`;
}

async function guestMessageHistoryQ114_(guestId){
  if(!gmAllowedQ114_())return;
  const c=gmContextQ114_(),serial=++gmHistorySerialQ114,g=state.guests.find(g=>String(g.eventId)===c.eventId&&String(g.guestId||g.id)===String(guestId));if(!g)return;
  modal(`<section id="gmHistoryQ114"><h2>הודעות WhatsApp · ${esc(g.name)}</h2><p role="status">טוען היסטוריית הודעות…</p></section>`);
  try{
    const d=await API.request('guestMessageHistoryQ114',{eventId:c.eventId,purpose:c.purpose,guestId});
    if(serial!==gmHistorySerialQ114||state.session?.token!==c.token||String(state.activeEventId)!==c.eventId||!document.getElementById('gmHistoryQ114'))return;
    if(d?.eventId!==c.eventId||!Array.isArray(d.history))throw Error('היסטוריית ההודעות אינה תקינה');
    document.getElementById('gmHistoryQ114').innerHTML=gmHistoryHtmlQ115_(g,d,state.session?.role==='Admin');
  }catch(e){if(serial===gmHistorySerialQ114&&state.session?.token===c.token&&String(state.activeEventId)===c.eventId&&document.getElementById('gmHistoryQ114'))document.getElementById('gmHistoryQ114').innerHTML='<h2>הודעות WhatsApp</h2><p class="error">'+esc(state.session?.role==='Admin'?(e?.message||e):'לא ניתן לטעון את היסטוריית ההודעות כרגע. יש לסגור ולנסות שוב. אם הבעיה נמשכת, יש לפנות למנהל המערכת.')+'</p><button type="button" class="secondary" onclick="closeModal()">סגור</button>';}
}
document.addEventListener('change',e=>{
  if(e.target.id==='guestMessagePurposeQ114'){document.getElementById('guestMessageStatusQ114').value='';renderGuests();}
  if(e.target.id==='guestMessageStatusQ114')renderGuests();
});
document.addEventListener('click',e=>{
  if(e.target.closest('#guestMessageRefreshQ114'))void guestMessagesLoadQ114_(true);
  const card=e.target.closest('[data-gm-filter-q114]');if(card&&!card.disabled){const s=document.getElementById('guestMessageStatusQ114');s.value=s.value===card.dataset.gmFilterQ114?'':card.dataset.gmFilterQ114;renderGuests();}
  const history=e.target.closest('[data-guest-message-history-q114]');if(history)void guestMessageHistoryQ114_(history.dataset.guestMessageHistoryQ114);
  if(e.target.closest('.wa-bulk-close-z22')&&currentPage==='guests')setTimeout(()=>void guestMessagesLoadQ114_(true),0);
});
