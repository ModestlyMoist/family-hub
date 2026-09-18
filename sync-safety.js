// Family Hub — cross-device sync safety v283a
(function(){
  const SYNC_MATCH='/functions/v1/quick-service';
  const nativeFetch=window.fetch.bind(window);
  const BASE_KEY='familyHubSyncBase';
  const BACKUP_KEY='familyHubDataBackup';
  const PENDING_KEY='familyHubSyncPending';
  let saveQueue=Promise.resolve();
  const clone=v=>v==null?v:JSON.parse(JSON.stringify(v));
  const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
  const isObj=v=>v&&typeof v==='object'&&!Array.isArray(v);
  function merge3(base,local,remote){
    if(same(local,base))return clone(remote);
    if(same(remote,base))return clone(local);
    if(same(local,remote))return clone(local);
    if(isObj(local)&&isObj(remote)){
      let out={},keys=new Set([...Object.keys(base||{}),...Object.keys(local||{}),...Object.keys(remote||{})]);
      keys.forEach(k=>{
        let hasL=Object.prototype.hasOwnProperty.call(local,k),hasR=Object.prototype.hasOwnProperty.call(remote,k),hasB=Object.prototype.hasOwnProperty.call(base||{},k);
        if(!hasL&&hasB&&!same(remote[k],base[k]))out[k]=clone(remote[k]);
        else if(!hasR&&hasB&&!same(local[k],base[k]))out[k]=clone(local[k]);
        else if(hasL&&hasR)out[k]=merge3((base||{})[k],local[k],remote[k]);
        else if(hasL)out[k]=clone(local[k]);else if(hasR)out[k]=clone(remote[k]);
      });return out;
    }
    // When both devices changed the exact same scalar/array, preserve the change being saved now.
    return clone(local);
  }
  function mergeById(base,local,remote,deleted){
    let rows=new Map(),byBase=new Map((base||[]).filter(x=>x&&x.id!=null).map(x=>[String(x.id),x]));
    (remote||[]).forEach(x=>{if(x&&x.id!=null)rows.set(String(x.id),clone(x))});
    (local||[]).forEach(x=>{if(!x||x.id==null)return;let id=String(x.id),r=rows.get(id);rows.set(id,r?merge3(byBase.get(id),x,r):clone(x))});
    return [...rows.values()].filter(x=>!deleted?.[String(x.id)]);
  }
  function ledgerEffect(state){
    let out={},accounts=state?.budget?.accounts||[],credit=id=>/^(credit|credit card)$/i.test(accounts.find(a=>String(a.id)===String(id))?.type||'');
    const add=(id,n)=>{out[String(id)]=(out[String(id)]||0)+n};
    (state?.budget?.transactions||[]).forEach(x=>{let amount=Math.round((Number(x.amount)||0)*100);if(x.type==='transfer'){add(x.accountId,-amount);add(x.transferAccountId,credit(x.transferAccountId)&&x.creditBudgetVersion===1?-amount:amount)}else if(x.type==='expense')add(x.accountId,credit(x.accountId)?amount:-amount)});
    return out;
  }
  function protectTransactionArrays(base,local,remote,merged){
    let l=local?.budget?.transactions,r=remote?.budget?.transactions;if(!Array.isArray(l)&&!Array.isArray(r))return merged;
    merged.budget=merged.budget||{};
    let deleted={...(base?.budget?.transactionDeletes||{}),...(remote?.budget?.transactionDeletes||{}),...(local?.budget?.transactionDeletes||{})};
    merged.budget.transactionDeletes=deleted;
    merged.budget.transactions=mergeById(base?.budget?.transactions||[],l||[],r||[],deleted);
    let source=same(merged.budget.accounts,remote?.budget?.accounts)?remote:local,before=ledgerEffect(source),after=ledgerEffect(merged);
    (merged.budget.accounts||[]).forEach(a=>{let delta=(after[String(a.id)]||0)-(before[String(a.id)]||0);if(delta)a.balance=(Math.round((Number(a.balance)||0)*100)+delta)/100});
    return merged;
  }
  function archiveTransactions(v){
    try{let archive=JSON.parse(localStorage.getItem('familyHubTransactionArchive')||'{}');(v?.budget?.transactions||[]).forEach(x=>{if(x?.id!=null)archive[String(x.id)]={transaction:clone(x),accounts:clone(v.budget.accounts||[]),savedAt:new Date().toISOString()}});localStorage.setItem('familyHubTransactionArchive',JSON.stringify(archive))}catch(e){}
  }
  function rememberBackup(v){try{archiveTransactions(JSON.parse(localStorage.getItem(BACKUP_KEY)||'null')?.data);archiveTransactions(v);if(v&&Object.keys(v).length)localStorage.setItem(BACKUP_KEY,JSON.stringify({savedAt:new Date().toISOString(),data:v}))}catch(e){}}
  function setBase(v){try{localStorage.setItem(BASE_KEY,JSON.stringify(v||{}))}catch(e){}}
  function getBase(){try{return JSON.parse(localStorage.getItem(BASE_KEY)||'{}')}catch(e){return {}}}
  function applyMerged(v){try{rememberBackup(JSON.parse(localStorage.getItem('familyHubData')||'null'));localStorage.setItem('familyHubData',JSON.stringify(v));if(typeof data!=='undefined')data=v}catch(e){}}
  window.fetch=async function(input,init){
    let url=typeof input==='string'?input:input?.url||'';
    if(!url.includes(SYNC_MATCH))return nativeFetch(input,init);
    let method=(init?.method||input?.method||'GET').toUpperCase();
    if(method==='GET'){
      let res=await nativeFetch(input,init);
      if(!res.ok)return res;
      try{
        let j=await res.clone().json();if(j?.data&&Object.keys(j.data).length){
          let local=JSON.parse(localStorage.getItem('familyHubData')||'{}'),base=getBase();rememberBackup(local);
          let merged=protectTransactionArrays(base,local,j.data,merge3(base,local,j.data));setBase(j.data);
          if(!same(merged,j.data))localStorage.setItem(PENDING_KEY,'1');else localStorage.removeItem(PENDING_KEY);
          return new Response(JSON.stringify({...j,data:merged}),{status:res.status,headers:res.headers});
        }
      }catch(e){}
      return res;
    }
    if(method!=='POST'||!init?.body)return nativeFetch(input,init);
    let outgoing;try{outgoing=JSON.parse(init.body)}catch(e){return nativeFetch(input,init)}
    if(!outgoing?.data)return nativeFetch(input,init);
    const run=async()=>{
      let local=clone(typeof data!=='undefined'?data:outgoing.data),base=getBase();rememberBackup(local);
      try{
        let latest=await nativeFetch(url,{method:'GET',headers:new Headers(init.headers||{})});
        if(!latest.ok){localStorage.setItem(PENDING_KEY,'1');return latest}
        let j=await latest.json(),remote=j?.data||{};
        let merged=protectTransactionArrays(base,local,remote,merge3(base,local,remote));
        let res=await nativeFetch(input,{...init,body:JSON.stringify({...outgoing,data:merged})});
        if(res.ok){
          let current=clone(typeof data!=='undefined'?data:local);
          let applied=protectTransactionArrays(local,current,merged,merge3(local,current,merged));
          setBase(merged);applyMerged(applied);
          if(same(applied,merged))localStorage.removeItem(PENDING_KEY);else localStorage.setItem(PENDING_KEY,'1');
          if(!same(applied,local))setTimeout(()=>{
            if(document.querySelector('.budget2-page')){window.dispatchEvent(new Event('budgetAccounts:render'));window.dispatchEvent(new Event('budgetTransactions:changed'))}
            else if(typeof render==='function')render();
          },0);
        }else localStorage.setItem(PENDING_KEY,'1');
        return res;
      }catch(e){localStorage.setItem(PENDING_KEY,'1');throw e}
    };
    let next=saveQueue.then(run,run);saveQueue=next.catch(()=>{});return next;
  };
  window.addEventListener('online',()=>{try{if(localStorage.getItem(PENDING_KEY)&&typeof syncSave==='function')syncSave()}catch(e){}});
})();
