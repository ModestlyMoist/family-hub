// Shared dashboard preferences and read-only tile summaries.
(function(root){
 'use strict';
 const registry=[
 ['at-a-glance','At a glance','Family overview','.family-glance'],['up-next','Up next','Upcoming family events','.family-next'],['today','Today','Immediate tasks and dinner','.family-today'],
 ['weather','Weather','Two-city conditions'],['week-at-a-glance','Week at a glance','Seven-day schedule'],['habits','Habits','Routine progress'],['meals-this-week','Meals this week','Dinner plans'],['shopping','Shopping','Items needed'],['payments','Payments','Unpaid scheduled bills'],['tasks','Tasks','Tasks due'],['sports','Sports','Games and practices','.dash-sports'],['wellness','Wellness','Daily check-ins','.dash-wellness'],['debt-pay-down','Debt progress','Tracked debt progress','.dash-debt'],
 ['budget-snapshot','Budget snapshot','Cash, buckets and ready to assign',null,true],['card-payments','Credit card payments','Carried payment reserves and shortfalls',null,true],['budget-attention','Budget attention','Overspending and monthly funding gaps',null,true],['savings-goals','Savings goals','Selected categories with existing targets',null,true],['recent-transactions','Recent transactions','Latest recorded ledger entries',null,true],['quick-actions','Quick actions','Shortcuts to existing entry forms',null,true]
 ].map(([id,name,description,selector,added])=>({id,name,description,selector,added:!!added}));
 const native={weather:'weather','week-at-a-glance':'week',habits:'habits','meals-this-week':'meals',shopping:'shopping',payments:'payments',tasks:'household'};
 function normalize(settings={}){
  const raw=settings.dashboard||{},old=Array.isArray(raw.order)?raw.order:(Array.isArray(settings.dashboardOrderAll)?settings.dashboardOrderAll:[]),known=registry.map(x=>x.id),order=[...new Set([...old,...known])];
  if(!old.includes('budget-snapshot')){order.splice(order.indexOf('budget-snapshot'),1);order.splice(order.indexOf('today')+1,0,'budget-snapshot')}const enabled={...(raw.enabled||{})};registry.forEach(t=>{if(typeof enabled[t.id]!=='boolean')enabled[t.id]=t.added?t.id==='budget-snapshot':settings.homeCards?.[native[t.id]]!==false});
  return {version:1,order,enabled,options:{...(raw.options||{})},hideAmounts:!!raw.hideAmounts,monthMode:raw.monthMode==='selected'?'selected':'current'};
 }
 function defaults(){return normalize({})}
 function options(p,id){const o=p.options[id]||{};return {...o,density:o.density==='compact'?'compact':'expanded',collapsed:!!o.collapsed,limit:[3,5,10].includes(Number(o.limit))?Number(o.limit):3,people:Array.isArray(o.people)?o.people:[],groups:Array.isArray(o.groups)?o.groups:[],accounts:Array.isArray(o.accounts)?o.accounts:[],categories:Array.isArray(o.categories)?o.categories:[],locations:Array.isArray(o.locations)?o.locations:[]}}
 function summarize(data,calc,month){
  const b=data.budget||{},cats=(b.categories||[]).filter(c=>!c.archived),round=n=>Math.round((Number(n)||0)*100)/100;
  const attention=cats.filter(c=>!c.creditAccountId).map(c=>({id:String(c.id),name:c.name,group:c.group,available:calc.available(c.id,month),gap:round(Math.max(0,(Number(c.expectedMonthly)||0)-(Number(b.monthly?.[month]?.assignments?.[c.id])||0)-Math.max(0,Number(b.monthly?.[month]?.paidBeforeTracking?.[c.id]?.amount)||0)))})).filter(c=>c.available<0||c.gap>0);
  const cards=(b.accounts||[]).filter(a=>/^(credit|credit card)$/i.test(a.type||'')).map(a=>{let reserve=calc.available('card-payment-'+a.id,month),owed=Number(a.balance)||0;return {id:String(a.id),name:a.name,owed,reserve,shortfall:round(Math.max(0,owed-reserve))}});
  const goals=cats.filter(c=>!c.creditAccountId&&Number(c.goalAmount)>0).map(c=>({id:String(c.id),name:c.name,group:c.group,target:Number(c.goalAmount),date:c.goalDate||'',available:calc.available(c.id,month),percent:Math.min(100,Math.max(0,Math.round(calc.available(c.id,month)/Number(c.goalAmount)*100)))}));
  return {attention,cards,goals,transactions:(b.transactions||[]).slice().sort((a,b)=>String(b.date).localeCompare(String(a.date))||String(b.createdAt||b.id).localeCompare(String(a.createdAt||a.id)))};
 }
 const api={registry,native,normalize,defaults,options,summarize};if(typeof module==='object'&&module.exports)module.exports=api;else root.familyHubDashboardModel=api;
})(typeof window==='object'?window:this);
