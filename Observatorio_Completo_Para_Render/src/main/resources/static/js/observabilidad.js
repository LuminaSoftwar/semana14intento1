(()=>{'use strict';
const valid=new Set(['consulta_indicador','aplicar_filtro','descargar_datos']);let ga4='';
window.registrarAnalitica=(event,requestId=crypto.randomUUID())=>{if(!valid.has(event))return;fetch('/api/observabilidad/evento',{method:'POST',headers:{'Content-Type':'application/json','X-Request-ID':requestId},body:JSON.stringify({event}),keepalive:true}).catch(()=>{});if(typeof window.gtag==='function')window.gtag('event',event);};
fetch('/api/observabilidad/config').then(r=>r.ok?r.json():null).then(c=>{ga4=(c?.ga4MeasurementId||'').trim();if(!/^G-[A-Z0-9]+$/.test(ga4))return;window.dataLayer=window.dataLayer||[];window.gtag=window.gtag||function(){dataLayer.push(arguments)};window.gtag('js',new Date());window.gtag('config',ga4,{send_page_view:true});const s=document.createElement('script');s.async=true;s.src='https://www.googletagmanager.com/gtag/js?id='+encodeURIComponent(ga4);document.head.append(s);}).catch(()=>{});
})();
