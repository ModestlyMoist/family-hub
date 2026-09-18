// Calendar 2.0 — agenda view v239a
(function(){
  const time=t=>window.familyHubTime.format(t);
  const color=e=>/^NO SCHOOL - /.test(e.title||'')?'#e0b72f':/^HALF DAY - /.test(e.title||'')?'#b45bd1':calendarEventColor(e);
  function agendaHtml(){
    let today=vegasToday(),groups=[];
    for(let i=0;i<45;i++){
      let d=new Date(today+'T12:00');d.setDate(d.getDate()+i);let ds=iso(d),es=eventsForDate(ds).slice().sort((a,b)=>schoolEventPriority(a)-schoolEventPriority(b)||(a.time||'99:99').localeCompare(b.time||'99:99'));
      if(!es.length)continue;
      let label=i===0?'Today':i===1?'Tomorrow':d.toLocaleDateString([],{weekday:'long',month:'long',day:'numeric'});
      groups.push(`<section class="agenda-day"><div class="agenda-date"><b>${label}</b><span>${d.toLocaleDateString([],{year:'numeric'})}</span></div><div class="agenda-items">${es.map(e=>`<button class="agenda-event" data-agenda-id="${e.id}" data-agenda-date="${ds}" style="--agenda-color:${color(e)}"><span class="agenda-time">${time(e.time)}</span><span class="agenda-main"><b>${e.title}</b><small>${[e.person,e.type,e.location].filter(Boolean).join(' · ')}</small></span></button>`).join('')}</div></section>`);
    }
    return `<div class="agenda-wrap"><div class="agenda-range">Upcoming 45 days</div>${groups.join('')||'<p class="muted">No upcoming events.</p>'}</div>`;
  }
  function install(){
    if(typeof calendarView!=='function'||calendarView.__agenda239)return;
    let prior=calendarView;
    calendarView=function(){
      if(calendarMode!=='list')return prior();
      return `<section class="card full calendar-v2"><div class="card-head"><div><h2>Family calendar</h2><div class="calendar-legend"><span><i style="background:${custodyColor('Mom')}"></i>Mom</span><span><i style="background:${custodyColor('Dad')}"></i>Dad</span><span><i style="background:${custodyColor('Dad → Mom 3:30')}"></i>Transition</span><span><i style="background:#e0b72f"></i>No School</span><span><i style="background:#b45bd1"></i>Half Day</span></div></div><div class="actions"><button id="calendarMonth">Month</button><button id="calendarWeek">Week</button><button id="calendarList" class="primary">Agenda</button><button id="calendarToday">Today</button><button id="addEvent">＋ Event</button></div></div>${agendaHtml()}</section>`;
    };
    calendarView.__agenda239=true;
  }
  document.addEventListener('click',e=>{
    let item=e.target.closest?.('[data-agenda-id]');
    if(item&&typeof openCalendarEvent==='function'){openCalendarEvent(+item.dataset.agendaId,item.dataset.agendaDate);return}
  });
  install();
  let old=window.render;if(typeof old==='function'){window.render=function(){install();let r=old.apply(this,arguments);setTimeout(()=>{document.querySelectorAll('#calendarList').forEach(b=>b.textContent='Agenda')},0);return r}}
})();