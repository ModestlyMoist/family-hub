const SYNC_URL="https://ebmcckbjugbivfqimnux.supabase.co/functions/v1/quick-service";
const SAMPLE={settings:{pin:"",richardColor:"#4776c8",timothyColor:"#d77955",city1:"Las Vegas",city2:"Flagstaff"},events:[{id:1,title:"Soccer Practice",person:"Richard",type:"Practice",date:nextDow(2),time:"17:30",end:"19:00",location:"Desert Sports Complex",leave:"16:55",bring:"Cleats, water bottle"},{id:2,title:"Math Homework Due",person:"Timothy",type:"Homework",date:nextDow(3),time:"08:00",location:"School"},{id:3,title:"Kids to Dad",person:"Both",type:"Custody",date:nextDow(5),time:"17:30",recurring:"weekly"},{id:4,title:"Kids Return",person:"Both",type:"Custody",date:nextDow(0),time:"15:30",recurring:"weekly"},{id:5,title:"Pediatric Dentist",person:"Richard",type:"Appointment",date:addDays(5),time:"15:15",location:"Summerlin"}],payments:[{id:1,name:"Internet",day:18,amount:"75",paid:false},{id:2,name:"Car Insurance",day:21,amount:"",paid:false},{id:3,name:"Streaming",day:26,amount:"",paid:false}],staples:["Milk","Eggs","Bread","Bananas","Apples","Yogurt","Cereal","Chicken","Rice","Juice","Paper towels","Toilet paper","Laundry detergent"].map((name,i)=>({id:i+1,name,qty:1,need:i<5})),meals:[{id:1,name:"Tacos",ingredients:"Ground beef, tortillas, shredded cheese, lettuce, taco seasoning",recipe:"Brown beef, season, warm tortillas, assemble."},{id:2,name:"Chicken Alfredo",ingredients:"Chicken, pasta, Alfredo sauce, broccoli",recipe:"Cook pasta and chicken; combine with sauce and broccoli."},{id:3,name:"Spaghetti",ingredients:"Pasta, marinara, ground beef, parmesan",recipe:"Cook pasta; brown beef; simmer with marinara."},{id:4,name:"Burgers",ingredients:"Burger patties, buns, cheese, lettuce, tomato",recipe:"Grill patties and assemble."},{id:5,name:"Chicken & Rice",ingredients:"Chicken, rice, vegetables, seasoning",recipe:"Cook seasoned chicken; serve over rice with vegetables."}],mealPlan:{},tasks:[{id:1,name:"Take trash out",due:nextDow(3),done:false,repeat:"Weekly"},{id:2,name:"Change HVAC filter",due:addDays(6),done:false,repeat:"Monthly"},{id:3,name:"Wash sports uniforms",due:nextDow(5),done:false,repeat:"Weekly"}]};
function iso(d){return d.toISOString().slice(0,10)} function addDays(n){let d=new Date();d.setDate(d.getDate()+n);return iso(d)} function nextDow(x){let d=new Date(),n=(x-d.getDay()+7)%7;n=n||7;d.setDate(d.getDate()+n);return iso(d)}
let data=JSON.parse(localStorage.getItem('familyHubData')||'null')||SAMPLE; let view='home'; let calendarMode='month'; let taskFilter='All'; let calCursor=new Date(); calCursor.setDate(1); let activePin=sessionStorage.getItem('familyHubPin')||localStorage.getItem('familyHubPin')||'';
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
async function weather(){let places=[['Las Vegas',36.1716,-115.1391],['Flagstaff',35.1983,-111.6513]],desc=c=>({0:'Clear',1:'Mostly clear',2:'Partly cloudy',3:'Cloudy',45:'Foggy',48:'Foggy',51:'Light drizzle',53:'Drizzle',55:'Heavy drizzle',61:'Light rain',63:'Rain',65:'Heavy rain',71:'Light snow',73:'Snow',75:'Heavy snow',77:'Snow grains',80:'Rain showers',81:'Rain showers',82:'Heavy showers',85:'Snow showers',86:'Heavy snow showers',95:'Thunderstorms',96:'Thunderstorms',99:'Thunderstorms'}[c]||'Current conditions');for(let [name,lat,lon] of places){try{let r=await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,snowfall_sum&temperature_unit=fahrenheit&wind_speed_unit=mph&precipitation_unit=inch&forecast_days=4&timezone=auto`),j=await r.json(),el=document.querySelector(`[data-weather="${name}"]`);if(!el)continue;let days=[1,2,3].map(i=>{let d=new Date(j.daily.time[i]+'T12:00').toLocaleDateString([],{weekday:'short'}),snow=Number(j.daily.snowfall_sum?.[i]||0),precip=j.daily.precipitation_probability_max[i]??0;return `<div style="flex:1;text-align:center"><b>${d}</b><div>${Math.round(j.daily.temperature_2m_max[i])}° / ${Math.round(j.daily.temperature_2m_min[i])}°</div><div class="meta">${snow>0?`❄ ${snow.toFixed(1)} in`:`☂ ${precip}%`}</div></div>`}).join('');let snow=Number(j.daily.snowfall_sum?.[0]||0),precip=j.daily.precipitation_probability_max[0]??0;el.innerHTML=`<b>${name}</b><div class="temp">${Math.round(j.current.temperature_2m)}°</div><div><b>${desc(j.current.weather_code)}</b></div><div class="meta">Feels ${Math.round(j.current.apparent_temperature)}° · H ${Math.round(j.daily.temperature_2m_max[0])}° · L ${Math.round(j.daily.temperature_2m_min[0])}°</div><div class="meta">${snow>0?`❄ Snow ${snow.toFixed(1)} in`:`☂ Precipitation ${precip}%`} · Wind ${Math.round(j.current.wind_speed_10m)} mph</div><div style="display:flex;gap:8px;margin-top:12px;padding-top:10px;border-top:1px solid var(--line)">${days}</div>`}catch{}}}
function refreshShoppingForNewWeek(){data.settings=data.settings||{};let now=new Date(),sun=new Date(now);sun.setHours(12,0,0,0);sun.setDate(now.getDate()-now.getDay());let week=iso(sun);if(!data.settings.shoppingWeek){data.settings.shoppingWeek=week;save();return}if(data.settings.shoppingWeek!==week){data.staples=data.staples.filter(x=>x.permanent!==false);data.staples.forEach(x=>{x.need=true});data.settings.shoppingWeek=week;save()}}
function choreIntervalDays(t){return t.cycle==='Daily'?1:t.cycle==='Every 3 Days'?3:t.cycle==='Weekly'?7:0}
function choreStatus(t){if(t.taskMode!=='cycle')return t.due?fmtDate(t.due):'No due date';let days=choreIntervalDays(t);if(!t.lastCompleted)return 'Due now · '+(t.cycle||'Chore');let last=new Date(t.lastCompleted+'T12:00'),today=new Date(iso(new Date())+'T12:00'),elapsed=Math.floor((today-last)/86400000),left=days-elapsed;if(left<=0)return 'Due now · '+t.cycle;if(elapsed===0)return 'Done today · '+t.cycle;return 'Due in '+left+' day'+(left===1?'':'s')+' · '+t.cycle}
function normalizeData(){data.settings=data.settings||{};data.events=data.events||[];data.tasks=data.tasks||[];data.payments=data.payments||[];data.staples=data.staples||[];data.meals=data.meals||[];data.events.forEach(e=>{if(!e.repeat&&e.recurring==='weekly')e.repeat='Weekly';if(!e.repeat)e.repeat='None';if(!Array.isArray(e.excludedDates))e.excludedDates=[]});data.tasks.forEach(t=>{if(!t.category)t.category='Household';if(!t.assigned)t.assigned='Everyone';if(t.category==='Chore'&&t.taskMode!=='cycle'){t.taskMode='cycle';t.cycle=t.cycle||((t.repeat==='Weekly'||t.repeat==='Daily')?t.repeat:'Weekly');t.repeat='None';t.due=''}if(!t.taskMode)t.taskMode='dated'})}
function resetRecurringTasks(){let today=iso(new Date()),changed=false;data.tasks.forEach(t=>{if(t.taskMode!=='cycle')return;let days=choreIntervalDays(t);if(t.lastCompleted&&days){let elapsed=Math.floor((new Date(today+'T12:00')-new Date(t.lastCompleted+'T12:00'))/86400000);if(elapsed>=days&&t.done){t.done=false;changed=true}}});if(changed)save()}
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
  normalizeData();
  resetPaymentsForNewMonth();
  refreshShoppingForNewWeek();
  resetRecurringTasks();
  let now = new Date();$('#todayLabel').textContent=now.toLocaleDateString([],{weekday:'long',month:'long',day:'numeric'});let today=iso(now),todayEvents=eventsForDate(today).length,need=data.staples.filter(x=>x.need).length,dueChores=data.tasks.filter(t=>t.taskMode==='cycle'&&choreStatus(t).startsWith('Due now')).length;$('#summary').textContent=`${todayEvents} event${todayEvents===1?'':'s'} today · ${dueChores} chore${dueChores===1?'':'s'} due · ${need} grocer${need===1?'y':'ies'} needed`; let root=$('#dashboard');root.innerHTML=view==='home'?home():view==='calendar'?calendarView():view==='tasks'?tasksView():view==='shop'?shopView():view==='meals'?mealsView():moreView();weather();bind()}
function dashboardDefaults(){return ['coming','weather','week','shopping','meals','payments','household']}
function editDashboard(){data.settings=data.settings||{};data.settings.homeCards=data.settings.homeCards||{coming:true,weather:true,week:true,shopping:true,meals:true,payments:true,household:true};data.settings.homeOrder=data.settings.homeOrder||dashboardDefaults();let labels={coming:'Coming up',weather:'Weather',week:'Week at a glance',shopping:'Shopping',meals:'Meals this week',payments:'Payments',household:'Household'};let draw=()=>{$('#dashRows').innerHTML=data.settings.homeOrder.map((k,i)=>`<div class="item"><input type="checkbox" class="dash-card" data-card="${k}" ${data.settings.homeCards[k]!==false?'checked':''}><div style="flex:1"><b>${labels[k]}</b></div><button type="button" class="mini dash-up" data-i="${i}" ${i===0?'disabled':''}>↑</button><button type="button" class="mini dash-down" data-i="${i}" ${i===data.settings.homeOrder.length-1?'disabled':''}>↓</button></div>`).join('');document.querySelectorAll('.dash-up').forEach(x=>x.onclick=()=>{let i=+x.dataset.i,[v]=data.settings.homeOrder.splice(i,1);data.settings.homeOrder.splice(i-1,0,v);draw()});document.querySelectorAll('.dash-down').forEach(x=>x.onclick=()=>{let i=+x.dataset.i,[v]=data.settings.homeOrder.splice(i,1);data.settings.homeOrder.splice(i+1,0,v);draw()})};$('#modalTitle').textContent='Edit dashboard';$('#modalBody').innerHTML=`<p class="meta">Choose which cards appear on Home and use ↑ ↓ to change their order.</p><div id="dashRows"></div><div class="modal-actions"><span></span><button type="button" class="primary" id="dashSave">Save dashboard</button></div>`;draw();$('#modal').showModal();$('#dashSave').onclick=()=>{document.querySelectorAll('.dash-card').forEach(x=>data.settings.homeCards[x.dataset.card]=x.checked);save();$('#modal').close();render()}}
function home(){let hc=(data.settings&&data.settings.homeCards)||{},order=(data.settings&&data.settings.homeOrder)||dashboardDefaults(),today=iso(new Date()),ev=[];for(let n=0;n<7;n++){let ds=addDays(n);eventsForDate(ds).forEach(e=>ev.push({...e,date:ds,occurrenceDate:ds}))}ev=ev.filter(e=>e.date>=today).sort((a,b)=>(a.date+(a.time||'')).localeCompare(b.date+(b.time||''))).slice(0,6);let cards={coming:()=>`<section class="card wide"><div class="card-head"><h2>Coming up</h2><span class="pill">Next 7 days</span></div>${ev.map(eventRow).join('')}</section>`,weather:()=>`<section class="card"><h2>Weather</h2><div class="weather-row"><div class="weather" data-weather="Las Vegas">Loading…</div><div class="weather" data-weather="Flagstaff">Loading…</div></div></section>`,week:()=>`<section class="card full"><div class="card-head"><h2>Week at a glance</h2><button data-go="calendar">Open calendar</button></div>${weekStrip()}</section>`,shopping:()=>`<section class="card"><div class="card-head"><h2>Shopping</h2><span class="pill">${data.staples.filter(x=>x.need).length} needed</span></div>${data.staples.filter(x=>x.need).slice(0,5).map(x=>`<div class="item">☐ <div>${x.name}${x.qty>1?` ×${x.qty}`:''}</div></div>`).join('')}<div class="actions"><button data-go="shop">Review staples</button></div></section>`,meals:()=>`<section class="card"><h2>Meals this week</h2>${mealPlanRows()}<div class="actions"><button data-go="meals">Plan week</button></div></section>`,payments:()=>`<section class="card"><h2>Payments</h2>${data.payments.filter(p=>!p.paid).slice(0,4).map(p=>`<div class="item"><div><b>${p.name}</b><div class="meta">Due ${p.day}${p.amount?` · $${p.amount}`:''}</div></div></div>`).join('')}</section>`,household:()=>`<section class="card"><h2>Household</h2>${data.tasks.slice(0,4).map(t=>`<div class="item"><input class="check task-check" data-id="${t.id}" type="checkbox" ${t.done?'checked':''}><div>${t.name}<div class="meta">${choreStatus(t)}</div></div></div>`).join('')}</section>`};return order.filter(k=>hc[k]!==false&&cards[k]).map(k=>cards[k]()).join('')}
function relativeDay(ds){let today=iso(new Date());if(ds===today)return 'Today';if(ds===addDays(1))return 'Tomorrow';return new Date(ds+'T12:00').toLocaleDateString([],{weekday:'short',month:'short',day:'numeric'})}
function eventRow(e){let cust=custodyForDate(e.date);return `<div class="item"><span class="dot" style="background:${personColor(e.person)}"></span><div style="flex:1"><div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap"><b>${e.title}</b><span class="pill">${relativeDay(e.date)}</span></div><div class="meta">${e.time||'All day'}${e.end?`–${e.end}`:''}${e.leave?` · Leave ${e.leave}`:''}${e.location?` · ${e.location}`:''}</div><div class="meta">${e.person} · ${e.type} · <span style="color:${custodyColor(cust)}">${cust}</span></div></div><div class="item-actions"><button class="mini edit-event" data-id="${e.id}">Edit</button><button class="mini danger delete-event" data-id="${e.id}" data-date="${e.date}">Delete</button></div></div>`}
function weekStrip(){return `<div class="week">${[0,1,2,3,4,5,6].map(n=>{let d=addDays(n),dt=new Date(d+'T12:00'),es=eventsForDate(d);return `<div class="day"><b>${dt.toLocaleDateString([],{weekday:'short'})}<br>${dt.getDate()}</b>${es.map(e=>`<span class="tag" style="background:${personColor(e.person)}">${e.title}</span>`).join('')}</div>`}).join('')}</div>`}
function custodyForDate(ds){data.settings.custodyOverrides=data.settings.custodyOverrides||{};if(data.settings.custodyOverrides[ds])return data.settings.custodyOverrides[ds];let d=new Date(ds+'T12:00').getDay();return d===5?'Dad after 5:30':d===6?'Dad':d===0?'Dad → Mom 3:30':'Mom'}
function custodyColor(v){return v==='Dad'?'#7183a3':v.includes('→')||v.includes('after')?'#9b7fa5':'#83a487'}
function eventOccursOn(e,ds){if((e.excludedDates||[]).includes(ds))return false;if(e.date===ds)return true;if(!e.repeat||e.repeat==='None'||ds<e.date)return false;if(e.repeatUntil&&ds>e.repeatUntil)return false;let a=new Date(e.date+'T12:00'),b=new Date(ds+'T12:00'),days=Math.round((b-a)/86400000);if(days<0)return false;if(e.repeat==='Daily')return true;if(e.repeat==='Weekly')return days%7===0;if(e.repeat==='Every 2 weeks')return days%14===0;if(e.repeat==='Monthly')return b.getDate()===a.getDate();return false}
function eventsForDate(ds){return data.events.filter(e=>eventOccursOn(e,ds))}
function editCustodyDay(ds){let cur=custodyForDate(ds),regular=(()=>{let o=data.settings.custodyOverrides||{},had=o[ds];delete o[ds];let v=custodyForDate(ds);if(had!==undefined)o[ds]=had;return v})();$('#modalTitle').textContent='Custody · '+fmtDate(ds);let opts=[['regular','Regular schedule',regular],['Mom','Mom','Mom'],['Dad','Dad','Dad'],['Dad after 5:30','Dad after 5:30','Dad after 5:30'],['Dad → Mom 3:30','Dad → Mom 3:30','Dad → Mom 3:30']];$('#modalBody').innerHTML=`<p class="meta">Choose the custody schedule for this day.</p>${opts.map(([v,label,detail])=>`<label class="item"><input type="radio" name="custodyPick" value="${v}" ${(v==='regular'?!data.settings.custodyOverrides?.[ds]:cur===v&&data.settings.custodyOverrides?.[ds])?'checked':''}><div style="flex:1"><b>${label}</b><div class="meta">${v==='regular'?'Automatic schedule: '+detail:detail}</div></div></label>`).join('')}<div class="modal-actions"><span></span><button type="button" class="primary" id="custodySave">Save</button></div>`;$('#modal').showModal();$('#custodySave').onclick=()=>{let pick=document.querySelector('input[name="custodyPick"]:checked');if(!pick)return;data.settings.custodyOverrides=data.settings.custodyOverrides||{};if(pick.value==='regular')delete data.settings.custodyOverrides[ds];else data.settings.custodyOverrides[ds]=pick.value;save();$('#modal').close();render()}}
function calendarListOccurrences(){let out=[],start=new Date();start.setHours(12,0,0,0);for(let n=0;n<90;n++){let d=new Date(start);d.setDate(start.getDate()+n);let ds=iso(d);eventsForDate(ds).forEach(e=>out.push({...e,date:ds}))}return out.sort((a,b)=>(a.date+(a.time||'')).localeCompare(b.date+(b.time||'')))}
function calendarView(){let y=calCursor.getFullYear(),m=calCursor.getMonth(),first=new Date(y,m,1),start=new Date(y,m,1-first.getDay()),cells='';for(let i=0;i<42;i++){let d=new Date(start);d.setDate(start.getDate()+i);let ds=iso(d),cust=custodyForDate(ds),es=eventsForDate(ds);cells+=`<div class="cal-day ${d.getMonth()!==m?'other':''}" style="border-top:4px solid ${custodyColor(cust)}"><div style="display:flex;justify-content:space-between;align-items:center"><b>${d.getDate()}</b><span class="meta" style="font-size:10px">${cust.includes('→')?'Transition':cust.includes('Dad')?'Dad':'Mom'}</span></div><button class="custody-day" data-date="${ds}" style="display:block;width:100%;height:8px;padding:0;margin:5px 0;background:${custodyColor(cust)}" title="${cust}"></button><div class="meta custody-label">${cust}</div>${es.slice(0,3).map(e=>`<button class="tag cal-event" data-id="${e.id}" data-date="${ds}" style="background:${personColor(e.person)};border:0;text-align:left">${e.title}</button>`).join('')}${es.length>3?`<div class="meta">+${es.length-3} more</div>`:''}</div>`}let month=`<div class="calendar-grid">${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(x=>`<div class="cal-head">${x}</div>`).join('')}${cells}</div>`,list=`<div>${calendarListOccurrences().map(eventRow).join('')||'<p class="muted">No upcoming events.</p>'}</div>`;return `<section class="card full"><div class="card-head"><div><h2>Family calendar</h2><div class="meta">Green Mom · Blue Dad · Purple transition · tap custody bar to override a day</div></div><div class="actions"><button id="calendarMonth" class="${calendarMode==='month'?'primary':''}">Month</button><button id="calendarList" class="${calendarMode==='list'?'primary':''}">List</button>${calendarMode==='month'?'<button id="prevMonth">‹</button><b>'+calCursor.toLocaleDateString([],{month:'long',year:'numeric'})+'</b><button id="nextMonth">›</button>':''}<button id="addEvent">＋ Event</button></div></div>${calendarMode==='month'?month:list}</section>`}
function tasksView(){let all=data.tasks.filter(t=>taskFilter==='All'||(t.assigned||'Everyone')===taskFilter),due=all.filter(t=>t.taskMode==='cycle'&&choreStatus(t).startsWith('Due now')),house=all.filter(t=>t.category==='Household'||t.category==='Chore'),school=all.filter(t=>!house.includes(t)),rows=arr=>arr.map(t=>`<div class="item"><input class="check task-check" data-id="${t.id}" type="checkbox" ${t.done?'checked':''}><div style="flex:1"><b>${t.name}</b><div class="meta">${choreStatus(t)}${t.category?` · ${t.category}`:''} · ${t.assigned||'Everyone'}</div></div><div class="item-actions"><button class="mini edit-task" data-id="${t.id}">Edit</button><button class="mini danger delete-task" data-id="${t.id}">Delete</button></div></div>`).join('');return `<section class="card wide"><div class="card-head"><div><h2>Tasks</h2><div class="meta">Chores, school, activities & reminders</div></div><button id="addTask">＋ Task</button></div><div class="actions" style="margin-top:12px">${['All','Richard','Timothy','Olivia','Everyone'].map(x=>`<button class="task-filter ${taskFilter===x?'primary':''}" data-filter="${x}">${x}</button>`).join('')}</div>${due.length?`<div style="margin-top:14px"><h3>Due now</h3>${rows(due)}</div>`:''}</section><section class="card"><h2>Household</h2>${rows(house)||'<p class="muted">No household tasks for this filter.</p>'}</section><section class="card"><h2>School & Activities</h2>${rows(school)||'<p class="muted">No school or activity tasks for this filter.</p>'}</section>`}
function shopView(){data.staples.forEach(x=>{if(x.permanent===undefined)x.permanent=true});return `<section class="card wide"><div class="card-head"><div><h2>Shopping list</h2><div class="meta">Staples stay every week · One-time items can be removed after shopping</div></div><span class="pill">Staples refresh Sunday</span></div>${data.staples.map(x=>`<div class="item"><input class="check staple-check" data-id="${x.id}" type="checkbox" ${x.need?'checked':''}><div style="flex:1"><b>${x.name}</b><div class="meta">${x.need?'Need':'Have it'} · ${x.permanent===false?'One-time':'Weekly staple'}</div></div><input class="qty" data-id="${x.id}" type="number" min="1" value="${x.qty}" style="width:55px"><div class="item-actions"><button class="mini edit-staple" data-id="${x.id}">Edit</button><button class="mini danger delete-staple" data-id="${x.id}">Delete</button></div></div>`).join('')}<div class="actions"><button id="addStaple">＋ Staple</button><button id="addOneTime">＋ One-time item</button><button id="copyList" class="primary">Copy shopping list</button></div></section><section class="card"><h2>Ready for Instacart</h2>${data.staples.filter(x=>x.need).map(x=>`<div class="item">${x.name}${x.qty>1?` ×${x.qty}`:''}<span class="meta" style="margin-left:auto">${x.permanent===false?'One-time':'Staple'}</span></div>`).join('')||'<p class="muted">Nothing needed yet.</p>'}</section>`}
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
      <h2>Custody schedule</h2>
      <p>Friday 5:30 PM — kids go with Dad</p>
      <p>Sunday 3:30 PM — kids return to Mom</p>
      <p class="meta">
        Use the colored custody bars on the calendar to adjust a specific day.
      </p>
    </section>

    <section class="card">
      <h2>App & Sync</h2>
      <p class="meta">
        Cloud sync is active across your Family Hub devices.
      </p>
      <button id="lock">Lock this device</button>
    </section>
  `;
}
function bind(){document.querySelectorAll('.task-filter').forEach(x=>x.onclick=()=>{taskFilter=x.dataset.filter;render()});$('#calendarMonth')&&($('#calendarMonth').onclick=()=>{calendarMode='month';render()});$('#calendarList')&&($('#calendarList').onclick=()=>{calendarMode='list';render()});document.querySelectorAll('.cal-event').forEach(x=>{x.onclick=()=>openCalendarEvent(Number(x.dataset.id),x.dataset.date)});document.querySelectorAll('.meal-shop').forEach(x=>{x.onclick=()=>mealToShopping(Number(x.dataset.id))});document.querySelectorAll('.edit-meal').forEach(x=>{x.onclick=()=>editMeal(Number(x.dataset.id))});document.querySelectorAll('.delete-meal').forEach(x=>{x.onclick=()=>{if(confirm('Delete this meal?')){data.meals=data.meals.filter(m=>m.id!=x.dataset.id);save();render()}}});document.querySelectorAll('.edit-task').forEach(x => {
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
});document.querySelectorAll('.custody-day').forEach(x=>x.onclick=()=>editCustodyDay(x.dataset.date));$('#prevMonth')&&($('#prevMonth').onclick=()=>{calCursor.setMonth(calCursor.getMonth()-1);render()});$('#nextMonth')&&($('#nextMonth').onclick=()=>{calCursor.setMonth(calCursor.getMonth()+1);render()});document.querySelectorAll('.edit-event').forEach(x=>x.onclick=()=>editEvent(+x.dataset.id,x.dataset.date));document.querySelectorAll('.delete-event').forEach(x=>x.onclick=()=>{let e=data.events.find(e=>e.id==x.dataset.id);deleteEventChoice(+x.dataset.id,x.dataset.date||e?.date)});document.querySelectorAll('.edit-staple').forEach(x=>x.onclick=()=>{let e=data.staples.find(s=>s.id==x.dataset.id);if(!e)return;$('#modalTitle').textContent='Edit staple';$('#modalBody').innerHTML=`<div class="form-grid"><label class="field full">Item<input id="seName" value="${e.name||''}"></label><label class="field">Quantity<input id="seQty" type="number" min="1" value="${e.qty||1}"></label><label class="field">Status<select id="seNeed"><option value="true" ${e.need?'selected':''}>Need</option><option value="false" ${!e.need?'selected':''}>Have it</option></select></label></div><div class="modal-actions"><button type="button" class="danger" id="seDelete">Delete staple</button><button type="button" class="primary" id="seSave">Save changes</button></div>`;$('#modal').showModal();$('#seSave').onclick=()=>{e.name=$('#seName').value.trim();e.qty=+$('#seQty').value||1;e.need=$('#seNeed').value==='true';if(!e.name)return;save();$('#modal').close();render()};$('#seDelete').onclick=()=>{if(confirm('Delete this staple?')){data.staples=data.staples.filter(s=>s.id!=e.id);save();$('#modal').close();render()}}});document.querySelectorAll('.delete-staple').forEach(x=>x.onclick=()=>{if(confirm('Delete this staple?')){data.staples=data.staples.filter(e=>e.id!=x.dataset.id);save();render()}});document.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>{view=b.dataset.go;render()});document.querySelectorAll('.task-check').forEach(x=>x.onchange=()=>{let t=data.tasks.find(t=>t.id==x.dataset.id);t.done=x.checked;if(t.taskMode==='cycle'){if(x.checked)t.lastCompleted=iso(new Date());else t.lastCompleted=''}save();render()});document.querySelectorAll('.staple-check').forEach(x=>x.onchange=()=>{data.staples.find(t=>t.id==x.dataset.id).need=x.checked;save();render()});document.querySelectorAll('.qty').forEach(x=>x.onchange=()=>{data.staples.find(t=>t.id==x.dataset.id).qty=+x.value||1;save()});document.querySelectorAll('.meal-select').forEach(x=>x.onchange=()=>{data.mealPlan[x.dataset.date]=x.value;save();render()});document.querySelectorAll('.color').forEach(x=>x.onchange=()=>{data.settings[x.dataset.person.toLowerCase()+'Color']=x.value;save();render()});$('#addEvent')&&($('#addEvent').onclick=eventForm);$('#custodyOverride')&&($('#custodyOverride').onclick=eventForm);$('#addOneTime')&&($('#addOneTime').onclick=()=>simplePrompt('Add one-time item','Item name',v=>{data.staples.push({id:Date.now(),name:v,qty:1,need:true,permanent:false});save();render()}));$('#addStaple')&&($('#addStaple').onclick=()=>simplePrompt('Add staple','Staple name',v=>{data.staples.push({id:Date.now(),name:v,qty:1,need:true,permanent:true});save();render()}));$('#addMeal')&&($('#addMeal').onclick=()=>{let m={id:Date.now(),name:'New meal',ingredients:'',recipe:''};data.meals.push(m);editMeal(m.id)});$('#copyList')&&($('#copyList').onclick=async()=>{let s=data.staples.filter(x=>x.need).map(x=>`${x.name}${x.qty>1?` x${x.qty}`:''}`).join('\n');await navigator.clipboard.writeText(s);alert('Shopping list copied.');});$('#lock')&&($('#lock').onclick=()=>{localStorage.removeItem('familyHubUnlocked');localStorage.removeItem('familyHubPin');sessionStorage.removeItem('familyHubPin');location.reload()})}
function deleteEventChoice(id,ds){let e=data.events.find(x=>x.id==id);if(!e)return;if(!e.repeat||e.repeat==='None'){if(confirm('Delete this event?')){data.events=data.events.filter(x=>x.id!=id);save();render()}return}$('#modalTitle').textContent='Delete recurring event';$('#modalBody').innerHTML=`<p>Which events would you like to delete?</p><div class="actions"><button type="button" id="deleteOne">This event only</button><button type="button" class="danger" id="deleteFuture">This and future events</button><button type="button" class="danger" id="deleteSeries">Entire series</button></div>`;$('#modal').showModal();$('#deleteOne').onclick=()=>{e.excludedDates=e.excludedDates||[];if(!e.excludedDates.includes(ds))e.excludedDates.push(ds);save();$('#modal').close();render()};$('#deleteFuture').onclick=()=>{let d=new Date(ds+'T12:00');d.setDate(d.getDate()-1);if(ds===e.date)data.events=data.events.filter(x=>x.id!=id);else e.repeatUntil=iso(d);save();$('#modal').close();render()};$('#deleteSeries').onclick=()=>{if(confirm('Delete the entire recurring series?')){data.events=data.events.filter(x=>x.id!=id);save();$('#modal').close();render()}}}
function openCalendarEvent(id,ds){let e=data.events.find(x=>x.id==id);if(!e)return;if(!e.repeat||e.repeat==='None'||ds===e.date){editEvent(id,ds);return}$('#modalTitle').textContent=e.title;$('#modalBody').innerHTML=`<p>This is part of a recurring event. What would you like to do?</p><div class="actions"><button type="button" id="editOne">Edit this event only</button><button type="button" class="primary" id="editFuture">Edit this and future</button><button type="button" class="danger" id="deleteOccurrence">Delete…</button></div>`;$('#modal').showModal();$('#deleteOccurrence').onclick=()=>{$('#modal').close();deleteEventChoice(id,ds)};$('#editOne').onclick=()=>{let copy={...e,id:Date.now(),date:ds,repeat:'None',repeatUntil:'',excludedDates:[]};e.excludedDates=e.excludedDates||[];if(!e.excludedDates.includes(ds))e.excludedDates.push(ds);data.events.push(copy);save();$('#modal').close();editEvent(copy.id,ds)};$('#editFuture').onclick=()=>{let dayBefore=new Date(ds+'T12:00');dayBefore.setDate(dayBefore.getDate()-1);let copy={...e,id:Date.now(),date:ds,excludedDates:[]};e.repeatUntil=iso(dayBefore);data.events.push(copy);save();$('#modal').close();editEvent(copy.id,ds)}}
function editEvent(id,occurrenceDate){let e=data.events.find(x=>x.id==id);if(!e)return;$('#modalTitle').textContent='Edit event';$('#modalBody').innerHTML=`<div class="form-grid"><label class="field full">Event name<input id="eeTitle" value="${e.title||''}"></label><label class="field">Child<select id="eePerson">${['Richard','Timothy','Olivia','Both'].map(x=>`<option ${e.person===x?'selected':''}>${x}</option>`).join('')}</select></label><label class="field">Type<select id="eeType">${['Practice','Game','School','Appointment','Custody','Homework','Other'].map(x=>`<option ${e.type===x?'selected':''}>${x}</option>`).join('')}</select></label><label class="field">Date<input id="eeDate" type="date" value="${e.date||''}"></label><label class="field">Start time<input id="eeTime" type="time" value="${e.time||''}"></label><label class="field">End time<input id="eeEnd" type="time" value="${e.end||''}"></label><label class="field">Leave by<input id="eeLeave" type="time" value="${e.leave||''}"></label><label class="field full">Location<input id="eeLocation" value="${e.location||''}"></label><label class="field full">What to bring / reminder<input id="eeBring" value="${e.bring||''}"></label><label class="field">Repeat<select id="eeRepeat">${['None','Daily','Weekly','Every 2 weeks','Monthly'].map(x=>`<option value="${x}" ${(e.repeat||'None')===x?'selected':''}>${x==='None'?"Doesn't repeat":x}</option>`).join('')}</select></label><label class="field">Repeat until<input id="eeRepeatUntil" type="date" value="${e.repeatUntil||''}"></label><label class="field full">Notes<textarea id="eeNotes">${e.notes||''}</textarea></label></div><div class="modal-actions"><button type="button" class="danger" id="eeDelete">Delete event</button><button type="button" class="primary" id="eeSave">Save changes</button></div>`;$('#modal').showModal();$('#eeSave').onclick=()=>{e.title=$('#eeTitle').value.trim();e.person=$('#eePerson').value;e.type=$('#eeType').value;e.date=$('#eeDate').value;e.time=$('#eeTime').value;e.end=$('#eeEnd').value;e.leave=$('#eeLeave').value;e.location=$('#eeLocation').value.trim();e.bring=$('#eeBring').value.trim();e.notes=$('#eeNotes').value.trim();e.repeat=$('#eeRepeat').value;e.repeatUntil=$('#eeRepeatUntil').value;if(!e.title||!e.date)return;save();$('#modal').close();render()};$('#eeDelete').onclick=()=>{$('#modal').close();deleteEventChoice(id,occurrenceDate||e.date)}}
function mealToShopping(id){let m=data.meals.find(x=>x.id==id);if(!m)return;let items=(m.ingredients||'').split(/[,\n]/).map(x=>x.trim()).filter(Boolean);if(!items.length){alert('Add ingredients to this recipe first.');return}$('#modalTitle').textContent='Add ingredients to shopping';$('#modalBody').innerHTML=`<p class="meta">Choose which ingredients from <b>${m.name}</b> you want to add.</p><div>${items.map((name,i)=>{let existing=data.staples.some(s=>s.name.trim().toLowerCase()===name.toLowerCase());return `<label class="item"><input type="checkbox" class="meal-ing" data-name="${name.replace(/"/g,'&quot;')}" ${existing?'':'checked'}><div style="flex:1"><b>${name}</b><div class="meta">${existing?'Already in shopping list':'New item'}</div></div></label>`}).join('')}</div><div class="modal-actions"><span></span><button type="button" class="primary" id="addIngredientsBtn">Add selected</button></div>`;$('#modal').showModal();$('#addIngredientsBtn').onclick=()=>{document.querySelectorAll('.meal-ing:checked').forEach(x=>{let name=x.dataset.name,existing=data.staples.find(s=>s.name.trim().toLowerCase()===name.toLowerCase());if(existing){existing.need=true}else{data.staples.push({id:Date.now()+Math.random(),name,qty:1,need:true,permanent:false})}});save();$('#modal').close();render()}}
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
function editTask(id){let t=data.tasks.find(x=>x.id==id);if(!t)return;let isCycle=t.taskMode==='cycle'||t.category==='Chore';$('#modalTitle').textContent='Edit task';$('#modalBody').innerHTML=`<div class="form-grid"><label class="field full">Task / reminder<input id="teName" value="${t.name||''}"></label><label class="field">Category<select id="teCategory">${['Household','School','Chore','Sports','Reminder','Other'].map(x=>`<option ${t.category===x?'selected':''}>${x}</option>`).join('')}</select></label><label class="field">Task style<select id="teMode"><option value="dated" ${!isCycle?'selected':''}>Due-date task</option><option value="cycle" ${isCycle?'selected':''}>Repeating chore</option></select></label><div id="datedFields" class="field" style="${isCycle?'display:none':''}">Due date<input id="teDue" type="date" value="${t.due||''}"></div><div id="cycleFields" class="field" style="${isCycle?'':'display:none'}">Chore cycle<select id="teCycle"><option value="Daily" ${t.cycle==='Daily'?'selected':''}>Daily</option><option value="Every 3 Days" ${t.cycle==='Every 3 Days'?'selected':''}>Every 3 Days</option><option value="Weekly" ${(t.cycle||t.repeat)==='Weekly'?'selected':''}>Weekly</option></select></div><label class="field">Assigned to<select id="teAssigned">${['Everyone','Richard','Timothy','Olivia'].map(x=>`<option ${(t.assigned||'Everyone')===x?'selected':''}>${x}</option>`).join('')}</select></label><label class="field">Status<select id="teDone"><option value="false" ${!t.done?'selected':''}>To do</option><option value="true" ${t.done?'selected':''}>Completed</option></select></label><label class="field full">Notes<textarea id="teNotes">${t.notes||''}</textarea></label></div><div class="modal-actions"><button type="button" class="danger" id="teDelete">Delete task</button><button type="button" class="primary" id="teSave">Save changes</button></div>`;$('#modal').showModal();let toggle=()=>{let cyc=$('#teMode').value==='cycle';$('#datedFields').style.display=cyc?'none':'';$('#cycleFields').style.display=cyc?'':'none'};$('#teMode').onchange=toggle;$('#teSave').onclick=()=>{t.name=$('#teName').value.trim();t.category=$('#teCategory').value;t.taskMode=$('#teMode').value;t.assigned=$('#teAssigned').value;t.done=$('#teDone').value==='true';t.notes=$('#teNotes').value.trim();if(t.taskMode==='cycle'){t.cycle=$('#teCycle').value;t.repeat='None';t.due='';if(t.done&&!t.lastCompleted)t.lastCompleted=iso(new Date())}else{t.due=$('#teDue').value;t.cycle='';t.repeat='None';delete t.lastCompleted}if(!t.name){alert('Please enter a task name.');return}save();$('#modal').close();render()};$('#teDelete').onclick=()=>{if(confirm('Delete this task?')){data.tasks=data.tasks.filter(x=>x.id!=id);save();$('#modal').close();render()}}}
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

      <label class="field">
        Repeat
        <select id="neRepeat">
          <option value="None">Doesn't repeat</option>
          <option>Daily</option>
          <option>Weekly</option>
          <option>Every 2 weeks</option>
          <option>Monthly</option>
        </select>
      </label>

      <label class="field">
        Repeat until
        <input id="neRepeatUntil" type="date">
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
    e.repeat = $('#neRepeat').value;
    e.repeatUntil = $('#neRepeatUntil').value;

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
$('#quickAdd').onclick=eventForm;document.querySelectorAll('nav button').forEach(b=>b.onclick=()=>{view=b.dataset.view;render()});$('#editDashboard').onclick=editDashboard;
if('serviceWorker' in navigator)navigator.serviceWorker.register('./sw.js');
