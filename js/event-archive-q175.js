/* Admin-only archive/restore, persisted server-side; never sends a message. */
let eaBusyQ175=false;
async function eaOpenQ175_(eid,resume){
  if(eaBusyQ175||state.session?.role!=='Admin')return;
  eaBusyQ175=true;if(typeof waCloseInterruptedQ22_==='function')waCloseInterruptedQ22_();const token=state.session.token;
  const shade=document.createElement('div');shade.className='modal-backdrop';shade.style.cssText='position:fixed;inset:0;z-index:12000;background:#000b;display:flex;align-items:center;justify-content:center;padding:16px';
  const box=document.createElement('section');box.className='modal';box.setAttribute('role','dialog');box.setAttribute('aria-modal','true');box.setAttribute('aria-labelledby','eaTitleQ175');box.style.cssText='background:var(--panel,#171d23);color:var(--text,#fff);padding:28px;border:1px solid #64748b;border-radius:20px;width:min(650px,100%);max-height:90vh;overflow:auto;direction:rtl';shade.append(box);document.body.append(shade);
  let r,working=false;
  const close=()=>{if(working)return;shade.remove();eaBusyQ175=false;};
  box.innerHTML='<h2 id="eaTitleQ175">ארכוב ושחזור אירוע</h2><p role="status">טוען פירוט…</p>';
  try{
    r=resume||await API.request('previewEventArchiveQ175',{eventId:eid});if(state.session?.token!==token)throw Error('ההתחברות השתנתה');
    const restore=r.mode==='RESTORE',title=restore?'שחזור אירוע מהארכיון':'ארכוב אירוע';
    box.innerHTML='<h2 id="eaTitleQ175">'+title+'</h2><h3>'+esc(r.eventName||state.events.find(e=>String(e.id)===eid)?.name||eid)+'</h3>'+(r.resume?'<p>קיימת פעולה שמורה. המשך ישלים אותה בלי ליצור פעולה כפולה.</p>':'<div style="overflow:auto"><table style="width:100%"><thead><tr><th>נתונים</th><th>מספר רשומות</th></tr></thead><tbody>'+(r.tables||[]).map(t=>'<tr><td>'+esc(eaTableNameQ175_(t.name))+'</td><td>'+esc(t.count)+'</td></tr>').join('')+'</tbody></table></div><p>רישומי בקרה ומכסה: '+esc(r.controlRecords)+'</p>')+eaDetailsHtmlQ177_(r.recordDetailsQ177)+'<p>'+(restore?'כל הנתונים יחזרו עם המזהים המקוריים. האירוע יישאר לא פעיל עד לבדיקה והפעלה ידנית. אין חידוש אוטומטי של שליחות.':'הנתונים יועתקו לארכיון פרטי ב־Google Drive ויאומתו לפני פינויים מהגיליונות הפעילים. תמונות וקבצים יישמרו. משתמשים ותבניות כלליות לא ישתנו.')+'</p><p>לא נשלחות הודעות WhatsApp. בזמן הפעולה המערכת תהיה במצב תחזוקה.</p>'+(r.resume?'':'<label>להמשך, הקלד את מזהה האירוע: <b dir="ltr">'+esc(eid)+'</b><input id="eaConfirmQ175" dir="ltr" autocomplete="off" style="width:100%;margin:12px 0" /></label>')+'<p id="eaStatusQ175" role="status" aria-live="polite"></p><div class="actions" style="display:flex;flex-wrap:wrap;gap:10px"><button class="primary" id="eaRunQ175" '+(r.resume?'':'disabled')+'>'+(r.resume?'המשך פעולה שמורה':restore?'שחזר אירוע':'ארכב אירוע')+'</button><button class="secondary" id="eaCancelQ175" hidden>ביטול לפני פינוי הנתונים</button><button class="secondary" id="eaCloseQ175">סגור</button></div>';
    const run=box.querySelector('#eaRunQ175'),input=box.querySelector('#eaConfirmQ175'),status=box.querySelector('#eaStatusQ175'),cancel=box.querySelector('#eaCancelQ175');
    box.querySelector('#eaCloseQ175').onclick=close;if(input){input.oninput=()=>run.disabled=input.value.trim()!==eid;input.focus();}
    const canCancel=()=>r?.operationId&&r.mode==='ARCHIVE'&&['SNAPSHOT','COPY','VERIFY'].includes(r.phase);
    cancel.hidden=!canCancel();cancel.onclick=async()=>{cancel.disabled=true;try{await API.request('cancelEventArchiveQ175',{eventId:eid,operationId:r.operationId});location.reload();}catch(e){status.textContent=e.message;cancel.disabled=false;}};
    run.onclick=async()=>{
      if(working)return;working=true;run.disabled=true;cancel.hidden=true;box.querySelector('#eaCloseQ175').disabled=true;run.setAttribute('aria-busy','true');run.innerHTML='<span class="seating-spinner-v171" aria-hidden="true"></span> מבצע…';
      try{
        if(!r.resume)r=await API.request('beginEventArchiveQ175',{eventId:eid,revision:r.revision,confirmEventId:input.value.trim()});
        while(!r.done){if(state.session?.token!==token)throw Error('ההתחברות השתנתה; ניתן להמשיך את הפעולה לאחר התחברות מחדש');status.textContent=eaPhaseQ175_(r)+' · '+Math.min(r.index||0,r.total||0)+' / '+(r.total||0);r=await API.request('continueEventArchiveQ175',{eventId:eid,operationId:r.operationId});}
        box.innerHTML='<h2>'+(r.mode==='RESTORE'?'השחזור הושלם':'הארכוב הושלם')+'</h2><p>'+(r.mode==='RESTORE'?'האירוע שוחזר כלא פעיל. הנתונים והמזהים נשמרו; לא חודשו שליחות.':'נתוני האירוע נשמרו בארכיון ופונו מהגיליונות הפעילים.')+'</p><p>לא נשלחו הודעות.</p><p><a href="'+esc(r.archiveUrl)+'" target="_blank" rel="noopener noreferrer">פתיחת גיליונות הארכיון</a></p><button class="primary" id="eaDoneQ175">סיום ורענון המסכים</button>';
        box.querySelector('#eaDoneQ175').onclick=()=>location.reload();
      }catch(error){status.textContent='הפעולה לא הושלמה: '+String(error.message||error)+'. ניתן לסגור ולפתוח שוב את הארכוב כדי להמשיך מהשלב השמור.';run.textContent='סגור ופתח מחדש להמשך';cancel.hidden=!canCancel();}
      finally{working=false;run.setAttribute('aria-busy','false');const b=box.querySelector('#eaCloseQ175');if(b)b.disabled=false;}
    };
  }catch(error){box.innerHTML='<h2 id="eaTitleQ175">ארכוב ושחזור אירוע</h2><p role="alert">'+esc(error.message||error)+'</p><button id="eaErrorCloseQ175">סגור</button>';box.querySelector('button').onclick=close;}
}
function eaPhaseQ175_(r){return {SNAPSHOT:'שומר עותק מקור',COPY:'מעתיק ומאמת גיליונות',VERIFY:'מאמת שלמות לפני פינוי',DELETE:'מפנה נתונים מהמערכת הפעילה',RESTORE:'משחזר ומאמת נתונים',FINAL_ARCHIVE:'מסיים ארכוב',FINAL_RESTORE:'מסיים שחזור'}[r.phase]||'מבצע פעולה';}
function eaTableNameQ175_(n){return {Events:'פרטי האירוע',Guests:'רשומות מוזמנים בגיליון, כולל מחוקים',Tables:'שולחנות',GuestTableAssignments:'שיוכי שולחנות',WhatsAppLog:'יומן WhatsApp',WhatsAppCosts:'רשומות תיעוד עלות WhatsApp',EventCosts:'הוצאות האירוע',RsvpLinks:'קישורי אישור הגעה',EventImages:'תמונות לפי תבנית',EventPaymentSettings:'הגדרות תשלום',ImportBatches:'היסטוריית ייבוא',ActivityLog:'יומן פעילות'}[n]||n;}
document.addEventListener('click',e=>{const b=e.target.closest('.event-archive-q175');if(b){e.stopPropagation();void eaOpenQ175_(String(b.dataset.id));}},true);
// A maintenance interruption must be discoverable after closing/reopening the app.
let eaCheckedTokenQ175='';const eaResumeTimerQ175=setInterval(async()=>{if(!state.session?.token||state.session.role!=='Admin'||eaCheckedTokenQ175===state.session.token||eaBusyQ175)return;eaCheckedTokenQ175=state.session.token;try{const r=await API.request('getEventArchiveJobQ175',{});if(r.resume)await eaOpenQ175_(r.eventId,r);}catch(e){eaCheckedTokenQ175='';}},2500);

function eaDetailsHtmlQ177_(d){
  if(!d)return '';
  const table=(heads,rows)=>'<div style="overflow:auto"><table style="width:100%"><thead><tr>'+heads.map(x=>'<th>'+esc(x)+'</th>').join('')+'</tr></thead><tbody>'+rows.map(row=>'<tr>'+row.map(x=>'<td>'+esc(x)+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>';
  let html='<p class="muted">הכמויות בטבלה הן רשומות בגיליונות המיועדות לארכוב, ואינן בהכרח הכמויות המוצגות במסכי העבודה. סינון וקיבוץ שורות משפיעים על תצוגת העלויות; הארכוב אינו יוצר עלויות או חיובים.</p>';
  html+='<p><b>מוזמנים שלא נמחקו: '+esc(d.visibleGuestRows)+' · רשומות שנמחקו: '+esc(d.deletedGuestRows)+' · סה״כ בגיליון: '+esc(d.guestRows)+'</b></p>';
  if(d.guests?.length)html+='<details><summary>פירוט רשומות המוזמנים לארכוב</summary>'+table(['שם מוזמן','מזהה','מצב הרשומה'],d.guests.map(g=>[g.name,g.id,g.deleted?'נמחקה — נשמרה בהיסטוריה':'לא נמחקה']))+(d.guestsTruncated?'<p>מוצגות 50 הרשומות הראשונות בלבד.</p>':'')+'</details>';
  if(d.costs?.length)html+='<details><summary>פירוט רשומות תיעוד העלות ('+esc(d.costRows)+')</summary>'+table(['תבנית','אומדן שמור','סטטוס ביומן','הסבר'],d.costs.map(c=>[c.templateName||c.id,c.estimatedIls===null?'לא נשמר':c.estimatedIls+' ₪',c.status||'אין התאמה',c.reason]))+'<p>זהו תיעוד גולמי שנשמר לארכוב. אינו מספר שורות מסך העלויות ואינו חשבונית של Meta.</p>'+(d.costsTruncated?'<p>מוצגות 50 הרשומות הראשונות בלבד.</p>':'')+'</details>';
  return html;
}
