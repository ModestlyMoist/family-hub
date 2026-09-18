// Budget paycheck timeline v266b — isolated enhancement
(function(){
  function money(n){return '$'+Number(n||0).toLocaleString(undefined,{maximumFractionDigits:2})}
  function esc(s){var d=document.createElement('div');d.textContent=String(s||'');return d.innerHTML}
  function add(ds,n){var d=new Date(ds+'T12:00');d.setDate(d.getDate()+n);return d.toISOString().slice(0,10)}
  function fmt(ds){var d=new Date(ds+'T12:00');return d.toLocaleDateString([],{month:'short',day:'numeric'})}
  function billDate(p,start,end){var cur=new Date(start+'T12:00'),z=new Date(end+'T12:00'),day=Number(p.day)||0;if(!day)return '';while(cur<=z){var max=new Date(cur.getFullYear(),cur.getMonth()+1,0).getDate();if(cur.getDate()===Math.min(day,max))return cur.toISOString().slice(0,10);cur.setDate(cur.getDate()+1)}return ''}
  function card(label,start,end,income,current){
    var bills=(window.data&&data.payments||[]).map(function(p){return {p:p,date:billDate(p,start,end)}}).filter(function(x){return x.date}).sort(function(a,b){return a.date.localeCompare(b.date)});
    var total=bills.reduce(function(s,x){return s+(Number(x.p.amount)||0)},0);var days=Math.round((new Date(end+'T12:00')-new Date(start+'T12:00'))/86400000)+1;var debtMonthly=(window.data&&data.debts||[]).reduce(function(s,d){return s+(Number(d.minimum)||0)},0);var debtReserve=debtMonthly*(days/30.4375);var expenses=(window.data&&data.budgetExpenses||[]).filter(function(x){return x.date>=start&&x.date<=end}).reduce(function(s,x){return s+(Number(x.amount)||0)},0);var committed=total+debtReserve+expenses;var free=Number(income||0)-committed;
    var items=bills.length?bills.map(function(x){return '<div class="bpt-item"><span>'+esc(x.p.name)+'<small>'+fmt(x.date)+'</small></span><b>'+money(x.p.amount)+'</b></div>'}).join(''):'<p class="muted">No monthly bills assigned.</p>';
    return '<div class="bpt-card'+(current?' current':'')+'"><div class="bpt-top"><span>'+label+'</span><b>'+fmt(start)+'</b></div><div class="bpt-income"><strong>'+money(income)+'</strong><small>take-home</small></div><div class="bpt-items">'+items+'</div><div class="bpt-foot"><span>Bills</span><b>'+money(total)+'</b></div></div>'
  }
  function render(){
    var page=document.querySelector('.budget2-page');if(!page||page.querySelector('.bpt-wrap'))return;
    var budget=window.data&&data.budget||{},anchor=budget.nextPayday;if(!anchor)return;
    var step=budget.payFrequency==='weekly'?7:14,today=(typeof vegasToday==='function'?vegasToday():new Date().toISOString().slice(0,10)),next=anchor;
    while(next<today)next=add(next,step);
    var prev=add(next,-step),prior=add(prev,-step),following=add(next,step),income=Number(budget.paycheckAmount)||0;
    var wrap=document.createElement('div');wrap.className='bpt-wrap';
    wrap.innerHTML='<div class="bpt-head"><div><h3>Paycheck timeline</h3><span class="meta">Which bills each paycheck is responsible for.</span></div></div><div class="bpt-track">'+card('Previous paycheck',prior,add(prev,-1),income,false)+card('Current paycheck',prev,add(next,-1),income,true)+card('Next paycheck',next,add(following,-1),income,false)+'</div>';
    var grid=page.querySelector('.budget2-grid');if(grid)page.insertBefore(wrap,grid);else page.appendChild(wrap)
  }
  document.addEventListener('click',function(e){if(e.target.closest&&e.target.closest('[data-action="money"]'))setTimeout(render,0)});
  window.addEventListener('budget2:render',render);
})();