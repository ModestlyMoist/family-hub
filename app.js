const SYNC_URL="https://ebmcckbjugbivfqimnux.supabase.co/functions/v1/quick-service";
const SAMPLE={settings:{pin:"",richardColor:"#4776c8",timothyColor:"#d77955",city1:"Las Vegas",city2:"Flagstaff"},events:[{id:1,title:"Soccer Practice",person:"Richard",type:"Practice",date:nextDow(2),time:"17:30",end:"19:00",location:"Desert Sports Complex",leave:"16:55",bring:"Cleats, water bottle"},{id:2,title:"Math Homework Due",person:"Timothy",type:"Homework",date:nextDow(3),time:"08:00",location:"School"},{id:3,title:"Kids to Dad",person:"Both",type:"Custody",date:nextDow(5),time:"17:30",recurring:"weekly"},{id:4,title:"Kids Return",person:"Both",type:"Custody",date:nextDow(0),time:"15:30",recurring:"weekly"},{id:5,title:"Pediatric Dentist",person:"Richard",type:"Appointment",date:addDays(5),time:"15:15",location:"Summerlin"}],payments:[{id:1,name:"Internet",day:18,amount:"75",paid:false},{id:2,name:"Car Insurance",day:21,amount:"",paid:false},{id:3,name:"Streaming",day:26,amount:"",paid:false}],staples:["Milk","Eggs","Bread","Bananas","Apples","Yogurt","Cereal","Chicken","Rice","Juice","Paper towels","Toilet paper","Laundry detergent"].map((name,i)=>({id:i+1,name,qty:1,need:i<5})),meals:[{id:1,name:"Tacos",ingredients:"Ground beef, tortillas, shredded cheese, lettuce, taco seasoning",recipe:"Brown beef, season, warm tortillas, assemble."},{id:2,name:"Chicken Alfredo",ingredients:"Chicken, pasta, Alfredo sauce, broccoli",recipe:"Cook pasta and chicken; combine with sauce and broccoli."},{id:3,name:"Spaghetti",ingredients:"Pasta, marinara, ground beef, parmesan",recipe:"Cook pasta; brown beef; simmer with marinara."},{id:4,name:"Burgers",ingredients:"Burger patties, buns, cheese, lettuce, tomato",recipe:"Grill patties and assemble."},{id:5,name:"Chicken & Rice",ingredients:"Chicken, rice, vegetables, seasoning",recipe:"Cook seasoned chicken; serve over rice with vegetables."}],mealPlan:{},tasks:[{id:1,name:"Take trash out",due:nextDow(3),done:false,repeat:"Weekly"},{id:2,name:"Change HVAC filter",due:addDays(6),done:false,repeat:"Monthly"},{id:3,name:"Wash sports uniforms",due:nextDow(5),done:false,repeat:"Weekly"}]};
function iso(d){return d.toISOString().slice(0,10)} function addDays(n){let d=new Date();d.setDate(d.getDate()+n);return iso(d)} function nextDow(x){let d=new Date(),n=(x-d.getDay()+7)%7;n=n||7;d.setDate(d.getDate()+n);return iso(d)}
let data=JSON.parse(localStorage.getItem('familyHubData')||'null')||SAMPLE; let view='home'; let calCursor=new Date(); calCursor.setDate(1); let activePin=sessionStorage.getItem('familyHubPin')||localStorage.getItem('familyHubPin')||'';
const $=s=>document.querySelector(s);
function localSave(){localStorage.setItem('familyHubData',JSON.stringify(data))}
async function syncLoad(pin){const r=await fetch(SYNC_URL,{headers:{'x-family-pin':pin}});if(!r.ok)throw new Error(r.status===401?'Invalid PIN':'Sync unavailable');const j=await r.json();if(j.data&&Object.keys(j.data).length){data=j.data;localSave()}else{await syncSave(pin)}return data}
async function syncSave(pin=activePin){localSave();if(!pin)return;try{const r=await fetch(SYNC_URL,{method:'POST',headers:{'Content-Type':'application/json','x-family-pin':pin},body:JSON.stringify({data})});if(!r.ok)throw new Error('Sync failed')}catch(e){console.warn('Family Hub sync:',e)}}
const save=()=>syncSave();
async function unlock(){const pin=$('#pinInput').value;$('#pinMsg').textContent='Connecting…';try{await syncLoad(pin);activePin=pin;sessionStorage.setItem('familyHubPin',pin);if($('#rememberPin').checked){localStorage.setItem('familyHubUnlocked','1');localStorage.setItem('familyHubPin',pin)}$('#pinGate').classList.add('hidden');$('#app').classList.remove('hidden');$('#pinMsg').textContent='';render()}catch(e){$('#pinMsg').textContent=e.message==='Invalid PIN'?'That PIN did not match.':'Could not connect. Check your internet and try again.'}} $('#unlockBtn').onclick=unlock; $('#pinInput').onkeydown=e=>{if(e.key==='Enter')unlock()}; if(localStorage.getItem('familyHubUnlocked')&&activePin){syncLoad(activePin).then(()=>{$('#pinGate').classList.add('hidden');$('#app').classList.remove('hidden');render()}).catch(()=>{localStorage.removeItem('familyHubUnlocked');localStorage.removeItem('familyHubPin')})}
function personColor(p){
  return p === 'Richard'
    ? data.settings.richardColor
    : p === 'Timothy'
    ? data.settings.timothyColor
    : p === 'Olivia'
    ? (data.settings.oliviaColor || '#a46f91')
    : '#8b7b67';
}
function fmtDate(s){return new Date(s+'T12:00').toLocaleDateString([], {weekday:'short',month:'short',day:'numeric'})}
async function weather(){let places=[['Las Vegas',36.1716,-115.1391],['Flagstaff',35.1983,-111.6513]];for(let [name,lat,lon] of places){try{let r=await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max&temperature_unit=fahrenheit&forecast_days=7&timezone=auto`),j=await r.json();let el=document.querySelector(`[data-weather="${name}"]`);if(el)el.innerHTML=`<b>${name}</b><div class="temp">${Math.round(j.current.temperature_2m)}°</div><div class="meta">H ${Math.round(j.daily.temperature_2m_max[0])}° · L ${Math.round(j.daily.temperature_2m_min[0])}° · ${j.daily.precipitation_probability_max[0]}% rain</div>`}catch{}}}
function resetPaymentsForNewMonth(){
  data.settings = data.settings || {};

  const now = new Date();
  const currentMonth =
    now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');

  // First time this feature runs: remember the current month
  // without changing any existing payment statuses.
  if (!data.settings.paymentMonth) {
    data.settings.paymentMonth = currentMonth;
    save();
    return;
  }

  // When a new month begins, reset all payment reminders.
  if (data.settings.paymentMonth !== currentMonth) {
    data.payments.forEach(payment => {
      payment.paid = false;
    });

    data.settings.paymentMonth = currentMonth;
    save();
  }
}
function render(){
  resetPaymentsForNewMonth();
  let now = new Date();$('#todayLabel').textContent=now.toLocaleDateString([],{weekday:'long',month:'long',day:'numeric'});let upcoming=data.events.filter(e=>e.date>=iso(now)).sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time));let need=data.staples.filter(x=>x.need).length;$('#summary').textContent=`${upcoming.filter(e=>e.date===iso(now)).length} events today · ${data.payments.filter(p=>!p.paid).length} payments upcoming · ${need} groceries needed`; let root=$('#dashboard');root.innerHTML=view==='home'?home():view==='calendar'?calendarView():view==='shop'?shopView():view==='meals'?mealsView():moreView();weather();bind()}
function home(){let ev=data.events.filter(e=>e.date>=iso(new Date())).sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time)).slice(0,6);return `<section class="card wide"><div class="card-head"><h2>Coming up</h2><span class="pill">Next 7 days</span></div>${ev.map(eventRow).join('')}</section><section class="card"><h2>Weather</h2><div class="weather-row"><div class="weather" data-weather="Las Vegas">Loading…</div><div class="weather" data-weather="Flagstaff">Loading…</div></div></section><section class="card full"><div class="card-head"><h2>Week at a glance</h2><button data-go="calendar">Open calendar</button></div>${weekStrip()}</section><section class="card"><div class="card-head"><h2>Shopping</h2><span class="pill">${data.staples.filter(x=>x.need).length} needed</span></div>${data.staples.filter(x=>x.need).slice(0,5).map(x=>`<div class="item">☐ <div>${x.name}${x.qty>1?` ×${x.qty}`:''}</div></div>`).join('')}<div class="actions"><button data-go="shop">Review staples</button></div></section><section class="card"><h2>Meals this week</h2>${mealPlanRows()}<div class="actions"><button data-go="meals">Plan week</button></div></section><section class="card"><h2>Payments</h2>${data.payments.filter(p=>!p.paid).slice(0,4).map(p=>`<div class="item"><div><b>${p.name}</b><div class="meta">Due ${p.day}${p.amount?` · $${p.amount}`:''}</div></div></div>`).join('')}</section><section class="card"><h2>Household</h2>${data.tasks.slice(0,4).map(t=>`<div class="item"><input class="check task-check" data-id="${t.id}" type="checkbox" ${t.done?'checked':''}><div>${t.name}<div class="meta">${fmtDate(t.due)} · ${t.repeat}</div></div></div>`).join('')}</section>`}
function eventRow(e){return `<div class="item"><span class="dot" style="background:${personColor(e.person)}"></span><div style="flex:1"><b>${e.title}</b><div class="meta">${fmtDate(e.date)} · ${e.time||''}${e.location?` · ${e.location}`:''}${e.leave?` · Leave ${e.leave}`:''}</div><div class="meta">${e.person} · ${e.type}</div></div><div class="item-actions"><button class="mini edit-event" data-id="${e.id}">Edit</button><button class="mini danger delete-event" data-id="${e.id}">Delete</button></div></div>`}
function weekStrip(){return `<div class="week">${[0,1,2,3,4,5,6].map(n=>{let d=addDays(n),dt=new Date(d+'T12:00'),es=data.events.filter(e=>e.date===d);return `<div class="day"><b>${dt.toLocaleDateString([],{weekday:'short'})}<br>${dt.getDate()}</b>${es.map(e=>`<span class="tag" style="background:${personColor(e.person)}">${e.title}</span>`).join('')}</div>`}).join('')}</div>`}
function custodyForDate(ds){data.settings.custodyOverrides=data.settings.custodyOverrides||{};if(data.settings.custodyOverrides[ds])return data.settings.custodyOverrides[ds];let d=new Date(ds+'T12:00').getDay();return d===5?'Dad after 5:30':d===6?'Dad':d===0?'Dad → Mom 3:30':'Mom'}
function custodyColor(v){return v==='Dad'?'#7183a3':v.includes('→')||v.includes('after')?'#9b7fa5':'#83a487'}
function calendarView(){let y=calCursor.getFullYear(),m=calCursor.getMonth(),first=new Date(y,m,1),start=new Date(y,m,1-first.getDay()),cells='';for(let i=0;i<42;i++){let d=new Date(start);d.setDate(start.getDate()+i);let ds=iso(d),cust=custodyForDate(ds),es=data.events.filter(e=>e.date===ds);cells+=`<div class="cal-day ${d.getMonth()!==m?'other':''}"><b>${d.getDate()}</b><button class="custody-day" data-date="${ds}" style="display:block;width:100%;height:8px;padding:0;margin:5px 0;background:${custodyColor(cust)}" title="${cust}"></button><div class="meta custody-label">${cust}</div>${es.slice(0,3).map(e=>`<span class="tag" style="background:${personColor(e.person)}">${e.title}</span>`).join('')}</div>`}return `<section class="card full"><div class="card-head"><div><h2>Family calendar</h2><div class="meta">Green Mom · Blue Dad · Purple transition · tap custody bar to override a day</div></div><div class="actions"><button id="prevMonth">‹</button><b>${calCursor.toLocaleDateString([],{month:'long',year:'numeric'})}</b><button id="nextMonth">›</button><button id="addEvent">＋ Event</button></div></div><div class="calendar-grid">${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(x=>`<div class="cal-head">${x}</div>`).join('')}${cells}</div><div style="margin-top:18px"><h2>List view</h2>${data.events.slice().sort((a,b)=>(a.date+(a.time||'')).localeCompare(b.date+(b.time||''))).map(eventRow).join('')}</div></section>`}
function shopView(){return `<section class="card wide"><div class="card-head"><h2>Weekly staples</h2><span class="pill">Resets Sunday</span></div>${data.staples.map(x=>`<div class="item"><input class="check staple-check" data-id="${x.id}" type="checkbox" ${x.need?'checked':''}><div style="flex:1"><b>${x.name}</b><div class="meta">${x.need?'Need':'Have it'}</div></div><input class="qty" data-id="${x.id}" type="number" min="1" value="${x.qty}" style="width:55px"><div class="item-actions"><button class="mini edit-staple" data-id="${x.id}">Edit</button><button class="mini danger delete-staple" data-id="${x.id}">Delete</button></div></div>`).join('')}<div class="actions"><button id="addStaple">＋ Staple</button><button id="copyList" class="primary">Copy shopping list</button></div></section><section class="card"><h2>Ready for Instacart</h2>${data.staples.filter(x=>x.need).map(x=>`<div class="item">${x.name}${x.qty>1?` ×${x.qty}`:''}</div>`).join('')||'<p class="muted">Nothing needed yet.</p>'}</section>`}
function mealPlanRows(){return [0,1,2,3,4,5,6].map(n=>{let d=addDays(n),day=new Date(d+'T12:00').toLocaleDateString([],{weekday:'short'});return `<div class="meal"><b>${day}</b> · ${data.mealPlan[d]||'Not planned'}</div>`}).join('')}
function mealsView(){return `<section class="card wide"><h2>Plan the week</h2>${[0,1,2,3,4,5,6].map(n=>{let d=addDays(n),day=new Date(d+'T12:00').toLocaleDateString([],{weekday:'long'});return `<div class="item"><div style="width:90px"><b>${day}</b></div><select class="meal-select" data-date="${d}" style="flex:1;padding:8px;border-radius:9px;background:var(--bg);color:var(--text);border:1px solid var(--line)"><option value="">Not planned</option>${data.meals.map(m=>`<option ${data.mealPlan[d]===m.name?'selected':''}>${m.name}</option>`).join('')}</select></div>`}).join('')}</section><section class="card"><div class="card-head"><h2>Meal library</h2><button id="addMeal">＋ Meal</button></div>${data.meals.map(m=>`<div class="meal"><div class="card-head"><b>${m.name}</b><div class="item-actions"><button class="mini meal-shop" data-id="${m.id}">＋ Shopping</button><button class="mini edit-meal" data-id="${m.id}">Edit</button><button class="mini danger delete-meal" data-id="${m.id}">Delete</button></div></div><div class="meta">${m.ingredients||'No ingredients added'}</div></div>`).join('')}</section>`}
function moreView(){
  return `
    <section class="card">
      <h2>Family</h2>

      <div class="item">
        <span class="dot" style="background:${data.settings.richardColor}"></span>
        <b>Richard</b>
        <input class="color" data-person="Richard" type="color"
          value="${data.settings.richardColor}" style="margin-left:auto">
      </div>

      <div class="item">
        <span class="dot" style="background:${data.settings.timothyColor}"></span>
        <b>Timothy</b>
        <input class="color" data-person="Timothy" type="color"
          value="${data.settings.timothyColor}" style="margin-left:auto">
      </div>

      <div class="item">
        <span class="dot" style="background:${data.settings.oliviaColor || '#a46f91'}"></span>
        <b>Olivia</b>
        <input class="color" data-person="Olivia" type="color"
          value="${data.settings.oliviaColor || '#a46f91'}" style="margin-left:auto">
      </div>
    </section>

    <section class="card">
      <div class="card-head">
        <h2>Payments</h2>
        <button id="addPayment">＋ Payment</button>
      </div>

      ${data.payments.map(p => `
        <div class="item">
          <input
            class="check payment-check"
            data-id="${p.id}"
            type="checkbox"
            ${p.paid ? 'checked' : ''}
          >

          <div style="flex:1">
            <b>${p.name}</b>
            <div class="meta">
              Due day ${p.day}${p.amount ? ` · $${p.amount}` : ''}
            </div>
          </div>

          <div class="item-actions">
            <button class="mini edit-payment" data-id="${p.id}">
              Edit
            </button>

            <button class="mini danger delete-payment" data-id="${p.id}">
              Delete
            </button>
          </div>
        </div>
      `).join('')}
    </section>
<section class="card">
  <div class="card-head">
    <h2>Household & School</h2>
    <button id="addTask">＋ Task</button>
  </div>

  ${data.tasks.map(t => `
    <div class="item">
      <input
        class="check task-check"
        data-id="${t.id}"
        type="checkbox"
        ${t.done ? 'checked' : ''}
      >

      <div style="flex:1">
        <b>${t.name}</b>

        <div class="meta">
          ${t.due ? fmtDate(t.due) : 'No due date'}
          ${t.repeat ? ` · ${t.repeat}` : ''}
          ${t.category ? ` · ${t.category}` : ''}
        </div>
      </div>

      <div class="item-actions">
        <button class="mini edit-task" data-id="${t.id}">
          Edit
        </button>

        <button class="mini danger delete-task" data-id="${t.id}">
          Delete
        </button>
      </div>
    </div>
  `).join('')}
</section>
    <section class="card">
      <h2>Custody schedule</h2>
      <p>Friday 5:30 PM — kids go with Dad</p>
      <p>Sunday 3:30 PM — kids return to Mom</p>
      <p class="meta">
        Use the colored custody bars on the calendar to adjust a specific day.
      </p>
    </section>

    <section class="card">
      <h2>Sync</h2>
      <p class="meta">
        Cloud sync is active across your Family Hub devices.
      </p>
      <button id="lock">Lock this device</button>
    </section>
  `;
}
function bind(){document.querySelectorAll('.edit-meal').forEach(x=>{x.onclick=()=>editMeal(Number(x.dataset.id))});document.querySelectorAll('.delete-meal').forEach(x=>{x.onclick=()=>{if(confirm('Delete this meal?')){data.meals=data.meals.filter(m=>m.id!=x.dataset.id);save();render()}}});document.querySelectorAll('.edit-task').forEach(x => {
  x.onclick = () => editTask(Number(x.dataset.id));
});

document.querySelectorAll('.delete-task').forEach(x => {
  x.onclick = () => {
    if (confirm('Delete this task?')) {
      data.tasks = data.tasks.filter(t => t.id != x.dataset.id);
      save();
      render();
    }
  };
});

$('#addTask') && ($('#addTask').onclick = () => {
  let t = {
    id: Date.now(),
    name: 'New task',
    category: 'Household',
    due: addDays(1),
    repeat: 'None',
    done: false,
    notes: ''
  };

  data.tasks.push(t);
  editTask(t.id);
});document.querySelectorAll('.edit-payment').forEach(x => {
  x.onclick = () => editPayment(Number(x.dataset.id));
});

document.querySelectorAll('.delete-payment').forEach(x => {
  x.onclick = () => {
    if (confirm('Delete this payment?')) {
      data.payments = data.payments.filter(p => p.id != x.dataset.id);
      save();
      render();
    }
  };
});

document.querySelectorAll('.payment-check').forEach(x => {
  x.onchange = () => {
    let p = data.payments.find(p => p.id == x.dataset.id);
    if (!p) return;

    p.paid = x.checked;
    save();
    render();
  };
});

$('#addPayment') && ($('#addPayment').onclick = () => {
  let p = {
    id: Date.now(),
    name: 'New payment',
    day: 1,
    amount: '',
    paid: false
  };

  data.payments.push(p);
  editPayment(p.id);
});document.querySelectorAll('.custody-day').forEach(x=>x.onclick=()=>{let ds=x.dataset.date,cur=custodyForDate(ds);data.settings.custodyOverrides=data.settings.custodyOverrides||{};data.settings.custodyOverrides[ds]=cur.includes('Dad')&&!cur.includes('Mom')?'Mom':'Dad';save();render()});$('#prevMonth')&&($('#prevMonth').onclick=()=>{calCursor.setMonth(calCursor.getMonth()-1);render()});$('#nextMonth')&&($('#nextMonth').onclick=()=>{calCursor.setMonth(calCursor.getMonth()+1);render()});document.querySelectorAll('.edit-event').forEach(x=>x.onclick=()=>editEvent(+x.dataset.id));document.querySelectorAll('.delete-event').forEach(x=>x.onclick=()=>{if(confirm('Delete this event?')){data.events=data.events.filter(e=>e.id!=x.dataset.id);save();render()}});document.querySelectorAll('.edit-staple').forEach(x=>x.onclick=()=>{let e=data.staples.find(s=>s.id==x.dataset.id);if(!e)return;$('#modalTitle').textContent='Edit staple';$('#modalBody').innerHTML=`<div class="form-grid"><label class="field full">Item<input id="seName" value="${e.name||''}"></label><label class="field">Quantity<input id="seQty" type="number" min="1" value="${e.qty||1}"></label><label class="field">Status<select id="seNeed"><option value="true" ${e.need?'selected':''}>Need</option><option value="false" ${!e.need?'selected':''}>Have it</option></select></label></div><div class="modal-actions"><button type="button" class="danger" id="seDelete">Delete staple</button><button type="button" class="primary" id="seSave">Save changes</button></div>`;$('#modal').showModal();$('#seSave').onclick=()=>{e.name=$('#seName').value.trim();e.qty=+$('#seQty').value||1;e.need=$('#seNeed').value==='true';if(!e.name)return;save();$('#modal').close();render()};$('#seDelete').onclick=()=>{if(confirm('Delete this staple?')){data.staples=data.staples.filter(s=>s.id!=e.id);save();$('#modal').close();render()}}});document.querySelectorAll('.delete-staple').forEach(x=>x.onclick=()=>{if(confirm('Delete this staple?')){data.staples=data.staples.filter(e=>e.id!=x.dataset.id);save();render()}});document.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>{view=b.dataset.go;render()});document.querySelectorAll('.task-check').forEach(x=>x.onchange=()=>{data.tasks.find(t=>t.id==x.dataset.id).done=x.checked;save();render()});document.querySelectorAll('.staple-check').forEach(x=>x.onchange=()=>{data.staples.find(t=>t.id==x.dataset.id).need=x.checked;save();render()});document.querySelectorAll('.qty').forEach(x=>x.onchange=()=>{data.staples.find(t=>t.id==x.dataset.id).qty=+x.value||1;save()});document.querySelectorAll('.meal-select').forEach(x=>x.onchange=()=>{data.mealPlan[x.dataset.date]=x.value;save();render()});document.querySelectorAll('.color').forEach(x=>x.onchange=()=>{data.settings[x.dataset.person.toLowerCase()+'Color']=x.value;save();render()});$('#addEvent')&&($('#addEvent').onclick=eventForm);$('#custodyOverride')&&($('#custodyOverride').onclick=eventForm);$('#addStaple')&&($('#addStaple').onclick=()=>simplePrompt('Add staple','Staple name',v=>{data.staples.push({id:Date.now(),name:v,qty:1,need:true});save();render()}));$('#addMeal')&&($('#addMeal').onclick=()=>{let m={id:Date.now(),name:'New meal',ingredients:'',recipe:''};data.meals.push(m);editMeal(m.id)});$('#copyList')&&($('#copyList').onclick=async()=>{let s=data.staples.filter(x=>x.need).map(x=>`${x.name}${x.qty>1?` x${x.qty}`:''}`).join('\n');await navigator.clipboard.writeText(s);alert('Shopping list copied.');});$('#lock')&&($('#lock').onclick=()=>{localStorage.removeItem('familyHubUnlocked');localStorage.removeItem('familyHubPin');sessionStorage.removeItem('familyHubPin');location.reload()})}
function editEvent(id){let e=data.events.find(x=>x.id==id);if(!e)return;$('#modalTitle').textContent='Edit event';$('#modalBody').innerHTML=`<div class="form-grid"><label class="field full">Event name<input id="eeTitle" value="${e.title||''}"></label><label class="field">Child<select id="eePerson">${['Richard','Timothy','Olivia','Both'].map(x=>`<option ${e.person===x?'selected':''}>${x}</option>`).join('')}</select></label><label class="field">Type<select id="eeType">${['Practice','Game','School','Appointment','Custody','Homework','Other'].map(x=>`<option ${e.type===x?'selected':''}>${x}</option>`).join('')}</select></label><label class="field">Date<input id="eeDate" type="date" value="${e.date||''}"></label><label class="field">Start time<input id="eeTime" type="time" value="${e.time||''}"></label><label class="field">End time<input id="eeEnd" type="time" value="${e.end||''}"></label><label class="field">Leave by<input id="eeLeave" type="time" value="${e.leave||''}"></label><label class="field full">Location<input id="eeLocation" value="${e.location||''}"></label><label class="field full">What to bring / reminder<input id="eeBring" value="${e.bring||''}"></label><label class="field full">Notes<textarea id="eeNotes">${e.notes||''}</textarea></label></div><div class="modal-actions"><button type="button" class="danger" id="eeDelete">Delete event</button><button type="button" class="primary" id="eeSave">Save changes</button></div>`;$('#modal').showModal();$('#eeSave').onclick=()=>{e.title=$('#eeTitle').value.trim();e.person=$('#eePerson').value;e.type=$('#eeType').value;e.date=$('#eeDate').value;e.time=$('#eeTime').value;e.end=$('#eeEnd').value;e.leave=$('#eeLeave').value;e.location=$('#eeLocation').value.trim();e.bring=$('#eeBring').value.trim();e.notes=$('#eeNotes').value.trim();if(!e.title||!e.date)return;save();$('#modal').close();render()};$('#eeDelete').onclick=()=>{if(confirm('Delete this event?')){data.events=data.events.filter(x=>x.id!=id);save();$('#modal').close();render()}}}
function editMeal(id){let m=data.meals.find(x=>x.id==id);if(!m)return;$('#modalTitle').textContent='Edit meal / recipe';$('#modalBody').innerHTML=`<div class="form-grid"><label class="field full">Meal name<input id="meName" value="${m.name||''}"></label><label class="field full">Ingredients<textarea id="meIngredients">${m.ingredients||''}</textarea></label><label class="field full">Recipe / instructions<textarea id="meRecipe">${m.recipe||''}</textarea></label></div><div class="modal-actions"><button type="button" class="danger" id="meDelete">Delete meal</button><button type="button" class="primary" id="meSave">Save changes</button></div>`;$('#modal').showModal();$('#meSave').onclick=()=>{m.name=$('#meName').value.trim();m.ingredients=$('#meIngredients').value.trim();m.recipe=$('#meRecipe').value.trim();if(!m.name){alert('Please enter a meal name.');return}save();$('#modal').close();render()};$('#meDelete').onclick=()=>{if(confirm('Delete this meal?')){data.meals=data.meals.filter(x=>x.id!=id);save();$('#modal').close();render()}}}
function editPayment(id){
  let p = data.payments.find(x => x.id == id);
  if (!p) return;

  $('#modalTitle').textContent = 'Edit payment';

  $('#modalBody').innerHTML = `
    <div class="form-grid">

      <label class="field full">
        Payment name
        <input id="peName" value="${p.name || ''}">
      </label>

      <label class="field">
        Due day
        <input id="peDay" type="number" min="1" max="31" value="${p.day || 1}">
      </label>

      <label class="field">
        Amount
        <input id="peAmount" type="number" min="0" step="0.01"
          value="${p.amount || ''}" placeholder="Optional">
      </label>

      <label class="field">
        Status
        <select id="pePaid">
          <option value="false" ${!p.paid ? 'selected' : ''}>Upcoming</option>
          <option value="true" ${p.paid ? 'selected' : ''}>Paid</option>
        </select>
      </label>

    </div>

    <div class="modal-actions">
      <button type="button" class="danger" id="peDelete">
        Delete payment
      </button>

      <button type="button" class="primary" id="peSave">
        Save changes
      </button>
    </div>
  `;

  $('#modal').showModal();

  $('#peSave').onclick = () => {
    p.name = $('#peName').value.trim();
    p.day = Number($('#peDay').value) || 1;
    p.amount = $('#peAmount').value;
    p.paid = $('#pePaid').value === 'true';

    if (!p.name) {
      alert('Please enter a payment name.');
      return;
    }

    save();
    $('#modal').close();
    render();
  };

  $('#peDelete').onclick = () => {
    if (confirm('Delete this payment?')) {
      data.payments = data.payments.filter(x => x.id != id);
      save();
      $('#modal').close();
      render();
    }
  };
}
function editTask(id){
  let t = data.tasks.find(x => x.id == id);
  if (!t) return;

  $('#modalTitle').textContent = 'Edit task';

  $('#modalBody').innerHTML = `
    <div class="form-grid">

      <label class="field full">
        Task / reminder
        <input id="teName" value="${t.name || ''}">
      </label>

      <label class="field">
        Category
        <select id="teCategory">
          ${['Household','School','Chore','Sports','Reminder','Other']
            .map(x => `<option ${t.category === x ? 'selected' : ''}>${x}</option>`)
            .join('')}
        </select>
      </label>

      <label class="field">
        Due date
        <input id="teDue" type="date" value="${t.due || ''}">
      </label>

      <label class="field">
        Repeat
        <select id="teRepeat">
          ${['None','Daily','Weekly','Monthly']
            .map(x => `<option ${t.repeat === x ? 'selected' : ''}>${x}</option>`)
            .join('')}
        </select>
      </label>

      <label class="field">
        Status
        <select id="teDone">
          <option value="false" ${!t.done ? 'selected' : ''}>To do</option>
          <option value="true" ${t.done ? 'selected' : ''}>Completed</option>
        </select>
      </label>

      <label class="field full">
        Notes
        <textarea id="teNotes">${t.notes || ''}</textarea>
      </label>

    </div>

    <div class="modal-actions">
      <button type="button" class="danger" id="teDelete">
        Delete task
      </button>

      <button type="button" class="primary" id="teSave">
        Save changes
      </button>
    </div>
  `;

  $('#modal').showModal();

  $('#teSave').onclick = () => {
    t.name = $('#teName').value.trim();
    t.category = $('#teCategory').value;
    t.due = $('#teDue').value;
    t.repeat = $('#teRepeat').value;
    t.done = $('#teDone').value === 'true';
    t.notes = $('#teNotes').value.trim();

    if (!t.name) {
      alert('Please enter a task name.');
      return;
    }

    save();
    $('#modal').close();
    render();
  };

  $('#teDelete').onclick = () => {
    if (confirm('Delete this task?')) {
      data.tasks = data.tasks.filter(x => x.id != id);
      save();
      $('#modal').close();
      render();
    }
  };
}
function simplePrompt(title,label,cb){let v=prompt(`${title}\n${label}:`);if(v&&v.trim())cb(v.trim())}
function eventForm(){
  let e = {
    id: Date.now(),
    title: '',
    person: 'Both',
    type: 'School',
    date: addDays(1),
    time: '17:30',
    end: '',
    location: '',
    leave: '',
    bring: '',
    notes: ''
  };

  $('#modalTitle').textContent = 'Add event';

  $('#modalBody').innerHTML = `
    <div class="form-grid">

      <label class="field full">
        Event name
        <input id="neTitle" placeholder="Practice, school event, appointment...">
      </label>

      <label class="field">
        Who
        <select id="nePerson">
          <option>Richard</option>
          <option>Timothy</option>
          <option>Olivia</option>
          <option selected>Both</option>
        </select>
      </label>

      <label class="field">
        Type
        <select id="neType">
          <option>Practice</option>
          <option>Game</option>
          <option selected>School</option>
          <option>Appointment</option>
          <option>Custody</option>
          <option>Homework</option>
          <option>Other</option>
        </select>
      </label>

      <label class="field">
        Date
        <input id="neDate" type="date" value="${e.date}">
      </label>

      <label class="field">
        Start time
        <input id="neTime" type="time" value="${e.time}">
      </label>

      <label class="field">
        End time
        <input id="neEnd" type="time">
      </label>

      <label class="field">
        Leave by
        <input id="neLeave" type="time">
      </label>

      <label class="field full">
        Location
        <input id="neLocation" placeholder="School, field, doctor's office...">
      </label>

      <label class="field full">
        What to bring / reminder
        <input id="neBring" placeholder="Cleats, water bottle, paperwork...">
      </label>

      <label class="field full">
        Notes
        <textarea id="neNotes"></textarea>
      </label>

    </div>

    <div class="modal-actions">
      <span></span>
      <button type="button" class="primary" id="neSave">
        Add event
      </button>
    </div>
  `;

  $('#modal').showModal();

  $('#neSave').onclick = () => {
    e.title = $('#neTitle').value.trim();
    e.person = $('#nePerson').value;
    e.type = $('#neType').value;
    e.date = $('#neDate').value;
    e.time = $('#neTime').value;
    e.end = $('#neEnd').value;
    e.leave = $('#neLeave').value;
    e.location = $('#neLocation').value.trim();
    e.bring = $('#neBring').value.trim();
    e.notes = $('#neNotes').value.trim();

    if (!e.title || !e.date) {
      alert('Please enter an event name and date.');
      return;
    }

    data.events.push(e);
    save();
    $('#modal').close();
    render();
  };
}
$('#quickAdd').onclick=eventForm;document.querySelectorAll('nav button').forEach(b=>b.onclick=()=>{view=b.dataset.view;render()});$('#editDashboard').onclick=()=>{view='more';render()};
if('serviceWorker' in navigator)navigator.serviceWorker.register('./sw.js');
