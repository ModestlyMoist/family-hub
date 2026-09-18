// Money Hub navigation bridge v259a — intentionally isolated from app.js
(function(){
  document.addEventListener('click',function(e){
    var more=e.target.closest&&e.target.closest('[data-action="more"]');
    if(more){setTimeout(function(){
      var menu=document.querySelector('.more-menu'); if(!menu)return;
      var groups=menu.querySelectorAll('.more-group'),money=null;
      for(var i=0;i<groups.length;i++){var ey=groups[i].querySelector('.eyebrow');if(ey&&ey.textContent.trim()==='MONEY'){money=groups[i];break}}
      if(!money)return;var btn=money.querySelector('.more-destination');if(!btn)return;
      var title=btn.querySelector('b'),sub=btn.querySelector('small');if(title)title.textContent='Budget & Debt';if(sub)sub.textContent='Paychecks, bills, cards & debt';
      btn.setAttribute('data-money-hub','1');
    },40);return}
    var hub=e.target.closest&&e.target.closest('[data-money-hub]');
    if(hub&&typeof window.openBudget2==='function'){e.preventDefault();e.stopPropagation();var m=document.querySelector('#modal');if(m&&m.open)m.close();window.openBudget2()}
  },false);
})();