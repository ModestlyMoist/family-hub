// Calendar 2.0 — smarter Quick Add + weekly family summary v245a
(function(){
  const esc=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const cap=s=>s?String(s).charAt(0).toUpperCase()+String(s).slice(1):'';
  function parseDate(raw){
    let s=raw.toLowerCase(),base=new Date(vegasToday()+'T12:00'),m=s.match(/\b(\d{1,2})[\/-](\d{1,2})(?:[\/-](\d{2,4}))?\b/);
    if(m){let y=m[3]?+m[3]:base.getFullYear();if(y<100)y+=2000;return iso(new Date(y,+m[1]-1,+m[2]))}
    if(/\btoday\b/.test(s))return vegasToday();
    if(/\btomorrow\b/.test(s)){base.setDate(base.getDate()+1);return iso(base)}
    let days=['sunday','monday','tuesday','wednesday','thursday','friday','saturday'],i=days.findIndex(x=>s.includes(x));
    if(i>=0){let n=(i-base.getDay()+7)%7;if(!n)n=7;base.setDate(base.getDate()+n);return iso(base)}
    return vegasToday();
  }
  function parseTime(raw){
    let m=raw.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i);
    if(m){let h=+m[1],min=+(m[2]||0),ap=m[3].toLowerCase();if(ap==='pm'&&h<12)h+=12;if(ap==='am'&&h===12)h=0;return String(h).padStart(2,'0')+':'+String(min).padStart(2,'0')}
    m=raw.match(/\b(?:at\s+)?([01]?\d|2[0-3]):([0-5]\d)\b/i);return m?String(+m[1]).padStart(2,'0')+':'+m[2]:'';
  }
  function parse(raw){
    let low=raw.toLowerCase(),person=/\bolivia\b/.test(low)?'Olivia':/\brichard\b/.test(low)?'Richard':/\btim(?:othy)?\b/.test(low)?'Timothy':/\bboth\b|\bkids\b/.test(low)?'Both':'Both';
    let kind=/\b(game|practice)\b/.test(low)?'sports':/\b(task|todo|to do|remind me|clean|call|email|pay|pick up|drop off)\b/.test(low)?'task':'event';
    let type=/\bgame\b/.test(low)?'Game':/\bpractice\b/.test(low)?'Practice':/\b(dentist|doctor|appointment|ortho|therapy)\b/.test(low)?'Appointment':/\b(homework|school)\b/.test(low)?'School':'Other';
    let date=parseDate(raw),time=parseTime(raw),location='';
    let lm=raw.match(/\b(?:at|@)\s+([^,]+?)(?=\s+(?:at\s+)?\d{1,2}(?::\d{2})?\s*(?:am|pm)?\b|\s+(?:today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b|$)/i);
    if(lm&&!/^\d/.test(lm[1].trim()))location=lm[1].trim();
    let clean=raw.replace(/\b(today|tomorrow|sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b/ig,'').replace(/\b\d{1,2}[\/-]\d{1,2}(?:[\/-]\d{2,4})?\b/g,'').replace(/\b(?:at\s*)?\d{1,2}(?::\d{2})?\s*(?:am|pm)\b/ig,'').replace(/\s+/g,' ').replace(/\s+[,.-]$/,'').trim();
    let title=clean||raw;
    if(kind==='sports')title=(person==='Both'?'Kids':person)+' '+(type==='Game'?'Baseball Game':type);
    return {raw,person,kind,type,date,time,location,title};
  }
  function smartAdd245(){
    $('#modalTitle').textContent='Smart Add';
    $('#modalBody').innerHTML='<div class="smart245"><p class="meta">Type it the way you would say it. I’ll build a preview before anything is saved.</p><label class="field full">What are you adding?<textarea id="smart245Text" rows="3" autofocus placeholder="Timothy baseball game Saturday at 9am"></textarea></label><div class="smart245-examples"><button type="button">Olivia dentist tomorrow at 3pm</button><button type="button">Richard practice Tuesday at 17:30</button><button type="button">Pay water bill Friday</button></div><div id="smart245Preview"></div><div class="modal-actions"><button type="button" id="smart245Cancel">Cancel</button><button type="button" class="primary" id="smart245Continue">Preview</button></div></div>';
    $('#modal').showModal();
    let input=$('#smart245Text'),preview=$('#smart245Preview'),current=null,btn=$('#smart245Continue');
    document.querySelectorAll('.smart245-examples button').forEach(b=>b.onclick=()=>{input.value=b.textContent;show()});
    function show(){let raw=input.value.trim();if(!raw)return;current=parse(raw);preview.innerHTML=`<div class="smart245-card"><span class="smart245-kind">${cap(current.kind)}</span><b>${esc(current.title)}</b><div><span>${esc(current.person)}</span><span>${fmtDate(current.date)}</span><span>${current.time||'All day'}</span>${current.location?`<span>${esc(current.location)}</span>`:''}</div><small>You can edit the full details after adding if needed.</small></div>`;btn.textContent='Add it';}
    btn.onclick=()=>{if(!current){show();return}let p=current;if(p.kind==='task'){data.tasks.push({id:Date.now(),name:p.title.replace(/^(task|todo|to do|remind me to)\s*/i,''),category:/\b(work|email)\b/i.test(p.raw)?'Work':'Household',assigned:p.person==='Both'?'Everyone':p.person,due:p.date,repeat:'None',done:false,notes:p.raw,taskMode:'dated'});save();$('#modal').close();view='tasks';render();return}
      let team=p.person==='Richard'?'SSLL AA Mariners':p.person==='Timothy'?'SSLL Teeball Majors Giants':'';
      data.events.push({id:Date.now(),title:p.title,person:p.person,type:p.type,date:p.date,time:p.time,end:'',location:p.location,leave:'',arrival:p.kind==='sports'&&p.type==='Game'&&p.time&&typeof window.minus45==='function'?window.minus45(p.time):'',bring:p.kind==='sports'?'Uniform, gear, water':'',notes:p.raw,sport:p.kind==='sports'?'Baseball':'',team,season:'',opponent:'',homeAway:'Home',sportEvent:p.kind==='sports',repeat:'None',repeatEnd:'',excludedDates:[]});save();$('#modal').close();view='calendar';render();
    };
    $('#smart245Cancel').onclick=()=>$('#modal').close();
  }
  window.smartAdd=smartAdd245;try{smartAdd=smartAdd245}catch(e){}

  function weeklyStats(){
    let today=vegasToday(),all=[],days=[];
    for(let i=0;i<7;i++){let d=new Date(today+'T12:00');d.setDate(d.getDate()+i);let ds=iso(d),es=eventsForDate(ds).slice();days.push({ds,es});all.push(...es.map(e=>({e,ds})))}
    let sports=all.filter(x=>x.e.sportEvent||['Game','Practice'].includes(x.e.type)).length,appointments=all.filter(x=>x.e.type==='Appointment').length,school=all.filter(x=>x.e.type==='School'||/^(NO SCHOOL|HALF DAY)/.test(x.e.title||'')).length,custody=all.filter(x=>x.e.type==='Custody').length;
    let busiest=days.slice().sort((a,b)=>b.es.filter(e=>e.type!=='School').length-a.es.filter(e=>e.type!=='School').length)[0];
    return {total:all.length,sports,appointments,school,custody,busiest};
  }
  function installSummary(){
    let card=document.querySelector('.calendar-v2');if(!card||card.querySelector('.calendar-week-summary'))return;
    let anchor=card.querySelector('.calendar-filter-handoff-row')||card.querySelector('.calendar-person-filters')||card.querySelector('.card-head'),s=weeklyStats(),d=s.busiest?new Date(s.busiest.ds+'T12:00'):null,busyCount=s.busiest?s.busiest.es.filter(e=>e.type!=='School').length:0;
    let box=document.createElement('div');box.className='calendar-week-summary';box.innerHTML=`<span class="week-summary-label">Next 7 days</span><b>${s.total} event${s.total===1?'':'s'}</b><span>${s.sports} sports</span><span>${s.appointments} appointment${s.appointments===1?'':'s'}</span><span>${s.school} school</span><span>${s.custody} handoff${s.custody===1?'':'s'}</span>${d&&busyCount?`<span class="week-summary-busy">Busiest: ${d.toLocaleDateString([],{weekday:'short'})} · ${busyCount}</span>`:''}`;
    anchor.insertAdjacentElement('afterend',box);
  }
  let old=window.render;if(typeof old==='function')window.render=function(){let r=old.apply(this,arguments);setTimeout(installSummary,0);return r};
  setTimeout(installSummary,0);
})();