/* Event catalogs are saved together with the event form. */
function eventLookupDefaultQ198_(type){const n=String(type?.name||'').replace(/[־–-]/g,' ');if(/חתונ|בר\s*מצו|בת\s*מצו/.test(n))return true;if(/יום\s*הולדת|אחר/.test(n))return false;return isTrue(type?.usesSides,false);}
function eventLookupTypeQ198_(event){const type=eventTypeById(event?.eventTypeId);if(!event||!type)return type;return {...type,usesSides:isTrue(event.usesSides,isTrue(type.usesSides,false)),usesGroups:isTrue(event.usesGroups,isTrue(type.usesGroups,false))};}
function eventLookupRowsQ198_(event,kind){
 if(event&&String(event[kind+'JsonQ198']||'')){try{const rows=JSON.parse(event[kind+'JsonQ198']);return Array.isArray(rows)?rows:[];}catch(_){return [];}}
 return (state.lookups[kind]||[]).filter(x=>String(x.eventTypeId)===String(event?.eventTypeId));
}
function installEventLookupsEditorQ198_(event){
 const form=document.getElementById('eventForm');if(!form)return;
 const type=form.querySelector('[name=eventTypeId]'),nav=form.querySelector('.event-editor-tabs-d55o');
 const revision=document.createElement('input');revision.type='hidden';revision.name='lookupRevisionQ198';revision.value=event.lookupRevisionQ198||'';form.append(revision);
 const initial={...event,eventTypeId:type.value},newEvent=!event.id;
 const defaults=eventLookupDefaultQ198_(eventTypeById(type.value));
 const general=form.querySelector('.event-editor-pane-d55o[data-tab=general]');
 const flags={};
 for(const [kind,title,flag] of [['sides','צד','usesSides'],['groups','קבוצה','usesGroups']]){
  const label=document.createElement('label');label.className='check-label';const check=document.createElement('input');check.type='checkbox';check.name=flag;check.checked=isTrue(event[flag],newEvent?defaults:isTrue(eventTypeById(type.value)?.[flag],false));label.append(check,document.createTextNode(kind==='sides'?' שימוש בצדדים':' שימוש בקבוצות'));general.append(label);flags[kind]=check;
  const pane=form.querySelector('.event-editor-pane-d55o[data-tab='+kind+']'),button=nav.querySelector('[data-tab='+kind+']');
  const data=document.createElement('input');data.type='hidden';data.name=kind+'JsonQ198';pane.append(data);
  const help=document.createElement('p');help.className='muted';help.textContent='הערכים שייכים לאירוע זה בלבד. אפשר להוסיף, לערוך שם או להשבית ערך. השבתה שומרת שיוכים קיימים.';pane.append(help);
  const list=document.createElement('div');list.className='event-lookup-list-q198';pane.append(list);
  const add=document.createElement('button');add.type='button';add.className='secondary event-lookup-add-q200';add.textContent='＋ הוספת '+title;pane.append(add);
  let rows=eventLookupRowsQ198_(initial,kind).map(r=>({...r})),edited=false;
  const sync=()=>{data.value=JSON.stringify(rows);};
  const draw=()=>{list.replaceChildren();rows.forEach(r=>{const row=document.createElement('div');row.className='event-lookup-row-q198';const name=document.createElement('input');name.type='text';name.maxLength=100;name.value=String(kind==='groups'?(r.label||r.value||''):(r.value||r.label||''));name.setAttribute('aria-label','שם '+title);name.oninput=()=>{edited=true;if(kind==='sides'||!r.value)r.value=name.value;r.label=name.value;sync();};const active=document.createElement('label');active.className='check-label';const cb=document.createElement('input');cb.type='checkbox';cb.checked=isTrue(r.active,true);cb.onchange=()=>{edited=true;r.active=cb.checked;sync();};active.append(cb,document.createTextNode(' פעיל'));row.append(name,active);list.append(row);});sync();};
  const visibility=()=>{button.hidden=!check.checked;if(!check.checked)pane.hidden=true;if(!check.checked&&button.getAttribute('aria-selected')==='true')nav.querySelector('[data-tab=general]')?.click();};
  check.addEventListener('change',visibility);visibility();
  add.onclick=()=>{if(rows.length>=150){showToast('ניתן להוסיף עד 150 ערכים','error');return;}edited=true;const id=(kind==='sides'?'SIDE_':'GRP_')+(globalThis.crypto?.randomUUID?.()||Date.now().toString(36)+Math.random().toString(36).slice(2));rows.push({id,[kind==='sides'?'sideId':'groupId']:id,value:'',label:'',active:true});draw();list.lastElementChild?.querySelector('input')?.focus();};
  if(newEvent)type.addEventListener('change',()=>{check.checked=eventLookupDefaultQ198_(eventTypeById(type.value));if(!edited){rows=eventLookupRowsQ198_({eventTypeId:type.value},kind).map(r=>({...r}));draw();}visibility();});
  draw();
 }
}

function eventLookupViewQ200_(event,kind){
 const title=kind==='sides'?'צד':'קבוצה',rows=eventLookupRowsQ198_(event,kind);
 if(!rows.length)return '<h4>'+title+'</h4><p class="muted">לא הוגדרו ערכים לאירוע זה.</p>';
 return '<h4>'+title+'</h4><div class="event-lookup-view-q200">'+rows.map(r=>'<div class="event-lookup-view-row-q200"><span>'+esc(kind==='sides'?(r.value||r.label||''):(r.label||r.value||''))+'</span><span class="'+(isTrue(r.active,true)?'event-lookup-active-q200':'muted')+'">'+(isTrue(r.active,true)?'פעיל':'לא פעיל')+'</span></div>').join('')+'</div>';
}
