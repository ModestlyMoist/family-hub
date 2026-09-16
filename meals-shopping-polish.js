// Meals & Shopping polish — isolated module v149a
(function(){
  function enhanceMeals(){
    if(typeof view==='undefined'||view!=='meals')return;
    let plan=document.querySelector('.meal-plan-card'),lib=document.querySelector('.meal-library-card-wrap');
    if(plan&&!plan.querySelector('.meal-quick-strip')){
      let today=vegasToday(),todayMeal=data.mealPlan?.[today]||'',planned=habitDays(weekStart()).filter(ds=>data.mealPlan?.[ds]).length;
      let strip=document.createElement('div');strip.className='meal-quick-strip';
      strip.innerHTML='<div><span>Tonight</span><strong>'+(todayMeal||'Not planned')+'</strong></div><div><span>This week</span><strong>'+planned+' / 7 planned</strong></div><button type="button" class="mini" data-meal-jump-library>Meal library ↓</button>';
      plan.querySelector('.card-head')?.after(strip);
    }
    if(lib&&!lib.querySelector('.meal-library-search')){
      let input=document.createElement('input');input.className='meal-library-search';input.placeholder='Search saved meals…';input.setAttribute('aria-label','Search saved meals');
      lib.querySelector('.card-head')?.after(input);
    }
  }
  function enhanceShop(){
    if(typeof view==='undefined'||view!=='shop')return;
    let dash=document.querySelector('#dashboard');if(!dash||dash.querySelector('.shopping-quick-strip'))return;
    let items=(data.staples||[]),need=items.filter(x=>x.need),one=need.filter(x=>x.permanent===false).length,cats=new Set(need.map(x=>x.category||'Other')).size;
    let card=document.createElement('section');card.className='card full shopping-quick-strip';
    card.innerHTML='<div class="shop-quick-stats"><div><span>Need now</span><strong>'+need.length+'</strong></div><div><span>One-time</span><strong>'+one+'</strong></div><div><span>Categories</span><strong>'+cats+'</strong></div></div><input class="shopping-live-filter" placeholder="Filter shopping list…" aria-label="Filter shopping list">';
    dash.prepend(card);
  }
  function enhance(){setTimeout(()=>{enhanceMeals();enhanceShop()},0)}
  document.addEventListener('input',e=>{
    if(e.target.matches('.meal-library-search')){
      let q=e.target.value.trim().toLowerCase();document.querySelectorAll('.meal-library-card').forEach(x=>x.hidden=!!q&&!x.textContent.toLowerCase().includes(q));
    }
    if(e.target.matches('.shopping-live-filter')){
      let q=e.target.value.trim().toLowerCase();
      document.querySelectorAll('#dashboard .item').forEach(x=>{if(x.closest('.shopping-quick-strip'))return;x.hidden=!!q&&!x.textContent.toLowerCase().includes(q)});
    }
  });
  document.addEventListener('click',e=>{
    if(e.target.closest?.('[data-meal-jump-library]'))document.querySelector('.meal-library-card-wrap')?.scrollIntoView({behavior:'smooth',block:'start'});
    if(e.target.closest?.('[data-view="meals"],[data-view="shop"]'))enhance();
    if(e.target.closest?.('[data-action="more"]'))setTimeout(()=>document.querySelectorAll('[data-more-view]').forEach(b=>b.addEventListener('click',enhance,{once:true})),0);
  });
  const mo=new MutationObserver(()=>enhance());mo.observe(document.getElementById('dashboard'),{childList:true});
})();