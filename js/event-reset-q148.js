/* Coordinated event reset: explicit preview, confirmation, busy state, no sends. */
let eventResetBusyQ148=false,eventResetCompletedQ148=false;
function eventResetSameQ148_(eid,token){return state.session?.role==='Admin'&&state.session.token===token&&String(state.activeEventId)===eid;}
async function eventResetOpenQ148_(button){
  if(eventResetBusyQ148||state.session?.role!=='Admin'||!state.activeEventId)return;
  const eid=String(state.activeEventId),token=state.session.token;eventResetBusyQ148=true;button.disabled=true;button.textContent='טוען פירוט…';
  try{
    const r=await API.request('previewEventResetQ148',{eventId:eid});if(!eventResetSameQ148_(eid,token))return;
    if(r.eventId!==eid)throw Error('נתוני האיפוס אינם תואמים לאירוע');
    const summary=r.resume?'<p class="error">איפוס קודם לא הושלם. ניתן להמשיך את אותה פעולת איפוס.</p>':'<h3>'+esc(r.eventName)+'</h3><table><tbody>'+[['רשומות יומן למחיקה',r.journalRows],['רשומות עלות WhatsApp למחיקה',r.whatsAppCosts],['הוצאות ידניות למחיקה',r.manualCosts],['רישומי בקרה וחסימות לאיפוס',r.controlRecords],['שורות ארכיון למחיקה',r.archiveRows],['אישורי מסירה ממתינים למחיקה',r.deliveryRows],['אישורי הגעה לאיפוס',r.rsvpRows],['שיוכי שולחנות למחיקה',r.assignmentRows],['מוזמנים שיישמרו',r.guestsPreserved]].map(([k,v])=>'<tr><th>'+esc(k)+'</th><td>'+esc(String(v))+'</td></tr>').join('')+'</tbody></table>';
    if(r.blocked===true){
      modal('<section dir="rtl" id="eventResetDialogQ148"><h2>פירוט לפני איפוס</h2>'+(r.countsUnavailable?'<h3>'+esc(r.eventName)+'</h3><p>לא ניתן להשלים את ספירת הנתונים עד לבירור רישומי הבקרה.</p>':summary)+eventResetBlockedHtmlQ150_(r)+'<div class="actions"><button type="button" id="eventResetRecheckQ150">רענון הפירוט</button><button type="button" class="secondary" id="eventResetBlockedCloseQ150">סגור</button></div></section>');
      document.getElementById('eventResetBlockedCloseQ150').onclick=()=>closeModal();
      document.getElementById('eventResetRecheckQ150').onclick=()=>{if(!eventResetBusyQ148)void eventResetOpenQ148_(button);};
      return;
    }
    modal('<section dir="rtl" id="eventResetDialogQ148"><h2>איפוס מסודר של אירוע בדיקה</h2>'+summary+'<p><strong>הפעולה מוחקת את היסטוריית הבדיקות ואת כל עלויות האירוע במערכת, לרבות הוצאות ידניות.</strong> חיובים שכבר נוצרו ב־WhatsApp אינם מבוטלים.</p><p>פרטי האירוע, רשימת המוזמנים, הגדרות השולחנות, התבניות והתמונות נשמרים. אישורי ההגעה יתאפסו ל״ממתין״, מספר המאשרים יתאפס וכל שיוכי השולחנות יימחקו. גם ניסיונות שנכשלו, חסימות, מסעות פתוחים ורשומות שחזור של אירוע הבדיקה יימחקו ללא הסדרה. חיוויי ההודעות יחזרו ל״טרם נשלחה״. <strong>לא ייווצר גיבוי ולא ניתן לשחזר את נתוני הבדיקה שנמחקו.</strong></p><p>יש לסגור חלונות שליחה פתוחים ולבצע את האיפוס כשאין משתמשים שעורכים נתונים.</p><label>להמשך, הקלד את מזהה האירוע: <b dir="ltr">'+esc(eid)+'</b><input id="eventResetIdQ148" dir="ltr" autocomplete="off"></label><label><input type="checkbox" id="eventResetAckQ148"> אני מאשר למחוק ללא גיבוי את נתוני הבדיקה, לרבות הודעות, עלויות, אישורי הגעה ושיוכי שולחנות.</label><p id="eventResetStatusQ148" role="status" aria-live="polite"></p><div class="actions"><button type="button" id="eventResetCommitQ148" disabled>'+(r.resume?'המשך איפוס שנקטע':'אפס את נתוני הבדיקה ללא גיבוי')+'</button><button type="button" class="secondary" id="eventResetCancelQ148">ביטול</button></div></section>');
    const id=document.getElementById('eventResetIdQ148'),ack=document.getElementById('eventResetAckQ148'),commit=document.getElementById('eventResetCommitQ148');
    const validate=()=>{commit.disabled=eventResetBusyQ148||id.value.trim()!==eid||!ack.checked;};id.addEventListener('input',validate);ack.addEventListener('change',validate);
    document.getElementById('eventResetCancelQ148').onclick=()=>{if(!eventResetBusyQ148)closeModal();};
    commit.onclick=async()=>{
      if(eventResetBusyQ148||id.value.trim()!==eid||!ack.checked||!eventResetSameQ148_(eid,token))return;
      eventResetBusyQ148=true;commit.disabled=true;id.disabled=ack.disabled=true;document.getElementById('eventResetCancelQ148').disabled=true;commit.innerHTML='<span class="seating-spinner-v171" aria-hidden="true"></span><span>מאפס את נתוני הבדיקה…</span>';commit.setAttribute('aria-busy','true');
      const output=document.getElementById('eventResetStatusQ148');output.textContent='יש להמתין לאישור סיום. אין להתחיל שליחה בזמן האיפוס.';
      try{
        const done=await API.request('commitEventResetQ148',{eventId:eid,confirmEventId:id.value.trim(),revision:r.revision,operationId:r.operationId,acknowledgement:'RESET_ALL_TEST_EVENT_NO_BACKUP'});
        if(done.reset!==true||done.eventId!==eid||done.sent!==0||!done.operationId||done.backupCreated!==false)throw Error('לא התקבל אישור איפוס תקין');
        if(!eventResetSameQ148_(eid,token))return;
        for(const key of ['wa_client_issues_q17','wa_batch_timings_q35','wa_delivery_timings_q53']){try{const rows=JSON.parse(localStorage.getItem(key)||'[]');if(Array.isArray(rows))localStorage.setItem(key,JSON.stringify(rows.filter(x=>String(x.eventId)!==eid)));}catch(ignore){}}
        localStorage.setItem('event_reset_notice_q148',JSON.stringify({eventId:eid,operationId:done.operationId,at:Date.now()}));
        eventResetCompletedQ148=true;
        const dialog=document.getElementById('eventResetDialogQ148');dialog.innerHTML='<h2>האיפוס הושלם</h2><p>היומן, העלויות ונתוני בקרת ההודעות של האירוע אופסו. רשימת המוזמנים נשמרה. אישורי ההגעה ושיוכי השולחנות אופסו. לא נוצר גיבוי. לא נשלחו הודעות.</p><button type="button" id="eventResetReloadQ148">סיום ורענון כל המסכים</button>';
        document.getElementById('eventResetReloadQ148').onclick=()=>location.reload();
      }catch(error){output.textContent='לא התקבל אישור סיום: '+String(error.message||error)+' יש לפתוח שוב את פירוט האיפוס; אם הפעולה התחילה, תוצע המשכיות לאותה פעולה. אין לבצע ניקוי ידני.';commit.textContent='יש לפתוח פירוט מחדש';}
      finally{eventResetBusyQ148=false;commit.setAttribute('aria-busy','false');const cancel=document.getElementById('eventResetCancelQ148');if(cancel){cancel.disabled=false;cancel.textContent='סגור';}}
    };
  }catch(error){if(eventResetSameQ148_(eid,token))showToast(String(error.message||error),'error');}
  finally{eventResetBusyQ148=false;button.disabled=false;button.textContent='הצג פירוט לפני איפוס';}
}
document.addEventListener('click',e=>{if(eventResetCompletedQ148&&!e.target.closest('#eventResetDialogQ148')){e.preventDefault();e.stopImmediatePropagation();location.reload();return;}const button=e.target.closest('#eventResetPreviewQ148');if(button)void eventResetOpenQ148_(button);},true);
window.addEventListener('storage',e=>{if(e.key!=='event_reset_notice_q148'||!e.newValue)return;try{const r=JSON.parse(e.newValue);if(String(state.activeEventId)===r.eventId)location.reload();}catch(ignore){}});

function eventResetBlockedHtmlQ150_(r){
  const rows=Array.isArray(r.blockers)?r.blockers:[];
  return '<h3>מה מונע את ביצוע האיפוס?</h3><p class="error">'+esc(r.blockedReason||'קיימים רישומי בקרה שדורשים בירור')+'</p><p>הפירוט נפתח ללא מחיקה וללא שליחת הודעות. עצם קיומו של סמן אינו מוכיח שהשליחה עדיין פועלת; רישום ישן יכול להישאר אחרי ניסיון שנקטע.</p><div style="overflow-x:auto"><table><thead><tr><th>סוג הרישום</th><th>אירוע</th><th>מצב שמור</th><th>מועד שמור</th><th>מזהה</th><th>רישומים</th></tr></thead><tbody>'+rows.map(x=>'<tr><td>'+esc(x.type)+'</td><td>'+esc(x.scope)+'<br>'+esc(x.eventId||'—')+'</td><td>'+esc(x.state)+'</td><td>'+esc(x.at||'לא נשמר')+'</td><td>'+esc(x.reference||'—')+'</td><td>'+esc(String(x.records))+'</td></tr>').join('')+'</tbody></table></div><p>אין צורך לשלוח הודעות נוספות. רענן את הפירוט לאחר סיום פעולה פעילה. אם הרישומים נשארים, ניתן להעתיק את הדוח שלהלן כדי לזהות פעולה שלא הסתיימה.</p><details><summary>דוח חסימות להעתקה</summary><textarea readonly dir="ltr" style="width:100%;min-height:180px" aria-label="דוח חסימות איפוס">'+esc(JSON.stringify({eventId:r.eventId,blockers:rows},null,2))+'</textarea></details>';
}
