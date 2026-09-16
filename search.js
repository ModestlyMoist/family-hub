// Universal Search — isolated feature module (v117a)
(function(){
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const norm=s=>String(s??'').toLowerCase().trim();
  function items(){
    const out=[];
    (data.events||[]).forEach(e=>out.push({type:'Event',icon:'▦',title:e.title,meta:[e.person,e.type,e.date,e.location].filter(Boolean).join(' · '),text:[e.title,e.person,e.type,e.date,e.location,e.bring,e.notes].join(' '),target:'calendar'}));
    (data.tasks||[]).forEach(t=>out.push({type:'Task',icon:'✓',title:t.name,meta:[t.category,t.assigned,t.due].filter(Boolean).join(' · '),text:[t.name,t.category,t.assigned,t.due,t.notes,t.cycle].join(' '),target:'tasks'}));
    (data.habits||[]).forEach(h=>out.push({type:h.trackerType==='checkin'?'Check-in':'Habit',icon:h.trackerType==='checkin'?'♡':'★',title:h.name,meta:[h.category,h.person].filter(Boolean).join(' · '),text:[h.name,h.category,h.person,h.notes].join(' '),target:'habits'}));
    (data.meals||[]).forEach(m=>out.push({type:'Meal',icon:'♨',title:m.name,meta:(m.ingredients||'').slice(0,100),text:[m.name,m.ingredients,m.recipe,(m.ingredientItems||[]).map(x=>x.name||x).join(' ')].join(' '),target:'meals'}));
    (data.staples||[]).forEach(s=>out.push({type:'Shopping',icon:'☑',title:s.name,meta:[s.category,s.need?'Needed':'Have it'].filter(Boolean).join(' · '),text:[s.name,s.category,s.unit].join(' '),target:'shop'}));
    (data.payments||[]).forEach(p=>out.push({type:'Payment',icon:'$',title:p.name,meta:[p.amount?('$'+p.amount):'',p.day?('Due day '+p.day):'',p.paid?'Paid':'Upcoming'].filter(Boolean).join(' · '),text:[p.name,p.amount,p.day,p.paid?'paid':'upcoming'].join(' '),target:'more'}));
    (data.expenses||[]).forEach(e=>out.push({type:'Expense',icon:'$',title:e.name||e.title||'Expense',meta:[e.amount?('$'+e.amount):'',e.date||e.due||''].filter(Boolean).join(' · '),text:[e.name,e.title,e.amount,e.date,e.due,e.notes].join(' '),target:'more'}));
    return out;
  }
  function results(q){
    q=norm(q);
    if(!q)return '<div class="search-empty"><b>Search everything in one place</b><span>Try a task, meal, person, ingredient, payment, shopping item, or event.</span></div>';
    const terms=q.split(/\s+/).filter(Boolean);
    const found=items().filter(x=>terms.every(t=>norm(x.text).includes(t))).slice(0,60);
    if(!found.length)return '<div class="search-empty"><b>No matches found</b><span>Try a shorter or different search.</span></div>';
    return '<div class="search-count">'+found.length+' result'+(found.length===1?'':'s')+'</div>'+found.map(x=>'<button type="button" class="search-result" data-search-target="'+esc(x.target)+'"><span class="search-result-icon">'+x.icon+'</span><span class="search-result-copy"><b>'+esc(x.title)+'</b><small>'+esc(x.type+(x.meta?' · '+x.meta:''))+'</small></span><span class="search-arrow">›</span></button>').join('');
  }
  window.searchView=function(){
    const q=(data.settings&&data.settings.searchQuery)||'';
    return '<section class="card full search-card"><div class="eyebrow">FIND ANYTHING</div><h2>Search Family Hub</h2><div class="search-box"><span>⌕</span><input id="familySearch" type="search" autocomplete="off" placeholder="Search tasks, meals, events, habits, payments…" value="'+esc(q)+'"></div><div id="searchResults" class="search-results">'+results(q)+'</div></section>';
  };
  document.addEventListener('input',e=>{
    if(e.target&&e.target.id==='familySearch'){
      data.settings=data.settings||{};
      data.settings.searchQuery=e.target.value;
      const el=document.getElementById('searchResults');
      if(el)el.innerHTML=results(e.target.value);
    }
  });
  document.addEventListener('click',e=>{
    const row=e.target.closest&&e.target.closest('.search-result');
    if(row){
      view=row.dataset.searchTarget;
      render();
    }
  });
})();