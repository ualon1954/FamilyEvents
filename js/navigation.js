/* V1.1.90A19P2F14Z55 */
(async function(){
 const out=document.getElementById('content'),toggle=document.getElementById('themeToggle');
 let theme='dark';try{const x=localStorage.getItem('events_navigation_theme');if(x==='light'||x==='dark')theme=x}catch(_){}
 function applyTheme(){document.documentElement.dataset.theme=theme;toggle.textContent=theme==='dark'?'☀️ מצב בהיר':'🌙 מצב כהה'}
 toggle.onclick=()=>{theme=theme==='dark'?'light':'dark';applyTheme();try{localStorage.setItem('events_navigation_theme',theme)}catch(_){}};applyTheme();
 const eventId=new URLSearchParams(location.search).get('eventId');
 const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n};
 const svgLogo=(kind)=>{
  const wrap=el('span',undefined,'nav-logo');
  wrap.setAttribute('aria-hidden','true');
  if(kind==='waze'){
   wrap.innerHTML='<svg viewBox="0 0 64 64" role="img"><path d="M11 30c0-12 9-21 22-21 12 0 21 8 21 20 0 9-5 16-13 20H25c-9 0-16-6-16-14 0-2 .6-4 2-5z" fill="#fff" stroke="#16344a" stroke-width="3"/><circle cx="26" cy="28" r="2.4" fill="#16344a"/><circle cx="38" cy="28" r="2.4" fill="#16344a"/><path d="M25 36c4 4 10 4 14 0" fill="none" stroke="#16344a" stroke-width="3" stroke-linecap="round"/><circle cx="23" cy="50" r="6" fill="#16344a"/><circle cx="43" cy="50" r="6" fill="#16344a"/></svg>';
  }else{
   wrap.innerHTML='<svg viewBox="0 0 64 64" role="img"><path d="M32 4C18 4 9 14 9 27c0 17 23 33 23 33s23-16 23-33C55 14 46 4 32 4z" fill="#fff"/><path d="M32 7c-8 0-15 4-19 11l14 10 5-21z" fill="#4285F4"/><path d="M13 18c-2 3-3 6-3 10 0 6 3 12 8 18l10-17-15-11z" fill="#EA4335"/><path d="M18 46c5 6 14 12 14 12s7-5 13-11L32 32 18 46z" fill="#34A853"/><path d="M55 27c0-8-4-14-10-18L32 31l13 16c6-7 10-14 10-20z" fill="#FBBC04"/><circle cx="32" cy="27" r="8" fill="#1a73e8"/></svg>';
  }
  return wrap;
 };
 const navCard=(kind,title,subtitle,href)=>{
  const a=el('a',undefined,'navcard '+kind);a.href=href;a.target='_blank';a.rel='noopener';a.setAttribute('aria-label',subtitle);
  const arrow=el('span','‹','nav-arrow');
  const copy=el('span',undefined,'nav-copy');copy.append(el('span',title,'nav-title'),el('span',subtitle,'nav-sub'));
  a.append(arrow,copy,svgLogo(kind));return a;
 };
 const fmtDate=raw=>{const m=String(raw||'').match(/^(\d{4})-(\d{2})-(\d{2})/);return m?`${m[3]}/${m[2]}/${m[1]}`:String(raw||'')};
 const call=async body=>{const r=await fetch(APP_CONFIG.API_URL,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(body)}),d=await r.json();if(!d.ok)throw Error(d.error||'הפעולה נכשלה');return d};
 if(!eventId){out.replaceChildren(el('div','מזהה האירוע חסר בקישור הניווט','error'));return}
 try{
  const d=await call({action:'navigationContextZ54D1',eventId}),ev=d.event||{};out.replaceChildren();
  out.append(el('h2',ev.name||'אירוע'));const details=el('section',undefined,'details');
  if(ev.date)details.append(el('p','📅 תאריך: '+fmtDate(ev.date)));if(ev.eventTime)details.append(el('p','🕒 שעה: '+ev.eventTime));if(ev.venue)details.append(el('p','📍 מקום: '+ev.venue));
  if(ev.navigationAddress)details.append(el('p','כתובת: '+ev.navigationAddress,'muted'));out.append(details);
  const address=String(ev.navigationAddress||'').trim();if(!address){out.append(el('div','לא הוגדרה כתובת לניווט עבור האירוע.','error'));return}
  const q=encodeURIComponent(address),actions=el('div',undefined,'actions');
  const waze=navCard('waze','Waze','נווט ב-Waze','https://waze.com/ul?q='+q+'&navigate=yes');
  const google=navCard('google','Google Maps','נווט ב-Google Maps','https://www.google.com/maps/dir/?api=1&destination='+q);
  actions.append(waze,google);out.append(actions);
 }catch(e){out.replaceChildren(el('div',e.message||'לא ניתן לטעון את פרטי האירוע','error'))}
})();
