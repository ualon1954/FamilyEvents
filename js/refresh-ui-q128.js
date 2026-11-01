function refreshIconQ128_(){return '<svg aria-hidden="true" viewBox="0 0 24 24" width="23" height="23" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 7v5h-5M4 17v-5h5"/><path d="M6.1 7a7 7 0 0 1 11.6-1L20 9M4 15l2.3 3A7 7 0 0 0 18 17"/></svg>';}
function refreshStampQ128_(at){
 const d=new Date(at);if(!Number.isFinite(d.getTime()))return 'טרם עודכן';
 const p=Object.fromEntries(new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Jerusalem',day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).formatToParts(d).map(x=>[x.type,x.value]));
 return '<span>עודכן לאחרונה:</span> <strong dir="ltr">'+p.day+'.'+p.month+'.'+p.year+' '+p.hour+':'+p.minute+':'+p.second+'</strong>';
}

function refreshButtonContentQ130_(busy){return refreshIconQ128_()+'<span>'+(busy?'מרענן…':'רענון')+'</span>';}
