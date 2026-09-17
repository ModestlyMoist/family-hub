// Recurring chore completion + undo — v190a
(function(){
function ensure(){data.taskLog=data.taskLog||{}}
function completedToday(t){ensure();let ds=vegasToday(),log=data.taskLog[ds];if(Array.isArray(log))return log.some(x=>String(x.id??x.taskId??x)===String(t.id));if(log&&typeof log==='object')return !!log[t.id];return t.lastCompleted===ds}
function dueToday(t){if(t.taskMode!=='cycle')return !t.done&&(!t.due||t.due<=vegasToday());if(completedToday(t))return false;return typeof taskDueOn==='function'?taskDueOn(t,vegasToday()):String(choreStatus(t)).startsWith('Due now')}
window.taskCompletedToday=completedToday;window.taskDueToday=dueToday;
const baseStatus=window.choreStatus;
window.choreStatus=function(t){if(t.taskMode==='cycle'){if(completedToday(t))return 'Done today · '+(t.cycle||'Repeating');if(dueToday(t))return 'Due now · '+(t.cycle||'Repeating')}return baseStatus(t)};
const baseReset=window.resetRecurringTasks;
window.resetRecurringTasks=function(){if(typeof baseReset==='function')baseReset();let changed=false,today=vegasToday();data.tasks.forEach(t=>{if(t.taskMode==='cycle'&&t.done&&!completedToday(t)){t.done=false;changed=true}if(t.taskMode==='cycle'&&t.cycle==='Daily'&&t.lastCompleted&&t.lastCompleted<today&&t.done){t.done=false;changed=true}});if(changed)save()};
function removeLog(t,ds){ensure();let log=data.taskLog[ds];if(Array.isArray(log))data.taskLog[ds]=log.filter(x=>String(x.id??x.taskId??x)!==String(t.id));else if(log&&typeof log==='object')delete log[t.id]}
function undo(t){let ds=vegasToday();t.done=false;if(t.lastCompleted===ds)t.lastCompleted='';removeLog(t,ds);save();render()}
document.addEventListener('click',e=>{let b=e.target.closest?.('[data-task-undo]');if(!b)return;let t=data.tasks.find(x=>String(x.id)===String(b.dataset.taskUndo));if(t)undo(t)});
window.recurringUndoButton=function(t){return t&&t.taskMode==='cycle'&&completedToday(t)?'<button type="button" class="mini" data-task-undo="'+t.id+'">Undo completion</button>':''};
})();
