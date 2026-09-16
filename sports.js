// Sports Hub — isolated module v155a
(function(){
  function ensure(){data.events=data.events||[];data.sportsTeams=data.sportsTeams||[];importRichardFall26()}
  function minus45(t){let [h,m]=t.split(':').map(Number),n=h*60+m-45;n=(n+1440)%1440;return String(Math.floor(n/60)).padStart(2,'0')+':'+String(n%60).padStart(2,'0')}
  function importRichardFall26(){
    if(data.sportsImports?.richardFall26)return;
    data.sportsImports=data.sportsImports||{};
    const games=[
      ['2026-09-19','17:00','SSLL AA Dodgers','Away'],['2026-09-26','17:00','SSLL AA Athletics','Home'],
      ['2026-09-28','17:00','SSLL AA Diamondbacks','Home'],['2026-09-30','18:45','SSLL AA Tigers','Home'],
      ['2026-10-03','17:00','SSLL AA Giants','Away'],['2026-10-10','17:00','SSLL AA Braves','Home'],
      ['2026-10-14','18:45','SSLL AA Angels','Away'],['2026-10-21','18:45','SSLL AA Astros','Away'],
      ['2026-10-24','17:00','SSLL AA Cardinals','Home'],['2026-10-28','18:45','SSLL AA Mets','Home'],
      ['2026-11-04','18:45','SSLL AA Phillies','Away'],['2026-11-07','17:00','SSLL AA Astros','Away']
    ];
    games.forEach((g,i)=>{if(!data.events.some(e=>e.sportsImportKey==='richard-fall26-'+g[0]))data.events.push({id:1760000000000+i,title:'Richard Baseball Game',person:'Richard',type:'Game',date:g[0],time:g[1],end:'',location:'',leave:'',arrival:minus45(g[1]),bring:'Uniform, gear, water',notes:'',sport:'Baseball',team:'SSLL AA Mariners',season:'Fall 2026',opponent:g[2],homeAway:g[3],sportEvent:true,repeat:'None',repeatEnd:'',excludedDates:[],sportsImportKey:'richard-fall26-'+g[0]})});
    data.sportsImports.richardFall26=true;
    if(typeof save==='function')save();
  }
  function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
  function fmt(d){return new Date(d+'T12:00').toLocaleDateString([],{weekday:'short',month:'short',day:'numeric'})}
  function defaultTeam(person){return person==='Richard'?'SSLL AA Mariners':person==='Timothy'?'TBall Giants':''}
  function sports(){return data.events.filter(e=>['Practice','Game'].includes(e.type)||e.sportEvent)}
  function expandedSports(){
    let out=[];
    sports().forEach(e=>{
      if(e.repeat!=='Weekly'||!e.repeatEnd){out.push(e);return}
      let d=new Date(e.date+'T12:00'),end=new Date(e.repeatEnd+'T12:00'),excluded=new Set(e.excludedDates||[]);
      while(d<=end){let ds=iso(d);if(!excluded.has(ds))out.push({...e,date:ds,recurringInstance:true,sourceDate:e.date});d.setDate(d.getDate()+7)}
    });
    return out;
  }
  function record(person){
    let g=expandedSports().filter(e=>e.type==='Game'&&(e.person===person||e.person==='Both')&&e.result);
    return {w:g.filter(e=>e.result==='Win').length,l:g.filter(e=>e.result==='Loss').length,t:g.filter(e=>e.result==='Tie').length};
  }
  function persist(){if(typeof save==='function')save();else localStorage.setItem('familyHubData',JSON.stringify(data))}
  function pageMarkup(){
    ensure();let ev=expandedSports().sort((a,b)=>(a.date+(a.time||'')).localeCompare(b.date+(b.time||''))),today=vegasToday(),up=ev.filter(e=>e.date>=today),nextR=up.find(e=>e.person==='Richard'||e.person==='Both'),nextT=up.find(e=>e.person==='Timothy'||e.person==='Both');
    let kid=(name,next)=>{let rec=record(name);return '<section class="sport-kid" style="flex:1 1 0;min-width:0;background:var(--card);border:1px solid var(--line);border-radius:22px;padding:15px;box-shadow:var(--shadow)"><div class="card-head"><div><div class="eyebrow">'+name.toUpperCase()+'</div><h2>'+(name==='Richard'?'SSLL AA Mariners':name==='Timothy'?'TBall Giants':name+' Sports')+'</h2></div><div class="sport-record"><span>Record</span><strong>'+rec.w+'–'+rec.l+(rec.t?'–'+rec.t:'')+'</strong></div></div>'+(next?'<div class="sport-next"><span>Next up</span><strong>'+esc(next.title)+'</strong><div class="meta">'+fmt(next.date)+' · '+(next.time||'All day')+(next.arrival?' · Arrive '+next.arrival:(next.leave?' · Leave '+next.leave:''))+'</div>'+(next.location?'<div class="meta">'+esc(next.location)+'</div>':'')+(next.bring?'<div class="sport-bring">Bring: '+esc(next.bring)+'</div>':'')+'</div>':'<p class="muted">No upcoming sports scheduled.</p>')+'</section>'};
    return '<div class="sports-page-full"><section class="sports-page-head"><div><div class="eyebrow">FAMILY SPORTS</div><h1>Sports Hub</h1><p class="meta">Practices, games, schedules and reminders for Richard & Timothy.</p></div><button class="primary" data-sport-add>＋ Sports event</button></section><div class="sports-stats"><div><span>Upcoming</span><strong>'+up.length+'</strong></div><div><span>Practices</span><strong>'+up.filter(e=>e.type==='Practice').length+'</strong></div><div><span>Games</span><strong>'+up.filter(e=>e.type==='Game').length+'</strong></div></div><div class="sports-kids" style="display:flex;flex-direction:row;align-items:stretch;gap:10px;width:100%">'+kid('Richard',nextR)+kid('Timothy',nextT)+'</div><section class="card full sports-schedule-card"><div class="card-head"><div><h2>Upcoming Schedule</h2><div class="meta">Events here also appear on the Family Calendar.</div></div><div class="sports-filters"><button class="active" data-sport-filter="All">All</button><button data-sport-filter="Richard">Richard</button><button data-sport-filter="Timothy">Timothy</button></div></div><div class="sports-list">'+(up.length?up.map(e=>row(e)).join(''):'<p class="muted">No upcoming practices or games.</p>')+'</div></section></div>';
  }
  function open(){
    $('#modal').close();let root=document.querySelector('#dashboard');if(!root)return;root.innerHTML=pageMarkup();document.querySelectorAll('nav button').forEach(x=>x.classList.remove('active'));document.querySelector('nav [data-action="more"]')?.classList.add('active');window.scrollTo({top:0,behavior:'smooth'});
  }
  function row(e){let past=e.type==='Game'&&e.date<vegasToday(),result=e.result?'<span class="sport-result '+e.result.toLowerCase()+'">'+e.result+(e.teamScore!==undefined&&e.teamScore!==''?' '+e.teamScore+'–'+e.opponentScore:'')+'</span>':'';return '<div class="sport-row" data-sport-person="'+esc(e.person)+'"><span class="sport-dot" style="background:'+personColor(e.person)+'"></span><div class="sport-info"><div class="sport-title"><b>'+esc(e.title)+'</b><span class="pill">'+esc(e.type)+'</span>'+result+'</div><div class="meta">'+fmt(e.date)+' · '+(e.time||'All day')+(e.end?'–'+e.end:'')+(e.arrival?' · Arrive '+e.arrival:(e.leave?' · Leave '+e.leave:''))+'</div><div class="meta">'+esc(e.person)+(e.team?' · '+esc(e.team):'')+(e.opponent?' · '+(e.homeAway==='Away'?'@ ':'vs ')+esc(e.opponent):'')+(e.location?' · '+esc(e.location):'')+'</div></div><div class="item-actions">'+(past&&!e.result?'<button class="primary mini" data-sport-score="'+e.id+'">Add score</button>':'')+'<button class="mini" data-sport-edit="'+e.id+'">Edit</button></div></div>'}
  function form(id){
    ensure();let e=data.events.find(x=>x.id==id),fresh=!e;if(!e)e={id:Date.now(),title:'',person:'Richard',type:'Practice',date:vegasToday(),time:'17:30',end:'',location:'',leave:'',bring:'',notes:'',sport:'Baseball',team:'SSLL AA Mariners',season:'',opponent:'',homeAway:'Home',sportEvent:true,repeat:'None',excludedDates:[]};
    $('#modalTitle').textContent=fresh?'Add sports event':'Edit sports event';
    $('#modalBody').innerHTML='<div class="form-grid"><label class="field">Who<select id="spPerson"><option '+(e.person==='Richard'?'selected':'')+'>Richard</option><option '+(e.person==='Timothy'?'selected':'')+'>Timothy</option><option '+(e.person==='Both'?'selected':'')+'>Both</option></select></label><label class="field">Event type<select id="spType"><option '+(e.type==='Practice'?'selected':'')+'>Practice</option><option '+(e.type==='Game'?'selected':'')+'>Game</option></select></label><label class="field">Sport<input id="spSport" value="'+esc(e.sport||'')+'" placeholder="Baseball, soccer..."></label><label class="field">Team<input id="spTeam" value="'+esc(e.team||'')+'" placeholder="Mariners"></label><label class="field full">Event name<input id="spTitle" value="'+esc(e.title||'')+'" placeholder="Baseball Practice"></label><label class="field">Date<input id="spDate" type="date" value="'+e.date+'"></label><label class="field">Start<input id="spTime" type="time" value="'+(e.time||'')+'"></label><label class="field">End<input id="spEnd" type="time" value="'+(e.end||'')+'"></label><label class="field">Arrive by<input id="spArrival" type="time" value="'+(e.arrival||'')+'"></label><label class="field">Leave by<input id="spLeave" type="time" value="'+(e.leave||'')+'"></label><label class="field">Opponent<input id="spOpponent" value="'+esc(e.opponent||'')+'" placeholder="Dodgers"></label><label class="field">Home / Away<select id="spHomeAway"><option '+(e.homeAway==='Home'?'selected':'')+'>Home</option><option '+(e.homeAway==='Away'?'selected':'')+'>Away</option></select></label><label class="field full">Location<input id="spLocation" value="'+esc(e.location||'')+'" placeholder="Field / complex"></label><label class="field full">What to bring<input id="spBring" value="'+esc(e.bring||'')+'" placeholder="Glove, cleats, water..."></label><label class="field">Season<input id="spSeason" value="'+esc(e.season||'')+'" placeholder="Fall 2026"></label><label class="field">Repeat<select id="spRepeat"><option value="None">Does not repeat</option><option '+(e.repeat==='Weekly'?'selected':'')+'>Weekly</option></select></label><label class="field" id="spRepeatEndField" '+(e.repeat==='Weekly'?'':'hidden')+'>Repeat through<input id="spRepeatEnd" type="date" min="'+e.date+'" value="'+(e.repeatEnd||'')+'"></label><label class="field full">Notes<textarea id="spNotes">'+esc(e.notes||'')+'</textarea></label></div><div class="modal-actions">'+(fresh?'<button class="mini" data-sports-cancel>Cancel</button>':'<button class="danger" data-sport-delete="'+e.id+'">Delete</button>')+'<button class="primary" id="saveSport">Save</button></div>';
    $('#modal').showModal();
    const personSelect=$('#spPerson'),teamInput=$('#spTeam'),repeatSelect=$('#spRepeat'),repeatEndField=$('#spRepeatEndField'),repeatEndInput=$('#spRepeatEnd');
    if(fresh&&!teamInput.value)teamInput.value=defaultTeam(personSelect.value);
    personSelect.onchange=()=>{let prior=teamInput.dataset.autoTeam||'',next=defaultTeam(personSelect.value);if(!teamInput.value||teamInput.value===prior||teamInput.value==='SSLL AA Mariners')teamInput.value=next;teamInput.dataset.autoTeam=next};
    teamInput.dataset.autoTeam=defaultTeam(personSelect.value); repeatSelect.onchange=()=>{repeatEndField.hidden=repeatSelect.value!=='Weekly';if(repeatSelect.value==='Weekly'&&!repeatEndInput.value)repeatEndInput.value=$('#spDate').value};
    $('#saveSport').onclick=()=>{e.person=$('#spPerson').value;e.type=$('#spType').value;e.sport=$('#spSport').value.trim();e.team=$('#spTeam').value.trim();e.title=$('#spTitle').value.trim()||[e.sport,e.type].filter(Boolean).join(' ');e.date=$('#spDate').value;e.time=$('#spTime').value;e.end=$('#spEnd').value;e.arrival=$('#spArrival').value;e.leave=$('#spLeave').value;e.opponent=$('#spOpponent').value.trim();e.homeAway=$('#spHomeAway').value;e.location=$('#spLocation').value.trim();e.bring=$('#spBring').value.trim();e.season=$('#spSeason').value.trim();e.repeat=$('#spRepeat').value;e.repeatEnd=e.repeat==='Weekly'?$('#spRepeatEnd').value:'';e.notes=$('#spNotes').value.trim();e.sportEvent=true;e.excludedDates=e.excludedDates||[];if(!e.title||!e.date)return alert('Enter an event name and date.');if(fresh)data.events.push(e);persist();open()}
  }
  function scoreForm(id){
    let e=data.events.find(x=>x.id==id);if(!e)return;
    $('#modalTitle').textContent='Game result';
    $('#modalBody').innerHTML='<p class="meta">'+esc(e.team||e.person)+' '+(e.opponent?'vs '+esc(e.opponent):'')+' · '+fmt(e.date)+'</p><div class="form-grid"><label class="field">Our score<input id="sportOurScore" type="number" min="0" value="'+(e.teamScore??'')+'"></label><label class="field">Opponent score<input id="sportOppScore" type="number" min="0" value="'+(e.opponentScore??'')+'"></label></div><div class="modal-actions"><button class="mini" data-sports-cancel>Cancel</button><button class="primary" id="saveSportScore">Save result</button></div>';
    $('#modal').showModal();
    $('#saveSportScore').onclick=()=>{let a=+$('#sportOurScore').value,b=+$('#sportOppScore').value;if($('#sportOurScore').value===''||$('#sportOppScore').value==='')return alert('Enter both scores.');e.teamScore=a;e.opponentScore=b;e.result=a>b?'Win':a<b?'Loss':'Tie';persist();open()}
  }
  function inject(){let menu=document.querySelector('.more-menu');if(!menu||menu.querySelector('[data-sports-open]'))return;let groups=[...menu.querySelectorAll('.more-group')],plan=groups.find(g=>g.querySelector('.eyebrow')?.textContent.trim()==='PLAN'),grid=plan?.querySelector('.more-grid')||menu.querySelector('.more-grid');if(!grid)return;let b=document.createElement('button');b.type='button';b.className='more-destination';b.dataset.sportsOpen='1';b.innerHTML='<span class="more-icon">⚾</span><span><b>Sports</b><small>Practices, games & team schedules</small></span><i>›</i>';grid.appendChild(b)}
  // More menu is rendered dynamically by the stable core. Observe the modal so Sports
  // appears even when the core button handler replaces the menu after our click handler runs.
  const sportsMenuObserver=new MutationObserver(()=>{try{inject()}catch(err){console.error('Sports menu injection',err)}});
  const sportsModalBody=document.getElementById('modalBody');if(sportsModalBody)sportsMenuObserver.observe(sportsModalBody,{childList:true,subtree:true});
  document.addEventListener('click',e=>{
    if(e.target.closest?.('[data-action="more"]'))setTimeout(inject,0);
    if(e.target.closest?.('[data-sports-open]'))open();
    if(e.target.closest?.('[data-sports-back]')){render();} if(e.target.closest?.('[data-sports-cancel]'))open();
    if(e.target.closest?.('[data-sport-add]'))form();
    let score=e.target.closest?.('[data-sport-score]');if(score)scoreForm(+score.dataset.sportScore);
    let ed=e.target.closest?.('[data-sport-edit]');if(ed)form(+ed.dataset.sportEdit);
    let del=e.target.closest?.('[data-sport-delete]');if(del&&confirm('Delete this sports event?')){data.events=data.events.filter(x=>x.id!=+del.dataset.sportDelete);persist();open()}
    let f=e.target.closest?.('[data-sport-filter]');if(f){let selected=f.dataset.sportFilter;document.querySelectorAll('.sports-schedule-card [data-sport-filter]').forEach(x=>x.classList.toggle('active',x.dataset.sportFilter===selected));document.querySelectorAll('.sports-schedule-card .sport-row').forEach(x=>{let who=x.getAttribute('data-sport-person');x.style.display=(selected==='All'||who===selected||who==='Both')?'':'none'})}
  });
})();