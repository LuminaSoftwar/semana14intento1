(()=>{'use strict';try{
 const key='obs_visit_session';let id=sessionStorage.getItem(key);if(!id){id=crypto.randomUUID();sessionStorage.setItem(key,id);}
 const pulse=navigation=>{if(document.visibilityState==='hidden')return;fetch('/api/visitas/pulso',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({session:id,path:location.pathname,navigation}),keepalive:true}).catch(()=>{});};
 pulse(true);setInterval(()=>pulse(false),45000);document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')pulse(false);});
}catch(e){console.warn('Métrica de visitas no disponible',e);}})();
