let guestSeatingPdfUrlQ160_=null;
function guestSeatingPdfNoticeQ160_(message,type,download){
 const host=document.getElementById?.('guestSeatingPdfStatusQ160');
 if(host){host.hidden=false;host.textContent=message;host.className='guest-pdf-status '+type;
  if(download){const a=document.createElement('a');a.href=guestSeatingPdfUrlQ160_;a.download=download;a.textContent=' הורדת PDF';a.style.marginInlineStart='12px';host.appendChild(a);}
 }
 showToast(message,type);
}
/* Export current filter, independently sorted by guest name on the server. */
async function guestSeatingPdfDownloadQ158_(button){
 if(!['Admin','EventManager'].includes(state.session?.role)||button.dataset.busyQ158==='1')return;
 const event=activeEventForGuestTransfer_();if(!event)return;
 const eventId=String(state.activeEventId),token=state.session.token,guestIds=filteredGuests().map(g=>String(g.guestId||g.id));
 if(!guestIds.length){showToast('אין מוזמנים בסינון הנוכחי לייצוא','error');return;}
 guestSeatingPdfNoticeQ160_('מכין את דוח שיוך השולחנות…','success');
 const original=button.innerHTML;button.dataset.busyQ158='1';button.disabled=true;button.setAttribute('aria-busy','true');button.innerHTML='<span class="seating-spinner-v171" aria-hidden="true"></span> מכין PDF…';
 try{
  const result=await API.request('guestSeatingPdfQ158',{eventId,guestIds},{timeoutMs:120000});
  if(state.session?.token!==token||String(state.activeEventId)!==eventId)return;
  if(result.eventId!==eventId||!Number.isInteger(result.exportedRowsQ158)||result.exportedRowsQ158<1||result.exportedRowsQ158>guestIds.length||result.requestedRowsQ159!==guestIds.length||result.excludedRowsQ159!==guestIds.length-result.exportedRowsQ158||result.mimeType!=='application/pdf'||!result.base64)throw Error('לא התקבל קובץ PDF תואם לרשימת המוזמנים');
  if(guestSeatingPdfUrlQ160_)URL.revokeObjectURL(guestSeatingPdfUrlQ160_);
  const binary=atob(result.base64),bytes=Uint8Array.from(binary,c=>c.charCodeAt(0));
  if(binary.slice(0,4)!=='%PDF')throw Error('תוכן הקובץ שהתקבל אינו PDF תקין');
  guestSeatingPdfUrlQ160_=URL.createObjectURL(new Blob([bytes],{type:result.mimeType}));
  guestSeatingPdfNoticeQ160_('הדוח מוכן: '+result.exportedRowsQ158+' מוזמנים בשיוך מלא. אם ההורדה לא התחילה, לחץ על הורדת PDF.','success',result.fileName);
  downloadBase64File_(result.base64,result.fileName,result.mimeType);
 }catch(error){if(state.session?.token===token&&String(state.activeEventId)===eventId)guestSeatingPdfNoticeQ160_(error.message||String(error),'error');}
 finally{button.innerHTML=original;button.disabled=false;button.setAttribute('aria-busy','false');delete button.dataset.busyQ158;}
}
document.addEventListener('click',e=>{const button=e.target.closest?.('#guestSeatingPdfQ158');if(button&&!button.disabled)void guestSeatingPdfDownloadQ158_(button);});
