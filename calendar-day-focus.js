// Calendar 2.0 — day focus drill-down v233a
(function(){
  const schoolColor=e=>/^NO SCHOOL - /.test(e.title||'')?'#e0b72f':/^HALF DAY - /.test(e.title||'')?'#b45bd1':calendarEventColor(e);
  const time=t=>{if(!t)return 'All day';let [h,m]=t.split(':');return String(h).padStart(2,'0')+':'+String(m||'00').padStart(2,'0')};
  const esc=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function openDay(ds){
    let d=new Date(ds+'T12:00'),cust=custodyForDate(ds),cc=custodyColor(cust),es=eventsForDate(ds).slice().sort((a,b)=>schoolEventPriority(a)-schoolEventPriority(b)||(a.time||'99:99').localeCompare(b.time||'99:99'));
    $('#modalTitle').textContent=d.toLocaleDateString([],{weekday:'long',month:'long',day:'numeric',year:'numeric'});
    $('#modalBody').innerHTML=`<div class="day-focus"><div class="day-focus-custody"><span class="day-focus-dot" style="background:${cc}"></span><div><span class="meta">Custody</span><b>${esc(cust)}</b></div><button type="button" class="custody-day" data-date="${ds}">Change</button></div><div class="day-focus-actions"><button type="button" class="primary" data-day-add="${ds}">＋ Add event</button></div><div class="day-focus-events">${es.length?es.map(e=>`<button type="button" class="day-focus-event" data-id="${e.id}" data-date="${ds}"><span class="day-focus-bar" style="background:${schoolColor(e)}"></span><span class="day-focus-time">${time(e.time)}</span><span class="day-focus-copy"><b>${esc(e.title)}</b><small>${[e.person,e.type,e.location].filter(Boolean).map(esc).join(' · ')}</small>${e.bring?`<small>Bring: ${esc(e.bring)}</small>`:''}${e.leave?`<small>Leave by ${time(e.leave)}</small>`:''}</span></button>`).join(''):'<p class="muted">Nothing scheduled for this day.</p>'}</div></div>`;
    $('#modal').showModal();
    document.querySelector('[data-day-add]')?.addEventListener('click',()=>{let date=ds;$('#modal').close();eventForm();setTimeout(()=>{let input=$('#neDate');if(input)input.value=date},0)});
    document.querySelectorAll('.day-focus-event').forEach(btn=>btn.addEventListener('click',()=>{let id=btn.dataset.id;$('#modal').close();if(typeof editEvent==='function')editEvent(id,ds)}));
  }
  document.addEventListener('click',e=>{
    let day=e.target.closest?.('.calendar-v2 .cal-day');
    if(!day||e.target.closest('.cal-event,.cal-more,.custody-circle'))return;
    openDay(day.dataset.date);
  });
  window.openCalendarDay=openDay;
})();