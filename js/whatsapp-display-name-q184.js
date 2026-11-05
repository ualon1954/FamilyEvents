/* Admin-only explicit inspection. No timer, no send, no rename. */
let waNameSerialQ184=0,waNameTokenQ184=null;
function waDisplayNameRoleQ184_(){
  const token=state.session?.token||null;
  if(waNameTokenQ184===token&&state.session?.role==='Admin')return;
  waNameTokenQ184=token;waNameSerialQ184++;
  const out=document.getElementById('waNameResultQ184'),b=document.getElementById('waNameCheckQ184');
  if(out)out.textContent='';
  if(b){waSetSendingF14V_(b,false);b.disabled=false;b.removeAttribute('aria-busy');}
}
function waNameHtmlQ184_(r){
  const field=(label,value)=>`<dt>${esc(label)}</dt><dd>${esc(value||'לא הוחזר מידע')}</dd>`;
  const status=s=>s?`${s.label||'לא ידוע'}${s.code&&s.code!=='UNAVAILABLE'?' · '+s.code:''}`:'לא הוחזר מידע';
  return `<dl class="wa-confirm-details-v1190a16">${field('מספר השולח',r.displayPhoneNumber)}${field('מזהה מספר ב־Meta',r.phoneNumberId)}${field('השם הרשום ב־Meta',r.currentName)}${field('סטטוס השם הרשום',r.currentStatusReadable?status(r.currentStatus):'Meta לא החזירה את שדה הסטטוס; ייתכן שאינו זמין לחשבון או להרשאה הנוכחית')}${field('השם שהתבקש בשינוי',r.requestedName)}${field('סטטוס בקשת השינוי',r.changeStatusReadable?status(r.changeStatus):'לא התקבל סטטוס בקשת שינוי. אין להסיק שהבקשה נדחתה או שאין בקשה')}${field('מועד הבדיקה',r.checkedAt?new Date(r.checkedAt).toLocaleString('he-IL'):'' )}</dl><p class="muted">${esc(r.notice||'')}</p><p>הבדיקה הסתיימה ללא שליחת הודעות וללא שינוי שם התצוגה.</p>`;
}
async function waCheckDisplayNameQ184_(b){
  if(state.session?.role!=='Admin'||b.disabled)return;
  waDisplayNameRoleQ184_();
  const out=document.getElementById('waNameResultQ184'),token=state.session?.token,serial=++waNameSerialQ184;
  const current=()=>serial===waNameSerialQ184&&state.session?.role==='Admin'&&state.session?.token===token&&document.getElementById('waNameResultQ184')===out;
  b.setAttribute('aria-busy','true');waSetSendingF14V_(b,true,'בודק מול Meta…');out.textContent='קורא את פרטי שם התצוגה…';
  try{
    const r=await API.request('getWhatsAppDisplayNameQ184',{});if(!current())return;
    if(r?.readOnly!==true||r.sent!==0)throw Error('התקבלה תשובת אבחון לא תקינה.');
    out.innerHTML=waNameHtmlQ184_(r);
  }catch(error){if(current())out.textContent='הבדיקה לא הושלמה: '+String(error?.message||'שגיאה לא ידועה');}
  finally{if(current()){waSetSendingF14V_(b,false);b.disabled=false;b.removeAttribute('aria-busy');}}
}
document.addEventListener('click',e=>{const b=e.target?.closest?.('#waNameCheckQ184');if(b)void waCheckDisplayNameQ184_(b);});
