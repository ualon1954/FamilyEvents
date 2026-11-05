/* One event-wide quota panel; server is authoritative for every dispatch. */
let quotaSerialQ161=0,quotaStateQ161=null,quotaKeyQ161='',quotaSavingQ161=false;
const quotaUpdatedQ195=new Map();let quotaLoadingQ195=false;
function quotaRefreshMarkupQ195_(){
 const at=quotaUpdatedQ195.get(JSON.stringify([state.session?.token,String(state.activeEventId)]));
 const stamp=at?refreshStampQ128_(at):'טרם עודכן עבור האירוע הנבחר';
 return '<div class="quota-refresh-q195"><button type="button" class="secondary" id="quotaRefreshQ161" aria-label="רענון יתרת מכסת ההודעות" aria-busy="'+quotaLoadingQ195+'" '+(quotaSavingQ161||quotaLoadingQ195?'disabled':'')+'>'+refreshButtonContentQ130_(quotaLoadingQ195)+'</button><span id="quotaUpdatedQ195" role="status" aria-live="polite">'+stamp+'</span></div>';
}
const quotaApiQ161=API.request.bind(API);
function quotaSummaryTextQ161_(){const valid=quotaKeyQ161===JSON.stringify([state.session?.token,String(state.activeEventId)]),q=quotaStateQ161;return valid&&!q?.error&&q?'מכסת האירוע: '+q.limit+' · נוצלו: '+q.used+' · יתרה זמינה: '+q.remaining+(q.reserved?' · שמורות לטיפול: '+q.reserved:''):'יתרת המכסה אינה זמינה כרגע';}
function quotaSummaryMarkupQ161_(){return '<p data-quota-summary-q161 role="status" class="quota-modal-q161">'+esc(quotaSummaryTextQ161_())+'</p>';}
async function quotaEnsureQ161_(count){const eventId=String(state.activeEventId),token=state.session.token;const r=await quotaApiQ161('getEventWhatsAppQuotaQ161',{eventId});if(state.session?.token!==token||String(state.activeEventId)!==eventId)throw Error('האירוע או ההתחברות השתנו. יש לפתוח מחדש את חלון השליחה');quotaStateQ161=r.quota;quotaUpdatedQ195.set(JSON.stringify([state.session?.token,String(state.activeEventId)]),new Date());quotaKeyQ161=JSON.stringify([token,eventId]);quotaRenderQ161_();if(count>r.quota.remaining)throw Error('אין מספיק יתרה במכסת ההודעות: נבחרו '+count+' הודעות, והיתרה היא '+r.quota.remaining+'. יש לפנות למנהל המערכת להגדלת המכסה.');}
function quotaRenderQ161_(){
 document.querySelectorAll('[data-quota-summary-q161]').forEach(node=>node.textContent=quotaSummaryTextQ161_());
 const host=document.getElementById('eventWhatsAppQuotaQ161');if(!host)return;
 const allowed=['Admin','EventManager'].includes(state.session?.role)&&!!state.activeEventId;host.hidden=!allowed;if(!allowed)return;
 const q=quotaStateQ161,valid=quotaKeyQ161===JSON.stringify([state.session.token,String(state.activeEventId)]),admin=state.session.role==='Admin';
 host.innerHTML='<div class="quota-heading-q161"><strong>מכסת הודעות לאירוע</strong>'+quotaRefreshMarkupQ195_()+'</div>'+
 (!valid?'<p role="status">טוען מכסה…</p>':q?.error?'<p class="quota-warning-q161" role="alert">'+esc(q.error)+'</p>':
 '<div class="quota-values-q161"><span>מכסה <b>'+q.limit+'</b></span><span>נוצלו <b class="quota-used-q192">'+q.used+'</b></span><span class="'+(q.remaining===0?'quota-warning-q161':'')+'">יתרה זמינה <b class="quota-remaining-q192">'+q.remaining+'</b></span>'+(q.reserved?'<span>שמורות לטיפול <b>'+q.reserved+'</b></span>':'')+'</div>'+
 (q.remaining===0?'<p class="quota-warning-q161">אין יתרה זמינה לשליחה. '+(admin?'יש להגדיל את המכסה.':'יש לפנות למנהל המערכת להגדלת המכסה.')+'</p>':'')+
 '<details class="quota-help-q194"><summary>מידע על המכסה</summary><small>הניצול כולל גם הודעות קודמות של האירוע ומתבסס על הודעות שהתקבלו לשליחה ב־WhatsApp, הודעות שנכשלו אינן צורכות מכסה, גם אם הכשל נרשם לאחר הקבלה לשליחה. הודעות שבטיפול או שתוצאתן אינה ודאית שומרות מקום במכסה. זו מכסת הודעות, ולא סכום החיוב.</small></details>'+ 
 (admin?'<details class="quota-edit-q194" '+(quotaSavingQ161?'open':'')+'><summary>עריכת מכסה</summary><form id="quotaFormQ161"><label for="quotaLimitQ161">מכסה כוללת</label><input id="quotaLimitQ161" type="number" min="0" max="1000000" step="1" required value="'+q.limit+'" '+(quotaSavingQ161?'disabled':'')+'><button type="submit" class="primary" '+(quotaSavingQ161?'disabled':'')+'>'+(quotaSavingQ161?'<span class="seating-spinner-v171" aria-hidden="true"></span> שומר…':'שמירת מכסה')+'</button><span id="quotaSaveStatusQ161" role="status"></span></form></details>':''));
 const refresh=document.getElementById('quotaRefreshQ161');if(refresh)refresh.onclick=()=>quotaLoadQ161_();
 const form=document.getElementById('quotaFormQ161');if(form)form.onsubmit=async e=>{e.preventDefault();if(quotaSavingQ161)return;const input=document.getElementById('quotaLimitQ161');if(!input.reportValidity())return;const eventId=String(state.activeEventId),token=state.session.token,limit=Number(input.value);quotaSavingQ161=true;quotaRenderQ161_();try{const r=await quotaApiQ161('saveEventWhatsAppQuotaQ161',{eventId,limit});if(state.session?.token===token&&String(state.activeEventId)===eventId){quotaStateQ161=r.quota;quotaUpdatedQ195.set(JSON.stringify([state.session?.token,String(state.activeEventId)]),new Date());quotaRenderQ161_();showToast('מכסת ההודעות נשמרה');}}catch(error){if(state.session?.token===token&&String(state.activeEventId)===eventId)showToast(error.message||String(error),'error');}finally{quotaSavingQ161=false;quotaRenderQ161_();}};
}
async function quotaLoadQ161_(){
 const token=state.session?.token,eventId=String(state.activeEventId||''),serial=++quotaSerialQ161;if(!token||!eventId||!['Admin','EventManager'].includes(state.session.role)){quotaStateQ161=null;quotaLoadingQ195=false;quotaRenderQ161_();return;}
 const key=JSON.stringify([token,eventId]);quotaLoadingQ195=true;if(quotaKeyQ161!==key){quotaKeyQ161='';quotaStateQ161=null;}quotaRenderQ161_();
 try{const r=await quotaApiQ161('getEventWhatsAppQuotaQ161',{eventId});if(serial!==quotaSerialQ161||state.session?.token!==token||String(state.activeEventId)!==eventId)return;quotaStateQ161=r.quota;quotaUpdatedQ195.set(JSON.stringify([state.session?.token,String(state.activeEventId)]),new Date());quotaKeyQ161=key;}
 catch(error){if(serial!==quotaSerialQ161||state.session?.token!==token||String(state.activeEventId)!==eventId)return;quotaStateQ161={error:error.message||String(error)};quotaKeyQ161=key;}if(serial===quotaSerialQ161)quotaLoadingQ195=false;quotaRenderQ161_();
}
const quotaOriginalContextQ161=renderCurrentEventContext_;
renderCurrentEventContext_=function(){const r=quotaOriginalContextQ161.apply(this,arguments);void quotaLoadQ161_();return r;};
API.request=async function(action,payload={},options={}){
 const sending=/^(?:send|retryFailedWhatsAppLog)/.test(action),refresh=sending||['beginWhatsAppCampaignFIX59','finishWhatsAppCampaignFIX59','stopProductionCampaignQ104','commitEventResetQ148','getWhatsAppDeliveryStatusesFIX24','singleWhatsAppStatusQ141'].includes(action);
 try{return await quotaApiQ161(action,payload,options);}finally{if(refresh)void quotaLoadQ161_();}
};
