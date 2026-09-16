// Wellness History — v131a
(function(){
  let historyRange='30';
  const oldCard=window.moodTrackerCard;
  function ensure(){data.moodLog=data.moodLog||{};data.smokingLog=data.smokingLog||{}}
  function dates(n){let out=[],d=new Date(vegasToday()+'T12:00');for(let i=n-1;i>=0;i--){let x=new Date(d);x.setDate(x.getDate()-i);out.push(iso(x))}return out}
  function history(){
    ensure();let n=historyRange==='90'?90:historyRange==='all'?3650:+historyRange;
    let keys=[...new Set([...Object.keys(data.moodLog),...Object.keys(data.smokingLog)])].sort();
    let ds=historyRange==='all'?keys:dates(n);
    if(historyRange==='all'&&!ds.length)ds=dates(30);
    let rows=ds.map(d=>({d,m:+(data.moodLog[d]||0),h:+(data.smokingLog[d]||0)}));
    let logged=rows.filter(x=>x.m||x.h), moods=rows.filter(x=>x.m).map(x=>x.m), hits=rows.reduce((a,x)=>a+x.h,0);
    let avg=moods.length?(moods.reduce((a,b)=>a+b,0)/moods.length).toFixed(1):'—';
    let best=moods.length?Math.max(...moods):'—';
    let smokingDays=rows.filter(x=>x.h>0).length;
    let recent=logged.slice().reverse().slice(0,31);
    return '<section class="card full wellness-history-card"><div class="card-head"><div><h2>Wellness History</h2><div class="meta">Mood and smoking trends over time</div></div><div class="wellness-history-ranges">'+
      [['30','30 days'],['90','90 days'],['all','All']].map(x=>'<button type="button" class="wellness-history-range '+(historyRange===x[0]?'active':'')+'" data-wellness-range="'+x[0]+'">'+x[1]+'</button>').join('')+
      '</div></div><div class="wellness-history-stats"><div><span>Average mood</span><strong>'+avg+(avg==='—'?'':' / 10')+'</strong></div><div><span>Best mood</span><strong>'+best+(best==='—'?'':' / 10')+'</strong></div><div><span>Total hits</span><strong>'+hits+'</strong></div><div><span>Smoking days</span><strong>'+smokingDays+'</strong></div></div>'+
      '<div class="wellness-history-list">'+(recent.length?recent.map(x=>'<div class="wellness-history-row"><div><b>'+new Date(x.d+'T12:00').toLocaleDateString([],{weekday:'short',month:'short',day:'numeric'})+'</b></div><div><span>Mood</span><strong>'+(x.m||'—')+'</strong></div><div><span>Hits</span><strong>'+x.h+'</strong></div></div>').join(''):'<p class="muted">No wellness entries yet.</p>')+'</div></section>';
  }
  window.wellnessHistoryCard=history;
  const original=window.moodTrackerCard;
  window.moodTrackerCard=function(){return original()+history()};
  document.addEventListener('click',e=>{let b=e.target.closest&&e.target.closest('[data-wellness-range]');if(b){historyRange=b.dataset.wellnessRange;render()}});
})();