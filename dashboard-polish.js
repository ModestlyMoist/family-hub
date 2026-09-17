// Secondary Home dashboard tile polish — v216a
(function(){
const specs={
 'habits':{icon:'⭐',kicker:'ROUTINES',tone:'sage'},
 'meals this week':{icon:'🍽️',kicker:'MEAL PLAN',tone:'gold'},
 'shopping':{icon:'🛒',kicker:'SHOPPING LIST',tone:'blue'},
 'payments':{icon:'💳',kicker:'MONEY',tone:'coral'},
 'tasks':{icon:'✓',kicker:'TO-DO',tone:'sage'},
 'week at a glance':{icon:'▦',kicker:'THIS WEEK',tone:'blue'}
};
function isHome(){try{return (window.view||view)==='home'}catch(e){return false}}
function enhance(){if(!isHome())return;let root=document.querySelector('#dashboard');if(!root)return;[...root.querySelectorAll(':scope > .card')].forEach(card=>{let h=card.querySelector('h2');if(!h)return;let key=h.textContent.trim().toLowerCase(),s=specs[key];if(!s)return;card.classList.add('dash-polish','dash-'+key.replace(/[^a-z0-9]+/g,'-'),'dash-tone-'+s.tone);if(!card.querySelector('.dash-card-kicker')){let k=document.createElement('div');k.className='dash-card-kicker';k.innerHTML='<span>'+s.icon+'</span><b>'+s.kicker+'</b>';let head=h.closest('.card-head')||h.parentElement;head.insertBefore(k,head.firstChild)}let text=card.textContent.replace(/\s+/g,' '),m=text.match(/(\d+)\s+of\s+(\d+)/i);if(m&&!card.querySelector('.dash-progress')){let a=+m[1],b=+m[2],p=b?Math.min(100,Math.round(a/b*100)):0,bar=document.createElement('div');bar.className='dash-progress';bar.setAttribute('aria-label',p+'% complete');bar.innerHTML='<i style="width:'+p+'%"></i>';let head=card.querySelector('.card-head');if(head)head.insertAdjacentElement('afterend',bar);else h.insertAdjacentElement('afterend',bar)}})}
let t;function schedule(){clearTimeout(t);t=setTimeout(enhance,40)}document.addEventListener('DOMContentLoaded',()=>{let r=document.querySelector('#dashboard');if(r)new MutationObserver(schedule).observe(r,{childList:true,subtree:true});schedule()});document.addEventListener('family-dashboard-ready',schedule);setInterval(enhance,1200);
})();
