// Home dashboard editor — header-mounted control + CSS-grid ordering v224a
(function(){
function R(){return document.querySelector('#dashboard')}
function isHome(){return !!R()?.querySelector('.family-glance')}
function label(el){return (el.querySelector('h2')?.textContent||el.querySelector('h3')?.textContent||'').trim()}
function slug(s){return s.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')}
function fixed(el){return !el||el.classList.contains('attention-card')||el.classList.contains('dashboard-editbar')||/running on empty|remember today|today.?s verse/i.test(el.textContent||'')}
function getTiles(r){let out=[];[...r.children].forEach(el=>{if(fixed(el)||!el.classList.contains('card'))return;let id=el.dataset.dashboardTile||'';if(!id){if(el.classList.contains('family-glance'))id='at-a-glance';else if(el.classList.contains('family-next'))id='up-next';else if(el.classList.contains('family-today'))id='today';else id=slug(label(el)||('tile-'+out.length))}if(id){el.dataset.dashboardTile=id;out.push([id,el])}});return out}
function savedOrder(pairs){data.settings=data.settings||{};let ids=pairs.map(x=>x[0]),saved=Array.isArray(data.settings.dashboardOrderAll)?data.settings.dashboardOrderAll:[];let o=saved.filter(x=>ids.includes(x));ids.forEach(x=>{if(!o.includes(x))o.push(x)});return o}
function ensureBar(){let r=R();if(!r)return null;let bar=document.querySelector('#dashboardEditBar');if(!bar){bar=document.createElement('div');bar.id='dashboardEditBar';bar.className='dashboard-editbar';bar.innerHTML='<button type="button" class="mini secondary" data-dashboard-edit>↕ Edit dashboard</button>'}let header=document.querySelector('.compact-header');if(header&&!header.contains(bar))header.append(bar);return bar}
function showBar(){let bar=ensureBar();if(bar)bar.hidden=!isHome()}
function clearMovers(){let r=R();if(r)r.querySelectorAll('.dash-movers').forEach(x=>x.remove())}
function applyVisualOrder(){showBar();let r=R();if(!r)return;if(!isHome()){r.classList.remove('dashboard-editing');clearMovers();return}let pairs=getTiles(r),o=savedOrder(pairs),map=Object.fromEntries(pairs);o.forEach((id,i)=>{if(map[id])map[id].style.order=String(i)});if(r.classList.contains('dashboard-editing'))decorate();else clearMovers()}
function decorate(){let r=R();if(!r)return;clearMovers();if(!r.classList.contains('dashboard-editing'))return;let pairs=getTiles(r),o=savedOrder(pairs),map=Object.fromEntries(pairs);o.forEach((id,i)=>{let el=map[id];if(!el)return;let d=document.createElement('div');d.className='dash-movers';d.innerHTML='<span>Move</span><button type="button" data-dashboard-move="'+id+'" data-dir="-1" aria-label="Move '+id+' up" '+(i===0?'disabled':'')+'>↑</button><button type="button" data-dashboard-move="'+id+'" data-dir="1" aria-label="Move '+id+' down" '+(i===o.length-1?'disabled':'')+'>↓</button>';el.appendChild(d)})}
function toggle(){let r=R(),bar=ensureBar();if(!r||!bar||!isHome())return;let on=r.classList.toggle('dashboard-editing');bar.innerHTML=on?'<span class="meta">Reorder Home tiles</span><button type="button" class="mini" data-dashboard-done>Done</button>':'<button type="button" class="mini secondary" data-dashboard-edit>↕ Edit dashboard</button>';applyVisualOrder()}
function move(id,dir){let r=R(),pairs=getTiles(r),o=savedOrder(pairs),i=o.indexOf(id),j=i+Number(dir);if(i<0||j<0||j>=o.length)return;[o[i],o[j]]=[o[j],o[i]];data.settings.dashboardOrderAll=o;localSave();syncSave();applyVisualOrder()}
document.addEventListener('click',e=>{if(e.target.closest?.('[data-dashboard-edit],[data-dashboard-done]')){e.preventDefault();e.stopPropagation();toggle();return}let b=e.target.closest?.('[data-dashboard-move]');if(b){e.preventDefault();e.stopPropagation();move(b.dataset.dashboardMove,b.dataset.dir)}});
let timer;function schedule(){clearTimeout(timer);timer=setTimeout(applyVisualOrder,30)}document.addEventListener('DOMContentLoaded',()=>{let r=R();if(r)new MutationObserver(schedule).observe(r,{childList:true});schedule()});document.addEventListener('family-dashboard-ready',applyVisualOrder);setInterval(applyVisualOrder,1000);
})();



