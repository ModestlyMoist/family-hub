// Family Hub — cross-device sync safety v244a
(function(){
  const SYNC_MATCH='/functions/v1/quick-service';
  const nativeFetch=window.fetch.bind(window);
  const BASE_KEY='familyHubSyncBase';
  const BACKUP_KEY='familyHubDataBackup';
  const PENDING_KEY='familyHubSyncPending';
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
  function rememberBackup(v){try{if(v&&Object.keys(v).length)localStorage.setItem(BACKUP_KEY,JSON.stringify({savedAt:new Date().toISOString(),data:v}))}catch(e){}}
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
      try{let j=await res.clone().json();if(j?.data&&Object.keys(j.data).length){rememberBackup(JSON.parse(localStorage.getItem('familyHubData')||'null'));setBase(j.data);localStorage.removeItem(PENDING_KEY)}}catch(e){}
      return res;
    }
    if(method!=='POST'||!init?.body)return nativeFetch(input,init);
    let outgoing;try{outgoing=JSON.parse(init.body)}catch(e){return nativeFetch(input,init)}
    if(!outgoing?.data)return nativeFetch(input,init);
    let local=outgoing.data,base=getBase(),remote=base;
    try{
      let headers=new Headers(init.headers||{}),latest=await nativeFetch(url,{method:'GET',headers});
      if(latest.ok){let j=await latest.json();if(j?.data&&Object.keys(j.data).length)remote=j.data}
    }catch(e){}
    let merged=merge3(base,local,remote);
    rememberBackup(local);
    try{
      let res=await nativeFetch(input,{...init,body:JSON.stringify({...outgoing,data:merged})});
      if(res.ok){setBase(merged);applyMerged(merged);localStorage.removeItem(PENDING_KEY);if(!same(merged,local)&&typeof render==='function')setTimeout(()=>render(),0)}
      else localStorage.setItem(PENDING_KEY,'1');
      return res;
    }catch(e){localStorage.setItem(PENDING_KEY,'1');throw e}
  };
  window.addEventListener('online',()=>{try{if(localStorage.getItem(PENDING_KEY)&&typeof syncSave==='function')syncSave()}catch(e){}});
})();