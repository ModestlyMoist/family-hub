// Money nav v264a — isolated, static primary-nav button
(function(){
  function addMoney(){
    var nav=document.querySelector('.primary-nav');
    if(!nav||nav.querySelector('[data-action="money"]'))return;
    var more=nav.querySelector('[data-action="more"]');
    var b=document.createElement('button');
    b.type='button';b.dataset.action='money';b.setAttribute('aria-label','Money');
    b.innerHTML='$<span>Money</span>';
    if(more)nav.insertBefore(b,more);else nav.appendChild(b);
    b.addEventListener('click',function(e){e.preventDefault();if(typeof window.openBudget2==='function'){window.openBudget2()}else{alert('Budget is still loading. Please refresh once.')}});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',addMoney);else addMoney();
})();