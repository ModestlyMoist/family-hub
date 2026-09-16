// Recurring Tasks 2.0 — v130a
(function(){
  function nextAfter(t,ds){
    const d=new Date(ds+'T12:00');
    if(t.cycle==='Daily')d.setDate(d.getDate()+1);
    else if(t.cycle==='Every X Days'||t.cycle==='Every 3 Days')d.setDate(d.getDate()+(t.cycle==='Every 3 Days'?3:(+t.cycleEvery||1)));
    else if(t.cycle==='Weekly')d.setDate(d.getDate()+7);
    else if(t.cycle==='Every X Weeks')d.setDate(d.getDate()+7*(+t.cycleEvery||1));
    else {for(let i=1;i<=370;i++){let n=new Date(d);n.setDate(n.getDate()+i);let s=iso(n);if(taskDueOn(t,s))return s}return ''}
    return iso(d);
  }
  window.recurringTaskNextAfter=nextAfter;
  const originalNext=window.nextTaskDue;
  window.nextTaskDue=function(t,from=vegasToday()){
    if(t.taskMode!=='cycle')return t.due||'';
    if(t.lastCompleted){
      const after=nextAfter(t,t.lastCompleted);
      if(after&&after>=from)return after;
    }
    return originalNext(t,from);
  };
  window.choreStatus=function(t){
    if(t.taskMode!=='cycle')return t.due?fmtDate(t.due):'No due date';
    const nd=window.nextTaskDue(t);
    if(nd===vegasToday())return 'Due now · '+(t.cycle||'Repeating');
    return nd?'Next: '+fmtDate(nd)+' · '+(t.cycle||'Repeating'):'No upcoming date';
  };
  window.resetRecurringTasks=function(){
    const today=vegasToday();let changed=false;
    data.tasks.forEach(t=>{
      if(t.taskMode!=='cycle'||!t.done)return;
      const nd=window.nextTaskDue(t,today);
      if(nd&&nd<=today){t.done=false;changed=true}
    });
    if(changed)save();
  };
})();