// Family Hub — cross-device sync safety v283a
(function(){
  const SYNC_MATCH='/functions/v1/quick-service';
  const nativeFetch=window.fetch.bind(window);
  const BASE_KEY='familyHubSyncBase';
  const BACKUP_KEY='familyHubDataBackup';
  const PENDING_KEY='familyHubSyncPending';
  let saveQueue=Promise.resolve();
  function status(state,message){window.familyHubSyncStatus={state,message,at:new Date().toISOString()};if(typeof Event!=='undefined')window.dispatchEvent(new Event('familyHub:syncStatus'))}
  const clone=v=>v==null?v:JSON.parse(JSON.stringify(v));
  const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
  const isObj=v=>v&&typeof v==='object'&&!Array.isArray(v);
  function conflicts(base,local,remote,path=[]){
    if(same(local,base)||same(remote,base)||same(local,remote))return [];
    if(path.join('.')==='budget.activeMonth')return [];if(path[0]==='budget'&&path[1]==='accounts'&&path.at(-1)==='balance')return []; // Account effects are reconciled from the merged ledger below.
    if(Array.isArray(local)&&Array.isArray(remote)&&local.concat(remote).every(x=>isObj(x)&&x.id!=null))return [...new Set([...local,...remote].map(x=>String(x.id)))].flatMap(id=>conflicts((base||[]).find(x=>String(x.id)===id),local.find(x=>String(x.id)===id),remote.find(x=>String(x.id)===id),path.concat('@'+id)));
    if(isObj(local)&&isObj(remote))return [...new Set([...Object.keys(local),...Object.keys(remote)])].flatMap(k=>conflicts(base?.[k],local[k],remote[k],path.concat(k)));
    // Missing transaction rows are protected by the explicit deletion ledger, not treated as deletion conflicts.
    if(path.join('.').startsWith('budget.transactions.')&&(local==null||remote==null))return [];
    return [{path,local:clone(local),remote:clone(remote)}];
  }
  window.familyHubSync={resolve:choices=>{
    let c=window.familyHubSyncConflict;if(!c)return;let current=clone(typeof data!=='undefined'?data:c.local);
    let before=ledgerEffect(current);
    c.fields.forEach((field,i)=>{if(choices[i]!=='remote')return;let obj=current;field.path.slice(0,-1).forEach(k=>{obj=k.startsWith('@')?obj.find(x=>String(x.id)===k.slice(1)):obj[k]});let k=field.path.at(-1);if(k.startsWith('@')){let index=obj.findIndex(x=>String(x.id)===k.slice(1));if(field.remote==null)obj.splice(index,1);else obj[index]=clone(field.remote)}else if(field.remote===undefined)delete obj[k];else obj[k]=clone(field.remote)});
    let after=ledgerEffect(current);(current.budget?.accounts||[]).forEach(a=>a.balance=(Math.round(Number(a.balance)*100)+(after[String(a.id)]||0)-(before[String(a.id)]||0))/100);
    setBase(c.remote);applyMerged(current);window.familyHubSyncConflict=null;status('pending','Conflict reviewed. Saving your choices.');if(typeof syncSave==='function')syncSave();
  }};
  function merge3(base,local,remote){
    if(same(local,base))return clone(remote);
    if(same(remote,base))return clone(local);
    if(same(local,remote))return clone(local);
    if(Array.isArray(local)&&Array.isArray(remote)&&local.concat(remote).every(x=>isObj(x)&&x.id!=null)){
      let ids=new Set([...(base||[]).map(x=>String(x.id)),...local.map(x=>String(x.id)),...remote.map(x=>String(x.id))]);
      return [...ids].map(id=>{let b=(base||[]).find(x=>String(x.id)===id),l=local.find(x=>String(x.id)===id),r=remote.find(x=>String(x.id)===id);return merge3(b,l,r)}).filter(x=>x!=null);
    }
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
    (state?.budget?.transactions||[]).forEach(x=>{let amount=Math.round((Number(x.amount)||0)*100);if(x.type==='transfer'){add(x.accountId,-amount);add(x.transferAccountId,credit(x.transferAccountId)&&x.creditBudgetVersion===1?-amount:amount)}else if(x.type==='expense')add(x.accountId,credit(x.accountId)?amount:-amount);else if(x.type==='income'||x.type==='adjustment')add(x.accountId,amount)});
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
  function rememberBackup(v){try{archiveTransactions(JSON.parse(localStorage.getItem(BACKUP_KEY)||'null')?.data);archiveTransactions(v);if(v&&Object.keys(v).length){let ring=JSON.parse(localStorage.getItem('familyHubBackups')||'[]');if(!same(ring[0]?.data,v)){ring.unshift({savedAt:new Date().toISOString(),data:clone(v)});localStorage.setItem('familyHubBackups',JSON.stringify(ring.slice(0,10)))}localStorage.setItem(BACKUP_KEY,JSON.stringify({savedAt:new Date().toISOString(),data:v}))}}catch(e){}}
  function setBase(v){try{localStorage.setItem(BASE_KEY,JSON.stringify(v||{}))}catch(e){}}
  function getBase(){try{return JSON.parse(localStorage.getItem(BASE_KEY)||'{}')}catch(e){return {}}}
  function applyMerged(v){try{rememberBackup(JSON.parse(localStorage.getItem('familyHubData')||'null'));localStorage.setItem('familyHubData',JSON.stringify(v));if(typeof data!=='undefined')data=v}catch(e){}}
  window.fetch=async function(input,init){
    let url=typeof input==='string'?input:input?.url||'';
    if(!url.includes(SYNC_MATCH))return nativeFetch(input,init);
    if(/[?&](history|snapshot)=/.test(url))return nativeFetch(input,init);
    let method=(init?.method||input?.method||'GET').toUpperCase();
    if(method==='GET'){
      status('loading','Loading cloud copy');
      let res=await nativeFetch(input,init);
      if(!res.ok){status('failed','Cloud load failed');return res}
      try{
        let j=await res.clone().json();if(j?.data&&Object.keys(j.data).length){
          let local=JSON.parse(localStorage.getItem('familyHubData')||'{}'),base=getBase();rememberBackup(local);
          let fields=conflicts(base,local,j.data),merged=protectTransactionArrays(base,local,j.data,merge3(base,local,j.data));if(fields.length)window.familyHubSyncConflict={local:merged,remote:j.data,fields};else setBase(j.data);
          if(!same(merged,j.data))localStorage.setItem(PENDING_KEY,'1');else localStorage.removeItem(PENDING_KEY);
          status(fields.length?'conflict':same(merged,j.data)?'saved':'pending',fields.length?'Both devices changed the same fields. Review before saving.':same(merged,j.data)?'Saved to cloud':'Local changes waiting to save');
          return new Response(JSON.stringify({...j,data:merged}),{status:res.status,headers:res.headers});
        }
      }catch(e){}
      return res;
    }
    if(method!=='POST'||!init?.body)return nativeFetch(input,init);
    let outgoing;try{outgoing=JSON.parse(init.body)}catch(e){return nativeFetch(input,init)}
    if(!outgoing?.data)return nativeFetch(input,init);
    const run=async()=>{
      status('saving','Saving changes');
      let local=clone(typeof data!=='undefined'?data:outgoing.data),base=getBase();rememberBackup(local);
      try{
        let latest=await nativeFetch(url,{method:'GET',headers:new Headers(init.headers||{})});
        if(!latest.ok){localStorage.setItem(PENDING_KEY,'1');status('failed','Could not load latest copy. Retry when connected.');return latest}
        let j=await latest.json(),remote=j?.data||{};
        let fields=conflicts(base,local,remote);
        if(fields.length){window.familyHubSyncConflict={local,remote,fields};localStorage.setItem(PENDING_KEY,'1');status('conflict','Both devices changed the same fields. Review before saving.');return new Response(JSON.stringify({error:'Review conflicting edits.'}),{status:409})}
        let merged=protectTransactionArrays(base,local,remote,merge3(base,local,remote));
        let res=await nativeFetch(input,{...init,body:JSON.stringify({...outgoing,data:merged,expected_updated_at:j.updated_at})});
        if(res.ok){
          let current=clone(typeof data!=='undefined'?data:local);
          let applied=protectTransactionArrays(local,current,merged,merge3(local,current,merged));
          setBase(merged);applyMerged(applied);
          if(same(applied,merged))localStorage.removeItem(PENDING_KEY);else localStorage.setItem(PENDING_KEY,'1');
          status(same(applied,merged)?'saved':'pending',same(applied,merged)?'Saved to cloud':'New changes waiting to save');
          if(!same(applied,local))setTimeout(()=>{
            if(document.querySelector('.budget2-page')){window.dispatchEvent(new Event('budgetAccounts:render'));window.dispatchEvent(new Event('budgetTransactions:changed'))}
            else if(window.hubExperience)window.hubExperience.refresh();else if(typeof render==='function')render();
          },0);
        }else {localStorage.setItem(PENDING_KEY,'1');status(res.status===409?'conflict':'failed',res.status===409?'Another device saved first. Retry to merge the latest copy.':'Cloud save failed. Your local copy is pending.')}
        return res;
      }catch(e){localStorage.setItem(PENDING_KEY,'1');status('pending','Offline. Changes saved on this device.');throw e}
    };
    let next=saveQueue.then(run,run);saveQueue=next.catch(()=>{});return next;
  };
  window.addEventListener('online',()=>{try{if(localStorage.getItem(PENDING_KEY)&&typeof syncSave==='function')syncSave()}catch(e){}});
})();
