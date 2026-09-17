// Calendar 2.0 — family member filters v240a
(function(){
  let active='Everyone';
  const people=['Everyone','Richard','Timothy','Olivia'];
  const originalEventsForDate=window.eventsForDate;
  if(typeof originalEventsForDate==='function'){
    window.eventsForDate=function(ds){
      let items=originalEventsForDate(ds);
      if(active==='Everyone')return items;
      return items.filter(e=>e.person===active||e.person==='Both'||e.person==='Everyone');
    };
    try{eventsForDate=window.eventsForDate}catch(e){}
  }
  function dot(person){
    if(person==='Richard')return personColor('Richard');
    if(person==='Timothy')return personColor('Timothy');
    if(person==='Olivia')return personColor('Olivia');
    return 'var(--accent)';
  }
  function installBar(){
    let card=document.querySelector('.calendar-v2');
    if(!card||card.querySelector('.calendar-person-filters'))return;
    let head=card.querySelector('.card-head');if(!head)return;
    let bar=document.createElement('div');bar.className='calendar-person-filters';bar.setAttribute('aria-label','Filter calendar by family member');
    bar.innerHTML=`<span class="calendar-filter-label">Show</span>${people.map(p=>`<button class="calendar-person-filter ${active===p?'active':''}" data-calendar-person="${p}" aria-pressed="${active===p}"><i style="background:${dot(p)}"></i>${p}</button>`).join('')}`;
    head.insertAdjacentElement('afterend',bar);
  }
  document.addEventListener('click',e=>{
    let b=e.target.closest?.('[data-calendar-person]');if(!b)return;
    active=b.dataset.calendarPerson;
    render();
  });
  let old=window.render;
  if(typeof old==='function')window.render=function(){let r=old.apply(this,arguments);setTimeout(installBar,0);return r};
  setTimeout(installBar,0);
})();