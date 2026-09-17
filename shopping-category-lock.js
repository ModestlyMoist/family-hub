// Shopping category lock — v227a
// Keeps a shopper's manual category choice authoritative when meal ingredients
// are later merged into the same shopping item.
(function(){
  const CATS=['Produce','Meat','Dairy','Pantry','Frozen','Bakery','Household','Other'];
  function norm(v){return String(v||'').trim().toLowerCase()}
  function findByName(name){let k=norm(name);return (data.staples||[]).find(x=>norm(x.name)===k)}
  function remember(item){
    if(!item||!item.name)return;
    data.settings=data.settings||{};
    data.settings.shoppingCategoryChoices=data.settings.shoppingCategoryChoices||{};
    data.settings.shoppingCategoryChoices[norm(item.name)]=item.category||'Other';
    item.categoryLocked=true;
  }
  function restore(){
    let choices=data.settings?.shoppingCategoryChoices||{};
    (data.staples||[]).forEach(item=>{let c=choices[norm(item.name)];if(c){item.category=c;item.categoryLocked=true}});
  }
  function addCategoryControl(){
    let modal=document.querySelector('#modal');
    if(!modal?.open||document.querySelector('#scCategory'))return;
    let title=document.querySelector('#modalTitle')?.textContent?.toLowerCase()||'';
    if(!title.includes('shopping')&&!title.includes('staple'))return;
    let name=document.querySelector('#seName,#siName');
    if(!name)return;
    let item=findByName(name.value),current=item?.category||'Other';
    let field=document.createElement('label');field.className='field';field.innerHTML='Category<select id="scCategory">'+CATS.map(c=>'<option '+(c===current?'selected':'')+'>'+c+'</option>').join('')+'</select>';
    let grid=name.closest('.form-grid');if(grid)grid.appendChild(field);
    let saveBtn=document.querySelector('#seSave,#siSave');
    if(saveBtn)saveBtn.addEventListener('click',()=>{let target=findByName(name.value)||item;if(target){target.category=document.querySelector('#scCategory')?.value||target.category||'Other';remember(target)}},{capture:true});
  }
  // Existing merge logic already leaves an existing item's category alone. This
  // restoration layer also protects it from later render/normalization paths.
  let last='';setInterval(()=>{
    try{
      restore();
      addCategoryControl();
      let key=JSON.stringify(data.settings?.shoppingCategoryChoices||{});
      if(key!==last){last=key;localStorage.setItem('familyHubData',JSON.stringify(data))}
    }catch(e){}
  },350);
  document.addEventListener('click',e=>{
    if(e.target.closest?.('.edit-staple'))setTimeout(addCategoryControl,40);
  });
})();
