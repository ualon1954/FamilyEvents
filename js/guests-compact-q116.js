/* Move existing controls without replacing nodes or their listeners. */
(()=>{
 const page=document.getElementById('page-guests');if(!page)return;
 const get=id=>document.getElementById(id);
 const actions=page.querySelector('.guest-page-actions');
 const more=document.createElement('details');more.className='guest-more-q116';
 const summary=document.createElement('summary');summary.textContent='פעולות נוספות';more.append(summary);
 const menu=document.createElement('div');menu.className='guest-more-menu-q116';more.append(menu);
 ['guestWhatsAppTestBulkF14C','guestTemplateBtn','guestExportBtn','guestImportBtn','resetAllSeatingV170','resetEventGuestsV1190A10'].forEach(id=>{if(get(id))menu.append(get(id));});
 actions.append(more);
 menu.addEventListener('click',e=>{if(e.target.closest('button'))more.open=false;});
 document.addEventListener('click',e=>{if(!more.contains(e.target))more.open=false;});
 more.addEventListener('keydown',e=>{if(e.key==='Escape'){more.open=false;summary.focus();}});
 const stats=get('guestStatsV178'),message=get('guestMessageControlQ114');
 const tabs=document.createElement('div');tabs.className='guest-tabs-q116';tabs.setAttribute('aria-label','סיכומי מוזמנים');
 const summaryRow=document.createElement('div');summaryRow.className='guest-summary-row-q127';stats.before(summaryRow);summaryRow.append(tabs);
 const refresh=page.querySelector('.guest-refresh-q67');if(refresh)summaryRow.append(refresh);
 const rsvp=stats.children[0],seating=stats.children[1];
 const panels=[rsvp,seating,message],labels=['אישור הגעה','שיבוץ לשולחנות','הודעות'];
 panels.forEach((panel,i)=>{
  panel.id=panel.id||'guestSummaryQ116_'+i;
  const b=document.createElement('button');b.type='button';b.textContent=labels[i];b.setAttribute('aria-controls',panel.id);
  if(i===1)b.setAttribute('data-seating-tab-q165','');
  if(i===2)b.setAttribute('data-roles','Admin,EventManager');
  tabs.append(b);b.addEventListener('click',()=>select(i));
 });
 function select(i){panels.forEach((p,j)=>{p.classList.toggle('summary-inactive-q116',i!==j);tabs.children[j].setAttribute('aria-pressed',String(i===j));});stats.classList.toggle('summary-inactive-q116',i===2);}
 globalThis.guestSummarySeatingQ165_=enabled=>{tabs.children[1].hidden=!enabled;if(!enabled&&tabs.children[1].getAttribute('aria-pressed')==='true')select(0);};
 guestSummarySeatingQ165_(canManageTables_());
 select(0);
 // Role changes can hide the message panel; keep a useful summary for other roles.
 const roleObserver=new MutationObserver(()=>{if((message.hidden||message.style.display==='none')&&tabs.children[2].getAttribute('aria-pressed')==='true')select(0);});
 roleObserver.observe(message,{attributes:true,attributeFilter:['hidden','style']});
 const bar=document.createElement('div');bar.className='guest-primary-filters-q116';
 get('guestFiltersToggleA5').before(bar);
 bar.append(page.querySelector('#guestFiltersA5 .search-field'));
 const toolbar=message.querySelector('.gm-toolbar-q114');
 [...toolbar.querySelectorAll('label')].forEach(n=>{n.setAttribute('data-roles','Admin,EventManager');bar.append(n);});
 bar.append(get('guestFiltersToggleA5'),get('clearGuestFiltersV180'));
 toolbar.append(get('guestMessageRefreshQ114'));
 const help=message.querySelector('p.muted');
 const info=document.createElement('details');info.className='guest-help-q116';const title=document.createElement('summary');title.textContent='מידע על מצבי ההודעות';info.append(title,help);message.append(info);
 get('guestFiltersToggleA5').querySelector('span').textContent='סינון נוסף';
 const filters=get('guestFiltersA5'),toggle=get('guestFiltersToggleA5');
 const names={sideFilter:'צד',groupFilter:'קבוצה',statusFilter:'אישור הגעה',guestSendFilterA19P2F6:'שליחה',guestSeatingFilterV174:'שיבוץ',guestTableFilterV174:'שולחן'};
 function filterHint(){const active=[...filters.querySelectorAll('select')].filter(s=>s.value).map(s=>(names[s.id]||'סינון')+': '+s.options[s.selectedIndex].text);toggle.querySelector('span').textContent=(filters.classList.contains('filters-open-a5')?'הסתר סינון נוסף':'סינון נוסף')+(active.length?' ('+active.length+')':'');toggle.title=active.join(' • ');}
 filters.addEventListener('change',filterHint);toggle.addEventListener('click',filterHint);
 get('clearGuestFiltersV180').addEventListener('click',()=>queueMicrotask(filterHint));
 if(typeof applyRole==='function')applyRole();
})();
