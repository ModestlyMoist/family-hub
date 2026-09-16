// Wellness 2.0 — isolated daily compare + cycle prediction v150a
(function(){
  let range='30', mode='list';
  function ensure(){data.moodLog=data.moodLog||{};data.smokingLog=data.smokingLog||{};data.anxietyLog=data.anxietyLog||{};data.nauseaLog=data.nauseaLog||{};data.periodLog=data.periodLog||{};data.medications=data.medications||[]}
  function fmt(d,o){return new Date(d+'T12:00').toLocaleDateString([],o||{month:'short',day:'numeric'})}
  function dates(n){let a=[],d=new Date(vegasToday()+'T12:00');for(let i=n-1;i>=0;i--){let x=new Date(d);x.setDate(x.getDate()-i);a.push(iso(x))}return a}
  function starts(){ensure();return Object.keys(data.periodLog).filter(d=>data.periodLog[d]==='start').sort()}
  function cycle(){
    let s=starts(),lens=[];for(let i=1;i<s.length;i++){let a=new Date(s[i-1]+'T12:00'),b=new Date(s[i]+'T12:00'),n=Math.round((b-a)/86400000);if(n>=18&&n<=45)lens.push(n)}
    let avg=lens.length?Math.round(lens.slice(-6).reduce((a,b)=>a+b,0)/lens.slice(-6).length):28,last=s.at(-1),next='';
    if(last){let d=new Date(last+'T12:00');d.setDate(d.getDate()+avg);next=iso(d)}
    return {avg,last,next,count:lens.length};
  }
  function setBool(key){ensure();let d=vegasToday();data[key][d]=!data[key][d];save();render()}
  function setPeriod(v){ensure();let d=vegasToday();data.periodLog[d]=data.periodLog[d]===v?'':v;save();render()}
  function todayPanel(){
    ensure();let d=vegasToday(),c=cycle(),p=data.periodLog[d]||'';
    return '<section class="card full wellness2-card"><div class="card-head"><div><div class="eyebrow">DAILY WELLNESS</div><h2>Wellness check-in</h2><div class="meta">'+fmt(d,{weekday:'long',month:'long',day:'numeric',year:'numeric'})+' · compare the signals that matter together</div></div></div>'+
    '<div class="wellness2-daily">'+
    '<button class="wellness2-toggle '+(data.anxietyLog[d]?'active':'')+'" data-w2-bool="anxietyLog"><span>Anxiety meds</span><strong>'+(data.anxietyLog[d]?'Taken':'No')+'</strong></button>'+
    '<button class="wellness2-toggle '+(data.nauseaLog[d]?'active':'')+'" data-w2-bool="nauseaLog"><span>Nauseous</span><strong>'+(data.nauseaLog[d]?'Yes':'No')+'</strong></button>'+
    '<div class="wellness2-period"><span>Period</span><div><button class="'+(p==='start'?'active':'')+'" data-period="start">Start today</button><button class="'+(p==='on'?'active':'')+'" data-period="on">On period</button><button class="'+(p==='end'?'active':'')+'" data-period="end">End</button><button data-period-date>Set past start</button></div><div class="period-past-entry" hidden><input type="date" id="periodPastDate" max="'+d+'"><button class="primary" data-save-period-date>Save start</button></div></div></div>'+
    '<div class="cycle-quick"><div><span>Last start</span><strong>'+(c.last?fmt(c.last):'—')+'</strong></div><div><span>Average cycle</span><strong>'+(c.last?c.avg+' days':'—')+'</strong></div><div><span>Expected next</span><strong>'+(c.next?fmt(c.next):'Add a start date')+'</strong><small>'+(c.next?'Estimate · updates with confirmed starts':'')+'</small></div></div></section>';
  }
  function history(){
    ensure();let n=range==='7'?7:range==='90'?90:range==='all'?3650:30, all=[...new Set([...Object.keys(data.moodLog),...Object.keys(data.smokingLog),...Object.keys(data.anxietyLog),...Object.keys(data.nauseaLog),...Object.keys(data.periodLog)])].sort(),ds=range==='all'?(all.length?all:dates(30)):dates(n),c=cycle();
    let rows=ds.map(d=>({d,m:+(data.moodLog[d]||0),h:+(data.smokingLog[d]||0),a:!!data.anxietyLog[d],n:!!data.nauseaLog[d],p:data.periodLog[d]||'',pred:d===c.next&&!data.periodLog[d]}));
    let moods=rows.filter(x=>x.m).map(x=>x.m),hits=rows.reduce((a,x)=>a+x.h,0),sd=rows.filter(x=>x.h).length;
    let stats='<div class="wellness2-stats"><div><span>Avg mood</span><strong>'+(moods.length?(moods.reduce((a,b)=>a+b,0)/moods.length).toFixed(1):'—')+'</strong></div><div><span>Avg hits</span><strong>'+(sd?(hits/sd).toFixed(1):'0.0')+'</strong></div><div><span>Anxiety meds</span><strong>'+rows.filter(x=>x.a).length+'d</strong></div><div><span>Nauseous</span><strong>'+rows.filter(x=>x.n).length+'d</strong></div><div><span>Cycle</span><strong>'+(c.last?c.avg+'d':'—')+'</strong></div></div>';
    let list='<details class="wellness2-breakdown"><summary><span>By-date comparison</span><span class="wellness2-chevron">⌄</span></summary><div class="wellness2-compare">'+rows.slice().reverse().map(x=>'<div class="wellness2-row '+(x.pred?'predicted':'')+'"><b>'+fmt(x.d,{weekday:'short',month:'short',day:'numeric'})+'</b><i>Mood <strong>'+(x.m||'—')+'</strong></i><i>Hits <strong>'+x.h+'</strong></i><i class="'+(x.a?'yes':'')+'">Anx <strong>'+(x.a?'✓':'—')+'</strong></i><i class="'+(x.n?'yes':'')+'">Nausea <strong>'+(x.n?'✓':'—')+'</strong></i><i class="'+(x.p||x.pred?'period':'')+'">Period <strong>'+(x.p==='start'?'Start':x.p==='end'?'End':x.p==='on'?'On':x.pred?'Expected':'—')+'</strong></i></div>').join('')+'</div></details>';
    let medEvents={};(data.medications||[]).forEach(m=>{if(m.startDate)(medEvents[m.startDate]||(medEvents[m.startDate]=[])).push(m.name+' started '+(m.dosage||''));(m.dosageHistory||[]).filter(h=>h.type==='change').forEach(h=>(medEvents[h.date]||(medEvents[h.date]=[])).push(m.name+' → '+h.dosage))}); let cal='<div class="wellness2-calendar">'+rows.map(x=>'<div class="wellness2-day '+(x.p?'has-period ':'')+(x.pred?'predicted':'')+'"><b>'+fmt(x.d,{month:'short',day:'numeric'})+'</b><span>M '+(x.m||'—')+' · H '+x.h+'</span><span>'+(x.a?'💊 ':'')+(x.n?'Nausea ':'')+(x.p==='start'?'Period start':x.p==='end'?'Period end':x.p==='on'?'Period':x.pred?'Expected period':'')+'</span>'+((medEvents[x.d]||[]).map(v=>'<span class="wellness-med-event">💊 '+v+'</span>').join(''))+'</div>').join('')+'</div>';
    return '<section class="card full wellness2-history"><div class="card-head"><div><h2>Wellness Summary</h2><div class="meta">One place for helpful numbers, date ranges, compare and calendar</div></div><div class="wellness2-view"><button data-w2-mode="list" class="'+(mode==='list'?'active':'')+'">Compare</button><button data-w2-mode="calendar" class="'+(mode==='calendar'?'active':'')+'">Calendar</button></div></div><div class="wellness2-ranges">'+[['7','Week'],['30','Month'],['90','90 days'],['all','All']].map(x=>'<button data-w2-range="'+x[0]+'" class="'+(range===x[0]?'active':'')+'">'+x[1]+'</button>').join('')+'</div>'+stats+(mode==='calendar'?cal:list)+'</section>';
  }
  function mount(){if(!document.querySelector('#dashboard .mood-card'))return;let dash=document.querySelector('#dashboard');if(!dash||dash.querySelector('.wellness2-card'))return;let mood=dash.querySelector('.mood-card');if(!mood)return;
    // Keep all daily wellness check-ins together with smoking + mood.
    let daily=document.createElement('div');daily.innerHTML=todayPanel();let card=daily.firstElementChild;
    let wt=mood.querySelector('.wellness-today');if(wt){card.classList.add('wellness2-inline');wt.appendChild(card)}else mood.insertAdjacentElement('afterend',card);
    // Replace legacy summary/history cards with the single Wellness 2.0 summary.
    dash.querySelectorAll('.wellness-history-card').forEach(x=>x.remove());
    let wrap=document.createElement('div');wrap.innerHTML=history();mood.insertAdjacentElement('afterend',wrap.firstElementChild);
  }
  document.addEventListener('click',e=>{
    let b=e.target.closest?.('[data-w2-bool]');if(b){setBool(b.dataset.w2Bool);return}
    let p=e.target.closest?.('[data-period]');if(p){setPeriod(p.dataset.period);return} let pd=e.target.closest?.('[data-period-date]');if(pd){let box=pd.closest('.wellness2-period').querySelector('.period-past-entry');box.hidden=!box.hidden;return} let ps=e.target.closest?.('[data-save-period-date]');if(ps){let inp=ps.closest('.period-past-entry').querySelector('input'),ds=inp.value;if(ds){ensure();data.periodLog[ds]='start';save();render()}return}
    let r=e.target.closest?.('[data-w2-range]');if(r){range=r.dataset.w2Range;render();return}
    let m=e.target.closest?.('[data-w2-mode]');if(m){mode=m.dataset.w2Mode;render();return}
    if(e.target.closest?.('[data-view="habits"],[data-view="today"]'))setTimeout(mount,0);
  });
  new MutationObserver(mount).observe(document.getElementById('dashboard'),{childList:true});
})();