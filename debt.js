// Debt Pay Down — v135a
(function(){
  function ensure(){data.debts=data.debts||[]}
  function money(n){return '$'+Number(n||0).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}
  function total(){ensure();return data.debts.reduce((a,d)=>a+(+d.balance||0),0)}
  window.debtView=function(){
    ensure();let debts=[...data.debts].sort((a,b)=>(+a.balance||0)-(+b.balance||0)),bal=total(),mins=debts.reduce((a,d)=>a+(+d.minimum||0),0);
    return '<section class="card full debt-hero"><div class="card-head"><div><div class="eyebrow">MONEY</div><h2>Debt Pay Down</h2><div class="meta">Track balances and record payments as you go.</div></div><button class="primary" id="addDebt">＋ Debt</button></div><div class="debt-stats"><div><span>Total remaining</span><strong>'+money(bal)+'</strong></div><div><span>Accounts</span><strong>'+debts.length+'</strong></div><div><span>Monthly minimums</span><strong>'+money(mins)+'</strong></div></div></section>'+
    '<section class="card full"><div class="card-head"><div><h2>Balances</h2><div class="meta">Lowest balance first for a clear pay-down view</div></div></div><div class="debt-list">'+(debts.length?debts.map(d=>{let start=+d.startingBalance||+d.balance||0,b=+d.balance||0,pct=start?Math.max(0,Math.min(100,(1-b/start)*100)):0;return '<div class="debt-row"><div class="debt-main"><div><b>'+d.name+'</b><div class="meta">'+(d.apr?d.apr+'% APR · ':'')+(d.minimum?'Minimum '+money(d.minimum):'No minimum entered')+'</div></div><strong>'+money(b)+'</strong></div><div class="debt-progress"><i style="width:'+pct+'%"></i></div><div class="debt-foot"><span>'+pct.toFixed(0)+'% paid down</span><div class="item-actions"><button class="mini debt-payment" data-id="'+d.id+'">Record payment</button><button class="mini edit-debt" data-id="'+d.id+'">Edit</button></div></div></div>'}).join(''):'<p class="muted">No debts added yet. Add an account to start tracking your pay down.</p>')+'</div></section>';
  };
  function edit(id){
    ensure();let d=data.debts.find(x=>x.id==id),fresh=!d;if(!d)d={id:Date.now(),name:'',balance:'',startingBalance:'',apr:'',minimum:''};
    $('#modalTitle').textContent=fresh?'Add debt':'Edit debt';
    $('#modalBody').innerHTML='<div class="form-grid"><label class="field full">Account name<input id="debtName" value="'+(d.name||'')+'" placeholder="Credit card, car loan..."></label><label class="field">Current balance<input id="debtBalance" type="number" min="0" step=".01" value="'+(d.balance||'')+'"></label><label class="field">Starting balance<input id="debtStart" type="number" min="0" step=".01" value="'+(d.startingBalance||d.balance||'')+'"></label><label class="field">APR %<input id="debtApr" type="number" min="0" step=".01" value="'+(d.apr||'')+'"></label><label class="field">Minimum payment<input id="debtMin" type="number" min="0" step=".01" value="'+(d.minimum||'')+'"></label></div><div class="modal-actions">'+(fresh?'<span></span>':'<button class="danger" id="deleteDebt">Delete</button>')+'<button class="primary" id="saveDebt">Save</button></div>';
    $('#modal').showModal();
    $('#saveDebt').onclick=()=>{d.name=$('#debtName').value.trim();d.balance=$('#debtBalance').value;d.startingBalance=$('#debtStart').value||d.startingBalance||d.balance;d.apr=$('#debtApr').value;d.minimum=$('#debtMin').value;if(!d.name)return alert('Enter an account name.');if(fresh)data.debts.push(d);save();$('#modal').close();render()};
    $('#deleteDebt')&&($('#deleteDebt').onclick=()=>{if(confirm('Delete this debt?')){data.debts=data.debts.filter(x=>x.id!=d.id);save();$('#modal').close();render()}});
  }
  function payment(id){
    let d=data.debts.find(x=>x.id==id);if(!d)return;
    $('#modalTitle').textContent='Record payment';
    $('#modalBody').innerHTML='<p class="meta">'+d.name+' · current balance '+money(d.balance)+'</p><label class="field">Payment amount<input id="debtPayAmount" type="number" min="0" step=".01" placeholder="0.00"></label><div class="modal-actions"><span></span><button class="primary" id="saveDebtPayment">Apply payment</button></div>';
    $('#modal').showModal();$('#saveDebtPayment').onclick=()=>{let amt=+$('#debtPayAmount').value;if(!(amt>0))return;d.balance=Math.max(0,(+d.balance||0)-amt).toFixed(2);data.debtPayments=data.debtPayments||[];data.debtPayments.push({id:Date.now(),debtId:d.id,amount:amt,date:vegasToday()});save();$('#modal').close();render()}
  }
  document.addEventListener('click',e=>{
    if(e.target.closest?.('#addDebt'))edit();
    let ed=e.target.closest?.('.edit-debt');if(ed)edit(+ed.dataset.id);
    let pay=e.target.closest?.('.debt-payment');if(pay)payment(+pay.dataset.id);
  });
})();