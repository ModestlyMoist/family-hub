// Calendar 2.0 — week view v235a
(function(){
  let weekCursor=null;
  const time=t=>window.familyHubTime.format(t);
  const color=e=>/^NO SCHOOL - /.test(e.title||'')?'#e0b72f':/^HALF DAY - /.test(e.title||'')?'#b45bd1':calendarEventColor(e);
  const text=e=>/^NO SCHOOL - /.test(e.title||'')?'#1c1c18':'#fff';
  function startOfWeek(ds){let d=new Date(ds+'T12:00');d.setDate(d.getDate()-d.getDay());return d}
  function weekHtml(){
    let base=weekCursor||startOfWeek(vegasToday()),days='';
    for(let i=0;i<7;i++){
      let d=new Date(base);d.setDate(base.getDate()+i);let ds=iso(d),cust=custodyForDate(ds),cc=custodyColor(cust),es=eventsForDate(ds).slice().sort((a,b)=>schoolEventPriority(a)-schoolEventPriority(b)||(a.time||'99:99').localeCompare(b.time||'99:99'));
      days+=`<div class="cal-week-day ${ds===vegasToday()?'cal-week-today':''}" data-week-date="${ds}"><div class="cal-week-strip" style="background:${cc}"></div><button class="cal-week-head" data-week-open="${ds}"><span>${d.toLocaleDateString([],{weekday:'short'})}</span><b>${d.getDate()}</b><small><i style="background:${cc}"></i>${cust.includes('→')?'Transition':cust.includes('Dad')?'Dad':'Mom'}</small></button><div class="cal-week-events">${es.map(e=>`<button class="cal-week-event" data-id="${e.id}" data-date="${ds}" style="--week-event:${color(e)};color:${text(e)}"><span>${e.time?time(e.time):'ALL DAY'}</span><b>${e.title}</b>${e.location?`<small>${e.location}</small>`:''}</button>`).join('')||'<button class="cal-week-empty" data-week-open="'+ds+'">No events</button>'}</div></div>`;
    }
    let end=new Date(base);end.setDate(base.getDate()+6);let label=base.toLocaleDateString([],{month:'short',day:'numeric'})+' – '+end.toLocaleDateString([],{month:'short',day:'numeric',year:'numeric'});
    return `<div class="cal-week-label">${label}</div><div class="cal-week-grid">${days}</div>`;
  }
  function install(){
    if(typeof calendarView!=='function'||calendarView.__week235)return;
    let prior=calendarView;
    calendarView=function(){
      if(calendarMode!=='week')return prior();
      return `<section class="card full calendar-v2"><div class="card-head"><div><h2>Family calendar</h2><div class="calendar-legend"><span><i style="background:${custodyColor('Mom')}"></i>Mom</span><span><i style="background:${custodyColor('Dad')}"></i>Dad</span><span><i style="background:${custodyColor('Dad → Mom 3:30')}"></i>Transition</span><span><i style="background:#e0b72f"></i>No School</span><span><i style="background:#b45bd1"></i>Half Day</span></div></div><div class="actions"><button id="calendarMonth">Month</button><button id="calendarWeek" class="primary">Week</button><button id="calendarList">List</button><button id="prevWeek">‹</button><button id="weekToday">Today</button><button id="nextWeek">›</button><button id="addEvent">＋ Event</button></div></div>${weekHtml()}</section>`;
    };
    calendarView.__week235=true;
  }
  function rerender(){render()}
  document.addEventListener('click',e=>{
    let week=e.target.closest?.('#calendarWeek');if(week){calendarMode='week';weekCursor=startOfWeek(vegasToday());rerender();return}
    if(e.target.closest?.('#calendarMonth')){calendarMode='month';rerender();return}
    if(e.target.closest?.('#calendarList')){calendarMode='list';rerender();return}
    if(e.target.closest?.('#prevWeek')){weekCursor=weekCursor||startOfWeek(vegasToday());weekCursor.setDate(weekCursor.getDate()-7);rerender();return}
    if(e.target.closest?.('#nextWeek')){weekCursor=weekCursor||startOfWeek(vegasToday());weekCursor.setDate(weekCursor.getDate()+7);rerender();return}
    if(e.target.closest?.('#weekToday')){weekCursor=startOfWeek(vegasToday());rerender();return}
    let open=e.target.closest?.('[data-week-open]');if(open&&window.openCalendarDay){window.openCalendarDay(open.dataset.weekOpen);return}
  });
  install();
  let old=window.render;if(typeof old==='function'){window.render=function(){install();let r=old.apply(this,arguments);if((window.view||view)==='calendar'&&calendarMode!=='week'){setTimeout(()=>{let actions=document.querySelector('.calendar-v2 .actions');if(actions&&!actions.querySelector('#calendarWeek')){let list=actions.querySelector('#calendarList');if(list)list.insertAdjacentHTML('beforebegin','<button id="calendarWeek">Week</button>')}},0)}return r}}
})();