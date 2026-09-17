// Calendar 2.0 — compact custody handoff beside filters v242a
(function(){
  const fmtTime=t=>{if(!t)return '';let [h,m]=String(t).split(':');return String(h).padStart(2,'0')+':'+String(m||'00').padStart(2,'0')};
  const esc=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function handoffForDate(ds){
    if(typeof eventsForDate!=='function')return null;
    return eventsForDate(ds).filter(e=>e.type==='Custody'||/kids\s+(to|return)/i.test(e.title||'')).sort((a,b)=>(a.time||'99:99').localeCompare(b.time||'99:99'))[0]||null;
  }
  function nextHandoff(){
    let start=vegasToday();
    for(let i=0;i<35;i++){
      let d=new Date(start+'T12:00');d.setDate(d.getDate()+i);let ds=iso(d),e=handoffForDate(ds);
      if(e)return {date:ds,event:e,days:i};
    }
    return null;
  }
  function destination(e,ds){
    let t=(e?.title||'').toLowerCase();
    if(t.includes('to dad'))return 'Dad';
    if(t.includes('return')||t.includes('to mom'))return 'Mom';
    let c=typeof custodyForDate==='function'?custodyForDate(ds):'';
    if(c.includes('→'))return c.split('→').pop().replace(/\d.*$/,'').trim();
    return c.includes('Dad')?'Dad':c.includes('Mom')?'Mom':'';
  }
  function installSummary(){
    let card=document.querySelector('.calendar-v2');if(!card)return;
    card.querySelector('.custody-next-handoff')?.remove();
    let h=nextHandoff();if(!h)return;
    let d=new Date(h.date+'T12:00'),dest=destination(h.event,h.date),when=h.days===0?'Today':h.days===1?'Tomorrow':d.toLocaleDateString([],{weekday:'short',month:'short',day:'numeric'}),time=fmtTime(h.event.time),color=dest==='Dad'?custodyColor('Dad'):custodyColor('Mom');
    let box=document.createElement('button');box.type='button';box.className='custody-next-handoff';box.dataset.handoffDate=h.date;box.title=`Next custody handoff · ${h.event.title||('To '+dest)} · ${when}${time?' '+time:''}`;box.innerHTML=`<span class="custody-handoff-icon" style="--handoff-color:${color}">↔</span><span class="custody-handoff-copy"><small>Next handoff</small><b>${esc(h.event.title||('To '+dest))}</b></span><span class="custody-handoff-when"><b>${when}</b><small>${time||'All day'}</small></span><span class="custody-handoff-arrow">›</span>`;
    let filters=card.querySelector('.calendar-person-filters'),head=card.querySelector('.card-head');
    if(filters){let row=document.createElement('div');row.className='calendar-filter-handoff-row';filters.parentNode.insertBefore(row,filters);row.append(filters,box)}else head?.insertAdjacentElement('afterend',box);
  }
  function markDays(){
    document.querySelectorAll('.calendar-v2 .cal-day[data-date]').forEach(day=>{let h=handoffForDate(day.dataset.date);day.classList.toggle('custody-handoff-day',!!h);if(h&&!day.querySelector('.custody-handoff-badge')){let row=day.querySelector('.cal-date-row');row?.insertAdjacentHTML('beforeend',`<span class="custody-handoff-badge" title="${esc(h.title)}${h.time?' · '+fmtTime(h.time):''}">↔</span>`)}});
    document.querySelectorAll('.cal-week-day').forEach(day=>{let date=day.querySelector('[data-week-date]')?.dataset.weekDate||day.dataset.date;if(!date)return;let h=handoffForDate(date);day.classList.toggle('custody-handoff-day',!!h)});
  }
  function enhanceDayFocus(){
    let focus=document.querySelector('.day-focus');if(!focus)return;
    let dateBtn=focus.querySelector('[data-day-add]'),ds=dateBtn?.dataset.dayAdd;if(!ds)return;
    let h=handoffForDate(ds);if(!h||focus.querySelector('.day-focus-handoff'))return;
    let dest=destination(h,ds),color=dest==='Dad'?custodyColor('Dad'):custodyColor('Mom');
    let banner=document.createElement('div');banner.className='day-focus-handoff';banner.innerHTML=`<span style="background:${color}">↔</span><div><small>Custody handoff</small><b>${esc(h.title)}</b></div><strong>${fmtTime(h.time)||'ALL DAY'}</strong>`;
    focus.querySelector('.day-focus-custody')?.insertAdjacentElement('afterend',banner);
  }
  function refresh(){setTimeout(()=>{installSummary();markDays();enhanceDayFocus()},0)}
  document.addEventListener('click',e=>{let b=e.target.closest?.('[data-handoff-date]');if(!b)return;e.preventDefault();if(typeof openCalendarDay==='function')openCalendarDay(b.dataset.handoffDate)});
  let old=window.render;if(typeof old==='function')window.render=function(){let r=old.apply(this,arguments);refresh();return r};
  document.addEventListener('click',e=>{if(e.target.closest?.('.cal-day,.cal-week-day'))setTimeout(enhanceDayFocus,20)});
  refresh();
})();