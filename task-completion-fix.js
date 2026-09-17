// Recurring chore completion + natural checkbox undo — v191a
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
function reverseGG(t){if(!['Household','Work','Chore'].includes(t.category))return;data.settings=data.settings||{};let keys=['gg','ggBalance','goodGame','goodGameBalance','rewardBalance'];for(let k of keys)if(typeof data.settings[k]==='number'){data.settings[k]=Math.max(0,+(data.settings[k]-.1).toFixed(1));return}}
function undo(t){let ds=vegasToday();t.done=false;if(t.lastCompleted===ds)t.lastCompleted='';removeLog(t,ds);reverseGG(t);save();render()}
window.undoTaskCompletion=undo;
function completedTasks(){return (data.tasks||[]).filter(t=>t.done||(t.taskMode==='cycle'&&completedToday(t)))}
function injectCompleted(){if((window.view||view)!=='tasks')return;let root=document.querySelector('#dashboard');if(!root)return;let old=root.querySelector('.task-undo-completed');if(old)old.remove();let list=completedTasks();if(!list.length)return;let section=document.createElement('section');section.className='card full task-undo-completed';section.innerHTML='<div class="card-head"><div><h2>Completed</h2><div class="meta">Uncheck anything completed by mistake</div></div></div><div class="task-undo-list">'+list.map(t=>'<label class="task-undo-row"><input type="checkbox" checked data-task-uncheck="'+t.id+'"><span><b>'+String(t.name||'Task').replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]))+'</b><small>'+(t.taskMode==='cycle'?'Completed today · '+(t.cycle||'Repeating'):'Completed')+'</small></span></label>').join('')+'</div>';root.appendChild(section)}
document.addEventListener('change',e=>{let c=e.target.closest?.('[data-task-uncheck]');if(!c||c.checked)return;let t=data.tasks.find(x=>String(x.id)===String(c.dataset.taskUncheck));if(t)undo(t)});
document.addEventListener('click',e=>{let b=e.target.closest?.('[data-task-undo]');if(!b)return;let t=data.tasks.find(x=>String(x.id)===String(b.dataset.taskUndo));if(t)undo(t)});
let oldRender=window.render;if(typeof oldRender==='function'){window.render=function(){let r=oldRender.apply(this,arguments);setTimeout(injectCompleted,0);return r}}else setInterval(injectCompleted,500);
window.recurringUndoButton=function(t){return t&&t.taskMode==='cycle'&&completedToday(t)?'<label class="task-inline-uncheck"><input type="checkbox" checked data-task-uncheck="'+t.id+'"> Completed</label>':''};
setTimeout(injectCompleted,0);
})();
