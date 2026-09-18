(function(root){
 'use strict';
 function paid(b,c,m){return c.creditAccountId?0:Math.max(0,Number(b.monthly?.[m]?.paidBeforeTracking?.[c.id]?.amount)||0)}
 function gap(b,c,m){return Math.round(Math.max(0,(Number(c.expectedMonthly)||0)-(Number(b.monthly?.[m]?.assignments?.[c.id])||0)-paid(b,c,m))*100)/100}
 const api={paid,gap};if(typeof module==='object'&&module.exports)module.exports=api;else root.budgetStart=api;
})(typeof window==='object'?window:this);
