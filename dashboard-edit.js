// Home-only dashboard editor — v208a
(function(){
const ids=[['glance','.family-glance'],['next','.family-next'],['today','.family-today']];
function current(){data.settings=data.settings||{};let o=data.settings.dashboardOrder;return Array.isArray(o)&&o.length===3&&ids.every(([id])=>o.includes(id))?o:['glance','next','today']}
function root(){return document.querySelector('#dashboard')}
function isHome(){try{return (window.view||view)==='home'}catch(e){return false}}
function apply(){if(!isHome())return;let r=root();if(!r)return;let found=Object.fromEntries(ids.map(([id,sel])=>[id,r.querySelector(sel)]));if(!found.glance||!found.next||!found.today)return;let anchor=r.querySelector('.attention-card');current().forEach(id=>{let el=found[id];if(anchor){anchor.insertAdjacentElement('afterend',el);anchor=el}else r.appendChild(el)});ensureButton()}
function ensureButton(){let r=root();if(!r||r.querySelector('.dashboard-editbar'))return;let bar=document.createElement('div');bar.className='dashboard-editbar';bar.innerHTML='<button type="button" class="mini secondary" data-dashboard-edit>↕ Edit dashboard</button>';r.insertAdjacentElement('afterbegin',bar)}
function decorate(){let r=root();if(!r)return;r.querySelectorAll('.dash-movers').forEach(x=>x.remove());if(!r.classList.contains('dashboard-editing'))return;let o=current();o.forEach((id,i)=>{let el=r.querySelector(ids.find(x=>x[0]===id)[1]);if(!el)return;let d=document.createElement('div');d.className='dash-movers';d.innerHTML='<span>Move</span><button type="button" data-dashboard-move="'+id+'" data-dir="-1" '+(i===0?'disabled':'')+'>↑</button><button type="button" data-dashboard-move="'+id+'" data-dir="1" '+(i===o.length-1?'disabled':'')+'>↓</button>';el.prepend(d)})}
function toggle(){let r=root(),bar=r?.querySelector('.dashboard-editbar');if(!r||!bar)return;let on=r.classList.toggle('dashboard-editing');bar.innerHTML=on?'<span class="meta">Reorder Home</span><button type="button" class="mini" data-dashboard-done>Done</button>':'<button type="button" class="mini secondary" data-dashboard-edit>↕ Edit dashboard</button>';decorate()}
function move(id,dir){let o=current().slice(),i=o.indexOf(id),j=i+Number(dir);if(i<0||j<0||j>=o.length)return;[o[i],o[j]]=[o[j],o[i]];data.settings.dashboardOrder=o;save();apply();decorate()}
document.addEventListener('click',e=>{if(e.target.closest?.('[data-dashboard-edit],[data-dashboard-done]')){toggle();return}let b=e.target.closest?.('[data-dashboard-move]');if(b){e.preventDefault();move(b.dataset.dashboardMove,b.dataset.dir)}});
let obs=new MutationObserver(()=>{if(isHome())setTimeout(apply,0)});document.addEventListener('DOMContentLoaded',()=>{let r=root();if(r)obs.observe(r,{childList:true});setTimeout(apply,20)});setInterval(()=>{if(isHome())apply()},1000);
})();
