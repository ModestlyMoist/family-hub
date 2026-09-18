const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict');
const clone=x=>JSON.parse(JSON.stringify(x));
const base={budget:{accounts:[{id:'chase',type:'Checking',balance:3000},{id:'visa',name:'Visa',type:'Credit Card',balance:500}],categories:[{id:'food',name:'Groceries'}],monthly:{'2026-09':{assignments:{food:400}}},transactions:[]}};
const local=clone(base);local.budget.accounts[1].balance=600;local.budget.transactions.push({id:'tx-local',date:'2026-09-17',amount:100,accountId:'visa',categoryId:'food',creditAccountId:'visa',creditBudgetVersion:1,type:'expense'});
let posted;const storage=new Map([['familyHubSyncBase',JSON.stringify(base)],['familyHubData',JSON.stringify(local)]]);
const ctx={data:local,Headers,localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},window:{addEventListener(){},fetch:async(input,init)=>{if(init?.method==='POST'){posted=JSON.parse(init.body);return new Response('{}',{status:200})}return new Response(JSON.stringify({data:base}),{status:200})}}};
vm.createContext(ctx);vm.runInContext(fs.readFileSync(__dirname+'/sync-safety.js','utf8'),ctx);vm.runInContext(fs.readFileSync(__dirname+'/credit-card-budget.js','utf8'),ctx);
(async()=>{
 await ctx.window.fetch('https://test.invalid/functions/v1/quick-service',{method:'POST',body:JSON.stringify({data:local})});
 assert.equal(posted.data.budget.transactions.length,1);assert.equal(posted.data.budget.transactions[0].creditBudgetVersion,1);assert.equal(ctx.window.creditCardBudget.calculate().available('card-payment-visa','2026-09'),100);
 assert.equal(JSON.parse(storage.get('familyHubData')).budget.transactions.length,1);
 // Deliberate transaction deletion remains deleted against the unchanged cloud base.
 const saved=clone(posted.data);ctx.data=clone(saved);ctx.data.budget.transactions=[];ctx.data.budget.accounts[1].balance=500;
 ctx.window.fetch;storage.set('familyHubSyncBase',JSON.stringify(saved));
 // merge functions are tested directly to model a stale cloud copy of the last successful save.
 const source=fs.readFileSync(__dirname+'/sync-safety.js','utf8').replace('window.fetch=async function', 'window.testMerge=mergeById;window.fetch=async function');
 const separate={window:{fetch:async()=>{},addEventListener(){}},localStorage:ctx.localStorage};vm.createContext(separate);vm.runInContext(source,separate);
 assert.equal(separate.window.testMerge(saved.budget.transactions,[],saved.budget.transactions).length,0);
 const remoteTx=Object.assign({},saved.budget.transactions[0],{id:'tx-remote'});
 const merged=separate.window.testMerge([],saved.budget.transactions,[remoteTx]);assert.equal(merged.length,2);assert.ok(merged.every(t=>t.creditBudgetVersion===1));
 console.log('Passed: stale-cloud POST, local persistence, card metadata ID merge, deletion protection.');
})().catch(e=>{console.error(e);process.exitCode=1});
