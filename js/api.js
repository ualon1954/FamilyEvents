/* V1.1.90A19P2F14Z58D5D55Z41FIX67Q60 */
// Compact browser-side failures only. Never store request payloads or credentials.
function waRecordClientIssueQ17_(action,kind,httpStatus){
  try{
    if(typeof state==='undefined'||state.session?.role!=='Admin')return;
    const key='wa_client_issues_q17';let rows=[];
    try{const value=JSON.parse(localStorage.getItem(key)||'[]');if(Array.isArray(value))rows=value;}catch(ignore){}
    rows.push({at:new Date().toISOString(),eventId:String(state.activeEventId||''),action:String(action||'').slice(0,80),kind:String(kind||'').slice(0,40),httpStatus:Number(httpStatus)||0});
    localStorage.setItem(key,JSON.stringify(rows.slice(-20)));
  }catch(ignore){}
}
const API = {
  async request(action, payload={}, options={}) {
    const traceQ35=action==='sendAnyTemplateTestBatchD5D49'&&options?.traceQ35&&typeof options.traceQ35==='object'?options.traceQ35:null;
    const markQ35=key=>{if(traceQ35)try{traceQ35[key]=performance.now();}catch(ignore){}};
    markQ35('apiEnteredAt');
    if(action!=='login'&&action!=='touchSessionActivityQ31'&&!options.skipActivityQ31&&typeof sessionActivityFlushQ31_==='function')await sessionActivityFlushQ31_().catch(()=>{});
    const body={action, ...payload};
    if(state?.session?.token && !body.token) body.token=state.session.token;
    if (!APP_CONFIG.API_URL || APP_CONFIG.API_URL.includes("PASTE_")) {
      throw new Error("כתובת ה-API אינה מוגדרת ב-config.js. יש להכניס את כתובת ה-Web App של Apps Script.");
    }
    const isSendAction = action === "sendOneInvitationV1190A14" || action === "sendInvitationBatchF14U" || action === "sendAnyTemplateTestBatchD5D49" || action === "sendAnyTemplateToGuest" || action === "sendOneInvitationToTestNumberA19P2F8";
    let res;
    const timeoutMs=Number(options?.timeoutMs)||0;
    const controller=timeoutMs>0?new AbortController():null;
    const timeoutId=controller?setTimeout(()=>controller.abort(),timeoutMs):null;
    try {
      const serializedQ35=JSON.stringify(body);markQ35('fetchStartedAt');
      res = await fetch(APP_CONFIG.API_URL, {
        method:"POST",
        headers:{"Content-Type":"text/plain;charset=utf-8"},
        body:serializedQ35,
        ...(controller?{signal:controller.signal}:{})
      });
      markQ35('headersReceivedAt');
    } catch (cause) {
      markQ35('failedAt');
      waRecordClientIssueQ17_(action,'NETWORK',0);
      if(timeoutId!==null)clearTimeout(timeoutId);
      if(controller?.signal.aborted && !isSendAction)
        throw new Error(`השרת לא השיב בתוך ${Math.round(timeoutMs/1000)} שניות`);
      if (!isSendAction) throw cause;
      const error = new Error("לא התקבל אישור מהשרת. ייתכן שההודעות כבר נשלחו; יש לבדוק את יומן WhatsApp לפני ניסיון נוסף.");
      error.deliveryUncertain = true;
      error.cause = cause;
      throw error;
    }
    let raw;
    try { raw=await res.text();markQ35('bodyReceivedAt'); }
    catch(cause) {
      markQ35('failedAt');
      waRecordClientIssueQ17_(action,'RESPONSE_BODY',res.status);
      const error=new Error(isSendAction?'קריאת תשובת השליחה נכשלה. מצב השליחה אינו ידוע; יש לבדוק יומן והתאוששות לפני ניסיון נוסף.':String(cause?.message||cause));
      error.deliveryUncertain=isSendAction;error.cause=cause;throw error;
    }
    finally { if(timeoutId!==null)clearTimeout(timeoutId); }
    let data;
    try { data = JSON.parse(raw);markQ35('parsedAt');if(traceQ35){traceQ35.apiTiming=data.apiTiming;traceQ35.dispatchStages=data.dispatchStagesQ35;} }
    catch (err) {
      waRecordClientIssueQ17_(action,'NON_JSON',res.status);
      // A Google Apps Script redirect/login/error page can arrive as HTML even
      // after Meta accepted the message. Never imply that retrying is safe.
      const ambiguous = isSendAction;
      const message = ambiguous
        ? "לא התקבל אישור JSON מהשרת. ייתכן שההזמנה כבר נשלחה; בדוק ב-WhatsApp לפני ניסיון נוסף. בדוק גם את כתובת פריסת Apps Script והרשאות הגישה שלה."
        : "השרת החזיר תשובה שאינה JSON. בדוק את כתובת פריסת Apps Script והרשאות הגישה שלה.";
      const error = new Error(message + " (HTTP " + res.status + ")");
      error.deliveryUncertain = ambiguous;
      throw error;
    }
    if (!data.ok){waRecordClientIssueQ17_(action,'API_ERROR',res.status);throw new Error(data.error || data.message || "שגיאת API לא ידועה");}
    return data;
  }
};

const MockAPI = {
  events:[
    {id:"EVT-001",name:"חתונה לדוגמה",type:"חתונה",date:"2026-12-20",venue:"אולם לדוגמה",status:"Active"},
    {id:"EVT-002",name:"בר מצווה לדוגמה",type:"בר מצווה",date:"2027-03-14",venue:"",status:"Planning"}
  ],
  tables:[
    {id:"TBL-001",eventId:"EVT-001",tableNumber:"1",seats:10},
    {id:"TBL-002",eventId:"EVT-001",tableNumber:"2",seats:12}
  ],
  guests:[
    {id:"GST-001",guestId:"GST-001",eventId:"EVT-001",name:"ישראל ישראלי",phone:"0501234567",side:"חתן",group:"משפחה",invitedCount:2,confirmedCount:2,rsvpStatus:"Confirmed",notes:"",sendWhatsApp:true},
    {id:"GST-002",guestId:"GST-002",eventId:"EVT-001",name:"דנה כהן",phone:"0525555555",side:"כלה",group:"חברים",invitedCount:1,confirmedCount:0,rsvpStatus:"Pending",notes:"",sendWhatsApp:true}
  ],
  lookups:{
    sides:[
      {id:"SIDE-1",value:"חתן",label:"חתן",active:true,sortOrder:10},
      {id:"SIDE-2",value:"כלה",label:"כלה",active:true,sortOrder:20},
      {id:"SIDE-3",value:"משותף",label:"משותף",active:true,sortOrder:30}
    ],
    groups:[
      {id:"GRP-1",value:"משפחה",label:"משפחה",active:true,sortOrder:10},
      {id:"GRP-2",value:"חברים",label:"חברים",active:true,sortOrder:20},
      {id:"GRP-3",value:"קולגות",label:"קולגות",active:true,sortOrder:30},
      {id:"GRP-4",value:"הורים",label:"הורים",active:true,sortOrder:40},
      {id:"GRP-5",value:"אחר",label:"אחר",active:true,sortOrder:50}
    ],
    statuses:[
      {id:"STS-1",value:"Pending",label:"ממתין",active:true,sortOrder:10},
      {id:"STS-2",value:"Confirmed",label:"אישר",active:true,sortOrder:20},
      {id:"STS-3",value:"Declined",label:"לא מגיע",active:true,sortOrder:30}
    ]
  },
  users:[{id:"USR-1",name:"Admin",email:"admin@family.local",role:"Admin",active:true}],
  roles:[
    {id:"ROL-1",value:"Admin",label:"מנהל מערכת",active:true,sortOrder:10},
    {id:"ROL-2",value:"Family",label:"משפחה",active:true,sortOrder:20},
    {id:"ROL-3",value:"Guest",label:"אורח",active:true,sortOrder:30}
  ],
  permissions:[],
  whatsapp:[],
  activity:[],
  async request(action,p={}) {
    const ok=(data={})=>Promise.resolve({ok:true,...data});
    if(action==="login"){
      if(p.email==="admin@family.local" && p.password==="admin123") return ok({session:{token:"demo",id:"USR-1",name:"Admin",email:p.email,role:"Admin",expiresAt:Date.now()+8*3600e3},serverVersion:APP_VERSION.FRONTEND_VERSION});
      throw new Error("שם משתמש או סיסמה שגויים");
    }
    if(action==="bootstrap") return ok({
      serverVersion:APP_VERSION.FRONTEND_VERSION,
      events:this.events,guests:this.guests,tables:this.tables,activity:this.activity,lookups:this.lookups,
      adminData:{users:this.users,roles:this.roles,permissions:this.permissions,whatsapp:this.whatsapp}
    });
    if(action==="saveEvent"){const x={...p.event};if(!x.id)x.id="EVT-"+Date.now();const i=this.events.findIndex(e=>e.id===x.id);i<0?this.events.push(x):this.events[i]=x;this.log("שמירת אירוע",x.name);return ok({event:x});}
    if(action==="deleteEvent"){this.events=this.events.filter(e=>e.id!==p.id);this.guests=this.guests.filter(g=>g.eventId!==p.id);return ok();}
    if(action==="diagnoseEventTypeAssignmentsV146") return ok({checked:this.events.length,issueCount:0,issues:[]});
    if(action==="repairEventTypeAssignmentsV146") return ok({changedCount:0,changes:[],backup:null,diagnosisAfter:{issueCount:0,issues:[]}});
    if(action==="saveGuest"){const x={...p.guest,sendWhatsApp:p.guest.sendWhatsApp!==false&&String(p.guest.sendWhatsApp)!=="false"};if(!x.id)x.id="GST-"+Date.now();x.guestId=x.guestId||x.id;x.invitedCount=+x.invitedCount||1;x.confirmedCount=Math.max(0,+x.confirmedCount||0);x.rsvpStatus=x.confirmedCount>0?"Confirmed":(x.rsvpStatus==="Confirmed"?"Pending":(x.rsvpStatus||"Pending"));const i=this.guests.findIndex(g=>(g.guestId||g.id)===x.guestId);i<0?this.guests.push(x):this.guests[i]=x;return ok({guest:x});}
    if(action==="setGuestSend"){const g=this.guests.find(g=>g.id===p.id);if(g)g.sendWhatsApp=!!p.enabled;return ok({id:p.id,sendWhatsApp:!!p.enabled});}
    if(action==="deleteGuest"){this.guests=this.guests.filter(g=>(g.guestId||g.id)!==p.id);return ok();}
    if(action==="saveTable"){const x={...p.table,seats:+p.table.seats||0};if(!x.id)x.id="TBL-"+Date.now();const i=this.tables.findIndex(t=>t.id===x.id);i<0?this.tables.push(x):this.tables[i]=x;return ok({table:x});}
    if(action==="deleteTable"){const occupied=this.guests.some(g=>g.tableId===p.id);if(occupied)throw new Error("לא ניתן למחוק שולחן שיש בו מקומות תפוסים");this.tables=this.tables.filter(t=>t.id!==p.id);return ok();}
    if(action==="saveLookup"){const a=this.lookups[p.kind];const x={...p.item,active:p.item.active!==false&&String(p.item.active)!=="false"};if(!x.id)x.id=p.kind.toUpperCase()+"-"+Date.now();const i=a.findIndex(v=>v.id===x.id);i<0?a.push(x):a[i]=x;return ok({item:x});}
    if(action==="deleteLookup"){this.lookups[p.kind]=this.lookups[p.kind].filter(x=>x.id!==p.id);return ok();}
    if(action==="saveUser"){const x={...p.user,active:p.user.active!==false&&String(p.user.active)!=="false"};delete x.password;if(!x.id)x.id="USR-"+Date.now();const i=this.users.findIndex(v=>v.id===x.id);i<0?this.users.push(x):this.users[i]=x;return ok({user:x});}
    if(action==="deleteUser"){this.users=this.users.filter(x=>x.id!==p.id);return ok();}
    if(action==="saveRole"){const x={...p.role,active:p.role.active!==false&&String(p.role.active)!=="false"};if(!x.id)x.id="ROL-"+Date.now();const i=this.roles.findIndex(v=>v.id===x.id);i<0?this.roles.push(x):this.roles[i]=x;return ok({role:x});}
    if(action==="deleteRole"){this.roles=this.roles.filter(x=>x.id!==p.id);return ok();}
    if(action==="savePermission"){const x={...p.permission,allowed:p.permission.allowed!==false&&String(p.permission.allowed)!=="false"};if(!x.id)x.id="PRM-"+Date.now();const i=this.permissions.findIndex(v=>v.id===x.id);i<0?this.permissions.push(x):this.permissions[i]=x;return ok({permission:x});}
    if(action==="deletePermission"){this.permissions=this.permissions.filter(x=>x.id!==p.id);return ok();}
    if(action==="saveWhatsAppConfig"){const x={...p.config,enabled:p.config.enabled!==false&&String(p.config.enabled)!=="false",hasAccessToken:!!(p.config.accessToken||p.config.hasAccessToken),hasVerifyToken:!!(p.config.webhookVerifyToken||p.config.hasVerifyToken)};delete x.accessToken;delete x.webhookVerifyToken;if(!x.id)x.id="WA-"+Date.now();const i=this.whatsapp.findIndex(v=>v.id===x.id);i<0?this.whatsapp.push(x):this.whatsapp[i]=x;return ok({config:x});}
    if(action==="deleteWhatsAppConfig"){this.whatsapp=this.whatsapp.filter(x=>x.id!==p.id);return ok();}
    return ok();
  },
  log(action,details){this.activity.unshift({at:new Date().toLocaleString("he-IL"),user:"Admin",action,details});}
};
