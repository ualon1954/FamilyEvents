/* V1.1.90A19P2F14Z58D5D55Z41FIX67Q60 */
// Only use a candidate returned by the current, event-scoped inspection.
function waQuarantineCandidateFromInspectionQ9_(result,eventId){
  const c=result&&result.quarantineCandidate;
  if(!result||result.diagnosticVersion!=='FIX67Q9'||!result.blocked||result.detailsRestricted||
     result.requiresManualReview||Number(result.pendingCount)!==1||Number(result.pendingPropertyCount)!==1||
     !c||String(c.eventId)!==String(eventId)||c.itemCount!==20||
     !/^FIX64_[a-f0-9]{20}$/i.test(String(c.batchId||''))||
     !/^[0-9a-f]{8}$/.test(String(c.expectedMarkerChecksum||''))||
     !Array.isArray(result.keys)||result.keys.length!==1||result.keys[0]!=='WA_FIX64_PENDING_'+c.batchId)return null;
  return {eventId:String(eventId),batchId:c.batchId,itemCount:20,createdAt:String(c.createdAt||''),expectedMarkerChecksum:c.expectedMarkerChecksum};
}
function waPartialCloseFromInspectionQ15_(result,eventId){
  const c=result&&result.partialTestCloseCandidateQ15;
  if(!result||result.diagnosticVersion!=='FIX67Q9'||!result.blocked||result.detailsRestricted||result.requiresManualReview||
     result.pendingCount!==1||result.pendingPropertyCount!==1||!c||c.eventId!==String(eventId)||
     c.accepted!==14||c.unknown!==1||c.prepared!==5||!/^FIX64_[a-f0-9]{20}$/i.test(String(c.batchId||''))||
     !/^[0-9a-f]{8}$/.test(String(c.expectedMarkerChecksum||''))||!/^[0-9a-f]{8}$/.test(String(c.expectedJournalChecksum||''))||
     !Array.isArray(result.keys)||result.keys.length!==1||result.keys[0]!=='WA_FIX64_PENDING_'+c.batchId)return null;
  return {...c,eventId:String(eventId)};
}
// Q10: preload read-only dispatch settings while the TEST screen loads.
// Resolve failures as data to avoid an unhandled rejection on an idle screen.
function waLoadTestDispatchSettingsQ10_(){
  const started=performance.now();
  return Promise.resolve().then(()=>API.request('getWhatsAppDispatchSettingsFIX67',{})).then(settings=>{
    const n=Number(settings?.batchSize);
    if(!Number.isSafeInteger(n)||n<1||n>50)throw new Error('הגדרת גודל אצווה אינה תקינה');
    return {settings,loadMs:performance.now()-started};
  }).catch(error=>({error,loadMs:performance.now()-started}));
}
function waPreparationRowsQ10_(samples){
  const labels={inputValidationMs:'בדיקות קלט',dispatchSettingsMs:'הגדרות אצווה בשרת',eventAuthorizationMs:'הרשאת אירוע',pendingPreflightMs:'בדיקת התאוששות מוקדמת',deliveryWorkerSetupMs:'בדיקת עובד עדכוני מסירה',templateAndRecipientMs:'טעינת תבנית ואימות מספר',imageValidationMs:'בדיקת תמונת האירוע',guestDataMs:'טעינת מוזמנים ואימות שיוך לאירוע',sharedContextMs:'נתוני אירוע והגדרות משותפות',metaDefinitionMs:'חיבור WhatsApp והגדרת תבנית Meta',templateMappingMs:'טעינת מיפוי התבנית',rsvpKeysMs:'טעינת ויצירת מפתחות RSVP',progressSetupMs:'הכנת דיווח התקדמות',recipientPayloadsMs:'בניית בקשות לכל הנמענים',reservationMs:'שמירת אצווה ובדיקות תחת נעילה',firstDispatchMarkerMs:'שמירת מצב לפני הפנייה הראשונה'};
  const measured=samples.filter(s=>s.preparation&&typeof s.preparation==='object');
  if(!measured.length)return '';
  return '<dt><strong>פירוט ההכנה — שלבים נפרדים</strong></dt><dd></dd>'+Object.entries(labels).map(([key,label])=>{
    const values=measured.map(s=>s.preparation[key]).filter(v=>typeof v==='number'&&Number.isFinite(v)&&v>=0);
    return values.length?'<dt>'+esc(label)+'</dt><dd>'+waFormatElapsedF14V_(values.reduce((a,b)=>a+b,0))+'</dd>':'';
  }).join('');
}

// Q16: groups of fetchAll calls, not individual message delivery times.
function waChunkTimingRowsQ16_(samples){
  const measured=samples.filter(s=>Array.isArray(s.chunksQ16)&&s.chunksQ16.length);
  if(!measured.length)return '';
  const groups=measured.flatMap(s=>s.chunksQ16);
  const sum=k=>groups.reduce((v,g)=>v+Math.max(0,Number(g[k])||0),0);
  const outcomes={META_RETURNED:'התקבלה תשובה',NETWORK_OUTCOME_UNKNOWN:'כשל תקשורת — לא ידוע',UNKNOWN_RESPONSE:'תשובה לא ודאית',REJECTED_RESPONSE:'דחייה',PARTIAL_RESPONSE:'תשובה חלקית',UNMAPPABLE_RESPONSE:'תשובה לא ניתנת לשיוך',PRE_MARKER_FAILED:'כשל שמירה לפני פנייה',POST_MARKER_FAILED:'כשל שמירה לאחר פנייה',NOT_DISPATCHED:'לא בוצעה פנייה'};
  let html='<dt><strong>פירוט פניות ושמירת התאוששות</strong></dt><dd></dd>'+
    [['metaMs','המתנה לתשובות Meta בלבד'],['preMarkerMs','שמירת מצב לפני הפניות'],['postMarkerMs','שמירת תוצאות אחרי הפניות'],['responseHandlingMs','עיבוד תשובות'],['otherMs','דיווח התקדמות ופעולות נוספות']].map(([k,label])=>'<dt>'+label+'</dt><dd>'+waFormatElapsedF14V_(sum(k))+'</dd>').join('');
  measured.forEach((s,index)=>{
    html+='<dt>מנה '+(index+1)+' — קבוצות פניות</dt><dd><div style="overflow-x:auto"><table><thead><tr><th>הודעות</th><th>שמירה לפני</th><th>פנייה ל־Meta</th><th>שמירה אחרי</th><th>עיבוד ואחר</th><th>תחילת הפנייה במנה</th><th>סיום הפנייה במנה</th><th>מצב</th></tr></thead><tbody>'+
      s.chunksQ16.map(g=>'<tr><td>'+esc(String((Number(s.campaignOffsetQ16)||0)+Number(g.from)))+'–'+esc(String((Number(s.campaignOffsetQ16)||0)+Number(g.to)))+'</td>'+['preMarkerMs','metaMs','postMarkerMs'].map(k=>'<td>'+waFormatElapsedF14V_(Number(g[k])||0)+'</td>').join('')+'<td>'+waFormatElapsedF14V_((Number(g.responseHandlingMs)||0)+(Number(g.otherMs)||0))+'</td><td>'+(g.metaStartedOffsetMs===null?'לא התחילה':waFormatElapsedF14V_(Number(g.metaStartedOffsetMs)||0))+'</td><td>'+(g.metaFinishedOffsetMs===null?'לא התקבלה תשובה':waFormatElapsedF14V_(Number(g.metaFinishedOffsetMs)||0))+'</td><td>'+esc(outcomes[g.outcome]||'לא ידוע')+'</td></tr>').join('')+'</tbody></table></div></dd>';
  });
  return html+'<dt colspan="2">הזמנים בטבלה נמדדים מתחילת הטיפול בכל מנה בשרת. קבוצת פניות יכולה לכלול כמה הודעות; אלה אינם זמני מסירה לטלפון. השמירה הראשונה נכללת גם בשלב ההכנה — אין לסכום עם הפירוט הכללי.</dt><dd></dd>';
}

function waRsvpRowsQ11_(samples){
  const measured=samples.map(s=>s.rsvp).filter(r=>r&&typeof r==='object'&&r.applicable!==false);if(!measured.length)return '';
  const labels={selected:'נמענים שנבחרו',existingAtLookup:'מפתחות קיימים בקריאה הראשונית',created:'מפתחות חדשים שנוצרו'};
  const sum=key=>measured.reduce((n,r)=>n+(Number.isFinite(r[key])?r[key]:0),0);
  return '<dt><strong>פירוט מפתחות RSVP</strong></dt><dd></dd>'+Object.entries(labels).map(([key,label])=>'<dt>'+esc(label)+'</dt><dd>'+sum(key)+'</dd>').join('')+
    Object.entries({lockWaitMs:'המתנה לנעילת RSVP',sheetReadMs:'בדיקת גיליון וקריאת מפתחות תחת נעילה',keyGenerationMs:'יצירת מפתחות בזיכרון',writeVerifyMs:'כתיבת מפתחות ואימות קריאה'}).map(([key,label])=>'<dt>'+esc(label)+'</dt><dd>'+waFormatElapsedF14V_(sum(key))+'</dd>').join('');
}

function waMediaRowsQ12_(samples){
  const measured=samples.map(s=>s.media).filter(r=>r&&typeof r==='object');if(!measured.length)return '';
  const sum=key=>measured.reduce((n,r)=>n+(Number.isFinite(r[key])?r[key]:0),0);
  return '<dt><strong>פירוט הכנת התמונה</strong></dt><dd></dd><dt>אצוות עם תמונה מהמטמון</dt><dd>'+measured.filter(r=>r.source==='cache'||r.source==='saved_reference').length+'</dd><dt>אצוות עם העלאת תמונה</dt><dd>'+measured.filter(r=>r.source==='upload').length+'</dd>'+
    Object.entries({imageLookupMs:'בדיקת התמונה לפי אירוע ותבנית',cacheLookupMs:'בדיקת מטמון המדיה',driveReadMs:'קריאת התמונה מ־Drive',uploadMs:'העלאת התמונה ל־Meta',cacheWriteMs:'שמירת מזהה התמונה במטמון'}).map(([key,label])=>'<dt>'+esc(label)+'</dt><dd>'+waFormatElapsedF14V_(sum(key))+'</dd>').join('');
}

let state={
  session:null,events:[],eventTypes:[],guests:[],tables:[],activity:[],activeEventId:null,
  guestSort:{key:"name",dir:"asc"},
  waLogSort:{key:"createdAt",dir:"desc"},
  activitySort:{key:"at",dir:"desc"},
  lookups:{sides:[],groups:[],statuses:[]},
  adminData:{users:[],roles:[],permissions:[],whatsapp:[],eventTypes:[]},
  waSendTemplatesCacheF14G:new Map(),waSendTemplateImagesF14G:new Map(),
  lookupIndex:{sidesByType:{},groupsByType:{},statuses:[],labelMap:{}},
  adminTab:"eventTypes",adminLookupEventTypeId:null,adminLookupBoundEventId:null,adminLookupManualOverride:false,guestImportPreview:null,guestImportShowAll:false,seating:null,
  waCostBaseF14:null,waCostPromiseF14:null,waCostBaseByCategoryF14:new Map(),
  serverVersion:null
};

const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
function esc(s=""){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]))}
function isTrue(v,def=false){if(v===true||v===1||String(v).toLowerCase()==="true"||String(v)==="1")return true;if(v===false||v===0||String(v).toLowerCase()==="false"||String(v)==="0")return false;return def}
function dateInputValue_(v){
  const s=String(v||"").trim();
  const m=s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m?`${m[1]}-${m[2]}-${m[3]}`:"";
}
function formatEventDateTime_(e){return formatDateHE_(e?.date)+(e?.eventTime?" · "+String(e.eventTime).slice(0,5):"");}
function formatDateHE_(v){
  const s=dateInputValue_(v);
  if(!s)return "ללא תאריך";
  const [y,m,d]=s.split("-");
  return `${d}/${m}/${y}`;
}
const CURRENT_EVENT_KEY="events_management_current_event_id";

// Z58D1: stable version handshake. Compare the project build token, not the
// deployment date prefix. A missing frontend/backend version is a loading/config
// error, never a false "version mismatch".
function versionBuildKey_(value){
  const s=String(value||"").trim();
  const m=s.match(/(?:^|[-_])V?(\d+\.\d+\.\d+A\d+P\d+F\d+Z[0-9A-Z]+)$/i);
  if(m)return m[1].toUpperCase();
  const direct=s.match(/^V?(\d+\.\d+\.\d+A\d+P\d+F\d+Z[0-9A-Z]+)$/i);
  return direct?direct[1].toUpperCase():"";
}
function frontendBuildKey_(){
  const key=versionBuildKey_(APP_VERSION?.FRONTEND_VERSION);
  if(!key)throw new Error("לא ניתן לטעון את גרסת ה-Frontend. יש לרענן את קבצי המערכת.");
  return key;
}
function assertBackendVersion_(serverVersion){
  const front=frontendBuildKey_();
  const back=versionBuildKey_(serverVersion);
  if(!back)throw new Error("השרת לא החזיר מידע גרסה תקין. אין אפשרות לאמת את גרסת המערכת.");
  if(back!==front){if(typeof waRecordClientIssueQ17_==='function')waRecordClientIssueQ17_('startup','VERSION_MISMATCH',0);throw new Error(`אי-התאמת גרסאות. Frontend: ${APP_VERSION.FRONTEND_VERSION} | Backend: ${serverVersion}`);}
  return true;
}
// Retry ONLY startup reads, once, after a separate runtime version check.
// Never relabel stale payloads or apply a partial/mixed startup snapshot.
async function loadCompatibleStartupQ18_(loadParts,probe,expectedVersion,onMismatch,onRetry){
  const expected=versionBuildKey_(expectedVersion);
  if(!expected)throw new Error('גרסת הדפדפן אינה תקינה; יש לרענן את קובצי המערכת');
  const mismatch=received=>{const e=new Error('אי-התאמת גרסאות. Frontend: '+expectedVersion+' | Backend: '+received.join(', '));e.versionMismatchQ18=true;return e;};
  const verify=parts=>{
    if(!Array.isArray(parts)||parts.length!==4||parts.some(p=>!versionBuildKey_(p?.serverVersion)))
      throw new Error('מידע הגרסה באחד מחלקי הטעינה חסר או אינו תקין; לא נטענו נתוני מערכת');
    const versions=parts.map(p=>p.serverVersion);
    if(versions.some(v=>versionBuildKey_(v)!==expected))throw mismatch(versions);
    return parts;
  };
  const first=await loadParts();
  try{return verify(first);}catch(e){if(!e.versionMismatchQ18)throw e;}
  if(onMismatch)onMismatch();
  let runtime;
  try{runtime=await probe();}catch(cause){const e=mismatch(first.map(p=>p.serverVersion));e.message+='; בדיקת גרסת השרת הנוספת נכשלה: '+String(cause?.message||cause);e.cause=cause;throw e;}
  if(!versionBuildKey_(runtime?.serverVersion))throw new Error('בדיקת גרסת השרת לא החזירה גרסה תקינה; הטעינה נעצרה');
  if(versionBuildKey_(runtime.serverVersion)!==expected)throw mismatch([runtime.serverVersion]);
  if(onRetry)onRetry();
  return verify(await loadParts());
}
let currentPage="home";

function showPage(name){
  const role=state.session?.role||"";
  if(role==="TableManager"&&name!=="seating")name="seating";
  if(role!=="Admin"&&["admin","activity","whatsappMonitor"].includes(name))name="dashboard";
  if(name==="messages"&&!['Admin','EventManager'].includes(role))name="dashboard";
  if(name==="whatsappLog"&&!['Admin','EventManager'].includes(role))name="dashboard";
  if(name==="seating"&&!canManageTables_()){
    showToast(state.activeEventId?"ניהול שולחנות אינו מופעל באירוע הנבחר":"יש לבחור אירוע קודם","error");
    name="dashboard";
  }
  currentPage=name;
  $$(".page").forEach(x=>x.classList.remove("active"));
  $("#page-"+name)?.classList.add("active");
  $$("#mainNav [data-page]").forEach(btn=>btn.classList.toggle("active",btn.dataset.page===name));
  const labels={whatsappMonitor:"מרכז ניטור WhatsApp",home:"ראשי",dashboard:"לוח בקרה",events:"אירועים",guests:"מוזמנים",seating:"ניהול שולחנות",messages:"תבניות WhatsApp",whatsappLog:"יומן WhatsApp",eventCosts:"עלויות אירוע",about:"אודות",activity:"יומן פעילות",admin:"ניהול"};
  const pageName=$("#mobilePageName"); if(pageName) pageName.textContent=labels[name]||"";
  if(name==="admin") renderAdmin();
  if(name==="messages") tplLoadA19P2();
  if(name==="whatsappLog") loadWhatsAppLogZ55_();
  if(name==="whatsappMonitor")loadWhatsAppMonitorQ17_();
  if(name==="eventCosts"){const sel=$('#eventCostsEventZ58');if(sel){sel.dataset.userSelected='false';sel.value=state.activeEventId||'';}loadEventCostsZ58_();}
  if(name==="activity") loadActivityLogZ57_();
  if(name==="seating") loadSeatingV170_();
  if(name==="guests"&&canManageTables_())loadSeatingV170_();
  if(name==="guests"&&state.activeEventId){
    // lookups are already loaded in bootstrap and patched locally after admin CRUD. 
    // Avoid a network round-trip every time the Guests page is opened.
    renderLookupFilters();
    renderGuests();
  }
  closeMobileMenu();
  window.scrollTo({top:0,behavior:"smooth"});
}
function applyRole(){
  const role=state.session?.role||'';
  $$('[data-role]').forEach(el=>el.style.display=(role===el.dataset.role?"":"none"));
  $$('[data-roles]').forEach(el=>el.style.display=String(el.dataset.roles||'').split(',').includes(role)?"":"none");
  const seatingPage=$('#page-seating');if(seatingPage)seatingPage.classList.toggle('seating-table-manager-z19',role==='TableManager');
  const seatingActions=$('#page-seating .seating-head-actions-d55z8');if(seatingActions)seatingActions.hidden=role==='TableManager';
  const tablePanel=$('#tableManagementPanelV15');if(tablePanel)tablePanel.hidden=role==='TableManager';
  // The lookup remains read-only for the dedicated TableManager role; all other roles assign from Guests.
  const lookupPanel=$('#tableManagerLookupV15');if(lookupPanel)lookupPanel.hidden=role!=='TableManager';
  const seatingTitle=$('#page-seating h1');if(seatingTitle)seatingTitle.textContent=role==='TableManager'?'שיוך שולחנות':'ניהול שולחנות';
  if(role==='TableManager'){
    $$('#mainNav [data-page]').forEach(btn=>btn.style.display=btn.dataset.page==='seating'?"":"none");
  }else{
    $$('#mainNav [data-page]').forEach(btn=>{if(!btn.dataset.role)btn.style.removeProperty('display')});
  }
  $$("#mainNav [data-page]").forEach(btn=>btn.classList.toggle("active",btn.dataset.page===currentPage));
}
function saveSession(){localStorage.setItem(SESSION_CONFIG.SESSION_KEY,JSON.stringify(state.session))}
function clearSession(){if(typeof sessionActivityResetQ31_==='function')sessionActivityResetQ31_();waCloseInterruptedQ22_();localStorage.removeItem(SESSION_CONFIG.SESSION_KEY);state.session=null;state.waCostBaseF14=null;state.waCostPromiseF14=null;state.waCostBaseByCategoryF14=new Map();state.waCostCacheGenerationFIX59_=(state.waCostCacheGenerationFIX59_||0)+1;waCostPendingByCategoryFIX59_.clear();$("#loginOverlay").classList.add("show")}
function restoreSession(){try{const s=JSON.parse(localStorage.getItem(SESSION_CONFIG.SESSION_KEY));if(s&&s.expiresAt>Date.now())state.session=s;else clearSession()}catch{clearSession()}}
function headerUserName_(){
  if(!state.session)return "";
  return state.session.role==="TableManager"&&window.matchMedia("(max-width: 850px)").matches?"מ.ש":(state.session.name||"");
}
function setUser(){
  if(!state.session)return;
  const nameEl=$("#userName");
  if(nameEl){nameEl.textContent=headerUserName_();nameEl.title=state.session.role==="TableManager"?`מנהל שולחנות · ${state.session.name||""}`:(state.session.name||"");}
  $("#userBubble").textContent=(state.session.name||"?")[0].toUpperCase();
  applyRole();
}
window.addEventListener("resize",()=>{if(state.session)setUser()});
function setTheme(t){document.body.classList.toggle("light",t==="light");localStorage.setItem(APP_CONFIG.THEME_KEY,t);const b=$("#themeBtn");if(b)b.textContent="◐";const icon=$("#loginThemeIcon"),label=$("#loginThemeLabel"),loginBtn=$("#loginThemeBtn");if(icon)icon.textContent=t==="light"?"☾":"☀";if(label)label.textContent=t==="light"?"מצב כהה":"מצב בהיר";if(loginBtn)loginBtn.setAttribute("aria-label",t==="light"?"מעבר למצב כהה":"מעבר למצב בהיר")}
function modal(html){const shell=$("#modal .modal");if(shell)shell.classList.remove("event-cost-modal-z58d2","event-cost-modal-z58d3","event-cost-modal-z58d4","event-editor-d5d25");$("#modalContent").innerHTML=html;$("#modal").classList.add("show")}
function closeModal(){$("#modal").classList.remove("show")}
function clearVersionMismatchToast_(){
  const box=$("#appToast");
  if(box && box.dataset.kind==="version-mismatch"){
    clearTimeout(showToast._timer);
    box.classList.remove("show");
    box.textContent="";
    delete box.dataset.kind;
  }
}
function showToast(message,type="success"){
  let box=$("#appToast");
  if(!box){
    box=document.createElement("div");
    box.id="appToast";
    box.className="app-toast";
    document.body.appendChild(box);
  }
  box.className=`app-toast ${type} show`;
  box.textContent=message;
  if(String(message||"").includes("אי-התאמת גרסאות")) box.dataset.kind="version-mismatch";
  else delete box.dataset.kind;
  clearTimeout(showToast._timer);
  const duration=type==="error"?10000:7000;
  showToast._timer=setTimeout(()=>box.classList.remove("show"),duration);
}
function setFormBusy(form,busy){
  if(!form)return;
  form.querySelectorAll("button,input,select,textarea").forEach(el=>{
    if(el.type!=="hidden") el.disabled=!!busy;
  });
  const submit=form.querySelector('button[type="submit"], .actions button.primary');
  if(submit){
    if(busy){submit.dataset.oldText=submit.innerHTML;submit.innerHTML='<span class="seating-spinner-v171" aria-hidden="true"></span> שומר...';}
    else if(submit.dataset.oldText){submit.innerHTML=submit.dataset.oldText;delete submit.dataset.oldText;}
  }
}

function upsertLocal_(arr,item,front=false){
  if(!item||!(item.id||item.guestId))return;
  const itemId=item.guestId||item.id;
  const i=arr.findIndex(x=>String(x.guestId||x.id)===String(itemId));
  if(i>=0) arr[i]=item;
  else if(front) arr.unshift(item);
  else arr.push(item);
}
function removeLocal_(arr,id){
  const i=arr.findIndex(x=>String(x.guestId||x.id)===String(id));
  if(i>=0) arr.splice(i,1);
}
function mutationMs_(r,started){
  return Number(r?.apiTiming?.totalMs||0)||Math.round(performance.now()-started);
}
function mutationDone_(message,r,started){
  const ms=mutationMs_(r,started);
  showToast(`${message} · ${ms}ms`,"success");
}


function waCostTextF14Z34_(e,category){
  const amount=e?.estimatedIls;
  if(amount!=null&&String(amount).trim()!==''&&Number.isFinite(Number(amount))&&Number(amount)>=0)
    return '₪'+Number(amount).toFixed(2)+(e.fxStale===true?' · שער דולר לא מעודכן':'');
  return String(category||'').toUpperCase()==='UTILITY'?'לא הוגדר תעריף Utility':'לא ניתן לחשב';
}
// Cache expires at the next 16:05 boundary, not after an arbitrary five minutes.
function waCostNextRefreshFIX59_(now=Date.now()){
  const parts=Object.fromEntries(new Intl.DateTimeFormat('en-US',{
    timeZone:'Asia/Jerusalem',year:'numeric',month:'2-digit',day:'2-digit',
    hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'
  }).formatToParts(new Date(now)).filter(p=>p.type!=='literal').map(p=>[p.type,Number(p.value)]));
  const israelDay=Date.UTC(parts.year,parts.month-1,parts.day);
  const israelHour=parts.hour+parts.minute/60+parts.second/3600;
  const nextDay=israelHour>=16+5/60?1:0;
  const targetDay=new Date(israelDay+(nextDay?86400000:0));
  // Determine the actual Israel 16:05 UTC instant, respecting daylight saving.
  const [year,month,day]=[targetDay.getUTCFullYear(),targetDay.getUTCMonth()+1,targetDay.getUTCDate()];
  let candidate=Date.UTC(year,month-1,day,13);
  for(let i=0;i<3;i++){
    const timeParts=Object.fromEntries(new Intl.DateTimeFormat('en-US',{
      timeZone:'Asia/Jerusalem',hour:'2-digit',minute:'2-digit',hourCycle:'h23'
    }).formatToParts(new Date(candidate)).filter(p=>p.type!=='literal').map(p=>[p.type,Number(p.value)]));
    const delta=16*60+5-(timeParts.hour*60+timeParts.minute);
    candidate+=delta*60000;
    if(delta===0)break;
  }
  return candidate;
}
const waCostPendingByCategoryFIX59_=new Map();
async function getWaCostEstimateCachedF14_(count=1,category='Marketing'){
  // Recipient counts must be exact nonnegative integers; never show an Infinity/NaN quote.
  const n=typeof count==='boolean'||count===null||String(count).trim()===''?NaN:Number(count);
  if(!Number.isSafeInteger(n)||n<0)throw new Error('מספר הנמענים לחישוב עלות אינו תקין');
  const cat=String(category||'Marketing').trim()||'Marketing';
  if(!(state.waCostBaseByCategoryF14 instanceof Map))state.waCostBaseByCategoryF14=new Map();
  const key=cat.toUpperCase(),now=Date.now();
  const cached=state.waCostBaseByCategoryF14.get(key);
  let b=cached&&cached.expiresAt>now?cached.estimate:null;
  if(!b){
    let pending=waCostPendingByCategoryFIX59_.get(key);
    if(!pending){
      const requestedAt=Date.now();
      const cacheGeneration=state.waCostCacheGenerationFIX59_||0;
      pending=API.request('getWhatsAppCostEstimateF14',{count:1,category:cat})
        .then(r=>{
          const rawEstimate=r?.estimate||null;
          // Never cache malformed pricing data or allow NaN/Infinity into the UI.
          const validMoney=v=>v!=null&&typeof v!=='boolean'&&String(v).trim()!==''&&Number.isFinite(Number(v))&&Number(v)>=0;
          const estimate=rawEstimate&&validMoney(rawEstimate.unitUsd)&&validMoney(rawEstimate.usdIls)?rawEstimate:null;
          if(estimate&&cacheGeneration===(state.waCostCacheGenerationFIX59_||0)){
            // A stale BOI rate is retried by the server after its five-minute
            // backoff; do not pin the stale estimate in the UI until tomorrow.
            const refreshedAt=Date.now();
            const nextDailyRefresh=waCostNextRefreshFIX59_(refreshedAt);
            // A request begun before the 16:05 boundary must never be
            // cached as the new day's quote if it completes after 16:05.
            const crossedRefresh=waCostNextRefreshFIX59_(requestedAt)<=refreshedAt;
            const expiresAt=crossedRefresh?refreshedAt
              :estimate.fxStale===true
                ?Math.min(nextDailyRefresh,refreshedAt+5*60*1000)
                :nextDailyRefresh;
            state.waCostBaseByCategoryF14.set(key,{estimate,expiresAt});
          }
          return estimate;
        });
      waCostPendingByCategoryFIX59_.set(key,pending);
      // Only remove the matching request: an old completion cannot clear a new one.
      pending.finally(()=>{if(waCostPendingByCategoryFIX59_.get(key)===pending)waCostPendingByCategoryFIX59_.delete(key);}).catch(()=>{});
    }
    b=await pending;
  }
  if(!b)return null;
  const unit=b.unitUsd==null?null:Number(b.unitUsd),fx=b.usdIls==null?null:Number(b.usdIls);
  return {...b,count:n,recipientCount:n,category:cat,estimatedUsd:unit==null?null:unit*n,estimatedIls:(unit==null||fx==null)?null:unit*n*fx};
}

const STARTUP_METRICS_KEY_F57='eventsStartupMetricsF57';
let startupMetricsRunF57=null;
function startupMetricsBeginF57(){
  if(startupMetricsRunF57)return;
  startupMetricsRunF57={started:performance.now(),steps:{},status:'running'};
}
function startupMetricsStepF57(label,elapsed,failed=false){
  if(!startupMetricsRunF57)return;
  startupMetricsRunF57.steps[label]={ms:Math.round(elapsed),failed};
}
function startupMetricsFinishF57(error){
  const run=startupMetricsRunF57;
  if(!run)return;
  startupMetricsRunF57=null;
  const nav=performance.getEntriesByType('navigation')[0];
  const entry={time:new Date().toISOString(),version:APP_VERSION.FRONTEND_VERSION,
    navigation:nav?.type||'unknown',resourceMs:Math.round(nav?.responseEnd||0),
    totalMs:Math.round(performance.now()),startupMs:Math.round(performance.now()-run.started),
    steps:run.steps,status:error?'failed':'ok',error:error?String(error.message||error).slice(0,250):''};
  try{
    const prev=JSON.parse(localStorage.getItem(STARTUP_METRICS_KEY_F57)||'[]');
    localStorage.setItem(STARTUP_METRICS_KEY_F57,JSON.stringify([entry,...(Array.isArray(prev)?prev:[])].slice(0,30)));
  }catch(e){console.warn('[STARTUP FIX58] telemetry storage unavailable',e);}
  console.info('[STARTUP FIX58]',entry);
  startupMetricsButtonF57();
}
function startupMetricsHistoryF57(){
  try{const x=JSON.parse(localStorage.getItem(STARTUP_METRICS_KEY_F57)||'[]');return Array.isArray(x)?x:[];}catch{return [];}
}
function startupMetricsButtonF57(){
  let btn=document.getElementById('startupMetricsButtonF57');
  if(!btn){btn=document.createElement('button');btn.id='startupMetricsButtonF57';btn.type='button';
    btn.style.cssText='position:fixed;bottom:12px;left:12px;z-index:2000;padding:7px 12px;border-radius:12px;border:1px solid var(--line);background:var(--card);color:var(--text);cursor:pointer;font:inherit;font-size:12px';
    btn.onclick=startupMetricsShowF57;document.body.appendChild(btn);}
  const latest=startupMetricsHistoryF57()[0];
  btn.textContent=latest?'זמן טעינה: '+(latest.totalMs/1000).toFixed(1)+' שנ׳ · פרטים':'ביצועי טעינה';
}
function startupMetricsShowF57(){
  const items=startupMetricsHistoryF57();
  let overlay=document.getElementById('startupMetricsModalF57');
  if(!overlay){overlay=document.createElement('div');overlay.id='startupMetricsModalF57';
    overlay.style.cssText='position:fixed;inset:0;z-index:20001;background:#0009;display:grid;place-items:center;padding:15px';
    overlay.addEventListener('click',e=>{if(e.target===overlay)overlay.remove();});document.body.appendChild(overlay);}
  const panel=document.createElement('div');panel.dir='rtl';panel.style.cssText='width:min(760px,95vw);max-height:85vh;overflow:auto;background:var(--card);color:var(--text);border-radius:16px;padding:20px;border:1px solid var(--line)';
  const heading=document.createElement('h2');heading.textContent='ביצועי טעינת המערכת';panel.appendChild(heading);
  const close=document.createElement('button');close.textContent='סגירה ×';close.type='button';close.onclick=()=>overlay.remove();panel.appendChild(close);
  const values=items.filter(x=>x.status==='ok').map(x=>x.totalMs).sort((a,b)=>a-b);
  const median=values.length?(values.length%2?values[(values.length-1)/2]:(values[values.length/2-1]+values[values.length/2])/2):null;
  const summary=document.createElement('p');summary.textContent=values.length?`מדידות: ${items.length} | חציון: ${(median/1000).toFixed(1)} שנ׳ | מהיר: ${(values[0]/1000).toFixed(1)} שנ׳ | איטי: ${(values.at(-1)/1000).toFixed(1)} שנ׳`:'אין מדידות מוצלחות';panel.appendChild(summary);
  const note=document.createElement('p');note.textContent='הזמנים נמדדים מתחילת טעינת הדף עד שהמערכת מוכנה. F5 ו־Ctrl+F5 עשויים להופיע שניהם כ־reload, ולכן אין אפשרות לזהות ביניהם בוודאות מתוך JavaScript.';panel.appendChild(note);
  for(const x of items){const d=document.createElement('details');d.style.cssText='border-top:1px solid var(--line);padding:8px 0';
    const sm=document.createElement('summary');sm.textContent=`${new Date(x.time).toLocaleString('he-IL')} | ${(x.totalMs/1000).toFixed(1)} שנ׳ | ${x.status==='ok'?'תקין':'שגיאה'}`;d.appendChild(sm);
    const p=document.createElement('p');p.textContent=`שלב התחברות/אתחול: ${(x.startupMs/1000).toFixed(1)} שנ׳ | תגובת מסמך: ${(x.resourceMs/1000).toFixed(1)} שנ׳`;d.appendChild(p);
    for(const [name,v] of Object.entries(x.steps||{})){const line=document.createElement('div');line.textContent=`${name}: ${(v.ms/1000).toFixed(1)} שנ׳${v.failed?' (נכשל)':''}`;d.appendChild(line);}
    if(x.error){const err=document.createElement('p');err.textContent=x.error;d.appendChild(err);}panel.appendChild(d);}
  overlay.replaceChildren(panel);
}
function startupProgressF14Z32_(done,total,label){
  const overlay=$("#startupOverlayF14Z32"),bar=$("#startupBarF14Z32"),pct=$("#startupPercentF14Z32"),txt=$("#startupTextF14Z32");
  const percent=Math.max(0,Math.min(100,Math.round((done/Math.max(1,total))*100)));
  if(overlay)overlay.hidden=false;if(bar)bar.style.width=percent+"%";if(pct)pct.textContent=percent+"%";if(txt&&label)txt.textContent=label;
}
function startupPaintF14Z32_(){return new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));}
function startupHideF14Z32_(){const overlay=$("#startupOverlayF14Z32");if(overlay)overlay.hidden=true;}
async function startExistingSessionZ58D3_(){
  document.body.classList.add('role-routing-v18');
  $('#loginOverlay').classList.remove('show');
  startupMetricsBeginF57();
  startupProgressF14Z32_(0,7,'טוען ומאמת נתוני מערכת…');
  await startupPaintF14Z32_();
  setUser();
  // Single bootstrap path: the normal authenticated API calls also carry the
  // server version. No extra GET/fetch/version endpoint is used.
  await bootstrap();
  showPage(state.session?.role==='TableManager'?'seating':'dashboard');
  document.body.classList.remove('role-routing-v18');
  await startupPaintF14Z32_();
  startupProgressF14Z32_(7,7,'המערכת מוכנה');
  await startupPaintF14Z32_();
  startupHideF14Z32_();
  startupMetricsFinishF57();
  scheduleEventImagesWarmF58_();
  void waOfferInterruptedQ22_();
}

async function bootstrap(){
  setGuestsLoadingF14Z4_(true);
  startupMetricsBeginF57();
  startupProgressF14Z32_(0,7,"טוען נתוני ליבה…");
  clearVersionMismatchToast_();
  const token=state.session?.token;
  let done=0;
  const startupStepsF56=[
    ["נתוני ליבה","bootstrapCoreParallel"],
    ["מוזמנים","bootstrapGuestsParallel"],
    ["שולחנות","bootstrapTablesParallel"],
    ["ניהול","bootstrapAdminParallel"]
  ];
  const startupCompletedF56=new Set();
  const startupTimedRequestF56=async(label,action)=>{
    const started=performance.now();
    try{
      const data=await API.request(action,{token},{timeoutMs:90000});
      startupMetricsStepF57(label,performance.now()-started);
      startupCompletedF56.add(label);
      done++;
      startupProgressF14Z32_(done,7,`${label} נטענו (${Math.round((performance.now()-started)/1000)} שניות)`);
      console.info("[STARTUP FIX56]",label,Math.round(performance.now()-started),"ms");
      return data;
    }catch(error){
      startupMetricsStepF57(label,performance.now()-started,true);
      const pending=startupStepsF56.filter(([name])=>!startupCompletedF56.has(name)).map(([name])=>name).join(", ");
      throw new Error(`טעינת ${label} נכשלה: ${error?.message||error}. שלבים שלא הושלמו: ${pending}`);
    }
  };
  // D5D12: use the existing split endpoints concurrently. This prevents the
  // startup overlay from waiting at 0% behind one large sequential bootstrap.
  const [core,guests,tables,admin]=await loadCompatibleStartupQ18_(
    ()=>Promise.all(startupStepsF56.map(([label,action])=>startupTimedRequestF56(label,action))),
    ()=>API.request('getRuntimeVersionQ18',{token},{timeoutMs:15000}),
    APP_VERSION.FRONTEND_VERSION,
    ()=>{if(typeof waRecordClientIssueQ17_==='function')waRecordClientIssueQ17_('startup','VERSION_MISMATCH',0);},
    ()=>{done=0;startupCompletedF56.clear();startupProgressF14Z32_(0,7,'גרסת השרת אומתה; טוען מחדש את כל נתוני המערכת…');}
  );
  const versions=[core,guests,tables,admin].map(x=>x.serverVersion);
  versions.forEach(assertBackendVersion_);
  state.serverVersion=core?.serverVersion||versions[0]||state.serverVersion;
  clearVersionMismatchToast_();
  state.events=Array.isArray(core?.events)?core.events:[];
  state.eventTypes=Array.isArray(core?.eventTypes)?core.eventTypes:[];
  state.guests=Array.isArray(guests?.guests)?guests.guests:[];
  state.tables=Array.isArray(tables?.tables)?tables.tables:[];
  state.activity=Array.isArray(core?.activity)?core.activity:[];
  state.lookups=core?.lookups||{sides:[],groups:[],statuses:[]};
  rebuildLookupIndex_();
  state.adminData=admin?.adminData||{users:[],roles:[],permissions:[],whatsapp:[],eventTypes:[]};
  if(!state.eventTypes.length)state.eventTypes=state.adminData.eventTypes||[];
  const renderStartedF57=performance.now();
  restoreCurrentEvent_();renderAll();setGuestsLoadingF14Z4_(false);
  startupMetricsStepF57("רינדור מסכים",performance.now()-renderStartedF57);
  startupProgressF14Z32_(5,7,"מכין את מסכי המערכת…");
  // on demand via renderEventViewImagesD55Q; startup must not wait for bytes.
  startupProgressF14Z32_(6,7,"הנתונים מוכנים, מסיים הצגה…");
  // Cost estimation is nonessential startup work; defer it until the UI is ready.
  setTimeout(()=>getWaCostEstimateCachedF14_(1).catch(()=>{}),0);
}
function setGuestsLoadingF14Z4_(loading){
  const body=document.querySelector('#guestsBody');
  if(!body)return;
  if(loading){body.dataset.loading='1';body.innerHTML='<tr class="guest-loading-row-f14z4"><td colspan="99"><div class="guest-loading-f14z4"><span class="seating-spinner-v171" aria-hidden="true"></span><strong>טוען רשומות...</strong></div></td></tr>';return;}
  delete body.dataset.loading;
}

function renderAll(){
  renderLookupFilters();renderEvents();renderGuests();renderDashboard();renderTables();renderActivity();renderAdmin();renderCurrentEventContext_();
  $("#frontVersion") && ($("#frontVersion").textContent=APP_VERSION.FRONTEND_VERSION);
  $("#serverVersion") && ($("#serverVersion").textContent=state.serverVersion||"טרם נטען");
  $("#aboutVersion").textContent=APP_VERSION.FRONTEND_VERSION;
  const active=state.events.find(e=>eventKey_(e)===String(state.activeEventId));
  $("#homeActiveEvent").textContent=active?active.name:"לא נבחר אירוע";
}

function rebuildLookupIndex_(){
  const index={sidesByType:{},groupsByType:{},statuses:[],labelMap:{}};
  const addScoped=(kind,target)=>{
    (state.lookups[kind]||[]).filter(x=>isTrue(x.active,true)).forEach(x=>{
      const tid=String(x.eventTypeId||'');
      if(!target[tid]) target[tid]=[];
      target[tid].push(x);
      const key=String(lookupKey_(kind,x));
      const value=String(x.value||'');
      const label=lookupDisplay_(kind,x);
      index.labelMap[`${kind}|${tid}|${key}`]=label;
      if(value) index.labelMap[`${kind}|${tid}|${value}`]=label;
    });
    Object.values(target).forEach(arr=>arr.sort((a,b)=>(+a.sortOrder||0)-(+b.sortOrder||0)));
  };
  addScoped('sides',index.sidesByType);
  addScoped('groups',index.groupsByType);
  index.statuses=(state.lookups.statuses||[]).filter(x=>isTrue(x.active,true)).slice().sort((a,b)=>(+a.sortOrder||0)-(+b.sortOrder||0));
  index.statuses.forEach(x=>{
    const key=String(lookupKey_('statuses',x));
    const value=String(x.value||'');
    const label=lookupDisplay_('statuses',x);
    index.labelMap[`statuses||${key}`]=label;
    if(value) index.labelMap[`statuses||${value}`]=label;
  });
  state.lookupIndex=index;
}
function lookupEventTypeId_(eventTypeId){return eventTypeId||activeEvent()?.eventTypeId||""}
function activeLookup(kind,eventTypeId){
  const scopeId=String(lookupEventTypeId_(eventTypeId)||'');
  if(kind==="sides")return state.lookupIndex?.sidesByType?.[scopeId]||[];
  if(kind==="groups")return state.lookupIndex?.groupsByType?.[scopeId]||[];
  if(kind==="statuses")return state.lookupIndex?.statuses||[];
  return (state.lookups[kind]||[]).filter(x=>isTrue(x.active,true)).sort((a,b)=>(+a.sortOrder||0)-(+b.sortOrder||0));
}
// strict event-type lookup. No fallback to the current global context. 
// Guest filters/forms use this helper so switching events can never reuse another event type's options.
function strictScopedLookup_(kind,eventTypeId){
  const scopeId=String(eventTypeId||'');
  if(!scopeId)return [];
  return activeLookup(kind,scopeId);
}
function lookupKey_(kind,x){return kind==="sides"?String(x.sideId||x.id||""):kind==="groups"?String(x.groupId||x.id||""):String(x.value||x.id||"")}
// Side selectors display the Side name/value, not the description/label. 
function lookupDisplay_(kind,x){
  if(kind==="sides")return String((x&&x.value)||(x&&x.label)||lookupKey_(kind,x)||"");
  return String((x&&x.label)||(x&&x.value)||lookupKey_(kind,x)||"");
}
function optionHtml(kind,selected,eventTypeId){return activeLookup(kind,eventTypeId).map(x=>{const key=lookupKey_(kind,x);return `<option value="${esc(key)}" ${String(key)===String(selected)?"selected":""}>${esc(lookupDisplay_(kind,x))}</option>`}).join("")}
function labelFor(kind,value,eventTypeId){
  const scoped=kind==="sides"||kind==="groups",scopeId=scoped?String(lookupEventTypeId_(eventTypeId)||''):'';
  const key=`${kind}|${scopeId}|${String(value??'')}`;
  const indexed=state.lookupIndex?.labelMap?.[key];
  if(indexed!==undefined)return indexed;
  return value||"";
}
function statusText(s){return labelFor("statuses",s)||s}
function renderLookupFilters(){
  const side=$("#sideFilter"), group=$("#groupFilter"), status=$("#statusFilter"); if(!side)return;
  const ev=activeEvent(),eventTypeId=String(ev?.eventTypeId||''),type=eventTypeById(eventTypeId),showSides=!!type&&isTrue(type.usesSides,false),showGroups=!!type&&isTrue(type.usesGroups,false);
  const sv=showSides?side.value:"",gv=showGroups?group.value:"",stv=status.value;
  side.hidden=!showSides;group.hidden=!showGroups;
  const sideHead=$(".guests-table th[data-sort=side]"),groupHead=$(".guests-table th[data-sort=group]");
  if(sideHead)sideHead.hidden=!showSides;if(groupHead)groupHead.hidden=!showGroups;
  const sides=showSides?activeLookup('sides',eventTypeId):[];
  const groups=showGroups?activeLookup('groups',eventTypeId):[];
  const makeOptions=(kind,rows,selected)=>rows.map(x=>{const key=lookupKey_(kind,x);return `<option value="${esc(key)}" ${String(key)===String(selected)?"selected":""}>${esc(lookupDisplay_(kind,x))}</option>`}).join('');
  side.innerHTML='<option value="">כל הצדדים</option>'+makeOptions('sides',sides,sv);
  group.innerHTML='<option value="">כל הקבוצות</option>'+makeOptions('groups',groups,gv);
  status.innerHTML='<option value="">כל הסטטוסים</option>'+optionHtml("statuses",stv);
  side.value=sides.some(x=>lookupKey_('sides',x)===sv)?sv:"";
  group.value=groups.some(x=>lookupKey_('groups',x)===gv)?gv:"";
  status.value=stv;
}
function eventTypeById(id){return state.eventTypes.find(x=>String(x.eventTypeId||x.id)===String(id))||null}
function activeEventTypes(){return state.eventTypes.filter(x=>isTrue(x.active,true)).sort((a,b)=>(+a.sortOrder||0)-(+b.sortOrder||0))}
function eventTypeName(e){return eventTypeById(e.eventTypeId)?.name||e.type||"אירוע אחר"}
function lifecycleText(s){return ({ACTIVE:"פעיל",EXPIRED:"פג תוקף",INACTIVE:"לא פעיל",ARCHIVED:"בארכיון"})[s]||s||""}
function lifecycleClass(s){return String(s||"").toLowerCase()}
function eventKey_(e){return String((e&&(e.eventId||e.id))||"")}
function activeEvent(){return state.events.find(e=>eventKey_(e)===String(state.activeEventId))||null}
function canManageTables_(){const ev=activeEvent();return !!ev&&isTrue(ev.seatingEnabled,false)}
function persistCurrentEvent_(){
  if(state.activeEventId)localStorage.setItem(CURRENT_EVENT_KEY,String(state.activeEventId));
  else localStorage.removeItem(CURRENT_EVENT_KEY);
}
function restoreCurrentEvent_(){
  const saved=localStorage.getItem(CURRENT_EVENT_KEY);
  if(saved&&state.events.some(e=>eventKey_(e)===String(saved))){state.activeEventId=saved;return}
  const active=state.events.filter(e=>e.lifecycleStatus==="ACTIVE");
  if(active.length===1)state.activeEventId=eventKey_(active[0]);
  else if(state.events.length===1)state.activeEventId=eventKey_(state.events[0]);
  else state.activeEventId=null;
  persistCurrentEvent_();
}
function currentEventLookupContext_(){
  const ev=activeEvent();
  if(!ev) return null;
  const eventTypeId=String(ev.eventTypeId||'');
  const type=eventTypeById(eventTypeId);
  return {
    event:{id:eventKey_(ev),eventId:eventKey_(ev),name:ev.name,eventTypeId:eventTypeId},
    eventType:type,
    sides:type&&isTrue(type.usesSides,false)?activeLookup('sides',eventTypeId):[],
    groups:type&&isTrue(type.usesGroups,false)?activeLookup('groups',eventTypeId):[],
    statuses:activeLookup('statuses')
  };
}

function setCurrentEvent_(id){
  const next=state.events.some(e=>eventKey_(e)===String(id))?String(id):null;
  state.activeEventId=next;
  if(next)void eventImagesWarmD55S_(next);
  state.seating=null;
  const seatFilter=$("#guestSeatingFilterV174"),tableFilter=$("#guestTableFilterV174");
  if(seatFilter)seatFilter.value="";if(tableFilter)tableFilter.value="";
  persistCurrentEvent_();

  // the main event is the single source of truth for Side/Group admin scope. 
  // Reset any manual Admin scope before rendering, then apply the exact same scope
  // path used by the internal EventType combo again after renderAll().
  const nextTypeId=String(activeEvent()?.eventTypeId||'');
  state.adminLookupEventTypeId=nextTypeId||null;
  state.adminLookupBoundEventId=next;
  state.adminLookupManualOverride=false;

  if(currentPage==="seating"&&!canManageTables_())currentPage="dashboard";
  // Switch event entirely from local bootstrap data. No extra Apps Script request.
  renderAll();
  // Invalidate the local selector override, including when "all events" is chosen.
  const costEventSelectorFIX61=document.querySelector('#eventCostsEventZ58');
  if(costEventSelectorFIX61){costEventSelectorFIX61.dataset.userSelected='false';costEventSelectorFIX61.value=next||'';}
  if(currentPage==='eventCosts')void loadEventCostsZ58_();
  if(currentPage==='whatsappMonitor')void loadWhatsAppMonitorQ17_();

  // IMPORTANT: renderAll() has several render stages. Re-apply the Admin lookup
  // scope after they complete so both the internal combo AND the Side/Group rows
  // are rebuilt from the same EventType. This mirrors the path that already works
  // when the internal combo is changed manually.
  if(["sides","groups"].includes(state.adminTab) && nextTypeId){
    applyAdminLookupScope_(nextTypeId,false);
  }

  if(currentPage==="dashboard")showPage("dashboard");
}
function renderCurrentEventContext_(){
  const optionRows=state.events.map(e=>{const key=eventKey_(e);return `<option value="${esc(key)}" ${key===String(state.activeEventId)?"selected":""}>${esc(e.name||"ללא שם")} — ${esc(lifecycleText(e.lifecycleStatus))}</option>`}).join("");
  [$("#currentEventSelect"),$("#activeEventSelect")].filter(Boolean).forEach(sel=>{
    const previous=state.activeEventId||"";
    sel.innerHTML=`<option value="">בחר אירוע...</option>${optionRows}`;
    sel.value=previous;
    sel.disabled=!state.events.length;
    sel.onchange=e=>setCurrentEvent_(e.target.value);
  });
  const ev=activeEvent();
  const label=$("#currentEventStatus");
  if(label)label.textContent=ev?`${ev.name||"ללא שם"} · ${eventTypeName(ev)} · ${formatEventDateTime_(ev)} · ${lifecycleText(ev.lifecycleStatus)}`:"יש לבחור אירוע לעבודה";
  const seatingNav=$("#mainNav [data-page=seating]");
  if(seatingNav){
    if(canManageTables_())seatingNav.style.removeProperty("display");
    else seatingNav.style.setProperty("display","none","important");
  }
  const seatingFeature=$("#homeSeatingFeature");
  if(seatingFeature)seatingFeature.hidden=!canManageTables_();
  if(currentPage==="seating"&&!canManageTables_())showPage("dashboard");
}

function renderDashboard(){
  const gs=state.guests.filter(g=>g.eventId===state.activeEventId);
  $("#statEvents").textContent=state.events.length;$("#statGuests").textContent=gs.reduce((a,g)=>a+(+g.invitedCount||+g.partySize||1),0);
  $("#statConfirmed").textContent=gs.reduce((a,g)=>a+(+g.confirmedCount||0),0);
  $("#statPending").textContent=gs.filter(g=>(g.rsvpStatus||g.status)==="Pending").length;
}
function displayUserPhone_(value){const raw=String(value??'').trim(),d=raw.replace(/\D/g,'');if(/^5\d{8}$/.test(d))return '0'+d;if(/^9725\d{8}$/.test(d))return '0'+d.slice(3);return raw;}
function formatRsvpDeadline_(value){
  const match=/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(String(value||""));
  return match?`${match[3]}/${match[2]}/${match[1]} בשעה ${match[4]}:${match[5]}`:String(value||"");
}
// D5D55R: The existing event display surface is read-only and shares image metadata with editor.
const eventViewImageCacheD55Q=new Map();
const eventViewImagePendingD55Q=new Map();
const eventViewImageDataD55Q=new Map();
function eventViewImagesD55Q(eventId){
  const key=String(eventId);
  if(eventViewImageCacheD55Q.has(key))return Promise.resolve(eventViewImageCacheD55Q.get(key));
  if(eventViewImagePendingD55Q.has(key))return eventViewImagePendingD55Q.get(key);
  const pending=API.request('eventImageContextD55P',{eventId}).then(ctx=>{
    const templates=ctx.templates||[];
    eventViewImageCacheD55Q.set(key,templates);
    return templates;
  }).finally(()=>eventViewImagePendingD55Q.delete(key));
  eventViewImagePendingD55Q.set(key,pending);return pending;
}
const eventImageInflightD55S=new Map();
function eventImageInvalidateD55S(eventId,templateId){
  const prefix=String(eventId)+'|';
  for(const key of [...eventViewImageDataD55Q.keys()])if(key.startsWith(prefix)&&(!templateId||key===prefix+String(templateId)))eventViewImageDataD55Q.delete(key);
  for(const key of [...eventImageInflightD55S.keys()])if(key.startsWith(prefix)&&(!templateId||key===prefix+String(templateId)))eventImageInflightD55S.delete(key);
  eventViewImageCacheD55Q.delete(String(eventId));
  if(typeof tplInvalidateEventImageD29==='function')tplInvalidateEventImageD29(eventId);
  state.waSendTemplateImagesF14G?.clear();
}
function eventViewImageDataLoadD55Q(eventId,templateId){
  const key=String(eventId)+'|'+String(templateId);
  if(eventViewImageDataD55Q.has(key))return Promise.resolve(eventViewImageDataD55Q.get(key));
  if(eventImageInflightD55S.has(key))return eventImageInflightD55S.get(key);
  const pending=API.request('getEventImageD55P',{eventId,templateId}).then(data=>{
    eventViewImageDataD55Q.set(key,data);
    return data;
  }).finally(()=>{if(eventImageInflightD55S.get(key)===pending)eventImageInflightD55S.delete(key);});
  eventImageInflightD55S.set(key,pending);
  return pending;
}
function scheduleEventImagesWarmF58_(){
  const eventId=state.activeEventId;
  if(!eventId)return;
  const warm=()=>{
    const started=performance.now();
    Promise.resolve().then(()=>eventImagesWarmD55S_(eventId))
      .then(()=>console.info('[STARTUP FIX58] background image cache',Math.round(performance.now()-started),'ms'))
      .catch(err=>console.warn('[STARTUP FIX58] background image cache',err));
  };
  if(typeof requestIdleCallback==='function')requestIdleCallback(warm,{timeout:5000});
  else setTimeout(warm,1000);
}
function eventImageSrcD55S(data){return data?.base64&&data?.mime?'data:'+data.mime+';base64,'+data.base64:'';}
async function eventImagesWarmD55S_(eventId){
  if(!eventId)return;
  try{
    const templates=await eventViewImagesD55Q(eventId);
    // Bound concurrency to two images; do not fetch every image of every event at startup.
    const images=templates.filter(t=>t.imageFileId);
    for(let i=0;i<images.length;i+=2){
      await Promise.allSettled(images.slice(i,i+2).map(t=>eventViewImageDataLoadD55Q(eventId,t.id)));
    }
  }catch(err){console.warn('[EventImages] central preload failed',err);}
}
function renderEventViewImagesD55Q(card,event){
  const holder=card.querySelector('.event-view-images-d55q');if(!holder)return;
  const id=String(event.id);
  eventViewImagesD55Q(id).then(templates=>{
    if(!holder.isConnected)return;
    holder.replaceChildren();
    if(!templates.length){holder.textContent='לא נמצאו תבניות פעילות עם תמונה.';return;}
    for(const t of templates){
      const section=document.createElement('section');section.className='event-view-image-card-d55q';
      const title=document.createElement('h4');title.textContent=t.name||t.metaName||'תמונה';section.append(title);
      const status=document.createElement('p');status.className='muted';status.textContent=t.imageFileId?'טוען תמונה…':'לא הוגדרה תמונה';section.append(status);
      if(t.imageFileId){
        const img=document.createElement('img');img.alt='תמונת '+title.textContent;img.loading='eager';img.className='event-view-preview-d55q';img.hidden=true;section.append(img);
        eventViewImageDataLoadD55Q(id,t.id).then(data=>{
          if(!section.isConnected)return;
          if(data&&data.base64){img.src='data:'+(data.mime||'image/jpeg')+';base64,'+data.base64;img.hidden=false;status.textContent='';}
          else status.textContent='לא ניתן להציג את התמונה';
        }).catch(err=>{if(section.isConnected)status.textContent='טעינת התמונה נכשלה: '+(err.message||err);});
      }
      holder.append(section);
    }
  }).catch(err=>{if(holder.isConnected)holder.textContent='טעינת התמונות נכשלה: '+(err.message||err);});
}
function renderEvents(){
  const users=state.adminData.users||[];
  const userNameById=id=>users.find(u=>String(u.id)===String(id))?.name||'לא הוגדר';
  const userPhoneById=id=>displayUserPhone_(users.find(u=>String(u.id)===String(id))?.phone||'');
  const valueOrUnset=v=>String(v??'').trim()?esc(v):'לא הוגדר';
  const tabs=[['general','כללי'],['images','תמונות'],['navigation','ניווט'],...(state.session.role==='TableManager'?[]:[['payment','תשלום']]),['rsvp','אישורי הגעה'],['messages','הודעות']];
  const root=$('#eventsGrid');if(!root)return;
  // Keep selected tab when the shared render cycle refreshes an event.
  const previous=new Map(Array.from(root.querySelectorAll('.event-card[data-event]')).map(card=>[String(card.dataset.event),card.querySelector('.event-view-tab-d55q[aria-selected="true"]')?.dataset.tab||'general']));
  root.innerHTML=state.events.map(e=>{
    const manager=userNameById(e.rsvpManagerId)||e.rsvpContactName||'לא הוגדר';
    const phone=userPhoneById(e.rsvpManagerId)||displayUserPhone_(e.rsvpContactPhone||'')||'לא הוגדר';
    const tableManager=e.tableManagerId?userNameById(e.tableManagerId):'לא הוגדר';
    const remembered=previous.get(String(e.id))||'general';
    const selected=tabs.some(([id])=>id===remembered)?remembered:'general';
    const panel=(id,html)=>`<section class="event-view-pane-d55q" data-pane="${id}" role="tabpanel" ${selected===id?'':'hidden'}>${html}</section>`;
    return `<article class="event-card ${String(e.id)===String(state.activeEventId)?'active':''}" data-event="${esc(e.id)}">
      <header class="event-view-heading-d55q"><h3><span class="event-view-icon-d55q" aria-hidden="true">${/חתונ|wedding/i.test(String(eventTypeName(e)))?'💍':'📖'}</span> ${esc(e.name)}</h3><span class="event-view-status-d55q">${isTrue(e.enabled,true)?'פעיל':'לא פעיל'}</span></header>
      <nav class="event-view-tabs-d55q" aria-label="לשוניות תצוגת אירוע" role="tablist">${tabs.map(([id,label])=>`<button type="button" class="event-view-tab-d55q" role="tab" data-tab="${id}" aria-selected="${selected===id}">${label}</button>`).join('')}</nav>
      ${panel('general',`<h4>פרטי האירוע</h4><p><b>סוג אירוע:</b> ${esc(eventTypeName(e))}</p><p><b>תאריך ושעה:</b> ${esc(formatEventDateTime_(e))}</p><p><b>מקום:</b> ${valueOrUnset(e.venue)}</p><p><b>אירוע פעיל:</b> ${isTrue(e.enabled,true)?'כן':'לא'} · <b>מצב:</b> ${esc(lifecycleText(e.lifecycleStatus))}</p><p><b>ניהול שולחנות:</b> ${isTrue(e.seatingEnabled,true)?'כן':'לא'}</p><p><b>מנהל שולחנות:</b> ${esc(tableManager)}</p>`)}
      ${panel('images','<h4>תמונות האירוע</h4><div class="event-view-images-d55q" role="status">טוען נתוני תמונות…</div>')}
      ${panel('navigation',`<h4>ניווט</h4><p><b>מקום:</b> ${valueOrUnset(e.venue)}</p><p><b>כתובת לניווט:</b> ${valueOrUnset(e.navigationAddress)}</p>${String(e.navigationAddress||'').trim()?`<p><a target="_blank" rel="noopener noreferrer" href="https://www.google.com/maps/dir/?api=1&amp;destination=${encodeURIComponent(e.navigationAddress)}">Google Maps</a> · <a target="_blank" rel="noopener noreferrer" href="https://www.waze.com/ul?q=${encodeURIComponent(e.navigationAddress)}&amp;navigate=yes">Waze</a></p>`:''}`)}
      ${panel('payment','<h4>הגדרות תשלום</h4><div class="event-view-payment-host-d55u" role="status">פתח את הלשונית לטעינת הגדרות התשלום.</div>')}
      ${panel('rsvp',`<h4>הגדרות אישור הגעה</h4><p><b>מועד סגירת אישור/שינוי הגעה:</b> ${e.rsvpDeadline?esc(formatRsvpDeadline_(e.rsvpDeadline)):'לא הוגדר'}</p><p><b>מנהל אחראי:</b> ${esc(manager)}</p><p><b>טלפון איש קשר:</b> ${esc(phone)}</p><p><b>הודעה לאחר תפוגה:</b> ${esc(e.rsvpClosedMessage||'לא הוגדרה')}</p>`)}
      ${panel('messages',`<h4>הודעות</h4><p><b>חתימת ההודעה:</b> ${valueOrUnset(e.messageSignature)}</p><p>תבניות WhatsApp והשליחה מנוהלות במסך ההודעות הקיים.</p>`)}
      <div class="actions"><button class="primary edit-event event-action-btn-d55w" data-id="${esc(e.id)}"><span class="event-action-icon-d55w" aria-hidden="true">✎</span> עריכה</button><button class="danger delete-event event-action-btn-d55w" data-id="${esc(e.id)}"><svg class="event-action-icon-d55w" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18M8 6V4h8v2M5 6l1 14h12l1-14M10 10v7M14 10v7"/></svg> מחיקה</button></div>
    </article>`;
  }).join('')||'<div class="empty">אין אירועים. צור אירוע ראשון.</div>';
  root.querySelectorAll('.event-card').forEach(card=>{
    const activate=id=>{
      card.querySelectorAll('.event-view-tab-d55q').forEach(btn=>btn.setAttribute('aria-selected',String(btn.dataset.tab===id)));
      card.querySelectorAll('.event-view-pane-d55q').forEach(p=>p.hidden=p.dataset.pane!==id);
      if(id==='images'){const event=state.events.find(e=>String(e.id)===String(card.dataset.event));if(event)renderEventViewImagesD55Q(card,event);}
      if(id==='payment'){void renderEventPaymentD55U_(card);}
      const globalEdit=card.querySelector('.edit-event');if(globalEdit)globalEdit.hidden=id==='payment';
    };
    card.querySelectorAll('.event-view-tab-d55q').forEach(btn=>btn.addEventListener('click',()=>activate(btn.dataset.tab)));
    const activeTab=card.querySelector('.event-view-tab-d55q[aria-selected="true"]')?.dataset.tab;
    if(activeTab==='images'||activeTab==='payment')activate(activeTab);
    // Prefetch image metadata while event data is already being rendered; no second loader.
    void eventViewImagesD55Q(card.dataset.event).catch(()=>{});
  });
}

function filteredGuests(){
  const type=eventTypeById(activeEvent()?.eventTypeId),sideEnabled=!!type&&isTrue(type.usesSides,false),groupEnabled=!!type&&isTrue(type.usesGroups,false);
  const q=$("#guestSearch").value.trim().toLowerCase(),side=sideEnabled?$("#sideFilter").value:"",group=groupEnabled?$("#groupFilter").value:"",status=$("#statusFilter").value;
  const rows=state.guests.filter(g=>String(g.eventId)===String(state.activeEventId)&&(!q||(String(g.name||"")+" "+String(g.phone||"")).toLowerCase().includes(q))&&(!side||String(g.sideId||g.side)===String(side))&&(!group||String(g.groupId||g.group)===String(group))&&(!status||String(g.rsvpStatus||g.status)===String(status)));
  const seatingStatus=$('#guestSeatingFilterV174')?.value||'',tableFilter=$('#guestTableFilterV174')?.value||'',sendFilter=$('#guestSendFilterA19P2F6')?.value||'';
  const st=state.seating?.eventId===String(state.activeEventId)?state.seating:null;
  const filtered=rows.filter(g=>{
    if(sendFilter && guestSendChecked(g)!==(sendFilter==='yes'))return false;
    if(!seatingStatus&&!tableFilter)return true;
    const sg=st?.guests.find(x=>String(x.guestId)===String(g.guestId||g.id));
    if(seatingStatus==='UNASSIGNED'&&Number(g.confirmedCount)<=0)return false;
    if(seatingStatus==='NOT_REQUIRED'&&Number(g.confirmedCount)>0)return false;
    if(seatingStatus==='REMAINING'&&!(Number(g.confirmedCount)>Number(sg?.assignedCount||0)))return false;
    if(seatingStatus==='UNASSIGNED' && sg && sg.seatingStatus!=='UNASSIGNED')return false;
    if(seatingStatus&&seatingStatus!=='UNASSIGNED'&&seatingStatus!=='NOT_REQUIRED'&&seatingStatus!=='REMAINING'&&(!sg||sg.seatingStatus!==seatingStatus))return false;
    if(tableFilter&&!st?.assignments.some(a=>String(a.guestId)===String(g.guestId||g.id)&&String(a.tableId)===tableFilter))return false;
    return true;
  });
  const {key,dir}=state.guestSort,mul=dir==="asc"?1:-1;
  return filtered.sort((a,b)=>{let av=a[key]??"",bv=b[key]??"";if(key==="invitedCount"||key==="confirmedCount")return((+av||0)-(+bv||0))*mul;if(key==="rsvpStatus"){av=statusText(av);bv=statusText(bv)}return String(av).localeCompare(String(bv),"he",{numeric:true,sensitivity:"base"})*mul});
}
function renderGuestStatsV178_(visible){
  const all=state.guests.filter(g=>String(g.eventId)===String(state.activeEventId));
  const statusEl=$('#guestCountStatusV178');
  if(statusEl){
    const filters=['guestSearch','sideFilter','groupFilter','statusFilter','guestSeatingFilterV174','guestTableFilterV174','guestSendFilterA19P2F6'];
    const active=filters.some(id=>!!$('#'+id)?.value);
    const clearButton=$('#clearGuestFiltersV180');
    if(clearButton){clearButton.classList.toggle('has-active-filters-v182',active);clearButton.setAttribute('aria-pressed',String(active));clearButton.title=active?'נקה את הסינונים הפעילים והחיפוש':'אין סינונים פעילים';}
    statusEl.innerHTML='<span>מוצגות <b>'+visible.length+'</b> מתוך <b>'+all.length+'</b> רשומות</span>'+(active?'<span class="guest-filter-active-v178">סינון פעיל</span>':'');
  }
  const st=state.seating?.eventId===String(state.activeEventId)?state.seating:null;
  const byGuest=new Map((st?.guests||[]).map(g=>[String(g.guestId),g]));
  const rsvp=String($('#statusFilter')?.value||''),seating=String($('#guestSeatingFilterV174')?.value||'');
  const statuses=[['Confirmed','אישרו הגעה','green'],['Declined','לא מגיעים','red'],['Pending','ממתינים לתשובה','amber']];
  const actualStatuses=new Map(all.map(g=>[String(g.rsvpStatus||g.status||'Pending').toLowerCase(),String(g.rsvpStatus||g.status||'Pending')]));
  const rsvpCards=statuses.map(([key,label,color])=>{
    const actual=actualStatuses.get(key.toLowerCase())||key;
    return {label,color,count:all.filter(g=>String(g.rsvpStatus||g.status||'Pending')===actual).length,kind:'rsvp',value:actual,active:rsvp===actual};
  });
  rsvpCards.push({label:'סה״כ רשומות',color:'blue',count:all.length,kind:'rsvp',value:'',active:!rsvp});
  const seatEligible=all.filter(g=>Number(g.confirmedCount)>0);
  const seatState=g=>byGuest.get(String(g.guestId||g.id));
  const seatCards=[
    {label:'שויכו במלואם',color:'green',value:'FULL',count:seatEligible.filter(g=>seatState(g)?.seatingStatus==='FULL').length},
    {label:'לא שויכו',color:'red',value:'UNASSIGNED',count:seatEligible.filter(g=>!seatState(g)||seatState(g).seatingStatus==='UNASSIGNED').length},
    {label:'שויכו חלקית',color:'amber',value:'PARTIAL',count:seatEligible.filter(g=>seatState(g)?.seatingStatus==='PARTIAL').length},
    {label:'אנשים שנותרו לשיבוץ',color:'blue',value:'REMAINING',count:seatEligible.reduce((n,g)=>n+Math.max(0,Number(g.confirmedCount)-(Number(seatState(g)?.assignedCount)||0)),0)}
  ].map(x=>({...x,kind:'seating',active:seating===x.value}));
  const paint=(id,cards)=>{const el=$('#'+id);if(!el)return;el.innerHTML=cards.map(c=>'<button type="button" class="guest-stat-card-v178 '+c.color+(c.active?' active':'')+'" data-guest-stat-kind="'+c.kind+'" data-guest-stat-value="'+c.value+'" '+(c.value==='REMAINING'?'title="סינון מוזמנים שנותרו להם מקומות לשיבוץ"':'')+'><span>'+c.label+'</span><strong>'+c.count+'</strong></button>').join('')};
  paint('guestRsvpStatsV178',rsvpCards);paint('guestSeatingStatsV178',seatCards);
}
function guestCanDeleteV179_(g){
  const gid=String(g.guestId||g.id);
  const st=state.seating?.eventId===String(state.activeEventId)?state.seating:null;
  return !st?.assignments?.some(a=>String(a.guestId)===gid);
}
async function deleteGuestV179_(g){
  if(!g||!guestCanDeleteV179_(g))return;
  if(!await seatingConfirmV171_("למחוק את המוזמן "+g.name+"?"))return;
  const id=g.guestId||g.id,started=performance.now();
  try{const r=await API.request("deleteGuest",{id});removeLocal_(state.guests,id);closeModal();renderAll();mutationDone_("המוזמן הועבר למחיקה לוגית",r,started)}
  catch(err){showToast(err?.message||String(err),"error")}
}
function guestSendChecked(g){return isTrue(g.sendWhatsApp,true)}
async function resetEventGuestsV1190A10_(){
  const ev=activeEvent();if(!ev||state.session?.role!=="Admin")return;
  const eid=String(state.activeEventId),name=String(ev.name||'');
  const count=state.guests.filter(g=>String(g.eventId)===eid).length;
  const assigned=state.seating?.eventId===eid?state.seating.assignments.length:0;
  const text=`לאפס את כל המוזמנים באירוע ״${name}״? ${count} מוזמנים יימחקו${isTrue(ev.seatingEnabled,false)?` ו-${assigned} שיוכים לשולחנות יאופסו`:''}. השולחנות עצמם יישמרו. הפעולה אינה ניתנת לביטול.`;
  if(!await seatingConfirmV171_(text))return;
  const btn=$('#resetEventGuestsV1190A10');seatingButtonBusyV171_(btn,true,'מאפס...');
  try{const r=await API.request('resetEventGuestsV1190A10',{eventId:eid,eventName:name});
    // A13: show the confirmed server result immediately, before slow bootstrap.
    state.guests=state.guests.filter(g=>String(g.eventId)!==eid);
    if(isTrue(ev.seatingEnabled,false)){
      ++seatingTableRefreshSequenceV173_;
      if(String(state.seating?.eventId)===eid)state.seating={...state.seating,guests:[],assignments:[],tables:(state.seating.tables||[]).map(t=>({...t,occupied:0,available:Number(t.seats||t.capacity||0)}))};
      state.tables=state.tables.map(t=>String(t.eventId)===eid?{...t,occupied:0}:t);
    }
    renderAll();showToast(`אופסו ${r.removedGuests} מוזמנים ו-${r.removedAssignments} שיוכים באירוע ${name}`,'success');
    // Synchronize other screens without holding back the immediate visual reset.
    bootstrap().then(()=>{if(String(state.activeEventId)===eid&&isTrue(ev.seatingEnabled,false))return refreshSeatingAfterTableCrudV173_(eid)}).catch(err=>showToast('האיפוס הצליח, אך סנכרון הנתונים נכשל: '+(err.message||String(err)),'error'));
  }
  catch(err){showToast(err.message||String(err),'error')}
  finally{seatingButtonBusyV171_(btn,false)}
}
async function deleteAllEventTablesV1190A10_(){
  const ev=activeEvent();if(!ev||state.session?.role!=="Admin"||!isTrue(ev.seatingEnabled,false))return;
  const eid=String(state.activeEventId),name=String(ev.name||'');
  const tables=tablesForActiveEvent();
  if(tables.some(t=>Number(t.occupied)>0)){showToast('יש לאפס מוזמנים ושיוכים לפני מחיקת כל השולחנות','error');return}
  await eventTablesDeleteDialogV1190A13_(eid,name,tables.length);
}
function eventTablesDeleteDialogV1190A13_(eid,name,count){
  return new Promise(resolve=>{
    const shade=document.createElement('div');shade.className='seating-confirm-shade-v171';
    shade.innerHTML='<section class="seating-confirm-v171" role="alertdialog" aria-modal="true" aria-labelledby="deleteTablesTitleA13"><h3 id="deleteTablesTitleA13">מחיקת כל השולחנות</h3><p></p><div class="event-save-status" aria-live="polite" data-delete-status></div><div class="actions"><button type="button" data-delete-cancel>ביטול</button><button type="button" class="danger" data-delete-confirm>כן, מחק שולחנות</button></div></section>';
    shade.querySelector('p').textContent=`למחוק את כל ${count} השולחנות באירוע ״${name}״? הפעולה אינה ניתנת לביטול.`;
    document.body.appendChild(shade);
    const yes=shade.querySelector('[data-delete-confirm]'),no=shade.querySelector('[data-delete-cancel]'),status=shade.querySelector('[data-delete-status]');
    let busy=false,closeTimer=null;
    const done=()=>{if(closeTimer)clearTimeout(closeTimer);document.removeEventListener('keydown',onKey);shade.remove();resolve()};
    const onKey=e=>{if(e.key==='Escape'&&!busy)done()};document.addEventListener('keydown',onKey);
    no.onclick=()=>{if(!busy)done()};yes.onclick=async()=>{
      if(busy)return;busy=true;no.disabled=true;seatingButtonBusyV171_(yes,true,'מוחק...');
      status.textContent='';status.className='event-save-status';
      try{
        const r=await API.request('deleteAllEventTablesV1190A10',{eventId:eid,eventName:name});
        ++seatingTableRefreshSequenceV173_;
        state.tables=state.tables.filter(t=>String(t.eventId)!==eid);
        if(String(state.seating?.eventId)===eid)state.seating={...state.seating,tables:[],assignments:[]};
        renderAll();
        status.textContent=`נמחקו ${r.removedTables} שולחנות באירוע ${name}`;status.className='event-save-status success';
        // Do not delay modal success behind a network refresh.
        bootstrap().then(()=>{if(String(state.activeEventId)===eid)return refreshSeatingAfterTableCrudV173_(eid)}).catch(err=>showToast('המחיקה הצליחה, אך סנכרון הנתונים נכשל: '+(err.message||String(err)),'error'));
        closeTimer=setTimeout(done,2200);
      }catch(err){status.textContent=err?.message||String(err);status.className='event-save-status error';busy=false;no.disabled=false;seatingButtonBusyV171_(yes,false)}
    };
    no.focus();
  });
}

function renderGuests(){
  closeGuestSeatingPopoverZ16_();
  const type=eventTypeById(activeEvent()?.eventTypeId),showSides=!!type&&isTrue(type.usesSides,false),showGroups=!!type&&isTrue(type.usesGroups,false);
  renderGuestSeatingFiltersV174_();
  const visibleGuestsV178=filteredGuests();
  renderGuestStatsV178_(visibleGuestsV178);
  $("#guestsBody").innerHTML=visibleGuestsV178.map(g=>{const status=g.rsvpStatus||g.status||"Pending";return `<tr data-guest="${g.guestId||g.id}">
    <td data-col="name" title="${esc(g.name)}">${esc(g.name)}</td><td data-col="phone">${esc(g.phone)}</td>
    <td data-col="side" ${showSides?"":"hidden"}>${esc(labelFor("sides",g.sideId||g.side,activeEvent()?.eventTypeId))}</td><td data-col="group" title="${esc(labelFor("groups",g.groupId||g.group,activeEvent()?.eventTypeId))}" ${showGroups?"":"hidden"}>${esc(labelFor("groups",g.groupId||g.group,activeEvent()?.eventTypeId))}</td>
    <td data-col="invitedCount">${g.invitedCount||g.partySize||1}</td><td data-col="confirmedCount">${g.confirmedCount||0}</td><td data-col="rsvpStatus"><span class="badge ${esc(status)}">${esc(statusText(status))}</span></td>
    <td data-col="seating">${guestSeatingCellV174_(g)}</td>
    <td class="send-cell"><input class="guest-send-toggle" data-send-guest="${g.guestId||g.id}" type="checkbox" ${guestSendChecked(g)?"checked":""} aria-label="שליחה ב-WhatsApp"></td>
    <td class="guest-row-actions-v179">${guestSendChecked(g)&&['Admin','EventManager'].includes(state.session?.role)?`<button type="button" class="guest-icon-action-v179" data-wa-send-row="${esc(g.guestId||g.id)}" title="שליחת WhatsApp למוזמן" aria-label="שליחת WhatsApp אל ${esc(g.name)}"><svg class="wa-guest-icon-f14" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="#25D366"/><path d="M8.2 6.9c.3-.3.7-.4 1-.2l1.4 2.1c.2.3.2.7 0 1l-.7.8c.7 1.5 1.9 2.7 3.4 3.4l.8-.7c.3-.2.7-.2 1 0l2.1 1.4c.3.2.4.7.2 1-1 1.7-2.6 2.2-4.5 1.6-3.3-1-5.9-3.6-6.9-6.9-.6-1.9-.1-3.5 1.6-4.5.2-.1.4-.1.6 0z" fill="white"/></svg></button>`:''}<button type="button" class="guest-icon-action-v179" data-rsvp-link="${esc(g.guestId||g.id)}" title="העתק קישור אישור הגעה" aria-label="העתק קישור אישור הגעה עבור ${esc(g.name)}">🔗</button><button type="button" class="guest-icon-action-v179 edit" data-edit-guest="${esc(g.guestId||g.id)}" title="עריכה" aria-label="עריכת ${esc(g.name)}">✎</button><button type="button" class="guest-icon-action-v179 delete" data-delete-guest="${esc(g.guestId||g.id)}" title="מחיקת מוזמן" aria-label="מחיקת ${esc(g.name)}" ${guestCanDeleteV179_(g)?"":"disabled"}>🗑</button></td></tr>`}).join("");
  const resetBtn=$('#resetEventGuestsV1190A10');
  if(resetBtn){resetBtn.hidden=state.session?.role!=="Admin"||!state.activeEventId;resetBtn.disabled=!visibleGuestsV178.length&&!state.guests.some(g=>String(g.eventId)===String(state.activeEventId));}
  const bulkBtn=$('#guestWhatsAppBulkA19P2F6'),testBtn=$('#guestWhatsAppTestBulkF14C');const canWa=['Admin','EventManager'].includes(state.session?.role);if(bulkBtn)bulkBtn.hidden=!canWa||!state.activeEventId;if(testBtn)testBtn.hidden=!canWa||!state.activeEventId;
  updateGuestSortUI();
}
function updateGuestSortUI(){
  $$(".guests-table th.sortable").forEach(th=>{const active=th.dataset.sort===state.guestSort.key;th.classList.toggle("sorted",active);const icon=th.querySelector(".sort-icon");if(icon)icon.textContent=active?(state.guestSort.dir==="asc"?"↑":"↓"):"↕"});
  $$(".guests-table td[data-col]").forEach(td=>td.classList.toggle("sorted-col",td.dataset.col===state.guestSort.key));
}
function setGuestSort(key){if(state.guestSort.key===key)state.guestSort.dir=state.guestSort.dir==="asc"?"desc":"asc";else state.guestSort={key,dir:"asc"};renderGuests()}


function activeEventForGuestTransfer_(){
  const ev=activeEvent();
  if(!ev){showToast("יש לבחור אירוע לפני ייבוא או ייצוא","error");return null}
  return ev;
}
function downloadBase64File_(base64,fileName,mimeType){
  const binary=atob(base64||"");const bytes=new Uint8Array(binary.length);
  for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);
  const url=URL.createObjectURL(new Blob([bytes],{type:mimeType||"application/octet-stream"}));
  const a=document.createElement("a");a.href=url;a.download=fileName||"download.xlsx";document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);
}
async function downloadGuestWorkbook_(action){
  const ev=activeEventForGuestTransfer_();if(!ev)return;
  const label=action==="guestExportCurrentV148"?"מכין ייצוא Excel...":"מכין תבנית Excel...";
  showToast(label,"success");
  try{
    const r=await API.request(action,{eventId:ev.eventId||ev.id});
    if(!r?.base64)throw new Error("השרת לא החזיר קובץ Excel תקין");
    downloadBase64File_(r.base64,r.fileName,r.mimeType);
    showToast(action==="guestExportCurrentV148"?"קובץ הייצוא מוכן":"תבנית Excel מוכנה");
  }catch(err){showToast(err?.message||String(err),"error")}
}
function readFileAsBase64_(file){
  return new Promise((resolve,reject)=>{const fr=new FileReader();fr.onerror=()=>reject(new Error("קריאת הקובץ נכשלה"));fr.onload=()=>resolve(String(fr.result||"").split(",")[1]||"");fr.readAsDataURL(file)});
}
function importIssueText_(r){
  const parts=[];if(r.errors?.length)parts.push("שגיאה: "+r.errors.join("; "));if(r.warnings?.length)parts.push("אזהרה: "+r.warnings.join("; "));return parts.join(" | ")||"תקין";
}
function renderGuestImportPreview_(preview,showAll=false){
  state.guestImportPreview=preview;
  state.guestImportShowAll=!!showAll;
  const s=preview.summary||{};
  const allRows=preview.rows||[];
  const exceptionRows=allRows.filter(r=>!r.valid||(r.warnings?.length||0)>0);
  const rows=state.guestImportShowAll?allRows:exceptionRows;
  const noExceptions=!state.guestImportShowAll&&exceptionRows.length===0;
  // derive the commit count from the actual row validation state, not from summary metadata. 
  // If even one error exists the batch policy is all-or-nothing, so no disabled commit button is shown.
  const importableCount=allRows.filter(r=>r.valid).length;
  const errorRowCount=allRows.filter(r=>!r.valid).length;
  const hasBlockingErrors=errorRowCount>0;
  modal(`<h2>תצוגה מקדימה — ייבוא Excel <small class="build-mark">V1.1.68</small></h2>
    <p><b>אירוע:</b> ${esc(preview.event?.name||"")} · <b>קובץ:</b> ${esc(preview.fileName||"")}</p>
    <div class="import-summary"><span>שורות: <b>${s.total||0}</b></span><span class="ok-text">תקינות: <b>${s.clean??Math.max(0,(s.valid||0)-(s.warningRows||0))}</b></span><span class="warning-text">אזהרות: <b>${s.warningRows??s.warnings??0}</b></span><span class="error">שגיאות: <b>${s.errors||0}</b></span><span>הוספה: <b>${s.inserts||0}</b></span><span>עדכון: <b>${s.updates||0}</b></span></div>
    <div class="actions import-preview-filter-actions"><button type="button" class="secondary import-rows-action-a13" id="toggleGuestImportRowsBtn">${state.guestImportShowAll?"הצג חריגים בלבד":"הצג את כל הרשומות"}</button></div>
    <p class="muted">Preview בלבד — בשלב זה לא נשמרה אף רשומה. ${state.guestImportShowAll?`מוצגות כל ${allRows.length} הרשומות.`:`מוצגות רק שגיאות ואזהרות (${exceptionRows.length}).`}</p>
    ${noExceptions?`<div class="empty-state ok-text">✓ כל ${allRows.length} הרשומות עברו בדיקה בהצלחה. לא נמצאו שגיאות או אזהרות.</div>`:`<div class="table-wrap import-preview-wrap"><table class="admin-table import-preview-table"><thead><tr><th>שורה</th><th>פעולה</th><th>שם</th><th>טלפון</th><th>צד</th><th>קבוצה</th><th>מוזמנים</th><th>אישרו</th><th>סטטוס</th><th>בדיקה</th></tr></thead><tbody>${rows.map(r=>`<tr class="${r.valid?(r.warnings?.length?"import-warning":"import-ok"):"import-error"}"><td>${r.sourceRow}</td><td>${r.action==="UPDATE"?"עדכון":"הוספה"}</td><td>${esc(r.guest?.name||"")}</td><td>${esc(r.guest?.phone||"")}</td><td>${esc(labelFor("sides",r.guest?.sideId||"",preview.event?.eventTypeId)||"")}</td><td>${esc(labelFor("groups",r.guest?.groupId||"",preview.event?.eventTypeId)||"")}</td><td>${r.guest?.invitedCount??""}</td><td>${r.guest?.confirmedCount??""}</td><td>${esc(statusText(r.guest?.rsvpStatus||""))}</td><td class="import-check">${esc(importIssueText_(r))}</td></tr>`).join("")}</tbody></table></div>`}
    ${hasBlockingErrors?`<div class="empty-state error">לא ניתן לאשר את הייבוא כל עוד קיימות ${errorRowCount===1?"שורה אחת עם שגיאה":`${errorRowCount} שורות עם שגיאות`}. יש לתקן את השגיאות בקובץ ולהעלות אותו מחדש.${importableCount>0?` ${importableCount} ${importableCount===1?"שורה תקינה/עם אזהרה תהיה ניתנת":"שורות תקינות/עם אזהרות יהיו ניתנות"} לייבוא לאחר התיקון.`:""}</div>`:""}
    <div id="guestImportCommitStatus" class="event-save-status" aria-live="polite"></div>
    <div class="actions"><button type="button" class="secondary" id="cancelGuestImportBtn">ביטול</button>${!hasBlockingErrors&&importableCount>0?`<button type="button" class="primary" id="commitGuestImportBtn">אישור וייבוא ${importableCount} שורות</button>`:""}</div>`);
  const previewModal=document.querySelector("#modal .modal");
  previewModal?.classList.remove("import-loading-modal");
  previewModal?.classList.add("import-preview-modal");
  $("#toggleGuestImportRowsBtn").onclick=()=>renderGuestImportPreview_(preview,!state.guestImportShowAll);
  $("#cancelGuestImportBtn").onclick=closeModal;
  const commitBtn=$("#commitGuestImportBtn");if(commitBtn)commitBtn.onclick=commitGuestImport_;
}
let guestImportProgressTimer_=null;
function showGuestImportProgress_(fileName){
  clearInterval(guestImportProgressTimer_);
  modal(`<div class="guest-import-progress" aria-live="polite">
    <h2>מעבד קובץ Excel <small class="build-mark">V1.1.68</small></h2>
    <p class="muted">${esc(fileName||"")}</p>
    <div class="import-progress-track" role="progressbar" aria-label="עיבוד קובץ Excel"><div class="import-progress-bar"></div></div>
    <p id="guestImportProgressText" class="import-progress-text">קורא את הקובץ מהמחשב...</p>
    <p id="guestImportElapsed" class="muted import-progress-elapsed">זמן שעבר: 0 שניות</p>
    <p class="muted import-progress-note">בקבצים עם מאות רשומות הבדיקה עשויה להימשך מספר שניות. החלון יתחלף אוטומטית בתצוגה המקדימה בסיום.</p>
  </div>`);
  const modalEl=document.querySelector("#modal .modal");
  modalEl?.classList.remove("import-preview-modal");
  modalEl?.classList.add("import-loading-modal");
  const started=performance.now();
  guestImportProgressTimer_=setInterval(()=>{
    const el=$("#guestImportElapsed");
    if(el)el.textContent=`זמן שעבר: ${Math.max(0,Math.floor((performance.now()-started)/1000))} שניות`;
  },500);
}
function updateGuestImportProgress_(text){const el=$("#guestImportProgressText");if(el)el.textContent=text}
function stopGuestImportProgress_(){clearInterval(guestImportProgressTimer_);guestImportProgressTimer_=null}

async function handleGuestImportFile_(file){
  const ev=activeEventForGuestTransfer_();if(!ev||!file)return;
  if(!/\.xlsx$/i.test(file.name)){showToast("יש לבחור קובץ Excel מסוג .xlsx","error");return}
  if(file.size>12*1024*1024){showToast("קובץ Excel גדול מדי. המגבלה היא 12MB","error");return}
  try{
    showGuestImportProgress_(file.name);
    const fileBase64=await readFileAsBase64_(file);
    updateGuestImportProgress_("מעלה את הקובץ לשרת ובודק את הרשומות...");
    const eventId=String(ev.eventId||ev.id||"");
    const existingGuestsHint=(state.guests||[]).filter(g=>String(g.eventId||"")===eventId).map(g=>({
      id:g.id||g.guestId||"",guestId:g.guestId||g.id||"",eventId:eventId,name:g.name||"",phone:g.phone||"",phoneNormalized:g.phoneNormalized||""
    }));
    const eventTypeId=String(ev.eventTypeId||"");
    const eventType=(state.eventTypes||[]).find(t=>String(t.eventTypeId||t.id||"")===eventTypeId)||{};
    const contextHint={
      eventId,event:{eventId,name:ev.name||"",eventTypeId},eventTypeId,eventType,
      usesSides:eventType.usesSides,usesGroups:eventType.usesGroups,
      sides:(state.lookups?.sides||[]).filter(x=>String(x.eventTypeId||"")===eventTypeId),
      groups:(state.lookups?.groups||[]).filter(x=>String(x.eventTypeId||"")===eventTypeId),
      statuses:(state.lookups?.statuses||[])
    };
    const previewRequestStarted=performance.now();
    const r=await API.request("previewGuestImportV148",{eventId,fileName:file.name,fileBase64,existingGuestsHint,contextHint});
    const roundTripMs=Math.round(performance.now()-previewRequestStarted);
    console.info("Guest import preview timing",{roundTripMs,...(r?.performance||{}),apiTotalMs:r?.apiTiming?.totalMs});
    updateGuestImportProgress_("הבדיקה הסתיימה. מכין תצוגה מקדימה...");
    stopGuestImportProgress_();
    renderGuestImportPreview_(r);
  }catch(err){stopGuestImportProgress_();closeModal();showToast(err?.message||String(err),"error")}
}
async function commitGuestImport_(){
  const p=state.guestImportPreview;if(!p||p.summary?.errors)return;
  const btn=$("#commitGuestImportBtn"),status=$("#guestImportCommitStatus");if(btn)seatingButtonBusyV171_(btn,true,"מייבא ושומר...");if(status){status.textContent="מייבא ושומר את הנתונים...";status.className="event-save-status working"}
  try{
    const validRows=(p.rows||[]).filter(r=>r.valid).map(r=>r.guest);
    const r=await API.request("commitGuestImportV148",{eventId:p.event?.eventId,fileName:p.fileName,rows:validRows});
    const eid=String(p.event?.eventId||"");state.guests=state.guests.filter(g=>String(g.eventId)!==eid).concat(r.guests||[]);
    closeModal();renderAll();showToast(`הייבוא הושלם: ${r.summary?.inserted||0} נוספו, ${r.summary?.updated||0} עודכנו`);
    state.guestImportPreview=null;
  }catch(err){if(status){status.textContent=err?.message||String(err);status.className="event-save-status error"}if(btn)seatingButtonBusyV171_(btn,false)}
}

function tablesForActiveEvent(){
  const guests=state.guests.filter(g=>String(g.eventId)===String(state.activeEventId));
  if(state.seating?.eventId===String(state.activeEventId))return state.seating.tables;
  return state.tables
    .filter(t=>String(t.eventId)===String(state.activeEventId))
    .map(t=>{
      const occupied=guests
        .filter(g=>String(g.tableId||"")===String(t.id))
        .reduce((sum,g)=>sum+(+g.partySize||1),0);
      const seats=+t.seats||0;
      return {...t,seats,occupied,free:Math.max(0,seats-occupied)};
    })
    .sort((a,b)=>String(a.tableNumber).localeCompare(String(b.tableNumber),"he",{numeric:true,sensitivity:"base"}));
}
function renderTables(){
  const ev=activeEvent();
  const tableReadOnly=state.session?.role==="TableManager";
  const addBtn=$("#addTableBtn");
  if(ev && !isTrue(ev.seatingEnabled,true)){
    if(addBtn)addBtn.disabled=true;
    $("#tableSummary").innerHTML='<span>ניהול שולחנות אינו מופעל באירוע זה</span>';
    $("#tablesBody").innerHTML='<tr><td colspan="5" class="empty-cell">ניתן להפעיל ניהול שולחנות בעריכת האירוע</td></tr>';
    return;
  }
  if(addBtn){addBtn.disabled=!state.activeEventId||tableReadOnly;addBtn.hidden=tableReadOnly;}
  const headActions=$('#page-seating .seating-head-actions-d55z8');if(headActions)headActions.hidden=tableReadOnly;
  const deleteAllBtn=$("#deleteAllEventTablesV1190A10");if(deleteAllBtn){deleteAllBtn.hidden=state.session?.role!=="Admin";deleteAllBtn.disabled=!state.activeEventId||!tablesForActiveEvent().length||tablesForActiveEvent().some(t=>Number(t.occupied)>0);}
  const rows=tablesForActiveEvent();
  
  $("#tableSummary").innerHTML=state.activeEventId?`<span>שולחנות: <b>${rows.length}</b></span><span>מקומות: <b>${rows.reduce((s,t)=>s+t.seats,0)}</b></span><span>תפוסים: <b>${rows.reduce((s,t)=>s+t.occupied,0)}</b></span><span>פנויים: <b>${rows.reduce((s,t)=>s+t.free,0)}</b></span>`:`<span>יש לבחור אירוע פעיל</span>`;
  renderSeatingWorkspaceV170_();
  $("#tablesBody").innerHTML=rows.map(t=>`<tr><td>${esc(t.tableNumber)}</td><td>${t.seats}</td><td>${t.occupied}</td><td>${t.free}</td><td>${tableReadOnly?"צפייה בלבד":`<button type="button" class="edit-table seating-row-btn-d55z8" data-id="${t.id}" title="עריכת שולחן" aria-label="עריכת שולחן ${esc(t.tableNumber)}"><span aria-hidden="true">✎</span> עריכה</button> <button type="button" class="danger delete-table seating-row-btn-d55z8" data-id="${t.id}" title="מחיקת שולחן" aria-label="מחיקת שולחן ${esc(t.tableNumber)}"><span aria-hidden="true">🗑</span> מחיקה</button>`}</td></tr>`).join("") || `<tr><td colspan="5" class="empty-cell">${state.activeEventId?"אין שולחנות באירוע זה":"יש לבחור אירוע"}</td></tr>`;
}

function tableForm(t={}){
  if(!state.activeEventId){alert("יש לבחור אירוע קודם");return}
  modal(`<h2>${t.id?"עריכת":"הוספת"} שולחן</h2>
    <form id="tableForm" class="form-grid" onsubmit="return false;">
      <input type="hidden" name="id" value="${esc(t.id||"")}">
      <label>מספר שולחן <span class="required-star">*</span><input name="tableNumber" required inputmode="numeric" ${t.id?"readonly aria-readonly=\"true\"":""} value="${esc(t.tableNumber||"")}"></label>
      <label>מספר מקומות <span class="required-star">*</span><input name="seats" required type="number" min="1" step="1" value="${t.seats||10}"></label>
      ${t.id?`<div class="table-form-status"><span>תפוסים: <b>${t.occupied||0}</b></span><span>פנויים: <b>${Math.max(0,(+t.seats||0)-(+t.occupied||0))}</b></span></div>`:""}
      <div class="actions"><button type="button" id="saveTableBtn" class="primary">שמירה</button></div>
    </form>`);
  $("#saveTableBtn").onclick=saveTableForm;
}

function renderActivity(){ if(currentPage==="activity") loadActivityLogZ57_(); }

function logButtonBusyZ57A_(button,busy,label){
  if(!button)return;
  if(busy){if(!button.dataset.logOldHtml)button.dataset.logOldHtml=button.innerHTML;button.disabled=true;button.classList.add('is-busy-z57a');button.innerHTML=`<span class="log-btn-spinner-z57a" aria-hidden="true"></span><span>${esc(label||'טוען...')}</span>`;}
  else{button.disabled=false;button.classList.remove('is-busy-z57a');if(button.dataset.logOldHtml){button.innerHTML=button.dataset.logOldHtml;delete button.dataset.logOldHtml;}}
}
function logFiltersActiveZ57A_(ids){return ids.some(id=>String($('#'+id)?.value||'').trim()!=='');}
function updateLogClearFilterStateZ57A_(kind){
  const wa=kind==='wa',ids=wa?['waLogEventZ55B','waLogEnvironmentZ55B','waLogStatusZ55B','waLogFromZ55B','waLogToZ55B','waLogSearchZ55B']:['activityUserZ57','activityActionZ57','activityTypeZ57','activityFromZ57','activityToZ57','activitySearchZ57'];
  const b=$(wa?'#waLogClearFiltersZ55B':'#activityClearFiltersZ57'),active=logFiltersActiveZ57A_(ids)||(wa&&!!$('#waLogStatusZ55B')?.dataset.cardFilter);if(!b)return;
  if(wa){const toggle=$('#waLogFiltersToggleZ55B');if(toggle){toggle.classList.toggle('wa-filter-active-d55y',!!active);toggle.setAttribute('data-filter-active',String(!!active));toggle.title=active?'קיים סינון פעיל':'הצג או הסתר סינון';}}
  b.classList.toggle('has-active-filters-z57a',active);b.setAttribute('aria-pressed',String(active));b.title=active?'נקה את הסינונים הפעילים והחיפוש':'אין סינונים פעילים';
}

let activityRowsZ57=[];
function activityUserNameZ57_(r){return r.userName||r.userId||'';}
function activitySortValueZ57_(r,key){if(key==='userName')return activityUserNameZ57_(r);return String(r[key]||'');}
function sortedActivityZ57_(){const {key,dir}=state.activitySort||{key:'at',dir:'desc'},mul=dir==='asc'?1:-1;return [...activityRowsZ57].sort((a,b)=>activitySortValueZ57_(a,key).localeCompare(activitySortValueZ57_(b,key),'he',{numeric:true,sensitivity:'base'})*mul);}
function activityInitFiltersZ57_(meta={}){
  const user=$('#activityUserZ57'),action=$('#activityActionZ57'),type=$('#activityTypeZ57');
  if(user){const old=user.value;user.innerHTML='<option value="">כל המשתמשים</option>'+(meta.users||[]).map(x=>`<option value="${esc(x.id)}">${esc(x.name||x.id)}</option>`).join('');user.value=old;}
  if(action){const old=action.value;action.innerHTML='<option value="">כל הפעולות</option>'+(meta.actions||[]).map(x=>`<option value="${esc(x)}">${esc(x)}</option>`).join('');action.value=old;}
  if(type){const old=type.value;type.innerHTML='<option value="">כל סוגי הרשומות</option>'+(meta.entityTypes||[]).map(x=>`<option value="${esc(x)}">${esc(x)}</option>`).join('');type.value=old;}
}
async function loadActivityLogZ57_(button){
  if(state.session?.role!=='Admin')return;
  const body=$('#activityBodyZ57');if(!body)return;logButtonBusyZ57A_(button,true,'מרענן...');body.innerHTML='<tr><td colspan="6"><span class="log-btn-spinner-z57a" aria-hidden="true"></span> טוען...</td></tr>';
  const filters={userId:$('#activityUserZ57')?.value||'',action:$('#activityActionZ57')?.value||'',entityType:$('#activityTypeZ57')?.value||'',fromDate:$('#activityFromZ57')?.value||'',toDate:$('#activityToZ57')?.value||'',search:$('#activitySearchZ57')?.value||'',limit:500};
  try{const d=await API.request('listActivityLogZ57',{filters});activityRowsZ57=d.rows||[];activityInitFiltersZ57_(d.meta||{});renderActivityLogZ57_(d);}catch(e){body.innerHTML=`<tr><td colspan="6" class="error">${esc(e.message)}</td></tr>`;}finally{logButtonBusyZ57A_(button,false);updateLogClearFilterStateZ57A_('activity');}
}
function renderActivityLogZ57_(d={}){
  const rows=sortedActivityZ57_(),body=$('#activityBodyZ57');if(!body)return;
  body.innerHTML=rows.map(r=>`<tr><td data-col="at">${esc(formatWaLogDateTimeZ56B1_(r.at))}</td><td data-col="userName">${esc(activityUserNameZ57_(r))}</td><td data-col="action">${esc(r.action||'')}</td><td data-col="entityType">${esc(r.entityType||'')}</td><td data-col="entityId" title="${esc(r.entityId||'')}">${esc(r.entityId||'')}</td><td data-col="details" title="${esc(r.details||'')}">${esc(r.details||'')}</td></tr>`).join('')||'<tr><td colspan="6" class="empty-cell">אין רשומות בהתאם לסינון.</td></tr>';
  const n=$('#activityNoticeZ57'),total=Number(d.total??rows.length);if(n)n.innerHTML=`<span>מוצגות <b>${rows.length}</b> מתוך <b>${total}</b> רשומות</span>${d.truncated?'<span class="guest-filter-active-v178">500 הרשומות האחרונות</span>':''}`;
  $$('#page-activity th[data-activity-sort]').forEach(th=>{const active=th.dataset.activitySort===state.activitySort.key;th.classList.toggle('sorted',active);const i=th.querySelector('.sort-icon');if(i)i.textContent=active?(state.activitySort.dir==='asc'?'↑':'↓'):'↕';});
  $$('#page-activity td[data-col]').forEach(td=>td.classList.toggle('sorted-col',td.dataset.col===state.activitySort.key));
}
function setActivitySortZ57_(key){if(state.activitySort.key===key)state.activitySort.dir=state.activitySort.dir==='asc'?'desc':'asc';else state.activitySort={key,dir:'asc'};renderActivityLogZ57_({total:activityRowsZ57.length});}
function purgeActivityLogDialogZ57_(){
  if(state.session?.role!=='Admin')return;
  modal(`<h2>ניקוי יומן פעילויות</h2><p>בחר אילו רשומות יש למחוק. הפעולה אינה ניתנת לביטול.</p><label>תקופת שמירה<select id="activityPurgeRangeZ57"><option value="30">מחק רשומות ישנות מ־30 יום</option><option value="60">מחק רשומות ישנות מ־60 יום</option><option value="90" selected>מחק רשומות ישנות מ־90 יום</option><option value="ALL">ניקוי מלא של היומן</option></select></label><div class="actions"><button type="button" onclick="closeModal()">ביטול</button><button type="button" class="danger" id="activityPurgeConfirmZ57">🗑</button></div>`);
  $('#activityPurgeConfirmZ57').onclick=async()=>{const v=$('#activityPurgeRangeZ57').value;if(!confirm(v==='ALL'?'למחוק לצמיתות את כל יומן הפעילויות?':`למחוק לצמיתות רשומות ישנות מ־${v} יום?`))return;const b=$('#activityPurgeConfirmZ57');logButtonBusyZ57A_(b,true,'מוחק...');try{const d=await API.request('purgeActivityLogZ57',{days:v});closeModal();showToast(`נמחקו ${d.deleted||0} רשומות`);await loadActivityLogZ57_();}catch(e){logButtonBusyZ57A_(b,false);showToast(e.message,'error');}};
}
document.addEventListener('change',e=>{if(['activityUserZ57','activityActionZ57','activityTypeZ57','activityFromZ57','activityToZ57'].includes(e.target?.id)){updateLogClearFilterStateZ57A_('activity');loadActivityLogZ57_();}});
document.addEventListener('click',e=>{const toggle=e.target?.closest?.('#activityFiltersToggleZ57');if(toggle){const box=$('#activityFiltersZ57'),open=box?.classList.toggle('filters-open-a5');toggle.setAttribute('aria-expanded',String(!!open));const spans=toggle.querySelectorAll('span');if(spans[0])spans[0].textContent=open?'הסתר סינון':'הצג סינון';if(spans[1])spans[1].textContent=open?'▴':'▾';return;}const th=e.target?.closest?.('#page-activity th[data-activity-sort]');if(th){setActivitySortZ57_(th.dataset.activitySort);return;}if(e.target?.closest?.('#activityRefreshZ57'))loadActivityLogZ57_(e.target.closest('#activityRefreshZ57'));if(e.target?.closest?.('#activityClearFiltersZ57')){const cb=e.target.closest('#activityClearFiltersZ57');logButtonBusyZ57A_(cb,true,'מנקה...');['activityUserZ57','activityActionZ57','activityTypeZ57','activityFromZ57','activityToZ57','activitySearchZ57'].forEach(id=>{const x=$('#'+id);if(x)x.value='';});updateLogClearFilterStateZ57A_('activity');loadActivityLogZ57_().finally(()=>logButtonBusyZ57A_(cb,false));}if(e.target?.closest?.('#activityPurgeZ57'))purgeActivityLogDialogZ57_();});
document.addEventListener('input',e=>{if(e.target?.id==='activitySearchZ57')updateLogClearFilterStateZ57A_('activity');});
document.addEventListener('keydown',e=>{const th=e.target?.closest?.('#page-activity th[data-activity-sort]');if(th&&(e.key==='Enter'||e.key===' ')){e.preventDefault();setActivitySortZ57_(th.dataset.activitySort);return;}if(e.target?.id==='activitySearchZ57'&&e.key==='Enter')loadActivityLogZ57_();});

function eventForm(e={}){
  const types=activeEventTypes();
  const selectedType=e.eventTypeId||types[0]?.eventTypeId||types[0]?.id||"";
  modal(`<h2>${e.id?"עריכת":"הוספת"} אירוע </h2>
  <form id="eventForm" class="form-grid" onsubmit="return false;">
    <label>שם אירוע <span class="required-star">*</span><input name="name" required value="${esc(e.name||"")}"></label>
    <label>סוג אירוע <span class="required-star">*</span><select name="eventTypeId" required>${types.map(t=>`<option value="${esc(t.eventTypeId||t.id)}" ${String(t.eventTypeId||t.id)===String(selectedType)?"selected":""}>${esc(t.name)}</option>`).join("")}</select></label>
    <label>תאריך<input name="date" type="date" class="date-picker-control" value="${esc(dateInputValue_(e.date))}"></label>
    <label>שעת האירוע<input name="eventTime" type="time" class="date-picker-control" value="${esc(String(e.eventTime||"").slice(0,5))}"></label>
    <label>מקום<input name="venue" value="${esc(e.venue||"")}"></label>
    <label>כתובת לניווט<input name="navigationAddress" maxlength="300" placeholder="לדוגמה: המרכבה 40, חולון" value="${esc(e.navigationAddress||"")}"><small class="muted">בדיקת ניווט לפי הכתובת שבשדה, ללא שליחת WhatsApp. שמור את האירוע כדי לעדכן את הכתובת למוזמנים.</small><span class="event-navigation-tests-d31"><button type="button" data-navigation-test-d31="waze">בדיקת Waze ↗</button><button type="button" data-navigation-test-d31="google">בדיקת Google Maps ↗</button></span><small id="eventNavigationTestStatusD31" class="muted" role="status"></small></label>
    <label>חתימת ההודעה<input name="messageSignature" maxlength="120" placeholder="לדוגמה: משפחת אלון" value="${esc(e.messageSignature||"")}"><small class="muted">יש להזין את שם המשפחה/בעלי האירוע בלבד, ללא “בברכה” או “באהבה”.</small></label>
    <section class="rsvp-admin-settings">
      <h3>הגדרות אישור הגעה</h3>
      <p>המועד ופרטי איש הקשר יופיעו בהמשך בקישור האישי למוזמנים.</p>
      <label>מועד סגירת אישור/שינוי הגעה
        <input name="rsvpDeadline" type="datetime-local" class="date-picker-control" value="${esc(String(e.rsvpDeadline||"").slice(0,16))}">
      </label>
      ${state.session?.role==="Admin"?`<label>מנהל אירוע <span class="required-star">*</span>
        <select name="rsvpManagerId">
          <option value="">בחר מנהל אירוע פעיל</option>
          ${(state.adminData.users||[]).filter(u=>u.role==="EventManager"&&isTrue(u.active,true)).map(u=>`<option value="${esc(u.id)}" ${String(e.rsvpManagerId||"")===String(u.id)?"selected":""}>${esc(u.name)}${u.phone?" · "+esc(displayUserPhone_(u.phone)):" · חסר טלפון"}</option>`).join("")}
        </select>
      </label>
      <div id="rsvpManagerContact" class="rsvp-manager-contact"></div>`:''}
      <label>הודעה לאחר תפוגה (לא חובה)
        <textarea name="rsvpClosedMessage" maxlength="500" rows="3">${esc(e.rsvpClosedMessage||"")}</textarea>
      </label>
    </section>
    ${["Admin","EventManager"].includes(state.session?.role)?`<section class="event-access-v15"><h3>מנהל שולחנות</h3><label>מנהל שולחנות לאירוע
      <select name="tableManagerId">
        <option value="">ללא מנהל שולחנות</option>
        ${(state.adminData.users||[]).filter(u=>u.role==="TableManager"&&isTrue(u.active,true)).map(u=>`<option value="${esc(u.id)}" ${String(e.tableManagerId||"")===String(u.id)?"selected":""}>${esc(u.name)}</option>`).join("")}
      </select>
    </label><p class="muted">מנהל השולחנות יקבל גישה לאירוע זה בלבד, למסך שיוך השולחנות בצפייה וחיפוש בלבד.</p></section>`:''}
    <label class="check-label"><input name="seatingEnabled" type="checkbox" ${isTrue(e.seatingEnabled,eventTypeById(selectedType)?.defaultSeatingEnabled??false)?"checked":""}> ניהול שולחנות</label>
    <label class="check-label"><input name="enabled" type="checkbox" ${isTrue(e.enabled,true)?"checked":""}> אירוע פעיל</label>
    <input type="hidden" name="id" value="${esc(e.id||"")}">
    <input type="hidden" name="eventId" value="${esc(e.eventId||e.id||"")}">
    <section class="event-image-d5d17"><h3>תמונת הזמנה לאירוע</h3><label class="check-label"><input type="checkbox" id="eventHasImageD5D17" ${e.invitationImageFileId?'checked':''}> כולל תמונת הזמנה</label><div id="eventImageControlsD5D17" ${e.invitationImageFileId?'':'hidden'}><p id="eventImageInfoD5D16">${e.invitationImageFileId?'✓ תמונה מצורפת':'טרם צורפה תמונה'}</p>${e.id?`<input id="eventImageFileD5D16" type="file" accept="image/png,image/jpeg,image/webp"><button type="button" id="eventImageRemoveD5D16" ${e.invitationImageFileId?'':'disabled'}>הסר תמונה</button>`:'<p class="muted">שמור את האירוע לפני העלאת התמונה.</p>'}</div><p id="eventImageStatusD5D16" role="status"></p></section>
    <div id="eventSaveStatus" class="event-save-status" aria-live="polite"></div>
    <div class="actions"><button type="button" id="saveEventBtn" class="primary">שמירה</button></div>
  </form>`);
  const eventModalShellD5D25=$("#modal .modal");
  if(eventModalShellD5D25)eventModalShellD5D25.classList.add("event-editor-d5d25");
  // D5D55O: Accessible tab layout, preserving the original form and save API.
  const editorFormD55O=$("#eventForm");
  if(editorFormD55O){
    const tabsD55O=[
      {id:"general",title:"כללי"},
      {id:"images",title:"תמונות"},
      {id:"navigation",title:"ניווט"},
      {id:"payment",title:"תשלום"},
      {id:"rsvp",title:"אישורי הגעה"},
      {id:"messages",title:"הודעות"}
    ];
    const typeNameD55O=String(types.find(t=>String(t.eventTypeId||t.id)===String(selectedType))?.name||"");
    const iconD55O=/חתונ|נישוא/.test(typeNameD55O)?"💍":/בר מצווה/.test(typeNameD55O)?"📖":/בת מצווה/.test(typeNameD55O)?"✦":"✦";
    const headerD55O=document.createElement("div");
    headerD55O.className="event-editor-heading-d55o";
    const nameD55O=document.createElement("strong");
    nameD55O.className="event-editor-name-d55o";
    nameD55O.textContent=String(e.name||"אירוע חדש");
    const symbolD55O=document.createElement("span");
    symbolD55O.className="event-editor-icon-d55o";
    symbolD55O.textContent=iconD55O;
    const statusD55O=document.createElement("span");
    statusD55O.className="event-editor-status-d55o";
    statusD55O.textContent=isTrue(e.enabled,true)?"פעיל":"לא פעיל";
    headerD55O.append(symbolD55O,nameD55O,statusD55O);
    editorFormD55O.before(headerD55O);
    const navD55O=document.createElement("div");
    navD55O.className="event-editor-tabs-d55o";
    navD55O.setAttribute("role","tablist");
    const panesD55O={};
    tabsD55O.forEach(tab=>{
      const b=document.createElement("button");
      b.type="button";b.className="event-editor-tab-d55o";
      b.textContent=tab.title;b.dataset.tab=tab.id;
      b.setAttribute("role","tab");
      const pane=document.createElement("section");
      pane.className="event-editor-pane-d55o";
      pane.dataset.tab=tab.id;
      pane.setAttribute("role","tabpanel");
      panesD55O[tab.id]=pane;
      navD55O.append(b);
    });
    editorFormD55O.prepend(navD55O);
    tabsD55O.forEach(tab=>editorFormD55O.append(panesD55O[tab.id]));
    // Move original nodes, never clone inputs: FormData and existing event handlers stay intact.
    const originalD55O=Array.from(editorFormD55O.children).filter(el=>el!==navD55O&&!Object.values(panesD55O).includes(el));
    const fieldTabD55O={
      navigationAddress:"navigation",rsvpDeadline:"rsvp",rsvpManagerId:"rsvp",
      rsvpClosedMessage:"rsvp",messageSignature:"messages"
    };
    originalD55O.forEach(el=>{
      if(el.id==="eventSaveStatus"||el.classList.contains("actions"))return;
      let target="general";
      if(el.classList.contains("event-image-d5d17"))target="images";
      else if(el.classList.contains("rsvp-admin-settings"))target="rsvp";
      else {
        const field=el.querySelector("[name]");
        if(field)target=fieldTabD55O[field.name]||"general";
      }
      panesD55O[target].append(el);
    });
    const paymentHintD55O=document.createElement("p");
    paymentHintD55O.className="muted";
    paymentHintD55O.textContent="קישורי התשלום מנוהלים במנגנון התשלומים הקיים. אין שינוי בפרטי התשלום או בשליחת הודעות בשלב זה.";
    panesD55O.payment.append(paymentHintD55O);
    const messageHintD55O=document.createElement("p");
    messageHintD55O.className="muted";
    messageHintD55O.textContent="ניהול תבניות WhatsApp ושליחת הודעות נשארים במסכים הייעודיים. אין שינוי בהפרדת TEST ו־PROD.";
    panesD55O.messages.append(messageHintD55O);
    const imageHintD55O=document.createElement("p");
    imageHintD55O.className="muted";
    imageHintD55O.textContent="תמונת ההזמנה הכללית נשמרת ללא שינוי. ניתן להגדיר תמונה נפרדת לכל תבנית TEST או PROD.";
    panesD55O.images.prepend(imageHintD55O);
    // D5D55Z22 FIX11: image cards for TEST and PROD, by template ID.
    if(e.id){
      const dynamicArea=document.createElement('div');dynamicArea.className='event-dynamic-images-d55p';
      dynamicArea.innerHTML='<h3>תמונות לפי סביבה ותבנית</h3><p role="status">טוען תבניות תמונה…</p>';
      panesD55O.images.append(dynamicArea);
      const loadDynamic=async()=>{
        try{
          const ctx=await API.request('eventImageContextD55P',{eventId:e.id});
          const templates=ctx.templates||[];
          dynamicArea.replaceChildren();
          if(!templates.length){const p=document.createElement('p');p.textContent='לא נמצאו תבניות פעילות עם כותרת תמונה.';dynamicArea.append(p);return;}
          for(const t of templates){
            const card=document.createElement('section');card.className='event-dynamic-image-card-d55p';
            const heading=document.createElement('h4');heading.textContent=t.name;
            const meta=document.createElement('p');meta.className='muted';meta.textContent='סביבה: '+(t.environment==='TEST'?'TEST':'PROD')+' | תבנית: '+t.metaName;
            const status=document.createElement('p');status.setAttribute('role','status');status.textContent=t.imageFileId?'תמונה שמורה':'לא הוגדרה תמונה';
            const preview=document.createElement('img');preview.alt='תצוגה מקדימה: '+t.name;preview.hidden=true;preview.style.maxWidth='220px';preview.style.maxHeight='180px';
            const input=document.createElement('input');input.type='file';input.accept='image/png,image/jpeg,image/webp';
            const remove=document.createElement('button');remove.type='button';remove.textContent='הסרת תמונה';remove.disabled=!t.imageFileId;
            const show=async()=>{if(!t.imageFileId){preview.hidden=true;return;}try{const image=await eventViewImageDataLoadD55Q(e.id,t.id);if(image.base64){preview.src='data:'+image.mime+';base64,'+image.base64;preview.hidden=false;}}catch(err){status.textContent='טעינת התמונה נכשלה: '+(err.message||err);}};
            input.onchange=async()=>{const file=input.files&&input.files[0];if(!file)return;if(file.size>4*1024*1024){status.textContent='גודל מרבי 4MB';return;}input.disabled=true;status.textContent='שומר תמונה…';try{const base64=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result).split(',')[1]);reader.onerror=reject;reader.readAsDataURL(file);});const result=await API.request('saveEventImageD55P',{eventId:e.id,templateId:t.id,fileName:file.name,mime:file.type,base64});t.imageFileId=result.imageFileId;eventImageInvalidateD55S(e.id,t.id);remove.disabled=false;status.textContent='התמונה נשמרה בהצלחה';await show();}catch(err){status.textContent='שגיאה: '+(err.message||err);}finally{input.disabled=false;input.value='';}};
            remove.onclick=async()=>{if(!confirm('להסיר את התמונה מתבנית זו?'))return;remove.disabled=true;status.textContent='מסיר תמונה…';try{await API.request('removeEventImageD55P',{eventId:e.id,templateId:t.id});t.imageFileId='';eventImageInvalidateD55S(e.id,t.id);preview.hidden=true;status.textContent='התמונה הוסרה';}catch(err){remove.disabled=false;status.textContent='שגיאה: '+(err.message||err);}};
            card.append(heading,meta,preview,input,remove,status);dynamicArea.append(card);void show();
          }
        }catch(err){dynamicArea.textContent='טעינת תבניות התמונות נכשלה: '+(err.message||err);}
      };
      void loadDynamic();
    }

    const statusNodeD55O=editorFormD55O.querySelector("#eventSaveStatus");
    const actionNodeD55O=editorFormD55O.querySelector(".actions");
    if(statusNodeD55O)editorFormD55O.append(statusNodeD55O);
    if(actionNodeD55O)editorFormD55O.append(actionNodeD55O);
    const selectTabD55O=(id)=>{
      navD55O.querySelectorAll("button").forEach(b=>{
        const active=b.dataset.tab===id;
        b.classList.toggle("active",active);
        b.setAttribute("aria-selected",String(active));
      });
      Object.entries(panesD55O).forEach(([key,pane])=>{pane.hidden=key!==id;});
    };
    navD55O.addEventListener("click",ev=>{
      const b=ev.target.closest("button[data-tab]");
      if(b)selectTabD55O(b.dataset.tab);
    });
    const titleInputD55O=editorFormD55O.querySelector('[name="name"]');
    titleInputD55O?.addEventListener("input",()=>{nameD55O.textContent=titleInputD55O.value.trim()||"אירוע חדש";});
    const activeInputD55O=editorFormD55O.querySelector('[name="enabled"]');
    activeInputD55O?.addEventListener("change",()=>{statusD55O.textContent=activeInputD55O.checked?"פעיל":"לא פעיל";});
    selectTabD55O("general");
  }
  // D5D31: Test direct navigation from the editable address; never send WhatsApp or mutate event data.
  $$("#eventForm [data-navigation-test-d31]").forEach(btn=>btn.addEventListener("click",()=>{
    const address=String($("#eventForm [name=navigationAddress]")?.value||"").trim();
    const status=$("#eventNavigationTestStatusD31");
    if(!address){if(status)status.textContent="יש להזין כתובת לניווט לפני הבדיקה";return;}
    if(status)status.textContent="נפתח ניווט לכתובת המופיעה בשדה. לשמירת השינוי לחץ שמירה.";
    const q=encodeURIComponent(address);
    const url=btn.dataset.navigationTestD31==="waze"
      ?"https://www.waze.com/ul?q="+q+"&navigate=yes"
      :"https://www.google.com/maps/dir/?api=1&destination="+q;
    const popup=window.open(url,"_blank","noopener,noreferrer");
    if(!popup&&status)status.textContent="אם לא נפתחה לשונית, אפשר לאפשר חלונות קופצים עבור localhost ולנסות שוב.";
  }));
  const typeSelect=$("#eventForm [name=eventTypeId]");
  if(typeSelect && !e.id){
    typeSelect.onchange=()=>{const t=eventTypeById(typeSelect.value),cb=$("#eventForm [name=seatingEnabled]");if(cb&&t)cb.checked=isTrue(t.defaultSeatingEnabled,false)};
  }
  const managerSelect=$("#eventForm [name=rsvpManagerId]");
  const managerInfo=$("#rsvpManagerContact");
  const updateManager=()=>{
    if(!managerInfo)return;
    const u=(state.adminData.users||[]).find(x=>String(x.id)===String(managerSelect?.value||''));
    managerInfo.textContent=u?(u.phone?"איש קשר: "+u.name+" · "+displayUserPhone_(u.phone):"למנהל זה חסר מספר טלפון — יש להשלימו בניהול משתמשים"):"";
  };
  managerSelect?.addEventListener("change",updateManager);
  updateManager();
  const imageToggleD5D17=$("#eventHasImageD5D17"),imageControlsD5D17=$("#eventImageControlsD5D17");
  if(imageToggleD5D17)imageToggleD5D17.onchange=async()=>{
    if(imageToggleD5D17.checked){imageControlsD5D17.hidden=false;return;}
    if(e.invitationImageFileId){
      if(!confirm('לבטל את תמונת ההזמנה של האירוע?')){imageToggleD5D17.checked=true;return;}
      try{await API.request('removeEventInvitationImageD5D16',{eventId:e.id});e.invitationImageFileId='';if(typeof tplInvalidateEventImageD29==='function')tplInvalidateEventImageD29(e.id);const local=state.events.find(x=>String(x.id)===String(e.id));if(local)local.invitationImageFileId='';renderEvents();}
      catch(err){imageToggleD5D17.checked=true;$("#eventImageStatusD5D16").textContent=err.message;return;}
    }
    imageControlsD5D17.hidden=true;
  };
  const imageInput=$("#eventImageFileD5D16"),imageStatus=$("#eventImageStatusD5D16");
  if(imageInput)imageInput.onchange=async()=>{const file=imageInput.files?.[0];if(!file)return;if(file.size>4*1024*1024){imageStatus.textContent='גודל מרבי 4MB';return;}imageInput.disabled=true;imageStatus.textContent='מעלה תמונה…';try{const base64=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(String(r.result).split(',')[1]);r.onerror=reject;r.readAsDataURL(file)});const result=await API.request('saveEventInvitationImageD5D16',{eventId:e.id,fileName:file.name,mime:file.type,base64});e.invitationImageFileId=result.imageFileId;if(typeof tplInvalidateEventImageD29==='function')tplInvalidateEventImageD29(e.id);const local=state.events.find(x=>String(x.id)===String(e.id));if(local)local.invitationImageFileId=result.imageFileId;$("#eventImageInfoD5D16").textContent='תמונה שמורה לאירוע';$("#eventImageRemoveD5D16").disabled=false;imageStatus.textContent='התמונה נשמרה בהצלחה';renderEvents();}catch(err){imageStatus.textContent=err.message||String(err);}finally{imageInput.disabled=false;imageInput.value='';}};
  const removeImage=$("#eventImageRemoveD5D16");if(removeImage)removeImage.onclick=async()=>{if(!confirm('להסיר את תמונת ההזמנה מהאירוע?'))return;removeImage.disabled=true;imageStatus.textContent='מסיר תמונה…';try{await API.request('removeEventInvitationImageD5D16',{eventId:e.id});e.invitationImageFileId='';if(typeof tplInvalidateEventImageD29==='function')tplInvalidateEventImageD29(e.id);const local=state.events.find(x=>String(x.id)===String(e.id));if(local)local.invitationImageFileId='';$("#eventImageInfoD5D16").textContent='לא הוגדרה תמונת הזמנה';imageStatus.textContent='התמונה הוסרה';imageToggleD5D17.checked=false;imageControlsD5D17.hidden=true;renderEvents();}catch(err){removeImage.disabled=false;imageStatus.textContent=err.message||String(err);}};
  $("#saveEventBtn").onclick=saveEventForm;
}

async function saveEventForm(ev){
  ev?.preventDefault?.();
  ev?.stopPropagation?.();

  const form=$("#eventForm");
  if(!form) return;

  const status=$("#eventSaveStatus");
  const fd=new FormData(form);
  const o=Object.fromEntries(fd);
  o.seatingEnabled=fd.has("seatingEnabled");
  o.enabled=fd.has("enabled");
  if(state.session?.role==="Admin"){
    const assigned=[];
    if(o.rsvpManagerId) assigned.push(String(o.rsvpManagerId));
    if(o.tableManagerId && !assigned.includes(String(o.tableManagerId))) assigned.push(String(o.tableManagerId));
    o.assignedUserIds=assigned.join(",");
  }

  if(!String(o.name||"").trim()){
    if(status){status.textContent="יש להזין שם אירוע";status.className="event-save-status error";}
    form.querySelector('[name="name"]')?.focus();
    return;
  }

  if(o.rsvpDeadline && !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(o.rsvpDeadline)){
    if(status){status.textContent="מועד סגירת האישורים אינו תקין";status.className="event-save-status error";}
    form.querySelector('[name="rsvpDeadline"]')?.focus();
    return;
  }
  const selectedManager=state.session?.role==="Admin"?(state.adminData.users||[]).find(u=>String(u.id)===String(o.rsvpManagerId)):null;
  if(state.session?.role==="Admin" && o.rsvpDeadline && !selectedManager){
    if(status){status.textContent="יש לבחור מנהל אירוע";status.className="event-save-status error";}
    form.querySelector('[name="rsvpManagerId"]')?.focus();return;
  }
  if(state.session?.role==="Admin" && selectedManager && !String(selectedManager.phone||"").trim()){
    if(status){status.textContent="למנהל הנבחר חסר מספר טלפון. יש להשלימו בניהול משתמשים";status.className="event-save-status error";}
    form.querySelector('[name="rsvpManagerId"]')?.focus();return;
  }
  const saveBtn=$("#saveEventBtn");
  if(saveBtn){saveBtn.disabled=true;saveBtn.innerHTML='<span class="seating-spinner-v171" aria-hidden="true"></span> שומר...';}
  if(status){status.textContent="שומר את האירוע...";status.className="event-save-status working";}

  const started=performance.now();

  try{
    console.log("[Events V1.1.59] saveEvent request",o);
    const r=await API.request("saveEvent",{event:o});
    console.log("[Events V1.1.59] saveEvent response",r);

    if(!r?.event?.id) throw new Error("השרת לא החזיר אישור שמירה תקין");

    const saved=r.event;
    const idx=state.events.findIndex(x=>String(x.id)===String(saved.id));
    if(idx>=0) state.events[idx]=saved;
    else state.events.unshift(saved);

    state.activeEventId=saved.id;
    persistCurrentEvent_();
    try{localStorage.setItem("events_rsvp_event_saved_v1190a4",JSON.stringify({eventId:saved.id,at:Date.now()}))}catch(_){}
    renderAll();

    const elapsed=Math.round(performance.now()-started);
    const serverMs=Number(r?.apiTiming?.totalMs||r?.timing?.totalMs||0);

    if(status){
      status.textContent=`האירוע נשמר בהצלחה${serverMs?` · שרת ${serverMs}ms`:``} · סה"כ ${elapsed}ms`;
      status.className="event-save-status success";
    }

    // Keep the success message in the event modal; do not duplicate it as a global toast.
    setTimeout(()=>{if($("#eventForm")===form)closeModal();},1600);
  }catch(err){
    console.error("[Events V1.1.39] event save failed",err);
    const msg=err?.message||String(err)||"שמירת האירוע נכשלה";
    if(status){status.textContent=msg;status.className="event-save-status error";}
    if(saveBtn){saveBtn.disabled=false;saveBtn.textContent="שמירה";}
  }
}

function selectedGuestEventId_(){
  // read the event that is actually selected in the visible UI first. 
  // This prevents a stale state.activeEventId from feeding the guest form after switching events.
  const pageSelect=$("#activeEventSelect"),globalSelect=$("#currentEventSelect");
  const pageValue=pageSelect&&!pageSelect.disabled?String(pageSelect.value||''):'';
  const globalValue=globalSelect&&!globalSelect.disabled?String(globalSelect.value||''):'';
  return pageValue||globalValue||String(state.activeEventId||'');
}
function guestForm(g={},forcedEventId=''){
  const isEdit=!!(g.guestId||g.id);
  const requestedEventId=isEdit?String(g.eventId||''):String(forcedEventId||selectedGuestEventId_()||'');
  const ev=state.events.find(e=>eventKey_(e)===requestedEventId)||(!isEdit?activeEvent():null);
  if(!ev){showToast('יש לבחור אירוע קודם','error');return;}
  const eventId=eventKey_(ev);
  const eventTypeId=String(ev.eventTypeId||'');
  const type=eventTypeById(eventTypeId);
  if(!type){showToast('סוג האירוע לא נמצא בנתונים שנטענו. בצע Ctrl+F5.','error');return;}
  const showSides=isTrue(type.usesSides,false),showGroups=isTrue(type.usesGroups,false);
  // strict lookup only for the event type captured above; no active/global fallback. 
  const scopedSides=showSides?strictScopedLookup_('sides',eventTypeId):[];
  const scopedGroups=showGroups?strictScopedLookup_('groups',eventTypeId):[];
  const scopedOptionHtml=(kind,rows,selected)=>rows
    .map(x=>{const key=lookupKey_(kind,x);return `<option value="${esc(key)}" ${String(key)===String(selected)?"selected":""}>${esc(lookupDisplay_(kind,x))}</option>`})
    .join('');
  const isNew=!isEdit,send=isNew?true:guestSendChecked(g);
  const sideSelected=isEdit?(g.sideId||''):'';
  const groupSelected=isEdit?(g.groupId||''):'';
  const sideField=showSides?`<label>צד <span class="required-star">*</span><select name="sideId" required><option value="">בחר צד...</option>${scopedOptionHtml('sides',scopedSides,sideSelected)}</select></label>`:'';
  const groupField=showGroups?`<label>קבוצה <span class="required-star">*</span><select name="groupId" required><option value="">בחר קבוצה...</option>${scopedOptionHtml('groups',scopedGroups,groupSelected)}</select></label>`:'';
  const status=g.rsvpStatus||g.status||'Pending',invited=g.invitedCount||g.partySize||1,confirmed=(g.confirmedCount??(status==='Confirmed'?invited:0));
  modal(`<h2>${(g.guestId||g.id)?'עריכת':'הוספת'} מוזמן</h2><p class="guest-event-context"><b>אירוע:</b> ${esc(ev?.name||'—')} · <b>סוג:</b> ${esc(type?.name||'—')} <small>(${showSides?scopedSides.length:0} צדדים · ${showGroups?scopedGroups.length:0} קבוצות)</small></p><form id="guestForm" class="form-grid guest-form-z12" onsubmit="return false;">
  <input type="hidden" name="eventId" value="${esc(eventId)}">
  <label>שם <span class="required-star">*</span><input name="name" required value="${esc(g.name||'')}"></label><label>טלפון <span class="required-star">*</span><input name="phone" required inputmode="tel" placeholder="0501234567" value="${esc(g.phone||'')}"></label><label>פנייה אישית <span class="required-star">*</span><input name="invitationGreeting" required maxlength="120" placeholder="לדוגמה: משפחת כהן היקרה" value="${esc(g.invitationGreeting||'')}"></label>
  ${sideField}${groupField}
  <label>מספר מוזמנים <span class="required-star">*</span><input name="invitedCount" type="number" min="1" step="1" required value="${invited}"></label>
  <label>מספר שאישרו<input name="confirmedCount" type="number" min="0" step="1" value="${confirmed}"></label>
  <label>סטטוס אישור הגעה<select name="rsvpStatus">${optionHtml('statuses',status)}</select></label>
  <label class="guest-send-switch-z12"><span>שליחה ב־WhatsApp</span><span class="guest-switch-track-z12"><input name="sendWhatsApp" type="checkbox" ${send?'checked':''} aria-label="שליחה ב־WhatsApp"><span class="guest-switch-thumb-z12" aria-hidden="true"></span></span></label>
  <label style="grid-column:1/-1">הערות<textarea name="notes">${esc(g.notes||'')}</textarea></label>
  <input type="hidden" name="eventId" value="${esc(eventId)}"><input type="hidden" name="id" value="${esc(g.guestId||g.id||'')}"><input type="hidden" name="guestId" value="${esc(g.guestId||g.id||'')}"><div id="guestFormStatusV182" class="guest-form-status-v182" role="alert" aria-live="assertive" hidden></div><div class="actions"><button type="button" id="saveGuestBtn" class="primary guest-save-z12"><span aria-hidden="true">💾</span> שמירה</button></div></form>`);
  const statusEl=$("#guestForm [name=rsvpStatus]"), invitedEl=$("#guestForm [name=invitedCount]"), confirmedEl=$("#guestForm [name=confirmedCount]");
  if(statusEl)statusEl.onchange=()=>{if(statusEl.value==='Declined'||statusEl.value==='Pending')confirmedEl.value=0;else if(statusEl.value==='Confirmed'&&(+confirmedEl.value||0)===0)confirmedEl.value=+invitedEl.value||1};
  if(confirmedEl)confirmedEl.oninput=()=>{statusEl.value=(+confirmedEl.value||0)>0?'Confirmed':'Pending'};
  if(invitedEl)invitedEl.onchange=()=>{if(+confirmedEl.value>(+invitedEl.value||1))confirmedEl.value=+invitedEl.value||1};
  $("#saveGuestBtn").onclick=saveGuestForm;
}

function guestSeatingDetailsZ15_(g){
  const st=state.seating?.eventId===String(state.activeEventId)?state.seating:null;
  if(!st)return '<section class="guest-detail-seating-z15"><b>שיוך לשולחנות:</b> <span class="muted">נתוני השיוך טרם נטענו</span></section>';
  const gid=String(g.guestId||g.id||'');
  const mine=(st.assignments||[]).filter(a=>String(a.guestId)===gid);
  if(!mine.length)return '<section class="guest-detail-seating-z15"><b>שיוך לשולחנות:</b> <span>טרם שויך לשולחן</span></section>';
  const items=mine.map(a=>{
    const t=(st.tables||[]).find(t=>String(t.id)===String(a.tableId));
    const no=t?.tableNumber||'—';
    const label=t?.name||t?.tableName||'';
    return '<li><b>שולחן '+esc(no)+'</b>'+(label?' — '+esc(label):'')+' · '+esc(String(Number(a.seats)||0))+' מקומות</li>';
  }).join('');
  return '<section class="guest-detail-seating-z15"><b>שיוך לשולחנות:</b><ul>'+items+'</ul></section>';
}
function guestDetails(g){
  const type=eventTypeById(activeEvent()?.eventTypeId),parts=[],status=g.rsvpStatus||g.status||"Pending";
  if(type&&isTrue(type.usesSides,false))parts.push(`<b>צד:</b> ${esc(labelFor("sides",g.sideId||g.side,activeEvent()?.eventTypeId))}`);
  if(type&&isTrue(type.usesGroups,false))parts.push(`<b>קבוצה:</b> ${esc(labelFor("groups",g.groupId||g.group,activeEvent()?.eventTypeId))}`);
  modal(`<h2>${esc(g.name)}</h2><p><b>Guest ID:</b> ${esc(g.guestId||g.id)}</p><p><b>טלפון:</b> ${esc(g.phone)}</p>${parts.length?`<p>${parts.join(" | ")}</p>`:""}
  <p><b>מספר מוזמנים:</b> ${g.invitedCount||g.partySize||1} · <b>אישרו:</b> ${g.confirmedCount||0}</p><p><b>סטטוס:</b> ${esc(statusText(status))}</p>
  ${guestSeatingDetailsZ15_(g)}<p><b>פנייה אישית:</b> ${esc(g.invitationGreeting||"—")}</p><p><b>שליחה:</b> ${guestSendChecked(g)?"מסומן — יקבל הודעת WhatsApp":"לא מסומן"}</p><p><b>הערות:</b> ${esc(g.notes||"—")}</p>
  <div class="actions"><button class="primary" id="detailEdit">עריכה</button><button class="danger" id="detailDelete">🗑</button></div>`);
  $("#detailEdit").onclick=()=>guestForm(g);$("#detailDelete").onclick=async()=>{await deleteGuestV179_(g)}
}

/* ---------- Admin / Settings ---------- */
const adminTitles={eventTypes:"סוגי אירועים",sides:"צד",groups:"קבוצה",statuses:"סטטוס",users:"משתמשי מערכת",roles:"תפקידים",permissions:"ניהול הרשאות",whatsapp:"חיבור ל-WhatsApp",systemValues:"הגדרות מערכת",whatsappCosts:"עלויות WhatsApp",versions:"גרסאות"};
function renderAdmin(){
  const c=$("#adminContent");if(!c||state.session?.role!=="Admin")return;
  // never read the main event from the DOM here. renderAll() renders 
  // Admin before rebuilding the main selector, so the DOM may still contain the
  // previous event. state.activeEventId is the authoritative value.
  if(["sides","groups"].includes(state.adminTab) && !state.adminLookupManualOverride){
    const active=activeEvent();
    const activeTypeId=String(active?.eventTypeId||"");
    if(activeTypeId){
      state.adminLookupEventTypeId=activeTypeId;
      state.adminLookupBoundEventId=String(state.activeEventId||"");
    }
  }
  $$("#adminTabs [data-admin-tab]").forEach(b=>b.classList.toggle("active",b.dataset.adminTab===state.adminTab));
  if(state.adminTab==="versions"){c.innerHTML=`<h2>גרסאות</h2><p>Frontend: <b>${esc(APP_VERSION.FRONTEND_VERSION)}</b></p><p>Server: <b>${esc(state.serverVersion||"טרם נטען")}</b></p><div class="admin-section-head"><h3>בדיקת תקינות ואופטימיזציה</h3></div><p>בדיקה מלאה לקריאות גיליונות, Handlers, מזהים כפולים וקישורים בין אירועים, מוזמנים, צדדים, קבוצות ושולחנות.</p><div class="actions"><button type="button" class="primary run-system-health">בדיקת תקינות מלאה</button></div><div id="systemHealthResult" class="event-save-status" aria-live="polite"></div><div class="admin-section-head"><h3>בדיקת שיוך סוג אירוע</h3></div><p>הבדיקה מאתרת אירועים ששמם מצביע באופן חד-משמעי על סוג אירוע אחר מזה ששמור ב-eventTypeId.</p><div class="actions"><button type="button" class="check-event-type-assignments">בדיקה בלבד</button><button type="button" class="primary repair-event-type-assignments">בדיקה ותיקון</button></div><div id="eventTypeAssignmentResult" class="event-save-status" aria-live="polite"></div>`;return}
  if(state.adminTab==="eventTypes")return renderEventTypesAdmin();
  if(["sides","groups","statuses"].includes(state.adminTab)) return renderLookupAdmin(state.adminTab);
  if(state.adminTab==="users")return renderUsersAdmin();
  if(state.adminTab==="roles")return renderRolesAdmin();
  if(state.adminTab==="permissions")return renderPermissionsAdmin();
  if(state.adminTab==="whatsapp")return renderWhatsAppAdmin();
  if(state.adminTab==="systemValues")return renderSystemValuesAdminZ53_();
  if(state.adminTab==="whatsappCosts")return renderWhatsAppCostsAdminZ53B3_();
}
function boolText(v){return isTrue(v,false)?"כן":"לא"}
function adminTable(title,addClass,headers,rows){
  return `<div class="admin-section-head"><h2>${esc(title)}</h2><button class="primary ${addClass}">+ הוספה</button></div><div class="table-wrap"><table class="admin-table"><thead><tr>${headers.map(h=>`<th>${esc(h)}</th>`).join("")}<th></th></tr></thead><tbody>${rows||'<tr><td colspan="99">אין רשומות</td></tr>'}</tbody></table></div>`;
}
function renderEventTypesAdmin(){
  const rows=(state.eventTypes||[]).map(x=>`<tr><td>${esc(x.name)}</td><td>${boolText(x.usesSides)}</td><td>${boolText(x.usesGroups)}</td><td>${boolText(x.defaultSeatingEnabled)}</td><td>${+x.sortOrder||0}</td><td>${boolText(x.active)}</td><td><button class="edit-event-type" data-id="${esc(x.eventTypeId||x.id)}">עריכה</button> <button class="danger delete-event-type" data-id="${esc(x.eventTypeId||x.id)}">🗑</button></td></tr>`).join("");
  $("#adminContent").innerHTML=adminTable("סוגי אירועים","add-event-type",["שם","צדדים","קבוצות","שולחנות ברירת מחדל","סדר","פעיל"],rows);
}
function eventTypeForm(x={}){
  modal(`<h2>${x.eventTypeId||x.id?"עריכת":"הוספת"} סוג אירוע</h2><form id="eventTypeForm" class="form-grid" onsubmit="return false;">
  <input type="hidden" name="eventTypeId" value="${esc(x.eventTypeId||x.id||"")}">
  <label>שם סוג אירוע <span class="required-star">*</span><input name="name" required value="${esc(x.name||"")}"></label>
  <label>סדר<input type="number" name="sortOrder" value="${+x.sortOrder||0}"></label>
  <label class="check-label"><input type="checkbox" name="usesSides" ${isTrue(x.usesSides,true)?"checked":""}> משתמש בצדדים</label>
  <label class="check-label"><input type="checkbox" name="usesGroups" ${isTrue(x.usesGroups,true)?"checked":""}> משתמש בקבוצות</label>
  <label class="check-label"><input type="checkbox" name="defaultSeatingEnabled" ${isTrue(x.defaultSeatingEnabled,false)?"checked":""}> ניהול שולחנות כברירת מחדל</label>
  <label class="check-label"><input type="checkbox" name="active" ${isTrue(x.active,true)?"checked":""}> פעיל</label>
  <div class="actions"><button type="button" id="saveEventTypeBtn" class="primary">שמירה</button></div></form>`);
  $("#saveEventTypeBtn").onclick=saveEventTypeForm;
}
async function saveEventTypeForm(){
  const form=$("#eventTypeForm");if(!form||!form.reportValidity())return;
  const fd=new FormData(form),o=Object.fromEntries(fd);o.usesSides=fd.has("usesSides");o.usesGroups=fd.has("usesGroups");o.defaultSeatingEnabled=fd.has("defaultSeatingEnabled");o.active=fd.has("active");
  const isEdit=!!o.eventTypeId,started=performance.now();setFormBusy(form,true);
  try{const r=await API.request("saveEventType",{eventType:o});if(!r?.eventType?.eventTypeId)throw new Error("השרת לא החזיר אישור שמירה תקין");upsertLocal_(state.eventTypes,Object.assign({},r.eventType,{id:r.eventType.eventTypeId}));state.adminData.eventTypes=state.eventTypes;renderAll();mutationDone_(isEdit?"סוג האירוע עודכן":"סוג האירוע נוסף",r,started);closeModal()}catch(err){setFormBusy(form,false);showToast(err?.message||String(err),"error")}
}
function eligibleEventTypesForLookup_(kind){
  const field=kind==="sides"?"usesSides":"usesGroups";
  return (state.eventTypes||[]).filter(t=>isTrue(t[field],false)).sort((a,b)=>(+a.sortOrder||0)-(+b.sortOrder||0));
}
function ensureAdminLookupEventType_(kind){
  const eligible=eligibleEventTypesForLookup_(kind);
  const activeType=String(activeEvent()?.eventTypeId||"");

  // unless the user explicitly changed the local Admin EventType combo, 
  // both the combo AND the table rows must use the current main event type.
  if(!state.adminLookupManualOverride && eligible.some(t=>String(t.eventTypeId||t.id)===activeType)){
    state.adminLookupEventTypeId=activeType;
    state.adminLookupBoundEventId=String(state.activeEventId||"");
    return activeType;
  }

  if(eligible.some(t=>String(t.eventTypeId||t.id)===String(state.adminLookupEventTypeId)))return state.adminLookupEventTypeId;
  if(eligible.some(t=>String(t.eventTypeId||t.id)===activeType)){state.adminLookupEventTypeId=activeType;return activeType;}
  state.adminLookupEventTypeId=eligible[0]?.eventTypeId||eligible[0]?.id||null;
  return state.adminLookupEventTypeId;
}
function renderLookupAdmin(kind){
  const scoped=kind==="sides"||kind==="groups";
  let list=state.lookups[kind]||[],scopeHtml="";
  if(scoped){
    const selected=ensureAdminLookupEventType_(kind),eligible=eligibleEventTypesForLookup_(kind);
    if(!eligible.length){$("#adminContent").innerHTML=`<h2>${esc(adminTitles[kind])}</h2><div class="empty">אין סוגי אירועים שמוגדרים להשתמש ב${kind==="sides"?"צדדים":"קבוצות"}.</div>`;return;}
    list=list.filter(x=>String(x.eventTypeId)===String(selected));
    scopeHtml=`<div class="admin-lookup-scope"><label>סוג אירוע<select id="adminLookupEventTypeSelect">${eligible.map(t=>`<option value="${esc(t.eventTypeId||t.id)}" ${String(t.eventTypeId||t.id)===String(selected)?"selected":""}>${esc(t.name)}</option>`).join("")}</select></label></div>`;
  }
  const rows=list.map(x=>`<tr><td>${esc(x.value)}</td><td>${esc(x.label)}</td><td>${+x.sortOrder||0}</td><td>${boolText(x.active)}</td><td><button class="edit-lookup" data-kind="${kind}" data-id="${x.id}">עריכה</button> <button class="danger delete-lookup" data-kind="${kind}" data-id="${x.id}">🗑</button></td></tr>`).join("");
  $("#adminContent").innerHTML=scopeHtml+adminTable(adminTitles[kind],"add-lookup",[kind==="sides"?"שם":"ערך","תיאור","סדר","פעיל"],rows);
  $(".add-lookup").dataset.kind=kind;
  const scope=$("#adminLookupEventTypeSelect");if(scope)scope.onchange=e=>{
    applyAdminLookupScope_(e.target.value,true);
  };
}

// one shared path for changing the EventType scope in Side/Group admin. 
// The internal combo uses manual=true. The main event selector uses manual=false.
// Both therefore rebuild the visible rows through the exact same render function.
function applyAdminLookupScope_(eventTypeId,manual=false){
  const typeId=String(eventTypeId||"");
  state.adminLookupEventTypeId=typeId||null;
  state.adminLookupBoundEventId=String(state.activeEventId||"");
  state.adminLookupManualOverride=!!manual;
  if(["sides","groups"].includes(state.adminTab)) renderLookupAdmin(state.adminTab);
}
function renderUsersAdmin(){
  const rows=(state.adminData.users||[]).map(x=>`<tr><td>${esc(x.name)}</td><td>${esc(x.email)}</td><td>${esc(displayUserPhone_(x.phone))}</td><td>${esc(roleLabel(x.role))}</td><td>${boolText(x.active)}</td><td><button class="edit-user" data-id="${x.id}">עריכה</button> <button class="danger delete-user" data-id="${x.id}">🗑</button></td></tr>`).join("");
  $("#adminContent").innerHTML=adminTable("משתמשי מערכת","add-user",["שם","אימייל","טלפון","תפקיד","פעיל"],rows);
}
function roleLabel(v){return (state.adminData.roles||[]).find(r=>r.value===v)?.label||v}
function renderRolesAdmin(){
  const rows=(state.adminData.roles||[]).map(x=>`<tr><td>${esc(x.value)}</td><td>${esc(x.label)}</td><td>${+x.sortOrder||0}</td><td>${boolText(x.active)}</td><td><button class="edit-role" data-id="${x.id}">עריכה</button> <button class="danger delete-role" data-id="${x.id}">🗑</button></td></tr>`).join("");
  $("#adminContent").innerHTML=adminTable("תפקידים","add-role",["קוד","שם תפקיד","סדר","פעיל"],rows);
}
function renderPermissionsAdmin(){
  const rows=(state.adminData.permissions||[]).map(x=>`<tr><td>${esc(roleLabel(x.role))}</td><td>${esc(x.permissionKey)}</td><td>${boolText(x.allowed)}</td><td>${esc(x.notes||"")}</td><td><button class="edit-permission" data-id="${x.id}">עריכה</button> <button class="danger delete-permission" data-id="${x.id}">🗑</button></td></tr>`).join("");
  $("#adminContent").innerHTML=adminTable("ניהול הרשאות","add-permission",["תפקיד","מפתח הרשאה","מאושר","הערות"],rows);
}
function renderWhatsAppAdmin(){
  const rows=(state.adminData.whatsapp||[]).map(x=>`<tr><td>${esc(x.name)}</td><td><strong>${esc(String(x.environment||'PRODUCTION').toUpperCase())}</strong></td><td>${esc(x.phoneNumberId)}</td><td>${esc(x.wabaId)}</td><td>${esc(x.apiVersion||"")}</td><td>${boolText(x.enabled)}</td><td>${isTrue(x.hasAccessToken)?"מוגדר":"חסר"}</td><td><button class="edit-wa" data-id="${x.id}">עריכה</button> <button class="danger delete-wa" data-id="${x.id}">🗑</button></td></tr>`).join("");
  $("#adminContent").innerHTML=adminTable("חיבור ל-WhatsApp דרך Meta Web API","add-wa",["שם","סביבה","Phone Number ID","WABA ID","API","פעיל","Access Token"],rows);
}
function lookupForm(kind,x={}){
  const scoped=kind==="sides"||kind==="groups",eventTypeId=scoped?(x.eventTypeId||ensureAdminLookupEventType_(kind)):"";
  const type=eventTypeById(eventTypeId);
  const scopeFields=scoped?`<input type="hidden" name="eventTypeId" value="${esc(eventTypeId||"")}"><label>סוג אירוע<input value="${esc(type?.name||"")}" disabled></label>`:"";
  modal(`<h2>${x.id?"עריכת":"הוספת"} ${esc(adminTitles[kind])}</h2><form id="lookupForm" class="form-grid" onsubmit="return false;">
  <input type="hidden" name="kind" value="${kind}"><input type="hidden" name="id" value="${esc(x.id||"")}">${scopeFields}
  <label>${kind==="sides"?"שם":"ערך"} <span class="required-star">*</span><input name="value" required value="${esc(x.value||"")}"></label><label>תיאור <span class="required-star">*</span><input name="label" required value="${esc(x.label||"")}"></label>
  <label>סדר<input name="sortOrder" type="number" value="${+x.sortOrder||0}"></label><label class="check-label"><input type="checkbox" name="active" ${isTrue(x.active,true)?"checked":""}> פעיל</label>
  <div class="actions"><button type="button" id="saveLookupBtn" class="primary">שמירה</button></div></form>`);
  $("#saveLookupBtn").onclick=saveLookupForm;
}
function roleOptions(selected){return (state.adminData.roles||[]).filter(r=>isTrue(r.active,true)||r.value===selected).map(r=>`<option value="${esc(r.value)}" ${r.value===selected?"selected":""}>${esc(r.label)}</option>`).join("")}
function userForm(x={}){
  modal(`<h2>${x.id?"עריכת":"הוספת"} משתמש</h2><form id="userForm" class="form-grid" onsubmit="return false;"><input type="hidden" name="id" value="${esc(x.id||"")}">
  <label>שם <span class="required-star">*</span><input name="name" required value="${esc(x.name||"")}"></label><label>אימייל <span class="required-star">*</span><input type="email" name="email" required value="${esc(x.email||"")}"></label>
  <label>מספר טלפון<input type="tel" name="phone" dir="ltr" maxlength="30" value="${esc(displayUserPhone_(x.phone))}" placeholder="0501234567"></label>
  <label>סיסמה ${x.id?"(השאר ריק ללא שינוי)":"<span class='required-star'>*</span>"}<input type="password" name="password" ${x.id?"":"required"}></label><label>תפקיד <span class="required-star">*</span><select name="role" required>${roleOptions(x.role||"EventManager")}</select></label>
  <label class="check-label"><input type="checkbox" name="active" ${isTrue(x.active,true)?"checked":""}> פעיל</label><div class="actions"><button type="button" id="saveUserBtn" class="primary">שמירה</button></div></form>`);
  $("#saveUserBtn").onclick=saveUserForm;
}
function roleForm(x={}){
  modal(`<h2>${x.id?"עריכת":"הוספת"} תפקיד</h2><form id="roleForm" class="form-grid" onsubmit="return false;"><input type="hidden" name="id" value="${esc(x.id||"")}">
  <label>קוד תפקיד <span class="required-star">*</span><input name="value" required value="${esc(x.value||"")}"></label><label>שם תפקיד <span class="required-star">*</span><input name="label" required value="${esc(x.label||"")}"></label>
  <label>סדר<input type="number" name="sortOrder" value="${+x.sortOrder||0}"></label><label class="check-label"><input type="checkbox" name="active" ${isTrue(x.active,true)?"checked":""}> פעיל</label>
  <div class="actions"><button type="button" id="saveRoleBtn" class="primary">שמירה</button></div></form>`);
  $("#saveRoleBtn").onclick=saveRoleForm;
}
function permissionForm(x={}){
  modal(`<h2>${x.id?"עריכת":"הוספת"} הרשאה</h2><form id="permissionForm" class="form-grid" onsubmit="return false;"><input type="hidden" name="id" value="${esc(x.id||"")}">
  <label>תפקיד <span class="required-star">*</span><select name="role" required>${roleOptions(x.role||"EventManager")}</select></label><label>מפתח הרשאה <span class="required-star">*</span><input name="permissionKey" required placeholder="guests.edit" value="${esc(x.permissionKey||"")}"></label>
  <label class="check-label"><input type="checkbox" name="allowed" ${isTrue(x.allowed,true)?"checked":""}> מאושר</label>
  <label style="grid-column:1/-1">הערות<textarea name="notes">${esc(x.notes||"")}</textarea></label><div class="actions"><button type="button" id="savePermissionBtn" class="primary">שמירה</button></div></form>`);
  $("#savePermissionBtn").onclick=savePermissionForm;
}
function whatsappForm(x={}){
  modal(`<h2>${x.id?"עריכת":"הוספת"} חיבור WhatsApp</h2><form id="waForm" class="form-grid" onsubmit="return false;"><input type="hidden" name="id" value="${esc(x.id||"")}">
  <label>סביבה <span class="required-star">*</span><select name="environment" required><option value="PRODUCTION" ${String(x.environment||'PRODUCTION').toUpperCase()==='PRODUCTION'?'selected':''}>PRODUCTION</option><option value="TEST" ${String(x.environment||'').toUpperCase()==='TEST'?'selected':''}>TEST</option></select></label>
  <label>שם חיבור <span class="required-star">*</span><input name="name" required value="${esc(x.name||"")}"></label><label>Phone Number ID <span class="required-star">*</span><input name="phoneNumberId" required value="${esc(x.phoneNumberId||"")}"></label>
  <label>WhatsApp Business Account ID (WABA) <span class="required-star">*</span><input name="wabaId" required value="${esc(x.wabaId||"")}"></label><label>Meta App ID<input name="appId" value="${esc(x.appId||"")}"></label>
  <label>Graph API Version<input name="apiVersion" value="${esc(x.apiVersion||"v23.0")}"></label><label>קידומת מדינה<input name="defaultCountryCode" value="${esc(x.defaultCountryCode||"972")}"></label>
  <label>Access Token ${x.id&&isTrue(x.hasAccessToken)?"(מוגדר — השאר ריק ללא שינוי)":""}<input type="password" name="accessToken" autocomplete="off"></label>
  <label>Webhook Verify Token ${x.id&&isTrue(x.hasVerifyToken)?"(מוגדר — השאר ריק ללא שינוי)":""}<input type="password" name="webhookVerifyToken" autocomplete="off"></label>
  <label class="check-label"><input type="checkbox" name="enabled" ${isTrue(x.enabled,false)?"checked":""}> חיבור פעיל</label>
  <p class="muted" style="grid-column:1/-1">הטוקנים הסודיים נשמרים ב-Script Properties ולא בגיליון.</p>
  <div class="actions"><button type="button" id="saveWaBtn" class="primary">שמירה</button></div></form>`);
  $("#saveWaBtn").onclick=saveWhatsAppForm;
}

function guestFormStatusV183_(message,type='error'){
  const el=$('#guestFormStatusV182');
  if(!el)return;
  el.textContent=String(message||'');
  el.className=`guest-form-status-v182 ${type}`;
  el.hidden=false;
}
function guestFormErrorV182_(message){
  guestFormStatusV183_(message||'שגיאה בשמירת המוזמן','error');
}
async function saveGuestForm(){
  const form=$('#guestForm');if(!form||!form.reportValidity())return;
  const fd=new FormData(form),o=Object.fromEntries(fd);
  o.eventId=o.eventId||state.activeEventId;
  o.invitedCount=+o.invitedCount||1;
  o.confirmedCount=Math.max(0,+o.confirmedCount||0);
  o.sendWhatsApp=fd.has('sendWhatsApp');
  if(o.confirmedCount>o.invitedCount){guestFormErrorV182_('מספר המאשרים לא יכול להיות גדול ממספר המוזמנים');return}
  if(o.confirmedCount>0)o.rsvpStatus='Confirmed';
  else if(o.rsvpStatus==='Confirmed')o.rsvpStatus='Pending';
  else o.confirmedCount=0;
  const statusBox=$('#guestFormStatusV182');
  if(statusBox){statusBox.hidden=true;statusBox.textContent='';}
  const isEdit=!!o.id,started=performance.now();
  setFormBusy(form,true);
  const saveBtn=form.querySelector("#saveGuestBtn");
  if(saveBtn){saveBtn.dataset.previousHtml=saveBtn.innerHTML;saveBtn.innerHTML='<span class="seating-spinner-v171" aria-hidden="true"></span> שומר...';}
  try{
    const r=await API.request('saveGuest',{guest:o});
    if(!r?.guest?.guestId)throw new Error('השרת לא החזיר guestId תקין');
    upsertLocal_(state.guests,r.guest,true);
    renderAll();
    // The form stays open while the successful server response is displayed.
    // Never use a global toast for this guest-save path.
    const warnings=Array.isArray(r.warnings)?r.warnings:[];
    const msg=warnings.length
      ?`המוזמן נשמר בהצלחה. אזהרה: מספר הטלפון מופיע אצל ${warnings.length} מוזמן/ים נוספים באירוע.`
      :(isEdit?'המוזמן עודכן בהצלחה':'המוזמן נוסף בהצלחה');
    guestFormStatusV183_(msg,warnings.length?'warning':'success');
    const savedForm=form;
    setTimeout(()=>{if($('#guestForm')===savedForm)closeModal()},2300);
  }catch(err){
    setFormBusy(form,false);
    if(saveBtn)saveBtn.innerHTML=saveBtn.dataset.previousHtml||'💾 שמירה';
    guestFormErrorV182_(err?.message||String(err));
  }
}
async function saveTableForm(){
  const form=$("#tableForm");if(!form||!form.reportValidity())return;const o=Object.fromEntries(new FormData(form));o.eventId=state.activeEventId;o.seats=+o.seats||0;const isEdit=!!o.id,started=performance.now();setFormBusy(form,true);
  try{const r=await API.request("saveTable",{table:o});if(!r?.table?.id)throw new Error("השרת לא החזיר אישור שמירה תקין");upsertLocal_(state.tables,r.table,true);
    // Keep the event-scoped seating snapshot in sync with table CRUD immediately.
    // Occupancy is derived from assignments, never reset by a table save.
    if(state.seating&&String(state.seating.eventId)===String(o.eventId)){
      const tableId=String(r.table.id);
      const occupied=(state.seating.assignments||[]).filter(a=>String(a.tableId)===tableId)
        .reduce((sum,a)=>sum+Math.max(0,Number(a.seats)||0),0);
      const seats=Math.max(0,Number(r.table.seats)||0);
      upsertLocal_(state.seating.tables,{...r.table,seats,occupied,free:Math.max(0,seats-occupied)});
    }
    closeModal();renderAll();mutationDone_(isEdit?"השולחן עודכן":"השולחן נוסף",r,started);await refreshSeatingAfterTableCrudV173_(o.eventId)}catch(err){setFormBusy(form,false);showToast(err?.message||String(err),"error")}
}
function applyLookupMutationLocal_(kind,item){
  if(!item)return;
  if(!state.lookups[kind])state.lookups[kind]=[];
  const id=String(item.id||item.sideId||item.groupId||'');
  const i=state.lookups[kind].findIndex(x=>String(x.id||x.sideId||x.groupId||'')===id);
  if(i>=0)state.lookups[kind][i]=item;
  else state.lookups[kind].push(item);
  rebuildLookupIndex_();
}
async function saveLookupForm(){
  const form=$("#lookupForm");if(!form||!form.reportValidity())return;const fd=new FormData(form),o=Object.fromEntries(fd),kind=o.kind;delete o.kind;o.active=fd.has("active");const isEdit=!!o.id,started=performance.now();setFormBusy(form,true);
  try{
    const r=await API.request("saveLookup",{kind,item:o});
    if(!r?.item?.id)throw new Error("השרת לא החזיר אישור שמירה תקין");
    applyLookupMutationLocal_(kind,r.item);
    if((kind==="sides"||kind==="groups")&&r.item.eventTypeId)state.adminLookupEventTypeId=r.item.eventTypeId;
    closeModal();
    // One server write only; all dependent UI is refreshed from the returned row.
    renderLookupFilters();
    renderGuests();
    renderAdmin();
    mutationDone_(isEdit?"הערך עודכן":"הערך נוסף",r,started);
  }catch(err){setFormBusy(form,false);showToast(err?.message||String(err),"error")}
}

async function saveUserForm(){
  const form=$("#userForm");if(!form||!form.reportValidity())return;const fd=new FormData(form),o=Object.fromEntries(fd);o.active=fd.has("active");const isEdit=!!o.id,started=performance.now();setFormBusy(form,true);
  try{const r=await API.request("saveUser",{user:o});if(!r?.user?.id)throw new Error("השרת לא החזיר אישור שמירה תקין");upsertLocal_(state.adminData.users,r.user);renderAll();mutationDone_(isEdit?"המשתמש עודכן":"המשתמש נוסף",r,started);closeModal()}catch(err){setFormBusy(form,false);showToast(err?.message||String(err),"error")}
}
async function saveRoleForm(){
  const form=$("#roleForm");if(!form||!form.reportValidity())return;const fd=new FormData(form),o=Object.fromEntries(fd);o.active=fd.has("active");const isEdit=!!o.id,started=performance.now();setFormBusy(form,true);
  try{const r=await API.request("saveRole",{role:o});if(!r?.role?.id)throw new Error("השרת לא החזיר אישור שמירה תקין");upsertLocal_(state.adminData.roles,r.role);renderAll();mutationDone_(isEdit?"התפקיד עודכן":"התפקיד נוסף",r,started);closeModal()}catch(err){setFormBusy(form,false);showToast(err?.message||String(err),"error")}
}
async function savePermissionForm(){
  const form=$("#permissionForm");if(!form||!form.reportValidity())return;const fd=new FormData(form),o=Object.fromEntries(fd);o.allowed=fd.has("allowed");const isEdit=!!o.id,started=performance.now();setFormBusy(form,true);
  try{const r=await API.request("savePermission",{permission:o});if(!r?.permission?.id)throw new Error("השרת לא החזיר אישור שמירה תקין");upsertLocal_(state.adminData.permissions,r.permission);renderAll();mutationDone_(isEdit?"ההרשאה עודכנה":"ההרשאה נוספה",r,started);closeModal()}catch(err){setFormBusy(form,false);showToast(err?.message||String(err),"error")}
}
async function saveWhatsAppForm(){
  const form=$("#waForm");if(!form||!form.reportValidity())return;const fd=new FormData(form),o=Object.fromEntries(fd);o.enabled=fd.has("enabled");const isEdit=!!o.id,started=performance.now();setFormBusy(form,true);
  try{const r=await API.request("saveWhatsAppConfig",{config:o});if(!r?.config?.id)throw new Error("השרת לא החזיר אישור שמירה תקין");upsertLocal_(state.adminData.whatsapp,r.config);renderAll();mutationDone_(isEdit?"חיבור WhatsApp עודכן":"חיבור WhatsApp נוסף",r,started);closeModal()}catch(err){setFormBusy(form,false);showToast(err?.message||String(err),"error")}
}


function renderSystemHealthResult_(r){
  const el=$("#systemHealthResult");
  if(!el)return;
  const issues=r?.issues||[],warnings=r?.warnings||[];
  const head=r?.ok?`תקין · 0 תקלות · ${warnings.length} אזהרות · ${Number(r?.totalMs||0)}ms`:`נמצאו ${issues.length} תקלות · ${warnings.length} אזהרות · ${Number(r?.totalMs||0)}ms`;
  const details=[...issues.map(x=>`תקלה: ${x.message}${x.details?` (${x.details})`:''}`),...warnings.map(x=>`אזהרה: ${x.message}${x.details?` (${x.details})`:''}`)];
  el.textContent=details.length?head+" | "+details.join(" | "):head;
  el.className=`event-save-status ${r?.ok?"success":"error"}`;
}
async function runSystemHealthUi_(){
  const el=$("#systemHealthResult");
  if(el){el.textContent="בודק את כל מרכיבי המערכת...";el.className="event-save-status working";}
  try{
    const r=await API.request("systemHealthV148",{});
    renderSystemHealthResult_(r);
  }catch(err){if(el){el.textContent=err?.message||String(err);el.className="event-save-status error";}else showToast(err?.message||String(err),"error")}
}

/* ---------- V1.1.46 EventType assignment diagnostics ---------- */
function renderEventTypeAssignmentResult_(r,mode){
  const el=$("#eventTypeAssignmentResult");
  if(!el)return;
  const issues=r?.issues||r?.diagnosisBefore?.issues||[];
  const changed=Number(r?.changedCount||0);
  if(mode==="repair"){
    const backupText=r?.backup?.backupName?` · גיבוי: ${r.backup.backupName}`:"";
    el.textContent=changed?`תוקנו ${changed} אירועים${backupText}`:"לא נמצאו שיוכים שדורשים תיקון";
    el.className="event-save-status success";
    return;
  }
  if(!issues.length){el.textContent="לא נמצאו שיוכים חשודים";el.className="event-save-status success";return;}
  el.textContent=`נמצאו ${issues.length} שיוכים לבדיקה: `+issues.map(x=>`${x.name}: ${x.currentEventTypeName||x.currentEventTypeId} → ${x.suggestedEventTypeName||x.suggestedEventTypeId}`).join(" | ");
  el.className="event-save-status working";
}

async function diagnoseEventTypeAssignmentsUi_(){
  const el=$("#eventTypeAssignmentResult");
  if(el){el.textContent="בודק שיוכים...";el.className="event-save-status working";}
  try{
    const r=await API.request("diagnoseEventTypeAssignmentsV146",{});
    renderEventTypeAssignmentResult_(r,"diagnose");
  }catch(err){if(el){el.textContent=err?.message||String(err);el.className="event-save-status error";}else showToast(err?.message||String(err),"error")}
}

async function repairEventTypeAssignmentsUi_(){
  if(!confirm("לתקן אוטומטית שיוכי סוג אירוע שניתנים לזיהוי ודאי לפי שם האירוע? לפני התיקון ייווצר גיבוי מלא של ה-Google Sheet."))return;
  const el=$("#eventTypeAssignmentResult");
  if(el){el.textContent="יוצר גיבוי ומתקן שיוכים...";el.className="event-save-status working";}
  try{
    const r=await API.request("repairEventTypeAssignmentsV146",{});
    renderEventTypeAssignmentResult_(r,"repair");
    await bootstrap();
    state.adminTab="versions";
    renderAdmin();
    renderEventTypeAssignmentResult_(r,"repair");
  }catch(err){if(el){el.textContent=err?.message||String(err);el.className="event-save-status error";}else showToast(err?.message||String(err),"error")}
}

/* F14C — WhatsApp test and real group sending. */
async function waLoadSendTemplatesF14C_(){
  const eventId=String(state.activeEventId||'');
  if(!eventId)return [];
  if(!(state.waSendTemplatesCacheF14G instanceof Map))state.waSendTemplatesCacheF14G=new Map();
  const cached=state.waSendTemplatesCacheF14G.get(eventId);
  if(cached)return cached;
  const pending=API.request('listWhatsAppSendTemplatesF14C',{eventId}).then(r=>waEligibleTemplatesD5D26_(Array.isArray(r?.templates)?r.templates:[])).catch(e=>{state.waSendTemplatesCacheF14G.delete(eventId);throw e;});
  state.waSendTemplatesCacheF14G.set(eventId,pending);
  return pending;
}
function waEligibleTemplatesD5D26_(templates){
  const ev=activeEvent();
  const hasImage=!!String(ev?.invitationImageFileId||'').trim();
  return (templates||[]).filter(t=>hasImage||!['family_event_invitation_v3','test_family_event_invitation_v3'].includes(String(t.metaName||'').trim().toLowerCase()));
}
function waTemplateByIdF14G_(templates,id){return (templates||[]).find(t=>String(t.id)===String(id))||null;}
function waGuestTableTextF14Z36_(guest){
  const st=state.seating?.eventId===String(state.activeEventId)?state.seating:null,gid=String(guest?.guestId||guest?.id||'');
  if(!st||!gid)return 'מספר שולחן';
  const byId=Object.fromEntries((st.tables||[]).map(t=>[String(t.id),t]));
  const parts=(st.assignments||[]).filter(a=>String(a.guestId)===gid).map(a=>{const n=String(byId[String(a.tableId)]?.tableNumber||'').trim(),seats=Math.max(0,Number(a.seats)||0);return n?`שולחן ${n}${seats?` – ${seats} ${seats===1?'מקום':'מקומות'}`:''}`:'';}).filter(Boolean);
  return parts.length?parts.join(', '):'מספר שולחן';
}
function waPreviewBodyF14G_(template,guest){
  const greeting=String(guest?.invitationGreeting||guest?.name||'משפחה יקרה').trim()||'משפחה יקרה',ev=activeEvent()||{},purpose=String(template?.purpose||'');
  const rawDate=String(ev.date||ev.eventDate||'').trim();
  const previewDate=/^\d{4}-\d{2}-\d{2}/.test(rawDate)?rawDate.slice(0,10).split('-').reverse().join('/'):rawDate;
  const common={greeting,eventName:String(ev.name||'האירוע המשפחתי'),eventDate:previewDate,eventTime:String(ev.eventTime||'').slice(0,5),venue:String(ev.venue||ev.location||'').trim(),eventAddress:String(ev.navigationAddress||'').trim(),table:waGuestTableTextF14Z36_(guest)};
  common.eventDetails=[common.eventName,[common.eventDate,common.eventTime?`בשעה ${common.eventTime}`:''].filter(Boolean).join(' '),common.venue,common.eventAddress?`כתובת: ${common.eventAddress}`:''].filter(Boolean).join(' · ');
  const vals=(purpose==='table_update'||purpose==='table_payment_update')?[common.greeting,common.eventDetails,common.table,'']:[common.greeting,common.eventDetails,common.eventDate,common.eventTime,common.venue,common.table];
  const sourceValues={personalGreeting:common.greeting,guestName:String(guest?.name||''),eventName:common.eventName,eventDetails:common.eventDetails,eventDate:common.eventDate,eventTime:common.eventTime,eventVenue:common.venue,eventAddress:common.eventAddress,tableText:common.table,extraNotesText:String(guest?.notes||''),eventSignature:String(ev?.messageSignature||'')};const mapping=template?.mapping?.body||{};return String(template?.body||'').replace(/\{\{\s*([^{}]+?)\s*\}\}/g,(m,k)=>{const x=String(k).trim(),src=mapping[x];if(src&&Object.prototype.hasOwnProperty.call(sourceValues,src))return sourceValues[src];if(/^\d+$/.test(x))return '⟦לא מופה {{'+x+'}}⟧';if(x==='פנייה_אישית'||x==='שם_המוזמן')return common.greeting;if(x==='שם_האירוע')return common.eventName;if(x==='מספר_שולחן'||x==='שולחן'||x==='שולחנות')return common.table;if(x==='תאריך_האירוע')return common.eventDate;if(x==='שעת_האירוע')return common.eventTime;if(x==='מקום_האירוע')return common.venue;if(x==='כתובת_האירוע')return common.eventAddress;return 'פרטי האירוע';});
}
function waPreviewButtonsF14Z32_(template){
  const p=String(template?.purpose||'');
  if(p==='invitation'||p==='rsvp_update')return ['אישור הגעה'];
  if(p==='table_update')return ['ניווט לאירוע'];
  if(p==='table_payment_update')return ['ניווט לאירוע','תשלום'];
  return [];
}
// D5D55R: preview resolves TEST event/template image first; no WhatsApp sending changes.
async function waTemplateImageSrcF14G_(template){
  if(!template?.id||!template?.hasImage)return '';
  if(!(state.waSendTemplateImagesF14G instanceof Map))state.waSendTemplateImagesF14G=new Map();
  const eventId=String(state.activeEventId||'');
  const environment=String(template.environment||'TEST').toUpperCase();
  const key=environment+'|'+eventId+'|'+String(template.id);
  const cached=state.waSendTemplateImagesF14G.get(key);if(cached)return cached;
  const pending=(async()=>{
    if(environment==='TEST'&&eventId){
      const r=await eventViewImageDataLoadD55Q(eventId,template.id);
      if(r?.base64&&r?.mime)return `data:${r.mime};base64,${r.base64}`;
      // Legacy invitation image is a compatibility fallback ONLY for invitations.
      if(String(template.purpose||'')==='invitation'){
        const old=await API.request('getEventInvitationImageD5D17',{eventId});
        if(old?.base64&&old?.mime)return `data:${old.mime};base64,${old.base64}`;
      }
      return '';
    }
    // The invitation image belongs to the selected event in both environments.
    // Keep the template image as a compatibility fallback for non-invitation templates.
    if(eventId&&String(template.purpose||'')==='invitation'){
      try{
        const eventImage=await eventViewImageDataLoadD55Q(eventId,template.id);
        if(eventImage?.base64&&eventImage?.mime)return `data:${eventImage.mime};base64,${eventImage.base64}`;
      }catch(error){console.warn('[WA preview] event image unavailable',error);}
      try{
        const legacy=await API.request('getEventInvitationImageD5D17',{eventId});
        if(legacy?.base64&&legacy?.mime)return `data:${legacy.mime};base64,${legacy.base64}`;
      }catch(error){console.warn('[WA preview] legacy event image unavailable',error);}
    }
    const r=await API.request('getMessageTemplateImageA19P2',{id:template.id});
    return r?.base64&&r?.mime?`data:${r.mime};base64,${r.base64}`:'';
  })().catch(e=>{state.waSendTemplateImagesF14G.delete(key);throw e;});
  state.waSendTemplateImagesF14G.set(key,pending);return pending;
}

function waPreviewFormatF14Z34_(text){
  let s=esc(String(text||''));
  s=s.replace(/\*([^*\n]+)\*/g,'<strong>$1</strong>');
  s=s.replace(/_([^_\n]+)_/g,'<em>$1</em>');
  s=s.replace(/~([^~\n]+)~/g,'<del>$1</del>');
  return s.replace(/\n/g,'<br>');
}
async function waRenderPreviewF14G_(container,template,guest){
  if(!container)return;if(!template){container.innerHTML='<p class="muted">בחר תבנית להצגת Preview.</p>';return;}
  if(!guest){container.innerHTML='<p class="wa-confirm-status-v1190a16 error">לא ניתן להציג Preview: אין מוזמן להצגה.</p>';return;}
  const previewStartedD32=performance.now();const hasImage=!!template.hasImage,buttons=waPreviewButtonsF14Z32_(template);
  container.innerHTML=`<div class="wa-preview-card-f14g">${hasImage?'<div class="wa-preview-image-wrap-f14g"><span>טוען תמונה…</span></div>':''}<div class="wa-preview-body-f14g">${waPreviewFormatF14Z34_(waPreviewBodyF14G_(template,guest))}</div>${buttons.map(x=>`<div class="wa-preview-button-f14g">${esc(x)}</div>`).join('')}</div><small class="muted">Preview בלבד — נתוני ${esc(guest.name||'המוזמן הראשון')}.</small>`;
  if(!hasImage)return;
  try{const src=await waTemplateImageSrcF14G_(template),wrap=container.querySelector('.wa-preview-image-wrap-f14g');console.info('[WA PERF] preview image',Math.round(performance.now()-previewStartedD32),'ms');if(!wrap||!wrap.isConnected)return;if(src)wrap.innerHTML=`<img src="${src}" alt="תמונת התבנית">`;else wrap.remove();}catch(e){const wrap=container.querySelector('.wa-preview-image-wrap-f14g');if(wrap)wrap.remove();}
}
function waMetaStatusLabelF14E_(status){const x=String(status||'').trim().toUpperCase();return x==='APPROVED'?'מאושרת':x==='PENDING'?'בבדיקה':x==='REJECTED'?'נדחתה':x==='DRAFT'?'טיוטה':'לא הוגדר';}
function waTemplateOptionsF14C_(templates){return templates.map(t=>`<option value="${esc(t.id)}" data-approved="${String(t.metaStatus||'').trim().toUpperCase()==='APPROVED'?'1':'0'}">${esc(t.name||'תבנית WhatsApp')}</option>`).join('')}
function waSelectedTemplateApprovedF14E_(select){return !!select?.selectedOptions?.[0]&&select.selectedOptions[0].dataset.approved==='1';}
// D5D34 — test-template cache scoped by user, event and environment.
const waTestTemplateCacheD33=new Map();
const WA_TEST_TEMPLATE_TTL_D33=5*60*1000;
function waInvalidateTestTemplateCacheD33(){waTestTemplateCacheD33.clear();}
function waTestTemplateKeyD33(environment){
 const session=state.session||{};
 return [session.userId||session.email||'',session.role||'',String(state.activeEventId||''),String(environment||'TEST').toUpperCase()].join('|');
}
async function waGetTestTemplatesD33(environment,force=false){
 const key=waTestTemplateKeyD33(environment),entry=waTestTemplateCacheD33.get(key);
 if(!force&&entry&&(entry.pending||entry.expires>Date.now())){
  console.info('[WA PERF] listWhatsAppTestTemplates cache hit',0,'ms');
  return entry.pending||entry.templates;
 }
 const started=performance.now();
 const pending=API.request('listWhatsAppTestTemplates',{eventId:state.activeEventId,environment:String(environment||'TEST').toUpperCase()}).then(r=>{
  const templates=Array.isArray(r?.templates)?r.templates:[];
  if(r?.diagnostics)console.info('[WA PERF] D5D45 backend template breakdown',r.diagnostics);
  if(waTestTemplateCacheD33.get(key)?.pending===pending)waTestTemplateCacheD33.set(key,{templates,expires:Date.now()+WA_TEST_TEMPLATE_TTL_D33});
  console.info('[WA PERF] listWhatsAppTestTemplates server',Math.round(performance.now()-started),'ms');
  return templates;
 }).catch(e=>{if(waTestTemplateCacheD33.get(key)?.pending===pending)waTestTemplateCacheD33.delete(key);throw e;});
 waTestTemplateCacheD33.set(key,{pending,expires:0});return pending;
}
async function waFillTestTemplateSelectF14Z32_(select,status,sendButton,environment){
  if(!select)return [];select.disabled=true;select.innerHTML='<option value="">טוען תבניות…</option>';if(sendButton)sendButton.disabled=true;
  const templateLoadStartedD32=performance.now();
  try{const rawTemplates=await waGetTestTemplatesD33(environment);console.info('[WA PERF] test template UI total',Math.round(performance.now()-templateLoadStartedD32),'ms');const templates=await waFilterTableTemplatesD5D55D_(waEligibleTemplatesD5D26_(rawTemplates),state.activeEventId);if(!templates.length){select.innerHTML='<option value="">אין תבניות מאושרות</option>';return [];}select.innerHTML=waTemplateOptionsF14C_(templates);select.disabled=false;if(sendButton)sendButton.disabled=false;return templates;}catch(e){select.innerHTML='<option value="">שגיאה בטעינת תבניות</option>';if(status){status.textContent=e?.message||String(e);status.className='wa-confirm-status-v1190a16 error';}return [];}
}
// D5D55D: classify templates by Meta identifier first; old sheet rows may have stale purpose.
function waTemplatePurposeD5D55D_(t){
  const name=String(t?.metaName||'').trim().toLowerCase();
  if(/(?:^|_)table_payment_update_v1$/.test(name))return 'table_payment_update';
  if(/(?:^|_)table_update_v1$/.test(name))return 'table_update';
  if(/(?:^|_)rsvp_update_v1$/.test(name))return 'rsvp_update';
  return String(t?.purpose||'invitation').trim().toLowerCase();
}
const waPaymentCacheFix6=new Map();
function waPaymentGetFix6(eventId,force=false){
  const key=String(eventId||'');
  const existing=waPaymentCacheFix6.get(key);
  if(!force&&existing&&(existing.pending||(existing.expires>Date.now())))return existing.pending||Promise.resolve(existing.data);
  const pending=API.request('paymentGetD5D54',{eventId}).then(data=>{
    if(waPaymentCacheFix6.get(key)?.pending===pending)waPaymentCacheFix6.set(key,{data,expires:Date.now()+30000});
    return data;
  }).catch(error=>{if(waPaymentCacheFix6.get(key)?.pending===pending)waPaymentCacheFix6.delete(key);throw error;});
  waPaymentCacheFix6.set(key,{pending});return pending;
}
// D5D55E: central payment-aware template visibility, fail closed on lookup error.
async function waFilterTableTemplatesD5D55D_(templates,eventId,paymentSettings){
  if(!eventId)throw new Error('לא זוהה אירוע לצורך בדיקת הגדרות התשלום');
  const ps=paymentSettings||await waPaymentGetFix6(eventId);
  if(!ps||!Array.isArray(ps.methods))throw new Error('התקבלה תשובה לא תקינה עבור הגדרות התשלום');
  const active=!!ps.enabled&&ps.methods.some(m=>/^https:\/\//i.test(String(m.url||'')));
  return templates.filter(t=>{
    const purpose=waTemplatePurposeD5D55D_(t);
    return purpose!=='table_update'&&purpose!=='table_payment_update'||purpose===(active?'table_payment_update':'table_update');
  });
}
async function waFillTemplateSelectF14D_(select,status,sendButton,eventId){
  if(!select)return [];
  select.disabled=true;select.innerHTML='<option value="">טוען תבניות…</option>';if(sendButton)sendButton.disabled=true;
  try{
    // Both were previously sequential, adding their network latencies together.
    const [rawTemplates,paymentSettings]=await Promise.all([waLoadSendTemplatesF14C_(),waPaymentGetFix6(eventId)]);
    const templates=await waFilterTableTemplatesD5D55D_(rawTemplates.filter(t=>String(t.environment||'PRODUCTION').toUpperCase()==='PRODUCTION'),eventId,paymentSettings);
    if(!templates.length){select.innerHTML='<option value="">אין תבנית Meta מקושרת</option>';if(status){status.textContent='לא נמצאה תבנית WhatsApp המקושרת ל־Meta עבור סוג האירוע. יש לעדכן את ״שם התבנית המאושרת ב־Meta״ במסך ניהול התבניות.';status.className='wa-confirm-status-v1190a16 error';}return []}
    select.innerHTML=waTemplateOptionsF14C_(templates);select.disabled=false;const approved=waSelectedTemplateApprovedF14E_(select);if(status){status.textContent=approved?'':'תבנית V3 מקושרת, אך עדיין אינה מאושרת ב־Meta. ניתן לבדוק את ההכנה בלבד; השליחה תיפתח לאחר APPROVED.';status.className='wa-confirm-status-v1190a16'+(approved?'':' error');}if(sendButton)sendButton.disabled=!approved;return templates;
  }catch(e){select.innerHTML='<option value="">שגיאה בטעינת תבניות</option>';if(status){status.textContent=e?.message||String(e);status.className='wa-confirm-status-v1190a16 error';}return []}
}

/* F14V — compact WhatsApp confirmation, elapsed-time measurement and detailed send results. */
function waFormatElapsedF14V_(ms){
  const sec=Math.max(0,Number(ms||0))/1000;
  return sec<60?`${sec.toFixed(1)} שניות`:`${Math.floor(sec/60)}:${String(Math.round(sec%60)).padStart(2,'0')} דקות`;
}
function waConfirmSendF14V_({title='אישור שליחה',message='',details=''}){
  return new Promise(resolve=>{
    const shade=document.createElement('div');shade.className='wa-confirm-shade-f14v';
    shade.innerHTML=`<section class="wa-confirm-dialog-f14v" role="dialog" aria-modal="true" aria-labelledby="waConfirmTitleF14V"><h3 id="waConfirmTitleF14V">${esc(title)}</h3><p>${esc(message)}</p>${details?`<div class="wa-confirm-extra-f14v">${details}</div>`:''}<div class="actions"><button type="button" class="secondary" data-wa-cancel>ביטול</button><button type="button" class="primary" data-wa-ok>אישור ושליחה</button></div></section>`;
    const finish=v=>{shade.remove();resolve(v)};
    shade.querySelector('[data-wa-cancel]').onclick=()=>finish(false);
    shade.querySelector('[data-wa-ok]').onclick=()=>finish(true);
    shade.addEventListener('click',e=>{if(e.target===shade)finish(false)});
    document.body.appendChild(shade);shade.querySelector('[data-wa-ok]').focus();
  });
}
function waSetSendingF14V_(button,busy,label='שולח...'){
  if(!button)return;
  if(busy){if(!button.dataset.waOldHtml)button.dataset.waOldHtml=button.innerHTML;button.disabled=true;button.innerHTML=`<span class="seating-spinner-v171" aria-hidden="true"></span> ${label}`;}
  else{button.innerHTML=button.dataset.waOldHtml||button.innerHTML;delete button.dataset.waOldHtml;}
}
function waResultHtmlF14V_({ok=0,fail=0,left=0,elapsedMs=0,test=false,perf=null,uncertain=false,blockedBeforeDispatch=false,canceled=false}){
  const total=ok+fail,serverMs=Number(perf?.totalMs||0),roundTripMs=Math.max(0,Number(elapsedMs||0)-serverMs),shownTotal=uncertain?'לא ידוע':total,shownOk=uncertain?'לא ידוע':ok,shownFail=uncertain?'לא ידוע':fail;
  return `<div class="wa-result-f14v ${(fail||uncertain||blockedBeforeDispatch)?'has-error':'success'}"><strong>${blockedBeforeDispatch?'הניסיון נחסם לפני שליחה — לא נשלחו הודעות בניסיון זה':uncertain?'השליחה נעצרה — מצב קבוצת השליחה לא ידוע':canceled?'השליחה נעצרה לבקשת המשתמש':fail?'השליחה הסתיימה עם שגיאות':'השליחה הסתיימה בהצלחה'}</strong><dl><dt>טופלו</dt><dd>${shownTotal}</dd><dt>התקבלו לשליחה</dt><dd>${shownOk}</dd><dt>נכשלו</dt><dd>${shownFail}</dd>${left?`<dt>${uncertain?'ללא תוצאה מאומתת / טרם נשלחו':canceled?'בוטלו ללא שליחה':'לא נשלחו'}</dt><dd>${left}</dd>`:''}<dt>זמן כולל לקבוצת השליחה</dt><dd>${waFormatElapsedF14V_(elapsedMs)}</dd>${!perf?'<dt>פירוט שרת</dt><dd>לא התקבל נתון</dd>':''}${perf?`<dt>Backend כולל</dt><dd>${waFormatElapsedF14V_(serverMs)}</dd><dt>תקשורת Frontend ↔ Backend</dt><dd>${waFormatElapsedF14V_(roundTripMs)}</dd><dt>טעינת אירוע</dt><dd>${waFormatElapsedF14V_(perf.eventMs||0)}</dd><dt>בדיקת מבנה Guests</dt><dd>${waFormatElapsedF14V_(perf.ensureMs||0)}</dd><dt>טעינת מוזמנים</dt><dd>${waFormatElapsedF14V_(perf.guestsMs||0)}</dd><dt>הגדרות + תבנית</dt><dd>${waFormatElapsedF14V_(perf.configTemplateMs||0)}</dd><dt>RSVP</dt><dd>${waFormatElapsedF14V_(perf.rsvpMs||0)}</dd><dt>Media</dt><dd>${waFormatElapsedF14V_(perf.mediaMs||0)}</dd><dt>בניית Payload</dt><dd>${waFormatElapsedF14V_(perf.buildMs||0)}</dd><dt>Meta API</dt><dd>${waFormatElapsedF14V_(perf.metaMs||0)}</dd><dt>עיבוד תשובות</dt><dd>${waFormatElapsedF14V_(perf.processMs||0)}</dd><dt>חישוב עלויות</dt><dd>${waFormatElapsedF14V_(perf.pricingMs||0)}</dd><dt>כתיבת יומן WhatsApp</dt><dd>${waFormatElapsedF14V_(perf.waLogWriteMs||0)}</dd><dt>כתיבת עלויות</dt><dd>${waFormatElapsedF14V_(perf.costWriteMs||0)}</dd><dt>כתיבת Activity</dt><dd>${waFormatElapsedF14V_(perf.activityWriteMs||0)}</dd><dt>Diagnostics</dt><dd>${waFormatElapsedF14V_(perf.diagnosticMs||0)}</dd>`:''}</dl><small>${blockedBeforeDispatch?'החסימה בניסיון זה אינה פותרת את מצב הניסיון הקודם. ':uncertain?'לא ניתן לקבוע אם המנה הפעילה נשלחה. ':test?'יעד השליחה: מספר הבדיקה בלבד. ':'יעד השליחה: מספרי המוזמנים. '}אישור קבלת הבקשה אינו אישור קריאה ב-WhatsApp.</small></div>`;
}

const WA_BATCH_PAUSE_F14Z7_MS=5000;

// One user intent, one concurrent cancellation request. A stop during plan
// creation waits for its ID; failed requests are retried only by another click.
function waStopControllerQ25_(getId,eventId,onState){
  let requested=false,pending=null,attempted=false,accepted=false,error='';
  const flush=()=>{
    if(!requested||!getId()||attempted)return pending||Promise.resolve(accepted);
    attempted=true;onState('pending','');
    pending=(async()=>{
      try{
        const r=await API.request('stopWhatsAppRecoveryQ22',{id:getId(),eventId});
        if(!r?.stopAcceptedQ25&&!r?.completedQ25)throw new Error('לא התקבל אישור עצירה מהשרת');
        accepted=true;error='';onState('accepted','');return true;
      }catch(e){error=String(e?.message||e);onState('failed',error);return false;}
    })();return pending;
  };
  return {request(){requested=true;if(!pending||error){attempted=false;pending=null;}return flush();},ready:flush,wait:()=>pending||Promise.resolve(accepted),get error(){return error;}};
}

// D5D55Z22: one dedicated progress surface for both bulk send flows.
// Reflects the existing batch engine; never initiates a second send.
// Q33: numeric source shared by the summary and delegated progress window.
function waProgressStateQ33_(total,processed,accepted,failed,uncertain=false){
  if(![total,processed,accepted,failed].every(Number.isSafeInteger)||total<0||processed<0||processed>total||accepted<0||failed<0||accepted+failed>processed)throw new Error('Invalid progress counts');
  return {total,processed,accepted,failed,remaining:total-processed,percent:total?Math.round(processed*100/total):0,uncertain:!!uncertain};
}
async function waWaitTestPaceQ48_(ms,keepGoing,onTick){
  if(!Number.isFinite(ms)||ms<0||ms>600000)throw new Error('זמן המתנה לא תקין');
  const began=performance.now();
  while(performance.now()-began<ms){if(!keepGoing())return false;onTick(Math.max(0,Math.ceil((ms-performance.now()+began)/1000)));await new Promise(r=>setTimeout(r,Math.min(500,ms-performance.now()+began)));}
  return keepGoing();
}
async function waReadSettledAfterLossQ33_(id,eventId,total,expectedAttempted,baseline,token){
  const beganQ48=Date.now();
  for(let attempt=0;attempt<24&&Date.now()-beganQ48<120000;attempt++){
    if(state.session?.token!==token||String(state.activeEventId)!==eventId)return null;
    try{
      const r=await API.request('inspectWhatsAppRecoveryQ22',{id,eventId,includeDeliveryQ48:true,fromAttemptedQ48:Number(baseline.attempted)||0},{timeoutMs:8000});
      if(state.session?.token!==token||String(state.activeEventId)!==eventId)return null;
      if(r?.id===id&&r.eventId===eventId&&r.total===total&&r.uncertain===0&&r.attempted===expectedAttempted&&['ACTIVE','DONE','STOPPED'].includes(r.state)&&Number.isSafeInteger(r.accepted)&&Number.isSafeInteger(r.failed)&&r.accepted>=baseline.accepted&&r.failed>=baseline.failed&&r.accepted+r.failed===r.attempted)return r;
    }catch(ignore){}
    if(attempt<23)await new Promise(resolve=>setTimeout(resolve,2500));
  }
  return null;
}
function waBulkProgressWindowZ22_(sourceBox, sourceStop, sourceJournal, title, total=0,environmentOverrideQ37=null,allowStopQ59=true,resumeTotalsQ60=null){
  // Q60: display offsets only. Never modify the selected suffix or dispatch counters.
  const priorQ60=resumeTotalsQ60&&Number.isSafeInteger(resumeTotalsQ60.total)&&Number.isSafeInteger(resumeTotalsQ60.attempted)&&Number.isSafeInteger(resumeTotalsQ60.accepted)&&Number.isSafeInteger(resumeTotalsQ60.failed)&&resumeTotalsQ60.total>=total&&resumeTotalsQ60.attempted>=0&&resumeTotalsQ60.accepted>=0&&resumeTotalsQ60.failed>=0&&resumeTotalsQ60.accepted+resumeTotalsQ60.failed===resumeTotalsQ60.attempted&&resumeTotalsQ60.attempted+total===resumeTotalsQ60.total?resumeTotalsQ60:null;
  if(priorQ60)total=priorQ60.total;
  const numericQ60=()=>{
    const local=sourceBox?.waProgressQ33;
    if(!priorQ60)return local;
    return {...local,processed:priorQ60.attempted+(local?.processed||0),accepted:priorQ60.accepted+(local?.accepted||0),failed:priorQ60.failed+(local?.failed||0),uncertain:!!local?.uncertain};
  };
  if(!['Admin','EventManager'].includes(state.session?.role))return {finish(){},dispose(){}};
  document.querySelectorAll('.wa-bulk-overlay-z22').forEach(el=>el.remove());
  const root=document.createElement('section');
  root.className='wa-bulk-overlay-z22';root.setAttribute('role','dialog');root.setAttribute('aria-modal','true');root.setAttribute('aria-label',title);
  const isTestProgressF23=/לבדיקה/.test(title);
  root.innerHTML=`<div class="wa-bulk-window-z22 wa-bulk-v13" dir="rtl">
    <h2>${esc(title)}</h2><div class="wa-bulk-main-v13"><div><small>טופלו לשליחה — אינו אישור מסירה</small><div class="wa-bulk-big-v13" dir="ltr" style="unicode-bidi:isolate;display:inline-block"><b data-done>0</b> / <span data-total>0</span></div></div><strong data-percent>0%</strong></div>
    <progress max="100" value="0" aria-label="התקדמות שליחה"></progress>
    <div hidden aria-hidden="true"><b data-ok>0</b><b data-fail>0</b><b data-left>0</b><small data-left-label></small></div>
    <div class="wa-bulk-stats-v13 wa-bulk-delivery-stats-fix44" aria-label="תוצאות ההודעות שנבחרו"><div><b data-delivered>0</b><small>נמסרו</small></div><div><b data-delivery-failed>0</b><small>נכשלו</small></div><div><b data-delivery-pending>0</b><small>ממתינות לאישור מסירה</small></div></div>
    <div class="wa-bulk-state-v13" data-counter-update role="status" aria-live="polite" aria-atomic="true" hidden></div>
    <p data-count-note role="status" aria-live="polite"></p>
    <p><strong data-dispatch-pending>טרם נשלחו: 0</strong></p>
    <p data-dispatch-unknown role="status" hidden></p>
    <div class="wa-bulk-state-v13"><div class="wa-bulk-main-v13"><strong data-phase>מכין שליחה…</strong><span data-time>00:00</span></div><p class="wa-bulk-status-z22" role="status">מכין שליחה…</p></div>
    <button type="button" class="secondary" data-recovery-refresh hidden>רענן תוצאות שליחה מהשרת</button>
    <p class="wa-bulk-note-z22">נמסרו: התקבל אישור הגעה לטלפון. נכשלו: התקבלה תשובת כישלון. ממתינות לאישור מסירה: התקבלו לשליחה אך טרם התקבל אישור הגעה לטלפון. טרם נשלחו: עדיין לא הועברו לשליחה. 100% בפס מציין סיום טיפול בשליחה בלבד.</p>
    <div class="wa-delivery-fix24" hidden><strong>עדכון אישורי מסירה</strong><div data-delivery-summary role="status">טרם נבדק</div><p class="muted">הנתונים מתייחסים לשליחה הנוכחית בלבד. ניתן לרענן אישורים ללא שליחה נוספת.</p></div><div class="actions"><button type="button" class="secondary wa-bulk-refresh-fix24" hidden>רענן סטטוס מסירה</button><button type="button" class="danger wa-bulk-stop-z22">■ עצור שליחה</button><button type="button" class="secondary wa-bulk-journal-z22" hidden>צפייה ביומן WhatsApp</button><button type="button" class="secondary wa-bulk-close-z22" hidden>סגור</button></div>
  </div><div class="wa-bulk-confirm-v13" hidden><section role="alertdialog" aria-modal="true" aria-label="אישור עצירת שליחה"><h3>אישור עצירת שליחה</h3><p data-confirm-text></p><p>הודעות שכבר טופלו יישארו בסיכום. המנה הפעילה עשויה להסתיים.</p><div class="actions"><button type="button" class="secondary" data-cancel>המשך שליחה</button><button type="button" class="danger" data-confirm>כן, עצור שליחה</button></div></section></div>`;
  document.body.appendChild(root);
  // The original progress element remains the live data source, but is not rendered twice.
  if(sourceBox)sourceBox.classList.add('wa-progress-delegated-z15');
  const $=sel=>root.querySelector(sel),status=$('.wa-bulk-status-z22'),bar=$('progress'),stop=$('.wa-bulk-stop-z22'),journal=$('.wa-bulk-journal-z22'),close=$('.wa-bulk-close-z22'),confirmBox=$('.wa-bulk-confirm-v13');
  const started=performance.now();let finished=false,done=0,stopMessageQ25='',stopPhaseQ26='';
  const eventQ37=String(state.activeEventId||''),tokenQ37=state.session?.token,environmentQ37=environmentOverrideQ37||(isTestProgressF23?'TEST':'PRODUCTION');
  let deliveryLastPaintQ53=null,deliveryRescanQ54=false;
  let dispatchFailedQ37=0,canceledQ37=0,finishWarningQ37=false;const deliveryStatesQ37=new Map();
  const paintCountsQ37=()=>{
    const numeric=numericQ60();
    if(numeric)dispatchFailedQ37=Math.max(0,numeric.failed-Number(sourceBox.waUnknownQ37||0));
    const delivered=[...deliveryStatesQ37.values()].filter(x=>x==='DELIVERED'||x==='READ').length;
    const deliveryFailed=[...deliveryStatesQ37.values()].filter(x=>x==='FAILED'||x==='API_FAILED').length;
    const accepted=Math.max(numeric?numeric.accepted:Number($('[data-ok]').textContent)||0,deliveryIdsFIX24.length);
    const failed=dispatchFailedQ37+deliveryFailed;
    const pending=Math.max(0,accepted-delivered-deliveryFailed);
    const knownUnknown=Number(sourceBox?.waUnknownQ37||0);
    const processed=Math.max(numeric?numeric.processed:done,accepted+dispatchFailedQ37+knownUnknown);
    // A lost response cannot prove that the unreported recipients were never sent.
    const unchecked=numeric?.uncertain?Math.max(0,total-canceledQ37-accepted-dispatchFailedQ37):knownUnknown;
    const unsent=numeric?.uncertain?0:Math.max(0,total-canceledQ37-processed);
    $('[data-delivered]').textContent=String(delivered);$('[data-delivery-failed]').textContent=String(failed);$('[data-delivery-pending]').textContent=String(pending);
    $('[data-dispatch-pending]').textContent=`טרם נשלחו: ${unsent}`;
    $('[data-dispatch-unknown]').hidden=unchecked===0;
    $('[data-dispatch-unknown]').textContent=unchecked?`מצב השליחה של ${unchecked} הודעות דורש בדיקה ביומן לפני ניסיון נוסף.`:'';
    $('[data-count-note]').textContent=`נבחרו ${total} הודעות`+(canceledQ37?` · ${canceledQ37} בוטלו ולא יישלחו`:'');
    if(finished){
      $('[data-phase]').textContent=canceledQ37?'השליחה נעצרה לבקשתך':unsent||unchecked?'השליחה נעצרה לפני השלמת כל ההודעות':finishWarningQ37?'הטיפול בשליחה הסתיים עם הערות':'הטיפול בשליחה הסתיים';
      status.textContent=(stopMessageQ25?stopMessageQ25+' ':'')+`${delivered} נמסרו · ${failed} נכשלו`+(pending?` · ${pending} ממתינות לאישור מסירה`:'')+(unsent?` · ${unsent} טרם נשלחו`:'')+(unchecked?` · ${unchecked} דורשות בדיקה`:'')+(canceledQ37?` · ${canceledQ37} בוטלו`:'')+(unchecked?' — יש לבדוק ביומן לפני שליחה נוספת':'');
    }
    paintCounterFeedbackQ38_();
    return pending;
  };
  const paintStopQ26=phase=>{
    stopPhaseQ26=phase;
    const busy=phase==='pending';
    stop.setAttribute('aria-busy',String(busy));
    if(busy)stop.innerHTML='<span class="seating-spinner-v171" aria-hidden="true"></span> מבקש עצירה…';
    else stop.textContent=phase==='failed'?'נסה שוב לעצור שליחה':phase==='accepted'?'בקשת העצירה התקבלה':'■ עצור שליחה';
    stop.disabled=busy||phase==='accepted'||!!sourceStop?.disabled;
  };
  const deliveryIdsFIX24=[];let deliveryBusyFIX24=false;let deliveryPollFIX49=null;let deliveryPollStartedQ6=0;let disposedFIX49=false;let deliveryPollGenerationQ6=0;
  const deliveryPanelFIX24=$('.wa-delivery-fix24'),deliveryButtonFIX24=$('.wa-bulk-refresh-fix24');
  let counterReadErrorQ38=false,deliveryBlockedQ45=false;
  function paintCounterFeedbackQ38_(){
    const panel=$('[data-counter-update]'),grid=$('.wa-bulk-delivery-stats-fix44');
    const unresolved=Number($('[data-delivery-pending]').textContent)||0;
    const hasPendingIds=deliveryIdsFIX24.some(id=>!['DELIVERED','READ','FAILED','API_FAILED'].includes(deliveryStatesQ37.get(id)));
    const automatic=hasPendingIds&&deliveryPollStartedQ6&&Date.now()-deliveryPollStartedQ6<180000;
    const wrongContext=state.session?.token!==tokenQ37||String(state.activeEventId||'')!==eventQ37;
    let text='',spinning=false;
    if(!wrongContext&&deliveryBusyFIX24){text='מעדכן מונים לפי אישורי המסירה… ההודעות עשויות כבר להופיע בטלפון.';spinning=true;}
    else if(unresolved>0&&wrongContext)text='עדכון המונים נעצר בעקבות שינוי משתמש או אירוע.';
    else if(unresolved>0&&counterReadErrorQ38)text='עדכון המונים לא הצליח כרגע. הנתונים האחרונים נשמרו.'+(automatic?' הבדיקה תחזור אוטומטית.':' ניתן לרענן סטטוס מסירה.');
    else if(unresolved>0&&deliveryBlockedQ45){text='אישורי המסירה ממתינים לעיבוד בשרת בזמן שמצב אצווה פתוח. זה אינו אישור שההודעות לא הגיעו; אין לשלוח שוב.';}
    else if(unresolved>0&&automatic){text='ממתין לאישורי מסירה — המונים יתעדכנו אוטומטית. ייתכן שההודעות כבר הגיעו לטלפון.';spinning=true;}
    else if(finished&&unresolved>0&&hasPendingIds)text='העדכון האוטומטי הסתיים. עדיין חסרים אישורי מסירה; ניתן ללחוץ על ״רענן סטטוס מסירה״.';
    else if(finished&&unresolved>0)text='אין עדיין מידע מלא על המסירה. יש לבדוק ביומן לפני שליחה נוספת.';
    panel.hidden=!text;
    panel.innerHTML=text?`${spinning?'<span class="seating-spinner-v171" aria-hidden="true"></span> ':''}<strong>${text}</strong>`:'';
    grid.setAttribute('aria-busy',String(!wrongContext&&deliveryBusyFIX24));
    deliveryButtonFIX24.textContent=deliveryBusyFIX24?'מעדכן מונים…':'רענן סטטוס מסירה';
  }
  const refreshDeliveryFIX24=async()=>{
    if(disposedFIX49||deliveryBusyFIX24||!deliveryIdsFIX24.length)return;
    const generation=deliveryPollGenerationQ6;
    if(deliveryPollFIX49!==null){clearTimeout(deliveryPollFIX49);deliveryPollFIX49=null;}deliveryRescanQ54=false;
    deliveryBusyFIX24=true;deliveryButtonFIX24.disabled=true;
    const output=deliveryPanelFIX24.querySelector('[data-delivery-summary]');
    output.textContent='בודק סטטוס מסירה…';counterReadErrorQ38=false;paintCounterFeedbackQ38_();
    try{
      // One completed read at a time. Never mix another event/session into this window.
      if(state.session?.token!==tokenQ37||String(state.activeEventId||'')!==eventQ37)throw new Error('המשתמש או האירוע השתנו');
      const tracesQ53=[];const idsSnapshotQ37=deliveryIdsFIX24.slice();deliveryBlockedQ45=false;
      for(let offset=0;offset<idsSnapshotQ37.length;offset+=50){
        const ids=idsSnapshotQ37.slice(offset,offset+50);
        const requestStartedQ53=performance.now();
        const r=await API.request('getWhatsAppDeliveryStatusesFIX24',{messageIds:ids,eventId:eventQ37,environment:environmentQ37});
        const responseAtQ53=performance.now();
        if(disposedFIX49||generation!==deliveryPollGenerationQ6||state.session?.token!==tokenQ37||String(state.activeEventId||'')!==eventQ37)return;
        if(r?.deliverySyncQ45?.skipped)deliveryBlockedQ45=true;
        const items=Array.isArray(r?.statuses)?r.statuses:[];
        if(items.length!==ids.length||new Set(items.map(x=>x?.messageId)).size!==ids.length||items.some(x=>!ids.includes(x?.messageId)))throw new Error('תשובת אישורי המסירה אינה מלאה');
        tracesQ53.push({started:requestStartedQ53,returned:responseAtQ53,count:ids.length,server:r.deliveryTimingQ53,syncReason:r.deliverySyncQ45?.reason||'',items});
        items.forEach(x=>{const previous=deliveryStatesQ37.get(x.messageId),next=String(x.status||'').toUpperCase();
          // A confirmed delivery must not regress on a delayed/stale journal response.
          if(['DELIVERED','READ'].includes(previous))return;
          if(['FAILED','API_FAILED'].includes(previous)&&!['DELIVERED','READ'].includes(next))return;
          deliveryStatesQ37.set(x.messageId,next);
        });
      }
      const pending=paintCountsQ37(),failed=Number($('[data-delivery-failed]').textContent);
      const paintedQ53=performance.now();try{for(const trace of tracesQ53)waDeliveryTimingSaveQ53_({ownerId:state.session?.id,eventId:eventQ37,environment:environmentQ37,requestMs:trace.returned-trace.started,responseToCounterMs:paintedQ53-trace.returned,betweenReadsMs:deliveryLastPaintQ53===null?null:trace.started-deliveryLastPaintQ53,count:trace.count,pending,server:trace.server,syncReason:trace.syncReason,items:trace.items});}catch(ignore){}deliveryLastPaintQ53=paintedQ53;
      output.textContent=pending&&deliveryBlockedQ45?'עדכון האישורים ממתין לעיבוד בשרת; הנתונים המוצגים עדיין אינם סופיים.':pending?'אישורי המסירה עודכנו; הודעות שנשלחו ללא אישור הגעה נשארות ״ממתינות לאישור מסירה״.':'אישורי המסירה של ההודעות שניתן לעקוב אחריהן עודכנו.';
      if(pending<=0&&deliveryPollFIX49){clearTimeout(deliveryPollFIX49);deliveryPollFIX49=null;}
      output.classList.toggle('error',failed>0);
    }catch(e){if(disposedFIX49||generation!==deliveryPollGenerationQ6)return;counterReadErrorQ38=true;output.textContent='לא ניתן לעדכן כרגע את אישורי המסירה. הנתונים האחרונים נשמרו; אין לשלוח שוב על סמך הודעה זו.';output.classList.add('error');}
    finally{deliveryBusyFIX24=false;if(!disposedFIX49){deliveryButtonFIX24.disabled=false;
      // Q6: schedule only after the previous request completes; never overlap.
      if(deliveryPollStartedQ6&&deliveryPollFIX49===null&&Date.now()-deliveryPollStartedQ6<180000){
        const pending=deliveryIdsFIX24.filter(id=>!['DELIVERED','READ','FAILED','API_FAILED'].includes(deliveryStatesQ37.get(id))).length;
        if(!Number.isFinite(pending)||pending>0)deliveryPollFIX49=setTimeout(()=>{deliveryPollFIX49=null;refreshDeliveryFIX24();},deliveryRescanQ54?0:finished?1000:8000);
      }
      paintCounterFeedbackQ38_();
    }}
  };
  deliveryButtonFIX24.onclick=refreshDeliveryFIX24;
  const refresh=()=>{
    const srcBar=sourceBox?.querySelector('progress'),srcText=sourceBox?.querySelector('span');
    const message=srcText?.textContent||'מכין שליחה…';
    const fraction=srcBar?Number(srcBar.value)||0:0;
    const numericQ33=numericQ60();
    // Prefer the actual completed count reported by the batch engine.
    const countMatch=message.match(/(?:טופלו|הושלמו|הושלם|נעצר לאחר)\s+(\d+)\s*(?:\/|מתוך)\s*(\d+)/);
    if(numericQ33)done=numericQ33.processed;
    else if(countMatch)done=Math.max(done,Math.min(total,Number(countMatch[1])));
    else if(total&&fraction>=100)done=total;
    const okMatch=message.match(/(?:הצליחו|התקבלו ב-Meta)\s+(\d+)/);
    const failMatch=message.match(/(?:נכשלו|נדחו בשליחה)\s+(\d+)/);
    const ok=numericQ33?numericQ33.accepted:okMatch?Number(okMatch[1]):Number($('[data-ok]').textContent)||0;
    const fail=numericQ33?numericQ33.failed:failMatch?Number(failMatch[1]):Number($('[data-fail]').textContent)||0;
    const percent=total?Math.round(done*100/total):0;
    $('[data-done]').textContent=String(done);$('[data-total]').textContent=String(total);$('[data-left]').textContent=String(Math.max(0,total-done));
    $('[data-percent]').textContent=percent+'%';$('[data-ok]').textContent=String(ok);$('[data-fail]').textContent=String(fail);bar.value=percent;bar.setAttribute('aria-valuenow',String(percent));bar.setAttribute('aria-valuetext',`${done} מתוך ${total}`);
    if(numericQ33)$('[data-left-label]').textContent=numericQ33.uncertain?'טרם אומתו':'נותרו';
    dispatchFailedQ37=Math.min(total,Math.max(0,fail-Number(sourceBox?.waUnknownQ37||0)));
    status.textContent=stopMessageQ25?stopMessageQ25:message.includes('ממתינות לניסיון חוזר')?message:`טופלו לשליחה ${done} מתוך ${total}`;$('[data-phase]').textContent=stopMessageQ25?'עצירת שליחה':finished?'השליחה הסתיימה':message.includes('ממתינות לניסיון חוזר')?'ממתין לניסיון חוזר':/ממתין/.test(message)?'ממתין למנה הבאה':/שולח|קבוצת שליחה/.test(message)?'שולח הודעות':'מכין שליחה';
    paintCountsQ37();
    const sec=Math.floor((performance.now()-started)/1000);$('[data-time]').textContent=String(Math.floor(sec/60)).padStart(2,'0')+':'+String(sec%60).padStart(2,'0');
    stop.disabled=stopPhaseQ26==='pending'||stopPhaseQ26==='accepted'||!!sourceStop?.disabled;
  };
  let recoveryReaderQ48=null,recoveryReadBusyQ48=false;
  const recoveryButtonQ48=$('[data-recovery-refresh]');
  recoveryButtonQ48.onclick=async()=>{
    if(disposedFIX49||recoveryReadBusyQ48||!recoveryReaderQ48)return;
    recoveryReadBusyQ48=true;recoveryButtonQ48.disabled=true;recoveryButtonQ48.textContent='מאמת מצב מול השרת והיומן…';
    try{const ok=await recoveryReaderQ48();if(disposedFIX49)return;if(ok){recoveryReaderQ48=null;recoveryButtonQ48.hidden=true;refresh();await refreshDeliveryFIX24();}}
    catch(ignore){if(!disposedFIX49)status.textContent='אימות מצב השליחה לא הצליח. אין לשלוח שוב לפני בדיקה.';}
    finally{recoveryReadBusyQ48=false;if(!disposedFIX49){recoveryButtonQ48.disabled=false;recoveryButtonQ48.textContent='רענן תוצאות שליחה מהשרת';}}
  };
  const observer=new MutationObserver(refresh);
  if(sourceBox)observer.observe(sourceBox,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['value']});
  const timer=setInterval(()=>{if(!finished)refresh();},1000);
  if(!sourceStop||!allowStopQ59)stop.hidden=true;
  if(!sourceJournal)journal.hidden=true;
  stop.onclick=()=>{if(!allowStopQ59||!sourceStop||sourceStop.disabled||stop.disabled)return;if(isTestProgressF23){paintStopQ26('pending');sourceStop.click();refresh();return;}refresh();$('[data-confirm-text]').textContent=`טופלו ${done} מתוך ${total}; נותרו ${Math.max(0,total-done)} הודעות.`;confirmBox.hidden=false;};
  $('[data-cancel]').onclick=()=>{confirmBox.hidden=true;};
  $('[data-confirm]').onclick=()=>{confirmBox.hidden=true;if(sourceStop){sourceStop.dataset.waBulkConfirmed='1';sourceStop.click();delete sourceStop.dataset.waBulkConfirmed;}refresh();};
  const dispose=()=>{disposedFIX49=true;deliveryPollGenerationQ6++;if(deliveryPollFIX49)clearTimeout(deliveryPollFIX49);deliveryPollFIX49=null;observer.disconnect();clearInterval(timer);root.remove();if(sourceBox){sourceBox.hidden=true;sourceBox.classList.remove('wa-progress-delegated-z15');}};
  journal.onclick=()=>{dispose();sourceJournal?.click();};close.onclick=dispose;
  if(priorQ60?.messageEvidenceQ48?.available===true){
    for(const id of priorQ60.messageEvidenceQ48.messageIds||[])if(typeof id==='string'&&id&&!deliveryIdsFIX24.includes(id)&&deliveryIdsFIX24.length<total)deliveryIdsFIX24.push(id);
  }
  refresh();
  if(deliveryIdsFIX24.length){deliveryPollStartedQ6=Date.now();deliveryPollFIX49=setTimeout(()=>{deliveryPollFIX49=null;refreshDeliveryFIX24();},0);}
  return {setRecoveryReaderQ48(fn){recoveryReaderQ48=fn;recoveryButtonQ48.hidden=!fn;},setStopStateQ25(phase,message){stopMessageQ25=message;$('[data-left-label]').textContent='לא טופלו';paintStopQ26(phase);if(finished)stop.hidden=!allowStopQ59||phase!=='failed';refresh();},addMessageId(id){if(id&&!deliveryIdsFIX24.includes(String(id))&&deliveryIdsFIX24.length<total){deliveryIdsFIX24.push(String(id));if(!deliveryPollStartedQ6)deliveryPollStartedQ6=Date.now();if(deliveryBusyFIX24)deliveryRescanQ54=true;else{if(deliveryPollFIX49!==null)clearTimeout(deliveryPollFIX49);deliveryPollFIX49=setTimeout(()=>{deliveryPollFIX49=null;refreshDeliveryFIX24();},1000);}paintCountsQ37();}},finish(message,failed=false,allowStopRetryQ25=false,optionsQ37={}){refresh();finished=true;finishWarningQ37=!!failed;if(optionsQ37.canceled===true&&!sourceBox?.waProgressQ33?.uncertain)canceledQ37=Math.max(0,total-done);paintCountsQ37();observer.disconnect();clearInterval(timer);stop.hidden=!allowStopQ59||!allowStopRetryQ25;journal.hidden=!sourceJournal;close.hidden=false;if(deliveryIdsFIX24.length){$('.wa-bulk-delivery-stats-fix44').hidden=false;deliveryPanelFIX24.hidden=false;deliveryButtonFIX24.hidden=false;// Q6: keep polling delivery independently after send completion, for up to 3 minutes.
    // The first request starts immediately; each next poll is scheduled on completion.
    deliveryPollStartedQ6=Date.now();if(deliveryBusyFIX24)deliveryRescanQ54=true;refreshDeliveryFIX24();
    }root.classList.toggle('wa-bulk-failed-z22',!!failed);},dispose};
}

async function waPauseBetweenBatchesF14Z7_(box,done,total,nextBatch,totalBatches,started,pauseMs=WA_BATCH_PAUSE_F14Z7_MS,keepGoing=()=>true){
  if(!box||done>=total)return;
  const span=box.querySelector('span');
  for(let left=Math.ceil(pauseMs/1000);left>0;left--){
    if(!keepGoing())return;
    if(span)span.textContent=`${done}/${total} הושלמו · ממתין ${left} שניות לפני קבוצת שליחה ${nextBatch}/${totalBatches} · ${waFormatElapsedF14V_(performance.now()-started)}`;
    await new Promise(resolve=>setTimeout(resolve,1000));
  }
}

/** Q51: one short API call per due retry; only server replies authorize subsequent calls. */
async function waDrainPairQ51_(id,eventId,keepGoing,onUpdate){
  let reply=null;
  while(keepGoing()){
    reply=await API.request('retryWhatsAppPairQ51',{id,eventId});
    if(!reply?.summary||reply.summary.id!==id||reply.summary.eventId!==eventId||!Array.isArray(reply.updates)||!Number.isSafeInteger(reply.pending)||reply.pending<0||!Number.isFinite(reply.waitMs)||reply.waitMs<0||reply.waitMs>600000)throw new Error('לא התקבלה תשובה מאומתת לתור הניסיונות');
    onUpdate(reply);
    if(reply.unknown||reply.canceled||!reply.pending)return reply;
    const waited=await waWaitTestPaceQ48_(Math.max(500,reply.waitMs),keepGoing,seconds=>onUpdate({...reply,waitRemainingQ51:seconds}));if(!waited)return reply;
  }
  return reply;
}
async function waResumePairQueueQ51_(detail){
  const token=state.session?.token,eventId=String(detail.eventId);if(state.session?.role!=='Admin'||String(state.activeEventId)!==eventId)return;
  modal('<h2>המשך טיפול בהודעות הממתינות</h2><div id="waPairBoxQ51"><progress max="100" value="0"></progress><span>בודק את מצב ההודעות בשרת…</span></div><button id="waPairStopQ51" type="button">עצור שליחה</button>');
  const box=$('#waPairBoxQ51'),stop=$('#waPairStopQ51');let stopped=false,progress;
  const controller=waStopControllerQ25_(()=>detail.id,eventId,(phase,error)=>{stop.disabled=phase!=='failed';progress?.setStopStateQ25(phase,error||'העצירה מטופלת בשרת');});
  stop.onclick=()=>{stopped=true;stop.disabled=true;void controller.request()};
  box.waProgressQ33=waProgressStateQ33_(detail.total,detail.accepted+detail.failed,detail.accepted,detail.failed);
  progress=waBulkProgressWindowZ22_(box,stop,null,'המשך שליחת WhatsApp לבדיקה',detail.total,'TEST',false,{...detail,attempted:0,accepted:0,failed:0});
  const current=()=>!stopped&&state.session?.token===token&&String(state.activeEventId)===eventId;
  try{
    const reply=await waDrainPairQ51_(detail.id,eventId,current,r=>{
      const x=r.summary;box.waProgressQ33=waProgressStateQ33_(x.total,x.accepted+x.failed,x.accepted,x.failed,r.unknown>0);
      box.querySelector('progress').value=Math.round((x.accepted+x.failed)*100/x.total);
      box.querySelector('span').textContent=`טופלו ${x.accepted+x.failed}/${x.total} · ${r.pending} הודעות ממתינות לניסיון חוזר${r.waitRemainingQ51?` — עוד כ־${r.waitRemainingQ51} שניות`:''}`;
      for(const messageId of r.messageIds||[])progress.addMessageId(messageId);
    });
    if(stopped){await controller.ready();await controller.wait();progress.finish('השליחה נעצרה לבקשתך',true,!!controller.error,{canceled:!controller.error});return;}
    if(!reply)throw new Error('הטיפול נעצר לפני אימות המצב');
    if(!reply.pending&&!reply.unknown&&!reply.finalRetryFailures&&reply.summary.remaining>0&&current()){
      const fresh=await API.request('inspectWhatsAppRecoveryQ22',{id:detail.id,eventId,includeDeliveryQ48:true,fromAttemptedQ48:0});if(!fresh.canResume)throw new Error(fresh.reason||'המשך השליחה נחסם');
      progress.dispose();closeModal();return waOpenWhatsAppTestQ23_(fresh,true);
    }
    progress.finish(reply.unknown?'תוצאת ניסיון חוזר אינה ודאית; יש לבדוק בניטור':reply.finalRetryFailures?'חלק מההודעות נדחו לאחר מיצוי הניסיונות':'הטיפול בהודעות הסתיים',!!(reply.unknown||reply.finalRetryFailures));
  }catch(error){progress.finish('הטיפול נעצר. המצב שמור בשרת; יש לפתוח שוב את חלון ההתאוששות. '+String(error?.message||error),true);}
}

async function openGuestWhatsAppPreparationA19P2F6_(){
  return waOpenWhatsAppTestQ23_();
}
async function waOpenWhatsAppTestQ23_(resumeQ22=null,autoResumeQ27=false){
  if(resumeQ22?.retryPendingQ51>0)return waResumePairQueueQ51_(resumeQ22);
  if(!['Admin','EventManager'].includes(state.session?.role)||!state.activeEventId)return;
  // F14Z1: Test Send must use the same explicit "שליחה=כן" selection as the working filtered flow.
  // The numeric limit only caps that candidate list; it must never pull arbitrary unmarked guests.
  autoResumeQ27=autoResumeQ27===true&&!!resumeQ22;
  const resumeTokenQ27=state.session?.token,resumeEventQ27=String(state.activeEventId);
  let resumeStartedQ27=false;
  const resumeIdsQ22=resumeQ22?resumeQ22.remainingGuestIds:null;
  if(resumeQ22&&(!resumeQ22.canResume||resumeQ22.eventId!==String(state.activeEventId)||!Array.isArray(resumeIdsQ22)||!resumeIdsQ22.length))return;
  const resumeMapQ22=new Map(state.guests.filter(g=>String(g.eventId)===String(state.activeEventId)).map(g=>[String(g.guestId||g.id),g]));
  if(resumeIdsQ22&&resumeIdsQ22.some(id=>!resumeMapQ22.has(id))){showToast('חלק מהמוזמנים אינם זמינים. המשך השליחה נחסם.','error');return;}
  const rows=resumeIdsQ22?resumeIdsQ22.map(id=>resumeMapQ22.get(id)):filteredGuests().filter(g=>guestSendChecked(g));
  const managerTest=state.session?.role==='EventManager';
  modal(`<section class="wa-test-panel-d5d55j" ${autoResumeQ27?'hidden':''} role="dialog" aria-labelledby="waBulkTitleF14C"><h2 id="waBulkTitleF14C">${resumeQ22?'המשך שליחת WhatsApp לבדיקה':'שליחת WhatsApp לבדיקה'}</h2>${resumeQ22?'<p>ממשיכים רק עם '+resumeIdsQ22.length+' הודעות שטרם הועברו לטיפול. הודעות שכבר טופלו לא נכללות.</p>':''}
    ${managerTest?'':`<p>הבדיקה משתמשת ברשומות שמוצגות לפי הסינון הפעיל. כל ההודעות יישלחו למספר הבדיקה בלבד.</p><p><b>רשומות מסומנות לשליחה לפי הסינון הפעיל:</b> ${rows.length}</p>`}
    <div class="form-grid">${managerTest?'':'<label>סביבה <span class="required-star">*</span><select id="waF14CTestEnvironment"><option value="TEST" selected>TEST</option><option value="PRODUCTION">PRODUCTION</option></select></label>'}<label>תבנית WhatsApp <span class="required-star">*</span><select id="waF14CTestTemplate" disabled><option value="">טוען תבניות…</option></select></label>
    <label>מספר טלפון לבדיקה <span class="required-star">*</span><input id="waF7Phone" class="wa-test-phone-f14e" type="tel" inputmode="tel" autocomplete="tel" placeholder="05XXXXXXXX" dir="ltr"></label>
    ${managerTest?'':`<label>מספר הודעות לבדיקה <span class="required-star">*</span><input id="waTestLimitF14Z1" type="number" min="1" max="${Math.max(1,Math.min(100,rows.length))}" value="${Math.min(5,rows.length||1)}"></label>`}
    ${managerTest?`<input id="waTestGreetingF14Z1" type="hidden" value="משפחה יקרה">`:`<label>פנייה אישית כאשר השדה ריק<input id="waTestGreetingF14Z1" type="text" value="משפחה יקרה"></label></div><p class="muted">הפנייה החלופית משמשת רק לבדיקה ואינה נשמרת ברשומת המוזמן.</p>`}
    ${managerTest?`</div><span id="waTestCountF14T" hidden></span><span id="waTestCostF14T" hidden></span><div class="wa-send-preview-f14g" id="waTestPreviewF14G"><p class="muted">התצוגה המקדימה תוצג לאחר טעינת התבנית.</p></div>`:`<dl class="wa-confirm-details-v1190a16"><dt>מוזמנים זכאים לפי התבנית</dt><dd id="waTestEligibleD5D55J">0</dd><dt>הודעות לשליחת בדיקה</dt><dd id="waTestCountF14T">0</dd><dt>עלות משוערת</dt><dd id="waTestCostF14T">טוען…</dd></dl><div class="wa-send-preview-f14g" id="waTestPreviewF14G"><p class="muted">Preview ההזמנה יוצג לאחר טעינת התבנית.</p></div>`}
    <p id="waF7Summary" class="wa-confirm-status-v1190a16" role="status" data-template-message="1"></p>
    <div class="wa-progress-f14c" id="waTestProgressF14C" hidden><progress max="100" value="0"></progress><span></span></div>
    <div class="wa-pending-diagnostic-fix67" dir="rtl">${managerTest?'':'<button type="button" class="secondary" id="waSimulationQ42">בדיקת עומס ללא שליחה</button>'}<button type="button" class="secondary" id="waCheckInterruptedQ22">בדיקת שליחה שלא הושלמה</button><button type="button" class="secondary" id="waPendingInspectFIX67">בדיקת מצב התאוששות (ללא שליחה)</button><button type="button" class="secondary" id="waQuarantineFIX67" hidden>בידוד אצווה תקועה (TEST בלבד)</button><button type="button" class="secondary" id="waPartialCloseQ15" hidden>סיום ניסיון TEST חלקי ללא שליחה</button><div id="waPendingInspectResultFIX67" role="status" aria-live="polite"></div></div><div class="actions"><button type="button" class="secondary" id="waF7Close">סגור</button><button type="button" class="secondary" id="waTestJournalZ22" hidden>צפייה ביומן WhatsApp</button><button type="button" class="danger" id="waTestStopZ22" hidden>■ עצור שליחה</button><button type="button" class="primary" id="waF8Send">שלח WhatsApp לבדיקה</button></div></section>`);
  const phone=$('#waF7Phone'),summary=$('#waF7Summary'),send=$('#waF8Send'),envSelect=$('#waF14CTestEnvironment'),tpl=$('#waF14CTestTemplate'),limit=$('#waTestLimitF14Z1'),fallback=$('#waTestGreetingF14Z1'),countEl=$('#waTestCountF14T'),eligibleElD5D55J=$('#waTestEligibleD5D55J'),costEl=$('#waTestCostF14T');
  // The recovery click is the explicit send intent. Show counters while read-only
  // preparation runs; dispatch still uses the existing guarded TEST batch path.
  let resumePreparingQ27=null,resumeCanceledQ27=false,resumeStopControllerQ27=null;
  if(autoResumeQ27){
    const box=document.createElement('div');
    box.innerHTML='<progress max="100" value="0"></progress><span>מכין המשך שליחה · טופלו 0/'+resumeIdsQ22.length+'</span>';
    const stop=document.createElement('button');
    resumeStopControllerQ27=waStopControllerQ25_(()=>resumeQ22.id,resumeEventQ27,(phase,error)=>{
      stop.disabled=phase!=='failed';
      resumePreparingQ27?.setStopStateQ25(phase,phase==='failed'?'לא אומתה עצירה בשרת. '+error:phase==='accepted'?'העצירה התקבלה; ההודעות שלא נשלחו בוטלו.':'מבקש עצירה מהשרת…');
    });
    stop.onclick=()=>{resumeCanceledQ27=true;stop.disabled=true;void resumeStopControllerQ27.request();};
    resumePreparingQ27=waBulkProgressWindowZ22_(box,stop,null,'המשך שליחת WhatsApp לבדיקה',resumeIdsQ22.length,null,false,resumeQ22);
  }
  // D5D55I: The TEST count, preview and send all use one template-qualified list.
  // Never fall back to the first five guests while qualification is pending.
  let selected=[],qualifiedD5D55I=[],qualificationReadyD5D55I=false,qualificationErrorD5D55I='',qualificationSerialD5D55I=0;
  const selectedRows=()=>{if(!qualificationReadyD5D55I)return [];if(resumeIdsQ22){const ids=new Set(qualifiedD5D55I.map(g=>String(g.guestId||g.id)));return resumeIdsQ22.every(id=>ids.has(id))?rows:[];}const n=managerTest?Math.min(1,qualifiedD5D55I.length):Math.max(0,Math.min(100,qualifiedD5D55I.length,Number(limit?.value)||0));return qualifiedD5D55I.slice(0,n);};
  const qualifyD5D55I=async()=>{
    const serial=++qualificationSerialD5D55I;
    qualificationReadyD5D55I=false;qualificationErrorD5D55I='';qualifiedD5D55I=[];
    refresh();renderPreview();
    const chosen=waTemplateByIdF14G_(templatesF14G,tpl.value);
    if(!chosen)return;
    try{
      const purpose=waTemplatePurposeD5D55D_(chosen);
      const seating=['table_update','table_payment_update'].includes(purpose)?await API.request('seatingStateV169',{eventId:state.activeEventId}):null;
      if(serial!==qualificationSerialD5D55I)return;
      if(seating&&!Array.isArray(seating.guests))throw new Error('נתוני שיוך השולחנות אינם תקינים');
      qualifiedD5D55I=waEligibleGuestsForTemplateF14Z35_(rows,chosen,seating,{...activeEvent(),__paymentEnabledD5D55D:purpose==='table_payment_update'}, {testThankYouTemplateD5D55FIX12:purpose==='thank_you'&&String(envSelect?.value||'TEST').toUpperCase()==='TEST'});
      qualificationReadyD5D55I=true;
    }catch(err){if(serial!==qualificationSerialD5D55I)return;qualificationErrorD5D55I=err?.message||String(err);}
    refresh();renderPreview();
  };
  const updateCost=n=>{const env=managerTest?'PRODUCTION':String(envSelect?.value||'TEST').toUpperCase();if(env==='TEST'){if(costEl)costEl.textContent='מצב בדיקה — ללא אומדן עלות';return Promise.resolve();}const chosen=templatesF14G.find(x=>String(x.id)===String(tpl.value));return getWaCostEstimateCachedF14_(n,chosen?.category).then(e=>{if(costEl&&String(envSelect?.value||'TEST').toUpperCase()!=='TEST')costEl.textContent=waCostTextF14Z34_(e,chosen?.category);});};
  const refresh=()=>{selected=selectedRows();const to=waPhonePreviewV1190A16_(phone.value),approved=waSelectedTemplateApprovedF14E_(tpl),fb=String(fallback.value||'').trim(),missing=selected.filter(g=>!String(g.invitationGreeting||'').trim()).length;if(eligibleElD5D55J)eligibleElD5D55J.textContent=qualificationReadyD5D55I?qualifiedD5D55I.length:"…";if(countEl)countEl.textContent=selected.length;updateCost(selected.length);summary.textContent=qualificationErrorD5D55I?'טעינת זכאות המוזמנים נכשלה: '+qualificationErrorD5D55I:!qualificationReadyD5D55I?'מחשב זכאות מוזמנים לפי התבנית…':!rows.length?'אין רשומות בסינון הנוכחי.':!selected.length?(resumeQ22?'חלק מהמוזמנים אינם זכאים כעת להמשך השליחה. החידוש נחסם.':'יש לבחור לפחות הודעה אחת.'):missing&&!fb?'יש רשומות ללא פנייה אישית. הזן פנייה חלופית לבדיקה.':!to?'יש להזין מספר בדיקה תקין.':!approved?'תבנית V3 מוכנה לבדיקה, אך השליחה חסומה עד לאישור Meta (APPROVED).':`${selected.length} הודעות יישלחו למספר +${to} בלבד${missing?` · ב-${missing} רשומות תשמש הפנייה החלופית.`:''}`;summary.className='wa-confirm-status-v1190a16'+((qualificationErrorD5D55I||(qualificationReadyD5D55I&&(!to||!approved||!selected.length||(missing&&!fb))))?' error':'');send.disabled=!to||!selected.length||(missing&&!fb)||(!resumeQ22&&tpl.disabled)||!tpl.value||!approved;};
  const dispatchSettingsLoadQ10=waLoadTestDispatchSettingsQ10_();
  const simulationButtonQ42=$('#waSimulationQ42');if(simulationButtonQ42)simulationButtonQ42.onclick=()=>waSimulationOpenQ42_();
  $('#waCheckInterruptedQ22').onclick=()=>waOfferInterruptedQ22_(true);
  const pendingInspectButtonFIX67=$('#waPendingInspectFIX67');
  const pendingInspectResultFIX67=$('#waPendingInspectResultFIX67');
  const quarantineButtonFIX67=$('#waQuarantineFIX67');
  const partialCloseButtonQ15=$('#waPartialCloseQ15');
  let partialCloseCandidateQ15=null;
  let quarantineCandidateQ9=null;
  const resetQuarantineCandidateQ9=()=>{partialCloseCandidateQ15=null;if(partialCloseButtonQ15){partialCloseButtonQ15.hidden=true;partialCloseButtonQ15.disabled=true;}quarantineCandidateQ9=null;if(quarantineButtonFIX67){quarantineButtonFIX67.hidden=true;quarantineButtonFIX67.disabled=true;}};
  resetQuarantineCandidateQ9();
  if(quarantineButtonFIX67){
    quarantineButtonFIX67.onclick=async()=>{
      const candidate=quarantineCandidateQ9;
      if(String(state.session?.role||'')!=='Admin'||!candidate||String(state.activeEventId)!==candidate.eventId){
        resetQuarantineCandidateQ9();pendingInspectResultFIX67.textContent='יש לבצע בדיקת מצב התאוששות מחדש עבור האירוע הנבחר.';return;
      }
      if(!confirm('לבודד את אצוות TEST '+candidate.batchId+' בת 20 הודעות שהתקבלו ב-Meta? הרשומה תישמר בגיבוי; לא תתבצע שליחה והיומן לא ישוחזר.'))return;
      resetQuarantineCandidateQ9();
      if(pendingInspectButtonFIX67)pendingInspectButtonFIX67.disabled=true;
      try{
        const result=await API.request('quarantineAcceptedTestBatchFIX67',{eventId:candidate.eventId,batchId:candidate.batchId,expectedMarkerChecksum:candidate.expectedMarkerChecksum});
        pendingInspectResultFIX67.textContent=result?.released?'האצווה בודדה ונשמרה בגיבוי. אין לשלוח שוב את 20 ההודעות הישנות. לפני בדיקה חדשה יש לבדוק מצב התאוששות שוב.':'לא התקבל אישור לשחרור; יש לבדוק מצב התאוששות מחדש.';
      }catch(error){pendingInspectResultFIX67.textContent='הבידוד לא בוצע: '+(error?.message||String(error));}
      finally{if(pendingInspectButtonFIX67)pendingInspectButtonFIX67.disabled=false;}
    };
  }

  if(partialCloseButtonQ15)partialCloseButtonQ15.onclick=async()=>{
    const c=partialCloseCandidateQ15;
    if(state.session?.role!=='Admin'||!c||String(state.activeEventId)!==c.eventId){resetQuarantineCandidateQ9();return;}
    if(!confirm('לסיים את ניסיון TEST '+c.batchId+' ללא שליחה?\n14 אישורי Meta נשמרים, הודעה אחת נשארת לא ידועה ו-5 נשארות ללא שליחה.\nהפעולה תשמור גיבוי ותסיר את חסימת הניסיון הפעיל. היא לא משלימה את ה-40 ולא שולחת מחדש אף הודעה.'))return;
    resetQuarantineCandidateQ9();pendingInspectButtonFIX67.disabled=true;
    try{
      const r=await API.request('abandonPartialTestBatchQ15',{eventId:c.eventId,batchId:c.batchId,expectedMarkerChecksum:c.expectedMarkerChecksum,expectedJournalChecksum:c.expectedJournalChecksum,acknowledgement:'ABANDON_TEST_KEEP_UNKNOWN_NO_RESEND'});
      pendingInspectResultFIX67.textContent=r?.abandoned===true?'הניסיון החלקי הופסק ונשמר בגיבוי. 14 אישורים נשמרו; הודעה אחת נשארת לא ידועה; 5 לא נשלחו. לא בוצעה השלמה או שליחה חוזרת. כעת יש לבצע בדיקת מצב התאוששות ללא שליחה.':'לא התקבל אישור סיום. יש לבדוק מצב התאוששות ללא שליחה; אין לשלוח שוב.';
    }catch(error){pendingInspectResultFIX67.textContent='לא התקבל אישור לסיום הניסיון: '+String(error?.message||error)+'. יש לבדוק מצב התאוששות ללא שליחה; אין לשלוח שוב.';}
    finally{pendingInspectButtonFIX67.disabled=false;}
  };
  if(pendingInspectButtonFIX67)pendingInspectButtonFIX67.onclick=async()=>{
    resetQuarantineCandidateQ9();
    const inspectedEventQ9=String(state.activeEventId||'');
    if(!state.activeEventId){pendingInspectResultFIX67.textContent='לא נבחר אירוע לבדיקה.';return;}
    pendingInspectButtonFIX67.disabled=true;
    pendingInspectResultFIX67.textContent='בודק רשומות התאוששות בשרת — ללא שליחה…';
    try{
      const result=await API.request('inspectWhatsAppPendingFIX67',{eventId:inspectedEventQ9});
      if(String(state.activeEventId||'')!==inspectedEventQ9){pendingInspectResultFIX67.textContent='האירוע השתנה בזמן הבדיקה; יש לבדוק מחדש.';return;}
      const protocolCurrentQ9=result?.diagnosticVersion==='FIX67Q9';
      if(String(state.session?.role||'')==='Admin')quarantineCandidateQ9=waQuarantineCandidateFromInspectionQ9_(result,inspectedEventQ9);
      if(quarantineButtonFIX67){quarantineButtonFIX67.hidden=!quarantineCandidateQ9;quarantineButtonFIX67.disabled=!quarantineCandidateQ9;}
      if(state.session?.role==='Admin')partialCloseCandidateQ15=waPartialCloseFromInspectionQ15_(result,inspectedEventQ9);
      if(partialCloseButtonQ15){partialCloseButtonQ15.hidden=!partialCloseCandidateQ15;partialCloseButtonQ15.disabled=!partialCloseCandidateQ15;}
      const count=Number(result?.pendingCount||0);
      const propertyCount=Number(result?.pendingPropertyCount||0);
      const malformedCount=Number(result?.malformedPropertyCount||0);
      const blocked=Boolean(result?.blocked);
      const keys=Array.isArray(result?.keys)?result.keys:[];
      const detailsRestricted=Boolean(result?.detailsRestricted);
      const summaries=Array.isArray(result?.stateSummaries)?result.stateSummaries:[];
      const stateText=summaries.map((r,i)=>r.parseError
        ?`רשומה ${i+1}: תוכן לא תקין — נדרשת בדיקה ידנית.`
        :`רשומה ${i+1}: ${r.sameEvent?'אירוע נוכחי':'אירוע אחר'}; יומן: ${r.journalSaved===true?'סומן כשמור':r.journalSaved===false?'לא סומן כשמור':'לא ידוע'}; הודעות: ${r.itemCount}; מצבים: ${Object.entries(r.statuses||{}).map(([k,v])=>k+'='+v).join(', ')||'אין נתונים'}.`).join(' ');
      const journalText=summaries.map((r,i)=>{
        const j=r&&r.journalEvidence;
        if(!j)return `רשומה ${i+1}: תוצאת הצלבה לא הוחזרה מהשרת (יש לבדוק פריסת Backend).`;
        if(j.checked!==true)return `רשומה ${i+1}: הצלבת היומן אינה זמינה (${String(j.reason||'UNKNOWN')}).`;
        return `רשומה ${i+1} — הצלבת יומן: התאמות ודאיות ${Number(j.matched||0)}, לא אומתו ${Number(j.unmatchedMetaIds??j.missing??0)}, לא חד-משמעיות ${Number(j.ambiguous||0)}, רשומות עודפות ${Number(j.extraRows||0)}. ${j.complete===true?'כל הרשומות תואמות; אין בכך אישור לשחרור אוטומטי.':'ההתאמה אינה מלאה; החסימה נשמרת.'}`;
      }).join(' ');
      const backupText=summaries.map((r,i)=>{
        const b=r&&r.backupEvidence;
        if(!b)return `רשומה ${i+1}: בדיקת גיבוי טרם זמינה בשרת.`;
        if(b.checked!==true)return `רשומה ${i+1}: לא ניתן לבדוק את גיבוי ההתאוששות.`;
        return `רשומה ${i+1} — גיבוי: ${Number(b.matched||0)} מזהי Meta נמצאו בגיבוי שמור, ${Number(b.ambiguous||0)} התאמות לא חד-משמעיות, ${Number(b.incompleteGroups||0)} קבוצות גיבוי לא תקינות. בדיקה לקריאה בלבד; אין אישור לשחרור.`;
      }).join(' ');
      const unknownTextQ14=summaries.map((r,i)=>(Array.isArray(r.unknownDiagnosticsQ14)?r.unknownDiagnosticsQ14:[]).map((d,j)=>`רשומה ${i+1}, תוצאה לא־ידועה ${j+1}: HTTP ${Number(d.httpStatus)||0}; קוד ${String(d.errorCode||'לא נשמר')}; סיבה: ${String(d.errorMessage||'לא נשמר פירוט')}.`).join(' ')).filter(Boolean).join(' ');
      pendingInspectResultFIX67.textContent=blocked
        ?`השליחה חסומה: ${count} אצוות מזוהות, ${propertyCount} מפתחות התאוששות${malformedCount?`, מתוכם ${malformedCount} מפתחות חריגים המחייבים בדיקה ידנית`:''}. ${detailsRestricted?'פירוט המפתחות זמין למנהל מערכת בלבד.':'מפתחות: '+(keys.join(', ')||'לא הוחזרו')+'.'} אין למחוק או לשלוח שוב לפני בירור. ${stateText||'אין פירוט מצבי הודעות זמין.'} ${journalText} ${backupText} ${unknownTextQ14}`
        :'לא נמצאו רשומות התאוששות ממתינות בזמן הבדיקה. אין בכך אישור לשלוח שוב אצווה שתוצאתה אינה ידועה.';
      if(partialCloseCandidateQ15)pendingInspectResultFIX67.textContent+=' זמינה אפשרות לסיים את ניסיון ה-TEST החלקי ללא שליחה. ההודעה הלא ידועה תישאר כך בגיבוי וביומן; נדרש אישור מפורש בכפתור.';
      if(!protocolCurrentQ9)pendingInspectResultFIX67.textContent+=' השרת אינו מחזיר את פרוטוקול בדיקת Q9; יש לעדכן גם את קובצי השרת ולפרסם גרסה חדשה. הבידוד אינו זמין.';
    }catch(error){pendingInspectResultFIX67.textContent='בדיקת ההתאוששות נכשלה: '+(error?.message||String(error));}
    finally{pendingInspectButtonFIX67.disabled=false;}
  };
  let templatesF14G=[];let templateLoadSerialD44=0;const renderPreview=()=>{const container=$('#waTestPreviewF14G');if(!container)return;if(!qualificationReadyD5D55I&&!qualificationErrorD5D55I){container.innerHTML='<p class="muted" role="status">מחשב זכאות מוזמנים ומכין תצוגה מקדימה…</p>';return;}if(qualificationErrorD5D55I){container.innerHTML='<p class="wa-confirm-status-v1190a16 error">טעינת נתוני הזכאות נכשלה. לא ניתן להציג תצוגה מקדימה.</p>';return;}const template=waTemplateByIdF14G_(templatesF14G,tpl.value);if(!template){container.innerHTML='<p class="muted">בחר תבנית להצגת תצוגה מקדימה.</p>';return;}const guest=selectedRows()[0];if(!guest){container.innerHTML='<p class="muted">לא נמצאו מוזמנים זכאים לתצוגה מקדימה.</p>';return;}waRenderPreviewF14G_(container,template,guest);};const loadEnvironment=async()=>{const serial=++templateLoadSerialD44;const env=managerTest?'PRODUCTION':String(envSelect?.value||'TEST').toUpperCase();send.disabled=true;tpl.disabled=true;summary.textContent='טוען תבניות WhatsApp…';summary.className='wa-confirm-status-v1190a16';if(costEl&&env==='TEST')costEl.textContent='מצב בדיקה — ללא אומדן עלות';try{const loaded=await waFillTestTemplateSelectF14Z32_(tpl,summary,send,env);if(serial!==templateLoadSerialD44)return;templatesF14G=loaded||[];if(resumeQ22){tpl.value=resumeQ22.templateId;tpl.disabled=true;if(!tpl.value)throw new Error('התבנית השמורה אינה זמינה להמשך שליחה');}await qualifyD5D55I();}catch(error){if(serial!==templateLoadSerialD44)return;templatesF14G=[];qualificationReadyD5D55I=false;qualifiedD5D55I=[];tpl.disabled=true;send.disabled=true;summary.textContent='טעינת התבניות נכשלה: '+(error?.message||String(error));summary.className='wa-confirm-status-v1190a16 error';}};phone.oninput=refresh;if(limit)limit.oninput=()=>{refresh();renderPreview();};fallback.oninput=refresh;tpl.onchange=()=>{qualifyD5D55I();};if(envSelect)envSelect.onchange=loadEnvironment;if(resumeQ22){phone.value=resumeQ22.testPhone;phone.disabled=true;if(envSelect){envSelect.value='TEST';envSelect.disabled=true;}if(limit){limit.value=resumeIdsQ22.length;limit.disabled=true;}}refresh();const templatesReadyQ27=loadEnvironment();$('#waF7Close').onclick=closeModal;$('#waTestJournalZ22').onclick=()=>{closeModal();showPage('whatsappLog');};let testStoppedZ22=false;$('#waTestStopZ22').onclick=()=>{if(testStoppedZ22||!($('#waTestStopZ22').dataset.waBulkConfirmed==='1'||confirm('לעצור את שליחת הבדיקה? הקבוצה שנשלחת כעת עשויה להסתיים.')))return;testStoppedZ22=true;$('#waTestStopZ22').disabled=true;summary.textContent='בקשת העצירה התקבלה. לא תתחיל קבוצת שליחה נוספת.';};
  send.onclick=async()=>{const environment=managerTest?'PRODUCTION':String(envSelect?.value||'TEST').toUpperCase(),to=waPhonePreviewV1190A16_(phone.value),chosen=selectedRows(),templateId=tpl.value,fb=String(fallback.value||'').trim(),missing=chosen.filter(g=>!String(g.invitationGreeting||'').trim()).length;if(!qualificationReadyD5D55I||qualificationErrorD5D55I||!to||!chosen.length||(missing&&!fb)||!templateId||!waSelectedTemplateApprovedF14E_(tpl))return;
    if(autoResumeQ27&&resumeStartedQ27)return;
    const oneClickResumeQ27=autoResumeQ27&&environment==='TEST'&&resumeQ22?.environment==='TEST';
    if(autoResumeQ27&&!oneClickResumeQ27)return;
    if(oneClickResumeQ27)resumeStartedQ27=true;
    const selectedTemplate=templatesF14G.find(x=>String(x.id)===String(templateId));
    if(selectedTemplate&&(environment==='TEST'||String(selectedTemplate.purpose||'')!=='invitation')){
      const ok=oneClickResumeQ27||await waConfirmSendF14V_({title:'אישור שליחת בדיקה',message:`לשלוח ${managerTest?1:chosen.length} הודעות בתבנית "${selectedTemplate.name}" למספר הבדיקה בלבד?`,details:`<dl><dt>סביבה</dt><dd>${esc(environment)}</dd><dt>תבנית</dt><dd>${esc(selectedTemplate.name)}</dd><dt>מספר בדיקה</dt><dd dir="ltr">+${esc(to)}</dd></dl>`});
      if(!ok)return;
      waSetSendingF14V_(send,true,'שולח בדיקה...');
      const closeButton=$('#waF7Close');if(closeButton)closeButton.disabled=true;
      summary.textContent='שולח הודעת בדיקה…';summary.className='wa-confirm-status-v1190a16';
      const requestStarted=performance.now();
      // D5D44: TEST and non-invitation templates must honor the Admin selection.
      // Keep EventManager restricted to one test message.
      const monitorCampaignIdQ19=waMonitorCampaignIdQ19_();
      const sendTokenQ33=state.session?.token,sendEventQ22=String(state.activeEventId);let recoveryIdQ22=resumeQ22?.id||'';
      const testRows=managerTest?chosen.slice(0,1):chosen.slice(); // FIX67: campaign size is not the dispatch batch-size limit.
      let knownPartialQ30=false;
      let verifiedAfterLossQ33=false,uncertainProgressQ33=false;
      let unknownCountQ37=0,acceptedCount=0,failedCount=0,processedCount=0,lastResult=null,firstError='',blockedBeforeDispatchQ14=false,monitorWarningQ17='',totalServerMs=0,logWarningsD49=[];
      const fix20Samples=[],fix20Waits=[];let settingsWaitMsQ10=0;
      const progressBoxD48=$('#waTestProgressF14C');
      const progressBarD48=progressBoxD48?.querySelector('progress');
      const progressTextD48=progressBoxD48?.querySelector('span');
      if(progressBoxD48)progressBoxD48.hidden=false;
      const updateTestProgressD48=()=>{
        if(progressBoxD48){progressBoxD48.waUnknownQ37=unknownCountQ37;progressBoxD48.waProgressQ33=waProgressStateQ33_(testRows.length,processedCount,acceptedCount,failedCount,uncertainProgressQ33);}
        if(progressBarD48)progressBarD48.value=testRows.length?Math.round(processedCount*100/testRows.length):0;
        if(progressTextD48)progressTextD48.textContent=`טופלו ${processedCount}/${testRows.length} · התקבלו ב-Meta ${acceptedCount} · נדחו בשליחה ${failedCount}`;
        summary.textContent=`שולח בדיקה · טופלו ${processedCount}/${testRows.length} · התקבלו ב-Meta ${acceptedCount} · נדחו בשליחה ${failedCount}`;
      };
      updateTestProgressD48();
      // This route previously used only the old inline progress bar.
      let stopGenericTestD14=false;
      const genericStopD14=document.createElement('button');
      genericStopD14.type='button';
      const stopControllerQ25=waStopControllerQ25_(()=>recoveryIdQ22,sendEventQ22,(phase,error)=>{
        genericStopD14.disabled=phase!=='failed';
        const message=phase==='accepted'?'העצירה התקבלה בשרת; הודעות שכבר בתהליך עשויות להגיע. יתר ההודעות בוטלו.':phase==='failed'?'לא אומתה עצירה בשרת — לחץ שוב על עצור שליחה. '+error:'מבקש עצירה מהשרת…';
        if(progressTextD48)progressTextD48.textContent=message;
        genericProgressD14.setStopStateQ25(phase,message);
      });
      genericStopD14.onclick=()=>{
        stopGenericTestD14=true;genericStopD14.disabled=true;
        if(progressTextD48)progressTextD48.textContent='מבקש עצירה מהשרת…';
        void stopControllerQ25.request();
      };
      const genericProgressD14=waBulkProgressWindowZ22_(progressBoxD48,genericStopD14,null,'התקדמות שליחת WhatsApp לבדיקה',testRows.length,environment,!resumeQ22,resumeQ22);
      try{
        // use the server-side prepared batch path. FIX64 mistakenly 
        // called the legacy single-send API 20 times, bypassing fetchAll entirely.
        // one API request for up to 20, progress is polled from the server. 
        const settingsWaitStartedQ10=performance.now();
        const loadedSettingsQ10=await dispatchSettingsLoadQ10;
        settingsWaitMsQ10=performance.now()-settingsWaitStartedQ10;
        if(loadedSettingsQ10.error)throw loadedSettingsQ10.error;
        const dispatchSettingsFIX67=loadedSettingsQ10.settings;
        const testBatchSizeFIX66=Number(dispatchSettingsFIX67.batchSize);
        const pauseSecondsQ49=dispatchSettingsFIX67.pauseSeconds??5;
        if(!Number.isSafeInteger(pauseSecondsQ49)||pauseSecondsQ49<0||pauseSecondsQ49>60)throw new Error('זמן המתנה בין מנות אינו תקין');
        const batchPauseMsQ49=pauseSecondsQ49*1000;
        if(!Number.isSafeInteger(testBatchSizeFIX66)||testBatchSizeFIX66<1||testBatchSizeFIX66>50)throw new Error('הגדרת גודל אצווה אינה תקינה');
        if(environment==='TEST'&&!recoveryIdQ22){const saved=await API.request('beginWhatsAppRecoveryQ22',{eventId:sendEventQ22,environment,testPhone:phone.value,templateId,guestIds:testRows.map(g=>String(g.guestId||g.id))});if(!saved?.id)throw new Error('לא אומתה שמירת רשימת ההודעות; השליחה לא תתחיל');recoveryIdQ22=saved.id;}
        await stopControllerQ25.ready();
        let testRateBrowserWaitQ48=0,retryQueueMsQ51=0;
        for(let offset=0;offset<testRows.length;offset+=testBatchSizeFIX66){
          if(stopGenericTestD14)break;
          const group=testRows.slice(offset,offset+testBatchSizeFIX66);
          let callStarted=performance.now();
          const traceQ35={clockOrigin:Number.isFinite(performance.timeOrigin)?performance.timeOrigin:null,callStartedAt:callStarted},identityQ35={ownerId:state.session?.id,eventId:sendEventQ22,campaignId:monitorCampaignIdQ19,index:Math.floor(offset/testBatchSizeFIX66)+1};
          const progressIdFIX66='p'+Date.now().toString(36)+Math.random().toString(36).slice(2,14);
          let pollActiveFIX66=true;
          let lastPollFIX66=0,lastSnapshotQ33={n:0,a:0,f:0};
          let pollInFlightFIX67=false;
          const pollFIX66=async()=>{
            if(!pollActiveFIX66||pollInFlightFIX67)return;
            pollInFlightFIX67=true;
            try{
              const snapshot=await API.request('getWhatsAppTestBatchProgressFIX66',{eventId:state.activeEventId,progressId:progressIdFIX66});
              if(!pollActiveFIX66||!snapshot)return;
              const n=Math.min(group.length,Math.max(0,Number(snapshot.processed)||0));
              const a=Math.min(n,Math.max(0,Number(snapshot.accepted)||0));
              const f=Math.min(n-a,Math.max(0,Number(snapshot.failed)||0));
              if(n<lastPollFIX66)return;
              lastPollFIX66=n;lastSnapshotQ33={n,a,f};
              if(progressBoxD48)progressBoxD48.waProgressQ33=waProgressStateQ33_(testRows.length,processedCount+n,acceptedCount+a,failedCount+f);
              if(progressBarD48)progressBarD48.value=Math.round((processedCount+n)*100/testRows.length);
              const stageFIX67=snapshot.phase==='RETRY_WAIT_Q50'?` · ${Number(snapshot.retryPendingQ50)||0} הודעות ממתינות לניסיון חוזר לאחר דחיית קצב${resumeQ22?'':'; ניתן לעצור'}`:snapshot.phase==='WAITING_TEST_RATE'?(' · ממתין לקצב הבדיקה לאותו טלפון — זו המתנה מתוכננת'+(resumeQ22?'':'; ניתן לעצור')):snapshot.phase==='JOURNALING'?' · השליחה הסתיימה, מסנכרן יומן':snapshot.phase==='RECOVERY_ERROR'?' · שגיאת מעקב התאוששות':snapshot.phase==='JOURNAL_ERROR'?' · שגיאת יומן':snapshot.phase==='PREPARING'?' · מכין הודעות':'';
              const label=`טופלו ${processedCount+n}/${testRows.length} · התקבלו ב-Meta ${acceptedCount+a} · נדחו ${failedCount+f} · בטיפול ${group.length-n}${stageFIX67}`;
              if(progressTextD48)progressTextD48.textContent=label;
              summary.textContent='שולח בדיקה · '+label;
            }catch(ignore){/* Progress polling must never affect dispatch or cause retries. */}
            finally{pollInFlightFIX67=false;}
          };
          const pollTimerFIX66=setInterval(pollFIX66,1800);
          let batch;
          try{
            while(true){
            callStarted=performance.now();traceQ35.callStartedAt=callStarted;
            batch=await API.request('sendAnyTemplateTestBatchD5D49',{
              eventId:sendEventQ22,recoveryIdQ22,
              guestIds:group.map(g=>String(g.guestId||g.id)),
              testPhone:phone.value,templateId,environment,progressId:progressIdFIX66,
              monitorCampaignQ19:{id:monitorCampaignIdQ19,index:Math.floor(offset/testBatchSizeFIX66)+1,selected:testRows.length,plannedBatchSize:testBatchSizeFIX66,plannedBatches:Math.ceil(testRows.length/testBatchSizeFIX66),plannedPauseMs:batchPauseMsQ49,previousPauseMs:offset?fix20Waits[fix20Waits.length-1]??null:0}
            },{traceQ35});
            if(!batch?.deferredQ48)break;
            if(batch.sent!==0||batch.recoveryIdQ22!==recoveryIdQ22||batch.eventId!==sendEventQ22||batch.expectedNextQ48!==(Number(resumeQ22?.attempted)||0)+offset)throw new Error('לא אומתה דחיית מנה ללא שליחה');
            const keepGoing=()=>!stopGenericTestD14&&state.session?.token===sendTokenQ33&&String(state.activeEventId)===sendEventQ22;
            const rateWaitStartedQ48=performance.now();
            const waited=await waWaitTestPaceQ48_(batch.waitMs,keepGoing,seconds=>{if(progressTextD48)progressTextD48.textContent=`ממתין לקצב הבדיקה — עוד כ־${seconds} שניות. טופלו ${processedCount}/${testRows.length}.${resumeQ22?'':' ניתן לעצור.'}`;});
            testRateBrowserWaitQ48+=performance.now()-rateWaitStartedQ48;
            if(!waited){if(!stopGenericTestD14)throw new Error('המשתמש או האירוע השתנו בזמן ההמתנה');batch={intentionalStopQ25:true,stopped:true,processed:0,accepted:0,failed:0,unknown:0,results:[],canceledQ25:group.length,whatsAppLogSaved:true,recoveryMarkerSaved:true};break;}
            }
            traceQ35.returnedAt=performance.now();identityQ35.batchId=batch?.batchId||'';identityQ35.outcome='RECEIVED';waTimingSaveQ35_(traceQ35,identityQ35);
          }catch(sendError){
            traceQ35.returnedAt=performance.now();identityQ35.outcome='RESPONSE_LOST';waTimingSaveQ35_(traceQ35,identityQ35);
            pollActiveFIX66=false;clearInterval(pollTimerFIX66);
            fix20Samples.push({roundTripMs:performance.now()-callStarted,server:null,serverMs:0,apiMs:0,responseMissingQ13:true});
            // FIX67: distinguish a confirmed pre-dispatch safety gate from an unknown send outcome.
            // Do not infer safety from generic network errors or retry automatically.
            const errorTextFIX67=String(sendError?.message||sendError||'');
            const pendingGateFIX67=/WhatsApp pending recovery records exist \(\d+\); stage=(ENTRY_BEFORE_PREPARATION|LOCKED_BEFORE_RESERVATION)(?:;|$)/.test(errorTextFIX67);
            blockedBeforeDispatchQ14=pendingGateFIX67&&processedCount===0;
            firstError=pendingGateFIX67
              ? 'השליחה נחסמה בבדיקת התאוששות לפני פנייה ל־Meta. אין לבצע שליחה חוזרת עד לבירור: '+errorTextFIX67
              : 'תוצאת האצווה אינה ודאית. יש לבדוק יומן WhatsApp לפני ניסיון חוזר: '+errorTextFIX67;
            console.error('[WA SEND Q13]',{action:'sendAnyTemplateTestBatchD5D49',progressId:progressIdFIX66,elapsedMs:Math.round(performance.now()-callStarted),outcome:pendingGateFIX67?'blocked-before-dispatch':'unknown',error:errorTextFIX67});
            if(!pendingGateFIX67){
              if(progressTextD48)progressTextD48.textContent='מאמת את מצב השליחה מול השרת והיומן… לא נשלחות הודעות נוספות.';
              const baseline={accepted:Number(resumeQ22?.accepted)||0,failed:Number(resumeQ22?.failed)||0,attempted:Number(resumeQ22?.attempted)||0};
              const verified=await waReadSettledAfterLossQ33_(recoveryIdQ22,sendEventQ22,Number(resumeQ22?.total)||testRows.length,(Number(resumeQ22?.attempted)||0)+offset+group.length,baseline,sendTokenQ33);
              if(verified){
                acceptedCount=verified.accepted-baseline.accepted;failedCount=verified.failed-baseline.failed;processedCount=acceptedCount+failedCount;uncertainProgressQ33=false;verifiedAfterLossQ33=true;
                if(verified.messageEvidenceQ48?.available===true)for(const id of verified.messageEvidenceQ48.messageIds||[])genericProgressD14.addMessageId(id);
                firstError='התקשורת נקטעה, אך תוצאות המנה אומתו בשרת. לא תתחיל מנה נוספת אוטומטית. ניתן להמשיך רק דרך חלון ההתאוששות.';
              }else{processedCount+=lastSnapshotQ33.n;acceptedCount+=lastSnapshotQ33.a;failedCount+=lastSnapshotQ33.f;uncertainProgressQ33=true;}
              updateTestProgressD48();
              if(!verified)genericProgressD14.setRecoveryReaderQ48?.(async()=>{
                const fresh=await waReadSettledAfterLossQ33_(recoveryIdQ22,sendEventQ22,Number(resumeQ22?.total)||testRows.length,(Number(resumeQ22?.attempted)||0)+offset+group.length,baseline,sendTokenQ33);
                if(!fresh)return false;
                acceptedCount=fresh.accepted-baseline.accepted;failedCount=fresh.failed-baseline.failed;processedCount=acceptedCount+failedCount;uncertainProgressQ33=false;verifiedAfterLossQ33=true;
                if(fresh.messageEvidenceQ48?.available===true)for(const id of fresh.messageEvidenceQ48.messageIds||[])genericProgressD14.addMessageId(id);
                updateTestProgressD48();return true;
              });
            }
            if(progressTextD48)progressTextD48.textContent=verifiedAfterLossQ33?`טופלו ${processedCount}/${testRows.length} · התקבלו ב-Meta ${acceptedCount} · נדחו בשליחה ${failedCount} · התוצאות אומתו לאחר ניתוק; ההמשך ממתין לפעולה שלך`:blockedBeforeDispatchQ14?'הניסיון נחסם לפני פנייה ל־Meta — לא נשלחו הודעות בניסיון זה':'השליחה נעצרה — לא התקבלה תוצאה מאומתת למנה הפעילה; לא תתחיל מנה נוספת';
            break;
          }
          pollActiveFIX66=false;clearInterval(pollTimerFIX66);
          const batchReturnedAtQ51=performance.now();
          /* Q51 */ if(batch?.retryPendingQ51>0){
            const mergeQ51=reply=>{
              for(const update of reply.updates||[]){const at=batch.results.findIndex(x=>x.guestId===update.guestId);if(at>=0)batch.results[at]={...batch.results[at],...update};}
              batch.recoveryStateQ22=reply.summary.state;
              const known=batch.results.filter(x=>!x.pendingRetryQ51&&!x.canceledQ51),a=known.filter(x=>x.accepted).length,f=known.filter(x=>!x.accepted&&!x.unknown).length;
              for(const item of known)if(item.accepted&&item.result?.messageId)genericProgressD14.addMessageId(item.result.messageId);
              progressBoxD48.waProgressQ33=waProgressStateQ33_(testRows.length,processedCount+known.length,acceptedCount+a,failedCount+f,reply.unknown>0);
              if(progressBarD48)progressBarD48.value=Math.round((processedCount+known.length)*100/testRows.length);
              if(progressTextD48)progressTextD48.textContent=`טופלו ${processedCount+known.length}/${testRows.length} · ${reply.pending} הודעות ממתינות לניסיון חוזר${reply.waitRemainingQ51?` — עוד כ־${reply.waitRemainingQ51} שניות`:''}`;
              batch.retryPendingQ51=reply.pending;batch.stopped=reply.pending>0||reply.unknown>0||reply.finalRetryFailures>0||reply.canceled;
              if(reply.canceled)batch.intentionalStopQ25=true;
            };
            try{await waDrainPairQ51_(recoveryIdQ22,sendEventQ22,()=>!stopGenericTestD14&&state.session?.token===sendTokenQ33&&String(state.activeEventId)===sendEventQ22,mergeQ51);}
            catch(error){firstError='עדכון הניסיונות החוזרים נקטע. המצב שמור בשרת; יש לפתוח את חלון ההתאוששות. '+String(error?.message||error);batch.stopped=true;}
            retryQueueMsQ51+=performance.now()-batchReturnedAtQ51;
            batch.results=batch.results.filter(x=>!x.canceledQ51);
          }
          if(batch?.partialSettledQ30)knownPartialQ30=true;
          if(batch?.intentionalStopQ25)stopGenericTestD14=true;
          if(batch?.recoveryStateQ22==='REVIEW')firstError='התקדמות השליחה דורשת בירור. לא תתחיל מנה נוספת.';
          if(batch?.monitoringSavedQ17===false){monitorWarningQ17='שמירת היסטוריית הניטור נכשלה; תוצאות השליחה מוצגות בנפרד.';if(typeof waRecordClientIssueQ17_==='function')waRecordClientIssueQ17_('sendAnyTemplateTestBatchD5D49','MONITOR_WRITE',0);}
          const batchResults=Array.isArray(batch?.results)?batch.results:[];
          const batchMs=batchReturnedAtQ51-callStarted;
          fix20Samples.push({chunksQ16:batch?.chunkTimingsQ16||null,campaignOffsetQ16:offset,roundTripMs:batchMs,server:batch?.phaseTotalsMs&&typeof batch.phaseTotalsMs==='object'?batch.phaseTotalsMs:null,serverMs:Number(batch?.totalMs)||0,apiMs:Number(batch?.apiTiming?.totalMs)||0,dispatch:batch?.dispatchTimingFIX67||null,preparation:batch?.preparationBreakdownQ10||null,rsvp:batch?.rsvpPreparationQ11||null,media:batch?.mediaPreparationQ12||null,diagnosticsMs:batch?.diagnosticsMsQ11??null});
          totalServerMs+=Number(batch?.totalMs||0);
          for(const item of batchResults){
            if(item.pendingRetryQ51)continue;
            lastResult=item.result||lastResult;
            if(item.accepted){
              acceptedCount++;
              if(item.result?.messageId)genericProgressD14.addMessageId(item.result.messageId);
            }else failedCount++;
            processedCount++;
            if(item.unknown){unknownCountQ37++;uncertainProgressQ33=true;firstError='תוצאת שליחה אינה ודאית; אין לשלוח שוב ללא בדיקת יומן.';}
            if(item.error&&!firstError)firstError=String(item.error);
          }
          if(batch?.recoveryMarkerSaved===false){
            const warning='שמירת רשומת ההתאוששות נכשלה: '+String(batch.recoveryMarkerError||'שגיאה לא ידועה')+'; אין לשלוח שוב או להמשיך לאצווה הבאה ללא בדיקה.';
            logWarningsD49.push(warning);
            firstError=firstError||warning;
          }
          if(batch?.whatsAppLogSaved===false){
            logWarningsD49.push('אצווה '+String(batch.batchId||'')+' ('+String(batchResults.filter(x=>x.accepted).length)+' הודעות שאושרו ב-Meta): '+String(batch.whatsAppLogError||'שמירת יומן נכשלה'));
            firstError=firstError||'שמירת היומן נכשלה; אין לשלוח שוב ללא בירור.';
          }
          updateTestProgressD48();
          if(batch?.stopped||batchResults.length!==group.length||firstError)break;
          if(!managerTest&&processedCount<testRows.length&&!stopGenericTestD14){
            const waitStarted=performance.now();traceQ35.pauseStartedAt=waitStarted;
            await waPauseBetweenBatchesF14Z7_(progressBoxD48,processedCount,testRows.length,Math.floor(processedCount/testBatchSizeFIX66)+1,Math.ceil(testRows.length/testBatchSizeFIX66),requestStarted,batchPauseMsQ49,()=>!stopGenericTestD14&&state.session?.token===sendTokenQ33&&String(state.activeEventId)===sendEventQ22);
            traceQ35.pauseFinishedAt=performance.now();fix20Waits.push(traceQ35.pauseFinishedAt-waitStarted);waTimingSaveQ35_(traceQ35,identityQ35);
          }
        }
        if(stopGenericTestD14){await stopControllerQ25.ready();await stopControllerQ25.wait();if(stopControllerQ25.error)firstError=firstError||'לא אומתה עצירה בשרת: '+stopControllerQ25.error;}
        const r=lastResult;
        const logWarningHtmlD49=logWarningsD49.length?`<p class="error" role="alert"><strong>אזהרה: נמצאו ${logWarningsD49.length} בעיות ביומן או ברשומות ההתאוששות. יש לבדוק את תוצאות Meta לפני המשך שליחה.</strong> אין לשלוח אותן שוב. ${esc(logWarningsD49.join(' | '))}</p>`:'';
        const roundTripMs=performance.now()-requestStarted;
        const serverPerf=r?.performanceD38||r?.performanceD34||r?.performance||null;
        const d38Labels={dataLookupMs:'נתוני אירוע ומוזמן',metaTemplateLookupMs:'קריאת תבנית Meta',payloadAndMediaMs:'בניית הודעה והכנת תמונה',metaApiMs:'קריאת Meta לשליחה',diagnosticsMs:'רישום אבחון',loggingMs:'כתיבה ליומן ועלויות',mediaPreparationMs:'  מתוכן: הכנת תמונה',otherPayloadMs:'  מתוכן: בניית רכיבי הודעה',tableLookupMs:'  מתוכן: בדיקת שיוך שולחנות',componentsAndLinksMs:'  מתוכן: רכיבים וקישורים',whatsAppLogMs:'  מתוכן: כתיבה ליומן WhatsApp',costRecordingMs:'  מתוכן: רישום עלויות',totalMs:'זמן שרת כולל'};
        const serverTiming=serverPerf&&typeof serverPerf==='object'?Object.entries(serverPerf).filter(([k,v])=>/Ms$/.test(k)&&Number.isFinite(Number(v))).map(([k,v])=>`<dt>${esc(d38Labels[k]||k)}</dt><dd>${waFormatElapsedF14V_(Number(v))}</dd>`).join(''):'';
        const fix20Keys={dataLookupMs:'נתוני אירוע ומוזמן',metaTemplateLookupMs:'קריאת תבנית Meta',tableLookupMs:'שיוך שולחנות',mediaPreparationMs:'הכנת תמונה',componentsAndLinksMs:'בניית רכיבים וקישורים',metaApiMs:'קריאת Meta לשליחה',diagnosticsMs:'רישום אבחון',whatsAppLogMs:'כתיבה ליומן WhatsApp',costRecordingMs:'רישום עלויות'};
        const fix20Sum=k=>fix20Samples.reduce((n,x)=>n+Math.max(0,Number(x.server?.[k])||0),0);
        const dispatchPhaseRowsFIX67=[['preparationMs','הכנה עד תחילת פנייה ל־Meta'],['metaWindowMs','פניות ל־Meta ושמירת תוצאות ביניים'],['journalAndFinalizationMs','כתיבת יומן וסגירת התאוששות']].map(([key,label])=>{const vals=fix20Samples.map(x=>x.dispatch?.[key]).filter(v=>typeof v==='number'&&Number.isFinite(v)&&v>=0);return vals.length?`<dt>${label}</dt><dd>${waFormatElapsedF14V_(vals.reduce((a,b)=>a+b,0))}</dd>`:'';}).join('');
        const fix20RoundTrip=fix20Samples.reduce((n,x)=>n+x.roundTripMs,0);
        const fix20ServerTotal=fix20Samples.reduce((n,x)=>n+x.serverMs,0);
        const fix20ApiTotal=fix20Samples.reduce((n,x)=>n+x.apiMs,0);
        const fix20WaitTotal=fix20Waits.reduce((n,x)=>n+x,0);
        const fix20Rows=dispatchPhaseRowsFIX67+waPreparationRowsQ10_(fix20Samples)+waRsvpRowsQ11_(fix20Samples)+waMediaRowsQ12_(fix20Samples)+waChunkTimingRowsQ16_(fix20Samples)+'<dt>שמירת אבחון מרוכזת לאחר הפניות</dt><dd>'+waFormatElapsedF14V_(fix20Samples.reduce((n,x)=>n+(Number(x.diagnosticsMs)||0),0))+'</dd>'+Object.entries(fix20Keys).map(([key,label])=>`<dt>${esc(label)}</dt><dd>${fix20Samples.some(x=>typeof x.server?.[key]==='number')?waFormatElapsedF14V_(fix20Sum(key)):'לא נמדד בנפרד'}</dd>`).join('');
        const fix20TimingHtml=`<div class="wa-timing-d37"><h3>FIX67Q60 — מדידת בקשות אצווה</h3><dl><dt>אצוות עם פירוט מדידה פרטני</dt><dd>${fix20Samples.filter(x=>x.server).length}/${fix20Samples.length}</dd><dt>טיפול בתור הניסיונות החוזרים, כולל המתנות ותקשורת</dt><dd>${waFormatElapsedF14V_(retryQueueMsQ51)}</dd><dt>קריאות API של המנות, כולל תקשורת</dt><dd>${waFormatElapsedF14V_(fix20RoundTrip)}</dd><dt>זמן פונקציית השליחה בשרת</dt><dd>${fix20Samples.some(x=>x.responseMissingQ13)?'לא התקבל פירוט מלא':waFormatElapsedF14V_(fix20ServerTotal)}</dd><dt>זמן טיפול API בשרת</dt><dd>${fix20Samples.some(x=>x.responseMissingQ13)?'לא התקבל פירוט מלא':waFormatElapsedF14V_(fix20ApiTotal)}</dd><dt>זמן מחוץ לטיפול API (הערכה)</dt><dd>${fix20Samples.some(x=>x.responseMissingQ13)?'לא ניתן לחשב ללא תשובת שרת':waFormatElapsedF14V_(Math.max(0,fix20RoundTrip-fix20ApiTotal))}</dd><dt>המתנה להגדרות לאחר אישור השליחה</dt><dd>${waFormatElapsedF14V_(settingsWaitMsQ10)}</dd><dt>השהיות בין מנות</dt><dd>${waFormatElapsedF14V_(fix20WaitTotal)}</dd><dt>המתנה מתוכננת לקצב טלפון הבדיקה בדפדפן</dt><dd>${waFormatElapsedF14V_(testRateBrowserWaitQ48)}</dd>${fix20Rows}</dl><p class="muted">רכיבי משנה עשויים לחפוף; אין לסכום אותם. נתוני שרת מתקבלים רק מהודעות שהחזירו תשובה.</p></div>`;
        console.info('[WA FIX20 PERF]',{samples:fix20Samples.length,roundTripMs:Math.round(fix20RoundTrip),serverMs:Math.round(fix20ServerTotal),apiMs:Math.round(fix20ApiTotal),waitMs:Math.round(fix20WaitTotal),breakdown:Object.fromEntries(Object.keys(fix20Keys).map(k=>[k,fix20Sum(k)]))});
        const timingHtml=`<div class="wa-timing-d37"><h3>פירוט זמנים — TEST</h3><dl><dt>קריאת API כולל תקשורת</dt><dd>${waFormatElapsedF14V_(roundTripMs)}</dd><dt>פירוט מהשרת</dt><dd>${serverTiming?'התקבל':'לא התקבל נתון'}</dd>${serverTiming}</dl><p class="muted">זמן קריאת API כולל זמן שרת, תקשורת והמתנה; אין לחבר אותו לזמני השרת.</p></div>`;
        console.info('[WA PERF] sendAnyTemplateToTestNumber',{roundTripMs:Math.round(roundTripMs),serverPerfAvailable:!!serverTiming});
        if(state.session?.role==='EventManager'){
          summary.innerHTML=`<p><strong>טופלו ${processedCount}/${testRows.length} · התקבלו ב-Meta ${acceptedCount} · נדחו בשליחה ${failedCount}.</strong></p>${firstError?`<p>${esc(firstError)}</p>`:''}${logWarningHtmlD49}<p>נמען: <span dir="ltr">+${esc(r?.recipient||to)}</span> · זמן: ${waFormatElapsedF14V_(roundTripMs)}</p>${timingHtml}${fix20TimingHtml}<p class="muted">התקבלו ב-Meta אינם בהכרח נמסרו לטלפון. בדוק את יומן WhatsApp לדיווחי מסירה וכישלון מאוחרים.</p>`;
        }else{
          summary.innerHTML=`<p><strong>טופלו ${processedCount}/${testRows.length} · התקבלו ב-Meta ${acceptedCount} · נדחו בשליחה ${failedCount}</strong></p>${firstError?`<p>השליחה נעצרה: ${esc(firstError)}. יש לבדוק את יומן WhatsApp לפני ניסיון חוזר.</p>`:''}${logWarningHtmlD49}<p>זמן שרת מצטבר: ${fix20Samples.some(x=>x.responseMissingQ13)?'לא התקבל פירוט מלא':waFormatElapsedF14V_(totalServerMs)}</p>`+timingHtml+fix20TimingHtml+waResultHtmlF14V_({ok:acceptedCount,fail:failedCount,left:testRows.length-processedCount,elapsedMs:roundTripMs,test:true,uncertain:!!firstError&&!blockedBeforeDispatchQ14&&!knownPartialQ30&&!verifiedAfterLossQ33,blockedBeforeDispatch:blockedBeforeDispatchQ14,canceled:stopGenericTestD14&&!firstError});
        }
        if(knownPartialQ30)summary.innerHTML+='<p>התוצאות אומתו ונשמרו. אפשר להמשיך בהמשך רק עם ההודעות שטרם נשלחו; הודעות שאושרו או נדחו אינן נשלחות שוב אוטומטית.</p>';
        if(monitorWarningQ17)summary.innerHTML+='<p class="error">'+esc(monitorWarningQ17)+'</p>';
        genericProgressD14.finish(stopGenericTestD14?(stopControllerQ25.error?'לא אומתה עצירה בשרת; יש לבדוק ביומן ובניטור':'השליחה נעצרה לבקשת המשתמש; ההודעות שלא נשלחו בוטלו'):progressTextD48?.textContent||'השליחה הסתיימה',!!(failedCount||firstError||stopGenericTestD14),!!stopControllerQ25.error,{canceled:stopGenericTestD14&&!stopControllerQ25.error&&!firstError});
        summary.className='wa-confirm-status-v1190a16 '+((failedCount||firstError||logWarningsD49.length||stopGenericTestD14)?'error':'success');waSetSendingF14V_(send,false);send.disabled=true;if(closeButton)closeButton.disabled=false;
      }catch(e){
        const elapsed=performance.now()-requestStarted;
        summary.innerHTML=`<p><strong>שליחת הבדיקה נכשלה:</strong> ${esc(e?.message||String(e))}</p><p>זמן עד לכישלון: ${waFormatElapsedF14V_(elapsed)}</p>`;
        genericProgressD14.finish('שליחת הבדיקה נכשלה',true);
        summary.className='wa-confirm-status-v1190a16 error';waSetSendingF14V_(send,false);if(closeButton)closeButton.disabled=false;
      }
      return;
    }
    if(managerTest){
      const confirmed=await waConfirmSendF14V_({title:'אישור שליחת WhatsApp לבדיקה',message:`לשלוח הודעת בדיקה אחת למספר +${to}?`,details:`<b>תבנית:</b> ${esc(selectedTemplate?.displayName||selectedTemplate?.name||selectedTemplate?.metaName||'הזמנה לאירוע')} · <b>כמות:</b> 1`});if(!confirmed)return;
      const started=performance.now();waSetSendingF14V_(send,true,'בודק תבנית ב-Meta...');const closeBtn=$('#waF7Close');if(closeBtn)closeBtn.disabled=true;
      try{
        const validationStartedD32=performance.now();const validation=await API.request('validateInvitationTemplateAgainstMetaF14Z43',{templateId});const validationMsD32=performance.now()-validationStartedD32;console.info('[WA PERF] Meta template validation',Math.round(validationMsD32),'ms');
        if(!validation?.ok)throw new Error('מבנה התבנית ב-Meta אינו מתאים לשליחת ההזמנה: '+(validation?.issues||[]).join(' · '));
        waSetSendingF14V_(send,false);waSetSendingF14V_(send,true,'שולח בדיקה...');
        const g=chosen[0],sendStartedD32=performance.now(),r=await API.request('sendOneInvitationToTestNumberA19P2F8',{eventId:state.activeEventId,guestId:g.guestId||g.id,testPhone:to,templateId});const sendMsD32=performance.now()-sendStartedD32;console.info('[WA PERF] single test send',Math.round(sendMsD32),'ms');
        const elapsedMs=performance.now()-started;
        summary.innerHTML=`<div class="wa-result-f14v success"><strong>תוצאת בדיקת WhatsApp</strong><dl><dt>תבנית</dt><dd>${esc(selectedTemplate?.displayName||selectedTemplate?.name||selectedTemplate?.metaName||'הזמנה לאירוע')}</dd><dt>מספר שהוזן</dt><dd dir="ltr">${esc(phone?.value||'')}</dd><dt>מספר שנשלח ל-Meta</dt><dd dir="ltr">+${esc(r?.requestedRecipient||to)}</dd><dt>מספר ש-Meta זיהתה</dt><dd dir="ltr">+${esc(r?.recipient||to)}</dd><dt>כמות הודעות</dt><dd>1</dd><dt>סטטוס Meta</dt><dd>${r?.accepted?'התקבלה לשליחה':'נכשלה'}</dd><dt>זמן כולל</dt><dd>${waFormatElapsedF14V_(elapsedMs)}</dd><dt>בדיקת Meta</dt><dd>${waFormatElapsedF14V_(validationMsD32)}</dd><dt>שליחה לשרת</dt><dd>${waFormatElapsedF14V_(sendMsD32)}</dd>${r?.performanceD34?`<dt>איתור נתוני מוזמן</dt><dd>${waFormatElapsedF14V_(r.performanceD34.lookupMs||0)}</dd><dt>הכנת תמונה ו-Payload</dt><dd>${waFormatElapsedF14V_(r.performanceD34.buildMediaMs||0)}</dd><dt>שליחה ורישום</dt><dd>${waFormatElapsedF14V_(r.performanceD34.sendAndLogMs||0)}</dd>`:''}<dt>Template Meta</dt><dd dir="ltr">${esc(r?.templateName||selectedTemplate?.metaName||'')}</dd><dt>Language</dt><dd dir="ltr">${esc(r?.templateLanguage||'')}</dd><dt>Components</dt><dd dir="ltr">${esc((r?.componentTypes||[]).join(' → '))}</dd><dt>תמונת הזמנה</dt><dd>${r?.mediaSource==='fresh-upload'?'Fresh upload — ללא Media Cache':esc(r?.mediaSource||'לא ידוע')}</dd><dt>קבלה בטלפון</dt><dd>לא ניתן לאמת ללא אישור מסירה</dd></dl><p class="muted">Meta קיבלה את בקשת השליחה, אך סטטוס זה אינו מוכיח שההודעה הגיעה למכשיר.</p></div>`;
        summary.className='wa-confirm-status-v1190a16 success';waSetSendingF14V_(send,false);send.disabled=true;if(closeBtn)closeBtn.disabled=false;
      }catch(e){summary.innerHTML=`<p><strong>שליחת הבדיקה נכשלה</strong></p><p>${esc(e?.message||String(e))}</p>`;summary.className='wa-confirm-status-v1190a16 error';waSetSendingF14V_(send,false);if(closeBtn)closeBtn.disabled=false;}
      return;
    }
    // FIX67: TEST bulk uses the same server-authorized batch size as the live path.
    // Fail before preparing media or contacting Meta if the setting is unavailable.
    let testBatchSizeFIX67;
    try {
      const settingsFIX67=await API.request('getWhatsAppDispatchSettingsFIX67',{});
      testBatchSizeFIX67=Number(settingsFIX67?.batchSize);
      if(!Number.isSafeInteger(testBatchSizeFIX67)||testBatchSizeFIX67<1||testBatchSizeFIX67>50)
        throw new Error('גודל אצווה לא תקין (1–50)');
    } catch(e) {
      summary.textContent='הבדיקה נעצרה: לא ניתן לטעון הגדרות אצווה מהשרת. '+String(e?.message||e);
      summary.className='wa-confirm-status-v1190a16 error';
      return;
    }
    // TEST: suppress monetary estimates in the test confirmation; Meta may still bill for sends.
    const confirmed=await waConfirmSendF14V_({title:'אישור שליחת WhatsApp לבדיקה',message:`לשלוח ${chosen.length} הודעות למספר +${to} בלבד?`,details:`<b>כמות:</b> ${chosen.length} · <b>מצב:</b> בדיקה — ללא אומדן עלות${missing?` · <b>פנייה חלופית:</b> ${esc(fb)}`:''}`});if(!confirmed)return;
    const started=performance.now();testStoppedZ22=false;const testStopButtonZ22=$('#waTestStopZ22');testStopButtonZ22.hidden=false;testStopButtonZ22.disabled=false;$('#waTestJournalZ22').hidden=true;waSetSendingF14V_(send,true);const box=$('#waTestProgressF14C');box.hidden=false;box.querySelector('span').textContent='מכין שליחה · בודק Media ושער דולר...';const bulkWindowZ22=waBulkProgressWindowZ22_(box,testStopButtonZ22,$('#waTestJournalZ22'),'התקדמות שליחת WhatsApp לבדיקה',chosen.length,environment);let prepared;const prepareStartedD34=performance.now();try{prepared=await API.request('prepareWhatsAppSendF14Z9',{templateId,eventId:state.activeEventId});const prepareMsD34=performance.now()-prepareStartedD34;console.info('[WA PERF] prepareWhatsAppSend',Math.round(prepareMsD34),'ms');box.querySelector('span').textContent=`הכנה הושלמה · Media: ${prepared.mediaSource} · שער דולר: ${prepared.costSource} · Messages: ${chosen.length}`;}catch(e){summary.innerHTML=`<p><strong>הכנת השליחה נכשלה:</strong> ${esc(e?.message||'שגיאה לא ידועה')}</p>`;summary.className='wa-confirm-status-v1190a16 error';waSetSendingF14V_(send,false);testStopButtonZ22.hidden=true;bulkWindowZ22.finish('הכנת השליחה נכשלה',true);return;}if(phone)phone.disabled=true;if(tpl)tpl.disabled=true;if(limit)limit.disabled=true;if(fallback)fallback.disabled=true;const closeBtn=$('#waF7Close');if(closeBtn)closeBtn.disabled=true;let ok=0,fail=0,receivedServerPerfD35=false,batchRoundTripsD35=[],perf={eventMs:0,ensureMs:0,guestsMs:0,configTemplateMs:0,mediaMs:0,rsvpMs:0,buildMs:0,metaMs:0,processMs:0,pricingMs:0,waLogWriteMs:0,costWriteMs:0,activityWriteMs:0,diagnosticMs:0,writeMs:0,totalMs:0};
    const chunkSize=testBatchSizeFIX67,totalBatches=Math.ceil(chosen.length/chunkSize);let done=0,batchError='',batchMeta=[];
    for(let i=0,batchNo=1;i<chosen.length;i+=chunkSize,batchNo++){if(testStoppedZ22)break;const chunk=chosen.slice(i,i+chunkSize);const elapsed=performance.now()-started;box.querySelector('span').textContent=`קבוצת שליחה ${batchNo}/${totalBatches} · ${done}/${chosen.length} · הצליחו ${ok} · נכשלו ${fail} · ${waFormatElapsedF14V_(elapsed)}`;try{const batchStartedD35=performance.now();const r=await API.request('sendInvitationBatchF14U',{eventId:state.activeEventId,items:chunk.map(g=>({guestId:g.guestId||g.id,testGreeting:String(g.invitationGreeting||'').trim()||fb})),testPhone:to,templateId,mediaId:prepared.mediaId,costEstimate:prepared.costEstimate});if(!r||typeof r.accepted!=='number'||typeof r.failed!=='number'||!Number.isSafeInteger(r.accepted)||!Number.isSafeInteger(r.failed)||r.accepted<0||r.failed<0||r.accepted+r.failed!==chunk.length)throw new Error('קבוצת השליחה החזירה ספירות לא עקביות; יש לבדוק יומן לפני חידוש');if(r.waLogError){throw new Error('השליחה נעצרה: Meta עשויה הייתה לקבל את ההודעות, אך שמירת יומן WhatsApp נכשלה. אין לשלוח שוב לפני שחזור היומן. פרטים: '+String(r.waLogError));}const acceptedCount=r.accepted,failedCount=r.failed;if(typeof acceptedCount!=='number'||typeof failedCount!=='number'||!Number.isSafeInteger(acceptedCount)||!Number.isSafeInteger(failedCount)||acceptedCount<0||failedCount<0||acceptedCount+failedCount!==chunk.length)throw new Error('תוצאות אצוות השליחה אינן תואמות למספר הנמענים; יש לברר מצב הודעות לפני חידוש');const expectedBatchIds=new Set(chunk.map(g=>String(g.guestId||g.id||'')));const actualResults=r.results;if(!Array.isArray(actualResults)||actualResults.length!==chunk.length||new Set(actualResults.map(x=>String(x&&x.guestId||''))).size!==chunk.length||actualResults.some(x=>!x||typeof x.accepted!=='boolean'||!expectedBatchIds.has(String(x.guestId||'')))||actualResults.filter(x=>x.accepted).length!==acceptedCount)throw new Error('פירוט תוצאות האצווה אינו תואם לנמענים או לסיכום; אין להמשיך שליחה לפני בירור');actualResults.filter(x=>x.accepted&&x.messageId).forEach(x=>bulkWindowZ22.addMessageId(x.messageId));ok+=acceptedCount;fail+=failedCount;batchRoundTripsD35.push(performance.now()-batchStartedD35);if(r.performance){receivedServerPerfD35=true;Object.keys(perf).forEach(k=>perf[k]+=Number(r.performance[k]||0));}if(r.metaSummary)batchMeta.push({batchNo,...r.metaSummary});done+=chunk.length;box.waProgressQ33=waProgressStateQ33_(chosen.length,done,ok,fail);box.querySelector('progress').value=Math.round(done*100/chosen.length);box.querySelector('span').textContent=`קבוצת שליחה ${batchNo}/${totalBatches} הסתיימה · ${done}/${chosen.length} · הצליחו ${ok} · נכשלו ${fail} · ${waFormatElapsedF14V_(performance.now()-started)}`;if(done<chosen.length&&!testStoppedZ22)await waPauseBetweenBatchesF14Z7_(box,done,chosen.length,batchNo+1,totalBatches,started);}catch(e){batchError=e?.message||'קבוצת השליחה לא החזירה תשובה תקינה';box.querySelector('span').textContent=`השליחה נעצרה בקבוצת שליחה ${batchNo}/${totalBatches} · ${done}/${chosen.length} טופלו`;break;}}
    const elapsedMs=performance.now()-started,left=chosen.length-done;if(!batchError&&!testStoppedZ22)box.querySelector('progress').value=100;box.querySelector('span').textContent=batchError?`נעצר לאחר ${done}/${chosen.length} · ${waFormatElapsedF14V_(elapsedMs)}`:`הושלם ${done}/${chosen.length} · הצליחו ${ok} · נכשלו ${fail} · ${waFormatElapsedF14V_(elapsedMs)}`;summary.innerHTML=(testStoppedZ22?`<p><strong>הבדיקה נעצרה לבקשת המשתמש.</strong> טופלו ${done} מתוך ${chosen.length}; ${left} לא נשלחו.</p>`:'')+(managerTest?(batchError?`<p><strong>שליחת הבדיקה נכשלה.</strong></p><p>${esc(batchError)}</p>`:`<p><strong>הודעת הבדיקה התקבלה ב-Meta לשליחה.</strong></p><p>נמען: <span dir="ltr">+${esc((batchMeta[batchMeta.length-1]?.recipient)||to)}</span> · זמן: ${waFormatElapsedF14V_(elapsedMs)}</p><p class="muted">אישור Meta אינו אישור שההודעה נמסרה למכשיר.</p>`):(`<p><strong>זמן הכנה:</strong> ${waFormatElapsedF14V_(prepareMsD34)}</p><p><strong>מסלול רשת:</strong> Media: ${esc(prepared.mediaSource)} · שער דולר: ${esc(prepared.costSource)} · Messages: ${chosen.length}</p>`+waBatchMetaHtmlF14Z11_(batchMeta)+(batchError?`<p><strong>השליחה נעצרה:</strong> ${esc(batchError)}. לא ניתן לקבוע אם קבוצת השליחה שלא החזירה תשובה נמסרה בפועל; יש לבדוק ב-WhatsApp לפני ניסיון נוסף.</p>`:'')+`<div class="wa-timing-d35"><h3>מדידת זמנים — TEST</h3><dl><dt>הכנת שליחה (כולל תקשורת)</dt><dd>${waFormatElapsedF14V_(prepareMsD34)}</dd><dt>שליחת קבוצות (כולל תקשורת)</dt><dd>${waFormatElapsedF14V_(batchRoundTripsD35.reduce((a,b)=>a+b,0))}</dd><dt>פירוט זמנים מהשרת</dt><dd>${receivedServerPerfD35?'התקבל':'לא התקבל נתון'}</dd></dl></div>`+waResultHtmlF14V_({ok,fail,left,elapsedMs,test:true,perf:receivedServerPerfD35?perf:null,uncertain:!!batchError})));summary.className='wa-confirm-status-v1190a16 '+((fail||batchError||testStoppedZ22)?'error':'success');testStopButtonZ22.hidden=true;$('#waTestJournalZ22').hidden=false;box.waProgressQ33=waProgressStateQ33_(chosen.length,done,ok,fail,!!batchError);bulkWindowZ22.finish(box.querySelector('span').textContent,!!(fail||batchError||testStoppedZ22),false,{canceled:testStoppedZ22&&!batchError});waSetSendingF14V_(send,false);send.disabled=true;$('#waF7Close').disabled=false;
  };
  if(autoResumeQ27){
    await templatesReadyQ27;
    // Discard preparations after a session, event or dialog change. Never retry
    // the send automatically after an error or another click.
    if(state.session?.token!==resumeTokenQ27||String(state.activeEventId)!==resumeEventQ27||$('#waF8Send')!==send){resumePreparingQ27?.dispose();return;}
    if(resumeCanceledQ27){
      await resumeStopControllerQ27.wait();
      resumePreparingQ27?.finish(resumeStopControllerQ27.error?'לא אומתה עצירה בשרת; ניתן לנסות שוב לעצור':'המשך השליחה בוטל לבקשת המשתמש',true,!!resumeStopControllerQ27.error);
      if($('#waF8Send')===send)closeModal();return;
    }
    if(resumeQ22.environment!=='TEST'||send.disabled||!qualificationReadyD5D55I||qualificationErrorD5D55I||selectedRows().length!==resumeIdsQ22.length){
      resumePreparingQ27?.finish('המשך השליחה נחסם: '+(summary.textContent||'פרטי השליחה אינם זמינים'),true);
      closeModal();return;
    }
    resumePreparingQ27?.dispose();
    await send.onclick();
    if($('#waF8Send')===send)closeModal();
  }
}


function waBatchMetaHtmlF14Z11_(rows){
  if(!Array.isArray(rows)||!rows.length)return '';
  return `<div class="wa-meta-batches-f14z11"><strong>אבחון Meta לפי קבוצת שליחה:</strong>${rows.map(x=>{const statuses=Object.entries(x.messageStatusCounts||{}).map(([k,v])=>`${esc(k)}: ${v}`).join(' · ')||'ללא סטטוס';return `<p>קבוצה ${x.batchNo}: תגובות ${x.responseCount} · HTTP 2xx ${x.http2xxCount} · wamid ${x.messageIdCount} · ייחודיים ${x.uniqueMessageIdCount} · ${statuses}</p>`;}).join('')}</div>`;
}

function waEligibleGuestsForTemplateF14Z35_(rows,template,seating,event,options={}){
  const purpose=waTemplatePurposeD5D55D_(template);
  const seatingGuests=new Map((seating?.guests||[]).map(g=>[String(g.guestId||''),g]));
  const isConfirmed=g=>String(g.rsvpStatus||g.status||'').toLowerCase()==='confirmed'||Number(g.confirmedCount||0)>0;
  const isAwaitingDecision=g=>{
    const status=String(g.rsvpStatus||g.status||'').trim().toLowerCase();
    return ['pending','ממתין','ממתינים לתשובה','undecided','maybe','tentative','considering','מתלבט','מתלבטים'].includes(status);
  };
  const isFullySeated=g=>{
    const required=Math.max(0,Math.trunc(Number(g.confirmedCount)||0));
    const sg=seatingGuests.get(String(g.guestId||g.id||''));
    return required>0&&!!sg&&Number(sg.assignedCount||0)>=required&&String(sg.seatingStatus||'')==='FULL';
  };
  const paymentEnabled=!!event?.__paymentEnabledD5D55D;
  return (rows||[]).filter(g=>{
    if(!guestSendChecked(g)||!waPhonePreviewV1190A16_(g.phone))return false;
    if(purpose==='rsvp_update')return isAwaitingDecision(g);
    if(purpose==='table_update')return isConfirmed(g)&&isFullySeated(g);
    if(purpose==='table_payment_update')return paymentEnabled&&isConfirmed(g)&&isFullySeated(g);
    if(purpose==='thank_you')return options.testThankYouTemplateD5D55FIX12?true:Number(g.actualAttendees||g.actualAttendance||0)>0;
    return true;
  });
}
async function openGuestWhatsAppRealF14C_(preferredTemplateId='',preferredGuestId=''){
  if(!['Admin','EventManager'].includes(state.session?.role)||!state.activeEventId)return;
  const filter=$('#guestSendFilterA19P2F6');if(!preferredGuestId){filter.value='yes';renderGuests();}
  const filtered=filteredGuests(),rows=preferredGuestId?state.guests.filter(g=>String(g.eventId)===String(state.activeEventId)&&String(g.guestId||g.id)===String(preferredGuestId)&&guestSendChecked(g)):filtered;
  let eligible=rows.filter(g=>waPhonePreviewV1190A16_(g.phone)),invalid=rows.filter(g=>!waPhonePreviewV1190A16_(g.phone)),templatesF14Z35=[];
  const singleGuestD5D55Z22=!!preferredGuestId;
  const adminD5D55Z22=state.session?.role==='Admin';
  modal(`<section role="dialog"><h2>שליחת WhatsApp</h2><p>${preferredGuestId?'שליחה למוזמן שנבחר.':'סינון ״שליחה״ הוגדר ל״כן״. יתר הסינונים נשמרו.'}</p>
  <div class="wa-template-picker-fix7"><label for="waRealTemplateF14C">תבנית WhatsApp <span class="required-star">*</span></label><select id="waRealTemplateF14C" aria-label="תבנית WhatsApp" disabled><option value="">טוען תבניות…</option></select><span id="waRealTemplateLoadFix8" class="wa-template-loading-fix8" role="status" aria-live="polite">טוען תבניות…</span></div>
  <p id="waRealEligibleLineF14Z35"><b>מיועדים לשליחה:</b> ${eligible.length}${invalid.length?` · <b>חסומים בגלל נתון חסר/לא תקין:</b> ${invalid.length}`:''}</p>
  <div class="wa-send-preview-f14g" id="waRealPreviewF14G"><p class="muted">Preview ההזמנה יוצג לאחר טעינת התבנית.</p></div>
  <dl class="wa-confirm-details-v1190a16"><dt>כמות הודעות</dt><dd id="waRealCountF14Z35">${eligible.length}</dd><dt>עלות משוערת</dt><dd id="waRealCostF14C">טוען…</dd></dl>
  <p id="waRealStatusF14C" class="wa-confirm-status-v1190a16"></p>${singleGuestD5D55Z22?'':'<div class="wa-progress-f14c" id="waRealProgressF14C" hidden><progress max="100" value="0"></progress><span></span></div>'}
  <div class="actions"><button type="button" class="secondary" id="waRealCloseF14C">סגור</button><button type="button" class="secondary" id="waRealJournalZ22" hidden>צפייה ביומן WhatsApp</button><button type="button" class="danger" id="waRealStopF14C" hidden>■ עצור שליחה</button><button type="button" class="primary" id="waRealSendF14C" ${!eligible.length||invalid.length?'disabled':''}>שלח WhatsApp</button></div></section>`);
  {const x=$('#waRealCostF14C');if(x)x.textContent='ממתין לבחירת תבנית…';}
  let paymentStateD5D55D=null;
  let templateLoadSequenceZ22Fix5=0;
  let templateRefreshSequenceFix9=0;
  let templateBusyZ22Fix5=false;
  const setTemplateBusyZ22Fix5=(busy)=>{
    templateBusyZ22Fix5=busy;
    const send=$('#waRealSendF14C');
    if(!send)return;
    if(busy){
      send.disabled=true;
      send.innerHTML='<span class="wa-button-spinner-z22fix5" aria-hidden="true"></span> טוען תבנית...';
      send.setAttribute('aria-busy','true');
    }else{
      send.textContent='שלח WhatsApp';
      send.removeAttribute('aria-busy');
    }
  };
  const loadTemplatesD5D55Z22=(select,status,send)=>waFillTemplateSelectF14D_(select,status,send,state.activeEventId);
  const setupTemplatesD5D55Z22=async()=>{
    const sequence=++templateLoadSequenceZ22Fix5;
    ++templateRefreshSequenceFix9;
    const activeSelect=$('#waRealTemplateF14C');
    if(activeSelect){activeSelect.disabled=true;activeSelect.innerHTML='<option value="">טוען תבניות…</option>';}
    templatesF14Z35=[];
    const loadNoteFix8=$('#waRealTemplateLoadFix8');
    if(loadNoteFix8){loadNoteFix8.textContent='טוען תבניות…';loadNoteFix8.hidden=false;}
    setTemplateBusyZ22Fix5(true);
    try{
    // Load into a detached selector so an older request cannot overwrite the
    // currently visible environment's templates.
    const detachedSelect=document.createElement('select');
    const detachedStatus=document.createElement('p');
    const envAtStart='PRODUCTION';
    const t=await loadTemplatesD5D55Z22(detachedSelect,detachedStatus,null,envAtStart);
    if(sequence!==templateLoadSequenceZ22Fix5)return;
    const liveSelect=$('#waRealTemplateF14C');
    liveSelect.innerHTML=detachedSelect.innerHTML;
    liveSelect.disabled=detachedSelect.disabled;
    if(detachedStatus.textContent){const status=$('#waRealStatusF14C');status.textContent=detachedStatus.textContent;status.className=detachedStatus.className;}
    try{
      const ps=await waPaymentGetFix6(state.activeEventId);
      paymentStateD5D55D=!!ps?.enabled&&Array.isArray(ps.methods)&&ps.methods.some(m=>/^https:\/\//i.test(String(m.url||'')));
    }catch(e){
      const status=$('#waRealStatusF14C');if(status){status.textContent='לא ניתן לטעון את הגדרות התשלום: '+(e?.message||String(e));status.className='wa-confirm-status-v1190a16 error';}
      $('#waRealSendF14C').disabled=true;return;
    }

    if(sequence!==templateLoadSequenceZ22Fix5)return;
    templatesF14Z35=t;const sel=$('#waRealTemplateF14C');if(preferredTemplateId&&[...sel.options].some(o=>String(o.value)===String(preferredTemplateId)))sel.value=String(preferredTemplateId);
    const selected=waTemplateByIdF14G_(t,sel.value);
    if(['table_update','table_payment_update'].includes(waTemplatePurposeD5D55D_(selected))){
      const wanted=paymentStateD5D55D?'table_payment_update':'table_update';
      const match=t.find(x=>waTemplatePurposeD5D55D_(x)===wanted&&[...sel.options].some(o=>String(o.value)===String(x.id)&&!o.disabled));
      if(match)sel.value=String(match.id);
    }

    const refresh=async()=>{
      const refreshSequence=++templateRefreshSequenceFix9;
      const environmentSequence=sequence;
      setTemplateBusyZ22Fix5(true);
      try{
      const chosen=waTemplateByIdF14G_(t,sel.value);if(!chosen)return;
      if(['table_update','table_payment_update'].includes(waTemplatePurposeD5D55D_(chosen))){try{state.seating=await API.request('seatingStateV169',{eventId:state.activeEventId});}catch(err){eligible=[];const status=$('#waRealStatusF14C');if(status){status.textContent='לא ניתן לטעון נתוני שיוך שולחנות: '+(err?.message||String(err));status.className='wa-confirm-status-v1190a16 error';}$('#waRealSendF14C').disabled=true;return;}}
      if(environmentSequence!==templateLoadSequenceZ22Fix5||refreshSequence!==templateRefreshSequenceFix9)return;
      // A single guest is selected explicitly. Keep the confirmation action available
      // for every approved template; the backend remains the authority for
      // template-specific eligibility (RSVP, seating, attendance and payment).
      // Bulk sends continue to use the strict frontend eligibility filter.
      eligible=singleGuestD5D55Z22
        ?rows.filter(g=>guestSendChecked(g)&&waPhonePreviewV1190A16_(g.phone))
        :waEligibleGuestsForTemplateF14Z35_(rows,chosen,state.seating,{...activeEvent(),__paymentEnabledD5D55D:paymentStateD5D55D});invalid=rows.filter(g=>!waPhonePreviewV1190A16_(g.phone));
      const line=$('#waRealEligibleLineF14Z35'),cnt=$('#waRealCountF14Z35'),send=$('#waRealSendF14C');if(line)line.innerHTML=`<b>מיועדים לשליחה:</b> ${eligible.length} · <b>לא מתאימים לתנאי התבנית:</b> ${Math.max(0,rows.length-eligible.length-invalid.length)}${invalid.length?` · <b>טלפון חסר/לא תקין:</b> ${invalid.length}`:''}`;if(cnt)cnt.textContent=String(eligible.length);
      waRenderPreviewF14G_($('#waRealPreviewF14G'),chosen,eligible[0]||rows[0]||null);
      const costEl=$('#waRealCostF14C'),costTemplateId=String(sel.value),costCount=eligible.length;
      // Never permit the confirmation dialog to display a stale or pending estimate.
      const costSend=$('#waRealSendF14C');
      if(costSend)costSend.disabled=true;
      if(costEl)costEl.textContent='מחשב עלות…';
      getWaCostEstimateCachedF14_(costCount,chosen.category).then(e=>{
        if(String(sel.value)!==costTemplateId||environmentSequence!==templateLoadSequenceZ22Fix5||refreshSequence!==templateRefreshSequenceFix9)return;
        const valid=e&&e.rateConfigured===true&&e.estimatedIls!=null&&Number.isFinite(Number(e.estimatedIls))&&Number(e.estimatedIls)>=0;
        if(costEl)costEl.textContent=valid?waCostTextF14Z34_(e,chosen.category):'לא ניתן לחשב כרגע';
        if(costSend)costSend.disabled=!valid||!eligible.length||!waSelectedTemplateApprovedF14E_(sel)||paymentMismatch;
      }).catch(()=>{
        if(String(sel.value)!==costTemplateId||environmentSequence!==templateLoadSequenceZ22Fix5||refreshSequence!==templateRefreshSequenceFix9)return;
        if(costEl)costEl.textContent='לא ניתן לחשב כרגע';
        if(costSend)costSend.disabled=true;
      });
      const paymentMismatch=waTemplatePurposeD5D55D_(chosen)==='table_payment_update'&&!paymentStateD5D55D;
      if(paymentMismatch){const status=$('#waRealStatusF14C');status.textContent='לא הוגדר אמצעי תשלום פעיל. יש לבחור תבנית שולחנות ללא תשלום.';status.className='wa-confirm-status-v1190a16 error';}
      if(refreshSequence===templateRefreshSequenceFix9&&environmentSequence===templateLoadSequenceZ22Fix5)
        send.disabled=true; // enabled only after the matching cost estimate resolves
      }catch(error){
        if(refreshSequence===templateRefreshSequenceFix9&&environmentSequence===templateLoadSequenceZ22Fix5){
          const status=$('#waRealStatusF14C');
          if(status){status.textContent='טעינת התבנית נכשלה: '+(error?.message||String(error));status.className='wa-confirm-status-v1190a16 error';}
          const send=$('#waRealSendF14C');if(send)send.disabled=true;
        }
      }finally{
        if(refreshSequence===templateRefreshSequenceFix9&&environmentSequence===templateLoadSequenceZ22Fix5)setTemplateBusyZ22Fix5(false);
      }
    };
    sel.onchange=refresh;await refresh();
    }catch(error){
      if(sequence===templateLoadSequenceZ22Fix5){
        const status=$('#waRealStatusF14C');
        if(status){status.textContent='טעינת התבניות נכשלה: '+(error?.message||String(error));status.className='wa-confirm-status-v1190a16 error';}
        const send=$('#waRealSendF14C');if(send)send.disabled=true;
      }
    }finally{
      if(sequence===templateLoadSequenceZ22Fix5){
        const note=$('#waRealTemplateLoadFix8');if(note)note.hidden=true;
        setTemplateBusyZ22Fix5(false);
      }
    }
  };

  setupTemplatesD5D55Z22();
  $('#waRealCloseF14C').onclick=closeModal;$('#waRealJournalZ22').onclick=()=>{closeModal();showPage('whatsappLog');};let stopped=false;$('#waRealStopF14C').onclick=()=>{if(stopped)return;if(!($('#waRealStopF14C').dataset.waBulkConfirmed==='1'||confirm('לעצור את שליחת WhatsApp? הקבוצה שנשלחת כעת עשויה להסתיים, אך לא תתחיל קבוצה נוספת.')))return;stopped=true;$('#waRealStopF14C').disabled=true;$('#waRealStatusF14C').textContent='העצירה התקבלה. לא תתחיל קבוצת שליחה נוספת לאחר סיום הקבוצה הנוכחית.';};
  $('#waRealSendF14C').onclick=async()=>{if(templateBusyZ22Fix5)return;const templateId=$('#waRealTemplateF14C').value;if(!templateId)return;const selectedTpl=waTemplateByIdF14G_(templatesF14Z35,templateId);
    if(!selectedTpl||String(selectedTpl.environment||'PRODUCTION').toUpperCase()!=='PRODUCTION'){const status=$('#waRealStatusF14C');status.textContent='תבנית TEST אינה מותרת במסך שליחה רגיל';status.className='wa-confirm-status-v1190a16 error';return;}
    // Do not repeat a network request before opening confirmation; the server
    // remains authoritative when the user actually confirms sending.
    const cost=$('#waRealCostF14C').textContent;if(singleGuestD5D55Z22){if(eligible.length!==1){const status=$('#waRealStatusF14C');status.textContent='לשליחה קבוצתית בתבנית זו יש לבחור מוזמן דרך סמליל WhatsApp ברשימה. מנגנון הסינון הקבוצתי לפי סוג התבנית יופעל בשלב הבא.';status.className='wa-confirm-status-v1190a16 error';return;}const confirmed=await waConfirmSendF14V_({title:'אישור שליחת WhatsApp',message:`לשלוח את התבנית "${selectedTpl.name}" למוזמן שנבחר?`,details:`<b>מוזמן:</b> ${esc(eligible[0].name||'')} · <b>עלות משוערת:</b> ${esc(cost)}`});if(!confirmed)return;const send=$('#waRealSendF14C'),close=$('#waRealCloseF14C'),status=$('#waRealStatusF14C');waSetSendingF14V_(send,true);close.disabled=true;try{const r=await API.request('sendAnyTemplateToGuest',{eventId:state.activeEventId,guestId:eligible[0].guestId||eligible[0].id,templateId,environment:'PRODUCTION'});status.textContent=r?.accepted?'ההודעה התקבלה לשליחה ב-WhatsApp. ניתן לצפות ביומן.':'השליחה לא אושרה.';$('#waRealJournalZ22').hidden=!r?.accepted;status.className='wa-confirm-status-v1190a16 '+(r?.accepted?'success':'error');waSetSendingF14V_(send,false);send.disabled=true;close.disabled=false;}catch(e){status.textContent=e?.message||String(e);status.className='wa-confirm-status-v1190a16 error';waSetSendingF14V_(send,false);close.disabled=false;}return;}const confirmed=await waConfirmSendF14V_({title:'אישור שליחת WhatsApp',message:`לשלוח ${eligible.length} הודעות למספרי המוזמנים?`,details:`<b>כמות:</b> ${eligible.length} · <b>עלות משוערת:</b> ${esc(cost)}`});if(!confirmed)return;
    if(waTemplatePurposeD5D55D_(selectedTpl)!=='invitation'){
      const send=$('#waRealSendF14C'),close=$('#waRealCloseF14C'),stop=$('#waRealStopF14C'),box=$('#waRealProgressF14C'),status=$('#waRealStatusF14C');
      const started=performance.now();let done=0,ok=0,fail=0,uncertain=false;
      waSetSendingF14V_(send,true);close.disabled=true;stop.hidden=false;box.hidden=false;
      $('#waRealJournalZ22').hidden=true;
      const progress=waBulkProgressWindowZ22_(box,stop,$('#waRealJournalZ22'),'התקדמות שליחת WhatsApp',eligible.length);
      for(const guest of eligible){
        if(stopped)break;
        box.querySelector('span').textContent=`שולח ${done+1} מתוך ${eligible.length}`;
        try{
          const result=await API.request('sendAnyTemplateToGuest',{eventId:state.activeEventId,guestId:guest.guestId||guest.id,templateId,environment:'PRODUCTION'});
          if(result?.accepted){ok++;progress.addMessageId(result.messageId);}else fail++;
        }catch(error){
          // Network timeout is not proof of failure: do not automatically retry.
          if(/timeout|network|fetch|תקשורת/i.test(String(error?.message||''))){uncertain=true;status.textContent='לא התקבלה תשובה ודאית מהשרת. יש לבדוק ביומן לפני שליחה נוספת.';break;}
          fail++;console.error('[WA send] recipient failed',guest.guestId||guest.id,error);
        }
        done++;box.waProgressQ33=waProgressStateQ33_(eligible.length,done,ok,fail,uncertain);box.querySelector('progress').value=Math.round(done*100/eligible.length);
      }
      box.waProgressQ33=waProgressStateQ33_(eligible.length,done,ok,fail,uncertain);
      const left=eligible.length-done;
      status.innerHTML=(uncertain?'<p>קיימת הודעה שתוצאת שליחתה אינה ידועה; אין לשלוח אותה שוב לפני בדיקה ביומן.</p>':'')+waResultHtmlF14V_({ok,fail,left,elapsedMs:performance.now()-started,uncertain});
      status.className='wa-confirm-status-v1190a16 '+(fail||uncertain||stopped?'error':'success');
      box.querySelector('span').textContent=`טופלו ${done} מתוך ${eligible.length}`;
      stop.hidden=true;$('#waRealJournalZ22').hidden=false;progress.finish(box.querySelector('span').textContent,!!(fail||uncertain||stopped),false,{canceled:stopped&&!uncertain});
      waSetSendingF14V_(send,false);send.disabled=true;close.disabled=false;return;
    }
    const started=performance.now(),send=$('#waRealSendF14C'),close=$('#waRealCloseF14C'),stop=$('#waRealStopF14C'),box=$('#waRealProgressF14C'),status=$('#waRealStatusF14C');waSetSendingF14V_(send,true);close.disabled=true;stop.hidden=false;$('#waRealJournalZ22').hidden=true;box.hidden=false;box.querySelector('span').textContent='מכין שליחה · בודק Media ושער דולר...';const bulkWindowZ22=waBulkProgressWindowZ22_(box,stop,$('#waRealJournalZ22'),'התקדמות שליחת WhatsApp',eligible.length);let prepared;const prepareStartedD34=performance.now();try{prepared=await API.request('prepareWhatsAppSendF14Z9',{templateId,eventId:state.activeEventId});const prepareMsD34=performance.now()-prepareStartedD34;console.info('[WA PERF] prepareWhatsAppSend',Math.round(prepareMsD34),'ms');box.querySelector('span').textContent=`הכנה הושלמה · Media: ${prepared.mediaSource} · שער דולר: ${prepared.costSource} · Messages: ${eligible.length}`;}catch(e){status.innerHTML=`<p><strong>הכנת השליחה נכשלה:</strong> ${esc(e?.message||'שגיאה לא ידועה')}</p>`;status.className='wa-confirm-status-v1190a16 error';stop.hidden=true;waSetSendingF14V_(send,false);close.disabled=false;bulkWindowZ22.finish('הכנת השליחה נכשלה',true);return;}let ok=0,fail=0,done=0,perf={eventMs:0,ensureMs:0,guestsMs:0,configTemplateMs:0,mediaMs:0,rsvpMs:0,buildMs:0,metaMs:0,processMs:0,pricingMs:0,waLogWriteMs:0,costWriteMs:0,activityWriteMs:0,diagnosticMs:0,writeMs:0,totalMs:0};
    // FIX67: resolve the authorized server setting before reserving a campaign or contacting Meta.
    let chunkSize;
    try {
      const dispatchSettingsFIX67=await API.request('getWhatsAppDispatchSettingsFIX67',{});
      chunkSize=Number(dispatchSettingsFIX67?.batchSize);
      if(!Number.isSafeInteger(chunkSize)||chunkSize<1||chunkSize>50)
        throw new Error('גודל אצווה לא תקין (1–50)');
    } catch(e) {
      status.textContent='השליחה נעצרה: לא ניתן לטעון הגדרות אצווה מהשרת. '+String(e?.message||e);
      status.className='wa-confirm-status-v1190a16 error';
      stop.hidden=true;
      waSetSendingF14V_(send,false);
      close.disabled=false;
      bulkWindowZ22.finish('טעינת הגדרות האצווה נכשלה',true);
      return;
    }
    let totalBatches=Math.ceil(eligible.length/chunkSize);let batchError='',batchMeta=[];
    // Reserve the complete campaign before the first Meta request. A crash keeps
    // the server marker until recovery; never silently clear uncertain sends.
    let campaignIdFIX59='',campaignMediaIdFIX59=String(prepared.mediaId||'');
    try{const reservation=await API.request('beginWhatsAppCampaignFIX59',{eventId:state.activeEventId,environment:'PRODUCTION',guestIds:eligible.map(g=>String(g.guestId||g.id||'')),templateId,mediaId:prepared.mediaId,imageFileId:prepared.imageFileId});campaignIdFIX59=String(reservation?.campaignId||'');if(!campaignIdFIX59)throw new Error('לא התקבל מזהה מסע שליחה');}
    catch(e){
      batchError='לא ניתן להתחיל מסע שליחה: '+String(e?.message||e);
      // Read-only recovery inspection: do not clear markers or resend uncertain Meta messages.
      try{
        const inspection=await API.request('inspectWhatsAppCampaignFIX59',{eventId:state.activeEventId});
        if(inspection?.corruptMarker)batchError+=' · סמן המסע פגום ונדרש בירור ידני';
        else if(inspection?.otherEventActive)batchError+=' · קיים מסע פעיל באירוע אחר';
        else if(inspection?.active)batchError+=' · מסע קודם עדיין פתוח'+(inspection.ownerIsCurrentUser?'':' בידי משתמש אחר');
        if(Number(inspection?.inflightCount||0)>0)batchError+=' · קיימות '+Number(inspection.inflightCount)+' אצוות שתוצאתן מחייבת בירור';
        if(inspection?.active&&inspection?.ownerIsCurrentUser&&inspection?.planValid&&Number(inspection?.inflightCount||0)===0){
          try{
            const recovery=await API.request('previewWhatsAppCampaignResumeFIX59',{eventId:state.activeEventId});
            if(recovery?.safe&&Number.isInteger(recovery.remainingCount)&&Number.isInteger(recovery.completedCount)){
              batchError+=' · במסע הקודם טופלו '+recovery.completedCount+' נמענים ונותרו '+recovery.remainingCount+' מועמדים לחידוש';
              // A preview is only a candidate list. The guarded batch API
              // rechecks campaign ownership, plan, context and progress before Meta.
              const remaining=recovery.remainingGuestIds;
              const ids=Array.isArray(remaining)?remaining.map(String):[];
              const byId=new Map(eligible.map(g=>[String(g.guestId||g.id||''),g]));
              // The cache may have expired since the original campaign began.
              // Resume with the immutable server-saved media ID, never the newly prepared ID.
              const matchingContext=String(recovery.templateId||'')===String(templateId)&&
                typeof recovery.mediaId==='string'&&!!recovery.mediaId.trim();
              const validIds=ids.length===recovery.remainingCount&&new Set(ids).size===ids.length&&
                ids.every(id=>byId.has(id));
              if(matchingContext&&validIds&&String(recovery.campaignId||'')){
                const approved=confirm('נמצא מסע קודם עם '+recovery.completedCount+
                  ' מוזמנים שטופלו ו־'+ids.length+' שנותרו. להמשיך רק עם הנותרים?');
                if(approved){
                  campaignIdFIX59=String(recovery.campaignId);
                  campaignMediaIdFIX59=recovery.mediaId;
                  eligible=ids.map(id=>byId.get(id));
                  totalBatches=Math.ceil(eligible.length/chunkSize);
                  batchError='';
                  box.querySelector('span').textContent='מחדש מסע קיים · נותרו '+eligible.length+' מוזמנים';
                }else batchError+=' · החידוש בוטל';
              }else batchError+=' · פרטי התבנית, המדיה או רשימת המוזמנים אינם תואמים; החידוש נחסם';
            }else if(recovery?.reason)batchError+=' · '+String(recovery.reason);
          }catch(recoveryError){console.warn('[WA FIX59] recovery preview unavailable',recoveryError);}
        }
      }catch(inspectionError){console.warn('[WA FIX59] campaign inspection unavailable',inspectionError);}
    }

    for(let i=0,batchNo=1;!batchError&&i<eligible.length;i+=chunkSize,batchNo++){if(stopped)break;const chunk=eligible.slice(i,i+chunkSize);box.querySelector('span').textContent=`קבוצת שליחה ${batchNo}/${totalBatches} · שולח ${done+1}–${done+chunk.length} מתוך ${eligible.length}`;try{const r=await API.request('sendInvitationBatchF14U',{eventId:state.activeEventId,items:chunk.map(g=>({guestId:g.guestId||g.id})),templateId,mediaId:campaignMediaIdFIX59,costEstimate:prepared.costEstimate,campaignId:campaignIdFIX59});if(!r||typeof r.accepted==='undefined'||typeof r.failed==='undefined')throw new Error('קבוצת השליחה לא החזירה תשובה תקינה');if(r.waLogError){throw new Error('השליחה נעצרה: Meta עשויה הייתה לקבל את ההודעות, אך שמירת יומן WhatsApp נכשלה. אין לשלוח שוב לפני שחזור היומן. פרטים: '+String(r.waLogError));}const acceptedCount=r.accepted,failedCount=r.failed;if(typeof acceptedCount!=='number'||typeof failedCount!=='number'||!Number.isSafeInteger(acceptedCount)||!Number.isSafeInteger(failedCount)||acceptedCount<0||failedCount<0||acceptedCount+failedCount!==chunk.length)throw new Error('תוצאות אצוות השליחה אינן תואמות למספר הנמענים; יש לברר מצב הודעות לפני חידוש');const expectedBatchIds=new Set(chunk.map(g=>String(g.guestId||g.id||'')));const actualResults=r.results;if(!Array.isArray(actualResults)||actualResults.length!==chunk.length||new Set(actualResults.map(x=>String(x&&x.guestId||''))).size!==chunk.length||actualResults.some(x=>!x||typeof x.accepted!=='boolean'||!expectedBatchIds.has(String(x.guestId||'')))||actualResults.filter(x=>x.accepted).length!==acceptedCount)throw new Error('פירוט תוצאות האצווה אינו תואם לנמענים או לסיכום; אין להמשיך שליחה לפני בירור');actualResults.filter(x=>x.accepted&&x.messageId).forEach(x=>bulkWindowZ22.addMessageId(x.messageId));ok+=acceptedCount;fail+=failedCount;if(r.performance)Object.keys(perf).forEach(k=>perf[k]+=Number(r.performance[k]||0));if(r.metaSummary)batchMeta.push({batchNo,...r.metaSummary});done+=chunk.length;box.waProgressQ33=waProgressStateQ33_(eligible.length,done,ok,fail);box.querySelector('progress').value=Math.round(done*100/eligible.length);if(done<eligible.length&&!stopped)await waPauseBetweenBatchesF14Z7_(box,done,eligible.length,batchNo+1,totalBatches,started);}catch(e){batchError=e?.message||'קבוצת השליחה לא החזירה תשובה תקינה';break;}}
    if(campaignIdFIX59&&!batchError&&!stopped&&done===eligible.length){try{await API.request('finishWhatsAppCampaignFIX59',{campaignId:campaignIdFIX59});}catch(e){batchError='סיום מסע השליחה לא אושר: '+String(e?.message||e);}}
    // An interrupted or user-stopped campaign retains its durable marker;
    // it must be reconciled before starting a new campaign or charging costs.
    const elapsedMs=performance.now()-started,left=eligible.length-done;status.innerHTML=`<p><strong>זמן הכנה:</strong> ${waFormatElapsedF14V_(prepareMsD34)}</p><p><strong>מסלול רשת:</strong> Media: ${esc(prepared.mediaSource)} · שער דולר: ${esc(prepared.costSource)} · Messages: ${eligible.length}</p>`+waBatchMetaHtmlF14Z11_(batchMeta)+(batchError?`<p><strong>השליחה נעצרה:</strong> ${esc(batchError)}. לא ניתן לקבוע אם קבוצת השליחה שלא החזירה תשובה נמסרה בפועל; יש לבדוק ב-WhatsApp לפני ניסיון נוסף.</p>`:'')+waResultHtmlF14V_({ok,fail,left,elapsedMs,test:false,perf,uncertain:!!batchError});status.className='wa-confirm-status-v1190a16 '+((fail||batchError||stopped)?'error':'success');box.querySelector('span').textContent=batchError?`נעצר לאחר ${done} מתוך ${eligible.length} · ${waFormatElapsedF14V_(elapsedMs)}`:`${stopped?'נעצר לבקשת המשתמש':'טופלו'} ${done} מתוך ${eligible.length} · ${waFormatElapsedF14V_(elapsedMs)}`;stop.hidden=true;$('#waRealJournalZ22').hidden=false;box.waProgressQ33=waProgressStateQ33_(eligible.length,done,ok,fail,!!batchError);bulkWindowZ22.finish(box.querySelector('span').textContent,!!(fail||batchError||stopped),false,{canceled:stopped&&!batchError});waSetSendingF14V_(send,false);send.disabled=true;close.disabled=false;
  };
}

/* one-recipient confirmation, with phone preview and inline status. */
function waPhonePreviewV1190A16_(phone){
  let raw=String(phone||'').trim().replace(/[\s\-().]/g,'');
  if(raw.startsWith('+'))raw=raw.slice(1);
  raw=raw.replace(/\D/g,'');
  if(raw.startsWith('00972'))raw=raw.slice(2);
  if(raw.startsWith('972'))raw='0'+raw.slice(3);
  if(!/^0\d{8,9}$/.test(raw))return '';
  return '972'+raw.slice(1);
}
async function openWhatsAppTestConfirmV1190A16_(g){
  const to=waPhonePreviewV1190A16_(g.phone);
  modal(`<section class="wa-confirm-v1190a16" role="dialog" aria-labelledby="waConfirmTitleV1190A16">
    <h2 id="waConfirmTitleV1190A16">אישור שליחת <bdi dir="ltr">WhatsApp</bdi></h2>
    <p>האם לשלוח הודעה אחת למוזמן הבא?</p><label>תבנית WhatsApp <span class="required-star">*</span><select id="waSingleTemplateF14C" disabled><option value="">טוען תבניות…</option></select></label>
    <dl class="wa-confirm-details-v1190a16">
      <dt>שם המוזמן</dt><dd>${esc(g.name||'—')}</dd>
      <dt>מספר ברשומה</dt><dd dir="ltr">${esc(g.phone||'—')}</dd>
      <dt>מספר לשליחה ל־Meta</dt><dd dir="ltr">${to?esc('+'+to):'מספר לא תקין'}</dd>
      <dt>כמות הודעות</dt><dd>1</dd><dt>מחיר משוער להודעה</dt><dd id="waConfirmUnitUsdF14">טוען…</dd><dt>עלות משוערת בדולר</dt><dd id="waConfirmUsdF14">טוען…</dd><dt>שער יציג USD/ILS</dt><dd id="waConfirmFxF14">טוען…</dd><dt><b>סך עלות משוערת</b></dt><dd id="waConfirmCostF14"><b>טוען…</b></dd>
    </dl>
    <div class="wa-send-preview-f14g" id="waSinglePreviewF14G"><p class="muted">Preview ההזמנה יוצג לאחר טעינת התבנית.</p></div>
    <p class="wa-confirm-status-v1190a16" id="waConfirmStatusV1190A16" role="status" aria-live="polite"></p>
    <div class="actions"><button type="button" class="primary" id="waConfirmSendV1190A16" ${to?'':'disabled'}>אישור ושליחה</button>
    <button type="button" id="waConfirmCancelV1190A16">ביטול</button></div>
  </section>`);
  const panel=$('.wa-confirm-v1190a16'),send=panel.querySelector('#waConfirmSendV1190A16');
  const cancel=panel.querySelector('#waConfirmCancelV1190A16');
  const status=panel.querySelector('#waConfirmStatusV1190A16');
  let singleTemplatesD5D55D=[];
  const close=$('#modalClose');
  if(!to){status.textContent='מספר הטלפון אינו תקין. יש לתקן אותו ברשומת המוזמן לפני השליחה.';status.className='wa-confirm-status-v1190a16 error';}
  else{status.dataset.templateMessage='1';const sel=panel.querySelector('#waSingleTemplateF14C');waFillTemplateSelectF14D_(sel,status,send,g.eventId).then(t=>{singleTemplatesD5D55D=t;const preview=()=>waRenderPreviewF14G_(panel.querySelector('#waSinglePreviewF14G'),waTemplateByIdF14G_(t,sel.value),g);send.disabled=!t.length||!waSelectedTemplateApprovedF14E_(sel);sel.onchange=()=>{send.disabled=!waSelectedTemplateApprovedF14E_(sel);preview();};if(t.length)preview();refreshSingleCostF59();});}
  let singleCostRequestF59=0;
  const refreshSingleCostF59=async()=>{
    const request=++singleCostRequestF59;
    const sel=panel.querySelector('#waSingleTemplateF14C');
    const chosen=waTemplateByIdF14G_(singleTemplatesD5D55D,sel?.value);
    const fields=['#waConfirmUnitUsdF14','#waConfirmUsdF14','#waConfirmFxF14','#waConfirmCostF14'].map(q=>panel.querySelector(q));
    fields.forEach(el=>{if(el)el.textContent='מחשב עלות…';});
    if(!chosen){fields.forEach(el=>{if(el)el.textContent='בחר תבנית';});return;}
    try{
      const e=await getWaCostEstimateCachedF14_(1,chosen.category);
      if(request!==singleCostRequestF59||sel.value!==String(chosen.id))return;
      const values=e?.estimatedIls!=null?['$'+Number(e.unitUsd).toFixed(4),'$'+Number(e.estimatedUsd).toFixed(2),Number(e.usdIls).toFixed(4),'₪'+Number(e.estimatedIls).toFixed(2)]:Array(4).fill(e?.notice||'לא ניתן לחשב');
      fields.forEach((el,i)=>{if(el)el.textContent=values[i];});
    }catch(e){if(request===singleCostRequestF59)fields.forEach(el=>{if(el)el.textContent='לא ניתן לחשב כרגע';});}
  };
  const singleTemplateSelectF59=panel.querySelector('#waSingleTemplateF14C');
  singleTemplateSelectF59.addEventListener('change',refreshSingleCostF59);
  cancel.onclick=closeModal;
  send.onclick=async()=>{
    if(send.disabled||!to)return;
    const templateId=panel.querySelector('#waSingleTemplateF14C').value;
    const currentTemplate=waTemplateByIdF14G_(singleTemplatesD5D55D,templateId);
    if(['table_update','table_payment_update'].includes(waTemplatePurposeD5D55D_(currentTemplate))){
      try{
        const valid=await waFilterTableTemplatesD5D55D_([currentTemplate],g.eventId);
        if(!valid.length)throw new Error('הגדרות התשלום השתנו. יש לפתוח מחדש את מסך השליחה');
      }catch(err){status.textContent=err?.message||String(err);status.className='wa-confirm-status-v1190a16 error';return;}
    }
    send.disabled=true;cancel.disabled=true;if(close)close.disabled=true;
    send.innerHTML='<span class="seating-spinner-v171" aria-hidden="true"></span> שולח...';
    status.textContent='';status.className='wa-confirm-status-v1190a16';
    try{
      const r=await API.request('sendOneInvitationV1190A14',{eventId:g.eventId,guestId:g.guestId||g.id,templateId:panel.querySelector('#waSingleTemplateF14C').value});
      if(r?.accepted!==true)throw new Error('לא התקבל אישור תקין משרת השליחה');
      status.textContent='Meta קיבלה את ההזמנה לשליחה. בדוק שההודעה הגיעה לטלפון.'+(r?.costEstimate?.estimatedIls!=null?' עלות משוערת: ₪'+Number(r.costEstimate.estimatedIls).toFixed(2):'');
      status.className='wa-confirm-status-v1190a16 success';
      send.innerHTML='הבקשה התקבלה ✓';
      // A18: retain the response for manual inspection; API acceptance is not delivery.
      cancel.textContent='סגור';cancel.disabled=false;if(close)close.disabled=false;
    }catch(err){
      status.textContent=err?.message||'שליחת ההזמנה נכשלה';
      status.className='wa-confirm-status-v1190a16 error';
      if(err?.deliveryUncertain){
        send.innerHTML='מצב שליחה לא ידוע';send.disabled=true;
      }else{
        send.innerHTML='נסה שוב';send.disabled=false;
      }
      cancel.textContent='סגור';cancel.disabled=false;if(close)close.disabled=false;
    }
  };
}



/* ---------- F14Z53 System values / WhatsApp pricing ---------- */
const systemValueDefsZ53_=[
  {key:'SESSION_IDLE_MINUTES',group:'SECURITY',label:'התנתקות לאחר חוסר פעילות (בדקות)',value:'60',description:'ההתחברות מסתיימת לאחר 30–60 דקות ללא פעילות שלך. בדיקות אוטומטיות אינן מאריכות אותה. שינוי חל בתוך כדקה.',min:30,max:60},
  {key:'WHATSAPP_PERSONAL_GREETING_DEFAULT',group:'WHATSAPP',label:'פנייה אישית — ברירת מחדל',value:'משפחה יקרה',description:'משמש כאשר למוזמן אין פנייה אישית.'},
  {key:'WHATSAPP_EVENT_DETAILS_FORMAT',group:'WHATSAPP',label:'פרטי האירוע',value:'{eventName}\n{eventDate} בשעה {eventTime}\n{eventVenue}\nכתובת: {eventAddress}',description:'מבנה הערך המורכב שמועבר לתבניות WhatsApp.'},
  {key:'WHATSAPP_EXTRA_NOTES_DEFAULT',group:'WHATSAPP',label:'הערות נוספות — ברירת מחדל',value:'',description:'ערך ברירת מחדל כאשר אין הערות נוספות.'},
  {key:'WHATSAPP_TEST_BATCH_SIZE',group:'WHATSAPP',label:'גודל אצוות בדיקה',value:'20',description:'הודעות בכל בקשת שרת; בטווח 1–20 בגרסת ההשוואה.',min:1,max:20},
  {key:'WHATSAPP_TEST_CONCURRENCY',group:'WHATSAPP',label:'שליחות מקבילות בבדיקה',value:'4',description:'בקשות Meta בו־זמנית; בטווח 1–5.',min:1,max:5},
  {key:'WHATSAPP_TEST_PAUSE_SECONDS',group:'WHATSAPP',label:'המתנה בין מנות — בשניות',value:'5',description:'המתנה בין סיום מנה לתחילת המנה הבאה. אינה כוללת זמני שרת ותקשורת.',min:0,max:60}
];
const systemTokenLabelsZ53_={eventName:'שם האירוע',eventDate:'תאריך',eventTime:'שעה',eventVenue:'מיקום',eventAddress:'כתובת',personalGreeting:'פנייה אישית',guestName:'שם המוזמן',tableAssignment:'שיוך שולחן',extraNotes:'הערות נוספות'};
function systemValueMergedZ53_(rows,key){const d=systemValueDefsZ53_.find(x=>x.key===key)||{key,label:key,value:'',group:'GENERAL',description:''};return Object.assign({},d,(rows||[]).find(x=>String(x.key)===key)||{});}
function systemPreviewZ53_(v){const sample={eventName:'בר מצווה של דותן',eventDate:'15/10/2026',eventTime:'19:30',eventVenue:'אולמי הדוגמה',eventAddress:'רחוב הדוגמה 10, תל אביב',personalGreeting:'משפחה יקרה',guestName:'משפחת ישראלי',tableAssignment:'שולחן 12',extraNotes:'נשמח לראותכם'};return String(v||'').replace(/\{([A-Za-z0-9_]+)\}/g,(m,k)=>sample[k]??m);}

const waMappingSourcesD5D2_={personalGreeting:'פנייה אישית',guestName:'שם המוזמן',eventName:'שם האירוע',eventDetails:'פרטי האירוע',eventDate:'תאריך האירוע',eventTime:'שעת האירוע',eventVenue:'מקום האירוע',eventAddress:'כתובת האירוע',tableText:'שיוך שולחן',extraNotesText:'הערות נוספות',eventSignature:'חתימת האירוע'};
function waMappingKeyD5D2_(metaName){return 'WHATSAPP_TEMPLATE_MAPPING::'+String(metaName||'');}
function waMappingTokensD5D2_(body){return [...String(body||'').matchAll(/\{\{\s*([^{}]+?)\s*\}\}/g)].map(m=>String(m[1]).trim());}
function waDefaultMappingUiD5D2_(t){const out={};waMappingTokensD5D2_(t.body).forEach(x=>out[x]='');return {body:out,buttons:{}};}
function waReadMappingUiD5D2_(rows,t){const r=(rows||[]).find(x=>String(x.key)===waMappingKeyD5D2_(t.metaName));if(r?.value){try{return JSON.parse(r.value)}catch(e){}}return waDefaultMappingUiD5D2_(t);}
function waMetaComponentsD5D4_(t){try{const x=JSON.parse(String(t.metaComponentsJson||''));return Array.isArray(x)?x:[]}catch(e){return []}}
function waTokenContextD5D4_(text,tok){const src=String(text||''),re=new RegExp('\\{\\{\\s*'+String(tok).replace(/[.*+?^${}()|[\\]\\]/g,'\\$&')+'\\s*\\}\\}'),m=re.exec(src);if(!m)return '';const a=Math.max(0,m.index-70),b=Math.min(src.length,m.index+m[0].length+70);return (a?'…':'')+src.slice(a,b).replace(/\s+/g,' ').trim()+(b<src.length?'…':'');}
function waBodyContextD5D4_(t,tok){const comps=waMetaComponentsD5D4_(t),body=comps.find(c=>String(c.type||'').toUpperCase()==='BODY');return waTokenContextD5D4_(body?.text||t.body,tok);}
function waMappingCardD5D2_(t,rows){const tokens=waMappingTokensD5D2_(t.body),m=waReadMappingUiD5D2_(rows,t),opts=Object.entries(waMappingSourcesD5D2_);return `<article class="system-value-card-z53 wa-mapping-card-d5d2" data-map-template-d5d2="${esc(t.metaName)}"><h3>${esc(t.name||t.metaName)}</h3><p class="muted"><code>${esc(t.metaName)}</code> · ${esc(t.environment||'')}</p>${tokens.length?tokens.map(tok=>{const ctx=waBodyContextD5D4_(t,tok);return `<label class="wa-map-row-d5d2"><span class="wa-map-token-d5d4"><b>{{${esc(tok)}}}</b>${ctx?`<small>${esc(ctx)}</small>`:''}</span><select data-map-token-d5d2="${esc(tok)}"><option value="" ${!String(m.body?.[tok]||'')?'selected':''}>לא מופה — נדרשת בחירה</option>${opts.map(([v,l])=>`<option value="${esc(v)}" ${String(m.body?.[tok]||'')===v?'selected':''}>${esc(l)}</option>`).join('')}</select></label>`}).join(''):'<p class="muted">אין משתני BODY בתבנית.</p>'}<div class="actions"><button class="primary save-wa-mapping-d5d2" data-meta-name="${esc(t.metaName)}">שמירת מיפוי</button></div></article>`;}
async function saveWaMappingUiD5D2_(button){const card=button.closest('[data-map-template-d5d2]'),metaName=button.dataset.metaName,body={};card?.querySelectorAll('[data-map-token-d5d2]').forEach(x=>body[x.dataset.mapTokenD5d2]=x.value);setAdminButtonBusyZ53B6_(button,true,'שומר…');try{await API.request('saveWhatsAppTemplateMappingD5D2',{mapping:{metaName,mapping:{body,buttons:{}}}});showToast('מיפוי התבנית נשמר','success');state.waSendTemplatesCacheF14G=new Map();}catch(e){showToast(e?.message||String(e),'error')}finally{setAdminButtonBusyZ53B6_(button,false)}}

function systemSettingsCardsQ20_(rows){
  const numericTitles={WHATSAPP_TEST_PAUSE_SECONDS:['המתנה בין מנות — בשניות','כמה שניות להמתין בין המנות בבדיקת שליחה. שינוי חל בפתיחה מחדש של מסך הבדיקה.'],WHATSAPP_TEST_BATCH_SIZE:['הודעות בכל מנה','כמה הודעות ייכללו בכל מנה.'],WHATSAPP_TEST_CONCURRENCY:['הודעות במקביל','כמה הודעות יישלחו באותו זמן.']};
  const card=d=>{
    const x=systemValueMergedZ53_(rows,d.key),key=esc(d.key),numeric=d.min!==undefined,value=String(x.value??d.value??'');
    const title=numericTitles[d.key]?.[0]||d.label;
    const help=numericTitles[d.key]?.[1]||({WHATSAPP_PERSONAL_GREETING_DEFAULT:'הפנייה שתופיע כשלא הוגדרה פנייה אישית.',WHATSAPP_EVENT_DETAILS_FORMAT:'הפרטים שיופיעו בהודעה על האירוע.',WHATSAPP_EXTRA_NOTES_DEFAULT:'תוספת קבועה להודעות, אם נדרשת.'}[d.key]||d.description||'');
    const input=numeric?`<label class="system-number-field-q20"><span>מספר בין ${d.min} ל־${d.max}</span><input aria-label="${esc(title)}" type="number" min="${d.min}" max="${d.max}" step="1" inputmode="numeric" data-system-value-z53="${key}" data-saved-value-q20="${esc(value)}" value="${esc(value)}"></label>`:`<textarea aria-label="${esc(title)}" data-system-value-z53="${key}" data-saved-value-q20="${esc(value)}" rows="3">${esc(value)}</textarea>`;
    const extras=numeric?'':`<div class="system-token-bar-z53" aria-label="הוספת פרטים לטקסט">${Object.entries(systemTokenLabelsZ53_).map(([k,l])=>`<button type="button" data-insert-token-z53="${k}" data-target-z53="${key}">+ ${esc(l)}</button>`).join('')}</div><p><b>כך ייראה הטקסט:</b></p><pre data-system-preview-z53="${key}">${esc(systemPreviewZ53_(value))}</pre>`;
    return `<article class="system-value-card-z53 ${numeric?'system-number-card-q20':''}"><h3>${esc(title)}</h3><p class="muted">${esc(help)}</p>${input}${extras}<div class="actions"><button type="button" class="primary save-system-value-z53" data-key="${key}">שמירה</button><span class="system-save-state-q20" data-system-save-status-q20="${key}" role="status" aria-live="polite"></span></div></article>`;
  };
  const numbers=systemValueDefsZ53_.filter(d=>d.min!==undefined&&d.group!=='SECURITY').map(card).join('');
  const security=systemValueDefsZ53_.filter(d=>d.group==='SECURITY').map(card).join('');
  const texts=systemValueDefsZ53_.filter(d=>d.min===undefined).map(card).join('');
  return `<div class="system-settings-q20" dir="rtl"><h2>הגדרות מערכת</h2><section aria-label="התחברות ואבטחה"><h3>התחברות ואבטחה</h3><div class="system-values-grid-z53">${security}</div></section><p>עדכן את המספר ולחץ שמירה. לפני בדיקה חדשה, סגור ופתח מחדש את מסך בדיקות WhatsApp.</p><section aria-label="שליחת הודעות לבדיקה"><h3>שליחת הודעות לבדיקה</h3><div class="system-values-grid-z53">${numbers}</div></section><details class="system-text-settings-q20"><summary>נוסח ההודעות ותצוגה מקדימה</summary><p class="muted">כאן אפשר לשנות פנייה אישית, פרטי אירוע והערות קבועות.</p><div class="system-values-grid-z53">${texts}</div></details></div>`;
}
async function renderSystemValuesAdminZ53_(){
  const c=$('#adminContent');if(!c)return;c.innerHTML='<div class="admin-loading-z53b6"><span class="admin-spinner-z53b6" aria-hidden="true"></span><strong>טוען הגדרות…</strong></div>';
  try{const r=await API.request('listSystemSettingsZ53',{});c.innerHTML=systemSettingsCardsQ20_(r.settings||[]);}
  catch(e){c.innerHTML=`<div class="event-save-status error">${esc(e?.message||String(e))}</div>`;}
}
function formatAdminDateZ53B3_(v){if(!v)return '—';const d=new Date(v);if(Number.isNaN(d.getTime()))return String(v);return new Intl.DateTimeFormat('he-IL',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit',hour12:false}).format(d).replace(',', '');}
function formatBoiRateDateZ53B5_(v){if(!v)return '—';const d=new Date(v);if(!Number.isNaN(d.getTime()))return new Intl.DateTimeFormat('he-IL',{day:'2-digit',month:'2-digit',year:'numeric'}).format(d);return String(v);}
function friendlyTierZ53B3_(v){const s=String(v||'').trim();if(!s)return '—';if(/^0:MAX$/i.test(s))return '0–MAX';const m=s.match(/^(\d+):(\d+)$/);return m?`${Number(m[1]).toLocaleString('en-US')}–${Number(m[2]).toLocaleString('en-US')}`:s;}
async function renderWhatsAppCostsAdminZ53B3_(){
  const c=$('#adminContent');if(!c)return;c.innerHTML='<div class="admin-loading-z53b6"><span class="admin-spinner-z53b6" aria-hidden="true"></span><strong>טוען עלויות WhatsApp…</strong></div>';
  try{const [r,watch]=await Promise.all([API.request('listSystemSettingsZ53',{}),API.request('metaPricingWatchStatusZ53B',{})]),pricing=(r.pricing||[]).filter(x=>String(x.source||'').includes('Meta'));
    const rows=pricing.map(x=>`<tr class="wa-pricing-row-z53b2" data-wa-price-id="${esc(x.id)}" title="לחיצה כפולה להצגת פרטים"><td>${esc(x.environment)}</td><td>${esc(x.category)}</td><td>${esc(x.country)}</td><td>${esc(x.currency)}</td><td>${esc(x.unitPrice)}</td><td class="wa-tier-z53b3">${esc(friendlyTierZ53B3_(x.tier))}</td><td>${esc(x.source||'')}</td><td>${esc(formatAdminDateZ53B3_(x.updatedAt))}</td></tr>`).join('');
    c.innerHTML=`<div class="system-help-z53 system-pricing-help-z53"><div><h2>עלויות WhatsApp</h2><p>המחירים נקראים אוטומטית מנתוני Meta עבור הודעות שנמסרו בסביבת PRODUCTION. סביבת TEST אינה מחויבת ועלותה 0.</p><p class="system-help-note-z53">המחיר מחושב מנתוני Meta pricing_analytics לפי COST ÷ VOLUME. הרשומות הן לקריאה בלבד; לחיצה כפולה על שורה מציגה את מלוא פרטי הרשומה.</p><p class="system-help-note-z53">מדרגת נפח היא טווח כמות ההודעות שעל פיו Meta קובעת את המחיר; המחיר עשוי להשתנות במעבר למדרגת נפח אחרת.</p><div class="pricing-watch-status-z53b"><b>בדיקה אוטומטית:</b> ${watch.enabled?'פעילה — פעם ביום, סביב 16:00 (שעון ישראל)':'לא פעילה'} · <b>בדיקה אחרונה:</b> ${esc(formatAdminDateZ53B3_(watch.last?.checkedAt))} · <b>סטטוס:</b> ${watch.last?.ok===false?'שגיאה':watch.last?.ok===true?'תקין':'—'}${watch.last?.changed?` · <b>שינויים שזוהו:</b> ${esc(watch.last.changed)}`:''}<br><b>שער USD/ILS:</b> ${watch.fx?.rate?esc(Number(watch.fx.rate).toFixed(4)):'—'} · <b>מקור:</b> בנק ישראל · <b>תאריך השער:</b> ${esc(formatBoiRateDateZ53B5_(watch.fx?.date))} · <b>נבדק לאחרונה:</b> ${esc(formatAdminDateZ53B3_(watch.fx?.lastCheckedAt))}</div></div><div class="pricing-watch-actions-z53b"><button class="primary sync-wa-pricing-z53b">בדיקה עכשיו מול Meta</button><button class="toggle-wa-pricing-watch-z53b">${watch.enabled?'כיבוי עדכון יומי':'הפעלת עדכון יומי'}</button></div></div><div class="table-wrap system-pricing-table-z53 wa-pricing-table-z53b2"><table class="admin-table"><thead><tr><th>סביבה</th><th>קטגוריה</th><th>מדינה</th><th>מטבע</th><th>מחיר ליחידה</th><th>מדרגת נפח</th><th>מקור</th><th>עודכן</th></tr></thead><tbody>${rows||'<tr><td colspan="8" class="system-empty-z53">אין עדיין נתוני מחיר מ־Meta. לחצו „בדיקה עכשיו מול Meta”.</td></tr>'}</tbody></table></div>`;
    c._waPricingZ53B3=pricing;
  }catch(e){c.innerHTML=`<div class="event-save-status error">${esc(e?.message||String(e))}</div>`;}
}
function showWaPricingDetailsZ53B3_(x){if(!x)return;modal(`<h2>פרטי עלות WhatsApp</h2><div class="wa-pricing-details-z53b2"><p><b>סביבה:</b> ${esc(x.environment||'—')}</p><p><b>קטגוריה:</b> ${esc(x.category||'—')}</p><p><b>מדינה:</b> ${esc(x.country||'—')}</p><p><b>מטבע:</b> ${esc(x.currency||'—')}</p><p><b>מחיר ליחידה:</b> ${esc(x.unitPrice||'—')}</p><p><b>מדרגת נפח:</b> <span class="wa-tier-z53b3">${esc(friendlyTierZ53B3_(x.tier))}</span></p><p><b>Pricing type:</b> ${esc(x.pricingType||'—')}</p><p><b>Volume:</b> ${esc(x.volume??'—')}</p><p><b>Cost:</b> ${esc(x.cost??'—')}</p><p><b>מקור:</b> ${esc(x.source||'—')}</p><p><b>תקופת נתונים:</b> ${esc(formatAdminDateZ53B3_(x.periodStart))} – ${esc(formatAdminDateZ53B3_(x.periodEnd))}</p><p><b>בדיקה אחרונה:</b> ${esc(formatAdminDateZ53B3_(x.lastCheckedAt||x.updatedAt))}</p><p><b>שינוי אחרון:</b> ${esc(formatAdminDateZ53B3_(x.changeDetectedAt))}</p><p><b>מחיר קודם:</b> ${esc(x.previousUnitPrice||'—')}</p><p><b>הערות:</b> ${esc(x.notes||'—')}</p></div><div class="actions"><button class="primary" onclick="closeModal()">סגור</button></div>`);}
function setAdminButtonBusyZ53B6_(button,busy,label){if(!button)return;if(busy){if(!button.dataset.busyHtmlZ53B6)button.dataset.busyHtmlZ53B6=button.innerHTML;button.disabled=true;button.setAttribute('aria-busy','true');button.innerHTML=`<span class="admin-spinner-z53b6 admin-spinner-button-z53b6" aria-hidden="true"></span><span>${esc(label||'מעדכן…')}</span>`;}else{button.disabled=false;button.removeAttribute('aria-busy');if(button.dataset.busyHtmlZ53B6){button.innerHTML=button.dataset.busyHtmlZ53B6;delete button.dataset.busyHtmlZ53B6;}}}
async function saveSystemValueUiZ53_(key,button){
  const ta=document.querySelector(`[data-system-value-z53="${CSS.escape(key)}"]`),d=systemValueDefsZ53_.find(x=>x.key===key);
  if(!ta||!d)return;
  const status=document.querySelector(`[data-system-save-status-q20="${CSS.escape(key)}"]`);
  if(d.min!==undefined&&(!/^\d+$/.test(ta.value.trim())||Number(ta.value)<d.min||Number(ta.value)>d.max)){if(status)status.textContent='יש להזין מספר שלם בין '+d.min+' ל־'+d.max;return;}
  const submitted=ta.value;setAdminButtonBusyZ53B6_(button,true,'שומר…');if(status)status.textContent='שומר…';
  try{
    const r=await API.request('saveSystemSettingZ53',{setting:{...d,value:submitted,active:true}});
    ta.dataset.savedValueQ20=String(r.setting?.value??submitted);
    if(status)status.textContent=ta.value===ta.dataset.savedValueQ20?'נשמר':'יש שינוי נוסף שטרם נשמר';
    const p=document.querySelector(`[data-system-preview-z53="${CSS.escape(key)}"]`);if(p)p.textContent=systemPreviewZ53_(ta.value);
  }catch(e){if(status)status.textContent='השמירה נכשלה: '+(e?.message||String(e));}
  finally{setAdminButtonBusyZ53B6_(button,false);}
}

document.addEventListener('dblclick',e=>{const tr=e.target.closest?.('.wa-pricing-row-z53b2');if(!tr)return;const c=$('#adminContent'),x=(c?._waPricingZ53B3||[]).find(v=>String(v.id)===String(tr.dataset.waPriceId));if(x)showWaPricingDetailsZ53B3_(x);});
document.addEventListener('input',e=>{const ta=e.target.closest?.('[data-system-value-z53]');if(!ta)return;const status=document.querySelector(`[data-system-save-status-q20="${CSS.escape(ta.dataset.systemValueZ53)}"]`);if(status)status.textContent=ta.value===ta.dataset.savedValueQ20?'':'השינוי טרם נשמר';const p=document.querySelector(`[data-system-preview-z53="${CSS.escape(ta.dataset.systemValueZ53)}"]`);if(p)p.textContent=systemPreviewZ53_(ta.value);});

/* ---------- Events ---------- */
document.addEventListener("click",async e=>{
  const sortHead=e.target.closest(".guests-table th.sortable"); if(sortHead){setGuestSort(sortHead.dataset.sort);return}
  const nav=e.target.closest("[data-page]");if(nav)showPage(nav.dataset.page);

  const tab=e.target.closest("[data-admin-tab]");if(tab){state.adminTab=tab.dataset.adminTab;renderAdmin();return}
  const tok=e.target.closest('[data-insert-token-z53]');if(tok){const key=tok.dataset.targetZ53,ta=document.querySelector(`[data-system-value-z53="${CSS.escape(key)}"]`);if(ta){const token=`{${tok.dataset.insertTokenZ53}}`,a=ta.selectionStart??ta.value.length,b=ta.selectionEnd??a;ta.setRangeText(token,a,b,'end');ta.dispatchEvent(new Event('input',{bubbles:true}));}return}
  const sv=e.target.closest('.save-system-value-z53');if(sv){await saveSystemValueUiZ53_(sv.dataset.key,sv);return}
  const wm=e.target.closest('.save-wa-mapping-d5d2');if(wm){await saveWaMappingUiD5D2_(wm);return}
  if(e.target.closest('.sync-wa-pricing-z53b')){const b=e.target.closest('.sync-wa-pricing-z53b');setAdminButtonBusyZ53B6_(b,true,'בודק…');try{const r=await API.request('syncMetaPricingAnalyticsZ53B',{});showToast(`בדיקת Meta הסתיימה: ${r.updated||0} מחירים, ${r.changed||0} שינויים`,'success');await renderWhatsAppCostsAdminZ53B3_()}catch(err){setAdminButtonBusyZ53B6_(b,false);showToast(err.message,'error')}return}
  if(e.target.closest('.toggle-wa-pricing-watch-z53b')){const b=e.target.closest('.toggle-wa-pricing-watch-z53b');setAdminButtonBusyZ53B6_(b,true,'מעדכן…');try{const st=await API.request('metaPricingWatchStatusZ53B',{});await API.request('setMetaPricingWatchEnabledZ53B',{enabled:!st.enabled});showToast(!st.enabled?'עדכון המחירים היומי הופעל':'עדכון המחירים היומי כובה','success');await renderWhatsAppCostsAdminZ53B3_()}catch(err){setAdminButtonBusyZ53B6_(b,false);showToast(err.message,'error')}return}
  if(e.target.closest(".run-system-health")){await runSystemHealthUi_();return}
  if(e.target.closest(".check-event-type-assignments")){await diagnoseEventTypeAssignmentsUi_();return}
  if(e.target.closest(".repair-event-type-assignments")){await repairEventTypeAssignmentsUi_();return}
  // Guest send toggles are handled by the change event, not by a click handler.
  if(e.target.closest("[data-send-guest]"))return;

  const card=e.target.closest("[data-event]");if(card&&!e.target.closest("button,input,select")){setCurrentEvent_(card.dataset.event)}
  const er=e.target.closest(".edit-event");if(er){e.stopPropagation();eventForm(state.events.find(x=>x.id===er.dataset.id))}
  const dr=e.target.closest(".delete-event");if(dr){e.stopPropagation();if(confirm("למחוק את האירוע ואת שיוכי המוזמנים שלו?")){const id=dr.dataset.id,started=performance.now();const r=await API.request("deleteEvent",{id});removeLocal_(state.events,id);state.guests=state.guests.filter(x=>String(x.eventId)!==String(id));state.tables=state.tables.filter(x=>String(x.eventId)!==String(id));if(String(state.activeEventId)===String(id)){state.activeEventId=null;restoreCurrentEvent_()}renderAll();mutationDone_("האירוע נמחק",r,started)}}
  const waRow=e.target.closest('[data-wa-send-row]');if(waRow){
    e.stopPropagation();
    const g=state.guests.find(x=>String(x.guestId||x.id)===String(waRow.dataset.waSendRow));
    if(!g)return;
    if(!guestSendChecked(g)){showToast('המוזמן מסומן שליחה: לא','error');return}
    openGuestWhatsAppRealF14C_('',g.guestId||g.id);
    return;
  }
  const rsvpLink=e.target.closest('[data-rsvp-link]');if(rsvpLink){
    e.stopPropagation();
    const g=state.guests.find(x=>String(x.guestId||x.id)===String(rsvpLink.dataset.rsvpLink));
    if(!g)return;
    rsvpLink.disabled=true;
    try{
      const result=await API.request('createRsvpLinkV1189A1',{eventId:g.eventId,guestId:g.guestId||g.id});
      const url=new URL('rsvp.html',window.location.href);url.searchParams.set('key',result.key);
      await navigator.clipboard.writeText(url.href);
      showToast('קישור אישי הועתק ללוח — מסך תצוגה בלבד','success');
    }catch(err){showToast(err.message||'לא ניתן להעתיק את הקישור','error')}
    finally{rsvpLink.disabled=false}
    return;
  }
  const editGuest=e.target.closest("[data-edit-guest]");if(editGuest){e.stopPropagation();const g=state.guests.find(x=>String(x.guestId||x.id)===String(editGuest.dataset.editGuest));if(g)guestForm(g);return}
  const deleteGuest=e.target.closest("[data-delete-guest]");if(deleteGuest){e.stopPropagation();const g=state.guests.find(x=>String(x.guestId||x.id)===String(deleteGuest.dataset.deleteGuest));if(g)await deleteGuestV179_(g);return}
  const gr=e.target.closest("#guestsBody [data-guest]");if(gr&&!e.target.closest("button,input,label,select")){if(window.matchMedia("(hover: none), (pointer: coarse)").matches){const g=state.guests.find(x=>String(x.guestId||x.id)===String(gr.dataset.guest));if(g)guestDetails(g)}return}

  const seatGuest=e.target.closest("[data-seat-guest]");if(seatGuest){e.stopPropagation();openSeatingGuestV170_(seatGuest.dataset.seatGuest);return}
  if(e.target.closest("#resetEventGuestsV1190A10")){resetEventGuestsV1190A10_();return}
  if(e.target.closest("#deleteAllEventTablesV1190A10")){deleteAllEventTablesV1190A10_();return}
  const et=e.target.closest(".edit-table");if(et){tableForm(tablesForActiveEvent().find(x=>x.id===et.dataset.id));return}
  const dt=e.target.closest(".delete-table");if(dt){if(confirm("למחוק את השולחן?")){try{const started=performance.now();const r=await API.request("deleteTable",{id:dt.dataset.id});removeLocal_(state.tables,dt.dataset.id);if(state.seating&&String(state.seating.eventId)===String(state.activeEventId))state.seating.tables=state.seating.tables.filter(t=>String(t.id)!==String(dt.dataset.id));renderAll();mutationDone_("השולחן נמחק",r,started);await refreshSeatingAfterTableCrudV173_(state.activeEventId)}catch(err){alert(err.message)}}return}

  if(e.target.closest(".add-event-type"))eventTypeForm();
  const eet=e.target.closest(".edit-event-type");if(eet)eventTypeForm(state.eventTypes.find(x=>String(x.eventTypeId||x.id)===String(eet.dataset.id)));
  const det=e.target.closest(".delete-event-type");if(det&&confirm("למחוק את סוג האירוע?")){try{const started=performance.now();const r=await API.request("deleteEventType",{id:det.dataset.id});state.eventTypes=state.eventTypes.filter(x=>String(x.eventTypeId||x.id)!==String(det.dataset.id));state.adminData.eventTypes=state.eventTypes;renderAll();mutationDone_("סוג האירוע נמחק",r,started)}catch(err){alert(err.message)}}

  const al=e.target.closest(".add-lookup");if(al)lookupForm(al.dataset.kind);
  const el=e.target.closest(".edit-lookup");if(el)lookupForm(el.dataset.kind,(state.lookups[el.dataset.kind]||[]).find(x=>x.id===el.dataset.id));
  const dl=e.target.closest(".delete-lookup");if(dl&&confirm("למחוק את הערך?")){try{const started=performance.now();const r=await API.request("deleteLookup",{kind:dl.dataset.kind,id:dl.dataset.id});removeLocal_(state.lookups[dl.dataset.kind]||[],dl.dataset.id);rebuildLookupIndex_();renderAll();mutationDone_("הערך נמחק",r,started)}catch(err){alert(err.message)}}

  if(e.target.closest(".add-user"))userForm();
  const eu=e.target.closest(".edit-user");if(eu)userForm(state.adminData.users.find(x=>x.id===eu.dataset.id));
  const du=e.target.closest(".delete-user");if(du&&confirm("למחוק את המשתמש?")){try{const started=performance.now();const r=await API.request("deleteUser",{id:du.dataset.id});removeLocal_(state.adminData.users,du.dataset.id);renderAll();mutationDone_("המשתמש נמחק",r,started)}catch(err){alert(err.message)}}

  if(e.target.closest(".add-role"))roleForm();
  const ero=e.target.closest(".edit-role");if(ero)roleForm(state.adminData.roles.find(x=>x.id===ero.dataset.id));
  const dro=e.target.closest(".delete-role");if(dro&&confirm("למחוק את התפקיד?")){try{const started=performance.now();const r=await API.request("deleteRole",{id:dro.dataset.id});removeLocal_(state.adminData.roles,dro.dataset.id);renderAll();mutationDone_("התפקיד נמחק",r,started)}catch(err){alert(err.message)}}

  if(e.target.closest(".add-permission"))permissionForm();
  const ep=e.target.closest(".edit-permission");if(ep)permissionForm(state.adminData.permissions.find(x=>x.id===ep.dataset.id));
  const dp=e.target.closest(".delete-permission");if(dp&&confirm("למחוק את ההרשאה?")){const started=performance.now();const r=await API.request("deletePermission",{id:dp.dataset.id});removeLocal_(state.adminData.permissions,dp.dataset.id);renderAll();mutationDone_("ההרשאה נמחקה",r,started)}

  if(e.target.closest(".add-wa"))whatsappForm();
  const ew=e.target.closest(".edit-wa");if(ew)whatsappForm(state.adminData.whatsapp.find(x=>x.id===ew.dataset.id));
  const dw=e.target.closest(".delete-wa");if(dw&&confirm("למחוק את הגדרת החיבור?")){const started=performance.now();const r=await API.request("deleteWhatsAppConfig",{id:dw.dataset.id});removeLocal_(state.adminData.whatsapp,dw.dataset.id);renderAll();mutationDone_("חיבור WhatsApp נמחק",r,started)}
});

$("#guestWhatsAppTestBulkF14C").onclick=openGuestWhatsAppPreparationA19P2F6_;$("#guestWhatsAppBulkA19P2F6").onclick=openGuestWhatsAppRealF14C_;$("#addEventBtn").onclick=()=>eventForm();$("#addGuestBtn").onclick=()=>{const id=selectedGuestEventId_();id?guestForm({},id):alert("יש ליצור או לבחור אירוע קודם")};$("#guestTemplateBtn").onclick=()=>downloadGuestWorkbook_("guestImportTemplateV148");$("#guestExportBtn").onclick=()=>downloadGuestWorkbook_("guestExportCurrentV148");$("#guestImportBtn").onclick=()=>{if(activeEventForGuestTransfer_())$("#guestImportFile").click()};$("#guestImportFile").onchange=e=>{const f=e.target.files?.[0];e.target.value="";if(f)handleGuestImportFile_(f)};$("#addTableBtn").onclick=()=>{const ev=activeEvent();if(!ev)return alert("יש ליצור או לבחור אירוע קודם");if(!isTrue(ev.seatingEnabled,true))return alert("ניהול שולחנות אינו מופעל באירוע זה");tableForm()};
$("#modalClose").onclick=closeModal;
/* Do not close an edit/add modal by clicking the backdrop.
   Native date pickers may dispatch the final click outside the dialog area,
   which previously caused the event form to close before Save. */
$("#modal").onclick=e=>{
  if(e.target===$("#modal")){
    e.preventDefault();
    e.stopPropagation();
  }
};
// defensive fallback for main event selectors. 
document.addEventListener("change",e=>{
  if(e.target?.id!=="currentEventSelect"&&e.target?.id!=="activeEventSelect")return;
  const wanted=String(e.target.value||"");
  if(String(state.activeEventId||"")!==wanted)setCurrentEvent_(wanted);
},true);

const activeEventSelectEl=$("#activeEventSelect");
if(activeEventSelectEl)activeEventSelectEl.onchange=e=>setCurrentEvent_(e.target.value);
const currentEventSelectEl=$("#currentEventSelect");
if(currentEventSelectEl)currentEventSelectEl.onchange=e=>setCurrentEvent_(e.target.value);
$('#guestStatsV178')?.addEventListener('click',e=>{
  const card=e.target.closest('[data-guest-stat-kind]');if(!card)return;
  const kind=card.dataset.guestStatKind;
  const select=kind==='rsvp'?$('#statusFilter'):$('#guestSeatingFilterV174');
  if(!select||select.disabled)return;
  // D5D55Z13: statistic cards are independent, mutually exclusive shortcuts.
  // Clicking a card replaces ALL previous guest filters, rather than intersecting them.
  const value=card.dataset.guestStatValue||'';
  const wasActive=value!=='' && select.value===value &&
    ['guestSearch','sideFilter','groupFilter','guestTableFilterV174','guestSendFilterA19P2F6',
     kind==='rsvp'?'guestSeatingFilterV174':'statusFilter'].every(id=>!$('#'+id)?.value);
  ['guestSearch','sideFilter','groupFilter','statusFilter','guestSeatingFilterV174',
   'guestTableFilterV174','guestSendFilterA19P2F6'].forEach(id=>{const el=$('#'+id);if(el)el.value='';});
  // A second click toggles the active card off; "all records" is the empty filter.
  if(!wasActive)select.value=value;
  renderGuests();
});
["guestSearch","sideFilter","groupFilter","statusFilter","guestSeatingFilterV174","guestTableFilterV174","guestSendFilterA19P2F6"].forEach(id=>$("#"+id).addEventListener(id==="guestSearch"?"input":"change",renderGuests));
$("#clearGuestFiltersV180")?.addEventListener("click",()=>{
  ["guestSearch","sideFilter","groupFilter","statusFilter","guestSeatingFilterV174","guestTableFilterV174","guestSendFilterA19P2F6"].forEach(id=>{const el=$("#"+id);if(el)el.value=""});
  renderGuests();
});
$("#themeBtn").onclick=()=>setTheme(document.body.classList.contains("light")?"dark":"light");
$("#loginThemeBtn").onclick=()=>setTheme(document.body.classList.contains("light")?"dark":"light");
$("#logoutBtn").onclick=clearSession;
const loginEyeIconV185=reveal=>reveal
  ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>'
  : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 3l18 18M10.6 5.1A11.4 11.4 0 0 1 12 5c6.5 0 10 7 10 7a15 15 0 0 1-3.1 4.1M6.2 6.2C3.5 8.1 2 12 2 12s3.5 7 10 7a10.8 10.8 0 0 0 4.3-.9M9.9 9.9a3 3 0 0 0 4.2 4.2"/></svg>';
$("#togglePassword").innerHTML=loginEyeIconV185(false);
$("#togglePassword").onclick=()=>{
  const field=$("#loginPassword"),toggle=$("#togglePassword");
  const reveal=field.type==="password";
  field.type=reveal?"text":"password";
  toggle.setAttribute("aria-pressed",String(reveal));
  toggle.setAttribute("aria-label",reveal?"הסתר סיסמה":"הצג סיסמה");
  toggle.title=reveal?"הסתר סיסמה":"הצג סיסמה";
  toggle.innerHTML=loginEyeIconV185(reveal);
};
let loginBusyV184=false;
const loginFeedbackV184=(message,type)=>{
  const el=$("#loginError");
  el.textContent=message||"";
  el.hidden=!message;
  el.className="login-feedback"+(type?" login-feedback-"+type:"");
};
const setLoginFieldErrorV185=(name,message)=>{
  const input=$("#login"+name),field=$("#login"+name+"Field"),error=$("#login"+name+"Error");
  field.classList.toggle("is-invalid",!!message);
  input.setAttribute("aria-invalid",String(!!message));
  error.textContent=message||"";
  error.hidden=!message;
};
["Email","Password"].forEach(name=>$("#login"+name).addEventListener("input",()=>{
  setLoginFieldErrorV185(name,"");
  if(!$("#loginEmail").closest(".login-field").classList.contains("is-invalid")&&!$("#loginPassword").closest(".login-field").classList.contains("is-invalid"))loginFeedbackV184("","");
}));
$("#loginForm").addEventListener("submit",async event=>{
  event.preventDefault();
  if(loginBusyV184)return;
  const email=$("#loginEmail").value.trim(),password=$("#loginPassword").value;
  setLoginFieldErrorV185("Email",email?"":"חובה להזין דואר אלקטרוני");
  setLoginFieldErrorV185("Password",password?"":"חובה להזין סיסמה");
  if(!email||!password){loginFeedbackV184("","");(!email?$("#loginEmail"):$("#loginPassword")).focus();return;}
  if(!$("#loginEmail").checkValidity()){setLoginFieldErrorV185("Email","כתובת דואר אלקטרוני אינה תקינה");loginFeedbackV184("","");$("#loginEmail").focus();return;}
  loginBusyV184=true;
  const btn=$("#loginBtn");
  btn.disabled=true;
  btn.classList.add("is-loading");
  $("#loginBtnLabel").textContent="מתחבר…";
  loginFeedbackV184("","");
  try{
    clearVersionMismatchToast_();
    const r=await API.request("login",{email,password});
    assertBackendVersion_(r?.serverVersion);
    clearVersionMismatchToast_();
    state.serverVersion=r.serverVersion;
    state.session=r.session;
    state.waCostBaseF14=null;state.waCostPromiseF14=null;
    saveSession();
    setUser();
    loginFeedbackV184("התחברת בהצלחה!","success");
    $("#loginBtnLabel").textContent="התחברת בהצלחה";
    await new Promise(resolve=>setTimeout(resolve,350));
    $("#loginPassword").value="";
    document.body.classList.add("role-routing-v18");
    $("#loginOverlay").classList.remove("show");
    startupMetricsBeginF57();
    startupProgressF14Z32_(0,7,"טוען נתוני מערכת במקביל…");
    await startupPaintF14Z32_();
    await bootstrap();
    const landing=state.session?.role==="TableManager"?"seating":"dashboard";
    showPage(landing);
    document.body.classList.remove("role-routing-v18");
    await startupPaintF14Z32_();
    startupProgressF14Z32_(7,7,"המערכת מוכנה");
    await startupPaintF14Z32_();
    startupHideF14Z32_();
    startupMetricsFinishF57();
    scheduleEventImagesWarmF58_();
    void waOfferInterruptedQ22_();
  }catch(err){
    startupMetricsFinishF57(err);
    startupHideF14Z32_();$("#loginOverlay").classList.add("show");
    loginFeedbackV184(err?.message||"ההתחברות נכשלה. נסו שוב.","error");
  }finally{
    loginBusyV184=false;
    btn.disabled=false;
    btn.classList.remove("is-loading");
    $("#loginBtnLabel").textContent="כניסה למערכת";
  }
});

setTheme(localStorage.getItem(APP_CONFIG.THEME_KEY)||"dark");
restoreSession();
$$("#mainNav [data-page]").forEach(btn=>btn.classList.toggle("active",btn.dataset.page===currentPage));
const initialPageName=$("#mobilePageName");if(initialPageName)initialPageName.textContent="ראשי";
// D5D55Z20: startup errors must not silently destroy a valid saved session.
// Only an explicit authentication rejection may end the session; network,
// deployment/version, and transient backend failures retain the token.
function handleRestoredSessionFailureZ20_(error){
  startupMetricsFinishF57(error);
  document.body.classList.remove("role-routing-v18");
  startupHideF14Z32_();
  setGuestsLoadingF14Z4_(false);
  const message=String(error?.message||error||"שגיאה לא ידועה");
  console.error("[startup Z20] Restore/bootstrap failed",{message,version:APP_VERSION.FRONTEND_VERSION,error});
  const sessionRejected=/^(?:Session expired|Session required)$/i.test(message.trim());
  if(sessionRejected){
    clearSession();
    loginFeedbackV184("תוקף ההתחברות פג. יש להתחבר מחדש.","error");
    return;
  }
  // A transient startup failure is not evidence that the login is invalid.
  // Keep the saved session and offer an explicit retry rather than an automatic loop.
  const safeMessage=esc(message);
  modal(`<div class="startup-recovery-z20" dir="rtl" role="alertdialog" aria-label="טעינת המערכת נכשלה">
    <h2>לא ניתן להשלים את טעינת המערכת</h2>
    <p>פרטי ההתחברות נשמרו. ניתן לנסות לטעון שוב.</p>
    <p class="startup-recovery-error-z20">${safeMessage}</p>
    <div class="actions"><button type="button" class="primary" id="retryStartupZ20">נסה שוב</button></div>
  </div>`);
  $("#retryStartupZ20").addEventListener("click",()=>window.location.reload());
}
if(state.session){startExistingSessionZ58D3_().catch(handleRestoredSessionFailureZ20_)}
document.addEventListener("keydown",e=>{const th=e.target.closest?.(".guests-table th.sortable");if(th&&(e.key==="Enter"||e.key===" ")){e.preventDefault();setGuestSort(th.dataset.sort)}});

/* mobile guest filters default closed */
const guestFiltersToggleA5_=$("#guestFiltersToggleA5");
if(guestFiltersToggleA5_)guestFiltersToggleA5_.addEventListener("click",()=>{
 const panel=$("#guestFiltersA5"),open=panel.classList.toggle("filters-open-a5");
 guestFiltersToggleA5_.setAttribute("aria-expanded",String(open));
 guestFiltersToggleA5_.querySelector("span").textContent=open?"הסתר סינון":"הצג סינון";
});
/* Mobile navigation — preserved from V1.0.9 */
const MENU_CLOSED_ICON="☰";
const MENU_OPEN_ICON='<span class="menu-close-text" aria-hidden="true">×</span>';
function closeMobileMenu(){const nav=$("#mainNav"),btn=$("#mobileMenuBtn");if(!nav||!btn)return;nav.classList.remove("mobile-open");btn.classList.remove("open");btn.setAttribute("aria-expanded","false");btn.innerHTML=MENU_CLOSED_ICON}
function toggleMobileMenu(){const nav=$("#mainNav"),btn=$("#mobileMenuBtn");if(!nav||!btn)return;const open=nav.classList.toggle("mobile-open");btn.classList.toggle("open",open);btn.setAttribute("aria-expanded",String(open));btn.innerHTML=open?MENU_OPEN_ICON:MENU_CLOSED_ICON}
$("#mobileMenuBtn").onclick=toggleMobileMenu;
$("#mainNav").addEventListener("click",e=>{if(e.target.closest("[data-page]"))closeMobileMenu()});
window.addEventListener("resize",()=>{if(window.innerWidth>1250)closeMobileMenu()});


/* refresh authoritative seating after table CRUD; discard stale responses. */
let seatingTableRefreshSequenceV173_=0;
async function refreshSeatingAfterTableCrudV173_(eventId){
  const eid=String(eventId||'');if(!eid||eid!==String(state.activeEventId||''))return;
  const sequence=++seatingTableRefreshSequenceV173_;
  try{
    const r=await API.request('seatingStateV169',{eventId:eid});
    if(sequence!==seatingTableRefreshSequenceV173_||eid!==String(state.activeEventId||''))return;
    state.seating=r;
    // Render after the server returns; never keep the old table options in the workspace.
    renderTables();renderGuests();
  }catch(err){showToast('השולחן נשמר, אך רענון השיוכים נכשל: '+(err.message||String(err)),'error')}
}
/* Stage 5B — event-scoped seating workspace; source of truth is GuestTableAssignments. */
async function loadSeatingV170_(){
  const eid=String(state.activeEventId||'');if(!eid||!canManageTables_())return;
  const host=$('#guestSeatingNoticeV174');if(host)host.textContent="טוען נתוני שיוך...";
  try{
    const r=await API.request('seatingStateV169',{eventId:eid});
    if(eid!==String(state.activeEventId||''))return;
    state.seating=r;renderTables();renderGuests();
  }catch(err){if(host)host.textContent=err.message||String(err);showToast(err.message||String(err),'error')}
}
function renderSeatingWorkspaceV170_(){
  const host=$('#seatingWorkspaceV170');if(!host)return;
  const st=state.seating;
  if(!st||String(st.eventId)!==String(state.activeEventId)){host.innerHTML='<p class="muted">בחר אירוע כדי לטעון את השיוכים.</p>';return}
  const byId=Object.fromEntries(st.tables.map(t=>[String(t.id),t]));
  const sideSel=$('#tableLookupSideV15'),groupSel=$('#tableLookupGroupV15');
  const q=String($('#tableLookupSearchV15')?.value||'').trim().toLowerCase();
  const readOnly=state.session?.role==='TableManager';
  let baseRows=st.guests.filter(g=>Number(g.confirmedCount)>0);
  if(readOnly) baseRows=baseRows.filter(g=>st.assignments.some(a=>String(a.guestId)===String(g.guestId)));
  const tableTextFor=g=>st.assignments.filter(a=>String(a.guestId)===String(g.guestId)).map(a=>String(byId[String(a.tableId)]?.tableNumber||'')).join(' ');
  const matchesQ=g=>!q||[g.name,g.phone,g.side,g.group,tableTextFor(g)].join(' ').toLowerCase().includes(q);
  const selectedSide=String(sideSel?.value||''),selectedGroup=String(groupSel?.value||'');
  const sideSource=baseRows.filter(g=>matchesQ(g)&&(!selectedGroup||String(g.group)===selectedGroup));
  const groupSource=baseRows.filter(g=>matchesQ(g)&&(!selectedSide||String(g.side)===selectedSide));
  const sides=[...new Set(sideSource.map(g=>String(g.side||'').trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'he'));
  const groups=[...new Set(groupSource.map(g=>String(g.group||'').trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'he'));
  const fill=(el,vals,label,keep)=>{if(!el)return;el.innerHTML=`<option value="">${label}</option>`+vals.map(v=>`<option value="${esc(v)}">${esc(v)}</option>`).join('');el.value=vals.includes(keep)?keep:'';};
  fill(sideSel,sides,'כל הצדדים',selectedSide);fill(groupSel,groups,'כל הקבוצות',selectedGroup);
  const side=String(sideSel?.value||''),group=String(groupSel?.value||'');
  const filtersBox=$('#seatingFiltersD55Z8');
  if(filtersBox){
    const active=!!(q||side||group);
    filtersBox.classList.toggle('seating-filters-active-d55z8',active);
    filtersBox.setAttribute('data-filter-active',String(active));
    filtersBox.setAttribute('aria-label',active?'סינון שיוכים פעיל':'סינון שיוכים');
  }
  let rows=baseRows.filter(g=>matchesQ(g)&&(!side||String(g.side)===side)&&(!group||String(g.group)===group));
  const assigned=rows.filter(g=>g.seatingStatus==='FULL').length,partial=rows.filter(g=>g.seatingStatus==='PARTIAL').length;
  host.innerHTML=`<div class="table-summary"><span>נמצאו: <b>${rows.length}</b></span><span>שובצו במלואם: <b>${assigned}</b></span><span>שובצו חלקית: <b>${partial}</b></span></div>
    <div class="table-wrap seating-scroll-d55z8" tabindex="0" aria-label="טבלת שיוכי מוזמנים — ניתן לגלול אופקית"><table class="admin-table seating-guests-table-d55z8"><thead><tr><th>מוזמן</th><th>טלפון</th><th>צד</th><th>קבוצה</th><th>מאושרים</th><th>שולחנות</th>${readOnly?'':'<th>פעולה</th>'}</tr></thead><tbody>${rows.map(g=>{
      const mine=st.assignments.filter(a=>String(a.guestId)===String(g.guestId));
      const labels=mine.map(a=>`שולחן ${esc(byId[String(a.tableId)]?.tableNumber||'—')} - ${Number(a.seats)||0}`).join(' | ');
      // TableManager: read-only compact summary, without expand arrow or popover.
      const seatsAssigned=mine.reduce((n,a)=>n+(Number(a.seats)||0),0);
      const compactLabel=!mine.length?'לא שובץ':mine.length===1?labels:mine.length+' שולחנות · '+seatsAssigned+' מקומות';
      const managerDetails=mine.length?labels:'לא שובץ';
      return `<tr><td class="seating-guest-name-d55z8" title="${esc(g.name)}">${esc(g.name)}</td><td>${esc(displayUserPhone_(g.phone||''))}</td><td>${esc(g.side||'—')}</td><td>${esc(g.group||'—')}</td><td>${g.confirmedCount}</td><td class="seating-assignment-d55z8" title="${esc(mine.map(a=>`שולחן ${byId[String(a.tableId)]?.tableNumber||'—'} - ${Number(a.seats)||0}`).join(' | ')||'לא שובץ')}">${readOnly?managerDetails:(labels||'לא שובץ')}</td>${readOnly?'':`<td><button type="button" class="seating-row-btn-d55z8 seating-assign-btn-d55z8" data-seat-guest="${esc(g.guestId)}"><span aria-hidden="true">${mine.length?'✎':'＋'}</span> ${mine.length?'שינוי שיוך':'שיוך'}</button></td>`}</tr>`
    }).join('')||`<tr><td colspan="${readOnly?6:7}">לא נמצאו מוזמנים בהתאם לחיפוש</td></tr>`}</tbody></table></div>`;
  ['tableLookupSearchV15','tableLookupSideV15','tableLookupGroupV15'].forEach(id=>{const el=$('#'+id);if(el&&!el.dataset.boundV15){el.dataset.boundV15='1';el.addEventListener(id==='tableLookupSearchV15'?'input':'change',renderSeatingWorkspaceV170_);}});
}
async function openSeatingGuestV170_(gid){
  if(!state.seating||String(state.seating.eventId)!==String(state.activeEventId)){
    const eid=String(state.activeEventId||'');
    if(!eid)return showToast('יש לבחור אירוע לפני שיוך שולחנות','error');
    try{
      const r=await API.request('seatingStateV169',{eventId:eid});
      if(eid!==String(state.activeEventId||''))return;
      state.seating=r;renderTables();renderGuests();
    }catch(err){showToast('לא ניתן לטעון נתוני שיוך: '+(err.message||String(err)),'error');return}
  }
  const st=state.seating;
  const g=state.guests.find(x=>String(x.guestId||x.id)===String(gid));
  if(!st||String(st.eventId)!==String(state.activeEventId)||!g){showToast('נתוני המוזמן או השיוך אינם זמינים. נסה לפתוח שוב את רשימת המוזמנים.','error');return}
  if((Number(g.confirmedCount)||0)<1){showToast('שיוך שולחן אפשרי רק לאחר אישור הגעה','error');return}
  const confirmed=Number(g.confirmedCount)||0;
  const own=st.assignments.filter(a=>String(a.guestId)===String(gid));
  const parts=own.length?own.map(a=>({tableId:String(a.tableId),seats:Number(a.seats)})):[{tableId:'',seats:confirmed>0?confirmed:0}];
  modal(`<div class="seating-modal-v175 seating-modal-d55z10" dir="rtl">
    <header class="seating-modal-head-d55z10"><h2>${own.length?'שינוי שיוך שולחנות':'שיוך שולחנות'}</h2><p class="seating-guest-label-d55z10">${esc(g.name)}</p><div class="seating-confirmed-d55z10">אישרו הגעה: <strong>${confirmed}</strong><span id="seatingAssignedSummaryD55Z10" aria-live="polite"></span></div></header>
    <form id="seatingGuestFormV170" onsubmit="return false;"><div id="seatingPartsV170"></div><div id="seatingErrorV170" class="seating-inline-status-v176" role="status" aria-live="polite"></div>
    <div class="seating-modal-footer-d55z10"><div class="seating-secondary-actions-d55z10"><button type="button" id="seatingAddPartV170" class="seating-outline-btn-d55z10"><span aria-hidden="true">＋</span> פיצול לשולחן נוסף</button>${own.length?'<button type="button" id="seatingResetV170" class="seating-danger-outline-d55z10"><span aria-hidden="true">↺</span> איפוס שיוך</button>':''}</div><div class="seating-primary-actions-d55z10"><button type="button" id="seatingCancelD55Z10" class="seating-outline-btn-d55z10">ביטול</button><button type="button" id="seatingSaveV170" class="primary"><span aria-hidden="true">✓</span> שמירת שיוך</button></div></div></form></div>`);
  $('#seatingCancelD55Z10').onclick=()=>closeModal();
  const ownByTable={};own.forEach(a=>ownByTable[String(a.tableId)]=(ownByTable[String(a.tableId)]||0)+Number(a.seats));
  const valid=()=>{
    const total=parts.reduce((sum,x)=>sum+Number(x.seats),0);
    if(confirmed<=0)return 'לא ניתן לשייך מוזמן שטרם אישר הגעה.';
    if(parts.some(x=>!Number.isInteger(Number(x.seats))||Number(x.seats)<1))return 'יש להזין מספר מקומות תקין בכל שורה.';
    if(total>confirmed)return 'מספר המקומות לשיוך גדול ממספר המאושרים.';
    if(parts.some(x=>!x.tableId))return 'יש לבחור שולחן מתאים לכל חלק.';
    if(new Set(parts.map(x=>x.tableId)).size!==parts.length)return 'יש לבחור שולחן שונה לכל חלק.';
    if(parts.some(x=>{const t=st.tables.find(t=>String(t.id)===String(x.tableId));return !t||Number(t.free)+(ownByTable[String(x.tableId)]||0)<Number(x.seats)}))return 'אין מספיק מקומות פנויים בשולחן שנבחר.';
    return '';
  };
  let seatingTouched=false;
  const inlineSeatingStatus_=(message,type)=>{const node=$('#seatingErrorV170');if(!node)return;node.textContent=message;node.className='seating-inline-status-v176'+(message?' '+type:'');};
  const update=()=>{
    const total=parts.reduce((sum,x)=>sum+Number(x.seats),0);
    const message=valid();
    const showError=message && (seatingTouched || (confirmed<=0));
    inlineSeatingStatus_(showError?message:'', 'error');
    $('#seatingAddPartV170').disabled=confirmed<=0||total>=confirmed;
    $('#seatingSaveV170').disabled=!!message;
    const summary=$('#seatingAssignedSummaryD55Z10');if(summary)summary.textContent=`${total} מתוך ${confirmed} מקומות לשיוך`;
  };
  const renderParts=()=>{
    const host=$('#seatingPartsV170');if(!host)return;
    host.innerHTML=parts.map((part,i)=>{
      const needed=Number(part.seats);
      const selectedOthers=parts.filter((_,j)=>j!==i).map(x=>String(x.tableId));
      const eligible=st.tables.filter(t=>!selectedOthers.includes(String(t.id))&&Number(t.free)+(ownByTable[String(t.id)]||0)>=needed);
      if(part.tableId&&!eligible.some(t=>String(t.id)===String(part.tableId)))part.tableId='';
      const opts=eligible.map(t=>`<option value="${esc(t.id)}" ${String(part.tableId)===String(t.id)?'selected':''}>שולחן ${esc(t.tableNumber)} · פנויים ${Number(t.free)+(ownByTable[String(t.id)]||0)}</option>`).join('');
      return `<div class="seating-part-v170 seating-part-d55z10"><div class="seating-part-heading-d55z10"><strong>שיוך ${i+1}</strong>${parts.length>1?`<button type="button" data-remove-part="${i}" class="seating-danger-outline-d55z10" aria-label="הסרת חלק ${i+1}"><span aria-hidden="true">▤</span> הסרה</button>`:''}</div><label>שולחן <span class="seating-required-v176" aria-label="שדה חובה">*</span> <select required data-table-index="${i}"><option value="">בחר שולחן</option>${opts}</select></label><label>מקומות <input type="number" min="1" max="${confirmed}" data-seats-index="${i}" value="${needed}"></label></div>`;
    }).join('');update();
  };
  renderParts();
  $('#seatingPartsV170').onchange=e=>{
    const idx=e.target.dataset.seatsIndex??e.target.dataset.tableIndex;if(idx===undefined)return;
    seatingTouched=true;
    if(e.target.dataset.seatsIndex!==undefined)parts[+idx].seats=Number(e.target.value);
    else parts[+idx].tableId=e.target.value;
    renderParts();
  };
  $('#seatingPartsV170').oninput=e=>{
    if(e.target.dataset.seatsIndex===undefined)return;
    seatingTouched=true;parts[+e.target.dataset.seatsIndex].seats=Number(e.target.value);
    // Rebuild dropdowns immediately without replacing the number input while typing.
    const focused=e.target,index=Number(focused.dataset.seatsIndex),start=focused.selectionStart;
    renderParts();
    const replacement=$(`#seatingPartsV170 [data-seats-index="${index}"]`);
    if(replacement){replacement.focus();try{replacement.setSelectionRange(start,start)}catch(_){}}
  };
  $('#seatingPartsV170').onclick=e=>{const i=e.target.dataset.removePart;if(i!==undefined){seatingTouched=true;parts.splice(+i,1);renderParts()}};
  $('#seatingAddPartV170').onclick=()=>{const total=parts.reduce((n,x)=>n+Number(x.seats),0);if(confirmed<=0||total>=confirmed)return;seatingTouched=true;parts.push({tableId:'',seats:confirmed-total});renderParts()};
  $('#seatingSaveV170').onclick=async()=>{
    seatingTouched=true;const message=valid();if(message){update();return}
    const form=$('#seatingGuestFormV170'),button=$('#seatingSaveV170');seatingButtonBusyV171_(button,true,'שומר...');form.querySelectorAll('input,select').forEach(el=>el.disabled=true);
    try{const r=await API.request('saveGuestAssignmentsV169',{eventId:st.eventId,guestId:gid,assignments:parts});state.seating=r;renderTables();renderGuests();inlineSeatingStatus_('השיבוץ נשמר והמקומות הפנויים עודכנו','success');setTimeout(()=>{if($('#seatingGuestFormV170')===form)closeModal()},1800)}
    catch(err){form.querySelectorAll('input,select').forEach(el=>el.disabled=false);seatingButtonBusyV171_(button,false);inlineSeatingStatus_(err.message||String(err),'error');update();inlineSeatingStatus_(err.message||String(err),'error')}
  };
  const reset=$('#seatingResetV170');if(reset)reset.onclick=async()=>{
    if(!await seatingConfirmV171_('לאפס את כל שיוכי המוזמן לשולחנות?'))return;
    seatingButtonBusyV171_(reset,true,'מאפס...');
    try{const r=await API.request('resetGuestAssignmentsV169',{eventId:st.eventId,guestId:gid});state.seating=r;renderTables();renderGuests();inlineSeatingStatus_('שיוכי המוזמן אופסו','success');setTimeout(()=>{if($('#seatingGuestFormV170')===form)closeModal()},1800)}
    catch(err){inlineSeatingStatus_(err.message||String(err),'error')}finally{seatingButtonBusyV171_(reset,false)}
  };
}
async function resetAllSeatingV170_(){
  if(!state.seating?.assignments.length)return;
  if(!await seatingConfirmV171_('לאפס את כל השיוכים באירוע הנבחר? כל השולחנות יחזרו לתפוסה אפס.'))return;
  const resetBtn=$('#resetAllSeatingV170');seatingButtonBusyV171_(resetBtn,true,'מאפס...');
  try{const eid=String(state.activeEventId),r=await API.request('resetAllAssignmentsV169',{eventId:eid});if(eid!==String(state.activeEventId))return;state.seating=r;renderTables();renderGuests();showToast('כל השיוכים באירוע אופסו','success')}catch(err){showToast(err.message||String(err),'error')}finally{seatingButtonBusyV171_(resetBtn,false)}
}

/* Stage 5B UX: styled, accessible confirmation and action spinners. */
function seatingButtonBusyV171_(button,busy,label='מבצע...'){
  if(!button)return;
  if(busy){button.dataset.seatingOriginal=button.innerHTML;button.disabled=true;button.innerHTML='<span class="seating-spinner-v171" aria-hidden="true"></span> '+label;}
  else if(button.dataset.seatingOriginal!==undefined){button.innerHTML=button.dataset.seatingOriginal;delete button.dataset.seatingOriginal;button.disabled=false;}
}
function seatingConfirmV171_(message){
  return new Promise(resolve=>{
    const shade=document.createElement('div');shade.className='seating-confirm-shade-v171';
    shade.innerHTML='<section class="seating-confirm-v171" role="alertdialog" aria-modal="true" aria-labelledby="seatingConfirmTitleV171"><h3 id="seatingConfirmTitleV171">אישור פעולה</h3><p></p><div class="actions"><button type="button" data-answer="no">ביטול</button><button type="button" class="danger" data-answer="yes">כן, בצע</button></div></section>';
    shade.querySelector('p').textContent=message;document.body.appendChild(shade);
    const done=answer=>{document.removeEventListener('keydown',onKey);shade.remove();resolve(answer)};
    const onKey=e=>{if(e.key==='Escape'){e.preventDefault();done(false)}};
    document.addEventListener('keydown',onKey);
    shade.querySelector('[data-answer="yes"]').onclick=()=>done(true);
    shade.querySelector('[data-answer="no"]').onclick=()=>done(false);
    shade.querySelector('[data-answer="no"]').focus();
  });
}

/* Seating actions belong to the guest list, not the tables page. */
/* D5D55Z17 — compact seating summary and accessible detail popover. */
function guestSeatingCellV174_(g){
  if(!canManageTables_())return '—';
  const count=Number(g.confirmedCount)||0;
  if(!count)return '<span class="muted">לא נדרש</span>';
  const st=state.seating?.eventId===String(state.activeEventId)?state.seating:null;
  const gid=String(g.guestId||g.id);
  const sg=st?.guests?.find(x=>String(x.guestId)===gid);
  const mine=st?.assignments?.filter(a=>String(a.guestId)===gid)||[];
  const assigned=Number(sg?.assignedCount)||mine.reduce((n,a)=>n+(Number(a.seats)||0),0);
  // Defensive role handling: TableManager never receives the interactive expand trigger.
  if(state.session?.role==='TableManager'){
    const label=!st?'טוען שיוכים':!mine.length?'לא שובץ':mine.length===1?'שולחן '+(st.tables?.find(t=>String(t.id)===String(mine[0].tableId))?.tableNumber||'—'):mine.length+' שולחנות · '+assigned+' מקומות';
    return '<span class="guest-seating-summary-z16 guest-seating-summary-static-z17" aria-label="'+esc(label)+'">'+esc(label)+'</span>';
  }
  const summary=!st?'טוען שיוכים':!mine.length?'לא שובץ':mine.length===1?'שולחן '+(st.tables?.find(t=>String(t.id)===String(mine[0].tableId))?.tableNumber||'—'):mine.length+' שולחנות';
  const trigger=mine.length?'<button type="button" class="guest-seating-summary-z16" data-seating-info-z16="'+esc(gid)+'" aria-haspopup="dialog" aria-expanded="false" aria-label="הצגת פירוט שיוך לשולחנות עבור '+esc(g.name||'המוזמן')+'"><span class="guest-seating-count-z16">'+assigned+' / '+count+'</span><span class="guest-seating-label-z16">'+esc(summary)+'</span><span class="guest-seating-chevron-z16" aria-hidden="true">⌄</span></button>':'<span class="guest-seating-summary-z16 guest-seating-summary-static-z17"><span class="guest-seating-count-z16">'+assigned+' / '+count+'</span><span class="guest-seating-label-z16">'+esc(summary)+'</span></span>';
  const edit='<button type="button" class="guest-seating-action-d55z9 guest-seat-icon-z14'+(mine.length?' is-assigned':'')+'" data-seat-guest="'+esc(gid)+'" title="'+(mine.length?'שינוי שיוך':'שיוך לשולחן')+'" aria-label="'+(mine.length?'שינוי שיוך':'שיוך לשולחן')+' עבור '+esc(g.name||'המוזמן')+'"><img src="./assets/seating-table-color.png" alt="" aria-hidden="true">'+(mine.length?'<span class="guest-seat-check-z14" aria-hidden="true">✎</span>':'<span class="guest-seat-check-z14 is-new" aria-hidden="true">+</span>')+'</button>';
  return '<div class="guest-seating-v174 guest-seating-d55z9 guest-seating-row-z16">'+trigger+edit+'</div>';
}
let guestSeatingPopoverZ16_=null;
function closeGuestSeatingPopoverZ16_(){
  if(!guestSeatingPopoverZ16_)return;
  guestSeatingPopoverZ16_.trigger?.setAttribute('aria-expanded','false');
  guestSeatingPopoverZ16_.panel.remove();guestSeatingPopoverZ16_=null;
}
function placeGuestSeatingPopoverZ16_(){
  const x=guestSeatingPopoverZ16_;if(!x)return;
  if(!x.trigger.isConnected){closeGuestSeatingPopoverZ16_();return}
  const rect=x.trigger.getBoundingClientRect(),p=x.panel;
  const width=Math.min(320,window.innerWidth-20);
  p.style.width=width+'px';
  const left=Math.max(10,Math.min(window.innerWidth-width-10,rect.right-width));
  p.style.left=left+'px';
  const height=p.getBoundingClientRect().height;
  p.style.top=(rect.bottom+8+height<=window.innerHeight-8?rect.bottom+8:Math.max(8,rect.top-height-8))+'px';
}
function openGuestSeatingPopoverZ16_(trigger){
  if(guestSeatingPopoverZ16_?.trigger===trigger)return;
  closeGuestSeatingPopoverZ16_();
  const gid=trigger.dataset.seatingInfoZ16;
  const st=state.seating?.eventId===String(state.activeEventId)?state.seating:null;
  const guest=state.guests.find(g=>String(g.guestId||g.id)===gid);
  const mine=st?.assignments?.filter(a=>String(a.guestId)===gid)||[];
  const panel=document.createElement('section');panel.className='guest-seating-popover-z16';
  panel.setAttribute('role','dialog');panel.setAttribute('aria-label','פירוט שיוך לשולחנות');panel.dir='rtl';
  let rows='';
  if(!st)rows='<p class="muted">נתוני השיוך טרם נטענו</p>';
  else if(!mine.length)rows='<p class="muted">טרם שויך לשולחן</p>';
  else rows='<div class="guest-seating-popover-list-z16">'+mine.map(a=>{
    const table=st.tables?.find(t=>String(t.id)===String(a.tableId));
    const number=table?.tableNumber||'—';
    const name=table?.name||table?.tableName||'';
    return '<div class="guest-seating-popover-item-z16"><span>שולחן '+esc(String(number))+(name?' · '+esc(String(name)):'')+'</span><strong>'+esc(String(Number(a.seats)||0))+' מקומות</strong></div>';
  }).join('')+'</div>';
  const total=mine.reduce((n,a)=>n+(Number(a.seats)||0),0);
  panel.innerHTML='<div class="guest-seating-popover-head-z16"><strong>שיוך לשולחנות</strong><button type="button" data-close-seating-popover-z16 aria-label="סגירה">×</button></div>'+rows+(mine.length?'<div class="guest-seating-popover-total-z16"><span>סה״כ משויכים</span><strong>'+total+' מתוך '+(Number(guest?.confirmedCount)||0)+'</strong></div>':'');
  document.body.appendChild(panel);guestSeatingPopoverZ16_={trigger,panel};
  trigger.setAttribute('aria-expanded','true');placeGuestSeatingPopoverZ16_();
}
document.addEventListener('click',e=>{
  const trigger=e.target.closest('[data-seating-info-z16]');
  if(trigger){e.stopPropagation();if(guestSeatingPopoverZ16_?.trigger===trigger)closeGuestSeatingPopoverZ16_();else openGuestSeatingPopoverZ16_(trigger);return}
  if(e.target.closest('[data-close-seating-popover-z16]')){e.stopPropagation();closeGuestSeatingPopoverZ16_();return}
  if(!e.target.closest('.guest-seating-popover-z16'))closeGuestSeatingPopoverZ16_();
},true);
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeGuestSeatingPopoverZ16_()});
document.addEventListener('mouseover',e=>{
  if(window.matchMedia('(hover: none), (pointer: coarse)').matches)return;
  const t=e.target.closest('[data-seating-info-z16]');if(t)openGuestSeatingPopoverZ16_(t);
});
document.addEventListener('mouseout',e=>{
  const x=guestSeatingPopoverZ16_;if(!x||window.matchMedia('(hover: none), (pointer: coarse)').matches)return;
  if(x.trigger.contains(e.target)&&!x.trigger.contains(e.relatedTarget)&&!x.panel.contains(e.relatedTarget)){
    // Keep open when moving toward the floating panel; close elsewhere after a short delay.
    setTimeout(()=>{const now=guestSeatingPopoverZ16_;if(now===x&&!x.trigger.matches(':hover')&&!x.panel.matches(':hover'))closeGuestSeatingPopoverZ16_()},180);
  }
});
window.addEventListener('resize',closeGuestSeatingPopoverZ16_);
document.addEventListener('scroll',e=>{if(guestSeatingPopoverZ16_&&!guestSeatingPopoverZ16_.panel.contains(e.target))closeGuestSeatingPopoverZ16_()},true);

function renderGuestSeatingFiltersV174_(){
  const status=$('#guestSeatingFilterV174'),tables=$('#guestTableFilterV174');
  if(!status||!tables)return;
  const enabled=canManageTables_();status.disabled=!enabled;tables.disabled=!enabled;
  const old=tables.value,st=state.seating?.eventId===String(state.activeEventId)?state.seating:null;
  tables.innerHTML='<option value="">כל השולחנות</option>'+(st?.tables||[]).map(t=>'<option value="'+esc(t.id)+'">שולחן '+esc(t.tableNumber)+'</option>').join('');
  if([...tables.options].some(o=>o.value===old))tables.value=old;
  else tables.value='';
}

/* desktop double-click to view; touch single tap handled in click listener. */
document.getElementById("guestsBody")?.addEventListener("dblclick",e=>{
  if(window.matchMedia("(hover: none), (pointer: coarse)").matches||e.target.closest("button,input,label,select"))return;
  const row=e.target.closest("[data-guest]");if(!row)return;
  const g=state.guests.find(x=>String(x.guestId||x.id)===String(row.dataset.guest));if(g)guestDetails(g);
});

// public RSVP updates are made in another same-origin tab. 
let rsvpRefreshBusyV1189A4_=false;
let rsvpRefreshNeededV1189A4_=false;
async function refreshGuestsAfterRsvpV1189A4_(){
 if(!state.session||rsvpRefreshBusyV1189A4_)return;
 rsvpRefreshBusyV1189A4_=true;
 try{
  const base=await API.request('bootstrap',{token:state.session.token});
  if(!state.session)return;
  state.guests=Array.isArray(base.guests)?base.guests:state.guests;
  renderGuests();renderDashboard();
 }catch(err){console.warn('RSVP guest refresh failed',err)}
 finally{rsvpRefreshBusyV1189A4_=false;if(rsvpRefreshNeededV1189A4_){rsvpRefreshNeededV1189A4_=false;refreshGuestsAfterRsvpV1189A4_()}}
}
window.addEventListener('storage',e=>{
 if(e.key!=='events_rsvp_updated_v1189a4'||!e.newValue)return;
 if(rsvpRefreshBusyV1189A4_)rsvpRefreshNeededV1189A4_=true;else refreshGuestsAfterRsvpV1189A4_();
});
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&state.session&&currentPage==='guests')refreshGuestsAfterRsvpV1189A4_()});

/* WhatsApp log UI */
let waLogRowsZ55=[];
function waLogStatusLabelZ55_(s){return ({RETRY_WAIT_Q51:'ממתינה לניסיון חוזר',CANCELLED_RETRY_Q51:'בוטלה',UNKNOWN:'תוצאה לא ודאית',META_ACCEPTED:'ממתינה למסירה',API_FAILED:'נכשלה',SENT:'ממתינה למסירה',DELIVERED:'נמסרה',READ:'נקראה',FAILED:'נכשלה'})[String(s||'')]||String(s||'');}
function waLogIsEventManagerZ56C_(){return state.session?.role==='EventManager';}
function waLogApplyRoleViewZ56C_(){const simple=waLogIsEventManagerZ56C_(),page=$('#page-whatsappLog');if(!page)return;page.classList.toggle('wa-log-manager-z56c',simple);const env=$('#waLogEnvironmentZ55B');if(env)env.closest('select')?.classList.toggle('wa-log-manager-hidden-z56c',simple);const search=$('#waLogSearchZ55B');if(search)search.placeholder=simple?'חיפוש לפי שם או טלפון':'חיפוש לפי שם, טלפון או wamid';const intro=page.querySelector('.wa-log-intro-z55');if(intro)intro.textContent=simple?'כאן ניתן לראות אם הודעות WhatsApp ממתינות למסירה, נמסרו, נקראו או נכשלו.':'הסטטוס „ממתינה למסירה” מציין שההודעה התקבלה במערכת השליחה אך טרם התקבל אישור מסירה לטלפון.';}
function waLogEventNameZ55_(id){return state.events.find(e=>String(e.id)===String(id))?.name||id||'';}
function waLogInitFiltersZ55_(){const sel=$('#waLogEventZ55B');if(!sel)return;const old=sel.value;sel.innerHTML='<option value="">כל האירועים</option>'+state.events.map(e=>`<option value="${esc(e.id)}">${esc(e.name)}</option>`).join('');sel.value=state.events.some(e=>String(e.id)===old)?old:'';}
async function loadWhatsAppLogZ55_(button){
  const body=$('#waLogBodyZ55B');if(!body)return;logButtonBusyZ57A_(button,true,'מרענן...');waLogApplyRoleViewZ56C_();waLogInitFiltersZ55_();body.innerHTML='<tr><td colspan="8"><span class="log-btn-spinner-z57a" aria-hidden="true"></span> טוען...</td></tr>';
  const filters={eventId:$('#waLogEventZ55B')?.value||'',environment:$('#waLogEnvironmentZ55B')?.value||'',status:$('#waLogStatusZ55B')?.value||'',fromDate:$('#waLogFromZ55B')?.value||'',toDate:$('#waLogToZ55B')?.value||'',search:$('#waLogSearchZ55B')?.value||'',limit:500};
  try{const d=await API.request('listWhatsAppLogZ55',{filters});waLogRowsZ55=d.rows||[];renderWhatsAppLogZ55_(d);}catch(e){body.innerHTML=`<tr><td colspan="9" class="error">${esc(e.message)}</td></tr>`;}finally{logButtonBusyZ57A_(button,false);updateLogClearFilterStateZ57A_('wa');}
}
function waLogSortValueZ55B_(r,key){if(key==='eventName')return waLogEventNameZ55_(r.eventId);if(key==='createdAt')return String(r.createdAt||'');return String(r[key]||'');}
function sortedWhatsAppLogZ55B_(){const {key,dir}=state.waLogSort||{key:'createdAt',dir:'desc'},mul=dir==='asc'?1:-1;return [...waLogRowsZ55].sort((a,b)=>waLogSortValueZ55B_(a,key).localeCompare(waLogSortValueZ55B_(b,key),'he',{numeric:true,sensitivity:'base'})*mul);}
function updateWhatsAppLogSortUIZ55B_(){
  $$('#page-whatsappLog th[data-wa-sort]').forEach(th=>{const active=th.dataset.waSort===state.waLogSort.key;th.classList.toggle('sorted',active);const icon=th.querySelector('.sort-icon');if(icon)icon.textContent=active?(state.waLogSort.dir==='asc'?'↑':'↓'):'↕';});
  $$('#page-whatsappLog td[data-col]').forEach(td=>td.classList.toggle('sorted-col',td.dataset.col===state.waLogSort.key));
}
function setWhatsAppLogSortZ55B_(key){if(state.waLogSort.key===key)state.waLogSort.dir=state.waLogSort.dir==='asc'?'desc':'asc';else state.waLogSort={key,dir:'asc'};renderWhatsAppLogZ55_({summary:waLogSummaryFromRowsZ55B_(),truncated:waLogRowsZ55.length>=500,canPurge:state.session?.role==='Admin'});}
function waLogSummaryFromRowsZ55B_(){const rows=waLogRowsZ55;return {total:rows.length,metaAccepted:rows.filter(r=>r.status==='META_ACCEPTED').length,pending:rows.filter(r=>['META_ACCEPTED','SENT'].includes(r.status)).length,delivered:rows.filter(r=>['DELIVERED','READ'].includes(r.status)).length,read:rows.filter(r=>r.status==='READ').length,failed:rows.filter(r=>['API_FAILED','FAILED'].includes(r.status)).length};}
function formatWaLogDateTimeZ56B1_(value){
  const raw=String(value||'').trim();if(!raw)return '';
  // WhatsAppLog stores ISO-8601 UTC instants. Convert only for display.
  // Explicit offsets and Z are preserved; naive legacy strings are left unchanged.
  const iso=/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:?\d{2})$/i;
  if(iso.test(raw)){
    const date=new Date(raw);
    if(!Number.isNaN(date.getTime())){
      const parts=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Jerusalem',day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(date);
      const get=k=>(parts.find(p=>p.type===k)||{}).value||'';
      return `${get('day')}/${get('month')}/${get('year')} ${get('hour')}:${get('minute')}`;
    }
  }
  const m=raw.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/);
  return m?`${m[3]}/${m[2]}/${m[1]} ${m[4]}:${m[5]}`:raw.replace('T',' ').slice(0,16);
}
function waLogCardFilterD5D_(kind){
  const sel=$('#waLogStatusZ55B');if(!sel)return;
  const current=String(sel.dataset.cardFilter||'');sel.dataset.cardFilter=current===kind?'':kind;
  // Server status select stays empty for grouped cards (pending/failed/delivered includes >1 status).
  sel.value='';loadWhatsAppLogZ55_();
}
function waLogRowsForCardD5D_(rows){
  const kind=String($('#waLogStatusZ55B')?.dataset.cardFilter||'');if(!kind)return rows;
  const groups={pending:['META_ACCEPTED','SENT'],delivered:['DELIVERED','READ'],read:['READ'],failed:['API_FAILED','FAILED']};
  return rows.filter(r=>(groups[kind]||[]).includes(String(r.status||'')));
}
async function retryFailedWhatsAppLogD5D55Z22_(r,button){
  if(!r||!['API_FAILED','FAILED'].includes(String(r.status||'')))return;
  if(!confirm('לשלוח שוב את ההודעה שנכשלה? פעולה זו תיצור ניסיון חדש ביומן WhatsApp.'))return;
  button.disabled=true;button.textContent='שולח הודעה...';
  try{await API.request('retryFailedWhatsAppLogD5D55Z22',{logId:r.id});closeModal();showToast('הבקשה התקבלה ב-Meta. יש לבדוק סטטוס מסירה ביומן.');await loadWhatsAppLogZ55_();}
  catch(e){showToast(e.message,'error');button.disabled=false;button.textContent='שליחה חוזרת';}
}
function waLogCategoryLabelF59_(value){const v=String(value||'').trim().toUpperCase();return ({UTILITY:'שירות',MARKETING:'שיווק',AUTHENTICATION:'אימות',SERVICE:'שירות'})[v]|| (v?String(value):'לא ידוע');}
function showWhatsAppLogDetailsD5D_(r){
  if(!r)return;const admin=state.session?.role==='Admin';
  const item=(label,value,dir='')=>`<div class="wa-detail-item-d5d"><span>${esc(label)}</span><strong ${dir?`dir="${dir}"`:''}>${esc(value||'—')}</strong></div>`;
  modal(`<div class="wa-detail-modal-d5d wa-detail-compact-d55y"><h2>פרטי הודעת WhatsApp</h2><div class="wa-detail-grid-d5d">
    ${item('זמן',formatWaLogDateTimeZ56B1_(r.createdAt))}${item('אירוע',waLogEventNameZ55_(r.eventId))}${item('מוזמן',r.guestName||r.guestId)}${item('טלפון',r.phone,'ltr')}
    ${item('תבנית',r.templateDisplayName||r.templateName)}${item('סיווג תבנית',waLogCategoryLabelF59_(r.category))}${admin?item('שם טכני',r.templateName):''}${item('סביבה',r.environment)}${item('סטטוס',waLogStatusLabelZ55_(r.status))}
    ${item('נשלחה',formatWaLogDateTimeZ56B1_(r.sentAt))}${item('נמסרה',formatWaLogDateTimeZ56B1_(r.deliveredAt))}${item('נקראה',formatWaLogDateTimeZ56B1_(r.readAt))}${item('נכשלה',formatWaLogDateTimeZ56B1_(r.failedAt))}
    ${admin?`<div class="wa-detail-id-d55y">${item('wamid / messageId',r.wamid,'ltr')}</div>`:''}${admin?item('HTTP',String(r.httpStatus||'')):''}${admin?item('Error Code',r.errorCode,'ltr'):''}${admin&&Number(r.retryCountQ50)>0?item('ניסיונות חוזרים',r.retryCountQ50):''}
  </div>${r.errorMessage?`<div class="wa-detail-error-d5d"><span>סיבת הכשל</span><pre>${esc(r.errorMessage)}</pre></div>`:''}<div class="actions">${['API_FAILED','FAILED'].includes(String(r.status||''))?'<button type="button" id="waRetryFailedD5D55Z22">שליחה חוזרת</button>':''}<button type="button" class="secondary" onclick="closeModal()">סגור</button></div></div>`);
  const retryButton=$('#waRetryFailedD5D55Z22');if(retryButton)retryButton.addEventListener('click',()=>retryFailedWhatsAppLogD5D55Z22_(r,retryButton));
}
function renderWhatsAppLogZ55_(d){
  const s=d.summary||waLogSummaryFromRowsZ55B_(),sum=$('#waLogSummaryZ55B'),active=String($('#waLogStatusZ55B')?.dataset.cardFilter||'');
  updateLogClearFilterStateZ57A_('wa');if(sum)sum.innerHTML=[['סה״כ',s.total||0,'blue',''],['ממתינות למסירה',s.pending??s.metaAccepted??0,'amber','pending'],['נמסרו',s.delivered||0,'green','delivered'],['נקראו',s.read||0,'blue','read'],['נכשלו',s.failed||0,'red','failed']].map(x=>`<button type="button" class="guest-stat-card-v178 ${x[2]} ${active===x[3]&&x[3]?'wa-card-active-d5d':''}" data-wa-card="${x[3]}" title="${x[3]?'סנן לפי '+x[0]:'הצג את כל הרשומות'}"><span>${x[0]}</span><strong>${x[1]}</strong></button>`).join('');
  let rows=waLogRowsForCardD5D_(sortedWhatsAppLogZ55B_()),b=$('#waLogBodyZ55B');b.innerHTML=rows.map((r,i)=>`<tr data-wa-row="${i}" title="לחיצה כפולה להצגת פרטים"><td data-col="createdAt">${esc(formatWaLogDateTimeZ56B1_(r.createdAt))}</td><td data-col="eventName">${esc(waLogEventNameZ55_(r.eventId))}</td><td data-col="guestName" title="${esc(r.guestName||r.guestId||'')}"><span class="wa-guest-ellipsis-d55y">${esc(r.guestName||r.guestId)}</span></td><td data-col="phone" dir="ltr">${esc(r.phone||'')}</td><td data-col="templateName" title="${esc(r.templateName||'')}">${esc(waLogIsEventManagerZ56C_()?(r.templateDisplayName||r.templateName||''):(r.templateDisplayName||r.templateName||''))}</td><td data-col="category">${esc(waLogCategoryLabelF59_(r.category))}</td><td data-col="environment">${esc(r.environment||'')}</td><td data-col="status" class="wa-log-status-z55">${esc(waLogStatusLabelZ55_(r.status))}</td></tr>`).join('')||'<tr><td colspan="8" class="empty-cell">אין רשומות בהתאם לסינון.</td></tr>';
  b._waRenderedRowsD5D=rows;updateLogClearFilterStateZ57A_('wa');
  const n=$('#waLogNoticeZ55B');if(n)n.innerHTML=`<span>מוצגות <b>${rows.length}</b> מתוך <b>${s.total||waLogRowsZ55.length}</b> רשומות</span>${d.truncated?'<span class="guest-filter-active-v178">500 הרשומות האחרונות</span>':''}`;
  const purge=$('#waLogPurgeZ55B');if(purge)purge.hidden=!(d.canPurge??state.session?.role==='Admin');updateWhatsAppLogSortUIZ55B_();
}
async function purgeWhatsAppLogZ55_(button){if(state.session?.role!=='Admin')return;const beforeDate=prompt('מחק רשומות WhatsApp שנוצרו לפני תאריך (YYYY-MM-DD):');if(!beforeDate)return;if(!/^\d{4}-\d{2}-\d{2}$/.test(beforeDate)){showToast('תאריך לא תקין','error');return;}if(!confirm(`למחוק לצמיתות את כל רשומות WhatsApp מלפני ${beforeDate}?`))return;logButtonBusyZ57A_(button,true,'מנקה...');try{const d=await API.request('purgeWhatsAppLogZ55',{beforeDate});showToast(`נמחקו ${d.deleted||0} רשומות`);await loadWhatsAppLogZ55_();}catch(e){showToast(e.message,'error');}finally{logButtonBusyZ57A_(button,false);}}
document.addEventListener('change',e=>{if(e.target?.id==='waLogStatusZ55B')e.target.dataset.cardFilter='';if(['waLogEventZ55B','waLogEnvironmentZ55B','waLogStatusZ55B','waLogFromZ55B','waLogToZ55B'].includes(e.target?.id)){updateLogClearFilterStateZ57A_('wa');loadWhatsAppLogZ55_();}});
document.addEventListener('click',e=>{const card=e.target?.closest?.('#waLogSummaryZ55B [data-wa-card]');if(card){const kind=card.dataset.waCard||'';const sel=$('#waLogStatusZ55B');if(sel)sel.dataset.cardFilter=kind?((sel.dataset.cardFilter||'')===kind?'':kind):'';loadWhatsAppLogZ55_();return;}const t=e.target?.closest?.('#waLogFiltersToggleZ55B');if(t){const box=$('#waLogFiltersZ55B'),open=box?.classList.toggle('filters-open-a5');t.setAttribute('aria-expanded',String(!!open));const spans=t.querySelectorAll('span');if(spans[0])spans[0].textContent=open?'הסתר סינון':'הצג סינון';if(spans[1])spans[1].textContent=open?'▴':'▾';return;}const th=e.target?.closest?.('#page-whatsappLog th[data-wa-sort]');if(th){setWhatsAppLogSortZ55B_(th.dataset.waSort);return;}if(e.target?.closest?.('#waLogRefreshZ55B'))loadWhatsAppLogZ55_(e.target.closest('#waLogRefreshZ55B'));if(e.target?.closest?.('#waLogClearFiltersZ55B')){const cb=e.target.closest('#waLogClearFiltersZ55B');logButtonBusyZ57A_(cb,true,'מנקה...');['waLogEventZ55B','waLogEnvironmentZ55B','waLogStatusZ55B','waLogFromZ55B','waLogToZ55B','waLogSearchZ55B'].forEach(id=>{const x=$('#'+id);if(x){x.value='';if(id==='waLogStatusZ55B')x.dataset.cardFilter='';}});updateLogClearFilterStateZ57A_('wa');loadWhatsAppLogZ55_().finally(()=>logButtonBusyZ57A_(cb,false));}if(e.target?.closest?.('#waLogPurgeZ55B'))purgeWhatsAppLogZ55_(e.target.closest('#waLogPurgeZ55B'));});
document.addEventListener('input',e=>{if(e.target?.id==='waLogSearchZ55B')updateLogClearFilterStateZ57A_('wa');});
document.addEventListener('keydown',e=>{const th=e.target?.closest?.('#page-whatsappLog th[data-wa-sort]');if(th&&(e.key==='Enter'||e.key===' ')){e.preventDefault();setWhatsAppLogSortZ55B_(th.dataset.waSort);return;}if(e.target?.id==='waLogSearchZ55B'&&e.key==='Enter')loadWhatsAppLogZ55_();});

document.addEventListener('dblclick',e=>{const tr=e.target?.closest?.('#waLogBodyZ55B tr[data-wa-row]');if(!tr)return;const rows=$('#waLogBodyZ55B')?._waRenderedRowsD5D||[];showWhatsAppLogDetailsD5D_(rows[Number(tr.dataset.waRow)]);});


// Event Costs aligned with WhatsApp log UI 
let eventCostsDataZ58=null;
let eventCostsRequestFIX61=0;
let eventCostSortZ58A={key:'date',dir:'desc'};
function moneyZ58_(v){return '₪'+Number(v||0).toLocaleString('he-IL',{minimumFractionDigits:2,maximumFractionDigits:2});}
function eventCostEventNameZ58_(id){return state.events.find(e=>String(e.id||e.eventId)===String(id))?.name||id||'';}
function eventCostIsManagerZ58A_(){return state.session?.role==='EventManager';}
async function loadEventCostsZ58_(button){const body=$('#eventCostsBodyZ58');if(!body)return;const requestFIX61=++eventCostsRequestFIX61;logButtonBusyZ57A_(button,true,'מרענן...');body.innerHTML='<tr><td colspan="8"><span class="log-btn-spinner-z57a"></span> טוען...</td></tr>';try{const sel=$('#eventCostsEventZ58'),eid=sel?.dataset.userSelected==='true'?(sel.value||''):(state.activeEventId||'');const d=await API.request('eventCostsContextZ58',{eventId:eid});if(requestFIX61!==eventCostsRequestFIX61)return;eventCostsDataZ58=d;renderEventCostsZ58_(d);}catch(e){if(requestFIX61===eventCostsRequestFIX61)body.innerHTML=`<tr><td colspan="8" class="error">${esc(e.message)}</td></tr>`;}finally{logButtonBusyZ57A_(button,false);}}
function eventCostUnifiedRowsZ58A_(){if(!eventCostsDataZ58)return[];const manual=(eventCostsDataZ58.manualRows||[]).map(r=>({...r,source:'MANUAL',sourceLabel:'ידני'}));const wa=(eventCostsDataZ58.whatsAppRows||[]).map(r=>({id:'WA:'+String(r.messageId||''),eventId:r.eventId,date:String(r.createdAt||'').slice(0,10),createdAt:r.createdAt,category:'WhatsApp',description:r.templateDisplayName||r.templateName||'WhatsApp',amount:Number(r.estimatedIls||0),costType:'ESTIMATED',notes:'',source:'WHATSAPP',sourceLabel:'אוטומטי',templateName:r.templateName||'',templateCategory:r.templateCategory||r.category||'',messageId:r.messageId||''}));return manual.concat(wa);}
function eventCostFilteredRowsZ58A_(){let a=eventCostUnifiedRowsZ58A_();const cat=$('#eventCostsCategoryZ58C')?.value||'',type=$('#eventCostsTypeZ58C')?.value||'',from=$('#eventCostsFromZ58C')?.value||'',to=$('#eventCostsToZ58C')?.value||'',q=String($('#eventCostsSearchZ58C')?.value||'').trim().toLowerCase();if(cat)a=a.filter(r=>r.category===cat);if(type)a=a.filter(r=>type==='WHATSAPP'?r.source==='WHATSAPP':r.costType===type&&r.source!=='WHATSAPP');if(from)a=a.filter(r=>String(r.date||'')>=from);if(to)a=a.filter(r=>String(r.date||'')<=to);if(q)a=a.filter(r=>[r.category,r.description,r.notes].some(v=>String(v||'').toLowerCase().includes(q)));const {key,dir}=eventCostSortZ58A,m=dir==='asc'?1:-1;return a.sort((x,y)=>{const A=key==='amount'?Number(x.amount||0):String(x[key]||''),B=key==='amount'?Number(y.amount||0):String(y[key]||'');return(typeof A==='number'?A-B:String(A).localeCompare(String(B),'he',{numeric:true,sensitivity:'base'}))*m;});}
function updateEventCostClearZ58A_(){const active=(!!$('#eventCostsEventZ58')?.value)||['eventCostsCategoryZ58C','eventCostsTypeZ58C','eventCostsFromZ58C','eventCostsToZ58C','eventCostsSearchZ58C'].some(id=>String($('#'+id)?.value||'').trim());const b=$('#eventCostsClearZ58C');if(b){b.classList.toggle('filters-active-z57a',active);b.setAttribute('aria-pressed',String(active));b.title=active?'נקה את הסינון הפעיל':'אין סינון פעיל';}}
function renderEventCostsRowsZ58A_(){const rows=eventCostFilteredRowsZ58A_(),manager=eventCostIsManagerZ58A_(),b=$('#eventCostsBodyZ58');if(!b)return;const totals={total:0,actual:0,expected:0,wa:0};rows.forEach(r=>{const amount=Number(r.amount||0);totals.total+=amount;if(r.source==='WHATSAPP')totals.wa+=amount;else if(r.costType==='EXPECTED')totals.expected+=amount;else totals.actual+=amount;});[['#eventCostsTotalZ58',totals.total],['#eventCostsActualZ58C',totals.actual],['#eventCostsExpectedZ58C',totals.expected],['#eventCostsWaZ58',totals.wa]].forEach(([id,n])=>{const el=$(id);if(el)el.textContent=moneyZ58_(n);});b.innerHTML=rows.map(r=>`<tr data-cost-detail-id="${esc(r.id)}" title="לחיצה כפולה לפרטי העלות"><td>${esc(formatWaLogDateTimeZ56B1_(r.createdAt||r.date))}</td><td>${esc(r.category||'')}</td><td title="${esc(r.description||'')}">${esc(r.description||'')}</td><td><b>${moneyZ58_(r.amount)}</b></td><td>${r.source==='WHATSAPP'?'משוערת':(r.costType==='EXPECTED'?'צפויה':'בפועל')}</td><td class="event-cost-admin-tech-z58a">${esc(r.sourceLabel||'')}</td><td title="${esc(r.notes||'')}">${esc(r.notes||'')}</td><td>${r.source==='WHATSAPP'?'—':`<button type="button" class="ui-icon-btn-z58d4 edit event-cost-edit-z58" title="עריכה" aria-label="עריכה" data-id="${esc(r.id)}">✎</button> <button type="button" class="ui-icon-btn-z58d4 delete event-cost-delete-z58" title="מחיקה" aria-label="מחיקה" data-id="${esc(r.id)}">🗑</button>`}</td></tr>`).join('')||'<tr><td colspan="8" class="empty-cell">אין הוצאות בהתאם לסינון.</td></tr>';$('#page-eventCosts')?.classList.toggle('event-cost-manager-z58a',manager);const n=$('#eventCostsNoticeZ58C');if(n)n.textContent=`מוצגות ${rows.length} מתוך ${eventCostUnifiedRowsZ58A_().length} רשומות`;$$('#page-eventCosts th[data-cost-sort]').forEach(th=>{const on=th.dataset.costSort===eventCostSortZ58A.key;th.classList.toggle('sorted',on);const sp=th.querySelector('span');if(sp)sp.textContent=on?(eventCostSortZ58A.dir==='asc'?'↑':'↓'):'↕';});const byEvent=$('#eventCostsByEventZ58');if(byEvent&&eventCostsDataZ58?.canSeeAll&&!eventCostsDataZ58?.selectedEventId){const grouped=new Map();rows.forEach(r=>{const id=String(r.eventId||'');if(!grouped.has(id))grouped.set(id,{manual:0,whatsapp:0,total:0});const g=grouped.get(id),amount=Number(r.amount||0);g.total+=amount;if(r.source==='WHATSAPP')g.whatsapp+=amount;else g.manual+=amount;});byEvent.innerHTML=[...grouped].map(([id,v])=>`<tr><td>${esc(eventCostEventNameZ58_(id))}</td><td>${moneyZ58_(v.manual)}</td><td>${moneyZ58_(v.whatsapp)}</td><td><b>${moneyZ58_(v.total)}</b></td></tr>`).join('');}updateEventCostClearZ58A_();}
function renderEventCostsZ58_(d){const sel=$('#eventCostsEventZ58'),keep=sel?.dataset.userSelected==='true'?(sel.value||''):(state.activeEventId||'');if(sel){const all=d.canSeeAll?'<option value="">כל האירועים</option>':'';sel.innerHTML=all+(d.events||[]).map(e=>`<option value="${esc(e.id)}">${esc(e.name)}</option>`).join('');sel.value=(d.events||[]).some(e=>String(e.id)===String(keep))?keep:(d.canSeeAll?'':String(d.events?.[0]?.id||''));}$('#eventCostsTotalZ58').textContent=moneyZ58_(d.summary?.totalIls);$('#eventCostsActualZ58C').textContent=moneyZ58_(d.summary?.actualIls);$('#eventCostsExpectedZ58C').textContent=moneyZ58_(d.summary?.expectedIls);$('#eventCostsWaZ58').textContent=moneyZ58_(d.summary?.whatsappIls);const cs=$('#eventCostsCategoryZ58C'),old=cs?.value||'';if(cs){const names=[...new Set((d.categories||[]).map(c=>c.name).concat(['WhatsApp']))];cs.innerHTML='<option value="">כל הקטגוריות</option>'+names.map(x=>`<option value="${esc(x)}">${esc(x)}</option>`).join('');cs.value=names.includes(old)?old:'';}const allWrap=$('#eventCostsByEventWrapZ58');if(allWrap){allWrap.hidden=!(d.canSeeAll&&!d.selectedEventId);$('#eventCostsByEventZ58').innerHTML=(d.byEvent||[]).map(x=>`<tr><td>${esc(x.eventName)}</td><td>${moneyZ58_(x.manual)}</td><td>${moneyZ58_(x.whatsapp)}</td><td><b>${moneyZ58_(x.total)}</b></td></tr>`).join('');}renderEventCostsRowsZ58A_();}
function eventCostDialogZ58_(r={}){
 const d=eventCostsDataZ58;if(!d)return;
 const known=(d.categories||[]),knownNames=new Set(known.map(c=>c.name));
 const editIsCustom=!!r.category&&!knownNames.has(r.category);
 const events=(d.events||[]).map(e=>`<option value="${esc(e.id)}" ${String(e.id)===String(r.eventId||d.selectedEventId||'')?'selected':''}>${esc(e.name)}</option>`).join('');
 const cats=known.map(c=>`<option value="${esc(c.id)}" data-mode="${esc(c.pricingMode)}" ${c.name===r.category||((c.name==='אחר')&&editIsCustom)?'selected':''}>${esc(c.name)}</option>`).join('');
 modal(`<div class="cost-dialog-z58d4">
   <div class="cost-dialog-head-z58d4"><div><h2>${r.id?'עריכת הוצאה':'הוספת הוצאה'}</h2><p>הזן את פרטי ההוצאה של האירוע</p></div></div>
   <form id="eventCostFormZ58" class="cost-form-z58d4">
    <input type="hidden" name="id" value="${esc(r.id||'')}">
    <div class="cost-form-grid-z58d4 cols-3"><label><span>אירוע</span><select name="eventId" required>${events}</select></label><label><span>תאריך</span><input name="date" type="date" required value="${esc(String(r.date||new Date().toISOString().slice(0,10)).slice(0,10))}"></label><label><span>קטגוריה</span><select name="categoryId" id="eventCostCategoryInputZ58C" required><option value="">בחר קטגוריה</option>${cats}</select></label></div>
    <div id="eventCostDynamicCategoryZ58D4"></div>
    <div class="cost-form-grid-z58d4 cols-main"><label><span>תיאור</span><input name="description" required value="${esc(r.description||'')}" placeholder="לדוגמה: צילום סטילס + מגנטים"></label><label><span>מצב הוצאה</span><select name="costType"><option value="EXPECTED" ${r.costType!=='ACTUAL'?'selected':''}>צפויה</option><option value="ACTUAL" ${r.costType==='ACTUAL'?'selected':''}>בפועל</option></select></label></div>
    <div id="eventCostPricingZ58D4" class="cost-pricing-z58d4"></div>
    <label class="cost-notes-z58d4"><span>הערות</span><textarea name="notes" rows="2" placeholder="הערה אופציונלית">${esc(r.notes||'')}</textarea></label>
    <div class="cost-actions-z58d4"><button type="button" class="ui-btn-z58d4 secondary" onclick="closeModal()"><span>ביטול</span></button><button type="submit" class="ui-btn-z58d4 primary" id="eventCostSaveZ58"><span>שמירה</span></button></div>
   </form></div>`);
 const shell=$("#modal .modal");if(shell)shell.classList.add("event-cost-modal-z58d4");
 const form=$('#eventCostFormZ58'),cat=$('#eventCostCategoryInputZ58C'),dynCat=$('#eventCostDynamicCategoryZ58D4'),pricing=$('#eventCostPricingZ58D4');
 const initialCustom=editIsCustom?String(r.category||''):'';
 const rebuild=()=>{
   const o=cat.options[cat.selectedIndex],mode=o?.dataset.mode||'TOTAL',other=o?.textContent==='אחר';
   dynCat.innerHTML=other?`<label class="cost-custom-only-z58d4"><span>שם הקטגוריה</span><input name="customCategory" required value="${esc(initialCustom)}" placeholder="לדוגמה: אבטחה מיוחדת"></label>`:'';
   if(mode==='UNIT') pricing.innerHTML=`<label><span>כמות</span><input name="quantity" type="number" min="0" step="1" value="${esc(r.quantity||1)}"></label><label><span>מחיר יחידה ₪</span><input name="unitCost" type="number" min="0" step="0.01" required value="${esc(r.unitCost||'')}"></label><div class="cost-calc-z58d4"><span>סה״כ</span><strong id="eventCostCalcValueZ58D4">₪0.00</strong></div>`;
   else pricing.innerHTML=`<label class="cost-total-input-z58d4"><span>סכום כולל ₪</span><input name="unitCost" type="number" min="0" step="0.01" required value="${esc(r.unitCost||r.amount||'')}"></label><input type="hidden" name="quantity" value="1">`;
   const recalc=()=>{const out=$('#eventCostCalcValueZ58D4');if(out)out.textContent=moneyZ58_(Number(form.elements.quantity?.value||0)*Number(form.elements.unitCost?.value||0));};
   form.elements.quantity?.addEventListener('input',recalc);form.elements.unitCost?.addEventListener('input',recalc);recalc();
 };
 cat.addEventListener('change',rebuild);rebuild();const markRequired=()=>form.querySelectorAll('input[required],select[required],textarea[required]').forEach(el=>{const span=el.closest('label')?.querySelector('span');if(span)span.classList.add('required-label-fix60');});markRequired();cat.addEventListener('change',()=>queueMicrotask(markRequired));form.setAttribute('novalidate','');const feedback=document.createElement('div');feedback.className='cost-feedback-fix60';feedback.setAttribute('role','status');form.querySelector('.cost-actions-z58d4')?.before(feedback);form.addEventListener('input',e=>{e.target.classList.remove('cost-invalid-fix60');e.target.closest('label')?.querySelector('.cost-field-error-fix61')?.remove();if(feedback.classList.contains('error'))feedback.textContent='';});
 form.onsubmit=async e=>{e.preventDefault();markRequired();form.querySelectorAll('.cost-invalid-fix60').forEach(el=>el.classList.remove('cost-invalid-fix60'));const invalid=[...form.querySelectorAll('[required]')].filter(el=>!el.checkValidity());form.querySelectorAll('.cost-field-error-fix61').forEach(el=>el.remove());if(invalid.length){invalid.forEach(el=>{el.classList.add('cost-invalid-fix60');const label=el.closest('label');if(label){const message=document.createElement('small');message.className='cost-field-error-fix61';const name=label.querySelector('span')?.textContent?.replace('*','').trim()||'השדה';message.textContent=el.validity.valueMissing?'יש למלא '+name:'יש להזין ערך תקין עבור '+name;label.appendChild(message);}});feedback.className='cost-feedback-fix60 error';feedback.textContent='יש לתקן את השדות המסומנים באדום.';invalid[0].focus();return;}const o=Object.fromEntries(new FormData(form)),b=$('#eventCostSaveZ58');logButtonBusyZ57A_(b,true,'שומר...');try{await API.request('saveEventCostZ58',{cost:o});feedback.className='cost-feedback-fix60 success';feedback.textContent='ההוצאה נשמרה בהצלחה';await loadEventCostsZ58_();setTimeout(()=>{if(document.contains(form))closeModal();},1200);}catch(err){feedback.className='cost-feedback-fix60 error';feedback.textContent=err.message||'השמירה נכשלה';logButtonBusyZ57A_(b,false);}};
}

function eventCostTemplateNameFIX61_(r){
 const raw=String(r.templateName||'').toLowerCase();
 if(raw.includes('table_payment')||raw.includes('table_update'))return 'עדכון שולחן ותשלום';
 if(raw.includes('invitation')&&raw.includes('text'))return 'הזמנה לאירוע – הודעת טקסט';
 if(raw.includes('invitation'))return 'הזמנה לאירוע – עם תמונה';
 if(raw.includes('reminder'))return 'תזכורת לאירוע';
 if(raw.includes('thank'))return 'תודה על ההשתתפות';
 return /[א-ת]/.test(String(r.description||''))?r.description:'הודעת WhatsApp';
}
function eventCostDetailsFIX61_(r){
 const wa=r.source==='WHATSAPP';
 const fields=[['אירוע',eventCostEventNameZ58_(r.eventId)],['תאריך',formatWaLogDateTimeZ56B1_(r.createdAt||r.date)],['קטגוריה',r.category]];
 if(wa){fields.push(['שם התבנית',eventCostTemplateNameFIX61_(r)],['סיווג הודעה',waLogCategoryLabelF59_(r.templateCategory||r.messageCategory)],['מצב העלות','עלות משוערת']);}
 else{fields.push(['תיאור',r.description],['מצב ההוצאה',r.costType==='EXPECTED'?'צפויה':'בפועל'],['הערות',r.notes||'—']);}
 modal(`<div class="cost-detail-fix60 cost-detail-fix61" dir="rtl"><h2>${wa?'פרטי עלות WhatsApp':'פרטי הוצאה'}</h2><dl>${fields.map(([k,v])=>`<div><dt>${esc(k)}</dt><dd>${esc(v??'')}</dd></div>`).join('')}</dl><div class="cost-detail-amount-fix61"><span>סכום ${wa?'משוער':'ההוצאה'}</span><strong>${moneyZ58_(r.amount)}</strong></div><button type="button" class="ui-btn-z58d4 secondary" onclick="closeModal()">סגירה</button></div>`);
}

document.addEventListener('dblclick',e=>{const tr=e.target?.closest?.('#eventCostsBodyZ58 tr[data-cost-detail-id]');if(!tr||e.target.closest('button'))return;const r=eventCostUnifiedRowsZ58A_().find(x=>String(x.id)===String(tr.dataset.costDetailId));if(r)eventCostDetailsFIX61_(r);});
function eventCostConfirmFIX61_(){return new Promise(resolve=>{const d=document.createElement('dialog');d.className='cost-confirm-fix60';d.dir='rtl';d.innerHTML='<h3>מחיקת הוצאה</h3><p>האם למחוק את ההוצאה? לא ניתן לבטל פעולה זו.</p><div><button type="button" data-no>ביטול</button><button type="button" data-yes>אישור מחיקה</button></div>';document.body.appendChild(d);let finished=false;const done=v=>{if(finished)return;finished=true;d.close();d.remove();resolve(v);};d.querySelector('[data-no]').onclick=()=>done(false);d.querySelector('[data-yes]').onclick=()=>done(true);d.addEventListener('cancel',e=>{e.preventDefault();done(false)});d.showModal();});}
document.addEventListener('change',e=>{if(e.target?.id==='eventCostsEventZ58'){e.target.dataset.userSelected='true';loadEventCostsZ58_();}if(['eventCostsCategoryZ58C','eventCostsTypeZ58C','eventCostsFromZ58C','eventCostsToZ58C'].includes(e.target?.id)){updateEventCostClearZ58A_();renderEventCostsRowsZ58A_();}});
document.addEventListener('input',e=>{if(e.target?.id==='eventCostsSearchZ58C'){updateEventCostClearZ58A_();renderEventCostsRowsZ58A_();}});
document.addEventListener('click',async e=>{const ft=e.target?.closest?.('#eventCostsFiltersToggleZ58C');if(ft){const box=$('#eventCostsFiltersZ58C'),open=box?.classList.toggle('filters-open-a5');ft.setAttribute('aria-expanded',String(!!open));const spans=ft.querySelectorAll('span');if(spans[0])spans[0].textContent=open?'הסתר סינון':'הצג סינון';if(spans[1])spans[1].textContent=open?'▴':'▾';return;}const th=e.target?.closest?.('#page-eventCosts th[data-cost-sort]');if(th){const k=th.dataset.costSort;if(eventCostSortZ58A.key===k)eventCostSortZ58A.dir=eventCostSortZ58A.dir==='asc'?'desc':'asc';else eventCostSortZ58A={key:k,dir:'asc'};renderEventCostsRowsZ58A_();return;}if(e.target?.closest?.('#eventCostsClearZ58C')){const b=e.target.closest('#eventCostsClearZ58C');logButtonBusyZ57A_(b,true,'מנקה...');['eventCostsCategoryZ58C','eventCostsTypeZ58C','eventCostsFromZ58C','eventCostsToZ58C','eventCostsSearchZ58C'].forEach(id=>{const x=$('#'+id);if(x)x.value='';});const ev=$('#eventCostsEventZ58');if(ev){ev.dataset.userSelected='true';ev.value='';}await loadEventCostsZ58_();setTimeout(()=>logButtonBusyZ57A_(b,false),180);}if(e.target?.closest?.('#eventCostsRefreshZ58'))loadEventCostsZ58_(e.target.closest('#eventCostsRefreshZ58'));if(e.target?.closest?.('#eventCostAddZ58'))eventCostDialogZ58_();const ed=e.target?.closest?.('.event-cost-edit-z58');if(ed){const r=eventCostsDataZ58?.manualRows?.find(x=>String(x.id)===String(ed.dataset.id));if(r)eventCostDialogZ58_(r);}const del=e.target?.closest?.('.event-cost-delete-z58');if(del&&await eventCostConfirmFIX61_()){logButtonBusyZ57A_(del,true,'מוחק...');try{await API.request('deleteEventCostZ58',{id:del.dataset.id});showToast('ההוצאה נמחקה');await loadEventCostsZ58_();}catch(err){showToast(err.message,'error');logButtonBusyZ57A_(del,false);}}});

/* V1.1.90A19P2F14Z58D5D55I — payment dialog layout and feedback */
function paymentConfirmD5D55F_(message, title){
 return new Promise(resolve=>{
  const dialog=document.createElement('dialog');
  dialog.className='payment-confirm-dialog-d55g';
  dialog.setAttribute('dir','rtl');
  dialog.setAttribute('aria-label',title);
  dialog.innerHTML='<div class="payment-confirm-box-d55f"><h3></h3><p></p><div class="payment-confirm-actions-d55f"><button type="button" class="payment-confirm-cancel-d55f">ביטול</button><button type="button" class="payment-confirm-accept-d55f">אישור כיבוי</button></div></div>';
  dialog.querySelector('h3').textContent=title;
  dialog.querySelector('p').textContent=message;
  let finished=false;
  const finish=answer=>{if(finished)return;finished=true;try{dialog.close();}catch(_e){}dialog.remove();resolve(answer);};
  dialog.querySelector('.payment-confirm-cancel-d55f').onclick=()=>finish(false);
  dialog.querySelector('.payment-confirm-accept-d55f').onclick=()=>finish(true);
  dialog.addEventListener('cancel',e=>{e.preventDefault();finish(false);});
  document.body.appendChild(dialog);
  try{dialog.showModal();dialog.querySelector('.payment-confirm-cancel-d55f').focus();}
  catch(err){dialog.remove();resolve(false);console.error('Payment confirmation could not open',err);}
 });
}
async function renderEventPaymentD55U_(card){
 const eventId=card?.dataset.event;
 const container=card?.querySelector('.event-view-payment-host-d55u');
 if(!container||container.dataset.loaded==='true'||container.dataset.loading==='true')return;
 container.dataset.loading='true';
 const ev=state.events.find(e=>String(e.id)===String(eventId));if(!ev){delete container.dataset.loading;return;}
 container.innerHTML=`<section class="payment-dialog-d54c" dir="rtl"><p class="payment-hint-d54c" role="status"><span class="payment-spinner-d54c" aria-hidden="true"></span> טוען הגדרות...</p><div class="payment-form-d55u"></div></section>`;
 try{
  const settings=await API.request('paymentGetD5D54',{eventId});
  const host=container.querySelector('.payment-form-d55u'),status=container.querySelector('.payment-hint-d54c');if(!host||!container.isConnected)return;
  container.dataset.loaded='true';
  const selected=Array.isArray(settings.methods)?settings.methods:[];
  const names={bit:'Bit',paybox:'PayBox',other:'ספק תשלום אחר'};
  host.innerHTML=`<label class="payment-option-d54c payment-enable-d54c"><input type="checkbox" id="paymentEnabledD5D54" ${settings.enabled?'checked':''}><span>אפשר תשלום באירוע</span></label><div id="paymentFieldsD5D54" hidden><p class="payment-hint-d54c">בחר עד שני אמצעי תשלום והזן קישור HTTPS לכל אחד.</p><p id="paymentCountD54C" class="payment-count-d54c" aria-live="polite"></p>${Object.entries(names).map(([type,name])=>`<div class="payment-method-d54c"><label class="payment-option-d54c"><input type="checkbox" class="paymentMethodD5D54" data-type="${type}" ${selected.some(m=>m.type===type)?'checked':''}><span>${name}</span></label><input class="paymentUrlD5D54" data-type="${type}" type="url" dir="ltr" aria-label="קישור תשלום ${name}" placeholder="https://..." value="${esc(selected.find(m=>m.type===type)?.url||'')}" hidden></div>`).join('')}</div><div class="payment-actions-d54c"><button type="button" class="primary" id="paymentEditD55V"><span aria-hidden="true">✎</span> עריכה</button><button type="button" class="primary" id="paymentSaveD5D54" hidden><span aria-hidden="true">✓</span> שמירה</button><button type="button" class="secondary" id="paymentCancelD55V" hidden><span aria-hidden="true">✕</span> ביטול</button></div><p id="paymentFeedbackD5D54" class="payment-feedback-d54c" role="status" aria-live="polite"></p>`;
  status.textContent='ההגדרות נשמרות בנפרד לכל אירוע.';
  const enabled=host.querySelector('#paymentEnabledD5D54'),fields=host.querySelector('#paymentFieldsD5D54'),feedback=host.querySelector('#paymentFeedbackD5D54');
  const update=()=>{fields.hidden=!enabled.checked;const checked=[...host.querySelectorAll('.paymentMethodD5D54:checked')];host.querySelector('#paymentCountD54C').textContent=`נבחרו ${checked.length} מתוך 2 אמצעי תשלום`;host.querySelectorAll('.paymentMethodD5D54').forEach(c=>c.disabled=!c.checked&&checked.length>=2);host.querySelectorAll('.paymentUrlD5D54').forEach(i=>i.hidden=!host.querySelector('.paymentMethodD5D54[data-type="'+i.dataset.type+'"]')?.checked);feedback.textContent='';feedback.className='payment-feedback-d54c';};
  enabled.onchange=update;host.querySelectorAll('.paymentMethodD5D54').forEach(c=>c.onchange=update);update();
  const editBtn=host.querySelector('#paymentEditD55V'),saveBtn=host.querySelector('#paymentSaveD5D54'),cancelBtn=host.querySelector('#paymentCancelD55V');
  let editing=false;
  const setEditing=value=>{
    editing=value;editBtn.hidden=value;saveBtn.hidden=!value;cancelBtn.hidden=!value;
    enabled.disabled=!value;
    host.querySelectorAll('.paymentMethodD5D54').forEach(c=>{if(!value)c.disabled=true;});
    host.querySelectorAll('.paymentUrlD5D54').forEach(i=>i.readOnly=!value);
    if(value)update();
  };
  const restore=()=>{
    enabled.checked=!!settings.enabled;
    host.querySelectorAll('.paymentMethodD5D54').forEach(c=>c.checked=(settings.methods||[]).some(m=>m.type===c.dataset.type));
    host.querySelectorAll('.paymentUrlD5D54').forEach(i=>i.value=(settings.methods||[]).find(m=>m.type===i.dataset.type)?.url||'');
    update();setEditing(false);
  };
  editBtn.onclick=()=>setEditing(true);
  cancelBtn.onclick=()=>{restore();feedback.textContent='';};
  setEditing(false);
  host.querySelector('#paymentSaveD5D54').onclick=async()=>{
   const btn=host.querySelector('#paymentSaveD5D54');
   const methods=[...host.querySelectorAll('.paymentMethodD5D54:checked')].map(c=>({type:c.dataset.type,url:host.querySelector('.paymentUrlD5D54[data-type="'+c.dataset.type+'"]')?.value.trim()||''}));
   if(enabled.checked&&(!methods.length||methods.some(m=>!/^https:\/\/[^\s]+/i.test(m.url)))){feedback.textContent='יש לבחור אמצעי תשלום ולהזין קישור HTTPS תקין';feedback.className='payment-feedback-d54c error';return;}
   const disabling=!!settings.enabled&&!enabled.checked;
   // When disabling, keep the previously saved payment methods for future reactivation.
   const savedMethods=enabled.checked?methods:(settings.methods||[]).map(m=>({type:m.type,url:m.url}));
   const removing=enabled.checked&&selected.length>0&&savedMethods.length===0;
   if(disabling){feedback.textContent='ממתין לאישור כיבוי התשלום...';feedback.className='payment-feedback-d54c loading';if(!await paymentConfirmD5D55F_('אפשרות התשלום תכובה, אך קישורי התשלום יישמרו להפעלה חוזרת. להמשיך?', 'כיבוי תשלום באירוע')){feedback.textContent='כיבוי התשלום בוטל';feedback.className='payment-feedback-d54c';return;}}
   if(removing&&!await paymentConfirmD5D55F_('פעולה זו תמחק את קישורי התשלום השמורים. להמשיך?', 'מחיקת אמצעי תשלום'))return;
   btn.disabled=true;btn.setAttribute('aria-busy','true');btn.innerHTML='<span class="payment-spinner-d54c" aria-hidden="true"></span> שומר...';feedback.textContent='שומר הגדרות תשלום...';feedback.className='payment-feedback-d54c loading';
   try{const saved=await API.request('paymentSaveD5D54',{eventId,settings:{enabled:enabled.checked,methods:savedMethods,expectedUpdatedAt:settings.updatedAt||'',confirmClear:removing,confirmDisable:disabling}});settings.updatedAt=saved.updatedAt;settings.enabled=saved.enabled;settings.methods=saved.methods;selected.splice(0,selected.length,...saved.methods);feedback.className='payment-feedback-d54c success';feedback.textContent='הגדרות התשלום נשמרו בהצלחה';restore();setTimeout(()=>{if(feedback.isConnected&&feedback.textContent==='הגדרות התשלום נשמרו בהצלחה'){feedback.textContent='';feedback.className='payment-feedback-d54c';}},3500);}
   catch(err){feedback.className='payment-feedback-d54c error';feedback.textContent=err.message||String(err);}
   finally{btn.disabled=false;btn.removeAttribute('aria-busy');btn.innerHTML='<span aria-hidden="true">✓</span> שמירה';}
  };
 }catch(err){const status=container.querySelector('.payment-hint-d54c');if(status){status.innerHTML='<strong>טעינת הגדרות התשלום נכשלה.</strong> '+esc(err.message||String(err))+' <button type="button" class="secondary" id="paymentRetryD54D">נסה שוב</button>';status.classList.add('payment-error-d54c');container.querySelector('#paymentRetryD54D')?.addEventListener('click',()=>{delete container.dataset.loading;delete container.dataset.loaded;renderEventPaymentD55U_(card);});}}
 finally{delete container.dataset.loading;}
}

// Update the row immediately; persistence continues without blocking the visual state.
document.addEventListener('change',async event=>{
  const toggle=event.target.closest('[data-send-guest]');
  if(!toggle)return;
  const guestId=String(toggle.dataset.sendGuest||'');
  const enabled=toggle.checked;
  const guest=state.guests.find(g=>String(g.guestId||g.id)===guestId);
  if(!guest)return;
  guest.sendWhatsApp=enabled;
  renderGuests();
  try{
    const saved=await API.request('setGuestSend',{id:guestId,enabled});
    if(Boolean(saved?.sendWhatsApp)!==enabled)throw new Error('ערך השליחה שנשמר אינו תואם לבחירה');
  }catch(error){
    guest.sendWhatsApp=!enabled;
    renderGuests();
    showToast(error?.message||'עדכון השליחה נכשל','error');
  }
});

/* Q17 admin monitoring. No retry/send operations on this page. */
let waMonitorSnapshotQ17=null,waMonitorSerialQ17=0;
let waRecoveryCheckBusyQ22=false,waRecoveryResumeBusyQ27=false;
function waCloseInterruptedQ22_(){document.querySelector('#waInterruptedQ22')?.remove();}
function waInterruptedHtmlQ22_(data){
  const items=Array.isArray(data?.items)?data.items:[];
  return `<section class="wa-interrupted-panel-q22" role="dialog" aria-modal="true" aria-labelledby="waInterruptedTitleQ22" dir="rtl"><h2 id="waInterruptedTitleQ22">${items.length?'נמצאה שליחה שטרם הושלמה':'בדיקת שליחות שלא הושלמו'}</h2><p>ייתכן שהחלון נסגר, שהתקשורת נותקה או שהתהליך עדיין פועל בחלון אחר. פתיחת המערכת אינה שולחת הודעות.</p>${data?.unavailable?'<p role="alert">לא ניתן לאמת חלק מרשומות השליחה. יש לפנות למנהל המערכת.</p>':''}${items.map(r=>`<article><h3>${esc(r.templateName||'שליחת בדיקה')} · ${esc(state.events.find(e=>String(e.id||e.eventId)===r.eventId)?.name||'אירוע')}</h3><p>נבחרו ${esc(r.total)} · התקבלו ב־Meta ${esc(r.accepted)} · נדחו ${esc(r.failed)}</p><p><strong>${esc(r.remaining)} הודעות טרם הועברו לטיפול.</strong>${r.uncertain?` עוד ${esc(r.uncertain)} הודעות עדיין בטיפול או שתוצאתן אינה ודאית.`:''}</p>${r.retryPendingQ51?`<p><strong>${esc(r.retryPendingQ51)} הודעות ממתינות לניסיון חוזר לאחר דחיית קצב.</strong></p>`:''}${r.reason?`<p role="status">${esc(r.reason)}</p>`:''}${r.requiresSettlementQ46?`<button type="button" class="primary" data-settle-q46="${esc(r.id)}" data-event-q46="${esc(r.eventId)}">אמת וסדר תוצאות ללא שליחה</button>`:''}<button type="button" class="primary" data-resume-q22="${esc(r.id)}" data-event-q22="${esc(r.eventId)}" ${r.canResume?'':'disabled'}>${r.canResume?(r.retryPendingQ51?`המשך טיפול ב־${esc(r.retryPendingQ51)} הודעות ממתינות${r.remaining?` והשלמת ${esc(r.remaining)} שנותרו`:''}`:`המשך עם ${esc(r.remaining)} ההודעות שנותרו`):'המשך השליחה חסום עד לאימות'}</button></article>`).join('')}<p class="muted">הודעות שכבר הועברו לטיפול אינן נשלחות שוב. „התקבלו ב־Meta” אינו אישור מסירה לטלפון.</p><p class="muted">״אמת וסדר״ אינו שולח הודעות. רק לחיצה נפרדת על המשך זמין תשלח את היתרה ותפתח חלון התקדמות.</p><p id="waInterruptedStatusQ22" role="status" aria-live="polite"></p><div class="actions"><button type="button" data-refresh-q22>בדוק שוב</button><button type="button" data-close-q22>סגור לעת עתה</button></div></section>`;
}
async function waOfferInterruptedQ22_(manual=false){
  if(waRecoveryCheckBusyQ22||waRecoveryResumeBusyQ27||!['Admin','EventManager'].includes(state.session?.role))return;
  waRecoveryCheckBusyQ22=true;const token=state.session.token;
  try{
    const data=await API.request('listWhatsAppRecoveryQ22',{});
    if(state.session?.token!==token)return;
    if(!data||!Array.isArray(data.items))throw new Error('לא התקבלה תשובה תקינה לבדיקת השליחות');
    if(!data.items.length&&!data.unavailable){waCloseInterruptedQ22_();if(manual)showToast('לא נמצאה שליחת TEST פתוחה שתועדה מגרסה Q22.','success');return;}
    waCloseInterruptedQ22_();const root=document.createElement('div');root.id='waInterruptedQ22';root.className='wa-interrupted-q22';root.innerHTML=waInterruptedHtmlQ22_(data);document.body.appendChild(root);
    root.querySelector('[data-close-q22]').onclick=()=>{if(!waRecoveryResumeBusyQ27)waCloseInterruptedQ22_();};
    root.querySelector('[data-refresh-q22]').onclick=()=>waOfferInterruptedQ22_(true);
    root.querySelectorAll('[data-settle-q46]').forEach(button=>button.onclick=async()=>{
      if(waRecoveryResumeBusyQ27||button.disabled||state.session?.role!=='Admin')return;
      const item=data.items.find(r=>r.id===button.dataset.settleQ46&&r.eventId===button.dataset.eventQ46);
      if(!item?.requiresSettlementQ46||!item.settlementChecksumQ46)return;
      waRecoveryResumeBusyQ27=true;button.disabled=true;button.textContent='מאמת ומסדיר תוצאות…';button.setAttribute?.('aria-busy','true');
      const output=root.querySelector('#waInterruptedStatusQ22');output.textContent='מצליב עם היומן ושומר גיבוי. לא נשלחות הודעות.';
      let resolved=false;
      try{const r=await API.request('resolveKnownPartialQ30',{id:item.id,eventId:item.eventId,expectedChecksum:item.settlementChecksumQ46});if(state.session?.token!==token)return;
        if(r?.resolved!==true||r?.sent!==0)throw new Error('לא התקבל אישור הסדרה תקין');resolved=true;
      }catch(error){if(state.session?.token===token&&root.isConnected)output.textContent='לא אומתה הסדרת התוצאות: '+String(error?.message||error)+' — לחץ ״בדוק שוב״ לפני פעולה נוספת.';}
      finally{waRecoveryResumeBusyQ27=false;button.setAttribute?.('aria-busy','false');}
      if(resolved&&state.session?.token===token){await waOfferInterruptedQ22_(true);}
    });
    root.querySelectorAll('[data-resume-q22]').forEach(button=>button.onclick=async()=>{
      if(waRecoveryResumeBusyQ27||button.disabled)return;
      waRecoveryResumeBusyQ27=true;
      const output=root.querySelector('#waInterruptedStatusQ22'),oldText=button.textContent;
      button.disabled=true;button.setAttribute?.('aria-busy','true');
      button.innerHTML='<span class="seating-spinner-v171" aria-hidden="true"></span> מכין המשך שליחה…';
      output.textContent='בודק את היתרה בשרת ומכין את חלון ההתקדמות…';
      try{
        const r=await API.request('inspectWhatsAppRecoveryQ22',{id:button.dataset.resumeQ22,eventId:button.dataset.eventQ22,includeDeliveryQ48:true,fromAttemptedQ48:0});
        if(state.session?.token!==token)return;
        if(!r?.canResume||!Array.isArray(r.remainingGuestIds)||r.remainingGuestIds.length!==r.remaining)throw new Error(r?.reason||'המצב השתנה. יש לבדוק שוב לפני המשך');
        if(!state.events.some(e=>String(e.id||e.eventId)===r.eventId))throw new Error('האירוע אינו זמין למשתמש הנוכחי');
        setCurrentEvent_(r.eventId);waCloseInterruptedQ22_();await waOpenWhatsAppTestQ23_(r,true);
      }catch(e){output.textContent=String(e?.message||e);}
      finally{waRecoveryResumeBusyQ27=false;if(root.isConnected){button.disabled=false;button.textContent=oldText;button.setAttribute?.('aria-busy','false');}}
    });
    root.querySelector('[data-close-q22]').focus();
  }catch(e){if(state.session?.token===token)showToast('בדיקת שליחות שלא הושלמו נכשלה. ניתן לבדוק שוב במסך בדיקות WhatsApp. '+String(e?.message||e),'error');}
  finally{waRecoveryCheckBusyQ22=false;}
}
// Q53 diagnostics never drive counters, sending, or recovery. Bounded, Admin-only local history.
function waDeliveryTimingRowQ53_(x){
  if(!x||typeof x.ownerId!=='string'||typeof x.eventId!=='string'||x.ownerId.length>100||x.eventId.length>100||!['TEST','PRODUCTION'].includes(x.environment))return null;
  const number=v=>Number.isFinite(v)&&v>=0&&v<86400000?v:null;
  const cleanRange=v=>({measured:number(v?.measured)||0,minMs:number(v?.minMs),maxMs:number(v?.maxMs)});
  const range=(items,key)=>{const values=(Array.isArray(items)?items:[]).map(t=>number(t?.timingQ53?.[key])).filter(v=>v!==null);return {measured:values.length,minMs:values.length?Math.min(...values):null,maxMs:values.length?Math.max(...values):null};};
  return {ownerId:x.ownerId,eventId:x.eventId,environment:x.environment,requestMs:number(x.requestMs),responseToCounterMs:number(x.responseToCounterMs),betweenReadsMs:number(x.betweenReadsMs),count:number(x.count),pending:number(x.pending),server:{syncMs:number(x.server?.syncMs),lookupMs:number(x.server?.lookupMs),totalMs:number(x.server?.totalMs),reconcileMsQ54:number(x.server?.reconcileMsQ54),flushMsQ54:number(x.server?.flushMsQ54),acknowledgementMsQ54:number(x.server?.acknowledgementMsQ54),cleanupMsQ54:number(x.server?.cleanupMsQ54),cleanupDeferredQ54:x.server?.cleanupDeferredQ54===true},syncReason:['busy','active_or_unresolved_batch'].includes(x.syncReason)?x.syncReason:'',receivedToJournal:x.receivedToJournal?cleanRange(x.receivedToJournal):range(x.items,'receivedToJournalMs'),journalToRead:x.journalToRead?cleanRange(x.journalToRead):range(x.items,'journalToReadMs')};
}
function waDeliveryTimingSaveQ53_(x){
  try{if(state.session?.role!=='Admin'||state.session.id!==x.ownerId||String(state.activeEventId)!==x.eventId)return;const row=waDeliveryTimingRowQ53_(x);if(!row)return;
    let rows=[];try{const old=JSON.parse(localStorage.getItem('wa_delivery_timings_q53')||'[]');if(Array.isArray(old))rows=old.map(waDeliveryTimingRowQ53_).filter(Boolean);}catch(ignore){}
    rows.push(row);localStorage.setItem('wa_delivery_timings_q53',JSON.stringify(rows.slice(-40)));
  }catch(ignore){}
}
function waDeliveryTimingReportQ53_(eventId){
  let samples=[];try{const rows=JSON.parse(localStorage.getItem('wa_delivery_timings_q53')||'[]');if(Array.isArray(rows))samples=rows.map(waDeliveryTimingRowQ53_).filter(r=>r&&r.ownerId===state.session?.id&&r.eventId===String(eventId)).slice(-40);}catch(ignore){}
  return {samples,notice:'עד40 בדיקות אחרונות בדפדפן זה, למשתמש ולאירוע הנבחר; ייתכנו כמה שליחות. מדידות שרת ודפדפן נפרדות ואין חיסור שעונים ביניהם. קבלה היא תחילת קליטת האישור בקוד השרת; אין מדידה של תור התשתית לפני הפעלת הקוד. זמן עדכון היומן נלקח לפני הכתיבה ולכן משוער ואינו זמן סיום flush. נתונים ישנים עשויים להיות חסרים; זמן מהיומן לקריאה גדל גם כשהאישור כבר הוצג קודם. זמן תשובה עד מונה הוא עד עדכון DOM, ללא מדידת ציור המסך.'};
}
function waDeliveryTimingHtmlQ53_(report){
  if(!report.samples.length)return '<h4>מדידת עדכון מונים</h4><p>טרם נשמרו מדידות Q53 בדפדפן זה לאירוע הנבחר.</p>';
  const duration=v=>v===null?'לא נמדד':(v/1000).toFixed(2)+' שנ׳';
  return '<h4>מדידת עדכון מונים</h4><table><thead><tr><th>הודעות שנבדקו</th><th>זמן בקשה</th><th>עיבוד אישורים</th><th>קריאת יומן</th><th>קבלת אישור עד עדכון יומן — מרבי</th><th>עדכון יומן עד קריאה — מרבי</th><th>תשובה עד עדכון מונה</th><th>פער מבדיקה קודמת</th></tr></thead><tbody>'+report.samples.map(r=>'<tr>'+[r.count,duration(r.requestMs),duration(r.server.syncMs),duration(r.server.lookupMs),duration(r.receivedToJournal.maxMs),duration(r.journalToRead.maxMs),duration(r.responseToCounterMs),duration(r.betweenReadsMs)].map(v=>'<td>'+esc(String(v))+'</td>').join('')+'</tr>').join('')+'</tbody></table><p>'+esc(report.notice)+'</p>';
}
// Q35 timings are diagnostic only. Never send, resume, change counters or throw.
function waTimingDeltaQ35_(end,start){return Number.isFinite(end)&&Number.isFinite(start)&&end>=start?end-start:null;}
function waTimingFieldsQ35_(obj,keys){const out={};for(const k of keys)out[k]=Number.isFinite(obj?.[k])&&obj[k]>=0?obj[k]:null;return out;}
function waTimingRowQ35_(x){
  if(!x||typeof x!=='object'||![x.ownerId,x.eventId,x.campaignId].every(v=>typeof v==='string'&&v.length>0&&v.length<=100)||!Number.isSafeInteger(x.index)||x.index<1||x.index>100)return null;
  const browser=waTimingFieldsQ35_(x.browser,['clockOrigin','callStartedAt','apiEnteredAt','fetchStartedAt','headersReceivedAt','bodyReceivedAt','parsedAt','returnedAt','failedAt','pauseStartedAt','pauseFinishedAt']);
  const lifecycle=waTimingFieldsQ35_(x.server?.lifecycle,['apiStartedAt','authorizationFinishedAt','routeStartedAt','routeFinishedAt','responseReadyAt']);
  const stages=waTimingFieldsQ35_(x.server?.stages,['trackedStartedAt','claimFinishedAt','engineAndMonitorFinishedAt','recoveryFinishedAt']);
  return {ownerId:x.ownerId,eventId:x.eventId,campaignId:x.campaignId,index:x.index,batchId:typeof x.batchId==='string'?x.batchId.slice(0,100):'',browser,server:{lifecycle,stages},outcome:['RECEIVED','RESPONSE_LOST'].includes(x.outcome)?x.outcome:'RESPONSE_LOST'};
}
function waTimingSaveQ35_(trace,identity){
  try{
    if(state.session?.role!=='Admin'||state.session.id!==identity.ownerId||String(state.activeEventId)!==identity.eventId)return;
    const row=waTimingRowQ35_({...identity,browser:trace,server:{lifecycle:trace.apiTiming?.lifecycleQ35,stages:trace.dispatchStages}});if(!row)return;
    let rows=[];try{const old=JSON.parse(localStorage.getItem('wa_batch_timings_q35')||'[]');if(Array.isArray(old))rows=old.map(waTimingRowQ35_).filter(Boolean);}catch(ignore){}
    rows=rows.filter(r=>!(r.ownerId===row.ownerId&&r.eventId===row.eventId&&r.campaignId===row.campaignId&&r.index===row.index));rows.push(row);
    localStorage.setItem('wa_batch_timings_q35',JSON.stringify(rows.slice(-20)));
  }catch(ignore){}
}
function waTimingLocalRowsQ35_(eventId){
  try{const rows=JSON.parse(localStorage.getItem('wa_batch_timings_q35')||'[]');return Array.isArray(rows)?rows.map(waTimingRowQ35_).filter(r=>r&&r.ownerId===state.session?.id&&r.eventId===String(eventId)).slice(-20):[];}catch(ignore){return [];}
}
function waTimingReportQ35_(rows){
  const ordered=rows.map(waTimingRowQ35_).filter(Boolean).sort((a,b)=>a.campaignId.localeCompare(b.campaignId)||a.index-b.index);
  const batches=ordered.map(r=>{
    const b=r.browser,l=r.server.lifecycle,s=r.server.stages;
    const fetchToBodyMs=waTimingDeltaQ35_(b.bodyReceivedAt,b.fetchStartedAt),apiWorkMs=waTimingDeltaQ35_(l.responseReadyAt,l.apiStartedAt);
    const residual=fetchToBodyMs!==null&&apiWorkMs!==null?fetchToBodyMs-apiWorkMs:null;
    return {...r,measurements:{beforeFetchMs:waTimingDeltaQ35_(b.fetchStartedAt,b.apiEnteredAt),fetchToBodyMs,bodyToReturnMs:waTimingDeltaQ35_(b.returnedAt,b.bodyReceivedAt),apiWorkMs,outsideMeasuredServerMs:residual!==null&&residual>=0?residual:null,throughAuthorizationMs:waTimingDeltaQ35_(l.authorizationFinishedAt,l.apiStartedAt),claimMs:waTimingDeltaQ35_(s.claimFinishedAt,s.trackedStartedAt),engineAndMonitorMs:waTimingDeltaQ35_(s.engineAndMonitorFinishedAt,s.claimFinishedAt),recoverySettlementMs:waTimingDeltaQ35_(s.recoveryFinishedAt,s.engineAndMonitorFinishedAt),afterRecoveryMs:waTimingDeltaQ35_(l.responseReadyAt,s.recoveryFinishedAt)}};
  });
  const transitions=[];
  for(let i=1;i<ordered.length;i++){
    const a=ordered[i-1],b=ordered[i];if(a.ownerId!==b.ownerId||a.eventId!==b.eventId||a.campaignId!==b.campaignId||b.index!==a.index+1)continue;
    const sameClock=a.browser.clockOrigin!==null&&a.browser.clockOrigin===b.browser.clockOrigin;
    const d=(end,start)=>sameClock?waTimingDeltaQ35_(end,start):null;
    transitions.push({campaignId:b.campaignId,from:a.index,to:b.index,serverGapMs:waTimingDeltaQ35_(b.server.lifecycle.apiStartedAt,a.server.lifecycle.responseReadyAt),browserGapMs:d(b.browser.apiEnteredAt,a.browser.returnedAt),beforePauseMs:d(a.browser.pauseStartedAt,a.browser.returnedAt),pauseMs:d(a.browser.pauseFinishedAt,a.browser.pauseStartedAt),afterPauseMs:d(b.browser.apiEnteredAt,a.browser.pauseFinishedAt),nextBeforeFetchMs:d(b.browser.fetchStartedAt,b.browser.apiEnteredAt)});
  }
  return {batches,transitions,notice:'זמני דפדפן מחושבים בשעון מונוטוני וזמני שרת בשעון השרת. אין חיסור שעות בין דפדפן לשרת. זמן מחוץ למדידת השרת כולל גם תשתית, תורים והעברת תשובה; הוא אינו מדידת רשת טהורה. הנתונים נשמרים בדפדפן זה בלבד, עד20 מנות. נתון חסר מוצג כחסר.'};
}
function waTimingHtmlQ35_(report){
  const duration=v=>v===null?'לא נמדד':(v/1000).toFixed(2)+' שנ׳',safe=v=>esc(String(v));
  const table=(headers,rows)=>'<div style="overflow-x:auto"><table><thead><tr>'+headers.map(h=>'<th>'+h+'</th>').join('')+'</tr></thead><tbody>'+rows.map(row=>'<tr>'+row.map(v=>'<td>'+safe(v)+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>';
  return '<details><summary>מדידות מעבר בין מנות — Q35</summary>'+table(['מסע / מנה','לפני פנייה לשרת','עד סיום אימות כניסה','תביעת מנה','שליחה ושמירת ניטור','סיום התאוששות','מחוץ למדידת השרת'],report.batches.map(r=>[r.campaignId+' / '+r.index,...['beforeFetchMs','throughAuthorizationMs','claimMs','engineAndMonitorMs','recoverySettlementMs','outsideMeasuredServerMs'].map(k=>duration(r.measurements[k]))]))+table(['מעבר','עיבוד לפני השהיה','השהיה בפועל','לאחר השהיה','הכנת הבקשה הבאה','פער בין בקשות בשרת'],report.transitions.map(t=>[t.from+' ← '+t.to,...['beforePauseMs','pauseMs','afterPauseMs','nextBeforeFetchMs','serverGapMs'].map(k=>duration(t[k]))]))+'<p class="muted">'+safe(report.notice)+'</p></details>';
}

function waMonitorCampaignIdQ19_(){
  try{if(globalThis.crypto?.randomUUID)return 'TCQ19_'+globalThis.crypto.randomUUID().replace(/-/g,'');}catch(ignore){}
  return 'TCQ19_'+Date.now().toString(36)+Math.random().toString(36).slice(2,18);
}
function waMonitorLocalIssuesQ17_(eventId){
  try{const rows=JSON.parse(localStorage.getItem('wa_client_issues_q17')||'[]');return Array.isArray(rows)?rows.filter(r=>r&&r.eventId===String(eventId)).slice(-20).reverse():null;}catch(ignore){return null;}
}
function waMonitorRenderQ17_(r,local){
  const time=v=>{const d=new Date(v);return Number.isNaN(d.getTime())?'לא ידוע':d.toLocaleString('he-IL',{timeZone:'Asia/Jerusalem'});};
  const dur=v=>waFormatElapsedF14V_(Number(v)||0),safe=v=>esc(String(v??''));
  const box=(title,body)=>'<section class="admin-section"><h2>'+title+'</h2>'+body+'</section>';
  const table=(headers,rows)=>'<div style="overflow-x:auto"><table><thead><tr>'+headers.map(h=>'<th>'+h+'</th>').join('')+'</tr></thead><tbody>'+rows.map(cells=>'<tr>'+cells.map(v=>'<td>'+v+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>';
  const deliveryTimingQ24=t=>{
    if(!t)return '';
    const reasons={COMPLETE:'אושרה מסירת כל ההודעות ונמצאו שעות המסירה.',WAITING_FOR_DELIVERY:'ממתין לעדכון אישורי המסירה. אפשר לרענן את הניטור בהמשך.',MISSING_DELIVERY_TIMES:'קיימים אישורי מסירה ללא שעת מסירה שמורה; זמן מסירת כל ההודעות אינו ניתן לחישוב.',DELIVERY_ISSUES:'קיימות הודעות שנכשלו או שמצבן אינו ודאי; אין זמן מסירה של כל ההודעות.',PARTIAL_CAMPAIGN:'תיעוד השליחה אינו מלא; זמני המסירה של כל המסע אינם ניתנים לחישוב.',CONFLICT:'תיעוד השליחה סותר; המדידה אינה זמינה.',JOURNAL_UNAVAILABLE:'נתוני היומן הדרושים למדידת מסירה אינם זמינים.',JOURNAL_PARTIAL:'חלק מהודעות השליחה אינן בטווח היומן שנטען; המדידה אינה מלאה.',IDENTITY_CONFLICT:'זוהה חוסר התאמה ברשומות השליחה; המדידה אינה זמינה.',START_UNAVAILABLE:'שעת תחילת הטיפול בשרת אינה זמינה או אינה תקינה.',INVALID_TIMESTAMPS:'נמצאו שעות מסירה שאינן עקביות; המדידה אינה זמינה.'};
    const measured=v=>typeof v==='number'&&Number.isFinite(v)&&v>=0?dur(v):'לא זמין';
    const all=t.state==='COMPLETE'?measured(t.allDeliveryMs):t.state==='WAITING_FOR_DELIVERY'?'ממתין לאישורי מסירה':'לא ניתן לחשב כעת';
    return '<h4>מדידות מסירה אוטומטיות</h4>'+table(['עד המסירה הראשונה שתועדה','עד מסירת כל ההודעות'],[[measured(t.firstDeliveryMs),all]])+'<p>'+safe(reasons[t.state]||'המדידה אינה זמינה.')+(t.confirmed!==null&&t.confirmed!==undefined?' אישורי מסירה: '+safe(t.confirmed)+' מתוך '+safe(t.selected)+'.':'')+'</p>'+(t.startedAt?'<p>תחילת המדידה בשרת: '+safe(time(t.startedAt))+'.</p>':'')+'<p class="muted">הזמנים משוערים מתחילת הטיפול במנה הראשונה בשרת, לפי אישורי המסירה של WhatsApp ובדיוק של כשנייה. הם כוללים את ההמתנות בין המנות. עדכון הדוח תלוי בהגעת האישורים ובסנכרון היומן. זמן לחיצה והכנת הממשק לפני בקשת המנה הראשונה אינם כלולים.</p>';
  };
  const outcome={RETRY_WAIT_Q51:'ממתינה לניסיון חוזר',COMPLETED:'המנה הושלמה',STOPPED:'המנה נעצרה',BLOCKED:'נחסם לפני שליחה',ERROR:'שגיאה — יש לבדוק תוצאות'};
  let html='<p>עודכן: '+safe(time(r.checkedAt))+' · אירוע: '+safe(r.eventId)+' · גרסת שרת: '+safe(r.serverVersion)+'</p>';
  const unavailable=Object.entries(r.sections||{}).filter(([k,v])=>v!=='ok').map(([k])=>({journal:'יומן',runs:'אצוות',recovery:'התאוששות'}[k]||k));
  if(unavailable.length)html+='<p class="error" role="alert">נתונים לא זמינים: '+safe(unavailable.join(', '))+'. אין לפרש נתונים חסרים כאפס תקלות.</p>';
  html+=box('מה דורש טיפול',r.sections?.recovery==='ok'?'<p><strong>מפתחות חסימה פעילים במערכת: '+safe(r.globalPendingKeys)+'</strong></p>'+(r.globalPendingKeys?'<p class="error">קיימת חסימת התאוששות. יש לפתוח את מסך הבדיקות ולבצע בדיקת מצב ללא שליחה. גם חסימה מאירוע אחר יכולה למנוע שליחה.</p>':'<p>לא נמצאה חסימה פעילה בזמן הבדיקה. הדבר אינו פותר תוצאה לא ידועה מניסיון קודם.</p>'):'<p>מצב החסימות אינו ידוע.</p>');
  if(r.pairRetryQ51?.items?.length)html+=box('ניסיונות חוזרים שמורים — TEST',table(['שליחה','ממתינות','בביצוע / לא ודאי','ממתינות לשמירת תוצאה','אושרו לאחר חזרה','נדחו סופית','ניסיונות'],r.pairRetryQ51.items.map(x=>[safe(x.id||'לא זמין'),safe(x.waiting??'?'),safe(x.inFlight??'?'),safe(x.staged??'?'),safe(x.accepted??'?'),safe(x.failed??'?'),safe(x.attempts??'?')])));
  if(r.pending?.length)html+=box('אצוות פעילות באירוע',table(['אצווה','נוצרה','מצבים שנשמרו'],r.pending.map(p=>[safe(p.batchId),safe(time(p.createdAt)),safe(Object.entries(p.counts||{}).map(([k,v])=>k+': '+v).join(' · ')+(p.retryQ50?.phase==='WAITING'?' · '+p.retryQ50.pending+' ממתינות לניסיון חוזר':''))])));
  html+=box('מצב הודעות בטווח היומן',r.sections?.journal==='ok'?'<p>נבדקו '+safe(r.scannedRows)+' רשומות אחרונות במערכת; '+safe(r.eventRows)+' שייכות לאירוע הנבחר. תוצאות לא ידועות עשויות להיות גם מניסיונות שכבר הופסקו.</p>'+table(['מצב','כמות'],Object.entries(r.statuses||{}).map(([k,v])=>[safe(k),safe(v)])):'<p>היומן אינו זמין.</p>');
  html+=box('שגיאות ותוצאות לא ודאיות ביומן',r.errors?.length?table(['זמן','אצווה','מצב','HTTP / קוד','סיבה ומה לעשות'],r.errors.map(e=>[safe(time(e.at)),safe(e.batchId),safe(e.status),safe(e.httpStatus+' / '+(e.errorCode||'לא נשמר')),safe(e.errorMessage||'לא נשמר פירוט')+'<br>'+safe(e.status==='UNKNOWN'?'אין אישור לתוצאת השליחה; יש לבדוק התאוששות ולא לבצע ניסיון חוזר אוטומטי.':'בדוק את פרטי השגיאה ביומן לפני החלטה על ניסיון נוסף.')])):'<p>לא נמצאו שגיאות בטווח שנטען, או שהיומן אינו זמין.</p>');
  const number=v=>v===null||v===undefined?'לא ידוע':safe(v);
  if(r.campaignsQ19?.length)html+=box('מסעות שליחה — החל מ־Q19',r.campaignsQ19.map(c=>{
    const status=c.recoveryIdQ56?(c.delivered===c.selected?c.delivered+'/'+c.selected+' נמסרו — השליחה הושלמה כולל ההמשך':c.failed>0||c.deliveryFailed>0?'הטיפול הושלם כולל ההמשך; יש הודעות שנכשלו':'הטיפול בשליחה הושלם כולל ההמשך; ממתינים לאישורי מסירה'):c.status==='COMPLETED'?'כל המנות תועדו והושלמו':c.status==='CONFLICT'?'תיעוד סותר — אין סיכום ודאי':'תיעוד חלקי — אין להסיק שהיתרה לא נשלחה';
    return '<div class="admin-section"><h3>'+(c.recoveryIdQ56?'שליחה כולל המשכים · ':'')+safe(c.id)+'</h3>'+(c.noticeQ56?'<p>'+safe(c.noticeQ56)+'</p>':'')+'<p>'+safe(c.selected)+' הודעות נבחרו · '+safe(c.plannedBatches)+' מנות מתוכננות של עד '+safe(c.plannedBatchSize)+' · '+dur(c.plannedPauseMs)+' השהיה מתוכננת בדפדפן</p><p><strong>'+status+'</strong></p>'+table(['מנות שתועדו','הושלמו','פעילות נראות','הודעות ללא תיעוד מנה'],[[safe(c.observedBatches),safe(c.completedBatches),safe(c.activeBatches),number(c.unaccounted)]])+table(['טופלו','אושרו','כשלו בבקשה','לא ידועות','נמסרו','כשלי מסירה/שליחה ביומן','ממתינות למסירה'],[[number(c.processed),number(c.accepted),number(c.failed),number(c.unknown),number(c.delivered),number(c.deliveryFailed),number(c.deliveryPending)]])+table(['זמן שרת מצטבר','הכנה','Meta בלבד','שמירת מצב','יומן וסיום','השהיה שנמדדה בדפדפן'],[[c.serverMs===null?'לא ידוע':dur(c.serverMs),c.preparationMs===null?'לא נשמר':dur(c.preparationMs),c.metaMs===null?'לא נמדד':dur(c.metaMs),c.markerMs===null?'לא נמדד':dur(c.markerMs),c.journalMs===null?'לא נשמר':dur(c.journalMs),c.pauseMeasuredMs===null?'לא נשמר':dur(c.pauseMeasuredMs)]])+(c.settingsChanged?'<p class="error">הגדרות השרת אינן אחידות בין המנות; ראה את הצילום שנשמר בכל מנה.</p>':'')+(!c.deliveryCoverageComplete?'<p>אין כיסוי יומן מלא למנות המתועדות; תוצאות המסירה אינן מוצגות כאפס.</p>':'')+deliveryTimingQ24(c.deliveryTimingQ24)+'<p>טווח זמן מהתחלת הטיפול במנה הראשונה ועד סיום האחרונה שתועדה: '+(c.observedSpanMs===null?'לא נשמר':dur(c.observedSpanMs))+'. זהו טווח השרת; אינו כולל את כל זמן הממשק.</p><p class="muted">הכמויות מבוססות על המנות שעדיין שמורות בניטור. ההשהיה היא מדידת דפדפן; זמני ההכנה ושמירת המצב חופפים בחלקם ואין לסכום את כל העמודות.</p></div>';
  }).join(''));
  html+=box('אצוות TEST אחרונות — תיעוד החל מ־Q17',r.runs?.length?table(['סיום','אצווה','הגדרות בעת הטיפול','מצב','כמות / טופלו / אושרו / לא ידוע','זמן כולל','Meta בלבד','שמירת מצב','פרטים'],r.runs.map(x=>[safe(time(x.at)),safe(x.batchId||'לפני יצירת אצווה'),x.dispatchSettingsQ19?safe('גודל מנה מוגדר '+x.dispatchSettingsQ19.batchSize+' · עד '+x.dispatchSettingsQ19.concurrency+' פניות במקביל'):'לא נשמרו הגדרות היסטוריות',safe(outcome[x.outcome]||x.outcome),safe([x.requested,x.processed??'?',x.accepted??'?',x.unknown??'?'].join(' / ')),dur(x.elapsedMs),x.groupCount?dur(x.metaMs):'לא נמדד',x.groupCount?dur(x.markerMs):'לא נמדד',safe(x.error||'')+(x.pairRetryQ50?.rounds?'<p>'+safe(x.pairRetryQ50.recovered)+' הודעות אושרו לאחר ניסיון חוזר · '+safe(x.pairRetryQ50.rounds)+' סבבי חזרה · המתנה מתוכננת '+dur(x.pairRetryQ50.waitMs)+'</p>':'')+(x.slowest||[]).map(g=>'<p>הודעות '+safe(g.from)+'–'+safe(g.to)+': פנייה '+dur(g.metaMs)+', שמירה לפני '+dur(g.preMarkerMs)+', אחרי '+dur(g.postMarkerMs)+'</p>').join('')])):'<p>אין אצוות מתועדות בחלון הניטור עבור אירוע זה. אצוות קודמות לגרסה זו אינן משוחזרות מכאן.</p>');
  if(r.interruptedQ22){const q=r.interruptedQ22;html+=box('שליחות שלא הושלמו — Q22',(q.unavailable?'<p>חלק מרשומות ההמשך לא ניתנות לאימות.</p>':'')+(q.items?.length?table(['תבנית','משתמש','נבחרו','אושרו לשליחה','נדחו בשליחה','בטיפול / לא ודאי','טרם נשלחו'],q.items.map(x=>[safe(x.templateName),safe(x.ownerId),safe(x.total),safe(x.accepted),safe(x.failed),safe(x.uncertain),safe(x.remaining)])):'<p>לא נמצאו שליחות פתוחות שתועדו מ־Q22.</p>'));}
  if(r.runtimeQ29&&!r.runtimeQ29.ready)html+=box('בדיקת רכיבי השליחה','<p class="error">חסרים רכיבי שרת למנה גדולה. יש להתקין את קובץ WhatsAppLargeTestQ28.gs ולעדכן את הפריסה לפני בדיקה נוספת.</p>');
  if(r.beforeDispatchQ29?.unavailable)html+=box('ניסיון שנכשל לפני שליחה','<p>לא ניתן לאמת סגירה בטוחה כרגע. יש לרענן ניטור; אין להסיר חסימות ידנית.</p>');
  if(r.beforeDispatchQ29?.candidate)html+=box('ניסיון שנכשל לפני שליחה','<p>נמצא ניסיון הבדיקה של 40 הודעות שנכשל בגלל רכיב שרת חסר, לפני תחילת השליחה. אפשר לסגור אותו לאחר אימות נוסף בשרת. ההיסטוריה תישמר בגיבוי ולא יישלחו הודעות.</p><button type="button" class="primary" id="waCloseBeforeDispatchQ29" '+(r.runtimeQ29?.ready?'':'disabled')+'>סגור את הניסיון שנכשל ללא שליחה</button><p id="waCloseBeforeDispatchStatusQ29" role="status" aria-live="polite"></p>');
  if(r.knownPartialQ30?.items?.length)html+=box('הסדרת אצווה עם תוצאות ידועות',r.knownPartialQ30.items.map(x=>'<p>אושרו '+safe(x.accepted)+' · נדחו '+safe(x.failed)+' · טרם נשלחו '+safe(x.remaining)+'. ההסדרה שומרת גיבוי ומשחררת רק את ההודעות שלא נשלחו להמשך מפורש. אין כאן שליחת הודעות.</p><button type="button" class="primary" data-partial-q30="'+safe(x.id)+'">אמת תוצאות והסדר את היתרה ללא שליחה</button>').join('')+'<p id="waPartialStatusQ30" role="status" aria-live="polite"></p>');
  const kind={MONITOR_WRITE:'שמירת היסטוריית הניטור נכשלה',NETWORK:'כשל תקשורת',RESPONSE_BODY:'קריאת תשובה נכשלה',NON_JSON:'תשובה לא תקינה',API_ERROR:'השרת החזיר שגיאה',VERSION_MISMATCH:'אי־התאמת גרסאות'};
  html+=box('כשלים שנצפו בדפדפן הזה',local===null?'<p>האחסון המקומי אינו זמין או אינו תקין; לא ניתן לבדוק כשלים קודמים בדפדפן הזה.</p>':local.length?table(['זמן','פעולה','סוג'],local.map(e=>[safe(time(e.at)),safe(e.action),safe(kind[e.kind]||e.kind)])):'<p>אין כשלים שמורים לאירוע זה בדפדפן הזה. התיעוד מקומי ומוגבל ל־20 הכשלים האחרונים.</p>');
  if(typeof waTimingLocalRowsQ35_==='function'){const timingsQ35=waTimingReportQ35_(waTimingLocalRowsQ35_(r.eventId));if(timingsQ35.batches.length)html+=waTimingHtmlQ35_(timingsQ35);}
  const measuredQ44=v=>typeof v==='number'&&Number.isFinite(v)&&v>=0?safe((v/1000).toFixed(2)+' שנ׳'):'לא נמדד';
  if(typeof waDeliveryTimingHtmlQ53_==='function'&&typeof waDeliveryTimingReportQ53_==='function')html+=waDeliveryTimingHtmlQ53_(waDeliveryTimingReportQ53_(r.eventId));
  if(r.deliveryMaintenanceQ55){const health=r.deliveryMaintenanceQ55,run=health.lastRun;
    const stateLabel=run?.state==='SUCCESS'?'הסתיימה בהצלחה':run?.state==='SKIPPED'?(run.reason==='busy'?'נדחתה כי מתבצע עדכון אחר':'ממתינה לסיום רישום השליחה'):run?.state==='FAILED'?'נכשלה':'טרם נמדדה בגרסה זו';
    html+=box('תחזוקת אישורי מסירה','<p>מנגנוני תחזוקה זמינים לחשבון המבצע: '+safe(Number.isSafeInteger(health.triggerCount)?health.triggerCount:'לא זמין')+'</p><p>ריצת תחזוקה אחרונה: '+safe(stateLabel)+(run?' · '+safe(time(run.at))+' · רשומות תור שנוקו: '+safe(run.cleaned===null?'לא נמדד':run.cleaned):'')+'</p><p>התחזוקה מנקה אישורים שכבר עובדו. היא אינה שולחת הודעות.</p>');
  }
  if(r.deliveryProcessingQ45)html+=box('עיבוד אישורי מסירה','<p>אישורים בתור הקבלה: '+safe(r.deliveryProcessingQ45.queuedCallbacks)+' · '+safe(r.deliveryProcessingQ45.blockedByBatch===true?'העיבוד ממתין לסיום כתיבת אצווה':r.deliveryProcessingQ45.blockedByBatch===false?'אין חסימת עיבוד מצד אצווה':'מצב חסימה לא זמין')+(Number.isSafeInteger(r.deliveryProcessingQ45.awaitingCleanupQ54)?' · אישורים שכבר עובדו וממתינים לניקוי: '+safe(r.deliveryProcessingQ45.awaitingCleanupQ54):'')+'</p><p>ניתן לעבד אישורים שכבר התקבלו ללא שליחת הודעות וללא שחרור יתרה. הפעולה מטפלת בתור אישורי המסירה של המערכת; המונים כאן מסוננים לאירוע הנבחר.</p><button type="button" id="waDeliverySyncQ45" class="secondary">עדכן אישורי מסירה בלבד</button><p id="waDeliverySyncStatusQ45" role="status"></p>');
  const detailsQ44=(r.runs||[]).filter(x=>x.dispatchDetailsQ44?.scope==='REAL_TEST_DISPATCH');
  html+=box('פירוט שלבי השליחה האמיתית',detailsQ44.length?'<p>מדידות מנות בדיקה שנשמרו החל מ־Q44. יש להשוות עם מדידות המעבר בין המנות. נתון חסר אינו אפס.</p>'+detailsQ44.map(x=>{
    const d=x.dispatchDetailsQ44;
    const stages=[['הכנה לפני הפנייה הראשונה ל־Meta',d.phases?.preparationMs],['חלון קבוצות השליחה, כולל שמירת מצב',d.phases?.metaWindowMs],['יומן וסיום המנה',d.phases?.journalAndFinalizationMs],['כל מסלול השליחה, לפני שמירת ניטור והתאוששות',d.engine?.totalMs]];
    const prepLabels={inputValidationMs:'בדיקת הקלט',dispatchSettingsMs:'טעינת הגדרות',eventAuthorizationMs:'הרשאה לאירוע',pendingPreflightMs:'בדיקת שליחות לא סגורות',deliveryWorkerSetupMs:'בדיקת מנגנון עדכוני מסירה',templateAndRecipientMs:'טעינת תבנית ויעד בדיקה',imageValidationMs:'בדיקת תמונת האירוע',guestDataMs:'טעינת מוזמנים',sharedContextMs:'נתונים משותפים לאירוע',metaDefinitionMs:'טעינת הגדרת התבנית',templateMappingMs:'מיפוי משתני התבנית',rsvpKeysMs:'הכנת קישורי RSVP',progressSetupMs:'הכנת דיווח התקדמות',recipientPayloadsMs:'בניית בקשות ותמונת ההזמנה',testRateWaitMs:'המתנה מתוכננת לקצב טלפון הבדיקה',reservationMs:'שמירת תוכנית המנה',firstDispatchMarkerMs:'עד שמירת מצב קבוצת השליחה הראשונה'};
    const rows=Object.entries(prepLabels).map(([key,label])=>[safe(label),measuredQ44(d.preparation?.[key])]);
    const groups=[['שמירת מצב לפני בקשות',d.groups?.preMarkerMs],['המתנה למענה API של Meta',d.groups?.metaMs],['עיבוד תשובות',d.groups?.responseHandlingMs],['שמירת מצב לאחר תשובות',d.groups?.postMarkerMs],['יתר הזמן בתוך קבוצות השליחה',d.groups?.otherMs]];
    return '<details><summary>אצווה '+safe(x.batchId||'ללא מזהה')+' · '+safe(time(x.at))+'</summary>'+table(['שלב ראשי','משך'],stages.map(([label,v])=>[safe(label),measuredQ44(v)]))+table(['פירוט ההכנה — כלול בשלב הראשי','משך'],rows)+table(['פירוט קבוצות השליחה — כלול בחלון השליחה','משך'],groups.map(([label,v])=>[safe(label),measuredQ44(v)]))+'<p>מקור תמונה: '+safe(d.media?.source==='cache'?'מטמון':d.media?.source==='saved_reference'?'מזהה העלאה שמור':d.media?.source==='upload'?'העלאה':'לא נמדד או לא נדרש')+'</p>'+table(['פירוט תמונה — כלול בהכנה','משך'],[['קריאת מטמון',d.media?.cacheLookupMs],['קריאת תמונה מאחסון',d.media?.driveReadMs],['העלאה ל־Meta',d.media?.uploadMs],['שמירת מטמון',d.media?.cacheWriteMs]].map(([label,v])=>[safe(label),measuredQ44(v)]))+table(['פירוט יצירת קישורי RSVP — כלול בהכנה','משך'],[['המתנה לנעילה',d.rsvp?.lockWaitMs],['קריאת גיליון',d.rsvp?.sheetReadMs],['יצירת מפתחות',d.rsvp?.keyGenerationMs],['כתיבה ואימות',d.rsvp?.writeVerifyMs]].map(([label,v])=>[safe(label),measuredQ44(v)]))+'<p class="muted">'+safe(d.notice)+'</p></details>';
  }).join(''):'<p>אין עדיין פירוט של מנות שנשלחו ב־Q44. אין מדידות בדיעבד למנות ישנות. נתוני ההדמיה אינם נכללים כאן.</p>');
  return html+'<p class="muted">'+safe(r.notice)+'</p>';
}
let waBeforeDispatchUiBusyQ29=false;
async function waCloseBeforeDispatchUiQ29_(button){
  const candidate=waMonitorSnapshotQ17?.server?.beforeDispatchQ29?.candidate;
  if(waBeforeDispatchUiBusyQ29||button.disabled||state.session?.role!=='Admin'||!candidate||candidate.eventId!==String(state.activeEventId)||!waMonitorSnapshotQ17?.server?.runtimeQ29?.ready)return;
  waBeforeDispatchUiBusyQ29=true;button.disabled=true;button.textContent='מאמת וסוגר את הניסיון…';button.setAttribute?.('aria-busy','true');
  const token=state.session.token,eventId=String(state.activeEventId),output=$('#waCloseBeforeDispatchStatusQ29');
  if(output)output.textContent='מבצע אימות נוסף ושומר את פרטי הניסיון בגיבוי…';
  try{
    const r=await API.request('closeBeforeDispatchFailureQ29',{id:candidate.id,eventId,expectedChecksum:candidate.expectedChecksum});
    if(state.session?.token!==token||String(state.activeEventId)!==eventId)return;
    if(r?.closed!==true||r?.sent!==0)throw new Error('לא התקבל אישור סגירה תקין; יש לרענן ניטור');
    waMonitorSnapshotQ17=null;waCloseInterruptedQ22_();showToast('הניסיון נסגר ללא שליחת הודעות. ההיסטוריה נשמרה בגיבוי.','success');await loadWhatsAppMonitorQ17_();
  }catch(e){if(state.session?.token===token&&String(state.activeEventId)===eventId&&output)output.textContent='לא אומתה סגירת הניסיון: '+String(e?.message||e)+' יש לרענן ניטור לפני פעולה נוספת.';}
  finally{waBeforeDispatchUiBusyQ29=false;button.setAttribute?.('aria-busy','false');}
}
let waPartialUiBusyQ30=false;
async function waResolvePartialUiQ30_(button){
  const candidate=waMonitorSnapshotQ17?.server?.knownPartialQ30?.items?.find(x=>x.id===button.dataset.partialQ30&&x.eventId===String(state.activeEventId));
  if(waPartialUiBusyQ30||button.disabled||state.session?.role!=='Admin'||!candidate)return;
  waPartialUiBusyQ30=true;button.disabled=true;button.textContent='מאמת ושומר תוצאות…';button.setAttribute?.('aria-busy','true');
  const token=state.session.token,eventId=String(state.activeEventId),output=$('#waPartialStatusQ30');if(output)output.textContent='שומר גיבוי ומצליב עם היומן. לא נשלחות הודעות…';
  try{
    const r=await API.request('resolveKnownPartialQ30',{id:candidate.id,eventId,expectedChecksum:candidate.expectedChecksum});
    if(state.session?.token!==token||String(state.activeEventId)!==eventId)return;
    if(r?.resolved!==true||r?.sent!==0)throw new Error('לא התקבל אישור הסדרה תקין');
    waMonitorSnapshotQ17=null;waCloseInterruptedQ22_();showToast('התוצאות הוסדרו ללא שליחה. ניתן לבדוק את היתרה בחלון ההמשך.','success');await loadWhatsAppMonitorQ17_();
  }catch(e){if(state.session?.token===token&&String(state.activeEventId)===eventId&&output)output.textContent='ההסדרה לא אומתה: '+String(e?.message||e)+' יש לרענן ניטור לפני פעולה נוספת.';}
  finally{waPartialUiBusyQ30=false;button.setAttribute?.('aria-busy','false');}
}
async function loadWhatsAppMonitorQ17_(){
  if(state.session?.role!=='Admin')return;
  const output=$('#waMonitorOutputQ17'),button=$('#waMonitorRefreshQ17'),eid=String(state.activeEventId||''),serial=++waMonitorSerialQ17;
  waMonitorSnapshotQ17=null;if(!output)return;if(!eid){output.textContent='בחר אירוע לניטור.';return;}
  button.disabled=true;output.textContent='טוען מצב ניטור…';
  try{const r=await API.request('getWhatsAppMonitorQ17',{eventId:eid});if(serial!==waMonitorSerialQ17)return;if(String(state.activeEventId)!==eid){output.textContent='האירוע השתנה; לחץ רענן ניטור.';return;}const local=waMonitorLocalIssuesQ17_(eid);waMonitorSnapshotQ17={server:r,browser:local,browserTimingsQ35:waTimingReportQ35_(waTimingLocalRowsQ35_(eid)),deliveryTimingsQ53:typeof waDeliveryTimingReportQ53_==='function'?waDeliveryTimingReportQ53_(eid):{samples:[],unavailable:true},frontendVersion:APP_VERSION.FRONTEND_VERSION};output.innerHTML=waMonitorRenderQ17_(r,local);}
  catch(e){if(serial===waMonitorSerialQ17)output.textContent='טעינת הניטור נכשלה: '+String(e?.message||e)+'. אין בכך אישור שהמערכת תקינה.';}
  finally{if(serial===waMonitorSerialQ17)button.disabled=false;}
}
let waDeliverySyncBusyQ45=false;
async function waDeliverySyncUiQ45_(button){
  if(waDeliverySyncBusyQ45||button.disabled||state.session?.role!=='Admin')return;
  const token=state.session.token,eventId=String(state.activeEventId||'');if(!eventId)return;
  waDeliverySyncBusyQ45=true;button.disabled=true;button.textContent='מעדכן אישורי מסירה…';
  try{const r=await API.request('syncWhatsAppDeliveryQ45',{eventId});if(state.session?.token!==token||String(state.activeEventId)!==eventId)return;
    if(r?.sent!==0)throw new Error('תשובת עדכון לא תקינה');
    showToast(r.sync?.skipped?'העיבוד ממתין לסיום כתיבה או לנעילת השרת. לא נשלחו הודעות.':'אישורי המסירה שהתקבלו עובדו. לא נשלחו הודעות.',r.sync?.skipped?'info':'success');await loadWhatsAppMonitorQ17_();
  }catch(error){if(state.session?.token===token&&String(state.activeEventId)===eventId){const output=$('#waDeliverySyncStatusQ45');if(output)output.textContent='לא אומת עדכון האישורים: '+String(error?.message||error);}}
  finally{waDeliverySyncBusyQ45=false;button.disabled=false;button.textContent='עדכן אישורי מסירה בלבד';}
}
document.addEventListener('click',e=>{
  if(state.session?.role!=='Admin')return;
  const syncQ45=e.target?.closest?.('#waDeliverySyncQ45');if(syncQ45)void waDeliverySyncUiQ45_(syncQ45);
  const partialQ30=e.target?.closest?.('[data-partial-q30]');if(partialQ30)void waResolvePartialUiQ30_(partialQ30);
  const closeBeforeQ29=e.target?.closest?.('#waCloseBeforeDispatchQ29');if(closeBeforeQ29)void waCloseBeforeDispatchUiQ29_(closeBeforeQ29);
  if(e.target?.closest?.('#waMonitorRefreshQ17'))loadWhatsAppMonitorQ17_();
  if(e.target?.closest?.('#waMonitorTestQ17'))openGuestWhatsAppPreparationA19P2F6_();
  if(e.target?.closest?.('#waMonitorReportQ17')){
    if(!waMonitorSnapshotQ17||waMonitorSnapshotQ17.server.eventId!==String(state.activeEventId)){showToast('יש לרענן את הניטור עבור האירוע הנבחר','error');return;}
    modal('<section dir="rtl"><h2>דוח ניטור להעתקה</h2><p>ניתן להעתיק את הדוח ולצרף לתיאור התקלה. אין בו אסימוני גישה או גופי הודעות.</p><textarea readonly dir="ltr" style="width:100%;min-height:350px" aria-label="דוח ניטור">'+esc(JSON.stringify(waMonitorSnapshotQ17,null,2))+'</textarea><button type="button" onclick="closeModal()">סגור</button></section>');
  }
});

if(typeof sessionActivityInstallQ31_==='function')sessionActivityInstallQ31_();
