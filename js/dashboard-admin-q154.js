/* Admin overview from authenticated bootstrap data; no health assertions or sends. */
let dashAdminQ154={busy:false,at:'',error:'',token:''};
function dashboardAdminOverviewQ154_(){
 if(state.session?.role!=='Admin')return '';
 if(dashAdminQ154.token!==state.session.token)dashAdminQ154={busy:false,at:'',error:'',token:state.session.token};
 const events=(state.events||[]).filter(e=>!e.archivedAt),users=state.adminData.users||[],types=state.eventTypes||[],connections=state.adminData.whatsapp||[];
 const card=(label,count,action,tone)=>'<button type="button" class="dash-card-q123 '+tone+'" data-admin-dash-q154="'+action+'" '+(!count?'disabled':'')+'><span>'+label+'</span><strong>'+count+'</strong><small>'+(!count?'אין פריטים להצגה':'לניהול וצפייה ←')+'</small></button>';
 const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Jerusalem',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
 const date=e=>String(e.date||e.eventDate||'').slice(0,10);
 const ordered=[...events].sort((a,b)=>{const ad=date(a),bd=date(b),ap=!!ad&&ad<today,bp=!!bd&&bd<today;if(ap!==bp)return ap?1:-1;return ap?bd.localeCompare(ad):(ad||'9999').localeCompare(bd||'9999');});
 const links=[['users','משתמשים','חשבונות ותפקידי מנהלי אירועים'],['systemValues','הגדרות מערכת','ערכי מערכת ומנגנוני עבודה'],['whatsapp','חיבורי WhatsApp','ניהול חיבורים וסביבות הודעות'],['whatsappCosts','תמחור WhatsApp','תעריפים ואומדני עלויות'],['permissions','הרשאות','בקרת גישה למסכי המערכת'],['roles','תפקידים','ניהול תפקידי המשתמשים'],['versions','גרסאות ואבחון','גרסאות הממשק והשרת'],['activity','יומן פעילות','מעקב אחר פעולות במערכת']];
 return '<section class="dash-admin-overview-q154"><header class="dash-admin-head-q154"><div><span class="dash-admin-eyebrow-q154">ניהול ובקרה</span><h1>מרכז ניהול המערכת</h1><p>סקירת כלל האירועים וקיצורי דרך לכלי הניהול.</p></div><div class="dash-refresh-group-q130"><button type="button" class="dash-refresh-q124" data-admin-dash-q154="refresh" aria-label="רענון נתוני המערכת" title="רענון נתוני המערכת" aria-busy="'+dashAdminQ154.busy+'" '+(dashAdminQ154.busy?'disabled':'')+'>'+refreshButtonContentQ130_(dashAdminQ154.busy)+'</button><span class="dash-updated-q124" role="status">'+(dashAdminQ154.at?refreshStampQ128_(dashAdminQ154.at):'נתוני המערכת נטענו בהתחברות')+'</span></div></header>'+
 '<div class="dash-grid-q123">'+card('אירועים במערכת',events.length,'events','blue')+card('משתמשים במערכת',users.length,'users','violet')+card('סוגי אירועים',types.length,'eventTypes','amber')+card('חיבורי WhatsApp מוגדרים',connections.length,'whatsapp','green')+'</div>'+
 '<p class="dash-admin-note-q154">'+users.filter(u=>isTrue(u.active,true)).length+' משתמשים פעילים · '+users.filter(u=>u.role==='EventManager'&&isTrue(u.active,true)).length+' מנהלי אירועים פעילים. מספר החיבורים מציין הגדרות שמורות; תקינות החיבור נבדקת במסך הניהול.</p>'+
 (dashAdminQ154.error?'<p class="error" role="alert">'+esc(dashAdminQ154.error)+'</p>':'')+
 '<div class="dash-admin-columns-q154"><section class="dash-admin-panel-q154"><div class="dash-section-heading-q130"><h2>אירועים לניהול</h2><button type="button" class="secondary" data-admin-dash-q154="events">כל האירועים</button></div>'+(ordered.length?'<ul class="dash-admin-events-q154">'+ordered.slice(0,5).map(e=>{const id=String(e.eventId||e.id),selected=id===String(state.activeEventId);return '<li><button type="button" class="'+(selected?'is-current-q154':'')+'" data-admin-event-q154="'+esc(id)+'"><span><strong>'+esc(e.name||'אירוע')+'</strong><small>'+esc(date(e)?formatDateHE_(date(e)):'טרם נקבע תאריך')+'</small></span><span class="dash-admin-event-count-q154">'+state.guests.filter(g=>String(g.eventId)===id).length+' רשומות מוזמנים<small>'+(selected?'האירוע הנבחר':'לבקרת האירוע ←')+'</small></span></button></li>';}).join('')+'</ul>':'<p class="muted">עדיין לא נוצרו אירועים.</p>')+'<button type="button" class="primary" data-admin-dash-q154="newEvent">יצירת אירוע חדש</button></section>'+
 '<section class="dash-admin-panel-q154"><h2>כלי ניהול המערכת</h2><div class="dash-admin-links-q154">'+links.map(([action,title,description])=>'<button type="button" data-admin-dash-q154="'+action+'"><strong>'+title+'</strong><small>'+description+'</small></button>').join('')+'</div></section></div>'+
 '<nav class="dash-actions-q123" aria-label="בקרה לאירוע הנבחר">'+[['whatsappMonitor','ניטור ותקלות WhatsApp'],['whatsappLog','יומן WhatsApp'],['messages','ניהול תבניות'],['eventCosts','עלויות האירוע']].map(([action,label])=>'<button type="button" data-admin-dash-q154="'+action+'" '+(!state.activeEventId&&action!=='messages'?'disabled':'')+'>'+label+'</button>').join('')+'</nav></section>';
}
async function dashboardAdminRefreshQ154_(){
 if(state.session?.role!=='Admin'||dashAdminQ154.busy)return;
 const token=state.session.token;dashAdminQ154.busy=true;dashAdminQ154.error='';dashboardRenderQ123_();
 try{
  const results=await Promise.allSettled([API.request('bootstrapCoreParallel',{}),API.request('bootstrapAdminParallel',{}),API.request('bootstrapGuestsParallel',{})]);
  if(state.session?.role!=='Admin'||state.session.token!==token)return;
  if(results.some(x=>x.status!=='fulfilled'))throw Error('רענון נתוני המערכת נכשל. הנתונים הקודמים עדיין מוצגים; ניתן לנסות שוב.');
  const [core,admin,guests]=results.map(x=>x.value);
  if(!Array.isArray(core.events)||!Array.isArray(core.eventTypes)||!Array.isArray(admin.adminData?.users)||!Array.isArray(admin.adminData?.whatsapp)||!Array.isArray(guests.guests))throw Error('נתוני הניהול שהתקבלו אינם מלאים. הנתונים הקודמים נשמרו.');
  state.guests=guests.guests;state.events=core.events;state.eventTypes=core.eventTypes;state.activity=core.activity||[];state.adminData=admin.adminData;
  if(state.activeEventId&&!state.events.some(e=>String(e.eventId||e.id)===String(state.activeEventId)))setCurrentEvent_(null);
  dashAdminQ154.at=new Date().toISOString();dashQ123.at='';renderAll();
 }catch(error){if(state.session?.token===token)dashAdminQ154.error=String(error.message||error);}
 finally{if(state.session?.token===token){dashAdminQ154.busy=false;dashboardRenderQ123_();}}
}
function dashboardAdminNavigateQ154_(action){
 if(state.session?.role!=='Admin')return;
 if(action==='refresh')return dashboardAdminRefreshQ154_();
 if(action==='newEvent')return eventForm();
 const pages=['events','activity','messages','whatsappMonitor','whatsappLog','eventCosts'];
 if(pages.includes(action)){if(['whatsappMonitor','whatsappLog','eventCosts'].includes(action)&&!state.activeEventId)return;return showPage(action);}
 if(['users','eventTypes','systemValues','whatsapp','whatsappCosts','permissions','roles','versions'].includes(action)){state.adminTab=action;showPage('admin');renderAdmin();}
}
document.addEventListener('click',e=>{
 if(state.session?.role!=='Admin')return;
 const event=e.target.closest?.('#managerDashboardQ123 [data-admin-event-q154]');
 if(event){const id=event.dataset.adminEventQ154;if(state.events.some(x=>String(x.eventId||x.id)===id))setCurrentEvent_(id);return;}
 const button=e.target.closest?.('#managerDashboardQ123 [data-admin-dash-q154]');if(button&&!button.disabled)void dashboardAdminNavigateQ154_(button.dataset.adminDashQ154);
});
