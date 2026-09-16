const SYNC_URL="https://ebmcckbjugbivfqimnux.supabase.co/functions/v1/quick-service";
const SAMPLE={settings:{pin:"",richardColor:"#4776c8",timothyColor:"#d77955",city1:"Las Vegas",city2:"Flagstaff"},events:[{id:1,title:"Soccer Practice",person:"Richard",type:"Practice",date:nextDow(2),time:"17:30",end:"19:00",location:"Desert Sports Complex",leave:"16:55",bring:"Cleats, water bottle"},{id:2,title:"Math Homework Due",person:"Timothy",type:"Homework",date:nextDow(3),time:"08:00",location:"School"},{id:3,title:"Kids to Dad",person:"Both",type:"Custody",date:nextDow(5),time:"17:30",recurring:"weekly"},{id:4,title:"Kids Return",person:"Both",type:"Custody",date:nextDow(0),time:"15:30",recurring:"weekly"},{id:5,title:"Pediatric Dentist",person:"Richard",type:"Appointment",date:addDays(5),time:"15:15",location:"Summerlin"}],payments:[{id:1,name:"Internet",day:18,amount:"75",paid:false},{id:2,name:"Car Insurance",day:21,amount:"",paid:false},{id:3,name:"Streaming",day:26,amount:"",paid:false}],staples:["Milk","Eggs","Bread","Bananas","Apples","Yogurt","Cereal","Chicken","Rice","Juice","Paper towels","Toilet paper","Laundry detergent"].map((name,i)=>({id:i+1,name,qty:1,need:i<5})),meals:[{id:1,name:"Tacos",ingredients:"Ground beef, tortillas, shredded cheese, lettuce, taco seasoning",recipe:"Brown beef, season, warm tortillas, assemble."},{id:2,name:"Chicken Alfredo",ingredients:"Chicken, pasta, Alfredo sauce, broccoli",recipe:"Cook pasta and chicken; combine with sauce and broccoli."},{id:3,name:"Spaghetti",ingredients:"Pasta, marinara, ground beef, parmesan",recipe:"Cook pasta; brown beef; simmer with marinara."},{id:4,name:"Burgers",ingredients:"Burger patties, buns, cheese, lettuce, tomato",recipe:"Grill patties and assemble."},{id:5,name:"Chicken & Rice",ingredients:"Chicken, rice, vegetables, seasoning",recipe:"Cook seasoned chicken; serve over rice with vegetables."}],mealPlan:{},tasks:[{id:1,name:"Take trash out",due:nextDow(3),done:false,repeat:"Weekly"},{id:2,name:"Change HVAC filter",due:addDays(6),done:false,repeat:"Monthly"},{id:3,name:"Wash sports uniforms",due:nextDow(5),done:false,repeat:"Weekly"}]};
function iso(d){return d.toISOString().slice(0,10)} function addDays(n){let d=new Date();d.setDate(d.getDate()+n);return iso(d)} function nextDow(x){let d=new Date(),n=(x-d.getDay()+7)%7;n=n||7;d.setDate(d.getDate()+n);return iso(d)}
let data=JSON.parse(localStorage.getItem('familyHubData')||'null')||SAMPLE; let view='home'; let calendarMode='month'; let taskFilter='All'; let calCursor=new Date(); let habitCursor=weekStart(); let habitMode='week'; let habitSummaryRange='weekly'; calCursor.setDate(1); let activePin=sessionStorage.getItem('familyHubPin')||localStorage.getItem('familyHubPin')||'';
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
function normalizeData(){data.settings=data.settings||{};data.events=data.events||[];data.tasks=data.tasks||[];data.payments=data.payments||[];data.staples=data.staples||[];data.meals=data.meals||[];data.habits=data.habits||[];data.habitLog=data.habitLog||{};data.choreLog=data.choreLog||{};data.habits.forEach(h=>{if(!h.trackerType)h.trackerType='habit'});data.events.forEach(e=>{if(!e.repeat&&e.recurring==='weekly')e.repeat='Weekly';if(!e.repeat)e.repeat='None';if(!Array.isArray(e.excludedDates))e.excludedDates=[]});data.tasks.forEach(t=>{if(!t.category)t.category='Household';if(!t.assigned)t.assigned='Everyone';if((t.category==='Chore'||t.category==='Household')&&t.taskMode!=='cycle'&&!t.due){t.taskMode='cycle';t.cycle=t.cycle||((t.repeat==='Weekly'||t.repeat==='Daily')?t.repeat:'Weekly');t.repeat='None';t.due=''}if(!t.taskMode)t.taskMode='dated'})}
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
  resetRecurringTasks();
  let now = new Date();$('#todayLabel').textContent=now.toLocaleDateString([],{weekday:'long',month:'long',day:'numeric'});let today=iso(now),todayEvents=eventsForDate(today).length,need=data.staples.filter(x=>x.need).length,dueChores=data.tasks.filter(t=>t.taskMode==='cycle'&&choreStatus(t).startsWith('Due now')).length;let habitsToday=data.habits.filter(h=>(h.trackerType||'habit')==='habit'&&habitApplies(h,today)&&!data.habitLog[today]?.[h.id]).length;$('#summary').textContent=`${todayEvents} event${todayEvents===1?'':'s'} today · ${dueChores} chore${dueChores===1?'':'s'} due · ${habitsToday} habit${habitsToday===1?'':'s'} to complete · ${need} grocer${need===1?'y':'ies'} needed`; let root=$('#dashboard');root.innerHTML=view==='home'?home():view==='calendar'?calendarView():view==='tasks'?tasksView():view==='shop'?shopView():view==='meals'?mealsView():view==='habits'?habitsView():moreView();weather();bind()}
function dashboardDefaults(){return ['coming','weather','week','habits','shopping','meals','payments','household']}
function editDashboard(){data.settings=data.settings||{};data.settings.homeCards=data.settings.homeCards||{coming:true,weather:true,week:true,habits:true,shopping:true,meals:true,payments:true,household:true};if(data.settings.homeCards.habits===undefined)data.settings.homeCards.habits=true;data.settings.homeOrder=data.settings.homeOrder||dashboardDefaults();let labels={coming:'Coming up',weather:'Weather',week:'Week at a glance',habits:'Habits & GG Points',shopping:'Shopping',meals:'Meals this week',payments:'Payments',household:'Household'};let draw=()=>{$('#dashRows').innerHTML=data.settings.homeOrder.map((k,i)=>`<div class="item sortable-row" draggable="true" data-i="${i}"><span class="drag-handle">☰</span><input type="checkbox" class="dash-card" data-card="${k}" ${data.settings.homeCards[k]!==false?'checked':''}><div style="flex:1"><b>${labels[k]}</b></div></div>`).join('');enableSort($('#dashRows'),data.settings.homeOrder,draw)};$('#modalTitle').textContent='Edit dashboard';$('#modalBody').innerHTML=`<p class="meta">Choose which cards appear on Home and drag ☰ to change their order.</p><div id="dashRows"></div><div class="modal-actions"><span></span><button type="button" class="primary" id="dashSave">Save dashboard</button></div>`;draw();$('#modal').showModal();$('#dashSave').onclick=()=>{document.querySelectorAll('.dash-card').forEach(x=>data.settings.homeCards[x.dataset.card]=x.checked);save();$('#modal').close();render()}}
function home(){let hc=(data.settings&&data.settings.homeCards)||{};if(hc.habits===undefined)hc.habits=true;let order=(data.settings&&data.settings.homeOrder)||dashboardDefaults();if(!order.includes('habits')){let wi=order.indexOf('week');order.splice(wi>=0?wi+1:0,0,'habits');if(data.settings)data.settings.homeOrder=order}let today=iso(new Date()),ev=[];for(let n=0;n<7;n++){let ds=addDays(n);eventsForDate(ds).forEach(e=>ev.push({...e,date:ds,occurrenceDate:ds}))}ev=ev.filter(e=>e.date>=today).sort((a,b)=>(a.date+(a.time||'')).localeCompare(b.date+(b.time||''))).slice(0,6);let cards={coming:()=>`<section class="card"><div class="card-head"><h2>Coming up</h2><span class="pill">Next 7 days</span></div><div class="coming-scroll">${ev.map(eventRow).join('')||'<p class="muted">Nothing coming up in the next 7 days.</p>'}</div><div class="actions"><button data-go="calendar">Open calendar</button></div></section>`,weather:()=>`<section class="card"><h2>Weather</h2><div class="weather-row"><div class="weather" data-weather="Las Vegas">Loading…</div><div class="weather" data-weather="Flagstaff">Loading…</div></div></section>`,week:()=>`<section class="card full"><div class="card-head"><h2>Week at a glance</h2><button data-go="calendar">Open calendar</button></div>${weekStrip()}</section>`,habits:()=>{let s=weekHabitStats(),pts=ggPoints(),ds=iso(new Date()),remaining=data.habits.filter(h=>(h.trackerType||'habit')==='habit'&&habitApplies(h,ds)&&!data.habitLog[ds]?.[h.id]);return `<section class="card"><div class="card-head"><div><h2>Habits</h2><div class="meta">${s.done} of ${s.total} completed this week</div></div><span class="pill">${s.pct}%</span></div><div class="gg-home"><div><span>GG Points</span><strong>${pts.toFixed(2)}</strong></div><div><span>This week</span><strong>+${s.points.toFixed(2)}</strong></div></div><div class="home-habits"><div class="habit-group-title">Still to do today</div><div class="home-habits-scroll">${remaining.map(h=>`<label class="home-habit-row"><input type="checkbox" class="home-habit-toggle" data-id="${h.id}" data-date="${ds}"><b>${h.name}</b></label>`).join('')||'<p class="muted">All habits done for today 🎉</p>'}</div></div><div class="actions"><button data-go="habits">Open tracker</button></div></section>`},shopping:()=>{let need=data.staples.filter(x=>x.need),total=need.reduce((n,x)=>n+(+x.qty||1),0);return `<section class="card"><div class="card-head"><div><h2>Shopping</h2><div class="meta">${total} item${total===1?'':'s'} in the next order</div></div><span class="pill">${need.length} needed</span></div>${need.slice(0,4).map(x=>`<div class="home-shopping-row"><span>☐</span><b>${x.name}</b>${x.qty>1?`<span class="pill">×${x.qty}</span>`:''}</div>`).join('')||'<p class="muted">Shopping list is clear 🎉</p>'}${need.length>4?`<div class="meta home-more">+${need.length-4} more on the list</div>`:''}<div class="actions"><button data-go="shop">Open shopping</button></div></section>`},meals:()=>`<section class="card"><h2>Meals this week</h2>${mealPlanRows()}<div class="actions"><button data-go="meals">Plan week</button></div></section>`,payments:()=>{let now=new Date(),today=now.getDate(),last=new Date(now.getFullYear(),now.getMonth()+1,0).getDate(),up=data.payments.filter(p=>!p.paid).sort((a,b)=>a.day-b.day),status=p=>{let d=Math.min(+p.day||1,last),diff=d-today;if(diff<0)return 'Past due';if(diff===0)return 'Due today';if(diff===1)return 'Due tomorrow';return 'Due in '+diff+' days'};return `<section class="card"><div class="card-head"><h2>Payments</h2><button data-go="more">Manage</button></div>${up.slice(0,4).map(p=>`<div class="item"><div style="flex:1"><b>${p.name}</b><div class="meta">${status(p)} · day ${p.day}${p.amount?` · ${p.amount}`:''}</div></div></div>`).join('')||'<p class="muted">All monthly payments are marked paid 🎉</p>'}</section>`},household:()=>{let due=data.tasks.filter(t=>(t.category==='Household'||t.category==='Chore')&&!t.done).sort((a,b)=>{let ad=a.taskMode==='cycle'&&choreStatus(a).startsWith('Due now')?0:1,bd=b.taskMode==='cycle'&&choreStatus(b).startsWith('Due now')?0:1;if(ad!==bd)return ad-b;return (a.due||'9999').localeCompare(b.due||'9999')});return `<section class="card"><div class="card-head"><div><h2>Household</h2><div class="meta">${due.filter(t=>choreStatus(t).startsWith('Due now')).length} due now</div></div><button data-go="tasks">Open tasks</button></div><div class="household-scroll">${due.map(t=>`<label class="item home-chore"><input class="check task-check" data-id="${t.id}" type="checkbox"><div style="flex:1"><b>${t.name}</b><div class="meta">${choreStatus(t)} · ${t.assigned||'Everyone'}</div></div></label>`).join('')||'<p class="muted">Everything is done 🎉</p>'}</div></section>`}};return order.filter(k=>hc[k]!==false&&cards[k]).map(k=>cards[k]()).join('')}
function relativeDay(ds){let today=iso(new Date());if(ds===today)return 'Today';if(ds===addDays(1))return 'Tomorrow';return new Date(ds+'T12:00').toLocaleDateString([],{weekday:'short',month:'short',day:'numeric'})}
function eventRow(e){let cust=custodyForDate(e.date);return `<div class="item"><span class="dot" style="background:${personColor(e.person)}"></span><div style="flex:1"><div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap"><b>${e.title}</b><span class="pill">${relativeDay(e.date)}</span></div><div class="meta">${e.time||'All day'}${e.end?`–${e.end}`:''}${e.leave?` · Leave ${e.leave}`:''}${e.location?` · ${e.location}`:''}</div><div class="meta">${e.person} · ${e.type} · <span style="color:${custodyColor(cust)}">${cust}</span></div></div><div class="item-actions"><button class="mini edit-event" data-id="${e.id}">Edit</button><button class="mini danger delete-event" data-id="${e.id}" data-date="${e.date}">Delete</button></div></div>`}
function weekStrip(){return `<div class="week">${[0,1,2,3,4,5,6].map(n=>{let d=addDays(n),dt=new Date(d+'T12:00'),es=eventsForDate(d),cust=custodyForDate(d);return `<button class="day week-day ${n===0?'week-today':''}" data-date="${d}" style="border-top:4px solid ${custodyColor(cust)}"><div class="week-date">${n===0?'<strong>Today</strong>':''}<b>${dt.toLocaleDateString([],{weekday:'short',month:'short',day:'numeric'})}</b></div><span class="week-custody"><i style="background:${custodyColor(cust)}"></i>${cust.includes('→')?'Transition':cust.includes('Dad')?'Dad':'Mom'}</span>${es.slice(0,3).map(e=>`<span class="tag" style="background:${personColor(e.person)}">${e.time?`${e.time} · `:''}${e.title}</span>`).join('')}${es.length>3?`<span class="meta">+${es.length-3} more</span>`:''}</button>`}).join('')}</div>`}
function custodyForDate(ds){data.settings.custodyOverrides=data.settings.custodyOverrides||{};if(data.settings.custodyOverrides[ds])return data.settings.custodyOverrides[ds];let d=new Date(ds+'T12:00').getDay();return d===5?'Dad after 5:30':d===6?'Dad':d===0?'Dad → Mom 3:30':'Mom'}
function custodyColor(v){return v==='Dad'?'#7183a3':v.includes('→')||v.includes('after')?'#9b7fa5':'#83a487'}
function eventOccursOn(e,ds){if((e.excludedDates||[]).includes(ds))return false;if(e.date===ds)return true;if(!e.repeat||e.repeat==='None'||ds<e.date)return false;if(e.repeatUntil&&ds>e.repeatUntil)return false;let a=new Date(e.date+'T12:00'),b=new Date(ds+'T12:00'),days=Math.round((b-a)/86400000);if(days<0)return false;if(e.repeat==='Daily')return true;if(e.repeat==='Weekly')return days%7===0;if(e.repeat==='Every 2 weeks')return days%14===0;if(e.repeat==='Monthly')return b.getDate()===a.getDate();return false}
function eventsForDate(ds){return data.events.filter(e=>eventOccursOn(e,ds))}
function editCustodyDay(ds){let cur=custodyForDate(ds),regular=(()=>{let o=data.settings.custodyOverrides||{},had=o[ds];delete o[ds];let v=custodyForDate(ds);if(had!==undefined)o[ds]=had;return v})();$('#modalTitle').textContent='Custody · '+fmtDate(ds);let opts=[['regular','Regular schedule',regular],['Mom','Mom','Mom'],['Dad','Dad','Dad'],['Dad after 5:30','Dad after 5:30','Dad after 5:30'],['Dad → Mom 3:30','Dad → Mom 3:30','Dad → Mom 3:30']];$('#modalBody').innerHTML=`<p class="meta">Choose the custody schedule for this day.</p>${opts.map(([v,label,detail])=>`<label class="item"><input type="radio" name="custodyPick" value="${v}" ${(v==='regular'?!data.settings.custodyOverrides?.[ds]:cur===v&&data.settings.custodyOverrides?.[ds])?'checked':''}><div style="flex:1"><b>${label}</b><div class="meta">${v==='regular'?'Automatic schedule: '+detail:detail}</div></div></label>`).join('')}<div class="modal-actions"><span></span><button type="button" class="primary" id="custodySave">Save</button></div>`;$('#modal').showModal();$('#custodySave').onclick=()=>{let pick=document.querySelector('input[name="custodyPick"]:checked');if(!pick)return;data.settings.custodyOverrides=data.settings.custodyOverrides||{};if(pick.value==='regular')delete data.settings.custodyOverrides[ds];else data.settings.custodyOverrides[ds]=pick.value;save();$('#modal').close();render()}}
function calendarListOccurrences(){let out=[],start=new Date();start.setHours(12,0,0,0);for(let n=0;n<90;n++){let d=new Date(start);d.setDate(start.getDate()+n);let ds=iso(d);eventsForDate(ds).forEach(e=>out.push({...e,date:ds}))}return out.sort((a,b)=>(a.date+(a.time||'')).localeCompare(b.date+(b.time||'')))}
function openDayAgenda(ds){let es=eventsForDate(ds);$('#modalTitle').textContent=fmtDate(ds);$('#modalBody').innerHTML=`<div class="meta" style="margin-bottom:10px">${custodyForDate(ds)}</div>${es.map(e=>`<button class="item day-event" data-id="${e.id}" data-date="${ds}" style="width:100%;text-align:left"><span class="dot" style="background:${personColor(e.person)}"></span><div><b>${e.title}</b><div class="meta">${e.time||'All day'} · ${e.person}</div></div></button>`).join('')||'<p class="muted">No events this day.</p>'}`;$('#modal').showModal();document.querySelectorAll('.day-event').forEach(x=>x.onclick=()=>{$('#modal').close();openCalendarEvent(+x.dataset.id,x.dataset.date)})}
function calendarView(){let y=calCursor.getFullYear(),m=calCursor.getMonth(),first=new Date(y,m,1),start=new Date(y,m,1-first.getDay()),cells='';for(let i=0;i<42;i++){let d=new Date(start);d.setDate(start.getDate()+i);let ds=iso(d),cust=custodyForDate(ds),es=eventsForDate(ds);cells+=`<div class="cal-day ${d.getMonth()!==m?'other':''} ${ds===iso(new Date())?'cal-today':''}" data-date="${ds}" style="border-top:4px solid ${custodyColor(cust)}"><div style="display:flex;justify-content:space-between;align-items:center"><b>${d.getDate()}</b><span class="meta" style="font-size:10px">${cust.includes('→')?'Transition':cust.includes('Dad')?'Dad':'Mom'}</span></div><button class="custody-day" data-date="${ds}" style="display:block;width:100%;height:8px;padding:0;margin:5px 0;background:${custodyColor(cust)}" title="${cust}"></button><div class="meta custody-label">${cust}</div>${es.slice(0,3).map(e=>`<button class="tag cal-event" data-id="${e.id}" data-date="${ds}" style="background:${personColor(e.person)};border:0;text-align:left">${e.title}</button>`).join('')}${es.length>3?`<button class="cal-more" data-date="${ds}">+${es.length-3} more</button>`:''}</div>`}let month=`<div class="calendar-grid">${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(x=>`<div class="cal-head">${x}</div>`).join('')}${cells}</div>`,list=`<div>${calendarListOccurrences().map(eventRow).join('')||'<p class="muted">No upcoming events.</p>'}</div>`;return `<section class="card full"><div class="card-head"><div><h2>Family calendar</h2><div class="meta">Green Mom · Blue Dad · Purple transition · tap custody bar to override a day</div></div><div class="actions"><button id="calendarMonth" class="${calendarMode==='month'?'primary':''}">Month</button><button id="calendarList" class="${calendarMode==='list'?'primary':''}">List</button>${calendarMode==='month'?'<button id="prevMonth">‹</button><b>'+calCursor.toLocaleDateString([],{month:'long',year:'numeric'})+'</b><button id="nextMonth">›</button><button id="calendarToday">Today</button>':''}<button id="addEvent">＋ Event</button></div></div>${calendarMode==='month'?month:list}</section>`}
function tasksView(){let all=data.tasks.filter(t=>taskFilter==='All'||(t.assigned||'Everyone')===taskFilter),due=all.filter(t=>t.taskMode==='cycle'&&choreStatus(t).startsWith('Due now')),house=all.filter(t=>t.category==='Household'||t.category==='Chore'),school=all.filter(t=>!house.includes(t)),rows=arr=>arr.map(t=>`<div class="item"><input class="check task-check" data-id="${t.id}" type="checkbox" ${t.done?'checked':''}><div style="flex:1"><b>${t.name}</b><div class="meta">${choreStatus(t)}${t.category?` · ${t.category}`:''} · ${t.assigned||'Everyone'}</div></div><div class="item-actions"><button class="mini edit-task" data-id="${t.id}">Edit</button><button class="mini danger delete-task" data-id="${t.id}">Delete</button></div></div>`).join('');return `<section class="card wide"><div class="card-head"><div><h2>Tasks</h2><div class="meta">Chores, school, activities & reminders</div></div><button id="addTask">＋ Task</button></div><div class="actions" style="margin-top:12px">${['All','Richard','Timothy','Olivia','Everyone'].map(x=>`<button class="task-filter ${taskFilter===x?'primary':''}" data-filter="${x}">${x}</button>`).join('')}</div>${due.length?`<div style="margin-top:14px"><h3>Due now</h3>${rows(due)}</div>`:''}</section><section class="card"><h2>Household</h2>${rows(house)||'<p class="muted">No household tasks for this filter.</p>'}</section><section class="card"><h2>School & Activities</h2>${rows(school)||'<p class="muted">No school or activity tasks for this filter.</p>'}</section>`}
function shopView(){data.staples.forEach(x=>{if(x.permanent===undefined)x.permanent=true;if(!x.qty)x.qty=1});let need=data.staples.filter(x=>x.need),have=data.staples.filter(x=>!x.need),row=x=>`<div class="shopping-item ${x.need?'needed':'got-it'}"><input class="check staple-check" data-id="${x.id}" type="checkbox" ${x.need?'checked':''}><div class="shopping-name"><b>${x.name}</b><div class="meta">${x.permanent===false?'One-time item':'Staple'}</div></div><div class="shopping-qty"><span>Qty</span><input class="qty" data-id="${x.id}" type="number" min="1" value="${x.qty}"></div><div class="item-actions"><button class="mini edit-staple" data-id="${x.id}">Edit</button><button class="mini danger delete-staple" data-id="${x.id}">Delete</button></div></div>`;return `<section class="card wide"><div class="card-head"><div><h2>Shopping list</h2><div class="meta">Check items you need. Finish the order when shopping is complete.</div></div><span class="pill">${need.length} needed</span></div><div class="shopping-section"><h3>🛒 Need to buy</h3>${need.map(row).join('')||'<div class="shopping-empty">Your list is clear 🎉</div>'}</div>${have.length?`<section class="shopping-have"><h3>✓ Already have · ${have.length}</h3>${have.map(row).join('')}</section>`:''}<div class="actions shopping-actions"><button id="addStaple">＋ Staple</button><button id="addOneTime">＋ One-time item</button><button id="copyList">Copy list</button><button id="orderComplete" class="primary">✓ Order complete</button></div></section><section class="card"><div class="card-head"><h2>Order preview</h2><span class="pill">${need.reduce((n,x)=>n+(x.qty||1),0)} items</span></div>${need.map(x=>`<div class="order-preview"><span>${x.name}</span><b>${x.qty>1?`×${x.qty}`:''}</b></div>`).join('')||'<p class="muted">Nothing needed right now.</p>'}<div class="meta" style="margin-top:12px">Ready to copy into your grocery order.</div></section><section class="card full"><div class="card-head"><div><h2>One-time history</h2><div class="meta">Past one-time items · tap Add to put one back on the current order</div></div><span class="pill">${(data.settings.oneTimeHistory||[]).length} saved</span></div>${(data.settings.oneTimeHistory||[]).map((name,i)=>`<div class="item"><div style="flex:1"><b>${name}</b></div><button class="mini add-history" data-i="${i}">＋ Add</button><button class="mini danger delete-history" data-i="${i}">Remove</button></div>`).join('')||'<p class="muted">Completed one-time items will appear here.</p>'}</section>`}
function mealPlanRows(){let rows=[0,1,2,3,4,5,6].map(n=>{let d=addDays(n),meal=data.mealPlan[d];if(!meal)return '';let day=n===0?'Today':n===1?'Tomorrow':new Date(d+'T12:00').toLocaleDateString([],{weekday:'short'});return `<div class="meal home-meal"><b>${day}</b><span>${meal}</span></div>`}).filter(Boolean);return rows.length?rows.slice(0,4).join(''):'<p class="muted">No meals planned yet.</p>'}
function mealsView(){let planned=[0,1,2,3,4,5,6].filter(n=>data.mealPlan[addDays(n)]).length;return `<section class="card wide"><div class="card-head"><div><h2>Plan the week</h2><div class="meta">${planned} of 7 days planned · choose from your meal library</div></div><span class="pill">${7-planned} open</span></div><div class="meal-week">${[0,1,2,3,4,5,6].map(n=>{let d=addDays(n),dt=new Date(d+'T12:00'),day=dt.toLocaleDateString([],{weekday:'long'}),date=dt.toLocaleDateString([],{month:'short',day:'numeric'}),meal=data.mealPlan[d]||'';return `<div class="meal-plan-row"><div class="meal-day"><b>${day}</b><span>${date}</span></div><select class="meal-select" data-date="${d}"><option value="">Not planned</option>${data.meals.map(m=>`<option ${meal===m.name?'selected':''}>${m.name}</option>`).join('')}</select>${meal?`<button class="mini meal-day-shop" data-name="${meal}">＋ List</button>`:''}</div>`}).join('')}</div></section><section class="card"><div class="card-head"><div><h2>Meal library</h2><div class="meta">${data.meals.length} saved meals</div></div><button id="addMeal">＋ Meal</button></div><div class="meal-library">${data.meals.map(m=>`<div class="meal-library-card"><div class="card-head"><b>${m.name}</b><div class="item-actions"><button class="mini meal-shop" data-id="${m.id}">＋ Shopping</button><button class="mini edit-meal" data-id="${m.id}">Edit</button><button class="mini danger delete-meal" data-id="${m.id}">Delete</button></div></div><div class="meta">${m.ingredients||'No ingredients added'}</div></div>`).join('')||'<p class="muted">Add your first meal to start planning.</p>'}</div></section>`}
function weekStart(ds=iso(new Date())){let d=new Date(ds+'T12:00'),n=(d.getDay()+6)%7;d.setDate(d.getDate()-n);return iso(d)}
function habitDays(startDs=habitCursor){let start=new Date(startDs+'T12:00');return Array.from({length:7},(_,i)=>{let d=new Date(start);d.setDate(start.getDate()+i);return iso(d)})}
function habitApplies(h,ds){let dow=new Date(ds+'T12:00').getDay();return !h.days||h.days.length===0||h.days.includes(dow)}
function ggPoints(){let n=0;Object.entries(data.habitLog||{}).forEach(([ds,log])=>Object.entries(log||{}).forEach(([id,v])=>{let h=data.habits.find(x=>x.id==id);if(v&&h&&(h.trackerType||'habit')==='habit'&&habitApplies(h,ds))n++}));return +(n*.05).toFixed(2)}
function weekHabitStats(startDs=weekStart()){let days=habitDays(startDs),done=0,total=0;days.forEach(ds=>data.habits.filter(h=>(h.trackerType||'habit')==='habit').forEach(h=>{if(habitApplies(h,ds)){total++;if(data.habitLog[ds]?.[h.id])done++}}));return {done,total,pct:total?Math.round(done/total*100):0,points:+(done*.05).toFixed(2)}}
function habitWeekLabel(){let ds=habitDays(),a=new Date(ds[0]+'T12:00'),b=new Date(ds[6]+'T12:00');return a.toLocaleDateString([],{month:'short',day:'numeric'})+' – '+b.toLocaleDateString([],{month:'short',day:'numeric',year:'numeric'})}
function habitsView(){if(habitMode==='summary')return habitSummaryView();let days=habitDays(),habits=data.habits.filter(h=>(h.trackerType||'habit')==='habit'),checks=data.habits.filter(h=>h.trackerType==='checkin'),done=0,total=0;days.forEach(ds=>habits.forEach(h=>{if(habitApplies(h,ds)){total++;if(data.habitLog[ds]?.[h.id])done++}}));let pct=total?Math.round(done/total*100):0,rows=(list,kind,ds)=>list.filter(h=>habitApplies(h,ds)).map(h=>`<label class="habit-check ${kind==='checkin'?'checkin-row':''}"><input type="checkbox" class="habit-toggle" data-id="${h.id}" data-date="${ds}" ${data.habitLog[ds]?.[h.id]?'checked':''}><span>${h.name}</span></label>`).join('');return `<section class="gg-total"><span>GG Points</span><strong>${ggPoints().toFixed(2)}</strong><span class="gg-week">This week <b>+${weekHabitStats(weekStart()).points.toFixed(2)}</b></span><small>+0.05 for each completed habit</small></section><section class="card full"><div class="card-head"><div><h2>Weekly habits & check-ins</h2><div class="meta">${pct}% complete · ${habitWeekLabel()}</div></div><div class="actions"><button id="habitPrev">‹</button><button id="habitThis">This week</button><button id="habitNext">›</button><button id="habitSummaryPage">Summary</button><button id="addHabit">＋ Tracker</button></div></div><div class="habit-week">${days.map(ds=>{let dt=new Date(ds+'T12:00'),today=ds===iso(new Date()),hr=rows(habits,'habit',ds),cr=rows(checks,'checkin',ds);return `<div class="habit-day ${today?'habit-today':''}"><div class="habit-day-head"><b>${today?'Today':dt.toLocaleDateString([],{weekday:'short'})}</b><span>${dt.toLocaleDateString([],{month:'short',day:'numeric'})}</span></div><div class="habit-group"><div class="habit-group-title">Habits</div>${hr||'<div class="meta">No habits</div>'}</div><div class="habit-group checkin-group"><div class="habit-group-title">Did this happen?</div>${cr||'<div class="meta">No check-ins</div>'}</div></div>`}).join('')}</div></section><section class="card full"><div class="card-head"><div><h2>Tracker setup</h2><div class="meta">Habits are things to complete. Check-ins record whether something happened.</div></div></div>${data.habits.map(h=>`<div class="item"><div style="flex:1"><div style="display:flex;gap:6px;align-items:center"><b>${h.name}</b><span class="pill">${h.trackerType==='checkin'?'Check-in':'Habit'}</span></div><div class="meta">${!h.days||h.days.length===0?'Every day':h.days.map(d=>['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d]).join(', ')}</div></div><div class="item-actions"><span class="drag-handle habit-drag" data-id="${h.id}">☰</span><button class="mini edit-habit" data-id="${h.id}">Edit</button></div></div>`).join('')||'<p class="muted">Add the first tracker to start.</p>'}</section>`}
function habitSummaryView(){let range=habitSummaryRange||'weekly',periods=[];if(range==='weekly'){periods=Array.from({length:4},(_,i)=>{let d=new Date(weekStart()+'T12:00');d.setDate(d.getDate()-i*7);let st=iso(d),ds=habitDays(st);return {label:i===0?'This Week':i===1?'Last Week':new Date(st+'T12:00').toLocaleDateString([],{month:'short',day:'numeric'}),dates:ds,range:new Date(ds[0]+'T12:00').toLocaleDateString([],{month:'short',day:'numeric'})+' – '+new Date(ds[6]+'T12:00').toLocaleDateString([],{month:'short',day:'numeric'})}})}else if(range==='monthly'){periods=Array.from({length:4},(_,i)=>{let d=new Date();d.setDate(1);d.setMonth(d.getMonth()-i);let y=d.getFullYear(),m=d.getMonth(),last=new Date(y,m+1,0).getDate(),dates=Array.from({length:last},(_,j)=>iso(new Date(y,m,j+1,12)));return {label:i===0?'This Month':d.toLocaleDateString([],{month:'short'}),range:d.toLocaleDateString([],{month:'long',year:'numeric'}),dates}})}else{periods=Array.from({length:4},(_,i)=>{let y=new Date().getFullYear()-i,dates=[],end=i===0?new Date():new Date(y,11,31);for(let d=new Date(y,0,1,12);d<=end;d.setDate(d.getDate()+1))dates.push(iso(d));return {label:i===0?'This Year':String(y),range:String(y),dates}})}let stat=(filter,p)=>{let total=0,done=0;p.dates.forEach(ds=>data.habits.filter(filter).forEach(h=>{if(habitApplies(h,ds)){total++;if(data.habitLog[ds]?.[h.id])done++}}));return {total,done,pct:total?Math.round(done/total*100):0}},habitFilter=h=>(h.trackerType||'habit')==='habit',checkFilter=h=>h.trackerType==='checkin',overall=periods.map(p=>({...p,...stat(habitFilter,p)})),trackerStat=(h,p)=>{let total=0,done=0;p.dates.forEach(ds=>{if(habitApplies(h,ds)){total++;if(data.habitLog[ds]?.[h.id])done++}});return {total,done,pct:total?Math.round(done/total*100):null}},section=(title,type)=>{let list=data.habits.filter(h=>(h.trackerType||'habit')===type);return `<section class="card full"><div class="card-head"><div><h2>${title}</h2><div class="meta">${type==='habit'?'Completion rate':'How often each check-in occurred'}</div></div></div><div class="tracker-chart-head"><span>Tracker</span>${periods.map(p=>`<span>${p.label}</span>`).join('')}<span>Trend</span></div><div class="tracker-chart">${list.map(h=>{let ws=periods.map(p=>trackerStat(h,p)),vals=ws.map(w=>w.pct??0),pts=vals.map((v,i)=>`${i*33.33},${36-v*.32}`).join(' ');return `<div class="tracker-chart-row"><div class="tracker-label"><b>${h.name}</b></div>${ws.map(w=>`<div class="tracker-bar-cell"><div class="mini-bar"><i style="width:${w.pct??0}%"></i></div><strong>${w.pct===null?'—':w.pct+'%'}</strong></div>`).join('')}<svg class="spark" viewBox="0 0 100 40" preserveAspectRatio="none"><polyline points="${pts}"/></svg></div>`}).join('')||'<p class="muted">No trackers in this section yet.</p>'}</div></section>`};return `<section class="card full summary-overall"><div class="card-head"><div><h2>Overall Progress</h2><div class="meta">Habit completion by ${range==='weekly'?'week':range==='monthly'?'month':'year'}</div></div><button id="habitBack">Back to week</button></div><div class="summary-range"><button class="summary-range-btn ${range==='weekly'?'active':''}" data-range="weekly">Weekly</button><button class="summary-range-btn ${range==='monthly'?'active':''}" data-range="monthly">Monthly</button><button class="summary-range-btn ${range==='yearly'?'active':''}" data-range="yearly">Yearly</button></div><div class="week-chart">${overall.map(w=>`<div class="week-chart-card"><b>${w.label}</b><span class="meta">${w.range}</span><div class="ring" style="--p:${w.pct}"><strong>${w.pct}%</strong></div><span>${w.done} of ${w.total} completed</span></div>`).join('')}</div></section>${section('Habits','habit')}${section('Check-Ins','checkin')}`}
function editHabit(id){let h=data.habits.find(x=>x.id==id)||{id:Date.now(),name:'',days:[],trackerType:'habit'},fresh=!data.habits.includes(h);$('#modalTitle').textContent=fresh?'Add habit':'Edit habit';$('#modalBody').innerHTML=`<div class="form-grid"><label class="field">Tracker type<select id="heType"><option value="habit" ${(h.trackerType||'habit')==='habit'?'selected':''}>Habit — something to complete</option><option value="checkin" ${h.trackerType==='checkin'?'selected':''}>Check-In — did this happen?</option></select></label><label class="field">Name<input id="heName" value="${h.name||''}" placeholder="Read 20 minutes"></label><label class="field full">Schedule<select id="heSchedule"><option value="daily" ${!h.days||!h.days.length?'selected':''}>Every day</option><option value="custom" ${h.days?.length?'selected':''}>Specific days</option></select></label><div class="field full" id="habitDaysPick" style="${h.days?.length?'':'display:none'}"><div class="habit-day-picks">${[['Mon',1],['Tue',2],['Wed',3],['Thu',4],['Fri',5],['Sat',6],['Sun',0]].map(([n,d])=>`<label><input type="checkbox" value="${d}" ${h.days?.includes(d)?'checked':''}> ${n}</label>`).join('')}</div></div></div><div class="modal-actions">${fresh?'<span></span>':'<button type="button" class="danger" id="heDelete">Delete habit</button>'}<button type="button" class="primary" id="heSave">Save habit</button></div>`;$('#modal').showModal();$('#heSchedule').onchange=()=>$('#habitDaysPick').style.display=$('#heSchedule').value==='custom'?'':'none';$('#heSave').onclick=()=>{h.name=$('#heName').value.trim();if(!h.name)return;h.trackerType=$('#heType').value;h.days=$('#heSchedule').value==='daily'?[]:[...document.querySelectorAll('#habitDaysPick input:checked')].map(x=>+x.value);if($('#heSchedule').value==='custom'&&!h.days.length){alert('Choose at least one day.');return}if(fresh)data.habits.push(h);save();$('#modal').close();render()};$('#heDelete')&&($('#heDelete').onclick=()=>{if(confirm('Delete this habit? Past completion history will remain stored.')){data.habits=data.habits.filter(x=>x.id!=id);save();$('#modal').close();render()}})}
function habitSummary(){let rows=data.habits.map(h=>{let total=0,done=0;Object.keys(data.habitLog).sort().forEach(ds=>{if(habitApplies(h,ds)){total++;if(data.habitLog[ds]?.[h.id])done++}});return {h,total,done,pct:total?Math.round(done/total*100):0}});$('#modalTitle').textContent='Habit & check-in summary';$('#modalBody').innerHTML=`<p class="meta">Habits show completion. Check-ins show how often the event was recorded.</p>${rows.map(r=>`<div class="habit-summary-row"><div><b>${r.h.name}</b><div class="meta">${r.h.trackerType==='checkin'?`Happened ${r.done} of ${r.total} tracked days`:`${r.done} of ${r.total} completed`}</div></div><div style="text-align:right"><span class="pill">${r.h.trackerType==='checkin'?'Check-in':'Habit'}</span><strong style="display:block">${r.pct}%</strong></div></div>`).join('')||'<p class="muted">No tracking history yet.</p>'}`;$('#modal').showModal()}
function moreView(){
  return `
    <section class="card">
      <div class="card-head"><div><h2>Family</h2><div class="meta">Colors used across events and calendars</div></div></div>

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
        <div><h2>Payments</h2><div class="meta">Monthly reminders reset after each new month begins</div></div>
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
      <div class="card-head"><div><h2>Custody schedule</h2><div class="meta">Default weekly schedule</div></div><button id="openCalendarFromMore">Calendar</button></div>
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
function moveItem(arr,from,to){if(from<0||to<0||from===to||to>=arr.length)return;let[v]=arr.splice(from,1);arr.splice(to,0,v)}
function enableSort(root,arr,redraw){if(!root)return;let from=null;root.querySelectorAll('.sortable-row').forEach(row=>{let h=row.querySelector('.drag-handle')||row;h.onpointerdown=e=>{from=+row.dataset.i;h.setPointerCapture?.(e.pointerId);row.classList.add('dragging');e.preventDefault()};h.onpointermove=e=>{if(from===null)return;let target=document.elementFromPoint(e.clientX,e.clientY)?.closest('.sortable-row');if(!target||!root.contains(target))return;let to=+target.dataset.i;if(to!==from){moveItem(arr,from,to);from=to;redraw()}};h.onpointerup=()=>{from=null;row.classList.remove('dragging')}})}
function bind(){document.querySelectorAll('.home-habit-toggle').forEach(x=>x.onchange=()=>{data.habitLog[x.dataset.date]=data.habitLog[x.dataset.date]||{};data.habitLog[x.dataset.date][x.dataset.id]=x.checked;save();render()});$('#habitPrev')&&($('#habitPrev').onclick=()=>{let d=new Date(habitCursor+'T12:00');d.setDate(d.getDate()-7);habitCursor=iso(d);render()});$('#habitNext')&&($('#habitNext').onclick=()=>{let d=new Date(habitCursor+'T12:00');d.setDate(d.getDate()+7);habitCursor=iso(d);render()});$('#habitThis')&&($('#habitThis').onclick=()=>{habitCursor=weekStart();render()});$('#habitSummaryPage')&&($('#habitSummaryPage').onclick=()=>{habitMode='summary';render()});$('#habitBack')&&($('#habitBack').onclick=()=>{habitMode='week';render()});document.querySelectorAll('.summary-range-btn').forEach(x=>x.onclick=()=>{habitSummaryRange=x.dataset.range;render()});document.querySelectorAll('.habit-drag').forEach(x=>{let active=false;x.onpointerdown=e=>{active=true;x.setPointerCapture?.(e.pointerId);x.closest('.item').classList.add('dragging');e.preventDefault()};x.onpointermove=e=>{if(!active)return;let target=document.elementFromPoint(e.clientX,e.clientY)?.closest('.item')?.querySelector('.habit-drag');if(!target||target===x)return;let from=data.habits.findIndex(h=>h.id==x.dataset.id),to=data.habits.findIndex(h=>h.id==target.dataset.id);if(from<0||to<0)return;moveItem(data.habits,from,to);save();render()};x.onpointerup=()=>{active=false;x.closest('.item')?.classList.remove('dragging')}});$('#addHabit')&&($('#addHabit').onclick=()=>editHabit());$('#habitSummary')&&($('#habitSummary').onclick=habitSummary);document.querySelectorAll('.edit-habit').forEach(x=>x.onclick=()=>editHabit(+x.dataset.id));document.querySelectorAll('.habit-toggle').forEach(x=>x.onchange=()=>{data.habitLog[x.dataset.date]=data.habitLog[x.dataset.date]||{};data.habitLog[x.dataset.date][x.dataset.id]=x.checked;save();render()});document.querySelectorAll('.week-day').forEach(x=>x.onclick=()=>openDayAgenda(x.dataset.date));document.querySelectorAll('.cal-more').forEach(x=>x.onclick=e=>{e.stopPropagation();openDayAgenda(x.dataset.date)});$('#calendarToday')&&($('#calendarToday').onclick=()=>{calCursor=new Date();render()});$('#openCalendarFromMore')&&($('#openCalendarFromMore').onclick=()=>{view='calendar';calendarMode='month';render()});document.querySelectorAll('.task-filter').forEach(x=>x.onclick=()=>{taskFilter=x.dataset.filter;render()});$('#calendarMonth')&&($('#calendarMonth').onclick=()=>{calendarMode='month';render()});$('#calendarList')&&($('#calendarList').onclick=()=>{calendarMode='list';render()});document.querySelectorAll('.cal-event').forEach(x=>{x.onclick=()=>openCalendarEvent(Number(x.dataset.id),x.dataset.date)});document.querySelectorAll('.meal-shop').forEach(x=>{x.onclick=()=>mealToShopping(Number(x.dataset.id))});document.querySelectorAll('.edit-meal').forEach(x=>{x.onclick=()=>editMeal(Number(x.dataset.id))});document.querySelectorAll('.delete-meal').forEach(x=>{x.onclick=()=>{if(confirm('Delete this meal?')){data.meals=data.meals.filter(m=>m.id!=x.dataset.id);save();render()}}});document.querySelectorAll('.edit-task').forEach(x => {
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
});document.querySelectorAll('.custody-day').forEach(x=>x.onclick=()=>editCustodyDay(x.dataset.date));$('#prevMonth')&&($('#prevMonth').onclick=()=>{calCursor.setMonth(calCursor.getMonth()-1);render()});$('#nextMonth')&&($('#nextMonth').onclick=()=>{calCursor.setMonth(calCursor.getMonth()+1);render()});document.querySelectorAll('.edit-event').forEach(x=>x.onclick=()=>editEvent(+x.dataset.id,x.dataset.date));document.querySelectorAll('.delete-event').forEach(x=>x.onclick=()=>{let e=data.events.find(e=>e.id==x.dataset.id);deleteEventChoice(+x.dataset.id,x.dataset.date||e?.date)});document.querySelectorAll('.edit-staple').forEach(x=>x.onclick=()=>{let e=data.staples.find(s=>s.id==x.dataset.id);if(!e)return;$('#modalTitle').textContent='Edit staple';$('#modalBody').innerHTML=`<div class="form-grid"><label class="field full">Item<input id="seName" value="${e.name||''}"></label><label class="field">Quantity<input id="seQty" type="number" min="1" value="${e.qty||1}"></label><label class="field">Status<select id="seNeed"><option value="true" ${e.need?'selected':''}>Need</option><option value="false" ${!e.need?'selected':''}>Have it</option></select></label></div><div class="modal-actions"><button type="button" class="danger" id="seDelete">Delete staple</button><button type="button" class="primary" id="seSave">Save changes</button></div>`;$('#modal').showModal();$('#seSave').onclick=()=>{e.name=$('#seName').value.trim();e.qty=+$('#seQty').value||1;e.need=$('#seNeed').value==='true';if(!e.name)return;save();$('#modal').close();render()};$('#seDelete').onclick=()=>{if(confirm('Delete this staple?')){data.staples=data.staples.filter(s=>s.id!=e.id);save();$('#modal').close();render()}}});document.querySelectorAll('.delete-staple').forEach(x=>x.onclick=()=>{if(confirm('Delete this staple?')){data.staples=data.staples.filter(e=>e.id!=x.dataset.id);save();render()}});document.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>{view=b.dataset.go;render()});document.querySelectorAll('.task-check').forEach(x=>x.onchange=()=>{let t=data.tasks.find(t=>t.id==x.dataset.id);t.done=x.checked;if(t.taskMode==='cycle'){let ds=iso(new Date());if(x.checked){t.lastCompleted=ds;data.choreLog[ds]=data.choreLog[ds]||{};data.choreLog[ds][t.id]=true}else{t.lastCompleted='';if(data.choreLog[ds])delete data.choreLog[ds][t.id]}}save();render()});document.querySelectorAll('.staple-check').forEach(x=>x.onchange=()=>{data.staples.find(t=>t.id==x.dataset.id).need=x.checked;save();render()});document.querySelectorAll('.qty').forEach(x=>x.onchange=()=>{data.staples.find(t=>t.id==x.dataset.id).qty=+x.value||1;save()});document.querySelectorAll('.meal-day-shop').forEach(x=>x.onclick=()=>{let m=data.meals.find(m=>m.name===x.dataset.name);if(m)mealToShopping(m.id)});document.querySelectorAll('.meal-select').forEach(x=>x.onchange=()=>{data.mealPlan[x.dataset.date]=x.value;save();render()});document.querySelectorAll('.color').forEach(x=>x.onchange=()=>{data.settings[x.dataset.person.toLowerCase()+'Color']=x.value;save();render()});$('#addEvent')&&($('#addEvent').onclick=eventForm);$('#custodyOverride')&&($('#custodyOverride').onclick=eventForm);$('#addOneTime')&&($('#addOneTime').onclick=()=>simplePrompt('Add one-time item','Item name',v=>{data.staples.push({id:Date.now(),name:v,qty:1,need:true,permanent:false});save();render()}));$('#addStaple')&&($('#addStaple').onclick=()=>simplePrompt('Add staple','Staple name',v=>{data.staples.push({id:Date.now(),name:v,qty:1,need:true,permanent:true});save();render()}));$('#addMeal')&&($('#addMeal').onclick=()=>{let m={id:Date.now(),name:'New meal',ingredients:'',recipe:''};data.meals.push(m);editMeal(m.id)});document.querySelectorAll('.add-history').forEach(x=>x.onclick=()=>{let name=(data.settings.oneTimeHistory||[])[+x.dataset.i];if(!name)return;let existing=data.staples.find(s=>s.name.trim().toLowerCase()===name.toLowerCase());if(existing){existing.need=true}else data.staples.push({id:Date.now(),name,qty:1,need:true,permanent:false});save();render()});document.querySelectorAll('.delete-history').forEach(x=>x.onclick=()=>{data.settings.oneTimeHistory.splice(+x.dataset.i,1);save();render()});$('#orderComplete')&&($('#orderComplete').onclick=()=>{let count=data.staples.filter(x=>x.need).length;if(!confirm('Finish this shopping order?\n\nStaples will stay on the list but be marked as not needed. One-time items will be removed.'))return;data.settings=data.settings||{};data.settings.oneTimeHistory=data.settings.oneTimeHistory||[];data.staples.filter(x=>x.permanent===false).forEach(x=>{if(!data.settings.oneTimeHistory.some(n=>n.toLowerCase()===x.name.trim().toLowerCase()))data.settings.oneTimeHistory.push(x.name.trim())});data.settings.oneTimeHistory.sort((a,b)=>a.localeCompare(b));data.staples=data.staples.filter(x=>x.permanent!==false);data.staples.forEach(x=>{x.need=false;x.qty=1});data.settings=data.settings||{};data.settings.lastShoppingOrder=iso(new Date());save();render()});$('#copyList')&&($('#copyList').onclick=async()=>{let s=data.staples.filter(x=>x.need).map(x=>`${x.name}${x.qty>1?` x${x.qty}`:''}`).join('\n');await navigator.clipboard.writeText(s);alert('Shopping list copied.');});$('#lock')&&($('#lock').onclick=()=>{localStorage.removeItem('familyHubUnlocked');localStorage.removeItem('familyHubPin');sessionStorage.removeItem('familyHubPin');location.reload()})}
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
