/* V1.1.90A19P2F14Z58D5D55Z41FIX67Q59 */
(async function(){
 const out=document.getElementById('content');
 const eventId=new URLSearchParams(location.search).get('event')||new URLSearchParams(location.search).get('eventId');
 const el=(tag,text,cls)=>{const e=document.createElement(tag);e.textContent=text;if(cls)e.className=cls;return e};
 if(!eventId){out.replaceChildren(el('p','קישור התשלום חסר מזהה אירוע.','error'));return;}
 try{
  const res=await fetch(APP_CONFIG.API_URL,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({action:'paymentPublicD5D54',eventId})});
  const data=await res.json();if(!data.ok)throw Error(data.error||'לא ניתן לטעון את התשלום');
  if(!data.available){out.replaceChildren(el('p',data.reason||'אפשרות התשלום אינה זמינה עבור אירוע זה','error'));return;}
  const name=el('h2',data.event?.name||'אירוע'),info=el('p','בחרו את אמצעי התשלום המתאים לכם.');
  const methods=el('div','','methods');const labels={bit:'Bit',paybox:'PayBox',other:'תשלום'};
  const logos={
   bit:'<svg viewBox="0 0 64 64" aria-hidden="true"><rect x="3" y="3" width="58" height="58" rx="16" fill="#1279e7"/><text x="32" y="40" font-family="Arial,sans-serif" font-weight="bold" font-size="27" fill="white" text-anchor="middle">bit</text></svg>',
   paybox:'<svg viewBox="0 0 64 64" aria-hidden="true"><rect x="3" y="3" width="58" height="58" rx="16" fill="#fff"/><path d="M18 21h28v22H18z" fill="#00a9dd" rx="5"/><path d="M18 21l14 14 14-14" fill="none" stroke="#fff" stroke-width="4" stroke-linejoin="round"/><text x="32" y="54" font-family="Arial" font-weight="bold" font-size="8" fill="#1680b9" text-anchor="middle">PayBox</text></svg>',
   other:'<svg viewBox="0 0 64 64" aria-hidden="true"><rect x="5" y="13" width="54" height="38" rx="7" fill="#8fc6ff"/><rect x="5" y="23" width="54" height="9" fill="#263d5a"/><rect x="13" y="39" width="17" height="4" rx="2" fill="#263d5a"/></svg>'
  };
  for(const m of data.methods||[]){if(!/^https:\/\//i.test(m.url||''))continue;const a=el('a',undefined,'pay-link');a.href=m.url;a.target='_blank';a.rel='noopener noreferrer';a.setAttribute('aria-label','תשלום באמצעות '+(labels[m.type]||'ספק חיצוני'));const icon=el('span',undefined,'pay-logo');icon.setAttribute('aria-hidden','true');icon.innerHTML=logos[m.type]||logos.other;a.append(icon,el('span',labels[m.type]||'תשלום','pay-title'));methods.append(a)}
  if(!methods.children.length){out.replaceChildren(el('p','אפשרות התשלום אינה זמינה עבור אירוע זה','error'));return;}
  out.replaceChildren(name,info,methods,el('p','התשלום מתבצע באתר חיצוני. אין להזין פרטי כרטיס באתר זה.','note'));
 }catch(e){out.replaceChildren(el('p',e.message||'אירעה שגיאה בטעינת התשלום','error'))}
})();
