/* FIX67Q60 — Synthetic load UI, based on Q40. No real-send API is used here. */
async function waSimulationOpenQ42_(){
  if(state.session?.role!=='Admin'||!state.activeEventId)return;
  const eventId=String(state.activeEventId),token=state.session.token,ownerId=String(state.session.id);
  modal(`<section id="waSimPanelQ42" dir="rtl"><h2>בדיקת עומס ללא שליחה</h2><p class="wa-bulk-state-v13"><strong>הדמיה בלבד — לא נשלחות הודעות לטלפונים.</strong><br>נוצרות100–500 רשומות סינתטיות. אין צורך בנמענים אמיתיים. הנתונים נשמרים ביומן הדמיה נפרד.</p><div class="form-grid"><label>מספר רשומות להדמיה<select id="waSimTotalQ42"><option>100</option><option>200</option><option>500</option></select></label><label>תרחיש<select id="waSimScenarioQ42"><option value="SUCCESS">בדיקה רגילה</option><option value="REJECTION">בדיקת דחייה</option><option value="RESPONSE_LOSS">בדיקת תקלה והמשך</option></select></label></div><details><summary>פרטים למנהל המערכת</summary><label>השהיה מדומה לכל קבוצת מקביליות<select id="waSimDelayQ42"><option value="200">0.2 שנייה</option><option value="0">ללא השהיה</option><option value="1000">שנייה אחת</option></select></label><p>זוהי בחירה לצורך ההדמיה, ולא זמן מענה שנמדד ב־Meta. בין המנות נשמרת השהיית המערכת של5 שניות.</p><p id="waSimSettingsQ42"></p><dl id="waSimTimingQ42"></dl><p class="muted">הבדיקה משתמשת בנתוני דמה וביומן נפרד. אין מדידת שליחה אמיתית או תחזית ביצועי PROD.</p><button type="button" class="secondary" id="waSimInspectQ42" disabled>בדוק מצב ללא הרצה</button></details><p>בחר בדיקה ולחץ על התחלה. בבדיקת תקלה נבקש ממך להמשיך פעם אחת; בבדיקת דחייה צפויה רשומה אחת שנדחתה.</p><p><strong id="waSimCountsQ42">טרם התחילה הדמיה</strong></p><progress id="waSimBarQ42" max="100" value="0" style="width:100%" aria-label="התקדמות הדמיה"></progress><p id="waSimStatusQ42" role="status" aria-live="polite">בודק אם קיימת הדמיה להמשך…</p><p id="waSimResultQ43" role="status" aria-live="polite"></p><div id="waSimManualQ43" hidden><label>דוח הבדיקה — ניתן להעתיק ידנית<textarea id="waSimTextQ43" readonly rows="10" style="width:100%;direction:ltr;text-align:left"></textarea></label><button type="button" class="secondary" id="waSimCopyReadyQ43">העתק דוח מוכן</button><p>אם ההעתקה חסומה, לחץ בתוך הדוח, הקש Ctrl+A ואז Ctrl+C.</p></div><div class="actions"><button type="button" class="primary" id="waSimStartQ42" disabled>התחל בדיקה חדשה</button><button type="button" class="primary" id="waSimResumeQ42" hidden>המשך בדיקה</button><button type="button" class="danger" id="waSimStopQ42" hidden>■ עצור הדמיה</button><button type="button" class="secondary" id="waSimReportQ42" disabled>העתק דוח הדמיה</button><button type="button" class="secondary" id="waSimCloseQ42">סגור</button></div></section>`);
  const panel=document.querySelector('#waSimPanelQ42'),get=id=>panel.querySelector('#'+id),status=get('waSimStatusQ42');
  let run=null,busy=false,stopRequested=false,stopPending=false,needsInspection=false,ready=false;
  const samples=[];let windowStarted=null,windowEnded=null,pauseMs=0,reportBusy=false,preparedText="";
  const current=()=>document.querySelector('#waSimPanelQ42')===panel&&state.session?.token===token&&String(state.activeEventId)===eventId;
  const number=ms=>(Number(ms||0)/1000).toFixed(2)+' שניות';
  const accept=response=>{const r=response?.record;if(response?.simulation!==true||!r||r.mode!=='SIMULATION'||r.eventId!==eventId||r.ownerId!==ownerId)throw new Error('תשובת ההדמיה אינה תואמת למשתמש ולאירוע');waProgressStateQ33_(r.total,r.next,r.completed,r.rejected);return r;};
  const render=()=>{
    if(!current())return;
    const active=run&&['ACTIVE','RUNNING','REVIEW'].includes(run.state);
    get('waSimStartQ42').disabled=!ready||busy||reportBusy||needsInspection||!!active;
    get('waSimResumeQ42').hidden=!(run?.state==='ACTIVE'||needsInspection);get('waSimResumeQ42').disabled=busy||reportBusy||stopRequested;
    get('waSimInspectQ42').disabled=!ready||busy;get('waSimReportQ42').disabled=!run||busy||reportBusy;
    get('waSimStopQ42').hidden=!active;get('waSimStopQ42').disabled=stopPending||stopRequested;get('waSimStopQ42').textContent=stopPending?'מבקש עצירת הדמיה…':run?.state==='REVIEW'?'סיים את ההדמיה ללא המשך':'■ עצור הדמיה';
    for(const id of ['waSimTotalQ42','waSimScenarioQ42','waSimDelayQ42'])get(id).disabled=busy||!!active;
    if(!run)return;
    const model=waProgressStateQ33_(run.total,run.next,run.completed,run.rejected);
    get('waSimBarQ42').value=model.percent;get('waSimBarQ42').setAttribute('aria-valuetext',`${run.next} מתוך ${run.total} בהדמיה`);
    get('waSimCountsQ42').textContent=`טופלו בהדמיה ${run.next}/${run.total} · הושלמו בדמה ${run.completed} · נדחו בדמה ${run.rejected} · ${run.state==='STOPPED'?'בוטלו':'טרם טופלו'} ${run.total-run.next}`;
    get('waSimSettingsQ42').textContent=`מנה ${run.batchSize} · מקביליות ${run.concurrency} · השהיה מדומה לקבוצה ${run.delayMs} אלפיות שנייה`;
    get('waSimTimingQ42').innerHTML=`<dt>יצירת נתוני דמה בשרת</dt><dd>${number(run.timings.syntheticBuildMs)}</dd><dt>המתנה מדומה שנמדדה בשרת</dt><dd>${number(run.timings.simulatedWaitMs)}</dd><dt>כתיבה ליומן הדמיה</dt><dd>${number(run.timings.journalMs)}</dd><dt>בקשות הרצה בחלון הנוכחי, כולל תקשורת</dt><dd>${number(samples.reduce((a,x)=>a+x.browserMs,0))}</dd><dt>השהיות בין מנות בחלון הנוכחי</dt><dd>${number(pauseMs)}</dd>`;
  };
  const pause=async()=>{const at=performance.now();while(performance.now()-at<WA_BATCH_PAUSE_F14Z7_MS&&current()&&!stopRequested)await new Promise(r=>setTimeout(r,200));pauseMs+=performance.now()-at;};
  const loop=async()=>{
    if(busy||needsInspection||!run||run.state!=='ACTIVE')return;
    busy=true;stopRequested=false;windowEnded=null;if(windowStarted===null)windowStarted=performance.now();render();
    try{
      while(current()&&!stopRequested&&run.state==='ACTIVE'){
        status.textContent=`מריץ מנה מדומה החל מרשומה ${run.next+1}… אין שליחת הודעות.`;
        const at=performance.now(),r=await API.request('runWhatsAppSimulationBatchQ42',{eventId,id:run.id,offset:run.next});
        if(!current())return;
        samples.push({browserMs:performance.now()-at,serverCallMs:r.serverCallMs,apiMs:r.apiTiming?.totalMs??null});
        if(r.pauseForReview&&r.pauseReason==='REJECTION'){run=accept(r);render();status.textContent='נרשמה הדחייה הצפויה. הבדיקה ממשיכה עם יתר הרשומות.';if(run.state==='ACTIVE')await pause();continue;}
        if(r.pauseForReview){needsInspection=true;status.textContent='הודגמה תקלה בעדכון המסך. לחץ ״המשך בדיקה״; המערכת תבדוק מה כבר טופל ותמשיך רק עם היתרה. לא נותקה הרשת.';break;}
        run=accept(r);render();if(run.state!=='ACTIVE')break;
        status.textContent='ממתין5 שניות לפני המנה המדומה הבאה…';await pause();
      }
      if(!needsInspection&&current())status.textContent=run.state==='DONE'?'ההדמיה הסתיימה. ניתן להעתיק דוח ולבדוק התאמה ליומן. לא נשלחו הודעות אמיתיות.':run.state==='STOPPED'?'ההדמיה נעצרה; היתרה בוטלה.':'ההרצה נעצרה. בדוק מצב לפני המשך.';
    }catch(error){if(current()){needsInspection=true;status.textContent='ההדמיה נעצרה: '+String(error?.message||error)+' — לחץ ״בדוק מצב ללא הרצה״ לפני המשך. לא נשלחות הודעות אמיתיות.';}}
    finally{windowEnded=performance.now();busy=false;render();if(current()&&run?.state==='DONE')await verifyResult();}
  };
  get('waSimStartQ42').onclick=async()=>{
    if(busy||reportBusy||!ready)return;busy=true;render();status.textContent='יוצר תוכנית הדמיה…';
    try{const r=await API.request('beginWhatsAppSimulationQ42',{eventId,total:Number(get('waSimTotalQ42').value),delayMs:Number(get('waSimDelayQ42').value),scenario:get('waSimScenarioQ42').value});if(!current())return;run=accept(r);needsInspection=false;stopRequested=false;samples.length=0;pauseMs=0;windowStarted=performance.now();windowEnded=null;preparedText="";get('waSimManualQ43').hidden=true;get('waSimResultQ43').textContent="";busy=false;await loop();}
    catch(error){if(current()){status.textContent='לא התחילה הדמיה: '+String(error?.message||error);needsInspection=true;}}
    finally{busy=false;render();}
  };
  get('waSimResumeQ42').onclick=async()=>{
    if(busy||reportBusy||stopRequested)return;
    busy=true;render();status.textContent='בודק התקדמות שמורה לפני המשך…';
    try{const response=run?await API.request('inspectWhatsAppSimulationQ42',{eventId,id:run.id}):await API.request('latestWhatsAppSimulationQ42',{eventId});if(!current())return;run=response.record?accept(response):null;needsInspection=false;
      if(run?.state!=='ACTIVE'){status.textContent=run?.state==='RUNNING'?'מנה עדיין בטיפול. המתן ולחץ שוב על המשך.':run?.state==='REVIEW'?'נמצאה בעיה הדורשת בדיקת מנהל המערכת. אין המשך אוטומטי.':'אין יתרה להמשך.';return;}
      status.textContent=`טופלו ${run.next} מתוך ${run.total}. ממשיך עם ${run.total-run.next} הנותרות…`;
    }catch(error){needsInspection=true;if(current())status.textContent='לא ניתן לאמת את ההתקדמות: '+String(error?.message||error);return;}
    finally{busy=false;render();}
    await loop();
  };
  get('waSimInspectQ42').onclick=async()=>{
    if(busy||reportBusy||!ready)return;busy=true;render();status.textContent='בודק התקדמות שמורה ללא הרצה…';
    try{const r=run?await API.request('inspectWhatsAppSimulationQ42',{eventId,id:run.id}):await API.request('latestWhatsAppSimulationQ42',{eventId});if(!current())return;run=r.record?accept(r):null;needsInspection=false;stopRequested=false;status.textContent=run?.state==='ACTIVE'?'ההתקדמות אומתה. ניתן ללחוץ ״המשך בדיקה״.':run?.state==='RUNNING'?'מנה מדומה עדיין בטיפול בשרת. בדוק שוב לאחר סיומה.':run?.state==='REVIEW'?'נדרש בירור ביומן ההדמיה. ניתן לסיים הדמיה זו וליצור חדשה.':'אין הדמיה פעילה להמשך.';}
    catch(error){if(current())status.textContent='בדיקת המצב נכשלה: '+String(error?.message||error);}
    finally{busy=false;render();}
  };
  get('waSimStopQ42').onclick=async()=>{
    if(!run||stopPending||stopRequested)return;stopRequested=true;stopPending=true;render();status.textContent='מבקש עצירת הדמיה…';
    try{const r=await API.request('stopWhatsAppSimulationQ42',{eventId,id:run.id});if(!current())return;const stopped=accept(r);if(!busy||stopped.state!=='RUNNING')run=stopped;status.textContent=stopped.state==='RUNNING'?'העצירה התקבלה; הקבוצה המדומה שכבר התחילה עשויה להסתיים.':'ההדמיה הסתיימה ללא שליחה אמיתית.';}
    catch(error){if(current()){stopRequested=false;needsInspection=true;status.textContent='לא אומתה עצירה: '+String(error?.message||error)+' — בדוק מצב.';}}
    finally{stopPending=false;render();}
  };
  const makeText=report=>JSON.stringify({...report,frontendVersion:APP_VERSION.FRONTEND_VERSION,browser:{scope:'חלון הדמיה נוכחי בלבד; הזמן כולל הפסקות עד סיום ההרצה ולא המתנה להעתקת הדוח',elapsedMs:windowStarted===null?null:(windowEnded??performance.now())-windowStarted,pauseMs,batchCalls:samples}},null,2);
  const showReport=text=>{preparedText=text;get('waSimTextQ43').value=text;get('waSimManualQ43').hidden=false;};
  const verifyResult=async()=>{
    reportBusy=true;render();get('waSimResultQ43').textContent='בודק את תוצאות הבדיקה מול היומן…';
    try{const report=await API.request('reportWhatsAppSimulationQ42',{eventId,id:run.id});if(!current())return;run=accept(report);
      const expected=run.scenario==='REJECTION'?1:0;
      const passed=run.state==='DONE'&&run.next===run.total&&run.completed===run.total-expected&&run.rejected===expected&&report.journal?.consistent===true&&report.journal.rows===run.total&&report.journal.uniqueRows===run.total&&report.journal.duplicates===0;
      get('waSimResultQ43').textContent=passed?`הבדיקה עברה. טופלו ${run.total} רשומות, ${run.rejected} נדחו כצפוי, ללא כפילויות ובהתאמה מלאה ליומן.`:'נמצאה בעיה בתוצאות הבדיקה. יש להעביר את הדוח לבדיקה.';
      preparedText=makeText(report);
    }catch(error){if(current())get('waSimResultQ43').textContent='לא ניתן לאמת את תוצאות הבדיקה. נסה להפיק דוח: '+String(error?.message||error);}
    finally{reportBusy=false;render();}
  };
  const copyPrepared=async()=>{const text=preparedText;if(!text)return;showReport(text);try{await navigator.clipboard.writeText(text);if(current())status.textContent='דוח ההדמיה הועתק. אפשר להדביק אותו בצ׳אט.';}catch(error){if(current())status.textContent='ההעתקה האוטומטית לא הצליחה. הדוח מוצג כאן להעתקה ידנית, או לחץ ״העתק דוח מוכן״ כשהחלון פעיל.';}};
  get('waSimCopyReadyQ43').onclick=copyPrepared;
  get('waSimReportQ42').onclick=async()=>{
    if(!run||busy||reportBusy)return;reportBusy=true;render();get('waSimReportQ42').textContent='מכין דוח…';status.textContent='מכין דוח בדיקה… יש להישאר בחלון עד לסיום.';
    try{const report=await API.request('reportWhatsAppSimulationQ42',{eventId,id:run.id});if(!current())return;accept(report);preparedText=makeText(report);await copyPrepared();}
    catch(error){if(current())status.textContent='לא ניתן להכין דוח: '+String(error?.message||error);}
    finally{reportBusy=false;if(current())get('waSimReportQ42').textContent='העתק דוח הדמיה';render();}
  };
  get('waSimCloseQ42').onclick=()=>closeModal();
  try{const response=await API.request('latestWhatsAppSimulationQ42',{eventId});if(!current())return;run=response.record?accept(response):null;ready=true;status.textContent=run&&['ACTIVE','RUNNING','REVIEW'].includes(run.state)?'נמצאה הדמיה קודמת. בדוק את מצבה לפני המשך; פתיחת החלון אינה מריצה אותה.':'מוכן להדמיה חדשה. לא יישלחו הודעות אמיתיות.';render();if(run?.state==='DONE')await verifyResult();}
  catch(error){if(current()){status.textContent='לא ניתן לבדוק הדמיה קודמת: '+String(error?.message||error);ready=true;needsInspection=true;get('waSimInspectQ42').disabled=false;}}
}
