// Calendar 2.0 — conflict detection v243a
(function(){
  const mins=t=>{if(!t)return null;let [h,m]=String(t).split(':').map(Number);return h*60+(m||0)};
  const people=e=>{let p=String(e.person||'Both').toLowerCase();if(p==='both'||p==='everyone'||p==='family')return ['richard','timothy','olivia'];return p.split(/[,&/+]/).map(x=>x.trim()).filter(Boolean)};
  const timed=e=>!!e.time&&e.type!=='Custody'&&!/^NO SCHOOL - |^HALF DAY - /i.test(e.title||'');
  function overlap(a,b){let as=mins(a.time),bs=mins(b.time);if(as==null||bs==null)return false;let ae=mins(a.end);if(ae==null||ae<=as)ae=as+60;let be=mins(b.end);if(be==null||be<=bs)be=bs+60;return as<be&&bs<ae}
  function conflictMap(ds){
    let es=(typeof eventsForDate==='function'?eventsForDate(ds):[]).filter(timed),map=new Map();
    for(let i=0;i<es.length;i++)for(let j=i+1;j<es.length;j++){
      let shared=people(es[i]).filter(p=>people(es[j]).includes(p));if(!shared.length||!overlap(es[i],es[j]))continue;
      [es[i],es[j]].forEach((e,k)=>{let other=k?es[i]:es[j],key=String(e.id);if(!map.has(key))map.set(key,[]);map.get(key).push({other,people:shared})});
    }
    return map;
  }
  window.calendarConflictsForDate=conflictMap;
  function badge(el,msg){if(!el||el.querySelector('.calendar-conflict-badge'))return;el.classList.add('calendar-has-conflict');let b=document.createElement('span');b.className='calendar-conflict-badge';b.textContent='!';b.title=msg;b.setAttribute('aria-label',msg);el.appendChild(b)}
  function mark(){
    document.querySelectorAll('.calendar-v2 .cal-day[data-date]').forEach(day=>{let map=conflictMap(day.dataset.date);if(!map.size)return;day.classList.add('calendar-conflict-day');let row=day.querySelector('.cal-date-row');if(row&&!row.querySelector('.calendar-day-conflict'))row.insertAdjacentHTML('beforeend','<span class="calendar-day-conflict" title="Schedule conflict">! conflict</span>');day.querySelectorAll('.cal-event[data-id]').forEach(el=>{let c=map.get(String(el.dataset.id));if(c)badge(el,'Conflicts with '+c.map(x=>x.other.title).join(', '))})});
    document.querySelectorAll('.cal-week-day').forEach(day=>{let ds=day.querySelector('[data-week-open]')?.dataset.weekOpen||day.dataset.date;if(!ds)return;let map=conflictMap(ds);if(!map.size)return;day.classList.add('calendar-conflict-day');day.querySelectorAll('.cal-week-event[data-id]').forEach(el=>{let c=map.get(String(el.dataset.id));if(c)badge(el,'Conflicts with '+c.map(x=>x.other.title).join(', '))})});
    document.querySelectorAll('.agenda-event[data-agenda-id]').forEach(el=>{let ds=el.dataset.agendaDate,map=conflictMap(ds),c=map.get(String(el.dataset.agendaId));if(c)badge(el,'Conflicts with '+c.map(x=>x.other.title).join(', '))});
    let focus=document.querySelector('.day-focus'),add=focus?.querySelector('[data-day-add]');if(focus&&add){let map=conflictMap(add.dataset.dayAdd);focus.querySelectorAll('.day-focus-event[data-id]').forEach(el=>{let c=map.get(String(el.dataset.id));if(c)badge(el,'Conflicts with '+c.map(x=>x.other.title).join(', '))});if(map.size&&!focus.querySelector('.day-focus-conflict-note')){let n=document.createElement('div');n.className='day-focus-conflict-note';n.innerHTML='<span>!</span><div><b>Schedule conflict</b><small>Two events overlap for the same family member.</small></div>';focus.querySelector('.day-focus-events')?.insertAdjacentElement('beforebegin',n)}}
  }
  function refresh(){setTimeout(mark,0)}
  let old=window.render;if(typeof old==='function')window.render=function(){let r=old.apply(this,arguments);refresh();return r};
  document.addEventListener('click',e=>{if(e.target.closest?.('.cal-day,.cal-week-day,.agenda-event'))setTimeout(mark,20)});
  refresh();
})();