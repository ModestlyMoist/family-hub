// Meds Tracker — isolated module v154a
(function(){
  function ensure(){data.medications=data.medications||[]}
  function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
  function fmt(ds){return ds?new Date(ds+'T12:00').toLocaleDateString([],{month:'short',day:'numeric',year:'numeric'}):'—'}
  function persist(){if(typeof save==='function')save();else localStorage.setItem('familyHubData',JSON.stringify(data))}
  function list(){
    ensure();let meds=[...data.medications].sort((a,b)=>(a.name||'').localeCompare(b.name||''));
    return '<div class="meds-page"><div class="meds-top"><button class="mini" data-meds-back>‹ Back</button><button class="primary" data-med-add>＋ Medication</button></div>'+
    '<div class="meds-summary"><div><span>Active meds</span><strong>'+meds.filter(m=>m.active!==false).length+'</strong></div><div><span>Total tracked</span><strong>'+meds.length+'</strong></div><div><span>Recent changes</span><strong>'+meds.filter(m=>m.lastChange&&((new Date()-new Date(m.lastChange+'T12:00'))/86400000)<=30).length+'</strong><small>last 30 days</small></div></div>'+
    '<div class="meds-list">'+(meds.length?meds.map(m=>'<div class="med-row '+(m.active===false?'inactive':'')+'"><div class="med-row-head"><div><b>'+esc(m.name)+'</b><div class="meta">'+esc(m.dosage||'No dosage')+' · '+esc(m.frequency||'No schedule')+'</div></div><span class="pill">'+(m.active===false?'Inactive':'Active')+'</span></div><div class="med-details"><div><span>Started</span><strong>'+fmt(m.startDate)+'</strong></div><div><span>Dosage changed</span><strong>'+fmt(m.lastChange)+'</strong></div></div><div class="item-actions"><button class="mini" data-med-dose="'+m.id+'">Change dosage</button><button class="mini" data-med-edit="'+m.id+'">Edit</button></div></div>').join(''):'<p class="muted">No medications added yet.</p>')+'</div></div>';
  }
  function open(){ensure();$('#modalTitle').textContent='Meds Tracker';$('#modalBody').innerHTML=list();$('#modal').showModal()}
  function form(id){
    ensure();let m=data.medications.find(x=>x.id==id),fresh=!m;if(!m)m={id:Date.now(),name:'',dosage:'',frequency:'',startDate:vegasToday(),lastChange:'',active:true,dosageHistory:[]};
    $('#modalTitle').textContent=fresh?'Add medication':'Edit medication';
    $('#modalBody').innerHTML='<div class="form-grid"><label class="field full">Medication name<input id="medName" value="'+esc(m.name)+'" placeholder="Medication name"></label><label class="field">Current dosage<input id="medDose" value="'+esc(m.dosage)+'" placeholder="e.g. 10 mg"></label><label class="field">Frequency / time<input id="medFreq" value="'+esc(m.frequency)+'" placeholder="e.g. Daily AM, AM + PM"></label><label class="field">Started taking<input id="medStart" type="date" value="'+(m.startDate||'')+'"></label><label class="field">Last dosage change<input id="medChanged" type="date" value="'+(m.lastChange||'')+'"></label><label class="field full med-active-label"><input id="medActive" type="checkbox" '+(m.active!==false?'checked':'')+'> Currently taking</label></div><div class="modal-actions">'+(fresh?'<button class="mini" data-meds-cancel>Cancel</button>':'<button class="danger" data-med-delete="'+m.id+'">Delete</button>')+'<button class="primary" id="saveMed">Save</button></div>';
    $('#saveMed').onclick=()=>{let oldDose=m.dosage;m.name=$('#medName').value.trim();m.dosage=$('#medDose').value.trim();m.frequency=$('#medFreq').value.trim();m.startDate=$('#medStart').value;m.lastChange=$('#medChanged').value;m.active=$('#medActive').checked;m.dosageHistory=m.dosageHistory||[];if(!m.name)return alert('Enter a medication name.');if(fresh){if(m.dosage)m.dosageHistory.push({date:m.startDate||vegasToday(),dosage:m.dosage,type:'start'});data.medications.push(m)}else if(oldDose!==m.dosage&&m.dosage){let d=m.lastChange||vegasToday();m.lastChange=d;m.dosageHistory.push({date:d,dosage:m.dosage,type:'change'})}persist();open()}
  }
  function dose(id){
    let m=data.medications.find(x=>x.id==id);if(!m)return;
    $('#modalTitle').textContent='Change dosage';
    $('#modalBody').innerHTML='<p class="meta">'+esc(m.name)+' · current dosage '+esc(m.dosage||'—')+'</p><div class="form-grid"><label class="field">New dosage<input id="newDose" value="'+esc(m.dosage)+'"></label><label class="field">Effective date<input id="newDoseDate" type="date" value="'+vegasToday()+'"></label></div><div class="modal-actions"><button class="mini" data-meds-cancel>Cancel</button><button class="primary" id="saveDose">Save change</button></div>';
    $('#saveDose').onclick=()=>{let d=$('#newDoseDate').value||vegasToday(),v=$('#newDose').value.trim();if(!v)return;m.dosageHistory=m.dosageHistory||[];m.dosageHistory.push({date:d,dosage:v,type:'change'});m.dosage=v;m.lastChange=d;persist();open()}
  }
  function inject(){
    let menu=document.querySelector('.more-menu');if(!menu||menu.querySelector('[data-meds-open]'))return;
    let home=[...menu.querySelectorAll('.more-group')].find(g=>g.querySelector('.eyebrow')?.textContent.trim()==='HOME'),grid=home?.querySelector('.more-grid');if(!grid)return;
    let b=document.createElement('button');b.type='button';b.className='more-destination';b.dataset.medsOpen='1';b.innerHTML='<span class="more-icon">✚</span><span><b>Meds Tracker</b><small>Medication, dosage, schedule & changes</small></span><i>›</i>';grid.appendChild(b);
  }
  document.addEventListener('click',e=>{
    if(e.target.closest?.('[data-action="more"]'))setTimeout(inject,0);
    if(e.target.closest?.('[data-meds-open]'))open();
    if(e.target.closest?.('[data-meds-back],[data-meds-cancel]'))open();
    if(e.target.closest?.('[data-med-add]'))form();
    let ed=e.target.closest?.('[data-med-edit]');if(ed)form(+ed.dataset.medEdit);
    let dc=e.target.closest?.('[data-med-dose]');if(dc)dose(+dc.dataset.medDose);
    let del=e.target.closest?.('[data-med-delete]');if(del&&confirm('Delete this medication?')){data.medications=data.medications.filter(x=>x.id!=+del.dataset.medDelete);persist();open()}
  });
})();