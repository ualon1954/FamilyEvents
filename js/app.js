/* V1.1.90A19P2F14Z58D5D53 */
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
  if(back!==front)throw new Error(`אי-התאמת גרסאות. Frontend: ${APP_VERSION.FRONTEND_VERSION} | Backend: ${serverVersion}`);
  return true;
}
let currentPage="home";

function showPage(name){
  const role=state.session?.role||"";
  if(role==="TableManager"&&name!=="seating")name="seating";
  if(role!=="Admin"&&["admin","activity"].includes(name))name="dashboard";
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
  const labels={home:"ראשי",dashboard:"לוח בקרה",events:"אירועים",guests:"מוזמנים",seating:"ניהול שולחנות",messages:"תבניות WhatsApp",whatsappLog:"יומן WhatsApp",eventCosts:"עלויות אירוע",about:"אודות",activity:"יומן פעילות",admin:"ניהול"};
  const pageName=$("#mobilePageName"); if(pageName) pageName.textContent=labels[name]||"";
  if(name==="admin") renderAdmin();
  if(name==="messages") tplLoadA19P2();
  if(name==="whatsappLog") loadWhatsAppLogZ55_();
  if(name==="eventCosts") loadEventCostsZ58_();
  if(name==="activity") loadActivityLogZ57_();
  if(name==="seating") loadSeatingV170_();
  if(name==="guests"&&canManageTables_())loadSeatingV170_();
  if(name==="guests"&&state.activeEventId){
    // V1.1.39: lookups are already loaded in bootstrap and patched locally after admin CRUD.
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
  const tablePanel=$('#tableManagementPanelV15');if(tablePanel)tablePanel.hidden=role==='TableManager';
  const seatingTitle=$('#page-seating h1');if(seatingTitle)seatingTitle.textContent=role==='TableManager'?'שיוך שולחנות':'ניהול שולחנות';
  if(role==='TableManager'){
    $$('#mainNav [data-page]').forEach(btn=>btn.style.display=btn.dataset.page==='seating'?"":"none");
  }else{
    $$('#mainNav [data-page]').forEach(btn=>{if(!btn.dataset.role)btn.style.removeProperty('display')});
  }
  $$("#mainNav [data-page]").forEach(btn=>btn.classList.toggle("active",btn.dataset.page===currentPage));
}
function saveSession(){localStorage.setItem(SESSION_CONFIG.SESSION_KEY,JSON.stringify(state.session))}
function clearSession(){localStorage.removeItem(SESSION_CONFIG.SESSION_KEY);state.session=null;state.waCostBaseF14=null;state.waCostPromiseF14=null;$("#loginOverlay").classList.add("show")}
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
  if(e?.estimatedIls!=null)return '₪'+Number(e.estimatedIls).toFixed(2);
  return String(category||'').toUpperCase()==='UTILITY'?'לא הוגדר תעריף Utility':'לא ניתן לחשב';
}
async function getWaCostEstimateCachedF14_(count=1,category='Marketing'){
  const n=Math.max(0,Number(count)||0),cat=String(category||'Marketing').trim()||'Marketing';
  if(!(state.waCostBaseByCategoryF14 instanceof Map))state.waCostBaseByCategoryF14=new Map();
  const key=cat.toUpperCase();let b=state.waCostBaseByCategoryF14.get(key)||null;
  if(!b){const r=await API.request('getWhatsAppCostEstimateF14',{count:1,category:cat});b=r?.estimate||null;if(b)state.waCostBaseByCategoryF14.set(key,b);}
  if(!b)return null;const unit=b.unitUsd==null?null:Number(b.unitUsd),fx=b.usdIls==null?null:Number(b.usdIls);
  return {...b,count:n,category:cat,estimatedUsd:unit==null?null:unit*n,estimatedIls:(unit==null||fx==null)?null:unit*n*fx};
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
  startupProgressF14Z32_(0,5,'טוען ומאמת נתוני מערכת…');
  await startupPaintF14Z32_();
  setUser();
  // Single bootstrap path: the normal authenticated API calls also carry the
  // server version. No extra GET/fetch/version endpoint is used.
  await bootstrap();
  showPage(state.session?.role==='TableManager'?'seating':'dashboard');
  document.body.classList.remove('role-routing-v18');
  startupHideF14Z32_();
}

async function bootstrap(){
  setGuestsLoadingF14Z4_(true);
  startupProgressF14Z32_(0,4,"טוען נתוני ליבה…");
  clearVersionMismatchToast_();
  const token=state.session?.token;
  let done=0;
  const step=(label,promise)=>promise.then(data=>{
    done+=1;
    startupProgressF14Z32_(done,4,label);
    return data;
  });
  // D5D12: use the existing split endpoints concurrently. This prevents the
  // startup overlay from waiting at 0% behind one large sequential bootstrap.
  const [core,guests,tables,admin]=await Promise.all([
    step("נתוני ליבה נטענו…",API.request("bootstrapCoreParallel",{token})),
    step("רשימת מוזמנים נטענה…",API.request("bootstrapGuestsParallel",{token})),
    step("נתוני שולחנות נטענו…",API.request("bootstrapTablesParallel",{token})),
    step("נתוני ניהול נטענו…",API.request("bootstrapAdminParallel",{token}))
  ]);
  const versions=[core,guests,tables,admin].map(x=>x?.serverVersion).filter(Boolean);
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
  restoreCurrentEvent_();renderAll();setGuestsLoadingF14Z4_(false);
  startupProgressF14Z32_(4,4,"הטעינה הושלמה");
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
// V1.1.39: strict event-type lookup. No fallback to the current global context.
// Guest filters/forms use this helper so switching events can never reuse another event type's options.
function strictScopedLookup_(kind,eventTypeId){
  const scopeId=String(eventTypeId||'');
  if(!scopeId)return [];
  return activeLookup(kind,scopeId);
}
function lookupKey_(kind,x){return kind==="sides"?String(x.sideId||x.id||""):kind==="groups"?String(x.groupId||x.id||""):String(x.value||x.id||"")}
// V1.1.39: Side selectors display the Side name/value, not the description/label.
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
  state.seating=null;
  const seatFilter=$("#guestSeatingFilterV174"),tableFilter=$("#guestTableFilterV174");
  if(seatFilter)seatFilter.value="";if(tableFilter)tableFilter.value="";
  persistCurrentEvent_();

  // V1.1.45: the main event is the single source of truth for Side/Group admin scope.
  // Reset any manual Admin scope before rendering, then apply the exact same scope
  // path used by the internal EventType combo again after renderAll().
  const nextTypeId=String(activeEvent()?.eventTypeId||'');
  state.adminLookupEventTypeId=nextTypeId||null;
  state.adminLookupBoundEventId=next;
  state.adminLookupManualOverride=false;

  if(currentPage==="seating"&&!canManageTables_())currentPage="dashboard";
  // Switch event entirely from local bootstrap data. No extra Apps Script request.
  renderAll();

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
function renderEvents(){
  const users=state.adminData.users||[];
  const userNameById=id=>users.find(u=>String(u.id)===String(id))?.name||"לא הוגדר";
  const userPhoneById=id=>displayUserPhone_(users.find(u=>String(u.id)===String(id))?.phone||"");
  const valueOrUnset=v=>String(v??"").trim()?esc(v):"לא הוגדר";
  $("#eventsGrid").innerHTML=state.events.map(e=>{
    const rsvpManagerName=userNameById(e.rsvpManagerId)||e.rsvpContactName||"לא הוגדר";
    const rsvpPhone=userPhoneById(e.rsvpManagerId)||displayUserPhone_(e.rsvpContactPhone||"")||"לא הוגדר";
    const tableManagerName=e.tableManagerId?userNameById(e.tableManagerId):"לא הוגדר";
    return `<article class="event-card ${e.id===state.activeEventId?"active":""}" data-event="${e.id}">
      <h3>${esc(e.name)}</h3>
      <section class="event-rsvp-details event-general-details">
        <h4>פרטי האירוע</h4>
        <p><b>סוג אירוע:</b> ${esc(eventTypeName(e))}</p>
        <p><b>תאריך ושעה:</b> ${esc(formatEventDateTime_(e))}</p>
        <p><b>מקום:</b> ${valueOrUnset(e.venue)}</p>
        <p><b>כתובת לניווט:</b> ${valueOrUnset(e.navigationAddress)}</p>
        <p><b>חתימת ההודעה:</b> ${valueOrUnset(e.messageSignature)}</p>
        <p><b>תמונת הזמנה:</b> ${e.invitationImageFileId?"✓ מצורפת תמונה":"ללא תמונת הזמנה"}</p>
        <p><b>אירוע פעיל:</b> ${isTrue(e.enabled,true)?"כן":"לא"} · <b>מצב:</b> ${esc(lifecycleText(e.lifecycleStatus))}</p>
        <p><b>ניהול שולחנות:</b> ${isTrue(e.seatingEnabled,true)?"כן":"לא"}</p>
        <p><b>מנהל שולחנות:</b> ${esc(tableManagerName)}</p>
      </section>
      <section class="event-rsvp-details">
        <h4>הגדרות אישור הגעה</h4>
        <p><b>מועד סגירת אישור/שינוי הגעה:</b> ${e.rsvpDeadline?esc(formatRsvpDeadline_(e.rsvpDeadline)):"לא הוגדר"}</p>
        <p><b>מנהל אחראי:</b> ${esc(rsvpManagerName)}</p>
        <p><b>טלפון איש קשר:</b> ${esc(rsvpPhone)}</p>
        <p><b>הודעה לאחר תפוגה:</b> ${esc(e.rsvpClosedMessage||"לא הוגדרה")}</p>
      </section>
      <div class="actions"><button class="primary edit-event" data-id="${e.id}">עריכה</button><button class="danger delete-event" data-id="${e.id}">🗑</button></div>
    </article>`;
  }).join("")||'<div class="empty">אין אירועים. צור אירוע ראשון.</div>';
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
  const type=eventTypeById(activeEvent()?.eventTypeId),showSides=!!type&&isTrue(type.usesSides,false),showGroups=!!type&&isTrue(type.usesGroups,false);
  renderGuestSeatingFiltersV174_();
  const visibleGuestsV178=filteredGuests();
  renderGuestStatsV178_(visibleGuestsV178);
  $("#guestsBody").innerHTML=visibleGuestsV178.map(g=>{const status=g.rsvpStatus||g.status||"Pending";return `<tr data-guest="${g.guestId||g.id}">
    <td data-col="name">${esc(g.name)}</td><td data-col="phone">${esc(g.phone)}</td>
    <td data-col="side" ${showSides?"":"hidden"}>${esc(labelFor("sides",g.sideId||g.side,activeEvent()?.eventTypeId))}</td><td data-col="group" ${showGroups?"":"hidden"}>${esc(labelFor("groups",g.groupId||g.group,activeEvent()?.eventTypeId))}</td>
    <td data-col="invitedCount">${g.invitedCount||g.partySize||1}</td><td data-col="confirmedCount">${g.confirmedCount||0}</td><td data-col="rsvpStatus"><span class="badge ${esc(status)}">${esc(statusText(status))}</span></td>
    <td data-col="seating">${guestSeatingCellV174_(g)}</td>
    <td class="send-cell"><input class="guest-send-toggle" data-send-guest="${g.guestId||g.id}" type="checkbox" ${guestSendChecked(g)?"checked":""} aria-label="שליחה ב-WhatsApp"></td>
    <td class="guest-row-actions-v179">${['Admin','EventManager'].includes(state.session?.role)?`<button type="button" class="guest-icon-action-v179" data-wa-send-row="${esc(g.guestId||g.id)}" title="שליחת WhatsApp למוזמן" aria-label="שליחת WhatsApp אל ${esc(g.name)}"><svg class="wa-guest-icon-f14" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="#25D366"/><path d="M8.2 6.9c.3-.3.7-.4 1-.2l1.4 2.1c.2.3.2.7 0 1l-.7.8c.7 1.5 1.9 2.7 3.4 3.4l.8-.7c.3-.2.7-.2 1 0l2.1 1.4c.3.2.4.7.2 1-1 1.7-2.6 2.2-4.5 1.6-3.3-1-5.9-3.6-6.9-6.9-.6-1.9-.1-3.5 1.6-4.5.2-.1.4-.1.6 0z" fill="white"/></svg></button>`:''}<button type="button" class="guest-icon-action-v179" data-rsvp-link="${esc(g.guestId||g.id)}" title="העתק קישור אישור הגעה" aria-label="העתק קישור אישור הגעה עבור ${esc(g.name)}">🔗</button><button type="button" class="guest-icon-action-v179 edit" data-edit-guest="${esc(g.guestId||g.id)}" title="עריכה" aria-label="עריכת ${esc(g.name)}">✎</button><button type="button" class="guest-icon-action-v179 delete" data-delete-guest="${esc(g.guestId||g.id)}" title="מחיקת מוזמן" aria-label="מחיקת ${esc(g.name)}" ${guestCanDeleteV179_(g)?"":"disabled"}>🗑</button></td></tr>`}).join("");
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
  // V1.1.68: derive the commit count from the actual row validation state, not from summary metadata.
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
  const deleteAllBtn=$("#deleteAllEventTablesV1190A10");if(deleteAllBtn){deleteAllBtn.hidden=state.session?.role!=="Admin";deleteAllBtn.disabled=!state.activeEventId||!tablesForActiveEvent().length||tablesForActiveEvent().some(t=>Number(t.occupied)>0);}
  const rows=tablesForActiveEvent();
  
  $("#tableSummary").innerHTML=state.activeEventId?`<span>שולחנות: <b>${rows.length}</b></span><span>מקומות: <b>${rows.reduce((s,t)=>s+t.seats,0)}</b></span><span>תפוסים: <b>${rows.reduce((s,t)=>s+t.occupied,0)}</b></span><span>פנויים: <b>${rows.reduce((s,t)=>s+t.free,0)}</b></span>`:`<span>יש לבחור אירוע פעיל</span>`;
  renderSeatingWorkspaceV170_();
  $("#tablesBody").innerHTML=rows.map(t=>`<tr><td>${esc(t.tableNumber)}</td><td>${t.seats}</td><td>${t.occupied}</td><td>${t.free}</td><td>${tableReadOnly?"צפייה בלבד":`<button class="edit-table" data-id="${t.id}">עריכה</button> <button class="danger delete-table" data-id="${t.id}">🗑</button>`}</td></tr>`).join("") || `<tr><td colspan="5" class="empty-cell">${state.activeEventId?"אין שולחנות באירוע זה":"יש לבחור אירוע"}</td></tr>`;
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
  const b=$(wa?'#waLogClearFiltersZ55B':'#activityClearFiltersZ57'),active=logFiltersActiveZ57A_(ids);if(!b)return;
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
  // V1.1.41: read the event that is actually selected in the visible UI first.
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
  // V1.1.41: strict lookup only for the event type captured above; no active/global fallback.
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
  modal(`<h2>${(g.guestId||g.id)?'עריכת':'הוספת'} מוזמן</h2><p class="guest-event-context"><b>אירוע:</b> ${esc(ev?.name||'—')} · <b>סוג:</b> ${esc(type?.name||'—')} <small>(${showSides?scopedSides.length:0} צדדים · ${showGroups?scopedGroups.length:0} קבוצות)</small></p><form id="guestForm" class="form-grid" onsubmit="return false;">
  <input type="hidden" name="eventId" value="${esc(eventId)}">
  <label>שם <span class="required-star">*</span><input name="name" required value="${esc(g.name||'')}"></label><label>טלפון <span class="required-star">*</span><input name="phone" required inputmode="tel" placeholder="0501234567" value="${esc(g.phone||'')}"></label><label>פנייה אישית <span class="required-star">*</span><input name="invitationGreeting" required maxlength="120" placeholder="לדוגמה: משפחת כהן היקרה" value="${esc(g.invitationGreeting||'')}"></label>
  ${sideField}${groupField}
  <label>מספר מוזמנים <span class="required-star">*</span><input name="invitedCount" type="number" min="1" step="1" required value="${invited}"></label>
  <label>מספר שאישרו<input name="confirmedCount" type="number" min="0" step="1" value="${confirmed}"></label>
  <label>סטטוס RSVP<select name="rsvpStatus">${optionHtml('statuses',status)}</select></label>
  <label class="check-label"><input name="sendWhatsApp" type="checkbox" ${send?'checked':''}> שליחה ב-WhatsApp</label>
  <label style="grid-column:1/-1">הערות<textarea name="notes">${esc(g.notes||'')}</textarea></label>
  <input type="hidden" name="eventId" value="${esc(eventId)}"><input type="hidden" name="id" value="${esc(g.guestId||g.id||'')}"><input type="hidden" name="guestId" value="${esc(g.guestId||g.id||'')}"><div id="guestFormStatusV182" class="guest-form-status-v182" role="alert" aria-live="assertive" hidden></div><div class="actions"><button type="button" id="saveGuestBtn" class="primary">שמירה</button></div></form>`);
  const statusEl=$("#guestForm [name=rsvpStatus]"), invitedEl=$("#guestForm [name=invitedCount]"), confirmedEl=$("#guestForm [name=confirmedCount]");
  if(statusEl)statusEl.onchange=()=>{if(statusEl.value==='Declined'||statusEl.value==='Pending')confirmedEl.value=0;else if(statusEl.value==='Confirmed'&&(+confirmedEl.value||0)===0)confirmedEl.value=+invitedEl.value||1};
  if(confirmedEl)confirmedEl.oninput=()=>{statusEl.value=(+confirmedEl.value||0)>0?'Confirmed':'Pending'};
  if(invitedEl)invitedEl.onchange=()=>{if(+confirmedEl.value>(+invitedEl.value||1))confirmedEl.value=+invitedEl.value||1};
  $("#saveGuestBtn").onclick=saveGuestForm;
}

function guestDetails(g){
  const type=eventTypeById(activeEvent()?.eventTypeId),parts=[],status=g.rsvpStatus||g.status||"Pending";
  if(type&&isTrue(type.usesSides,false))parts.push(`<b>צד:</b> ${esc(labelFor("sides",g.sideId||g.side,activeEvent()?.eventTypeId))}`);
  if(type&&isTrue(type.usesGroups,false))parts.push(`<b>קבוצה:</b> ${esc(labelFor("groups",g.groupId||g.group,activeEvent()?.eventTypeId))}`);
  modal(`<h2>${esc(g.name)}</h2><p><b>Guest ID:</b> ${esc(g.guestId||g.id)}</p><p><b>טלפון:</b> ${esc(g.phone)}</p>${parts.length?`<p>${parts.join(" | ")}</p>`:""}
  <p><b>מספר מוזמנים:</b> ${g.invitedCount||g.partySize||1} · <b>אישרו:</b> ${g.confirmedCount||0}</p><p><b>סטטוס:</b> ${esc(statusText(status))}</p>
  <p><b>פנייה אישית:</b> ${esc(g.invitationGreeting||"—")}</p><p><b>שליחה:</b> ${guestSendChecked(g)?"מסומן — יקבל הודעת WhatsApp":"לא מסומן"}</p><p><b>הערות:</b> ${esc(g.notes||"—")}</p>
  <div class="actions"><button class="primary" id="detailEdit">עריכה</button><button class="danger" id="detailDelete">🗑</button></div>`);
  $("#detailEdit").onclick=()=>guestForm(g);$("#detailDelete").onclick=async()=>{await deleteGuestV179_(g)}
}

/* ---------- Admin / Settings ---------- */
const adminTitles={eventTypes:"סוגי אירועים",sides:"צד",groups:"קבוצה",statuses:"סטטוס",users:"משתמשי מערכת",roles:"תפקידים",permissions:"ניהול הרשאות",whatsapp:"חיבור ל-WhatsApp",systemValues:"ערכי מערכת",whatsappCosts:"עלויות WhatsApp",versions:"גרסאות"};
function renderAdmin(){
  const c=$("#adminContent");if(!c||state.session?.role!=="Admin")return;
  // V1.1.44: never read the main event from the DOM here. renderAll() renders
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

  // V1.1.44: unless the user explicitly changed the local Admin EventType combo,
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

// V1.1.45: one shared path for changing the EventType scope in Side/Group admin.
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
async function waTemplateImageSrcF14G_(template){
  if(!template?.id||!template?.hasImage)return '';
  if(!(state.waSendTemplateImagesF14G instanceof Map))state.waSendTemplateImagesF14G=new Map();
  const key=String(template.id),cached=state.waSendTemplateImagesF14G.get(key);if(cached)return cached;
  const pending=API.request('getMessageTemplateImageA19P2',{id:template.id}).then(r=>{if(!r?.base64||!r?.mime){state.waSendTemplateImagesF14G.delete(key);return '';}return `data:${r.mime};base64,${r.base64}`;}).catch(e=>{state.waSendTemplateImagesF14G.delete(key);throw e;});
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
  try{const src=await waTemplateImageSrcF14G_(template),wrap=container.querySelector('.wa-preview-image-wrap-f14g');console.info('[WA PERF] preview image',Math.round(performance.now()-previewStartedD32),'ms');if(!wrap)return;if(src)wrap.innerHTML=`<img src="${src}" alt="תמונת התבנית">`;else wrap.remove();}catch(e){const wrap=container.querySelector('.wa-preview-image-wrap-f14g');if(wrap)wrap.remove();}
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
  try{const rawTemplates=await waGetTestTemplatesD33(environment);console.info('[WA PERF] test template UI total',Math.round(performance.now()-templateLoadStartedD32),'ms');const templates=waEligibleTemplatesD5D26_(rawTemplates);if(!templates.length){select.innerHTML='<option value="">אין תבניות מאושרות</option>';return [];}select.innerHTML=waTemplateOptionsF14C_(templates);select.disabled=false;if(sendButton)sendButton.disabled=false;return templates;}catch(e){select.innerHTML='<option value="">שגיאה בטעינת תבניות</option>';if(status){status.textContent=e?.message||String(e);status.className='wa-confirm-status-v1190a16 error';}return [];}
}
async function waFillTemplateSelectF14D_(select,status,sendButton){
  if(!select)return [];
  select.disabled=true;select.innerHTML='<option value="">טוען תבניות…</option>';if(sendButton)sendButton.disabled=true;
  try{
    const templates=await waLoadSendTemplatesF14C_();
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
function waResultHtmlF14V_({ok=0,fail=0,left=0,elapsedMs=0,test=false,perf=null,uncertain=false}){
  const total=ok+fail,serverMs=Number(perf?.totalMs||0),roundTripMs=Math.max(0,Number(elapsedMs||0)-serverMs),shownTotal=uncertain?'לא ידוע':total,shownOk=uncertain?'לא ידוע':ok,shownFail=uncertain?'לא ידוע':fail;
  return `<div class="wa-result-f14v ${(fail||uncertain)?'has-error':'success'}"><strong>${uncertain?'השליחה נעצרה — מצב קבוצת השליחה לא ידוע':fail?'השליחה הסתיימה עם שגיאות':'השליחה הסתיימה בהצלחה'}</strong><dl><dt>טופלו</dt><dd>${shownTotal}</dd><dt>התקבלו לשליחה</dt><dd>${shownOk}</dd><dt>נכשלו</dt><dd>${shownFail}</dd>${left?`<dt>לא נשלחו</dt><dd>${left}</dd>`:''}<dt>זמן כולל לקבוצת השליחה</dt><dd>${waFormatElapsedF14V_(elapsedMs)}</dd>${!perf?'<dt>פירוט שרת</dt><dd>לא התקבל נתון</dd>':''}${perf?`<dt>Backend כולל</dt><dd>${waFormatElapsedF14V_(serverMs)}</dd><dt>תקשורת Frontend ↔ Backend</dt><dd>${waFormatElapsedF14V_(roundTripMs)}</dd><dt>טעינת אירוע</dt><dd>${waFormatElapsedF14V_(perf.eventMs||0)}</dd><dt>בדיקת מבנה Guests</dt><dd>${waFormatElapsedF14V_(perf.ensureMs||0)}</dd><dt>טעינת מוזמנים</dt><dd>${waFormatElapsedF14V_(perf.guestsMs||0)}</dd><dt>הגדרות + תבנית</dt><dd>${waFormatElapsedF14V_(perf.configTemplateMs||0)}</dd><dt>RSVP</dt><dd>${waFormatElapsedF14V_(perf.rsvpMs||0)}</dd><dt>Media</dt><dd>${waFormatElapsedF14V_(perf.mediaMs||0)}</dd><dt>בניית Payload</dt><dd>${waFormatElapsedF14V_(perf.buildMs||0)}</dd><dt>Meta API</dt><dd>${waFormatElapsedF14V_(perf.metaMs||0)}</dd><dt>עיבוד תשובות</dt><dd>${waFormatElapsedF14V_(perf.processMs||0)}</dd><dt>כתיבת עלויות</dt><dd>${waFormatElapsedF14V_(perf.costWriteMs||0)}</dd><dt>כתיבת Activity</dt><dd>${waFormatElapsedF14V_(perf.activityWriteMs||0)}</dd><dt>Diagnostics</dt><dd>${waFormatElapsedF14V_(perf.diagnosticMs||0)}</dd>`:''}</dl><small>${test?'כל ההודעות נשלחו למספר הבדיקה. ':'ההודעות נשלחו למספרי המוזמנים. '}אישור קבלת הבקשה אינו אישור קריאה ב-WhatsApp.</small></div>`;
}

const WA_BATCH_PAUSE_F14Z7_MS=5000;
async function waPauseBetweenBatchesF14Z7_(box,done,total,nextBatch,totalBatches,started){
  if(!box||done>=total)return;
  const span=box.querySelector('span');
  for(let left=Math.ceil(WA_BATCH_PAUSE_F14Z7_MS/1000);left>0;left--){
    if(span)span.textContent=`${done}/${total} הושלמו · ממתין ${left} שניות לפני קבוצת שליחה ${nextBatch}/${totalBatches} · ${waFormatElapsedF14V_(performance.now()-started)}`;
    await new Promise(resolve=>setTimeout(resolve,1000));
  }
}

async function openGuestWhatsAppPreparationA19P2F6_(){
  if(!['Admin','EventManager'].includes(state.session?.role)||!state.activeEventId)return;
  // F14Z1: Test Send must use the same explicit "שליחה=כן" selection as the working filtered flow.
  // The numeric limit only caps that candidate list; it must never pull arbitrary unmarked guests.
  const rows=filteredGuests().filter(g=>guestSendChecked(g));
  const managerTest=state.session?.role==='EventManager';
  modal(`<section role="dialog" aria-labelledby="waBulkTitleF14C"><h2 id="waBulkTitleF14C">שליחת WhatsApp לבדיקה</h2>
    ${managerTest?'':`<p>הבדיקה משתמשת ברשומות שמוצגות לפי הסינון הפעיל. כל ההודעות יישלחו למספר הבדיקה בלבד.</p><p><b>רשומות מסומנות לשליחה לפי הסינון הפעיל:</b> ${rows.length}</p>`}
    <div class="form-grid"><label>סביבה <span class="required-star">*</span><select id="waF14CTestEnvironment"><option value="TEST" selected>TEST</option><option value="PRODUCTION">PRODUCTION</option></select></label><label>תבנית WhatsApp <span class="required-star">*</span><select id="waF14CTestTemplate" disabled><option value="">טוען תבניות…</option></select></label>
    <label>מספר טלפון לבדיקה <span class="required-star">*</span><input id="waF7Phone" class="wa-test-phone-f14e" type="tel" inputmode="tel" autocomplete="tel" placeholder="05XXXXXXXX" dir="ltr"></label>
    ${managerTest?'':`<label>מספר הודעות לבדיקה <span class="required-star">*</span><input id="waTestLimitF14Z1" type="number" min="1" max="${Math.max(1,Math.min(5,rows.length))}" value="${Math.min(5,rows.length||1)}"></label>`}
    ${managerTest?`<input id="waTestGreetingF14Z1" type="hidden" value="משפחה יקרה">`:`<label>פנייה אישית כאשר השדה ריק<input id="waTestGreetingF14Z1" type="text" value="משפחה יקרה"></label></div><p class="muted">הפנייה החלופית משמשת רק לבדיקה ואינה נשמרת ברשומת המוזמן.</p>`}
    ${managerTest?`</div><span id="waTestCountF14T" hidden></span><span id="waTestCostF14T" hidden></span><div class="wa-send-preview-f14g" id="waTestPreviewF14G"><p class="muted">התצוגה המקדימה תוצג לאחר טעינת התבנית.</p></div>`:`<dl class="wa-confirm-details-v1190a16"><dt>כמות הודעות</dt><dd id="waTestCountF14T">0</dd><dt>עלות משוערת</dt><dd id="waTestCostF14T">טוען…</dd></dl><div class="wa-send-preview-f14g" id="waTestPreviewF14G"><p class="muted">Preview ההזמנה יוצג לאחר טעינת התבנית.</p></div>`}
    <p id="waF7Summary" class="wa-confirm-status-v1190a16" role="status" data-template-message="1"></p>
    <div class="wa-progress-f14c" id="waTestProgressF14C" hidden><progress max="100" value="0"></progress><span></span></div>
    <div class="actions"><button type="button" class="secondary" id="waF7Close">סגור</button><button type="button" class="primary" id="waF8Send">שלח WhatsApp לבדיקה</button></div></section>`);
  const phone=$('#waF7Phone'),summary=$('#waF7Summary'),send=$('#waF8Send'),envSelect=$('#waF14CTestEnvironment'),tpl=$('#waF14CTestTemplate'),limit=$('#waTestLimitF14Z1'),fallback=$('#waTestGreetingF14Z1'),countEl=$('#waTestCountF14T'),costEl=$('#waTestCostF14T');
  let selected=[];
  const selectedRows=()=>{const n=managerTest?Math.min(1,rows.length):Math.max(0,Math.min(5,rows.length,Number(limit?.value)||0));return rows.slice(0,n);};
  const updateCost=n=>{const chosen=templatesF14G.find(x=>String(x.id)===String(tpl.value));return getWaCostEstimateCachedF14_(n,chosen?.category).then(e=>{if(costEl)costEl.textContent=waCostTextF14Z34_(e,chosen?.category);});};
  const refresh=()=>{selected=selectedRows();const to=waPhonePreviewV1190A16_(phone.value),approved=waSelectedTemplateApprovedF14E_(tpl),fb=String(fallback.value||'').trim(),missing=selected.filter(g=>!String(g.invitationGreeting||'').trim()).length;if(countEl)countEl.textContent=selected.length;updateCost(selected.length);summary.textContent=!rows.length?'אין רשומות בסינון הנוכחי.':!selected.length?'יש לבחור לפחות הודעה אחת.':missing&&!fb?'יש רשומות ללא פנייה אישית. הזן פנייה חלופית לבדיקה.':!to?'יש להזין מספר בדיקה תקין.':!approved?'תבנית V3 מוכנה לבדיקה, אך השליחה חסומה עד לאישור Meta (APPROVED).':`${selected.length} הודעות יישלחו למספר +${to} בלבד${missing?` · ב-${missing} רשומות תשמש הפנייה החלופית.`:''}`;summary.className='wa-confirm-status-v1190a16'+((!to||!approved||!selected.length||(missing&&!fb))?' error':'');send.disabled=!to||!selected.length||(missing&&!fb)||tpl.disabled||!tpl.value||!approved;};
  let templatesF14G=[];let templateLoadSerialD44=0;const renderPreview=()=>waRenderPreviewF14G_($('#waTestPreviewF14G'),waTemplateByIdF14G_(templatesF14G,tpl.value),selectedRows()[0]||rows[0]||null);const loadEnvironment=async()=>{const serial=++templateLoadSerialD44;const env=String(envSelect?.value||'TEST').toUpperCase();send.disabled=true;tpl.disabled=true;summary.textContent='טוען תבניות WhatsApp…';summary.className='wa-confirm-status-v1190a16';if(costEl&&env==='TEST')costEl.textContent='0 — סביבת TEST';try{const loaded=await waFillTestTemplateSelectF14Z32_(tpl,summary,send,env);if(serial!==templateLoadSerialD44)return;templatesF14G=loaded||[];refresh();renderPreview();}catch(error){if(serial!==templateLoadSerialD44)return;templatesF14G=[];tpl.disabled=true;send.disabled=true;summary.textContent='טעינת התבניות נכשלה: '+(error?.message||String(error));summary.className='wa-confirm-status-v1190a16 error';}};phone.oninput=refresh;if(limit)limit.oninput=()=>{refresh();renderPreview();};fallback.oninput=refresh;tpl.onchange=()=>{refresh();renderPreview();};if(envSelect)envSelect.onchange=loadEnvironment;refresh();loadEnvironment();$('#waF7Close').onclick=closeModal;
  send.onclick=async()=>{const environment=String(envSelect?.value||'TEST').toUpperCase(),to=waPhonePreviewV1190A16_(phone.value),chosen=selectedRows(),templateId=tpl.value,fb=String(fallback.value||'').trim(),missing=chosen.filter(g=>!String(g.invitationGreeting||'').trim()).length;if(!to||!chosen.length||(missing&&!fb)||!templateId||!waSelectedTemplateApprovedF14E_(tpl))return;
    const selectedTemplate=templatesF14G.find(x=>String(x.id)===String(templateId));
    if(selectedTemplate&&(environment==='TEST'||String(selectedTemplate.purpose||'')!=='invitation')){
      const ok=await waConfirmSendF14V_({title:'אישור שליחת בדיקה',message:`לשלוח ${managerTest?1:chosen.length} הודעות בתבנית "${selectedTemplate.name}" למספר הבדיקה בלבד?`,details:`<dl><dt>סביבה</dt><dd>${esc(environment)}</dd><dt>תבנית</dt><dd>${esc(selectedTemplate.name)}</dd><dt>מספר בדיקה</dt><dd dir="ltr">+${esc(to)}</dd></dl>`});
      if(!ok)return;
      waSetSendingF14V_(send,true,'שולח בדיקה...');
      const closeButton=$('#waF7Close');if(closeButton)closeButton.disabled=true;
      summary.textContent='שולח הודעת בדיקה…';summary.className='wa-confirm-status-v1190a16';
      const requestStarted=performance.now();
      // D5D44: TEST and non-invitation templates must honor the Admin selection.
      // Keep EventManager restricted to one test message.
      const testRows=managerTest?chosen.slice(0,1):chosen.slice(0,5);
      let acceptedCount=0,failedCount=0,processedCount=0,lastResult=null,firstError='',totalServerMs=0,logWarningsD49=[];
      const progressBoxD48=$('#waTestProgressF14C');
      const progressBarD48=progressBoxD48?.querySelector('progress');
      const progressTextD48=progressBoxD48?.querySelector('span');
      if(progressBoxD48)progressBoxD48.hidden=false;
      const updateTestProgressD48=()=>{
        if(progressBarD48)progressBarD48.value=testRows.length?Math.round(processedCount*100/testRows.length):0;
        if(progressTextD48)progressTextD48.textContent=`טופלו ${processedCount}/${testRows.length} · התקבלו ב-Meta ${acceptedCount} · נכשלו ${failedCount}`;
        summary.textContent=`שולח בדיקה · טופלו ${processedCount}/${testRows.length} · התקבלו ב-Meta ${acceptedCount} · נכשלו ${failedCount}`;
      };
      updateTestProgressD48();
      try{
        // D5D49: one request per guest restores real completion-based progress.
        // Never retry automatically after an ambiguous network failure.
        for(const guestRow of testRows){
          try{
            const result=await API.request('sendAnyTemplateToTestNumber',{
              eventId:state.activeEventId,guestId:guestRow.guestId||guestRow.id,
              testPhone:phone.value,templateId,environment
            });
            lastResult=result;
            if(result?.accepted&&result?.whatsAppLogSaved===false)logWarningsD49.push('הודעה '+(processedCount+1)+': '+String(result.whatsAppLogError||'רישום יומן נכשל'));
            if(result?.accepted)acceptedCount++;else failedCount++;
            totalServerMs+=Number(result?.performanceD38?.totalMs||0);
            processedCount++;
            updateTestProgressD48();
            if(!result?.accepted){firstError='Meta לא אישרה את שליחת ההודעה';break;}
          }catch(sendError){
            failedCount++;
            firstError=sendError?.message||String(sendError);
            processedCount++;
            updateTestProgressD48();
            break;
          }
        }
        const r=lastResult;
        const logWarningHtmlD49=logWarningsD49.length?`<p class="error" role="alert"><strong>אזהרה: ${logWarningsD49.length} הודעות התקבלו ב-Meta אך הרישום ביומן WhatsApp נכשל.</strong> אין לשלוח אותן שוב. ${esc(logWarningsD49.join(' | '))}</p>`:'';
        const roundTripMs=performance.now()-requestStarted;
        const serverPerf=r?.performanceD38||r?.performanceD34||r?.performance||null;
        const d38Labels={dataLookupMs:'נתוני אירוע ומוזמן',metaTemplateLookupMs:'קריאת תבנית Meta',payloadAndMediaMs:'בניית הודעה והכנת תמונה',metaApiMs:'קריאת Meta לשליחה',diagnosticsMs:'רישום אבחון',loggingMs:'כתיבה ליומן ועלויות',mediaPreparationMs:'  מתוכן: הכנת תמונה',otherPayloadMs:'  מתוכן: בניית רכיבי הודעה',tableLookupMs:'  מתוכן: בדיקת שיוך שולחנות',componentsAndLinksMs:'  מתוכן: רכיבים וקישורים',whatsAppLogMs:'  מתוכן: כתיבה ליומן WhatsApp',costRecordingMs:'  מתוכן: רישום עלויות',totalMs:'זמן שרת כולל'};
        const serverTiming=serverPerf&&typeof serverPerf==='object'?Object.entries(serverPerf).filter(([k,v])=>/Ms$/.test(k)&&Number.isFinite(Number(v))).map(([k,v])=>`<dt>${esc(d38Labels[k]||k)}</dt><dd>${waFormatElapsedF14V_(Number(v))}</dd>`).join(''):'';
        const timingHtml=`<div class="wa-timing-d37"><h3>פירוט זמנים — TEST</h3><dl><dt>קריאת API כולל תקשורת</dt><dd>${waFormatElapsedF14V_(roundTripMs)}</dd><dt>פירוט מהשרת</dt><dd>${serverTiming?'התקבל':'לא התקבל נתון'}</dd>${serverTiming}</dl><p class="muted">זמן קריאת API כולל זמן שרת, תקשורת והמתנה; אין לחבר אותו לזמני השרת.</p></div>`;
        console.info('[WA PERF] sendAnyTemplateToTestNumber',{roundTripMs:Math.round(roundTripMs),serverPerfAvailable:!!serverTiming});
        if(state.session?.role==='EventManager'){
          summary.innerHTML=`<p><strong>טופלו ${processedCount}/${testRows.length} · התקבלו ב-Meta ${acceptedCount} · נכשלו ${failedCount}.</strong></p>${firstError?`<p>${esc(firstError)}</p>`:''}${logWarningHtmlD49}<p>נמען: <span dir="ltr">+${esc(r?.recipient||to)}</span> · זמן: ${waFormatElapsedF14V_(roundTripMs)}</p>${timingHtml}<p class="muted">הסטטוס מאשר קבלה ב-Meta, לא מסירה בפועל למכשיר.</p>`;
        }else{
          summary.innerHTML=`<p><strong>טופלו ${processedCount}/${testRows.length} · התקבלו ב-Meta ${acceptedCount} · נכשלו ${failedCount}</strong></p>${firstError?`<p>השליחה נעצרה: ${esc(firstError)}. יש לבדוק את יומן WhatsApp לפני ניסיון חוזר.</p>`:''}${logWarningHtmlD49}<p>זמן שרת מצטבר: ${waFormatElapsedF14V_(totalServerMs)}</p>`+timingHtml+waResultHtmlF14V_({ok:acceptedCount,fail:failedCount,left:testRows.length-processedCount,elapsedMs:roundTripMs,test:true,uncertain:!!firstError});
        }
        summary.className='wa-confirm-status-v1190a16 '+((failedCount||logWarningsD49.length)?'error':'success');waSetSendingF14V_(send,false);send.disabled=true;if(closeButton)closeButton.disabled=false;
      }catch(e){
        const elapsed=performance.now()-requestStarted;
        summary.innerHTML=`<p><strong>שליחת הבדיקה נכשלה:</strong> ${esc(e?.message||String(e))}</p><p>זמן עד לכישלון: ${waFormatElapsedF14V_(elapsed)}</p>`;
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
    const selectedTplCost=templatesF14G.find(x=>String(x.id)===String(templateId));const estimate=await getWaCostEstimateCachedF14_(chosen.length,selectedTplCost?.category).catch(()=>null);const cost=waCostTextF14Z34_(estimate,selectedTplCost?.category);
    const confirmed=await waConfirmSendF14V_({title:'אישור שליחת WhatsApp לבדיקה',message:`לשלוח ${chosen.length} הודעות למספר +${to} בלבד?`,details:`<b>כמות:</b> ${chosen.length} · <b>עלות משוערת:</b> ${esc(cost)}${missing?` · <b>פנייה חלופית:</b> ${esc(fb)}`:''}`});if(!confirmed)return;
    const started=performance.now();waSetSendingF14V_(send,true);const box=$('#waTestProgressF14C');box.hidden=false;box.querySelector('span').textContent='מכין שליחה · בודק Media ושער דולר...';let prepared;const prepareStartedD34=performance.now();try{prepared=await API.request('prepareWhatsAppSendF14Z9',{templateId,eventId:state.activeEventId});const prepareMsD34=performance.now()-prepareStartedD34;console.info('[WA PERF] prepareWhatsAppSend',Math.round(prepareMsD34),'ms');box.querySelector('span').textContent=`הכנה הושלמה · Media: ${prepared.mediaSource} · שער דולר: ${prepared.costSource} · Messages: ${chosen.length}`;}catch(e){summary.innerHTML=`<p><strong>הכנת השליחה נכשלה:</strong> ${esc(e?.message||'שגיאה לא ידועה')}</p>`;summary.className='wa-confirm-status-v1190a16 error';waSetSendingF14V_(send,false);return;}if(phone)phone.disabled=true;if(tpl)tpl.disabled=true;if(limit)limit.disabled=true;if(fallback)fallback.disabled=true;const closeBtn=$('#waF7Close');if(closeBtn)closeBtn.disabled=true;let ok=0,fail=0,receivedServerPerfD35=false,batchRoundTripsD35=[],perf={eventMs:0,ensureMs:0,guestsMs:0,configTemplateMs:0,mediaMs:0,rsvpMs:0,buildMs:0,metaMs:0,processMs:0,costWriteMs:0,activityWriteMs:0,diagnosticMs:0,writeMs:0,totalMs:0};
    const chunkSize=16,totalBatches=Math.ceil(chosen.length/chunkSize);let done=0,batchError='',batchMeta=[];
    for(let i=0,batchNo=1;i<chosen.length;i+=chunkSize,batchNo++){const chunk=chosen.slice(i,i+chunkSize);const elapsed=performance.now()-started;box.querySelector('span').textContent=`קבוצת שליחה ${batchNo}/${totalBatches} · ${done}/${chosen.length} · הצליחו ${ok} · נכשלו ${fail} · ${waFormatElapsedF14V_(elapsed)}`;try{const batchStartedD35=performance.now();const r=await API.request('sendInvitationBatchF14U',{eventId:state.activeEventId,items:chunk.map(g=>({guestId:g.guestId||g.id,testGreeting:String(g.invitationGreeting||'').trim()||fb})),testPhone:to,templateId,mediaId:prepared.mediaId,costEstimate:prepared.costEstimate});if(!r||typeof r.accepted==='undefined'||typeof r.failed==='undefined')throw new Error('קבוצת השליחה לא החזירה תשובה תקינה');ok+=Number(r.accepted||0);fail+=Number(r.failed||0);batchRoundTripsD35.push(performance.now()-batchStartedD35);if(r.performance){receivedServerPerfD35=true;Object.keys(perf).forEach(k=>perf[k]+=Number(r.performance[k]||0));}if(r.metaSummary)batchMeta.push({batchNo,...r.metaSummary});done+=chunk.length;box.querySelector('progress').value=Math.round(done*100/chosen.length);box.querySelector('span').textContent=`קבוצת שליחה ${batchNo}/${totalBatches} הסתיימה · ${done}/${chosen.length} · הצליחו ${ok} · נכשלו ${fail} · ${waFormatElapsedF14V_(performance.now()-started)}`;if(done<chosen.length)await waPauseBetweenBatchesF14Z7_(box,done,chosen.length,batchNo+1,totalBatches,started);}catch(e){batchError=e?.message||'קבוצת השליחה לא החזירה תשובה תקינה';box.querySelector('span').textContent=`השליחה נעצרה בקבוצת שליחה ${batchNo}/${totalBatches} · ${done}/${chosen.length} טופלו`;break;}}
    const elapsedMs=performance.now()-started,left=chosen.length-done;if(!batchError)box.querySelector('progress').value=100;box.querySelector('span').textContent=batchError?`נעצר לאחר ${done}/${chosen.length} · ${waFormatElapsedF14V_(elapsedMs)}`:`הושלם ${done}/${chosen.length} · הצליחו ${ok} · נכשלו ${fail} · ${waFormatElapsedF14V_(elapsedMs)}`;summary.innerHTML=managerTest?(batchError?`<p><strong>שליחת הבדיקה נכשלה.</strong></p><p>${esc(batchError)}</p>`:`<p><strong>הודעת הבדיקה התקבלה ב-Meta לשליחה.</strong></p><p>נמען: <span dir="ltr">+${esc((batchMeta[batchMeta.length-1]?.recipient)||to)}</span> · זמן: ${waFormatElapsedF14V_(elapsedMs)}</p><p class="muted">אישור Meta אינו אישור שההודעה נמסרה למכשיר.</p>`):(`<p><strong>זמן הכנה:</strong> ${waFormatElapsedF14V_(prepareMsD34)}</p><p><strong>מסלול רשת:</strong> Media: ${esc(prepared.mediaSource)} · שער דולר: ${esc(prepared.costSource)} · Messages: ${chosen.length}</p>`+waBatchMetaHtmlF14Z11_(batchMeta)+(batchError?`<p><strong>השליחה נעצרה:</strong> ${esc(batchError)}. לא ניתן לקבוע אם קבוצת השליחה שלא החזירה תשובה נמסרה בפועל; יש לבדוק ב-WhatsApp לפני ניסיון נוסף.</p>`:'')+`<div class="wa-timing-d35"><h3>מדידת זמנים — TEST</h3><dl><dt>הכנת שליחה (כולל תקשורת)</dt><dd>${waFormatElapsedF14V_(prepareMsD34)}</dd><dt>שליחת קבוצות (כולל תקשורת)</dt><dd>${waFormatElapsedF14V_(batchRoundTripsD35.reduce((a,b)=>a+b,0))}</dd><dt>פירוט זמנים מהשרת</dt><dd>${receivedServerPerfD35?'התקבל':'לא התקבל נתון'}</dd></dl></div>`+waResultHtmlF14V_({ok,fail,left,elapsedMs,test:true,perf:receivedServerPerfD35?perf:null,uncertain:!!batchError}));summary.className='wa-confirm-status-v1190a16 '+((fail||batchError)?'error':'success');waSetSendingF14V_(send,false);send.disabled=true;$('#waF7Close').disabled=false;
  };
}


function waBatchMetaHtmlF14Z11_(rows){
  if(!Array.isArray(rows)||!rows.length)return '';
  return `<div class="wa-meta-batches-f14z11"><strong>אבחון Meta לפי קבוצת שליחה:</strong>${rows.map(x=>{const statuses=Object.entries(x.messageStatusCounts||{}).map(([k,v])=>`${esc(k)}: ${v}`).join(' · ')||'ללא סטטוס';return `<p>קבוצה ${x.batchNo}: תגובות ${x.responseCount} · HTTP 2xx ${x.http2xxCount} · wamid ${x.messageIdCount} · ייחודיים ${x.uniqueMessageIdCount} · ${statuses}</p>`;}).join('')}</div>`;
}

function waEligibleGuestsForTemplateF14Z35_(rows,template,seating,event){
  const purpose=String(template?.purpose||'invitation'),assignments=seating?.assignments||[];
  const assigned=new Set(assignments.map(a=>String(a.guestId||'')));
  const hasAssignment=g=>assigned.has(String(g.guestId||g.id))||!!String(g.tableId||g.tableNumber||'').trim();
  const isConfirmed=g=>String(g.rsvpStatus||g.status||'').toLowerCase()==='confirmed'||Number(g.confirmedCount||0)>0;
  const isPending=g=>['pending','ממתין','ממתינים לתשובה'].includes(String(g.rsvpStatus||g.status||'').toLowerCase());
  const paymentEnabled=isTrue(event?.paymentEnabled??event?.PaymentEnabled,false);
  return (rows||[]).filter(g=>{
    if(!guestSendChecked(g)||!waPhonePreviewV1190A16_(g.phone))return false;
    if(purpose==='rsvp_update')return isPending(g);
    if(purpose==='table_update')return isConfirmed(g)&&hasAssignment(g);
    if(purpose==='table_payment_update')return paymentEnabled&&isConfirmed(g)&&hasAssignment(g);
    if(purpose==='thank_you')return Number(g.actualAttendees||g.actualAttendance||0)>0;
    return true;
  });
}
async function openGuestWhatsAppRealF14C_(preferredTemplateId='',preferredGuestId=''){
  if(!['Admin','EventManager'].includes(state.session?.role)||!state.activeEventId)return;
  const filter=$('#guestSendFilterA19P2F6');filter.value='yes';renderGuests();
  const filtered=filteredGuests(),rows=preferredGuestId?filtered.filter(g=>String(g.guestId||g.id)===String(preferredGuestId)):filtered;
  let eligible=rows.filter(g=>waPhonePreviewV1190A16_(g.phone)),invalid=rows.filter(g=>!waPhonePreviewV1190A16_(g.phone)),templatesF14Z35=[];
  modal(`<section role="dialog"><h2>שליחת WhatsApp</h2><p>${preferredGuestId?'שליחה למוזמן שנבחר.':'סינון ״שליחה״ הוגדר ל״כן״. יתר הסינונים נשמרו.'}</p>
  <div class="form-grid"><label>תבנית WhatsApp <span class="required-star">*</span><select id="waRealTemplateF14C" disabled><option value="">טוען תבניות…</option></select></label></div>
  <p id="waRealEligibleLineF14Z35"><b>מיועדים לשליחה:</b> ${eligible.length}${invalid.length?` · <b>חסומים בגלל נתון חסר/לא תקין:</b> ${invalid.length}`:''}</p>
  <div class="wa-send-preview-f14g" id="waRealPreviewF14G"><p class="muted">Preview ההזמנה יוצג לאחר טעינת התבנית.</p></div>
  <dl class="wa-confirm-details-v1190a16"><dt>כמות הודעות</dt><dd id="waRealCountF14Z35">${eligible.length}</dd><dt>עלות משוערת</dt><dd id="waRealCostF14C">טוען…</dd></dl>
  <p id="waRealStatusF14C" class="wa-confirm-status-v1190a16"></p><div class="wa-progress-f14c" id="waRealProgressF14C" hidden><progress max="100" value="0"></progress><span></span></div>
  <div class="actions"><button type="button" class="secondary" id="waRealCloseF14C">סגור</button><button type="button" class="danger" id="waRealStopF14C" hidden>עצור שליחה</button><button type="button" class="primary" id="waRealSendF14C" ${!eligible.length||invalid.length?'disabled':''}>שלח WhatsApp</button></div></section>`);
  {const x=$('#waRealCostF14C');if(x)x.textContent='ממתין לבחירת תבנית…';}
  waFillTemplateSelectF14D_($('#waRealTemplateF14C'),$('#waRealStatusF14C'),$('#waRealSendF14C')).then(async t=>{
    templatesF14Z35=t;const sel=$('#waRealTemplateF14C');if(preferredTemplateId&&[...sel.options].some(o=>String(o.value)===String(preferredTemplateId)))sel.value=String(preferredTemplateId);
    const refresh=async()=>{const chosen=waTemplateByIdF14G_(t,sel.value);if(!chosen)return;
      if(['table_update','table_payment_update'].includes(String(chosen.purpose||''))&&(!state.seating||String(state.seating.eventId)!==String(state.activeEventId))){try{state.seating=await API.request('seatingStateV169',{eventId:state.activeEventId});}catch(ignore){}}
      eligible=waEligibleGuestsForTemplateF14Z35_(rows,chosen,state.seating,activeEvent());invalid=rows.filter(g=>!waPhonePreviewV1190A16_(g.phone));
      const line=$('#waRealEligibleLineF14Z35'),cnt=$('#waRealCountF14Z35'),send=$('#waRealSendF14C');if(line)line.innerHTML=`<b>מיועדים לשליחה:</b> ${eligible.length} · <b>לא מתאימים לתנאי התבנית:</b> ${Math.max(0,rows.length-eligible.length-invalid.length)}${invalid.length?` · <b>טלפון חסר/לא תקין:</b> ${invalid.length}`:''}`;if(cnt)cnt.textContent=String(eligible.length);
      waRenderPreviewF14G_($('#waRealPreviewF14G'),chosen,eligible[0]||rows[0]||null);getWaCostEstimateCachedF14_(eligible.length,chosen.category).then(e=>{const x=$('#waRealCostF14C');if(x)x.textContent=waCostTextF14Z34_(e,chosen.category);});
      send.disabled=!eligible.length||!waSelectedTemplateApprovedF14E_(sel);
    };
    sel.onchange=refresh;await refresh();
  });
  $('#waRealCloseF14C').onclick=closeModal;let stopped=false;$('#waRealStopF14C').onclick=()=>{stopped=true;$('#waRealStopF14C').disabled=true;$('#waRealStatusF14C').textContent='העצירה התקבלה. לא תתחיל הודעה נוספת לאחר ההודעה המטופלת כעת.';};
  $('#waRealSendF14C').onclick=async()=>{const templateId=$('#waRealTemplateF14C').value;if(!templateId)return;const selectedTpl=waTemplateByIdF14G_(templatesF14Z35,templateId);const cost=$('#waRealCostF14C').textContent;if(selectedTpl&&String(selectedTpl.purpose||'')!=='invitation'){if(eligible.length!==1){const status=$('#waRealStatusF14C');status.textContent='לשליחה קבוצתית בתבנית זו יש לבחור מוזמן דרך סמליל WhatsApp ברשימה. מנגנון הסינון הקבוצתי לפי סוג התבנית יופעל בשלב הבא.';status.className='wa-confirm-status-v1190a16 error';return;}const confirmed=await waConfirmSendF14V_({title:'אישור שליחת WhatsApp',message:`לשלוח את התבנית "${selectedTpl.name}" למוזמן שנבחר?`,details:`<b>מוזמן:</b> ${esc(eligible[0].name||'')} · <b>עלות משוערת:</b> ${esc(cost)}`});if(!confirmed)return;const send=$('#waRealSendF14C'),close=$('#waRealCloseF14C'),status=$('#waRealStatusF14C');waSetSendingF14V_(send,true);close.disabled=true;try{const r=await API.request('sendAnyTemplateToGuest',{eventId:state.activeEventId,guestId:eligible[0].guestId||eligible[0].id,templateId});status.textContent=r?.accepted?'ההודעה התקבלה לשליחה ב-WhatsApp.':'השליחה לא אושרה.';status.className='wa-confirm-status-v1190a16 '+(r?.accepted?'success':'error');send.disabled=true;}catch(e){status.textContent=e?.message||String(e);status.className='wa-confirm-status-v1190a16 error';waSetSendingF14V_(send,false);close.disabled=false;}return;}const confirmed=await waConfirmSendF14V_({title:'אישור שליחת WhatsApp',message:`לשלוח ${eligible.length} הודעות למספרי המוזמנים?`,details:`<b>כמות:</b> ${eligible.length} · <b>עלות משוערת:</b> ${esc(cost)}`});if(!confirmed)return;
    const started=performance.now(),send=$('#waRealSendF14C'),close=$('#waRealCloseF14C'),stop=$('#waRealStopF14C'),box=$('#waRealProgressF14C'),status=$('#waRealStatusF14C');waSetSendingF14V_(send,true);close.disabled=true;stop.hidden=false;box.hidden=false;box.querySelector('span').textContent='מכין שליחה · בודק Media ושער דולר...';let prepared;const prepareStartedD34=performance.now();try{prepared=await API.request('prepareWhatsAppSendF14Z9',{templateId,eventId:state.activeEventId});const prepareMsD34=performance.now()-prepareStartedD34;console.info('[WA PERF] prepareWhatsAppSend',Math.round(prepareMsD34),'ms');box.querySelector('span').textContent=`הכנה הושלמה · Media: ${prepared.mediaSource} · שער דולר: ${prepared.costSource} · Messages: ${eligible.length}`;}catch(e){status.innerHTML=`<p><strong>הכנת השליחה נכשלה:</strong> ${esc(e?.message||'שגיאה לא ידועה')}</p>`;status.className='wa-confirm-status-v1190a16 error';stop.hidden=true;waSetSendingF14V_(send,false);close.disabled=false;return;}let ok=0,fail=0,done=0,perf={eventMs:0,ensureMs:0,guestsMs:0,configTemplateMs:0,mediaMs:0,rsvpMs:0,buildMs:0,metaMs:0,processMs:0,costWriteMs:0,activityWriteMs:0,diagnosticMs:0,writeMs:0,totalMs:0};
    const chunkSize=16,totalBatches=Math.ceil(eligible.length/chunkSize);let batchError='',batchMeta=[];
    for(let i=0,batchNo=1;i<eligible.length;i+=chunkSize,batchNo++){if(stopped)break;const chunk=eligible.slice(i,i+chunkSize);box.querySelector('span').textContent=`קבוצת שליחה ${batchNo}/${totalBatches} · שולח ${done+1}–${done+chunk.length} מתוך ${eligible.length}`;try{const r=await API.request('sendInvitationBatchF14U',{eventId:state.activeEventId,items:chunk.map(g=>({guestId:g.guestId||g.id})),templateId,mediaId:prepared.mediaId,costEstimate:prepared.costEstimate});if(!r||typeof r.accepted==='undefined'||typeof r.failed==='undefined')throw new Error('קבוצת השליחה לא החזירה תשובה תקינה');ok+=Number(r.accepted||0);fail+=Number(r.failed||0);if(r.performance)Object.keys(perf).forEach(k=>perf[k]+=Number(r.performance[k]||0));if(r.metaSummary)batchMeta.push({batchNo,...r.metaSummary});done+=chunk.length;box.querySelector('progress').value=Math.round(done*100/eligible.length);if(done<eligible.length&&!stopped)await waPauseBetweenBatchesF14Z7_(box,done,eligible.length,batchNo+1,totalBatches,started);}catch(e){batchError=e?.message||'קבוצת השליחה לא החזירה תשובה תקינה';break;}}
    const elapsedMs=performance.now()-started,left=eligible.length-done;status.innerHTML=`<p><strong>זמן הכנה:</strong> ${waFormatElapsedF14V_(prepareMsD34)}</p><p><strong>מסלול רשת:</strong> Media: ${esc(prepared.mediaSource)} · שער דולר: ${esc(prepared.costSource)} · Messages: ${eligible.length}</p>`+waBatchMetaHtmlF14Z11_(batchMeta)+(batchError?`<p><strong>השליחה נעצרה:</strong> ${esc(batchError)}. לא ניתן לקבוע אם קבוצת השליחה שלא החזירה תשובה נמסרה בפועל; יש לבדוק ב-WhatsApp לפני ניסיון נוסף.</p>`:'')+waResultHtmlF14V_({ok,fail,left,elapsedMs,test:false,perf,uncertain:!!batchError});status.className='wa-confirm-status-v1190a16 '+((fail||batchError)?'error':'success');box.querySelector('span').textContent=batchError?`נעצר לאחר ${done} מתוך ${eligible.length} · ${waFormatElapsedF14V_(elapsedMs)}`:`טופלו ${done} מתוך ${eligible.length} · ${waFormatElapsedF14V_(elapsedMs)}`;stop.hidden=true;waSetSendingF14V_(send,false);send.disabled=true;close.disabled=false;
  };
}

/* V1.1.90A16 — one-recipient confirmation, with phone preview and inline status. */
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
  const close=$('#modalClose');
  if(!to){status.textContent='מספר הטלפון אינו תקין. יש לתקן אותו ברשומת המוזמן לפני השליחה.';status.className='wa-confirm-status-v1190a16 error';}
  else{status.dataset.templateMessage='1';const sel=panel.querySelector('#waSingleTemplateF14C');waFillTemplateSelectF14D_(sel,status,send).then(t=>{const preview=()=>waRenderPreviewF14G_(panel.querySelector('#waSinglePreviewF14G'),waTemplateByIdF14G_(t,sel.value),g);send.disabled=!t.length||!waSelectedTemplateApprovedF14E_(sel);sel.onchange=()=>{send.disabled=!waSelectedTemplateApprovedF14E_(sel);preview();};if(t.length)preview();});}
  getWaCostEstimateCachedF14_(1).then(e=>{const unit=panel.querySelector('#waConfirmUnitUsdF14'),usd=panel.querySelector('#waConfirmUsdF14'),fx=panel.querySelector('#waConfirmFxF14'),ils=panel.querySelector('#waConfirmCostF14');if(e?.estimatedIls!=null){if(unit)unit.textContent='$'+Number(e.unitUsd).toFixed(4);if(usd)usd.textContent='$'+Number(e.estimatedUsd).toFixed(2);if(fx)fx.textContent=Number(e.usdIls).toFixed(4);if(ils)ils.innerHTML='<b>₪'+Number(e.estimatedIls).toFixed(2)+'</b>';}else{[unit,usd,fx,ils].forEach(el=>{if(el)el.textContent=e?.notice||'לא ניתן לחשב';});}}).catch(()=>{['#waConfirmUnitUsdF14','#waConfirmUsdF14','#waConfirmFxF14','#waConfirmCostF14'].forEach(sel=>{const el=panel.querySelector(sel);if(el)el.textContent='לא ניתן לחשב כרגע';});});
  cancel.onclick=closeModal;
  send.onclick=async()=>{
    if(send.disabled||!to)return;
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
  {key:'WHATSAPP_PERSONAL_GREETING_DEFAULT',group:'WHATSAPP',label:'פנייה אישית — ברירת מחדל',value:'משפחה יקרה',description:'משמש כאשר למוזמן אין פנייה אישית.'},
  {key:'WHATSAPP_EVENT_DETAILS_FORMAT',group:'WHATSAPP',label:'פרטי האירוע',value:'{eventName}\n{eventDate} בשעה {eventTime}\n{eventVenue}\nכתובת: {eventAddress}',description:'מבנה הערך המורכב שמועבר לתבניות WhatsApp.'},
  {key:'WHATSAPP_EXTRA_NOTES_DEFAULT',group:'WHATSAPP',label:'הערות נוספות — ברירת מחדל',value:'',description:'ערך ברירת מחדל כאשר אין הערות נוספות.'}
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

async function renderSystemValuesAdminZ53_(){
  const c=$('#adminContent');if(!c)return;c.innerHTML='<div class="admin-loading-z53b6"><span class="admin-spinner-z53b6" aria-hidden="true"></span><strong>טוען ערכי מערכת…</strong></div>';
  try{const r=await API.request('listSystemSettingsZ53',{}),rows=r.settings||[];
    const cards=systemValueDefsZ53_.map(d=>{const x=systemValueMergedZ53_(rows,d.key);return `<article class="system-value-card-z53"><h3>${esc(x.label)}</h3><p class="muted">${esc(x.description||'')}</p><textarea data-system-value-z53="${esc(x.key)}" rows="4">${esc(x.value||'')}</textarea><div class="system-token-bar-z53">${Object.entries(systemTokenLabelsZ53_).map(([k,l])=>`<button type="button" data-insert-token-z53="${k}" data-target-z53="${esc(x.key)}">+ ${esc(l)}</button>`).join('')}</div><p><b>תצוגה מקדימה:</b></p><pre data-system-preview-z53="${esc(x.key)}">${esc(systemPreviewZ53_(x.value))}</pre><div class="actions"><button class="primary save-system-value-z53" data-key="${esc(x.key)}">שמירה</button></div></article>`}).join('');
    c.innerHTML=`<div class="system-help-z53"><h2>ערכי מערכת</h2><p>כאן מנהלים רק ערכים כלליים שהמערכת משתמשת בהם בעת בניית הודעות.</p><p class="system-help-note-z53">מיפוי משתני Meta הועבר למסך <b>תבניות WhatsApp</b>, בתוך עריכת כל תבנית.</p></div><div class="system-values-grid-z53">${cards}</div>`;
  }catch(e){c.innerHTML=`<div class="event-save-status error">${esc(e?.message||String(e))}</div>`;}
}
function formatAdminDateZ53B3_(v){if(!v)return '—';const d=new Date(v);if(Number.isNaN(d.getTime()))return String(v);return new Intl.DateTimeFormat('he-IL',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit',hour12:false}).format(d).replace(',', '');}
function formatBoiRateDateZ53B5_(v){if(!v)return '—';const d=new Date(v);if(!Number.isNaN(d.getTime()))return new Intl.DateTimeFormat('he-IL',{day:'2-digit',month:'2-digit',year:'numeric'}).format(d);return String(v);}
function friendlyTierZ53B3_(v){const s=String(v||'').trim();if(!s)return '—';if(/^0:MAX$/i.test(s))return '0–MAX';const m=s.match(/^(\d+):(\d+)$/);return m?`${Number(m[1]).toLocaleString('en-US')}–${Number(m[2]).toLocaleString('en-US')}`:s;}
async function renderWhatsAppCostsAdminZ53B3_(){
  const c=$('#adminContent');if(!c)return;c.innerHTML='<div class="admin-loading-z53b6"><span class="admin-spinner-z53b6" aria-hidden="true"></span><strong>טוען עלויות WhatsApp…</strong></div>';
  try{const [r,watch]=await Promise.all([API.request('listSystemSettingsZ53',{}),API.request('metaPricingWatchStatusZ53B',{})]),pricing=(r.pricing||[]).filter(x=>String(x.source||'').includes('Meta'));
    const rows=pricing.map(x=>`<tr class="wa-pricing-row-z53b2" data-wa-price-id="${esc(x.id)}" title="לחיצה כפולה להצגת פרטים"><td>${esc(x.environment)}</td><td>${esc(x.category)}</td><td>${esc(x.country)}</td><td>${esc(x.currency)}</td><td>${esc(x.unitPrice)}</td><td class="wa-tier-z53b3">${esc(friendlyTierZ53B3_(x.tier))}</td><td>${esc(x.source||'')}</td><td>${esc(formatAdminDateZ53B3_(x.updatedAt))}</td></tr>`).join('');
    c.innerHTML=`<div class="system-help-z53 system-pricing-help-z53"><div><h2>עלויות WhatsApp</h2><p>המחירים נקראים אוטומטית מנתוני Meta עבור הודעות שנמסרו בסביבת PRODUCTION. סביבת TEST אינה מחויבת ועלותה 0.</p><p class="system-help-note-z53">המחיר מחושב מנתוני Meta pricing_analytics לפי COST ÷ VOLUME. הרשומות הן לקריאה בלבד; לחיצה כפולה על שורה מציגה את מלוא פרטי הרשומה.</p><p class="system-help-note-z53">מדרגת נפח היא טווח כמות ההודעות שעל פיו Meta קובעת את המחיר; המחיר עשוי להשתנות במעבר למדרגת נפח אחרת.</p><div class="pricing-watch-status-z53b"><b>בדיקה אוטומטית:</b> ${watch.enabled?'פעילה — פעם ביום, סביב 16:00':'לא פעילה'} · <b>בדיקה אחרונה:</b> ${esc(formatAdminDateZ53B3_(watch.last?.checkedAt))} · <b>סטטוס:</b> ${watch.last?.ok===false?'שגיאה':watch.last?.ok===true?'תקין':'—'}${watch.last?.changed?` · <b>שינויים שזוהו:</b> ${esc(watch.last.changed)}`:''}<br><b>שער USD/ILS:</b> ${watch.fx?.rate?esc(Number(watch.fx.rate).toFixed(4)):'—'} · <b>מקור:</b> בנק ישראל · <b>תאריך השער:</b> ${esc(formatBoiRateDateZ53B5_(watch.fx?.date))} · <b>נבדק לאחרונה:</b> ${esc(formatAdminDateZ53B3_(watch.fx?.lastCheckedAt))}</div></div><div class="pricing-watch-actions-z53b"><button class="primary sync-wa-pricing-z53b">בדיקה עכשיו מול Meta</button><button class="toggle-wa-pricing-watch-z53b">${watch.enabled?'כיבוי עדכון יומי':'הפעלת עדכון יומי'}</button></div></div><div class="table-wrap system-pricing-table-z53 wa-pricing-table-z53b2"><table class="admin-table"><thead><tr><th>סביבה</th><th>קטגוריה</th><th>מדינה</th><th>מטבע</th><th>מחיר ליחידה</th><th>מדרגת נפח</th><th>מקור</th><th>עודכן</th></tr></thead><tbody>${rows||'<tr><td colspan="8" class="system-empty-z53">אין עדיין נתוני מחיר מ־Meta. לחצו „בדיקה עכשיו מול Meta”.</td></tr>'}</tbody></table></div>`;
    c._waPricingZ53B3=pricing;
  }catch(e){c.innerHTML=`<div class="event-save-status error">${esc(e?.message||String(e))}</div>`;}
}
function showWaPricingDetailsZ53B3_(x){if(!x)return;modal(`<h2>פרטי עלות WhatsApp</h2><div class="wa-pricing-details-z53b2"><p><b>סביבה:</b> ${esc(x.environment||'—')}</p><p><b>קטגוריה:</b> ${esc(x.category||'—')}</p><p><b>מדינה:</b> ${esc(x.country||'—')}</p><p><b>מטבע:</b> ${esc(x.currency||'—')}</p><p><b>מחיר ליחידה:</b> ${esc(x.unitPrice||'—')}</p><p><b>מדרגת נפח:</b> <span class="wa-tier-z53b3">${esc(friendlyTierZ53B3_(x.tier))}</span></p><p><b>Pricing type:</b> ${esc(x.pricingType||'—')}</p><p><b>Volume:</b> ${esc(x.volume??'—')}</p><p><b>Cost:</b> ${esc(x.cost??'—')}</p><p><b>מקור:</b> ${esc(x.source||'—')}</p><p><b>תקופת נתונים:</b> ${esc(formatAdminDateZ53B3_(x.periodStart))} – ${esc(formatAdminDateZ53B3_(x.periodEnd))}</p><p><b>בדיקה אחרונה:</b> ${esc(formatAdminDateZ53B3_(x.lastCheckedAt||x.updatedAt))}</p><p><b>שינוי אחרון:</b> ${esc(formatAdminDateZ53B3_(x.changeDetectedAt))}</p><p><b>מחיר קודם:</b> ${esc(x.previousUnitPrice||'—')}</p><p><b>הערות:</b> ${esc(x.notes||'—')}</p></div><div class="actions"><button class="primary" onclick="closeModal()">סגור</button></div>`);}
function setAdminButtonBusyZ53B6_(button,busy,label){if(!button)return;if(busy){if(!button.dataset.busyHtmlZ53B6)button.dataset.busyHtmlZ53B6=button.innerHTML;button.disabled=true;button.setAttribute('aria-busy','true');button.innerHTML=`<span class="admin-spinner-z53b6 admin-spinner-button-z53b6" aria-hidden="true"></span><span>${esc(label||'מעדכן…')}</span>`;}else{button.disabled=false;button.removeAttribute('aria-busy');if(button.dataset.busyHtmlZ53B6){button.innerHTML=button.dataset.busyHtmlZ53B6;delete button.dataset.busyHtmlZ53B6;}}}
async function saveSystemValueUiZ53_(key,button){const ta=document.querySelector(`[data-system-value-z53="${CSS.escape(key)}"]`),d=systemValueDefsZ53_.find(x=>x.key===key);if(!ta||!d)return;setAdminButtonBusyZ53B6_(button,true,'שומר…');try{const r=await API.request('saveSystemSettingZ53',{setting:{...d,value:ta.value,active:true}});showToast('ערך המערכת נשמר','success');const p=document.querySelector(`[data-system-preview-z53="${CSS.escape(key)}"]`);if(p)p.textContent=systemPreviewZ53_(r.setting?.value??ta.value);}catch(e){showToast(e?.message||String(e),'error')}finally{setAdminButtonBusyZ53B6_(button,false)}}

document.addEventListener('dblclick',e=>{const tr=e.target.closest?.('.wa-pricing-row-z53b2');if(!tr)return;const c=$('#adminContent'),x=(c?._waPricingZ53B3||[]).find(v=>String(v.id)===String(tr.dataset.waPriceId));if(x)showWaPricingDetailsZ53B3_(x);});
document.addEventListener('input',e=>{const ta=e.target.closest?.('[data-system-value-z53]');if(!ta)return;const p=document.querySelector(`[data-system-preview-z53="${CSS.escape(ta.dataset.systemValueZ53)}"]`);if(p)p.textContent=systemPreviewZ53_(ta.value);});

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
  const send=e.target.closest("[data-send-guest]");if(send){e.stopPropagation();try{await API.request("setGuestSend",{id:send.dataset.sendGuest,enabled:send.checked});const g=state.guests.find(x=>String(x.guestId||x.id)===String(send.dataset.sendGuest));if(g)g.sendWhatsApp=send.checked}catch(err){send.checked=!send.checked;alert(err.message)}return}

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
/* V1.1.6:
   Do not close an edit/add modal by clicking the backdrop.
   Native date pickers may dispatch the final click outside the dialog area,
   which previously caused the event form to close before Save. */
$("#modal").onclick=e=>{
  if(e.target===$("#modal")){
    e.preventDefault();
    e.stopPropagation();
  }
};
// V1.1.43 defensive fallback for main event selectors.
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
  const select=card.dataset.guestStatKind==='rsvp'?$('#statusFilter'):$('#guestSeatingFilterV174');
  if(!select||select.disabled)return;
  select.value=select.value===card.dataset.guestStatValue?'':card.dataset.guestStatValue;
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
    startupProgressF14Z32_(0,5,"טוען נתוני מערכת במקביל…");
    await startupPaintF14Z32_();
    await bootstrap();
    const landing=state.session?.role==="TableManager"?"seating":"dashboard";
    showPage(landing);
    document.body.classList.remove("role-routing-v18");
    startupHideF14Z32_();
  }catch(err){
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
if(state.session){startExistingSessionZ58D3_().catch(e=>{document.body.classList.remove("role-routing-v18");startupHideF14Z32_();showToast(e?.message||String(e),"error");clearSession()})}
document.addEventListener("keydown",e=>{const th=e.target.closest?.(".guests-table th.sortable");if(th&&(e.key==="Enter"||e.key===" ")){e.preventDefault();setGuestSort(th.dataset.sort)}});

/* V1.1.90A5 — mobile guest filters default closed */
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


/* V1.1.73: refresh authoritative seating after table CRUD; discard stale responses. */
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
  let rows=baseRows.filter(g=>matchesQ(g)&&(!side||String(g.side)===side)&&(!group||String(g.group)===group));
  const assigned=rows.filter(g=>g.seatingStatus==='FULL').length,partial=rows.filter(g=>g.seatingStatus==='PARTIAL').length;
  host.innerHTML=`<div class="table-summary"><span>נמצאו: <b>${rows.length}</b></span><span>שובצו במלואם: <b>${assigned}</b></span><span>שובצו חלקית: <b>${partial}</b></span></div>
    <div class="table-wrap"><table class="admin-table"><thead><tr><th>מוזמן</th><th>טלפון</th><th>צד</th><th>קבוצה</th><th>מאושרים</th><th>שולחנות</th>${readOnly?'':'<th>פעולה</th>'}</tr></thead><tbody>${rows.map(g=>{
      const mine=st.assignments.filter(a=>String(a.guestId)===String(g.guestId));
      const labels=mine.map(a=>`שולחן ${esc(byId[String(a.tableId)]?.tableNumber||'—')} - ${Number(a.seats)||0}`).join(' | ');
      return `<tr><td>${esc(g.name)}</td><td>${esc(displayUserPhone_(g.phone||''))}</td><td>${esc(g.side||'—')}</td><td>${esc(g.group||'—')}</td><td>${g.confirmedCount}</td><td>${labels||'לא שובץ'}</td>${readOnly?'':`<td><button type="button" data-seat-guest="${esc(g.guestId)}">${mine.length?'שינוי שיוך':'שיוך'}</button></td>`}</tr>`
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
  const confirmed=Number(g.confirmedCount)||0;
  const own=st.assignments.filter(a=>String(a.guestId)===String(gid));
  const parts=own.length?own.map(a=>({tableId:String(a.tableId),seats:Number(a.seats)})):[{tableId:'',seats:confirmed>0?confirmed:0}];
  modal(`<div class="seating-modal-v175" dir="rtl"><h2>שיוך שולחנות — ${esc(g.name)}</h2><p>אישרו הגעה: <b>${confirmed}</b></p>
    <form id="seatingGuestFormV170" onsubmit="return false;"><div id="seatingPartsV170"></div><div id="seatingErrorV170" class="seating-inline-status-v176" role="status" aria-live="polite"></div>
    <div class="actions"><button type="button" id="seatingAddPartV170">+ פיצול לשולחן נוסף</button><button type="button" id="seatingSaveV170" class="primary">שמירת שיוך</button>${own.length?'<button type="button" id="seatingResetV170" class="danger">איפוס שיוך מוזמן</button>':''}</div></form></div>`);
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
  };
  const renderParts=()=>{
    const host=$('#seatingPartsV170');if(!host)return;
    host.innerHTML=parts.map((part,i)=>{
      const needed=Number(part.seats);
      const selectedOthers=parts.filter((_,j)=>j!==i).map(x=>String(x.tableId));
      const eligible=st.tables.filter(t=>!selectedOthers.includes(String(t.id))&&Number(t.free)+(ownByTable[String(t.id)]||0)>=needed);
      if(part.tableId&&!eligible.some(t=>String(t.id)===String(part.tableId)))part.tableId='';
      const opts=eligible.map(t=>`<option value="${esc(t.id)}" ${String(part.tableId)===String(t.id)?'selected':''}>שולחן ${esc(t.tableNumber)} · פנויים ${Number(t.free)+(ownByTable[String(t.id)]||0)}</option>`).join('');
      return `<div class="seating-part-v170"><label>מקומות <input type="number" min="1" max="${confirmed}" data-seats-index="${i}" value="${needed}"></label><label>שולחן <span class="seating-required-v176" aria-label="שדה חובה">*</span> <select required data-table-index="${i}"><option value="">בחר שולחן</option>${opts}</select></label>${parts.length>1?`<button type="button" data-remove-part="${i}" class="danger">הסרת חלק</button>`:''}</div>`;
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

/* V1.1.74: Seating actions belong to the guest list, not the tables page. */
function guestSeatingCellV174_(g){
  if(!canManageTables_())return '—';
  const count=Number(g.confirmedCount)||0;
  if(!count)return '<span class="muted">לא נדרש</span>';
  const st=state.seating?.eventId===String(state.activeEventId)?state.seating:null;
  const gid=String(g.guestId||g.id);
  const sg=st?.guests.find(x=>String(x.guestId)===gid);
  const mine=st?.assignments.filter(a=>String(a.guestId)===gid)||[];
  const names=mine.map(a=>{
    const t=st.tables.find(t=>String(t.id)===String(a.tableId));
    return 'שולחן '+(t?.tableNumber||'—')+' ('+(Number(a.seats)||0)+')';
  }).join(' · ');
  const assigned=Number(sg?.assignedCount)||0;
  return '<div class="guest-seating-v174"><span>'+assigned+' / '+count+' · '+(names?esc(names):'לא שובץ')+'</span> <button type="button" data-seat-guest="'+esc(gid)+'" '+'>'+(mine.length?'שינוי שיוך':'שיוך')+'</button></div>';
}
function renderGuestSeatingFiltersV174_(){
  const status=$('#guestSeatingFilterV174'),tables=$('#guestTableFilterV174');
  if(!status||!tables)return;
  const enabled=canManageTables_();status.disabled=!enabled;tables.disabled=!enabled;
  const old=tables.value,st=state.seating?.eventId===String(state.activeEventId)?state.seating:null;
  tables.innerHTML='<option value="">כל השולחנות</option>'+(st?.tables||[]).map(t=>'<option value="'+esc(t.id)+'">שולחן '+esc(t.tableNumber)+'</option>').join('');
  if([...tables.options].some(o=>o.value===old))tables.value=old;
  else tables.value='';
}

/* V1.1.79: desktop double-click to view; touch single tap handled in click listener. */
document.getElementById("guestsBody")?.addEventListener("dblclick",e=>{
  if(window.matchMedia("(hover: none), (pointer: coarse)").matches||e.target.closest("button,input,label,select"))return;
  const row=e.target.closest("[data-guest]");if(!row)return;
  const g=state.guests.find(x=>String(x.guestId||x.id)===String(row.dataset.guest));if(g)guestDetails(g);
});

// V1.1.89A4: public RSVP updates are made in another same-origin tab.
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

/* V1.1.90A19P2F14Z55 — WhatsApp log UI */
let waLogRowsZ55=[];
function waLogStatusLabelZ55_(s){return ({META_ACCEPTED:'ממתינה למסירה',API_FAILED:'נכשלה',SENT:'ממתינה למסירה',DELIVERED:'נמסרה',READ:'נקראה',FAILED:'נכשלה'})[String(s||'')]||String(s||'');}
function waLogIsEventManagerZ56C_(){return state.session?.role==='EventManager';}
function waLogApplyRoleViewZ56C_(){const simple=waLogIsEventManagerZ56C_(),page=$('#page-whatsappLog');if(!page)return;page.classList.toggle('wa-log-manager-z56c',simple);const env=$('#waLogEnvironmentZ55B');if(env)env.closest('select')?.classList.toggle('wa-log-manager-hidden-z56c',simple);const search=$('#waLogSearchZ55B');if(search)search.placeholder=simple?'חיפוש לפי שם או טלפון':'חיפוש לפי שם, טלפון או wamid';const intro=page.querySelector('.wa-log-intro-z55');if(intro)intro.textContent=simple?'כאן ניתן לראות אם הודעות WhatsApp ממתינות למסירה, נמסרו, נקראו או נכשלו.':'הסטטוס „ממתינה למסירה” מציין שההודעה התקבלה במערכת השליחה אך טרם התקבל אישור מסירה לטלפון.';}
function waLogEventNameZ55_(id){return state.events.find(e=>String(e.id)===String(id))?.name||id||'';}
function waLogInitFiltersZ55_(){const sel=$('#waLogEventZ55B');if(!sel)return;const old=sel.value;sel.innerHTML='<option value="">כל האירועים</option>'+state.events.map(e=>`<option value="${esc(e.id)}">${esc(e.name)}</option>`).join('');sel.value=state.events.some(e=>String(e.id)===old)?old:'';}
async function loadWhatsAppLogZ55_(button){
  const body=$('#waLogBodyZ55B');if(!body)return;logButtonBusyZ57A_(button,true,'מרענן...');waLogApplyRoleViewZ56C_();waLogInitFiltersZ55_();body.innerHTML='<tr><td colspan="7"><span class="log-btn-spinner-z57a" aria-hidden="true"></span> טוען...</td></tr>';
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
function showWhatsAppLogDetailsD5D_(r){
  if(!r)return;const admin=state.session?.role==='Admin';
  const item=(label,value,dir='')=>`<div class="wa-detail-item-d5d"><span>${esc(label)}</span><strong ${dir?`dir="${dir}"`:''}>${esc(value||'—')}</strong></div>`;
  modal(`<div class="wa-detail-modal-d5d"><h2>פרטי הודעת WhatsApp</h2><div class="wa-detail-grid-d5d">
    ${item('זמן',formatWaLogDateTimeZ56B1_(r.createdAt))}${item('אירוע',waLogEventNameZ55_(r.eventId))}${item('מוזמן',r.guestName||r.guestId)}${item('טלפון',r.phone,'ltr')}
    ${item('תבנית',r.templateDisplayName||r.templateName)}${admin?item('שם טכני',r.templateName):''}${item('סביבה',r.environment)}${item('סטטוס',waLogStatusLabelZ55_(r.status))}
    ${item('נשלחה',formatWaLogDateTimeZ56B1_(r.sentAt))}${item('נמסרה',formatWaLogDateTimeZ56B1_(r.deliveredAt))}${item('נקראה',formatWaLogDateTimeZ56B1_(r.readAt))}${item('נכשלה',formatWaLogDateTimeZ56B1_(r.failedAt))}
    ${admin?item('wamid / messageId',r.wamid,'ltr'):''}${admin?item('HTTP',String(r.httpStatus||'')):''}${admin?item('Error Code',r.errorCode,'ltr'):''}
  </div>${r.errorMessage?`<div class="wa-detail-error-d5d"><span>סיבת הכשל</span><pre>${esc(r.errorMessage)}</pre></div>`:''}<div class="actions"><button type="button" class="secondary" onclick="closeModal()">סגור</button></div></div>`);
}
function renderWhatsAppLogZ55_(d){
  const s=d.summary||waLogSummaryFromRowsZ55B_(),sum=$('#waLogSummaryZ55B'),active=String($('#waLogStatusZ55B')?.dataset.cardFilter||'');
  if(sum)sum.innerHTML=[['סה״כ',s.total||0,'blue',''],['ממתינות למסירה',s.pending??s.metaAccepted??0,'amber','pending'],['נמסרו',s.delivered||0,'green','delivered'],['נקראו',s.read||0,'blue','read'],['נכשלו',s.failed||0,'red','failed']].map(x=>`<button type="button" class="guest-stat-card-v178 ${x[2]} ${active===x[3]&&x[3]?'wa-card-active-d5d':''}" data-wa-card="${x[3]}" title="${x[3]?'סנן לפי '+x[0]:'הצג את כל הרשומות'}"><span>${x[0]}</span><strong>${x[1]}</strong></button>`).join('');
  let rows=waLogRowsForCardD5D_(sortedWhatsAppLogZ55B_()),b=$('#waLogBodyZ55B');b.innerHTML=rows.map((r,i)=>`<tr data-wa-row="${i}" title="לחיצה כפולה להצגת פרטים"><td data-col="createdAt">${esc(formatWaLogDateTimeZ56B1_(r.createdAt))}</td><td data-col="eventName">${esc(waLogEventNameZ55_(r.eventId))}</td><td data-col="guestName">${esc(r.guestName||r.guestId)}</td><td data-col="phone" dir="ltr">${esc(r.phone||'')}</td><td data-col="templateName" title="${esc(r.templateName||'')}">${esc(waLogIsEventManagerZ56C_()?(r.templateDisplayName||r.templateName||''):(r.templateDisplayName||r.templateName||''))}</td><td data-col="environment">${esc(r.environment||'')}</td><td data-col="status" class="wa-log-status-z55">${esc(waLogStatusLabelZ55_(r.status))}</td></tr>`).join('')||'<tr><td colspan="7" class="empty-cell">אין רשומות בהתאם לסינון.</td></tr>';
  b._waRenderedRowsD5D=rows;
  const n=$('#waLogNoticeZ55B');if(n)n.innerHTML=`<span>מוצגות <b>${rows.length}</b> מתוך <b>${s.total||waLogRowsZ55.length}</b> רשומות</span>${d.truncated?'<span class="guest-filter-active-v178">500 הרשומות האחרונות</span>':''}`;
  const purge=$('#waLogPurgeZ55B');if(purge)purge.hidden=!(d.canPurge??state.session?.role==='Admin');updateWhatsAppLogSortUIZ55B_();
}
async function purgeWhatsAppLogZ55_(button){if(state.session?.role!=='Admin')return;const beforeDate=prompt('מחק רשומות WhatsApp שנוצרו לפני תאריך (YYYY-MM-DD):');if(!beforeDate)return;if(!/^\d{4}-\d{2}-\d{2}$/.test(beforeDate)){showToast('תאריך לא תקין','error');return;}if(!confirm(`למחוק לצמיתות את כל רשומות WhatsApp מלפני ${beforeDate}?`))return;logButtonBusyZ57A_(button,true,'מנקה...');try{const d=await API.request('purgeWhatsAppLogZ55',{beforeDate});showToast(`נמחקו ${d.deleted||0} רשומות`);await loadWhatsAppLogZ55_();}catch(e){showToast(e.message,'error');}finally{logButtonBusyZ57A_(button,false);}}
document.addEventListener('change',e=>{if(e.target?.id==='waLogStatusZ55B')e.target.dataset.cardFilter='';if(['waLogEventZ55B','waLogEnvironmentZ55B','waLogStatusZ55B','waLogFromZ55B','waLogToZ55B'].includes(e.target?.id)){updateLogClearFilterStateZ57A_('wa');loadWhatsAppLogZ55_();}});
document.addEventListener('click',e=>{const card=e.target?.closest?.('#waLogSummaryZ55B [data-wa-card]');if(card){const kind=card.dataset.waCard||'';const sel=$('#waLogStatusZ55B');if(sel)sel.dataset.cardFilter=kind?((sel.dataset.cardFilter||'')===kind?'':kind):'';loadWhatsAppLogZ55_();return;}const t=e.target?.closest?.('#waLogFiltersToggleZ55B');if(t){const box=$('#waLogFiltersZ55B'),open=box?.classList.toggle('filters-open-a5');t.setAttribute('aria-expanded',String(!!open));const spans=t.querySelectorAll('span');if(spans[0])spans[0].textContent=open?'הסתר סינון':'הצג סינון';if(spans[1])spans[1].textContent=open?'▴':'▾';return;}const th=e.target?.closest?.('#page-whatsappLog th[data-wa-sort]');if(th){setWhatsAppLogSortZ55B_(th.dataset.waSort);return;}if(e.target?.closest?.('#waLogRefreshZ55B'))loadWhatsAppLogZ55_(e.target.closest('#waLogRefreshZ55B'));if(e.target?.closest?.('#waLogClearFiltersZ55B')){const cb=e.target.closest('#waLogClearFiltersZ55B');logButtonBusyZ57A_(cb,true,'מנקה...');['waLogEventZ55B','waLogEnvironmentZ55B','waLogStatusZ55B','waLogFromZ55B','waLogToZ55B','waLogSearchZ55B'].forEach(id=>{const x=$('#'+id);if(x){x.value='';if(id==='waLogStatusZ55B')x.dataset.cardFilter='';}});updateLogClearFilterStateZ57A_('wa');loadWhatsAppLogZ55_().finally(()=>logButtonBusyZ57A_(cb,false));}if(e.target?.closest?.('#waLogPurgeZ55B'))purgeWhatsAppLogZ55_(e.target.closest('#waLogPurgeZ55B'));});
document.addEventListener('input',e=>{if(e.target?.id==='waLogSearchZ55B')updateLogClearFilterStateZ57A_('wa');});
document.addEventListener('keydown',e=>{const th=e.target?.closest?.('#page-whatsappLog th[data-wa-sort]');if(th&&(e.key==='Enter'||e.key===' ')){e.preventDefault();setWhatsAppLogSortZ55B_(th.dataset.waSort);return;}if(e.target?.id==='waLogSearchZ55B'&&e.key==='Enter')loadWhatsAppLogZ55_();});

document.addEventListener('dblclick',e=>{const tr=e.target?.closest?.('#waLogBodyZ55B tr[data-wa-row]');if(!tr)return;const rows=$('#waLogBodyZ55B')?._waRenderedRowsD5D||[];showWhatsAppLogDetailsD5D_(rows[Number(tr.dataset.waRow)]);});


// V1.1.90A19P2F14Z58C2 — Event Costs aligned with WhatsApp log UI
let eventCostsDataZ58=null;
let eventCostSortZ58A={key:'date',dir:'desc'};
function moneyZ58_(v){return '₪'+Number(v||0).toLocaleString('he-IL',{minimumFractionDigits:2,maximumFractionDigits:2});}
function eventCostEventNameZ58_(id){return state.events.find(e=>String(e.id||e.eventId)===String(id))?.name||id||'';}
function eventCostIsManagerZ58A_(){return state.session?.role==='EventManager';}
async function loadEventCostsZ58_(button){const body=$('#eventCostsBodyZ58');if(!body)return;logButtonBusyZ57A_(button,true,'מרענן...');body.innerHTML='<tr><td colspan="8"><span class="log-btn-spinner-z57a"></span> טוען...</td></tr>';try{const sel=$('#eventCostsEventZ58'),eid=sel?.value||'';const d=await API.request('eventCostsContextZ58',{eventId:eid});eventCostsDataZ58=d;renderEventCostsZ58_(d);}catch(e){body.innerHTML=`<tr><td colspan="8" class="error">${esc(e.message)}</td></tr>`;}finally{logButtonBusyZ57A_(button,false);}}
function eventCostUnifiedRowsZ58A_(){if(!eventCostsDataZ58)return[];const manual=(eventCostsDataZ58.manualRows||[]).map(r=>({...r,source:'MANUAL',sourceLabel:'ידני'}));const wa=(eventCostsDataZ58.whatsAppRows||[]).map(r=>({id:'WA:'+String(r.messageId||''),eventId:r.eventId,date:String(r.createdAt||'').slice(0,10),createdAt:r.createdAt,category:'WhatsApp',description:r.templateDisplayName||r.templateName||'WhatsApp',amount:Number(r.estimatedIls||0),costType:'ACTUAL',notes:'',source:'WHATSAPP',sourceLabel:'אוטומטי'}));return manual.concat(wa);}
function eventCostFilteredRowsZ58A_(){let a=eventCostUnifiedRowsZ58A_();const cat=$('#eventCostsCategoryZ58C')?.value||'',type=$('#eventCostsTypeZ58C')?.value||'',from=$('#eventCostsFromZ58C')?.value||'',to=$('#eventCostsToZ58C')?.value||'',q=String($('#eventCostsSearchZ58C')?.value||'').trim().toLowerCase();if(cat)a=a.filter(r=>r.category===cat);if(type)a=a.filter(r=>type==='WHATSAPP'?r.source==='WHATSAPP':r.costType===type&&r.source!=='WHATSAPP');if(from)a=a.filter(r=>String(r.date||'')>=from);if(to)a=a.filter(r=>String(r.date||'')<=to);if(q)a=a.filter(r=>[r.category,r.description,r.notes].some(v=>String(v||'').toLowerCase().includes(q)));const {key,dir}=eventCostSortZ58A,m=dir==='asc'?1:-1;return a.sort((x,y)=>{const A=key==='amount'?Number(x.amount||0):String(x[key]||''),B=key==='amount'?Number(y.amount||0):String(y[key]||'');return(typeof A==='number'?A-B:String(A).localeCompare(String(B),'he',{numeric:true,sensitivity:'base'}))*m;});}
function updateEventCostClearZ58A_(){const active=['eventCostsCategoryZ58C','eventCostsTypeZ58C','eventCostsFromZ58C','eventCostsToZ58C','eventCostsSearchZ58C'].some(id=>String($('#'+id)?.value||'').trim());const b=$('#eventCostsClearZ58C');if(b){b.classList.toggle('filters-active-z57a',active);b.setAttribute('aria-pressed',String(active));b.title=active?'נקה את הסינון הפעיל':'אין סינון פעיל';}}
function renderEventCostsRowsZ58A_(){const rows=eventCostFilteredRowsZ58A_(),manager=eventCostIsManagerZ58A_(),b=$('#eventCostsBodyZ58');if(!b)return;b.innerHTML=rows.map(r=>`<tr><td>${esc(formatWaLogDateTimeZ56B1_(r.createdAt||r.date))}</td><td>${esc(r.category||'')}</td><td title="${esc(r.description||'')}">${esc(r.description||'')}</td><td><b>${moneyZ58_(r.amount)}</b></td><td>${r.source==='WHATSAPP'?'בפועל':(r.costType==='EXPECTED'?'צפויה':'בפועל')}</td><td class="event-cost-admin-tech-z58a">${esc(r.sourceLabel||'')}</td><td title="${esc(r.notes||'')}">${esc(r.notes||'')}</td><td>${r.source==='WHATSAPP'?'—':`<button type="button" class="ui-icon-btn-z58d4 edit event-cost-edit-z58" title="עריכה" aria-label="עריכה" data-id="${esc(r.id)}">✎</button> <button type="button" class="ui-icon-btn-z58d4 delete event-cost-delete-z58" title="מחיקה" aria-label="מחיקה" data-id="${esc(r.id)}">🗑</button>`}</td></tr>`).join('')||'<tr><td colspan="8" class="empty-cell">אין הוצאות בהתאם לסינון.</td></tr>';$('#page-eventCosts')?.classList.toggle('event-cost-manager-z58a',manager);const n=$('#eventCostsNoticeZ58C');if(n)n.textContent=`מוצגות ${rows.length} מתוך ${eventCostUnifiedRowsZ58A_().length} רשומות`;$$('#page-eventCosts th[data-cost-sort]').forEach(th=>{const on=th.dataset.costSort===eventCostSortZ58A.key;th.classList.toggle('sorted',on);const sp=th.querySelector('span');if(sp)sp.textContent=on?(eventCostSortZ58A.dir==='asc'?'↑':'↓'):'↕';});updateEventCostClearZ58A_();}
function renderEventCostsZ58_(d){const sel=$('#eventCostsEventZ58'),keep=sel?.value||'';if(sel){const all=d.canSeeAll?'<option value="">כל האירועים</option>':'';sel.innerHTML=all+(d.events||[]).map(e=>`<option value="${esc(e.id)}">${esc(e.name)}</option>`).join('');sel.value=(d.events||[]).some(e=>String(e.id)===String(keep))?keep:(d.canSeeAll?'':String(d.events?.[0]?.id||''));}$('#eventCostsTotalZ58').textContent=moneyZ58_(d.summary?.totalIls);$('#eventCostsActualZ58C').textContent=moneyZ58_(d.summary?.actualIls);$('#eventCostsExpectedZ58C').textContent=moneyZ58_(d.summary?.expectedIls);$('#eventCostsWaZ58').textContent=moneyZ58_(d.summary?.whatsappIls);const cs=$('#eventCostsCategoryZ58C'),old=cs?.value||'';if(cs){const names=[...new Set((d.categories||[]).map(c=>c.name).concat(['WhatsApp']))];cs.innerHTML='<option value="">כל הקטגוריות</option>'+names.map(x=>`<option value="${esc(x)}">${esc(x)}</option>`).join('');cs.value=names.includes(old)?old:'';}const allWrap=$('#eventCostsByEventWrapZ58');if(allWrap){allWrap.hidden=!(d.canSeeAll&&!d.selectedEventId);$('#eventCostsByEventZ58').innerHTML=(d.byEvent||[]).map(x=>`<tr><td>${esc(x.eventName)}</td><td>${moneyZ58_(x.manual)}</td><td>${moneyZ58_(x.whatsapp)}</td><td><b>${moneyZ58_(x.total)}</b></td></tr>`).join('');}renderEventCostsRowsZ58A_();}
function eventCostDialogZ58_(r={}){
 const d=eventCostsDataZ58;if(!d)return;
 const known=(d.categories||[]),knownNames=new Set(known.map(c=>c.name));
 const editIsCustom=!!r.category&&!knownNames.has(r.category);
 const events=(d.events||[]).map(e=>`<option value="${esc(e.id)}" ${String(e.id)===String(r.eventId||d.selectedEventId||'')?'selected':''}>${esc(e.name)}</option>`).join('');
 const cats=known.map(c=>`<option value="${esc(c.id)}" data-mode="${esc(c.pricingMode)}" ${c.name===r.category||((c.name==='אחר')&&editIsCustom)?'selected':''}>${esc(c.name)}</option>`).join('');
 modal(`<div class="cost-dialog-z58d4">
   <div class="cost-dialog-head-z58d4"><div><h2>${r.id?'עריכת הוצאה':'הוספת הוצאה'}</h2><p>הזן את פרטי ההוצאה של האירוע</p></div><span class="cost-dialog-icon-z58d4">₪</span></div>
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
 cat.addEventListener('change',rebuild);rebuild();
 form.onsubmit=async e=>{e.preventDefault();const o=Object.fromEntries(new FormData(form)),b=$('#eventCostSaveZ58');logButtonBusyZ57A_(b,true,'שומר...');try{await API.request('saveEventCostZ58',{cost:o});closeModal();showToast('ההוצאה נשמרה');await loadEventCostsZ58_();}catch(err){showToast(err.message,'error');logButtonBusyZ57A_(b,false);}};
}
document.addEventListener('change',e=>{if(e.target?.id==='eventCostsEventZ58')loadEventCostsZ58_();if(['eventCostsCategoryZ58C','eventCostsTypeZ58C','eventCostsFromZ58C','eventCostsToZ58C'].includes(e.target?.id)){updateEventCostClearZ58A_();renderEventCostsRowsZ58A_();}});
document.addEventListener('input',e=>{if(e.target?.id==='eventCostsSearchZ58C'){updateEventCostClearZ58A_();renderEventCostsRowsZ58A_();}});
document.addEventListener('click',async e=>{const ft=e.target?.closest?.('#eventCostsFiltersToggleZ58C');if(ft){const box=$('#eventCostsFiltersZ58C'),open=box?.classList.toggle('filters-open-a5');ft.setAttribute('aria-expanded',String(!!open));const spans=ft.querySelectorAll('span');if(spans[0])spans[0].textContent=open?'הסתר סינון':'הצג סינון';if(spans[1])spans[1].textContent=open?'▴':'▾';return;}const th=e.target?.closest?.('#page-eventCosts th[data-cost-sort]');if(th){const k=th.dataset.costSort;if(eventCostSortZ58A.key===k)eventCostSortZ58A.dir=eventCostSortZ58A.dir==='asc'?'desc':'asc';else eventCostSortZ58A={key:k,dir:'asc'};renderEventCostsRowsZ58A_();return;}if(e.target?.closest?.('#eventCostsClearZ58C')){const b=e.target.closest('#eventCostsClearZ58C');logButtonBusyZ57A_(b,true,'מנקה...');['eventCostsCategoryZ58C','eventCostsTypeZ58C','eventCostsFromZ58C','eventCostsToZ58C','eventCostsSearchZ58C'].forEach(id=>{const x=$('#'+id);if(x)x.value='';});renderEventCostsRowsZ58A_();setTimeout(()=>logButtonBusyZ57A_(b,false),180);}if(e.target?.closest?.('#eventCostsRefreshZ58'))loadEventCostsZ58_(e.target.closest('#eventCostsRefreshZ58'));if(e.target?.closest?.('#eventCostAddZ58'))eventCostDialogZ58_();const ed=e.target?.closest?.('.event-cost-edit-z58');if(ed){const r=eventCostsDataZ58?.manualRows?.find(x=>String(x.id)===String(ed.dataset.id));if(r)eventCostDialogZ58_(r);}const del=e.target?.closest?.('.event-cost-delete-z58');if(del&&confirm('למחוק את ההוצאה?')){logButtonBusyZ57A_(del,true,'מוחק...');try{await API.request('deleteEventCostZ58',{id:del.dataset.id});showToast('ההוצאה נמחקה');await loadEventCostsZ58_();}catch(err){showToast(err.message,'error');logButtonBusyZ57A_(del,false);}}});
