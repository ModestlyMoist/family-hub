// Shared display formatting. Stored dates and times are never rewritten.
(function(){
 'use strict';
 function format(value){if(!value)return 'All day';let match=/^(\d{1,2}):(\d{2})$/.exec(String(value));if(!match)return String(value);let h=Number(match[1]),m=Number(match[2]);if(h>23||m>59)return String(value);return (h%12||12)+(m?':'+String(m).padStart(2,'0'):'')+' '+(h>=12?'PM':'AM')}
 function range(start,end){return !start?'All day':format(start)+(end?' – '+format(end):'')}
 window.familyHubTime={format,range};
})();
