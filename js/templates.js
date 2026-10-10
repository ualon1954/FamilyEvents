/* V1.1.90A19P2F14Z58D5D53 */
// A19P2F3 — Admin draft templates only; no Meta changes or sending.
let tplRowsA19P2=[],tplEditingA19P2=null,tplBusyA19P2=false,tplViewA19P2=false,tplSystemSettingsD5D5=[];
// D5D14 — client cache: navigation back to Templates must not refetch unchanged data.
let tplAllRowsCacheD5D14=null,tplCacheOwnerD5D14='',tplLoadPromiseD5D14=null;
function tplCacheOwnerKeyD5D14_(){const s=state.session||{};return [s.userId||s.email||s.name||'',s.role||''].join('|');}
function tplInvalidateListCacheD5D14_(){tplAllRowsCacheD5D14=null;tplLoadPromiseD5D14=null;tplCacheOwnerD5D14=tplCacheOwnerKeyD5D14_();}
function tplApplyCachedRowsD5D14_(){const admin=state.session?.role==='Admin',env=admin?String(tplEl('tplSyncEnvironment')?.value||'PRODUCTION').toUpperCase():'PRODUCTION';tplRowsA19P2=(tplAllRowsCacheD5D14||[]).filter(x=>(admin||String(x.active).toLowerCase()==='true')&&String(x.environment||'PRODUCTION').toUpperCase()===env);tplRenderA19P2();}
function tplPatchCachedTemplateD5D14_(t){if(!t||!Array.isArray(tplAllRowsCacheD5D14))return;const i=tplAllRowsCacheD5D14.findIndex(x=>String(x.id)===String(t.id));if(i>=0)tplAllRowsCacheD5D14[i]=Object.assign({},tplAllRowsCacheD5D14[i],t);else tplAllRowsCacheD5D14.push(t);}

// F14Z18 — V3 BODY is read from Meta; there is no hard-coded local copy.
const TPL_V3_META_NAME_F14F='family_event_invitation_v3';
function tplAlignV3BodyF14F_(){return false;}
async function tplSyncAllFromMetaF14Z32_(){const environment=tplEl('tplSyncEnvironment')?.value||'PRODUCTION';return API.request('syncAllMetaTemplatesF14Z50',{environment});}

const tplEl=id=>document.getElementById(id);
// F14Z52 — invalidate the WhatsApp send/template preview caches after template settings or image changes.
// This replaces the missing legacy helper that caused template image save/remove to fail in the UI.
function tplInvalidateWaSendCacheF14G_(){
  if(typeof state!=='object'||!state)return;
  if(typeof waInvalidateTestTemplateCacheD33==='function')waInvalidateTestTemplateCacheD33();
  if(state.waSendTemplatesCacheF14G instanceof Map)state.waSendTemplatesCacheF14G.clear();
  else state.waSendTemplatesCacheF14G=new Map();
  if(state.waSendTemplateImagesF14G instanceof Map)state.waSendTemplateImagesF14G.clear();
  else state.waSendTemplateImagesF14G=new Map();
}
function tplNoticeA19P2(text,error=false,inside=false){const e=tplEl(inside?'tplEditorNotice':'tplNotice');if(e){e.textContent=text;e.style.color=error?'#ef6b72':'#45c68c';}}
function tplLoadingA19P2(text){tplEl('tplList').innerHTML='<span class="tpl-spinner" aria-hidden="true"></span>'+esc(text);}
async function tplLoadA19P2(force=false){const role=state.session?.role||'';if(!['Admin','EventManager'].includes(role)){tplEl('tplList').textContent='אין הרשאה לצפייה בתבניות';return;}const admin=role==='Admin';tplEl('tplSyncMeta').hidden=!admin;tplEl('tplSyncEnvironment').hidden=!admin;tplEl('tplAdminNote').hidden=!admin;tplEl('tplManagerNote').hidden=admin;tplEl('tplPageTitle').textContent=admin?'ניהול תבניות WhatsApp':'תבניות WhatsApp';const owner=tplCacheOwnerKeyD5D14_();if(owner!==tplCacheOwnerD5D14){tplAllRowsCacheD5D14=null;tplLoadPromiseD5D14=null;tplCacheOwnerD5D14=owner;}if(!force&&Array.isArray(tplAllRowsCacheD5D14)){tplApplyCachedRowsD5D14_();return;}tplLoadingA19P2('טוען תבניות…');try{if(force)tplLoadPromiseD5D14=null;if(!tplLoadPromiseD5D14)tplLoadPromiseD5D14=API.request('listMessageTemplatesA19P2');const r=await tplLoadPromiseD5D14;tplLoadPromiseD5D14=null;tplSystemSettingsD5D5=[];tplAllRowsCacheD5D14=Array.isArray(r.templates)?r.templates:[];tplApplyCachedRowsD5D14_();}catch(e){tplLoadPromiseD5D14=null;tplEl('tplList').textContent='לא ניתן לטעון תבניות';tplNoticeA19P2(e.message,true);}}
function tplPurposeLabelF14Z32_(p){return ({invitation:'הזמנה לאירוע',rsvp_update:'תזכורת לאישור הגעה',table_update:'שיוך שולחנות וניווט',table_payment_update:'שיוך שולחנות, ניווט ותשלום',thank_you:'תודה למשתתפים'})[String(p||'')]||String(p||'');}
function tplRenderA19P2(){const admin=state.session?.role==='Admin';tplEl('tplList').innerHTML=tplRowsA19P2.length?tplRowsA19P2.map(x=>{const imageHeader=tplHasImageHeaderD5D8(x);const edit=admin?`<button type="button" class="guest-icon-action-v179 edit" data-tpl-edit="${esc(x.id)}" title="${admin?'עריכת הגדרות':'החלפת תמונת התבנית'}" aria-label="${admin?'עריכת':'תמונת'} ${esc(x.name)}">✎</button>`:'';const send='';return `<div class="tpl-row" data-tpl-row="${esc(x.id)}" title="לחיצה כפולה לתצוגה"><span><strong>${esc(x.name)}</strong>${admin?' · '+esc(String(x.environment||'PRODUCTION'))+' · '+(String(x.active).toLowerCase()==='true'?'פעילה':'לא פעילה'):''}</span><span class="tpl-row-actions">${send}${edit}</span></div>`}).join(''):'אין תבניות זמינות.';}
function tplEventTypeOptionsA19P2(selected=''){const select=tplEl('tplEventType'),types=Array.isArray(state.eventTypes)?state.eventTypes:[],value=String(selected||'');const rows=types.filter(t=>isTrue(t.active,true)||String(t.name||'')===value||String(t.eventTypeId||t.id||'')===value);select.innerHTML='<option value="">כל סוגי האירועים</option>'+rows.map(t=>`<option value="${esc(String(t.name||''))}">${esc(String(t.name||''))}</option>`).join('');if(value&&!rows.some(t=>String(t.name||'')===value))select.insertAdjacentHTML('beforeend',`<option value="${esc(value)}">${esc(value)} (ערך שמור)</option>`);select.value=value;}

/* F14Z58D5D5 — template-variable mapping belongs to the template editor, not System Values. */
const tplMappingSourcesD5D5={personalGreeting:'פנייה אישית',guestName:'שם המוזמן',eventName:'שם האירוע',eventDetails:'פרטי האירוע',eventDate:'תאריך האירוע',eventTime:'שעת האירוע',eventVenue:'מקום האירוע',eventAddress:'כתובת האירוע',tableText:'שיוך שולחן',extraNotesText:'הערות נוספות',eventSignature:'חתימת האירוע'};
function tplMappingKeyD5D5(metaName){return 'WHATSAPP_TEMPLATE_MAPPING::'+String(metaName||'').trim();}
function tplMappingReadD5D5(t){if(t?.mapping&&typeof t.mapping==='object')return t.mapping;const r=tplSystemSettingsD5D5.find(x=>String(x.key)===tplMappingKeyD5D5(t?.metaName));if(r?.value){try{return JSON.parse(r.value)}catch(e){}}return {body:{},buttons:{}};}
function tplMappingTokensD5D5(t){return [...String(t?.body||'').matchAll(/\{\{\s*([^{}]+?)\s*\}\}/g)].map(m=>String(m[1]).trim());}
function tplHasImageHeaderD5D8(t){try{const c=JSON.parse(String(t?.metaComponentsJson||'[]'));return Array.isArray(c)&&c.some(x=>String(x.type||'').toUpperCase()==='HEADER'&&String(x.format||'').toUpperCase()==='IMAGE');}catch(e){return false;}}
function tplMappingContextD5D6(text,tok){const src=String(text||''),needle='{{'+tok+'}}';let line=src.split(/\r?\n/).find(x=>x.includes(needle));if(!line){const i=src.indexOf(needle);if(i<0)return '';line=src.slice(Math.max(0,i-28),Math.min(src.length,i+needle.length+28));}line=line.replace(/\s+/g,' ').trim();if(line.length>90){const i=line.indexOf(needle),a=Math.max(0,i-32),b=Math.min(line.length,i+needle.length+32);line=(a?'…':'')+line.slice(a,b)+(b<line.length?'…':'');}return line;}
function tplWhatsAppPreviewHtmlD5D10(text){
  let h=esc(String(text||''));
  h=h.replace(/\*([^*\n]+)\*/g,'<strong>$1</strong>');
  h=h.replace(/_([^_\n]+)_/g,'<em>$1</em>');
  h=h.replace(/~([^~\n]+)~/g,'<del>$1</del>');
  return h.replace(/\r?\n/g,'<br>');
}
function tplAutoGrowBodyD5D7(){const e=tplEl('tplBody');if(!e)return;e.style.height='auto';e.style.height=Math.max(92,e.scrollHeight+2)+'px';}
function tplCurrentMappingD5D6(){const body={};tplEl('tplMappingD5D5')?.querySelectorAll('[data-tpl-map-token-d5d5]').forEach(x=>body[x.dataset.tplMapTokenD5d5]=x.value);return {body,buttons:{}};}
function tplRenderMappingD5D5(t){let box=tplEl('tplMappingD5D5');if(!box){box=document.createElement('section');box.id='tplMappingD5D5';box.className='tpl-mapping-d5d5';tplEl('tplBody').closest('label').insertAdjacentElement('afterend',box);}const admin=state.session?.role==='Admin';if(!admin){box.hidden=true;return;}box.hidden=false;const tokens=tplMappingTokensD5D5(t),m=tplMappingReadD5D5(t),opts=Object.entries(tplMappingSourcesD5D5);box.innerHTML=`<h3>מיפוי משתנים</h3><p class="muted">בחר מקור נתון לכל משתנה. השמירה מתבצעת יחד עם הגדרות התבנית.</p>${tokens.length?tokens.map(tok=>`<label class="tpl-map-row-d5d5"><b>{{${esc(tok)}}}</b><small>${esc(tplMappingContextD5D6(t.body,tok))}</small><select data-tpl-map-token-d5d5="${esc(tok)}" ${tplViewA19P2?'disabled':''}><option value="">לא מופה — נדרשת בחירה</option>${opts.map(([v,l])=>`<option value="${esc(v)}" ${String(m.body?.[tok]||'')===v?'selected':''}>${esc(l)}</option>`).join('')}</select></label>`).join(''):'<p class="muted">אין משתני BODY בתבנית זו.</p>'}`;box.querySelectorAll('select').forEach(x=>x.addEventListener('change',tplPreviewA19P2));}
function tplManagerPreviewF14Z32_(t){
 const ev=tplPreviewEventD5D17(),kind=ev?eventTypeName(ev):'אירוע';
 const name=String(ev?.name||kind),date=String(ev?.date||ev?.eventDate||'תאריך האירוע'),time=String(ev?.eventTime||'שעת האירוע'),venue=String(ev?.venue||'מקום האירוע'),address=String(ev?.navigationAddress||'').trim();
 const sources={personalGreeting:'משפחה יקרה',guestName:'ישראל ישראלי',eventName:name,eventDetails:[kind,name,date,time,venue,address?`כתובת: ${address}`:''].filter(Boolean).join(' · '),eventDate:date,eventTime:time,eventVenue:venue,eventAddress:address,tableText:'שולחן 12',extraNotesText:'נשמח לראותכם',eventSignature:String(ev?.messageSignature||'משפחת המארחים')};
 const mapping=tplCurrentMappingD5D6().body;
 const body=String(t?.body||'').replace(/\{\{\s*([^{}]+?)\s*\}\}/g,(match,token)=>{const key=String(token).trim();return sources[mapping[key]]??match;});
 let box=tplEl('tplManagerPreviewF14Z32');if(!box){box=document.createElement('div');box.id='tplManagerPreviewF14Z32';box.className='tpl-manager-preview-f14z27';tplEl('tplEditor')?.querySelector('.tpl-modal-header-d28')?.insertAdjacentElement('afterend',box);}
 const imageHeader=tplHasImageHeaderD5D8(t);
 box.innerHTML=`<p class="muted"><b>אירוע:</b> ${esc(name)} · <b>סוג האירוע:</b> ${esc(kind)} · <b>תמונת הזמנה:</b> <span id="tplPreviewImageStatusD5D27">${ev?.invitationImageFileId?'מצורפת':'לא צורפה'}</span></p><div class="wa-preview-card-f14g">${imageHeader?'<div class="wa-preview-image-wrap-f14g"><img id="tplManagerImageF14Z32" alt="תמונת הזמנה" hidden></div>':''}<div class="wa-preview-body-f14g">${tplWhatsAppPreviewHtmlD5D10(body)}</div><div class="wa-preview-button-f14g">אישור הגעה</div></div>`;
}
// D5D17: event selection controls preview data only, never global template settings.
let tplPreviewEventIdD5D17='';
function tplPreviewEventD5D17(){return (state.events||[]).find(e=>String(eventKey_(e))===String(tplPreviewEventIdD5D17))||null;}
function tplPreviewSelectorD5D17(){
 // D5D30: only the main event selector controls template preview.
 // Remove the legacy inner selector, including one left from an earlier modal open.
 tplEl('tplPreviewEventWrapD5D17')?.remove();
 tplPreviewEventIdD5D17=String(activeEvent()?eventKey_(activeEvent()):'');
}
// D5D19 — one refresh path for every role; image is loaded after its visible DOM target exists.
function tplRefreshEventPreviewD5D19_(){
 if(!tplEditingA19P2)return;
 ++tplImageSeqA19P2; // invalidate an earlier event's pending response
 tplManagerPreviewF14Z32_(tplEditingA19P2);
 if(tplHasImageHeaderD5D8(tplEditingA19P2))void tplShowImageA19P2(tplEditingA19P2);
 else tplSetImageA19P2('');
}
function tplEditA19P2(id,view=false){tplEditingA19P2=tplRowsA19P2.find(x=>String(x.id)===String(id))||null;if(!tplEditingA19P2)return;const admin=state.session?.role==='Admin',imageHeader=tplHasImageHeaderD5D8(tplEditingA19P2);if(!admin)view=true;tplViewA19P2=view;const t=tplEditingA19P2;for(const [field,key] of [['tplName','name'],['tplBody','body'],['tplMetaName','metaName'],['tplMetaStatus','metaStatus'],['tplMetaCategory','metaCategory'],['tplPurpose','purpose']])tplEl(field).value=t[key]||'';tplEl('tplActive').value=String(t.active).toLowerCase()==='true'?'true':'false';tplEl('tplEditorTitle').textContent=admin?(view?'תצוגת תבנית':'עריכת הגדרות תבנית'):(imageHeader?'תמונת התבנית':'תצוגת תבנית');tplNoticeA19P2('',false,true);tplEl('tplShade').hidden=false;tplPreviewEventIdD5D17=String(activeEvent()?eventKey_(activeEvent()):'');tplPreviewSelectorD5D17();tplEl('tplImageArea').hidden=true;tplEl('tplImageInfo').textContent='';tplSetImageA19P2('');tplEl('tplSave').hidden=!admin||view;tplEl('tplCancel').textContent=view||!admin?'סגור':'ביטול';const canImage=false;tplEl('tplRemoveImage').hidden=!canImage;tplEl('tplReplaceImage').hidden=!canImage;tplEl('tplImage').disabled=!canImage;for(const fid of ['tplName','tplPurpose','tplActive'])tplEl(fid).disabled=!admin||view;for(const fid of ['tplBody','tplMetaName','tplMetaStatus','tplMetaCategory'])tplEl(fid).disabled=true;tplAutoGrowBodyD5D7();tplRenderMappingD5D5(t);const manager=!admin;tplRefreshEventPreviewD5D19_();if(manager){tplEl('tplEditor')?.classList.add('tpl-manager-mode-f14z27');}else{tplEl('tplEditor')?.classList.remove('tpl-manager-mode-f14z27');}}
function tplCloseA19P2(){++tplImageSeqA19P2;tplSetImageA19P2('');tplEl('tplShade').hidden=true;tplEditingA19P2=null;}
// D5D22: the upper WhatsApp card is the only preview; mapping changes refresh it.
function tplPreviewA19P2(){
 if(!tplEditingA19P2||tplEl('tplShade')?.hidden)return;
 tplManagerPreviewF14Z32_(tplEditingA19P2);
 const cached=tplEventImageCacheD29.get(String(tplPreviewEventIdD5D17));
 if(cached?.src&&tplHasImageHeaderD5D8(tplEditingA19P2))tplSetImageA19P2(cached.src);
}

async function tplSaveA19P2(){if(tplBusyA19P2||tplViewA19P2||!tplEditingA19P2)return;const name=tplEl('tplName').value.trim();if(!name){tplNoticeA19P2('שם תצוגה הוא שדה חובה',true,true);return;}if(tplRowsA19P2.some(x=>String(x.id)!==String(tplEditingA19P2.id)&&String(x.name||'').trim().toLocaleLowerCase()===name.toLocaleLowerCase())){tplNoticeA19P2('כבר קיימת תבנית בשם זה',true,true);return;}const mapping=tplCurrentMappingD5D6(),missing=Object.entries(mapping.body).filter(([,v])=>!v).map(([k])=>'{{'+k+'}}');if(missing.length){tplNoticeA19P2('יש להשלים מיפוי עבור '+missing.join(', '),true,true);return;}tplBusyA19P2=true;const b=tplEl('tplSave');b.disabled=true;b.innerHTML='<span class="tpl-spinner" aria-hidden="true"></span>שומר…';try{const t={id:tplEditingA19P2.id,name,purpose:tplEl('tplPurpose').value,active:tplEl('tplActive').value==='true'};const sr=await API.request('saveMessageTemplateSettingsD5D14',{template:t,mapping:Object.keys(mapping.body).length?{metaName:tplEditingA19P2.metaName,mapping}:null});if(Object.keys(mapping.body).length&&(!sr?.mapping||JSON.stringify(sr.mapping.body||{})!==JSON.stringify(mapping.body||{})))throw new Error('המיפוי לא נשמר באופן קבוע. השמירה בוטלה.');tplInvalidateWaSendCacheF14G_();const i=tplRowsA19P2.findIndex(x=>String(x.id)===String(sr.template?.id||t.id));if(i>=0)tplRowsA19P2[i]=Object.assign({},tplRowsA19P2[i],sr.template||{},sr.mapping?{mapping:sr.mapping}:{});tplPatchCachedTemplateD5D14_(Object.assign({},sr.template||t,sr.mapping?{mapping:sr.mapping}:{}));tplCloseA19P2();tplRenderA19P2();tplNoticeA19P2('הגדרות התבנית והמיפוי נשמרו בהצלחה');}catch(e){tplNoticeA19P2(e.message,true,true);}finally{tplBusyA19P2=false;b.disabled=false;b.textContent='שמור הגדרות';}}
async function tplImageA19P2(file){if(!file||!tplEditingA19P2?.id||tplViewA19P2)return;if(file.size>4*1024*1024){tplNoticeA19P2('תמונה גדולה מ־4MB',true,true);return;}tplNoticeA19P2('מעלה תמונה…',false,true);const localUrl=URL.createObjectURL(file);tplSetImageA19P2(localUrl);try{const base64=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(String(r.result).split(',')[1]);r.onerror=reject;r.readAsDataURL(file)});const oldId=tplEditingA19P2.imageFileId;const r=await API.request('uploadMessageTemplateImageA19P2',{id:tplEditingA19P2.id,fileName:file.name,mime:file.type,base64});if(oldId)tplImageCacheA19P2.delete(String(oldId));tplInvalidateWaSendCacheF14G_();if(r.template.imageFileId)tplImageCacheA19P2.set(String(r.template.imageFileId),'data:'+file.type+';base64,'+base64);await tplLoadA19P2();tplEditA19P2(r.template.id);tplNoticeA19P2('התמונה נשמרה ב־Drive',false,true);}catch(e){tplNoticeA19P2(e.message,true,true);}finally{URL.revokeObjectURL(localUrl);}}

let tplImageSeqA19P2=0;
const tplImageCacheA19P2=new Map();
const tplEventImageCacheD29=new Map();
const tplImageInflightD29=new Map();
function tplInvalidateEventImageD29(eventId){if(eventId)tplEventImageCacheD29.delete(String(eventId));else tplEventImageCacheD29.clear();}
function tplSetImageA19P2(src){const managerImg=tplEl('tplManagerImageF14Z32');if(managerImg){managerImg.hidden=!src;if(src){managerImg.src=src;managerImg.style.display='block';}else {managerImg.style.display='none';managerImg.removeAttribute('src');}}for(const id of ['tplImagePreview']){const el=tplEl(id);if(!el)continue;el.hidden=!src;if(src)el.src=src;else el.removeAttribute('src');}}
// D5D27: The server event record is authoritative for the image.  The client
// event list may be stale after uploading or removing an image in another view.
async function tplShowImageA19P2(template){
 const seq=++tplImageSeqA19P2;
 const selectedEventId=String(tplPreviewEventIdD5D17||'');
 tplSetImageA19P2('');
 const info=tplEl('tplImageInfo');
 if(!selectedEventId){if(info)info.textContent='לא נבחר אירוע';return;}
 const cached=tplEventImageCacheD29.get(selectedEventId);
 if(cached){tplSetImageA19P2(cached.src);if(info)info.textContent='תמונת האירוע';const st=tplEl('tplPreviewImageStatusD5D27');if(st)st.textContent='מצורפת';return;}
 if(info)info.textContent='טוען תמונת אירוע…';const visibleStatus=tplEl('tplPreviewImageStatusD5D27');if(visibleStatus)visibleStatus.textContent='טוען תמונה…';
 try{
  let pending=tplImageInflightD29.get(selectedEventId);if(!pending){pending=API.request('getEventInvitationImageD5D17',{eventId:selectedEventId});tplImageInflightD29.set(selectedEventId,pending);}
  let result;try{result=await pending;}finally{if(tplImageInflightD29.get(selectedEventId)===pending)tplImageInflightD29.delete(selectedEventId);}
  if(seq!==tplImageSeqA19P2||selectedEventId!==String(tplPreviewEventIdD5D17)||tplEl('tplShade')?.hidden)return;
  const fileId=String(result?.imageFileId||'');
  const ev=tplPreviewEventD5D17();
  if(ev)ev.invitationImageFileId=fileId; // keep local list consistent with server
  if(!fileId){if(info)info.textContent='לאירוע הנבחר אין תמונת הזמנה';const status=tplEl('tplPreviewImageStatusD5D27');if(status)status.textContent='לא צורפה';return;}
  if(!/^image\/(png|jpeg|webp)$/.test(result.mime||'')||!/^[A-Za-z0-9+/=]+$/.test(result.base64||''))throw new Error('תמונה לא תקינה');
  const src='data:'+result.mime+';base64,'+result.base64;
  tplImageCacheA19P2.set(fileId,src);
  tplEventImageCacheD29.set(selectedEventId,{fileId,src});
  tplSetImageA19P2(src);
  if(info)info.textContent='תמונת האירוע';
  // Update the status without rebuilding the image node we just populated.
  const status=tplEl('tplPreviewImageStatusD5D27');
  if(status)status.textContent='מצורפת';
 }catch(err){
  if(seq!==tplImageSeqA19P2||selectedEventId!==String(tplPreviewEventIdD5D17))return;
  tplSetImageA19P2('');
  if(info)info.textContent='לא ניתן להציג תמונה: '+(err.message||err);const status=tplEl('tplPreviewImageStatusD5D27');if(status)status.textContent='שגיאת טעינה: '+(err.message||err);
 }
}


tplEl('tplSyncEnvironment')?.addEventListener('change',()=>{tplNoticeA19P2('');tplLoadA19P2();});
tplEl('tplSyncMeta').addEventListener('click',async()=>{if(tplBusyA19P2)return;tplBusyA19P2=true;const b=tplEl('tplSyncMeta');b.disabled=true;b.innerHTML='<span class="tpl-spinner"></span>מסנכרן…';tplNoticeA19P2('מסנכרן תבניות מ־Meta…');try{const r=await tplSyncAllFromMetaF14Z32_();tplInvalidateWaSendCacheF14G_();await tplLoadA19P2(true);tplNoticeA19P2(`${r.environment}: סונכרנו ${r.found}/${r.total} תבניות · ${r.changed} עודכנו`);}catch(e){tplNoticeA19P2('הסנכרון נכשל: '+e.message,true);}finally{tplBusyA19P2=false;b.disabled=false;b.textContent='🔄 סנכרון תבניות מ־Meta';}});
tplEl('tplList').addEventListener('click',e=>{const edit=e.target.closest('[data-tpl-edit]');if(edit)tplEditA19P2(edit.dataset.tplEdit);});
tplEl('tplList').addEventListener('dblclick',e=>{if(e.target.closest('button'))return;const row=e.target.closest('[data-tpl-row]');if(row)tplEditA19P2(row.dataset.tplRow,true);});
tplEl('tplCloseX').addEventListener('click',()=>{if(tplBusyA19P2)return;tplCloseA19P2();});tplEl('tplSave').addEventListener('click',tplSaveA19P2);tplEl('tplCancel').addEventListener('click',tplCloseA19P2);tplEl('tplImage').addEventListener('change',e=>{const file=e.target.files[0];e.target.value='';tplImageA19P2(file);});tplEl('tplReplaceImage').addEventListener('click',()=>tplEl('tplImage').click());
tplEl('tplRemoveImage').addEventListener('click',async()=>{if(!tplEditingA19P2?.id||!confirm('להסיר את התמונה מהתבנית?'))return;try{const oldId=tplEditingA19P2.imageFileId;const r=await API.request('removeMessageTemplateImageA19P2',{id:tplEditingA19P2.id});tplInvalidateWaSendCacheF14G_();if(oldId)tplImageCacheA19P2.delete(String(oldId));await tplLoadA19P2();tplEditA19P2(r.template.id);tplNoticeA19P2('התמונה הוסרה מהתבנית',false,true);}catch(e){tplNoticeA19P2(e.message,true,true);}});
