/* V1.1.90A19P2F14Z58D5D55Z41FIX67Q59 */
const SESSION_CONFIG = Object.freeze({
  SESSION_KEY: "events_management_session",
  SESSION_HOURS: 1
});

// Real interaction only: background polling never advances this timestamp.
let sessionActivityTokenQ31='',sessionActivityAtQ31=0,sessionActivityAckQ31=0,sessionActivityFlightQ31=null,sessionActivityLastTryQ31=0;
function sessionActivityResetQ31_(){sessionActivityTokenQ31='';sessionActivityAtQ31=0;sessionActivityAckQ31=0;sessionActivityLastTryQ31=0;sessionActivityFlightQ31=null;}
async function sessionActivityFlushQ31_(){
  const session=state.session,now=Date.now();
  if(!session?.token)return;
  if(sessionActivityTokenQ31!==session.token){sessionActivityResetQ31_();sessionActivityTokenQ31=session.token;}
  if(session.expiresAt<=now)throw new Error('Session expired');
  if(sessionActivityFlightQ31)return sessionActivityFlightQ31;
  if(!sessionActivityAtQ31||sessionActivityAtQ31<=sessionActivityAckQ31||now-sessionActivityAtQ31>120000||now-sessionActivityLastTryQ31<60000&&session.expiresAt-now>60000)return;
  const token=session.token,activity=sessionActivityAtQ31;sessionActivityLastTryQ31=now;
  const flight=API.request('touchSessionActivityQ31',{token,activityAgeMsQ31:Math.max(0,now-activity)},{skipActivityQ31:true}).then(r=>{
    if(state.session?.token!==token)return;
    if(!Number.isFinite(r.sessionExpiresAtQ31)||r.sessionExpiresAtQ31<=Date.now())throw new Error('Session activity acknowledgement invalid');
    state.session.expiresAt=r.sessionExpiresAtQ31;state.session.idleMinutesQ32=r.idleMinutesQ32;sessionActivityAckQ31=activity;saveSession();
  }).finally(()=>{if(sessionActivityFlightQ31===flight)sessionActivityFlightQ31=null;});
  sessionActivityFlightQ31=flight;return flight;
}
function sessionActivityInstallQ31_(){
  for(const type of ['pointerdown','keydown','wheel','input'])document.addEventListener(type,event=>{
    if(!event.isTrusted||!state.session?.token)return;
    if(state.session.expiresAt<=Date.now()){clearSession();showToast('ההתחברות הסתיימה עקב חוסר פעילות. יש להתחבר מחדש.','error');return;}
    if(sessionActivityTokenQ31!==state.session.token){sessionActivityResetQ31_();sessionActivityTokenQ31=state.session.token;}
    sessionActivityAtQ31=Date.now();void sessionActivityFlushQ31_().catch(()=>{});
  },{capture:true,passive:true});
  setInterval(()=>{void sessionActivityFlushQ31_().catch(()=>{});},30000);
  window.addEventListener('storage',event=>{
    if(event.key!==SESSION_CONFIG.SESSION_KEY)return;
    try{const other=JSON.parse(event.newValue||'null');if(other?.token===state.session?.token&&Number.isFinite(other.expiresAt))state.session.expiresAt=Math.max(state.session.expiresAt,other.expiresAt);}catch(ignore){}
  });
}
