// Mood + smoking tracker enhancement — v120a
(function(){
  let wellnessTab='today';
  function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
  function fmt(ds){return new Date(ds+'T12:00').toLocaleDateString([],{weekday:'short',month:'short',day:'numeric'})}
  function ensure(){data.moodLog=data.moodLog||{};data.smokingLog=data.smokingLog||{}}
  function summary(){
    ensure();
    const today=vegasToday(), days=habitDays(weekStart(today));
    const moods=days.map(d=>data.moodLog[d]).filter(v=>Number.isFinite(+v)&&+v>0);
    const hits=days.map(d=>+(data.smokingLog[d]||0));
    const avg=moods.length?(moods.reduce((a,b)=>a+(+b),0)/moods.length).toFixed(1):'—';
    const total=hits.reduce((a,b)=>a+b,0), active=hits.filter(Boolean).length;
    return '<div class="wellness-summary-grid"><div><span>Average mood</span><strong>'+avg+(avg==='—'?'':' / 10')+'</strong></div><div><span>Smoking hits</span><strong>'+total+'</strong><small>'+active+' day'+(active===1?'':'s')+' with hits</small></div></div>'+
      '<div class="wellness-chart"><div class="wellness-chart-head"><b>This week</b><span>Mood / smoking hits by day</span></div>'+
      days.map(d=>{const m=+(data.moodLog[d]||0),h=+(data.smokingLog[d]||0);return '<div class="wellness-day"><b>'+new Date(d+'T12:00').toLocaleDateString([],{weekday:'short'})+'</b><span>'+fmt(d)+'</span><div class="wellness-values"><i>Mood <strong>'+(m||'—')+'</strong></i><i>Hits <strong>'+h+'</strong></i></div></div>'}).join('')+'</div>';
  }
  window.moodTrackerCard=function(){
    ensure();
    const today=vegasToday(), score=data.moodLog[today], hits=+(data.smokingLog[today]||0);
    const dateLabel=new Date(today+'T12:00').toLocaleDateString([],{month:'short',day:'numeric',year:'numeric'});
    return '<section class="card full mood-card wellness-card"><div class="wellness-tabs"><button type="button" class="wellness-tab '+(wellnessTab==='today'?'active':'')+'" data-wellness-tab="today">Today</button><button type="button" class="wellness-tab '+(wellnessTab==='summary'?'active':'')+'" data-wellness-tab="summary">Summary</button></div>'+
      (wellnessTab==='summary'?summary():
      '<div class="wellness-today"><div class="smoking-tracker"><div><h3>Smoking tracker</h3><div class="meta">Hits taken today · '+esc(dateLabel)+'</div></div><div class="smoking-stepper"><button type="button" data-smoking-step="-1" aria-label="Decrease smoking hits">−</button><strong>'+hits+'</strong><button type="button" data-smoking-step="1" aria-label="Increase smoking hits">＋</button></div></div>'+
      '<div class="mood-entry"><div class="card-head"><div><h2>End of day mood</h2><div class="meta">How did you feel today? · +0.05 GG for the first mood check-in</div></div><span class="pill">Today · '+esc(dateLabel)+(score?' · '+score+'/10':'')+'</span></div>'+
      '<div class="mood-scale">'+Array.from({length:10},(_,i)=>i+1).map(n=>'<button class="mood-score '+(score===n?'active':'')+'" data-score="'+n+'" data-date="'+today+'">'+n+'</button>').join('')+'</div><div class="mood-labels"><span>Really hard day</span><span>Amazing day</span></div></div></div>')+
      '</section>';
  };
  document.addEventListener('click',e=>{
    const tab=e.target.closest&&e.target.closest('[data-wellness-tab]');
    if(tab){wellnessTab=tab.dataset.wellnessTab;render();return}
    const step=e.target.closest&&e.target.closest('[data-smoking-step]');
    if(step){ensure();const ds=vegasToday(),cur=+(data.smokingLog[ds]||0),next=Math.max(0,cur+(+step.dataset.smokingStep));data.smokingLog[ds]=next;save();render()}
  });
})();