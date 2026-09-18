// Today 2.0 — v127a
(function(){
  window.todayView=function(){
    const ds=vegasToday();
    data.smokingLog=data.smokingLog||{};
    const hits=+(data.smokingLog[ds]||0);
    const ev=eventsForDate(ds).sort((a,b)=>(a.time||'99:99').localeCompare(b.time||'99:99'));
    const dueTask=t=>{if(t.done)return false;if(t.taskMode==='cycle')return choreStatus(t).startsWith('Due now');return !t.due||t.due<=ds};
    const tasks=data.tasks.filter(dueTask);
    const habits=data.habits.filter(h=>(h.trackerType||'habit')==='habit'&&habitApplies(h,ds));
    const checks=data.habits.filter(h=>h.trackerType==='checkin'&&habitApplies(h,ds));
    const remaining=habits.filter(h=>!data.habitLog[ds]?.[h.id]),done=habits.length-remaining.length;
    const meal=data.mealPlan[ds];
    const groups=[{name:'Household',cls:'household',items:tasks.filter(t=>t.category==='Household'||t.category==='Chore')},{name:'School',cls:'school',items:tasks.filter(t=>['School','Sports'].includes(t.category))},{name:'Work',cls:'work',items:tasks.filter(t=>t.category==='Work')}];
    const now=new Date(),day=now.getDate(),last=new Date(now.getFullYear(),now.getMonth()+1,0).getDate();
    const duePayments=(data.payments||[]).filter(p=>!p.paid&&Math.min(+p.day||1,last)<=day);
    const dateLabel=new Date(ds+'T12:00').toLocaleDateString([],{weekday:'long',month:'long',day:'numeric'});
    return '<section class="card today-plan"><div class="card-head"><h2>▦ Schedule & Tasks</h2><div class="item-actions"><button data-go="calendar">Calendar</button><button data-go="tasks">Tasks</button></div></div><div class="today-plan-section"><h3>Schedule</h3>'+ (ev.map(e=>'<div class="today-row"><b>'+window.familyHubTime.range(e.time,e.end)+'</b><div><strong>'+e.title+'</strong><div class="meta">'+(e.person||'')+(e.location?' · '+e.location:'')+'</div></div></div>').join('')||'<p class="muted">Nothing on the calendar today.</p>')+'</div><div class="today-plan-section"><h3>Tasks due</h3>'+groups.map(g=>'<div class="today-task-group home-task-'+g.cls+'"><b>'+g.name+'</b>'+(g.items.map(t=>'<div class="home-task-row"><input class="check task-check" data-id="'+t.id+'" type="checkbox"><div><b>'+t.name+'</b><div class="meta">'+(t.assigned||'Everyone')+'</div></div></div>').join('')||'<div class="meta">Nothing due</div>')+'</div>').join('')+'</div></section>'+
    '<section class="card today-habits today-habits-long"><div class="card-head"><div><h2>Habits & Check-ins</h2><div class="meta">'+remaining.length+' remaining · '+done+' complete</div></div><button data-go="habits">Open habits</button></div>'+habits.map(h=>'<label class="today-habit-row"><input type="checkbox" class="habit-toggle" data-id="'+h.id+'" data-date="'+ds+'" '+(data.habitLog[ds]?.[h.id]?'checked':'')+'><span>'+h.name+'</span></label>').join('')+(checks.length?'<div class="today-checkins"><h3>Check-ins</h3>'+checks.map(h=>'<label class="today-habit-row"><input type="checkbox" class="habit-toggle" data-id="'+h.id+'" data-date="'+ds+'" '+(data.habitLog[ds]?.[h.id]?'checked':'')+'><span>'+h.name+'</span></label>').join('')+'</div>':'')+'</section>'+
    '<section class="card today2-wellness"><div class="card-head"><div><h2>Smoking tracker</h2><div class="meta">Hits today · synced with Wellness</div></div><button data-go="habits">Wellness</button></div><div class="today2-smoking"><button type="button" data-today-smoking="-1" aria-label="Decrease hits">−</button><strong>'+hits+'</strong><button type="button" data-today-smoking="1" aria-label="Increase hits">＋</button></div></section>'+
    '<section class="card today2-dinner"><div class="card-head"><div><h2>♨ Dinner</h2><div class="meta">Tonight\'s meal</div></div><button data-go="meals">Meals</button></div><div class="today2-meal">'+(meal||'Nothing planned yet')+'</div></section>'+
    (duePayments.length?'<section class="card full today2-alert"><div class="card-head"><div><h2>Due today / overdue</h2><div class="meta">Payments needing attention</div></div><button data-go="more">Payments</button></div>'+duePayments.map(p=>'<div class="item"><div style="flex:1"><b>'+p.name+'</b><div class="meta">Due day '+p.day+'</div></div>'+(p.amount?'<strong>$'+p.amount+'</strong>':'')+'</div>').join('')+'</section>':'');
  };
  document.addEventListener('click',e=>{
    const b=e.target.closest&&e.target.closest('[data-today-smoking]');
    if(!b)return;
    data.smokingLog=data.smokingLog||{};
    const ds=vegasToday(),cur=+(data.smokingLog[ds]||0);
    data.smokingLog[ds]=Math.max(0,cur+(+b.dataset.todaySmoking));
    save();render();
  });
})();