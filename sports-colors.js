// Sports child + event-type colors — v228a
(function(){
  const COLORS={
    Richard:{Game:'#5f7898',Practice:'#9db0c6'},
    Timothy:{Game:'#6f9277',Practice:'#a9c0ad'},
    Both:{Game:'#8b7696',Practice:'#b9a9c0'}
  };
  function color(person,type){let p=COLORS[person]||COLORS.Both;return p[type]||p.Game}
  function apply(){
    document.querySelectorAll('.sport-row[data-sport-person]').forEach(row=>{
      let person=row.dataset.sportPerson||'Both',type=row.querySelector('.sport-title .pill')?.textContent?.trim()||'Game',c=color(person,type);
      row.style.setProperty('--sport-event-color',c);
      let dot=row.querySelector('.sport-dot');if(dot)dot.style.background=c;
      let pill=row.querySelector('.sport-title .pill');if(pill){pill.style.background=c;pill.style.color='#fff';pill.style.borderColor=c}
    });
    document.querySelectorAll('.sports-kids .sport-kid').forEach(card=>{
      let who=card.querySelector('.eyebrow')?.textContent?.trim();if(!who)return;
      let person=who.charAt(0)+who.slice(1).toLowerCase(),c=color(person,'Game');card.style.setProperty('--sport-child-color',c);card.style.borderTop='4px solid '+c;
    });
  }
  document.addEventListener('click',e=>{if(e.target.closest?.('[data-sports-open],[data-sport-filter],[data-sport-add],[data-sport-edit]'))setTimeout(apply,80)});
  document.addEventListener('DOMContentLoaded',()=>{new MutationObserver(apply).observe(document.querySelector('#dashboard')||document.body,{childList:true,subtree:true});apply()});
})();
