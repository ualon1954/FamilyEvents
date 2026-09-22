let state={
  session:null,events:[],eventTypes:[],guests:[],tables:[],activity:[],activeEventId:null,
  guestSort:{key:"name",dir:"asc"},
  lookups:{sides:[],groups:[],statuses:[]},
  adminData:{users:[],roles:[],permissions:[],whatsapp:[],eventTypes:[]},
  lookupIndex:{sidesByType:{},groupsByType:{},statuses:[],labelMap:{}},
  adminTab:"eventTypes",adminLookupEventTypeId:null,adminLookupBoundEventId:null,adminLookupManualOverride:false,guestImportPreview:null,guestImportShowAll:false,seating:null
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
let currentPage="home";

function showPage(name){
  if(name==="seating"&&!canManageTables_()){
    showToast(state.activeEventId?"ניהול שולחנות אינו מופעל באירוע הנבחר":"יש לבחור אירוע קודם","error");
    name="dashboard";
  }
  currentPage=name;
  $$(".page").forEach(x=>x.classList.remove("active"));
  $("#page-"+name)?.classList.add("active");
  $$("#mainNav [data-page]").forEach(btn=>btn.classList.toggle("active",btn.dataset.page===name));
  const labels={home:"ראשי",dashboard:"לוח בקרה",events:"אירועים",guests:"מוזמנים",seating:"ניהול שולחנות",messages:"הודעות",about:"אודות",activity:"יומן פעילות",admin:"ניהול"};
  const pageName=$("#mobilePageName"); if(pageName) pageName.textContent=labels[name]||"";
  if(name==="admin") renderAdmin();
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
  $$('[data-role]').forEach(el=>el.style.display=(state.session?.role===el.dataset.role?"":"none"));
  $$("#mainNav [data-page]").forEach(btn=>btn.classList.toggle("active",btn.dataset.page===currentPage));
}
function saveSession(){localStorage.setItem(SESSION_CONFIG.SESSION_KEY,JSON.stringify(state.session))}
function clearSession(){localStorage.removeItem(SESSION_CONFIG.SESSION_KEY);state.session=null;$("#loginOverlay").classList.add("show")}
function restoreSession(){try{const s=JSON.parse(localStorage.getItem(SESSION_CONFIG.SESSION_KEY));if(s&&s.expiresAt>Date.now())state.session=s;else clearSession()}catch{clearSession()}}
function setUser(){if(!state.session)return;$("#userName").textContent=state.session.name;$("#userBubble").textContent=(state.session.name||"?")[0].toUpperCase();applyRole()}
function setTheme(t){document.body.classList.toggle("light",t==="light");localStorage.setItem(APP_CONFIG.THEME_KEY,t);const b=$("#themeBtn");if(b)b.textContent="◐";const icon=$("#loginThemeIcon"),label=$("#loginThemeLabel"),loginBtn=$("#loginThemeBtn");if(icon)icon.textContent=t==="light"?"☾":"☀";if(label)label.textContent=t==="light"?"מצב כהה":"מצב בהיר";if(loginBtn)loginBtn.setAttribute("aria-label",t==="light"?"מעבר למצב כהה":"מעבר למצב בהיר")}
function modal(html){$("#modalContent").innerHTML=html;$("#modal").classList.add("show")}
function closeModal(){$("#modal").classList.remove("show")}
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


async function bootstrap(){
  // V1.1.63: start both requests together, but populate the event selector as soon as
  // either request returns an event list. The selector no longer waits for the large
  // bootstrap payload (guests/admin/activity) to finish.
  const applyEarlyEvents_=events=>{
    if(!Array.isArray(events)||!events.length)return;
    state.events=events;
    restoreCurrentEvent_();
    renderCurrentEventContext_();
  };

  const bootstrapPromise=API.request("bootstrap",{token:state.session?.token}).then(base=>{
    if(base.serverVersion!==APP_VERSION.REQUIRED_SERVER_VERSION) throw new Error(`גרסת השרת אינה הגרסה הנדרשת. שרת: ${base.serverVersion||"לא ידועה"} | נדרש: ${APP_VERSION.REQUIRED_SERVER_VERSION}`);
    if(!state.events.length)applyEarlyEvents_(base.events);
    return base;
  });
  const eventPromise=API.request("getEventsContextV158",{token:state.session?.token}).then(er=>{
    if(er.serverVersion!==APP_VERSION.REQUIRED_SERVER_VERSION) throw new Error(`גרסת שרת לא תואמת בקריאת האירועים: ${er.serverVersion||"לא ידועה"}`);
    applyEarlyEvents_(er.events);
    return er;
  });

  const [r,eventResult]=await Promise.allSettled([bootstrapPromise,eventPromise]);
  if(r.status!=="fulfilled") throw r.reason;
  const base=r.value;

  let events=Array.isArray(base.events)?base.events:[];
  if(eventResult.status==="fulfilled"){
    const er=eventResult.value;
    const authoritative=Array.isArray(er.events)?er.events:[];
    if(authoritative.length)events=authoritative;
    console.info("[Events V1.1.63] authoritative event context",{eventCount:er.eventCount,database:er.database,diagnostics:er.diagnostics});
    if(!events.length){
      const dbName=er?.database?.name?` (${er.database.name})`:"";
      const rows=Number(er?.diagnostics?.lastRow||0);
      const hdr=(er?.diagnostics?.headers||[]).join(", ");
      showToast(`לא נמצאו אירועים במסד הנתונים${dbName}. Events rows=${rows}${hdr?` · headers: ${hdr}`:""}`,"error");
    }
  }else{
    console.error("[Events V1.1.63] authoritative event context failed",eventResult.reason);
    if(!events.length) showToast(`טעינת רשימת האירועים נכשלה: ${eventResult.reason?.message||eventResult.reason}`,"error");
    else showToast("רשימת האירועים נטענה ממנגנון הגיבוי; קריאת ההקשר הייעודית נכשלה","error");
  }

  state.events=events; state.eventTypes=Array.isArray(base.eventTypes)?base.eventTypes:[]; state.guests=Array.isArray(base.guests)?base.guests:[]; state.tables=Array.isArray(base.tables)?base.tables:[]; state.activity=Array.isArray(base.activity)?base.activity:[];
  state.lookups=base.lookups||{sides:[],groups:[],statuses:[]};
  rebuildLookupIndex_();
  state.adminData=base.adminData||{users:[],roles:[],permissions:[],whatsapp:[],eventTypes:[]};
  if(!state.eventTypes.length) state.eventTypes=state.adminData.eventTypes||[];
  restoreCurrentEvent_();
  renderAll();
}

function renderAll(){
  renderLookupFilters();renderEvents();renderGuests();renderDashboard();renderTables();renderActivity();renderAdmin();renderCurrentEventContext_();
  $("#frontVersion") && ($("#frontVersion").textContent=APP_VERSION.FRONTEND_VERSION);
  $("#serverVersion") && ($("#serverVersion").textContent=APP_VERSION.REQUIRED_SERVER_VERSION);
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
function displayUserPhone_(value){const p=String(value??'').trim();return /^5\d{8}$/.test(p)?'0'+p:p;}
function formatRsvpDeadline_(value){
  const match=/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(String(value||""));
  return match?`${match[3]}/${match[2]}/${match[1]} בשעה ${match[4]}:${match[5]}`:String(value||"");
}
function renderEvents(){
  $("#eventsGrid").innerHTML=state.events.map(e=>`<article class="event-card ${e.id===state.activeEventId?"active":""}" data-event="${e.id}">
    <h3>${esc(e.name)}</h3>
    <p>${esc(eventTypeName(e))} · ${esc(formatEventDateTime_(e))}</p>
    <p>${esc(e.venue||"")}</p>
    <p><b>מצב:</b> ${esc(lifecycleText(e.lifecycleStatus))} · <b>שולחנות:</b> ${isTrue(e.seatingEnabled,true)?"כן":"לא"}</p>
    <section class="event-rsvp-details">
      <h4>הגדרות אישור הגעה</h4>
      <p><b>מועד סגירת אישור/שינוי הגעה:</b> ${e.rsvpDeadline?esc(formatRsvpDeadline_(e.rsvpDeadline)):"לא הוגדר"}</p>
      <p><b>מנהל אחראי:</b> ${esc((state.adminData.users||[]).find(u=>String(u.id)===String(e.rsvpManagerId))?.name||e.rsvpContactName||"לא הוגדר")}</p>
      <p><b>טלפון איש קשר:</b> ${esc((state.adminData.users||[]).find(u=>String(u.id)===String(e.rsvpManagerId))?.phone||e.rsvpContactPhone||"לא הוגדר")}</p>
      <p><b>הודעה לאחר תפוגה:</b> ${esc(e.rsvpClosedMessage||"לא הוגדרה")}</p>
    </section>
    <div class="actions"><button class="primary edit-event" data-id="${e.id}">עריכה</button><button class="danger delete-event" data-id="${e.id}">מחיקה</button></div></article>`).join("")||'<div class="empty">אין אירועים. צור אירוע ראשון.</div>';
}
function filteredGuests(){
  const type=eventTypeById(activeEvent()?.eventTypeId),sideEnabled=!!type&&isTrue(type.usesSides,false),groupEnabled=!!type&&isTrue(type.usesGroups,false);
  const q=$("#guestSearch").value.trim().toLowerCase(),side=sideEnabled?$("#sideFilter").value:"",group=groupEnabled?$("#groupFilter").value:"",status=$("#statusFilter").value;
  const rows=state.guests.filter(g=>String(g.eventId)===String(state.activeEventId)&&(!q||(String(g.name||"")+" "+String(g.phone||"")).toLowerCase().includes(q))&&(!side||String(g.sideId||g.side)===String(side))&&(!group||String(g.groupId||g.group)===String(group))&&(!status||String(g.rsvpStatus||g.status)===String(status)));
  const seatingStatus=$('#guestSeatingFilterV174')?.value||'',tableFilter=$('#guestTableFilterV174')?.value||'';
  const st=state.seating?.eventId===String(state.activeEventId)?state.seating:null;
  const filtered=rows.filter(g=>{
    if(!seatingStatus&&!tableFilter)return true;
    const sg=st?.guests.find(x=>String(x.guestId)===String(g.guestId||g.id));
    if(seatingStatus==='UNASSIGNED'&&Number(g.confirmedCount)<=0)return false;
    if(seatingStatus==='NOT_REQUIRED'&&Number(g.confirmedCount)>0)return false;
    if(seatingStatus==='REMAINING'&&!(Number(g.confirmedCount)>Number(sg?.assignedCount||0)))return false;
    if(seatingStatus&&seatingStatus!=='NOT_REQUIRED'&&seatingStatus!=='REMAINING'&&(!sg||sg.seatingStatus!==seatingStatus))return false;
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
    const filters=['guestSearch','sideFilter','groupFilter','statusFilter','guestSeatingFilterV174','guestTableFilterV174'];
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
    <td class="guest-row-actions-v179">${state.session?.role==='Admin'?`<button type="button" class="guest-icon-action-v179" data-wa-test="${esc(g.guestId||g.id)}" title="שליחת הזמנת ניסיון ב-WhatsApp למוזמן יחיד" aria-label="שליחת הזמנת ניסיון אל ${esc(g.name)}">💬</button>`:''}<button type="button" class="guest-icon-action-v179" data-rsvp-link="${esc(g.guestId||g.id)}" title="העתק קישור אישור הגעה" aria-label="העתק קישור אישור הגעה עבור ${esc(g.name)}">🔗</button><button type="button" class="guest-icon-action-v179 edit" data-edit-guest="${esc(g.guestId||g.id)}" title="עריכה" aria-label="עריכת ${esc(g.name)}">✎</button><button type="button" class="guest-icon-action-v179 delete" data-delete-guest="${esc(g.guestId||g.id)}" title="מחיקת מוזמן" aria-label="מחיקת ${esc(g.name)}" ${guestCanDeleteV179_(g)?"":"disabled"}>🗑</button></td></tr>`}).join("");
  const resetBtn=$('#resetEventGuestsV1190A10');
  if(resetBtn){resetBtn.hidden=state.session?.role!=="Admin"||!state.activeEventId;resetBtn.disabled=!visibleGuestsV178.length&&!state.guests.some(g=>String(g.eventId)===String(state.activeEventId));}
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
  const addBtn=$("#addTableBtn");
  if(ev && !isTrue(ev.seatingEnabled,true)){
    if(addBtn)addBtn.disabled=true;
    $("#tableSummary").innerHTML='<span>ניהול שולחנות אינו מופעל באירוע זה</span>';
    $("#tablesBody").innerHTML='<tr><td colspan="5" class="empty-cell">ניתן להפעיל ניהול שולחנות בעריכת האירוע</td></tr>';
    return;
  }
  if(addBtn)addBtn.disabled=!state.activeEventId;
  const deleteAllBtn=$("#deleteAllEventTablesV1190A10");if(deleteAllBtn){deleteAllBtn.hidden=state.session?.role!=="Admin";deleteAllBtn.disabled=!state.activeEventId||!tablesForActiveEvent().length||tablesForActiveEvent().some(t=>Number(t.occupied)>0);}
  const rows=tablesForActiveEvent();
  
  $("#tableSummary").innerHTML=state.activeEventId?`<span>שולחנות: <b>${rows.length}</b></span><span>מקומות: <b>${rows.reduce((s,t)=>s+t.seats,0)}</b></span><span>תפוסים: <b>${rows.reduce((s,t)=>s+t.occupied,0)}</b></span><span>פנויים: <b>${rows.reduce((s,t)=>s+t.free,0)}</b></span>`:`<span>יש לבחור אירוע פעיל</span>`;
  $("#tablesBody").innerHTML=rows.map(t=>`<tr><td>${esc(t.tableNumber)}</td><td>${t.seats}</td><td>${t.occupied}</td><td>${t.free}</td><td><button class="edit-table" data-id="${t.id}">עריכה</button> <button class="danger delete-table" data-id="${t.id}">מחיקה</button></td></tr>`).join("") || `<tr><td colspan="5" class="empty-cell">${state.activeEventId?"אין שולחנות באירוע זה":"יש לבחור אירוע"}</td></tr>`;
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

function renderActivity(){$("#activityList").innerHTML=(state.activity||[]).map(a=>`<div><b>${esc(a.action)}</b> — ${esc(a.details)} <small>${esc(a.at)}</small></div>`).join("")||'<div class="empty">אין פעולות עדיין.</div>'}

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
    <section class="rsvp-admin-settings">
      <h3>הגדרות אישור הגעה</h3>
      <p>המועד ופרטי איש הקשר יופיעו בהמשך בקישור האישי למוזמנים.</p>
      <label>מועד סגירת אישור/שינוי הגעה
        <input name="rsvpDeadline" type="datetime-local" class="date-picker-control" value="${esc(String(e.rsvpDeadline||"").slice(0,16))}">
      </label>
      <label>מנהל אחראי לאישורי הגעה <span class="required-star">*</span>
        <select name="rsvpManagerId">
          <option value="">בחר מנהל פעיל</option>
          ${(state.adminData.users||[]).filter(u=>u.role==="Admin"&&isTrue(u.active,true)).map(u=>`<option value="${esc(u.id)}" ${String(e.rsvpManagerId||"")===String(u.id)?"selected":""}>${esc(u.name)}${u.phone?" · "+esc(displayUserPhone_(u.phone)):" · חסר טלפון"}</option>`).join("")}
        </select>
      </label>
      <div id="rsvpManagerContact" class="rsvp-manager-contact"></div>
      <label>הודעה לאחר תפוגה (לא חובה)
        <textarea name="rsvpClosedMessage" maxlength="500" rows="3">${esc(e.rsvpClosedMessage||"")}</textarea>
      </label>
    </section>
    <label class="check-label"><input name="seatingEnabled" type="checkbox" ${isTrue(e.seatingEnabled,eventTypeById(selectedType)?.defaultSeatingEnabled??false)?"checked":""}> ניהול שולחנות</label>
    <label class="check-label"><input name="enabled" type="checkbox" ${isTrue(e.enabled,true)?"checked":""}> אירוע פעיל</label>
    <input type="hidden" name="id" value="${esc(e.id||"")}">
    <input type="hidden" name="eventId" value="${esc(e.eventId||e.id||"")}">
    <div id="eventSaveStatus" class="event-save-status" aria-live="polite"></div>
    <div class="actions"><button type="button" id="saveEventBtn" class="primary">שמירה</button></div>
  </form>`);
  const typeSelect=$("#eventForm [name=eventTypeId]");
  if(typeSelect && !e.id){
    typeSelect.onchange=()=>{const t=eventTypeById(typeSelect.value),cb=$("#eventForm [name=seatingEnabled]");if(cb&&t)cb.checked=isTrue(t.defaultSeatingEnabled,false)};
  }
  const managerSelect=$("#eventForm [name=rsvpManagerId]");
  const managerInfo=$("#rsvpManagerContact");
  const updateManager=()=>{
    const u=(state.adminData.users||[]).find(x=>String(x.id)===String(managerSelect.value));
    managerInfo.textContent=u?(u.phone?"איש קשר: "+u.name+" · "+u.phone:"למנהל זה חסר מספר טלפון — יש להשלימו בניהול משתמשים"):"";
  };
  managerSelect?.addEventListener("change",updateManager);
  updateManager();
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
  const selectedManager=(state.adminData.users||[]).find(u=>String(u.id)===String(o.rsvpManagerId));
  if(o.rsvpDeadline && !selectedManager){
    if(status){status.textContent="יש לבחור מנהל אחראי לאישורי הגעה";status.className="event-save-status error";}
    form.querySelector('[name="rsvpManagerId"]')?.focus();return;
  }
  if(selectedManager && !String(selectedManager.phone||"").trim()){
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
  const sideField=showSides?`<label>צד<select name="sideId" required><option value="">בחר צד...</option>${scopedOptionHtml('sides',scopedSides,sideSelected)}</select></label>`:'';
  const groupField=showGroups?`<label>קבוצה<select name="groupId" required><option value="">בחר קבוצה...</option>${scopedOptionHtml('groups',scopedGroups,groupSelected)}</select></label>`:'';
  const status=g.rsvpStatus||g.status||'Pending',invited=g.invitedCount||g.partySize||1,confirmed=(g.confirmedCount??(status==='Confirmed'?invited:0));
  modal(`<h2>${(g.guestId||g.id)?'עריכת':'הוספת'} מוזמן</h2><p class="guest-event-context"><b>אירוע:</b> ${esc(ev?.name||'—')} · <b>סוג:</b> ${esc(type?.name||'—')} <small>(${showSides?scopedSides.length:0} צדדים · ${showGroups?scopedGroups.length:0} קבוצות)</small></p><form id="guestForm" class="form-grid" onsubmit="return false;">
  <input type="hidden" name="eventId" value="${esc(eventId)}">
  <label>שם <span class="required-star">*</span><input name="name" required value="${esc(g.name||'')}"></label><label>טלפון <span class="required-star">*</span><input name="phone" required inputmode="tel" placeholder="0501234567" value="${esc(g.phone||'')}"></label>
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
  <p><b>שליחה:</b> ${guestSendChecked(g)?"מסומן — יקבל הודעת WhatsApp":"לא מסומן"}</p><p><b>הערות:</b> ${esc(g.notes||"—")}</p>
  <div class="actions"><button class="primary" id="detailEdit">עריכה</button><button class="danger" id="detailDelete">מחיקה</button></div>`);
  $("#detailEdit").onclick=()=>guestForm(g);$("#detailDelete").onclick=async()=>{await deleteGuestV179_(g)}
}

/* ---------- Admin / Settings ---------- */
const adminTitles={eventTypes:"סוגי אירועים",sides:"צד",groups:"קבוצה",statuses:"סטטוס",users:"משתמשי מערכת",roles:"תפקידים",permissions:"ניהול הרשאות",whatsapp:"חיבור ל-WhatsApp",versions:"גרסאות"};
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
  if(state.adminTab==="versions"){c.innerHTML=`<h2>גרסאות</h2><p>Frontend: <b>${esc(APP_VERSION.FRONTEND_VERSION)}</b></p><p>Server: <b>${esc(APP_VERSION.REQUIRED_SERVER_VERSION)}</b></p><div class="admin-section-head"><h3>בדיקת תקינות ואופטימיזציה</h3></div><p>בדיקה מלאה לקריאות גיליונות, Handlers, מזהים כפולים וקישורים בין אירועים, מוזמנים, צדדים, קבוצות ושולחנות.</p><div class="actions"><button type="button" class="primary run-system-health">בדיקת תקינות מלאה</button></div><div id="systemHealthResult" class="event-save-status" aria-live="polite"></div><div class="admin-section-head"><h3>בדיקת שיוך סוג אירוע</h3></div><p>הבדיקה מאתרת אירועים ששמם מצביע באופן חד-משמעי על סוג אירוע אחר מזה ששמור ב-eventTypeId.</p><div class="actions"><button type="button" class="check-event-type-assignments">בדיקה בלבד</button><button type="button" class="primary repair-event-type-assignments">בדיקה ותיקון</button></div><div id="eventTypeAssignmentResult" class="event-save-status" aria-live="polite"></div>`;return}
  if(state.adminTab==="eventTypes")return renderEventTypesAdmin();
  if(["sides","groups","statuses"].includes(state.adminTab)) return renderLookupAdmin(state.adminTab);
  if(state.adminTab==="users")return renderUsersAdmin();
  if(state.adminTab==="roles")return renderRolesAdmin();
  if(state.adminTab==="permissions")return renderPermissionsAdmin();
  if(state.adminTab==="whatsapp")return renderWhatsAppAdmin();
}
function boolText(v){return isTrue(v,false)?"כן":"לא"}
function adminTable(title,addClass,headers,rows){
  return `<div class="admin-section-head"><h2>${esc(title)}</h2><button class="primary ${addClass}">+ הוספה</button></div><div class="table-wrap"><table class="admin-table"><thead><tr>${headers.map(h=>`<th>${esc(h)}</th>`).join("")}<th></th></tr></thead><tbody>${rows||'<tr><td colspan="99">אין רשומות</td></tr>'}</tbody></table></div>`;
}
function renderEventTypesAdmin(){
  const rows=(state.eventTypes||[]).map(x=>`<tr><td>${esc(x.name)}</td><td>${boolText(x.usesSides)}</td><td>${boolText(x.usesGroups)}</td><td>${boolText(x.defaultSeatingEnabled)}</td><td>${+x.sortOrder||0}</td><td>${boolText(x.active)}</td><td><button class="edit-event-type" data-id="${esc(x.eventTypeId||x.id)}">עריכה</button> <button class="danger delete-event-type" data-id="${esc(x.eventTypeId||x.id)}">מחיקה</button></td></tr>`).join("");
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
  const rows=list.map(x=>`<tr><td>${esc(x.value)}</td><td>${esc(x.label)}</td><td>${+x.sortOrder||0}</td><td>${boolText(x.active)}</td><td><button class="edit-lookup" data-kind="${kind}" data-id="${x.id}">עריכה</button> <button class="danger delete-lookup" data-kind="${kind}" data-id="${x.id}">מחיקה</button></td></tr>`).join("");
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
  const rows=(state.adminData.users||[]).map(x=>`<tr><td>${esc(x.name)}</td><td>${esc(x.email)}</td><td>${esc(displayUserPhone_(x.phone))}</td><td>${esc(roleLabel(x.role))}</td><td>${boolText(x.active)}</td><td><button class="edit-user" data-id="${x.id}">עריכה</button> <button class="danger delete-user" data-id="${x.id}">מחיקה</button></td></tr>`).join("");
  $("#adminContent").innerHTML=adminTable("משתמשי מערכת","add-user",["שם","אימייל","טלפון","תפקיד","פעיל"],rows);
}
function roleLabel(v){return (state.adminData.roles||[]).find(r=>r.value===v)?.label||v}
function renderRolesAdmin(){
  const rows=(state.adminData.roles||[]).map(x=>`<tr><td>${esc(x.value)}</td><td>${esc(x.label)}</td><td>${+x.sortOrder||0}</td><td>${boolText(x.active)}</td><td><button class="edit-role" data-id="${x.id}">עריכה</button> <button class="danger delete-role" data-id="${x.id}">מחיקה</button></td></tr>`).join("");
  $("#adminContent").innerHTML=adminTable("תפקידים","add-role",["קוד","שם תפקיד","סדר","פעיל"],rows);
}
function renderPermissionsAdmin(){
  const rows=(state.adminData.permissions||[]).map(x=>`<tr><td>${esc(roleLabel(x.role))}</td><td>${esc(x.permissionKey)}</td><td>${boolText(x.allowed)}</td><td>${esc(x.notes||"")}</td><td><button class="edit-permission" data-id="${x.id}">עריכה</button> <button class="danger delete-permission" data-id="${x.id}">מחיקה</button></td></tr>`).join("");
  $("#adminContent").innerHTML=adminTable("ניהול הרשאות","add-permission",["תפקיד","מפתח הרשאה","מאושר","הערות"],rows);
}
function renderWhatsAppAdmin(){
  const rows=(state.adminData.whatsapp||[]).map(x=>`<tr><td>${esc(x.name)}</td><td>${esc(x.phoneNumberId)}</td><td>${esc(x.wabaId)}</td><td>${esc(x.apiVersion||"")}</td><td>${boolText(x.enabled)}</td><td>${isTrue(x.hasAccessToken)?"מוגדר":"חסר"}</td><td><button class="edit-wa" data-id="${x.id}">עריכה</button> <button class="danger delete-wa" data-id="${x.id}">מחיקה</button></td></tr>`).join("");
  $("#adminContent").innerHTML=adminTable("חיבור ל-WhatsApp דרך Meta Web API","add-wa",["שם","Phone Number ID","WABA ID","API","פעיל","Access Token"],rows);
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
  <label>סיסמה ${x.id?"(השאר ריק ללא שינוי)":"<span class='required-star'>*</span>"}<input type="password" name="password" ${x.id?"":"required"}></label><label>תפקיד <span class="required-star">*</span><select name="role" required>${roleOptions(x.role||"Family")}</select></label>
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
  <label>תפקיד <span class="required-star">*</span><select name="role" required>${roleOptions(x.role||"Family")}</select></label><label>מפתח הרשאה <span class="required-star">*</span><input name="permissionKey" required placeholder="guests.edit" value="${esc(x.permissionKey||"")}"></label>
  <label class="check-label"><input type="checkbox" name="allowed" ${isTrue(x.allowed,true)?"checked":""}> מאושר</label>
  <label style="grid-column:1/-1">הערות<textarea name="notes">${esc(x.notes||"")}</textarea></label><div class="actions"><button type="button" id="savePermissionBtn" class="primary">שמירה</button></div></form>`);
  $("#savePermissionBtn").onclick=savePermissionForm;
}
function whatsappForm(x={}){
  modal(`<h2>${x.id?"עריכת":"הוספת"} חיבור WhatsApp</h2><form id="waForm" class="form-grid" onsubmit="return false;"><input type="hidden" name="id" value="${esc(x.id||"")}">
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
function openWhatsAppTestConfirmV1190A16_(g){
  const to=waPhonePreviewV1190A16_(g.phone);
  modal(`<section class="wa-confirm-v1190a16" role="dialog" aria-labelledby="waConfirmTitleV1190A16">
    <h2 id="waConfirmTitleV1190A16">אישור שליחת <bdi dir="ltr">WhatsApp</bdi></h2>
    <p>האם לשלוח הזמנה אחת למוזמן הבא?</p>
    <dl class="wa-confirm-details-v1190a16">
      <dt>שם המוזמן</dt><dd>${esc(g.name||'—')}</dd>
      <dt>מספר ברשומה</dt><dd dir="ltr">${esc(g.phone||'—')}</dd>
      <dt>מספר לשליחה ל־Meta</dt><dd dir="ltr">${to?esc('+'+to):'מספר לא תקין'}</dd>
      <dt>כמות הודעות</dt><dd>1</dd>
    </dl>
    <p class="wa-confirm-status-v1190a16" id="waConfirmStatusV1190A16" role="status" aria-live="polite"></p>
    <div class="actions"><button type="button" class="primary" id="waConfirmSendV1190A16" ${to?'':'disabled'}>אישור ושליחה</button>
    <button type="button" id="waConfirmCancelV1190A16">ביטול</button></div>
  </section>`);
  const panel=$('.wa-confirm-v1190a16'),send=panel.querySelector('#waConfirmSendV1190A16');
  const cancel=panel.querySelector('#waConfirmCancelV1190A16');
  const status=panel.querySelector('#waConfirmStatusV1190A16');
  const close=$('#modalClose');
  if(!to){status.textContent='מספר הטלפון אינו תקין. יש לתקן אותו ברשומת המוזמן לפני השליחה.';status.className='wa-confirm-status-v1190a16 error';}
  cancel.onclick=closeModal;
  send.onclick=async()=>{
    if(send.disabled||!to)return;
    send.disabled=true;cancel.disabled=true;if(close)close.disabled=true;
    send.innerHTML='<span class="seating-spinner-v171" aria-hidden="true"></span> שולח...';
    status.textContent='';status.className='wa-confirm-status-v1190a16';
    try{
      const r=await API.request('sendOneInvitationV1190A14',{eventId:g.eventId,guestId:g.guestId||g.id});
      if(r?.accepted!==true)throw new Error('לא התקבל אישור תקין משרת השליחה');
      status.textContent='Meta קיבלה את ההזמנה לשליחה. בדוק שההודעה הגיעה לטלפון.';
      status.className='wa-confirm-status-v1190a16 success';
      send.innerHTML='נשלח ✓';
      setTimeout(()=>{if($('.wa-confirm-v1190a16')===panel)closeModal()},2300);
    }catch(err){
      status.textContent=err?.message||'שליחת ההזמנה נכשלה';
      status.className='wa-confirm-status-v1190a16 error';
      if(err?.deliveryUncertain){
        send.innerHTML='מצב שליחה לא ידוע';send.disabled=true;
      }else{
        send.innerHTML='נסה שוב';send.disabled=false;
      }
      cancel.disabled=false;if(close)close.disabled=false;
    }
  };
}

/* ---------- Events ---------- */
document.addEventListener("click",async e=>{
  const sortHead=e.target.closest(".guests-table th.sortable"); if(sortHead){setGuestSort(sortHead.dataset.sort);return}
  const nav=e.target.closest("[data-page]");if(nav)showPage(nav.dataset.page);

  const tab=e.target.closest("[data-admin-tab]");if(tab){state.adminTab=tab.dataset.adminTab;renderAdmin();return}
  if(e.target.closest(".run-system-health")){await runSystemHealthUi_();return}
  if(e.target.closest(".check-event-type-assignments")){await diagnoseEventTypeAssignmentsUi_();return}
  if(e.target.closest(".repair-event-type-assignments")){await repairEventTypeAssignmentsUi_();return}
  const send=e.target.closest("[data-send-guest]");if(send){e.stopPropagation();try{await API.request("setGuestSend",{id:send.dataset.sendGuest,enabled:send.checked});const g=state.guests.find(x=>String(x.guestId||x.id)===String(send.dataset.sendGuest));if(g)g.sendWhatsApp=send.checked}catch(err){send.checked=!send.checked;alert(err.message)}return}

  const card=e.target.closest("[data-event]");if(card&&!e.target.closest("button,input,select")){setCurrentEvent_(card.dataset.event)}
  const er=e.target.closest(".edit-event");if(er){e.stopPropagation();eventForm(state.events.find(x=>x.id===er.dataset.id))}
  const dr=e.target.closest(".delete-event");if(dr){e.stopPropagation();if(confirm("למחוק את האירוע ואת שיוכי המוזמנים שלו?")){const id=dr.dataset.id,started=performance.now();const r=await API.request("deleteEvent",{id});removeLocal_(state.events,id);state.guests=state.guests.filter(x=>String(x.eventId)!==String(id));state.tables=state.tables.filter(x=>String(x.eventId)!==String(id));if(String(state.activeEventId)===String(id)){state.activeEventId=null;restoreCurrentEvent_()}renderAll();mutationDone_("האירוע נמחק",r,started)}}
  const waTest=e.target.closest('[data-wa-test]');if(waTest){
    e.stopPropagation();
    const g=state.guests.find(x=>String(x.guestId||x.id)===String(waTest.dataset.waTest));
    if(!g)return;
    if(!guestSendChecked(g)){showToast('המוזמן מסומן שליחה: לא','error');return}
    openWhatsAppTestConfirmV1190A16_(g);
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

$("#addEventBtn").onclick=()=>eventForm();$("#addGuestBtn").onclick=()=>{const id=selectedGuestEventId_();id?guestForm({},id):alert("יש ליצור או לבחור אירוע קודם")};$("#guestTemplateBtn").onclick=()=>downloadGuestWorkbook_("guestImportTemplateV148");$("#guestExportBtn").onclick=()=>downloadGuestWorkbook_("guestExportCurrentV148");$("#guestImportBtn").onclick=()=>{if(activeEventForGuestTransfer_())$("#guestImportFile").click()};$("#guestImportFile").onchange=e=>{const f=e.target.files?.[0];e.target.value="";if(f)handleGuestImportFile_(f)};$("#addTableBtn").onclick=()=>{const ev=activeEvent();if(!ev)return alert("יש ליצור או לבחור אירוע קודם");if(!isTrue(ev.seatingEnabled,true))return alert("ניהול שולחנות אינו מופעל באירוע זה");tableForm()};
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
["guestSearch","sideFilter","groupFilter","statusFilter","guestSeatingFilterV174","guestTableFilterV174"].forEach(id=>$("#"+id).addEventListener(id==="guestSearch"?"input":"change",renderGuests));
$("#clearGuestFiltersV180")?.addEventListener("click",()=>{
  ["guestSearch","sideFilter","groupFilter","statusFilter","guestSeatingFilterV174","guestTableFilterV174"].forEach(id=>{const el=$("#"+id);if(el)el.value=""});
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
    const r=await API.request("login",{email,password});
    state.session=r.session;
    saveSession();
    setUser();
    loginFeedbackV184("התחברת בהצלחה!","success");
    $("#loginBtnLabel").textContent="התחברת בהצלחה";
    await new Promise(resolve=>setTimeout(resolve,850));
    $("#loginOverlay").classList.remove("show");
    $("#loginPassword").value="";
    await bootstrap();
  }catch(err){
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
if(state.session){setUser();$("#loginOverlay").classList.remove("show");bootstrap().catch(e=>{alert(e.message);clearSession()})}
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
  const rows=st.guests.filter(g=>Number(g.confirmedCount)>0);
  const assigned=rows.filter(g=>g.seatingStatus==='FULL').length;
  const partial=rows.filter(g=>g.seatingStatus==='PARTIAL').length;
  host.innerHTML=`<div class="table-summary"><span>שובצו במלואם: <b>${assigned}</b></span><span>שובצו חלקית: <b>${partial}</b></span><span>לא שובצו: <b>${rows.length-assigned-partial}</b></span></div>
    <div class="table-wrap"><table class="admin-table"><thead><tr><th>מוזמן</th><th>מאושרים</th><th>שובצו</th><th>נותרו</th><th>שולחנות</th><th>פעולה</th></tr></thead><tbody>${rows.map(g=>{
      const mine=st.assignments.filter(a=>String(a.guestId)===String(g.guestId));
      const labels=mine.map(a=>`${esc(byId[String(a.tableId)]?.tableNumber||'—')} (${Number(a.seats)||0})`).join(', ');
      return `<tr><td>${esc(g.name)}</td><td>${g.confirmedCount}</td><td>${g.assignedCount}</td><td>${g.remainingCount}</td><td>${labels||'לא שובץ'}</td><td><button type="button" data-seat-guest="${esc(g.guestId)}">${mine.length?'שינוי שיוך':'שיוך'}</button></td></tr>`
    }).join('')||'<tr><td colspan="6">אין מוזמנים שאישרו הגעה</td></tr>'}</tbody></table></div>`;
}
function openSeatingGuestV170_(gid){
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
  return '<div class="guest-seating-v174"><span>'+assigned+' / '+count+' · '+(names?esc(names):'לא שובץ')+'</span> <button type="button" data-seat-guest="'+esc(gid)+'" '+(!st?'disabled title="טוען שיוכים"':'')+'>'+(mine.length?'שינוי שיוך':'שיוך')+'</button></div>';
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
