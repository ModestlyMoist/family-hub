const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict');
const clone=x=>JSON.parse(JSON.stringify(x)),source=fs.readFileSync(__dirname+'/sync-safety.js','utf8');
const transaction={id:'tx-test',type:'expense',date:'2026-09-17',merchant:'Test',amount:150,accountId:'visa',categoryId:'disney',creditAccountId:'visa',creditBudgetVersion:1};
function state(tx=true){return {budget:{accounts:[{id:'cash',type:'Checking',balance:3000},{id:'visa',type:'Credit Card',balance:tx?650:500}],transactions:tx?[clone(transaction)]:[],monthly:{'2026-09':{assignments:{disney:0}}}}}}
function runtime(local,base,remote){
 let posted,rendered=0,events=[],release,hold=false,postCount=0;
 const storage=new Map([['familyHubData',JSON.stringify(local)],['familyHubSyncBase',JSON.stringify(base)],['familyHubDataBackup',JSON.stringify({data:base})]]);
 const ctx={data:local,Headers,Response,Event:class{constructor(type){this.type=type}},document:{querySelector:()=>({})},setTimeout:fn=>fn(),render:()=>rendered++,localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},window:{addEventListener(){},dispatchEvent:e=>events.push(e.type),fetch:async(url,init)=>{
  if(init?.method==='POST'){postCount++;posted=JSON.parse(init.body).data;if(hold){hold=false;await new Promise(r=>release=r)}remote=clone(posted);return new Response('{}',{status:200})}return new Response(JSON.stringify({data:remote}),{status:200})
 }}};
 vm.createContext(ctx);vm.runInContext(source,ctx);return {ctx,storage,get posted(){return posted},get rendered(){return rendered},events,get postCount(){return postCount},hold(){hold=true},release(){release()},save(){return ctx.window.fetch('https://test.invalid/functions/v1/quick-service',{method:'POST',body:JSON.stringify({data:ctx.data})})}};
}
(async()=>{
 // Regression: unchanged local transaction is absent from a stale cloud copy that rolls the card back.
 let r=runtime(state(),state(),state(false));r.ctx.data.budget.monthly['2026-09'].assignments.disney=300;await r.save();assert.equal(r.posted.budget.transactions.length,1);assert.equal(r.posted.budget.accounts[1].balance,650);assert.equal(r.ctx.data.budget.monthly['2026-09'].assignments.disney,300);assert.equal(r.rendered,0);assert.ok(r.events.includes('budgetTransactions:changed'));
 // GET on reopening retains local ledger rows and fixes the selected cloud balance.
 r=runtime(state(),state(),state(false));const response=await r.ctx.window.fetch('https://test.invalid/functions/v1/quick-service');const loaded=(await response.json()).data;assert.equal(loaded.budget.transactions.length,1);assert.equal(loaded.budget.accounts[1].balance,650);assert.equal(JSON.parse(r.storage.get('familyHubTransactionArchive'))['tx-test'].transaction.amount,150);
 // A real delete has a tombstone; a stale copy cannot resurrect it.
 const deleted=state(false);deleted.budget.transactionDeletes={'tx-test':'2026-09-18T00:00:00Z'};r=runtime(deleted,state(),state());await r.save();assert.equal(r.posted.budget.transactions.length,0);assert.equal(r.posted.budget.accounts[1].balance,500);
 // Assignment edited while the first POST is in flight must survive its response; next POST waits.
 r=runtime(state(),state(),state());r.hold();const first=r.save();while(!r.postCount)await new Promise(resolve=>setImmediate(resolve));r.ctx.data.budget.monthly['2026-09'].assignments.disney=300;const second=r.save();assert.equal(r.postCount,1);r.release();await first;assert.equal(r.ctx.data.budget.monthly['2026-09'].assignments.disney,300);await second;assert.equal(r.postCount,2);assert.equal(r.posted.budget.monthly['2026-09'].assignments.disney,300);assert.equal(r.posted.budget.transactions.length,1);
 // Independent device purchases combine ledger rows AND account effects exactly once.
 const local=state(),remote=state();remote.budget.transactions[0].id='tx-remote';remote.budget.transactions[0].amount=50;remote.budget.accounts[1].balance=550;r=runtime(local,state(false),remote);await r.save();assert.equal(r.posted.budget.transactions.length,2);assert.equal(r.posted.budget.accounts[1].balance,700);
 console.log('Passed: stale-copy loss reproduction, GET protection, balance reconciliation, tombstone delete, overlapping saves, independent-device purchases, Money navigation, backup archive.');
})().catch(e=>{console.error(e);process.exitCode=1});
