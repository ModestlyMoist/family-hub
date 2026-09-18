// Credit-card cash reservations v282a. Derived from the ID-merged transaction ledger.
(function(){
 'use strict';
 function credit(a){return /^(credit|credit card)$/i.test(String(a&&a.type||''))}
 function cents(n){return Math.round((Number(n)||0)*100)}
 function ensure(){
  data.budget=data.budget||{};var b=data.budget;b.categories=b.categories||[];
  (b.accounts||[]).filter(credit).forEach(function(a){
   var id='card-payment-'+String(a.id);
   if(!b.categories.some(function(c){return String(c.id)===id}))b.categories.push({id:id,name:a.name,group:'Credit Card Payments',creditAccountId:String(a.id),expectedMonthly:0,rolloverMode:'roll'});
  });
 }
 function paymentId(id){return 'card-payment-'+String(id)}
 function calculate(excludeId,throughDate){
  ensure();var b=data.budget,balances={},snapshots={},unfunded={},unreservedByCard={},monthly=b.monthly||{},tx=(b.transactions||[]).filter(function(x){return String(x.id)!==String(excludeId)&&(!throughDate||String(x.date)<=throughDate)}).slice();
  var months=Object.keys(monthly);
  (b.bucketMoves||[]).forEach(function(x){var m=String(x.date).slice(0,7);if(months.indexOf(m)<0)months.push(m)});
  tx.forEach(function(x){var m=String(x.date||'').slice(0,7);if(m&&months.indexOf(m)<0)months.push(m)});
  (data.budgetExpenses||[]).forEach(function(x){var m=String(x.date||'').slice(0,7);if(m&&months.indexOf(m)<0)months.push(m)});
  months.sort();tx.sort(function(a,b){return String(a.date).localeCompare(String(b.date))||String(a.createdAt||a.id).localeCompare(String(b.createdAt||b.id))});
  function add(id,n){balances[id]=(balances[id]||0)+n}
  months.forEach(function(m){
   var as=monthly[m]&&monthly[m].assignments||{};Object.keys(as).forEach(function(id){add(id,cents(as[id]))});
   (data.budgetExpenses||[]).filter(function(x){return String(x.date||'').slice(0,7)===m&&(!throughDate||String(x.date)<=throughDate)}).forEach(function(x){var cat=b.categories.find(function(c){return x.categoryId?String(c.id)===String(x.categoryId):String(c.name).toLowerCase()===String(x.category).toLowerCase()});if(cat)add(cat.id,-cents(x.amount))});
   var events=tx.concat((b.bucketMoves||[]).map(function(x){return Object.assign({type:'bucketMove'},x)})).filter(function(x){return String(x.date||'').slice(0,7)===m&&(!throughDate||String(x.date)<=throughDate)}).sort(function(a,b){return String(a.date).localeCompare(String(b.date))||String(a.createdAt||a.id).localeCompare(String(b.createdAt||b.id))});
   events.forEach(function(x){
    var amt=cents(x.amount);
    if(x.type==='bucketMove'){if(x.fromId!=='__RTA__')add(x.fromId,-amt);if(x.toId!=='__RTA__')add(x.toId,amt)}else if(x.type==='expense'){
     if(x.creditBudgetVersion===1&&x.creditAccountId){
      var funded=Math.min(amt,Math.max(0,balances[x.categoryId]||0));
      add(x.categoryId,-funded);add(paymentId(x.creditAccountId),funded);unfunded[x.id]=(amt-funded)/100;unreservedByCard[x.creditAccountId]=(unreservedByCard[x.creditAccountId]||0)+(amt-funded)/100;
     }else add(x.categoryId,-amt);
    }else if(x.type==='transfer'&&x.creditBudgetVersion===1&&x.creditAccountId)add(paymentId(x.creditAccountId),-amt);
   });
   snapshots[m]=Object.assign({},balances);
  });
  var cash=(b.accounts||[]).filter(function(a){return !credit(a)}).reduce(function(s,a){return s+cents(a.balance)},0),reserved=Object.keys(balances).reduce(function(s,id){return s+balances[id]},0);
  return {cash:cash/100,reserved:reserved/100,ready:(cash-reserved)/100,unfunded:unfunded,unreservedByCard:unreservedByCard,available:function(id,m){var chosen=months.filter(function(mm){return mm<=m}).pop();return chosen?(snapshots[chosen][id]||0)/100:0}};
 }
 function effect(x,direction){
  var accounts=data.budget.accounts||[],from=accounts.find(function(a){return String(a.id)===String(x.accountId)}),to=accounts.find(function(a){return String(a.id)===String(x.transferAccountId)}),amt=cents(x.amount)*direction;
  if(!from)throw new Error('Account no longer exists.');
  if(x.type==='transfer'){
   if(!to)throw new Error('Destination account no longer exists.');
   from.balance=(cents(from.balance)-amt)/100;
   to.balance=(cents(to.balance)+(credit(to)&&x.creditBudgetVersion===1?-amt:amt))/100;
  }else if(x.type==='income'||x.type==='adjustment')from.balance=(cents(from.balance)+amt)/100;
  else from.balance=(cents(from.balance)+(credit(from)?amt:-amt))/100;
 }
 function prepare(x,old){
  var accounts=data.budget.accounts||[],from=accounts.find(function(a){return String(a.id)===String(x.accountId)}),to=accounts.find(function(a){return String(a.id)===String(x.transferAccountId)});
  if(!from)return 'Choose an existing account.';
  if(!/^\d{4}-\d{2}-\d{2}$/.test(x.date)||!Number.isFinite(Number(x.amount))||(x.type==='adjustment'?cents(x.amount)===0:cents(x.amount)<=0))return 'Enter a valid date and amount.';
  var dateCheck=new Date(x.date+'T12:00:00Z');if(!Number.isFinite(dateCheck.getTime())||dateCheck.toISOString().slice(0,10)!==x.date)return 'Choose a valid date.';x.amount=cents(x.amount)/100;delete x.creditAccountId;delete x.creditBudgetVersion;
  if(x.type==='income'||x.type==='adjustment'){if(x.type==='income'&&credit(from))return 'Income must enter a cash account.';return ''}
  if(x.type!=='expense'&&x.type!=='transfer')return 'Choose a supported transaction type.';
  if(x.type==='transfer'){
   if(!to||String(from.id)===String(to.id))return 'Choose two different existing accounts.';
   if(credit(from))return 'Transfers from a credit card are not supported yet.';
   if(credit(to)){
    var available=calculate(old&&old.id,x.date).available(paymentId(to.id),x.date.slice(0,7));
    if(cents(x.amount)>cents(available))return 'Assign enough money to '+to.name+' in Credit Card Payments before paying the card.';
    var owed=cents(to.balance),cash=cents(from.balance);
    if(old&&old.type==='transfer'){
     if(String(old.transferAccountId)===String(to.id))owed+=cents(old.amount)*(old.creditBudgetVersion===1?1:-1);
     if(String(old.accountId)===String(from.id))cash+=cents(old.amount);
    }else if(old&&String(old.accountId)===String(to.id))owed-=cents(old.amount);
    else if(old&&String(old.accountId)===String(from.id))cash+=cents(old.amount);
    if(cents(x.amount)>owed)return 'The payment cannot exceed the amount owed.';
    if(cents(x.amount)>cash)return 'The paying account does not have enough cash.';
    x.creditBudgetVersion=1;x.creditAccountId=String(to.id);
   }
  }else{
   var cat=(data.budget.categories||[]).find(function(c){return String(c.id)===String(x.categoryId)});
   if(!cat||cat.creditAccountId)return 'Choose a spending bucket. Pay credit cards with Transfer.';
   if(credit(from)){x.creditBudgetVersion=1;x.creditAccountId=String(from.id)}
  }
  return '';
 }
 window.creditCardBudget={ensure:ensure,calculate:calculate,credit:credit,effect:effect,prepare:prepare};
})();


