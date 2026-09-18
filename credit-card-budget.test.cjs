const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const context={window:{},data:{budget:{accounts:[{id:'chase',type:'Checking',name:'Chase',balance:3000},{id:'visa',type:'Credit Card',name:'Capital One Visa',balance:500}],categories:[{id:'food',name:'Groceries',group:'Everyday'}],monthly:{'2026-09':{assignments:{food:400}},'2026-10':{assignments:{}}},transactions:[]}}};
vm.createContext(context);vm.runInContext(fs.readFileSync(__dirname+'/credit-card-budget.js','utf8'),context);
const api=context.window.creditCardBudget,b=context.data.budget;
function expense(id,amount,date='2026-09-17'){return {id,date,amount,merchant:"Smith's",accountId:'visa',categoryId:'food',type:'expense',createdAt:id}}
function payment(id,amount){return {id,date:'2026-09-18',amount,accountId:'chase',transferAccountId:'visa',type:'transfer'}}
function add(x){assert.equal(api.prepare(x),'');b.transactions.push(x);api.effect(x,1);return x}
function remove(x){api.effect(x,-1);b.transactions=b.transactions.filter(t=>t.id!==x.id)}
function state(food,reserve,cash,owed,ready){const t=api.calculate();assert.equal(t.available('food','2026-09'),food);assert.equal(t.available('card-payment-visa','2026-09'),reserve);assert.equal(b.accounts[0].balance,cash);assert.equal(b.accounts[1].balance,owed);assert.equal(t.ready,ready)}
api.ensure();assert.equal(b.categories.length,2);api.ensure();assert.equal(b.categories.length,2);
state(400,0,3000,500,2600);
const purchase=add(expense('1',100));state(300,100,3000,600,2600);
assert.equal(api.calculate().available('card-payment-visa','2026-10'),100);
assert.equal(b.monthly['2026-09'].assignments.food,400);
const pay=add(payment('2',100));state(300,0,2900,500,2600);
assert.equal(b.transactions.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0),100);
remove(pay);state(300,100,3000,600,2600);
const edited=Object.assign({},purchase,{amount:150});assert.equal(api.prepare(edited,purchase),'');api.effect(purchase,-1);Object.assign(purchase,edited);api.effect(purchase,1);state(250,150,3000,650,2600);
remove(purchase);state(400,0,3000,500,2600);
b.monthly['2026-09'].assignments.food=40;
const partial=add(expense('3',100));state(0,40,3000,600,2960);assert.equal(api.calculate().unfunded['3'],60);
assert.match(api.prepare(payment('bad',100)),/Assign enough/);state(0,40,3000,600,2960);
remove(partial);state(40,0,3000,500,2960);
b.monthly['2026-09'].assignments['card-payment-visa']=100;
const oldDebtPayment=add(payment('4',100));state(40,0,2900,400,2860);remove(oldDebtPayment);
const debit={id:'5',date:'2026-09-17',amount:10,accountId:'chase',categoryId:'food',type:'expense'};add(debit);state(30,100,2990,500,2860);remove(debit);
b.accounts.push({id:'savings',type:'Savings',balance:50});
const transfer=add({id:'6',date:'2026-09-17',amount:20,accountId:'chase',transferAccountId:'savings',type:'transfer'});assert.equal(api.calculate().cash,3050);assert.equal(b.accounts[2].balance,70);remove(transfer);
assert.match(api.prepare({id:'bad',date:'2026-09-17',amount:10,accountId:'visa',transferAccountId:'chase',type:'transfer'}),/not supported/);
// Existing expenses do not gain reserves during migration. Old transfer reversal uses its historical signs.
b.monthly['2026-09'].assignments['card-payment-visa']=0;
b.transactions.push({id:'legacy',date:'2026-09-17',amount:10,accountId:'visa',categoryId:'food',type:'expense'});assert.equal(api.calculate().available('card-payment-visa','2026-09'),0);b.transactions=[];
b.accounts[0].balance=2900;b.accounts[1].balance=600;
api.effect(payment('legacy-transfer',100),-1);assert.equal(b.accounts[0].balance,3000);assert.equal(b.accounts[1].balance,500);
// Reserve survives serialization and derives again from merged ledger rows.
add(expense('7',25));const before=api.calculate();context.data=JSON.parse(JSON.stringify(context.data));assert.equal(api.calculate().available('card-payment-visa','2026-09'),before.available('card-payment-visa','2026-09'));
console.log('Passed: funded purchase/payment, old debt, partial funding, edit/delete, cash transfers, legacy preservation, rollover, refresh.');
