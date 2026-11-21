(() => {
'use strict';
const $=id=>document.getElementById(id);
const meses=['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
const tipos=['Robo','Hurto','Extorsión','Estafa','Secuestro','Violencia contra la mujer e integrantes','Otros'];
const fmt=n=>Math.round(n).toLocaleString('es-PE');
const config=window.OBS_SUPABASE||{};
const charts={};let filas=[],homicidios=[],homicidiosNacionales=[],vista='mensual',catalogo=[],listo=false;
const normalizar=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toUpperCase();
const CATALOGO_BASE='https://cdn.jsdelivr.net/gh/RitchieRD/ubigeos-peru-data@main/json/';
async function cargarCatalogo(){
 const [deps,provs,dists]=await Promise.all(['1_ubigeo_departamentos.json','2_ubigeo_provincias.json','3_ubigeo_distritos.json'].map(async f=>{const r=await fetch(CATALOGO_BASE+f);if(!r.ok)throw new Error('No se pudo cargar '+f);const j=await r.json();return Array.isArray(j)?j:Object.values(j); }));
 const depMap=new Map(deps.map(d=>[String(d.id),String(d.departamento).trim()]));
 const provMap=new Map(provs.map(p=>[String(p.id),{departamento:depMap.get(String(p.departamento_id)),provincia:String(p.provincia).trim()}]));
 const listado=dists.map(d=>{const p=provMap.get(String(d.provincia_id));return p?{departamento:p.departamento,provincia:p.provincia,distrito:String(d.distrito).trim()}:null;}).filter(x=>x&&x.departamento);
 if(listado.length<1000)throw new Error('Catálogo territorial incompleto');return listado;
}

function aviso(s){const el=$('estado-catalogo-dashboard');if(el)el.textContent=s;}
function unique(a){return [...new Set(a)].sort((x,y)=>x.localeCompare(y,'es'));}
function poblar(sel,items,placeholder,preferred='Todos'){
 sel.replaceChildren(new Option(placeholder,'Todos'));
 for(const v of items)sel.add(new Option(v,v));
 sel.value=items.includes(preferred)?preferred:'Todos';
}
function options(){return {responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'bottom'}},scales:{y:{beginAtZero:true}}};}
function graf(id,type,labels,values,label){if(!window.Chart)return;if(charts[id])charts[id].destroy();charts[id]=new Chart($(id),{type,data:{labels,datasets:[{label,data:values,backgroundColor:type==='doughnut'?['#164b78','#47866b','#d18b24','#a94f4f','#8064a2']:'rgba(22,75,120,.65)',borderColor:'#164b78',tension:.25,fill:type==='line'}]},options:type==='doughnut'?{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'bottom'}}}:options()});}
// Los meses provienen de SIDPOL: no se generan valores sintéticos.
function mensual(r,mes){return r.mes===mes+1?r.cantidad:0;}
function filtroGeo(r){const dep=$('filtro-departamento').value,prov=$('filtro-provincia').value,dist=$('filtro-distrito-visible').value;return (dep==='Todos'||normalizar(r.departamento)===normalizar(dep))&&(prov==='Todos'||normalizar(r.provincia)===normalizar(prov))&&(dist==='Todos'||normalizar(r.distrito)===normalizar(dist));}
function suma(year,tipo='Todos',mes=null){let total=0;for(const r of filas)if(r.anio===year&&(tipo==='Todos'||r.modalidad===tipo)&&filtroGeo(r))total+=(mes===null||r.mes===mes+1)?r.cantidad:0;return total;}
function actualizaGeo(nivel){
 const depEl=$('filtro-departamento'),provEl=$('filtro-provincia'),distEl=$('filtro-distrito-visible');
 const dep=depEl.value,prov=provEl.value,dist=distEl.value;
 const base=catalogo.length?catalogo:filas;
 if(nivel===0)poblar(depEl,unique(base.map(r=>r.departamento)),'Todos los departamentos',dep);
 const d=depEl.value;
 if(nivel<=1)poblar(provEl,unique(base.filter(r=>d==='Todos'||normalizar(r.departamento)===normalizar(d)).map(r=>r.provincia)),'Todas las provincias',nivel===0?prov:'Todos');
 const p=provEl.value;
 poblar(distEl,unique(base.filter(r=>(d==='Todos'||normalizar(r.departamento)===normalizar(d))&&(p==='Todos'||normalizar(r.provincia)===normalizar(p))).map(r=>r.distrito)),'Todos los distritos',nivel<=1?'Todos':dist);
 provEl.disabled=false;distEl.disabled=false;actualizar();
}

function actualizar(){
 if(!filas.length)return;
 const anio=+$('filtro-periodo').value,comp=+$('filtro-comparacion').value;
 const total=suma(anio),prev=suma(comp),vals=Object.fromEntries(tipos.map(t=>[t,suma(anio,t)]));
 const dep=$('filtro-departamento').value,prov=$('filtro-provincia').value,dist=$('filtro-distrito-visible').value;
 let hom=null,notaH='';
 if(anio===2025){if(dep==='Todos'&&prov==='Todos'&&dist==='Todos'){
   const r=homicidiosNacionales.find(x=>Number(x.anio)===2025);if(r){hom=Number(r.cantidad);notaH='Estimación preliminar nacional del INEI/CEIC (2025)';}
  }else notaH='Sin desglose territorial verificable para 2025';
 }else{
  const lista=homicidios.filter(r=>Number(r.anio)===anio);
  if(lista.length){hom=lista.filter(r=>(dep==='Todos'||normalizar(r.departamento)===normalizar(dep))&&(prov==='Todos'||normalizar(r.provincia)===normalizar(prov))&&(dist==='Todos'||normalizar(r.distrito)===normalizar(dist))).reduce((a,r)=>a+Number(r.cantidad),0);notaH='INEI/CEIC · muertes violentas dolosas';}
 }
 $('kpi-homicidios').textContent=hom===null?'Sin datos':fmt(hom);
 const hnota=$('nota-homicidios');if(hnota)hnota.textContent=notaH;

 [['kpi-hechos',total],['kpi-extorsion',vals['Extorsión']],['kpi-robos',vals.Robo],['kpi-hurtos',vals.Hurto]].forEach(([id,n])=>$(id).textContent=fmt(n));
 $('kpi-variacion').textContent=prev?`${((total-prev)/prev*100).toFixed(1)} %`:'Sin datos';
 $('kpi-hechos-periodo').textContent=`Denuncias en CSV · ${anio}`;
 $('kpi-variacion-detalle').textContent=`Comparado con ${comp}`;
 $('estado-filtros').textContent=`Fuente: SIDPOL, denuncias policiales mensuales 2022–2025. Homicidios: INEI/CEIC (2025 preliminar nacional).${total===0?' Sin registros de denuncias para la selección actual.':''}`;
 graf('chart-tipos','doughnut',tipos,tipos.map(t=>vals[t]),'Denuncias');
 $('alt-tipos').textContent=`Total anual: ${fmt(total)} denuncias; distribución por siete categorías.`;
 const tipo=$('evolucion-tipo').value,desde=+$('anio-desde').value,hasta=+$('anio-hasta').value;
 if(vista==='mensual'){
  const serie=meses.map((_,m)=>suma(anio,tipo,m));
  $('titulo-evolucion').textContent='1. Evolución mensual de denuncias policiales';
  $('descripcion-evolucion').textContent=`Registros mensuales SIDPOL de ${tipo==='Todos'?'todas las modalidades':tipo} en ${anio}.`;
  $('rango-anios').hidden=true;
  graf('chart-evolucion','line',meses,serie,'Denuncias mensuales SIDPOL');
  $('alt-evolucion').textContent=`Denuncias mensuales observadas. Total anual: ${fmt(serie.reduce((a,b)=>a+b,0))}.`;
 }else{
  const years=Array.from({length:Math.max(0,hasta-desde+1)},(_,i)=>desde+i);
  $('titulo-evolucion').textContent='1. Comparación anual';$('descripcion-evolucion').textContent='Datos anuales procedentes de los CSV.';$('rango-anios').hidden=false;
  graf('chart-evolucion','bar',years,years.map(y=>suma(y,tipo)),'Denuncias anuales');$('alt-evolucion').textContent=`Comparación anual entre ${desde} y ${hasta}.`;
 }
 const ay=+$('distritos-anio').value,mes=$('distritos-mes').value,dt=$('distritos-tipo').value;
 const porDistrito=new Map();
 for(const r of filas){if(r.anio!==ay||(dt!=='Todos'&&r.modalidad!==dt)||!filtroGeo(r))continue;
  const k=`${r.distrito} · ${r.provincia} · ${r.departamento}`;
  porDistrito.set(k,(porDistrito.get(k)||0)+(mes==='Todos'?r.cantidad:mensual(r,+mes-1)));
 }
 const top=[...porDistrito].sort((a,b)=>b[1]-a[1]).slice(0,10);
 graf('chart-distritos','bar',top.map(x=>x[0]),top.map(x=>x[1]),mes==='Todos'?'Denuncias anuales':'Denuncias mensuales SIDPOL');
 $('alt-distritos').textContent=mes==='Todos'?'Comparación anual de distritos del CSV.':'Comparación de denuncias registradas durante el mes seleccionado.';
}
async function consultarTabla(tabla,campos){
 const base=`${config.url.replace(/\/$/,'')}/rest/v1/${tabla}?select=${campos}`;
 const headers={apikey:config.anonKey,Prefer:'count=exact'};
 if(config.anonKey.startsWith('eyJ'))headers.Authorization=`Bearer ${config.anonKey}`;
 async function pagina(offset){
  const resp=await fetch(`${base}&limit=1000&offset=${offset}`,{headers});
  if(!resp.ok)throw new Error(`${tabla}: HTTP ${resp.status}: ${await resp.text()}`);
  const rows=await resp.json();
  const rango=resp.headers.get('content-range')||'';
  const total=Number(rango.split('/')[1]);
  return {rows,total:Number.isFinite(total)?total:null};
 }
 const first=await pagina(0);
 const resultado=[...first.rows];
 if(first.total===null){
  // Fallback seguro cuando PostgREST no informa el total.
  let offset=first.rows.length;
  while(offset<500000){
   const part=await pagina(offset);resultado.push(...part.rows);
   offset+=part.rows.length;
   if(part.rows.length<1000)break;
  }
  return resultado;
 }
 const total=first.total;
 const offsets=[];for(let i=1000;i<total;i+=1000)offsets.push(i);
 let completadas=1;
 // Límite de concurrencia para no saturar Supabase Free.
 const workers=Array.from({length:Math.min(6,offsets.length)},async()=>{
  while(offsets.length){
   const offset=offsets.shift();if(offset===undefined)break;
   const part=await pagina(offset);
   resultado.push(...part.rows);
   completadas++;
   if(tabla==='obs_denuncias_policiales'&&completadas%12===0)
    aviso(`Descargando SIDPOL: ${fmt(Math.min(completadas*1000,total))} de ${fmt(total)} filas…`);
  }
 });
 await Promise.all(workers);
 return resultado;
}
async function cargar(){
 if(!config.url||!config.anonKey||config.url.includes('REEMPLAZAR')){aviso('Configura URL y clave pública en supabase-config.js');return;}
 aviso('Cargando denuncias mensuales SIDPOL y homicidios INEI…');
 try{
  [filas,homicidios,homicidiosNacionales]=await Promise.all([
   consultarTabla('obs_denuncias_policiales','anio,mes,departamento,provincia,distrito,ubigeo,modalidad,cantidad'),
   consultarTabla('obs_homicidios_inei','anio,ubigeo,departamento,provincia,distrito,cantidad,estado'),
   consultarTabla('obs_homicidios_nacional','anio,ambito,cantidad,estado')]);
  filas=filas.map(r=>({...r,anio:Number(r.anio),mes:Number(r.mes),cantidad:Number(r.cantidad)}));
  aviso(`${fmt(filas.length)} registros agregados de denuncias SIDPOL y ${fmt(homicidios.length)} registros de homicidios INEI.`);
  try{catalogo=await cargarCatalogo();aviso(`${fmt(filas.length)} filas SIDPOL. Catálogo nacional: ${fmt(catalogo.length)} distritos. Las ubicaciones sin registros no representan cero delitos.`);}catch(err){console.warn(err);aviso(`Catálogo nacional no disponible: ${err.message}`);}
  listo=true;['exportar-tipos','exportar-evolucion','exportar-distritos','exportar-detalle'].forEach(id=>$(id).disabled=false);actualizaGeo(0);
 }catch(e){aviso(`No se pudo consultar Supabase: ${e.message}. Ejecuta SQL e importa los tres CSV.`);console.error(e);}
}

// Exportaciones locales: se calculan desde los mismos registros y filtros que los gráficos.
function descargarCsv(nombre,encabezados,registros){
 const escapar=v=>{let x=String(v??'');if(/^[=+@\-]/.test(x))x="'"+x;return '"'+x.replace(/"/g,'""')+'"';};
 const contenido='\uFEFF'+[encabezados,...registros].map(f=>f.map(escapar).join(';')).join('\r\n');
 const url=URL.createObjectURL(new Blob([contenido],{type:'text/csv;charset=utf-8'}));
 const a=document.createElement('a');a.href=url;a.download=nombre;a.click();setTimeout(()=>URL.revokeObjectURL(url),2000);
}
function geoActual(){return [$('filtro-departamento').value,$('filtro-provincia').value,$('filtro-distrito-visible').value];}
function nombreArchivo(prefijo){return `${prefijo}_${new Date().toISOString().slice(0,10)}.csv`;}
function exportar(tipo){
 if(!listo)return;
 const [dep,prov,dist]=geoActual();const geo=[dep,prov,dist];
 if(tipo==='tipos'){
  const y=Number($('filtro-periodo').value);
  descargarCsv(nombreArchivo('distribucion_delitos'),['Año','Departamento','Provincia','Distrito','Tipo de delito','Denuncias','Fuente'],tipos.map(t=>[y,...geo,t,suma(y,t),'SIDPOL']));return;
 }
 if(tipo==='evolucion'){
  const t=$('evolucion-tipo').value,y=Number($('filtro-periodo').value);
  if(vista==='mensual')descargarCsv(nombreArchivo('evolucion_mensual'),['Año','Mes','Departamento','Provincia','Distrito','Tipo de delito','Denuncias','Fuente'],meses.map((m,i)=>[y,i+1,...geo,t,suma(y,t,i),'SIDPOL']));
  else{const d=Number($('anio-desde').value),h=Number($('anio-hasta').value);if(d>h){alert('El año inicial debe ser menor o igual al final.');return;}
   descargarCsv(nombreArchivo('comparacion_anual'),['Año','Departamento','Provincia','Distrito','Tipo de delito','Denuncias','Fuente'],Array.from({length:h-d+1},(_,i)=>[d+i,...geo,t,suma(d+i,t),'SIDPOL']));}return;
 }
 const y=Number($('distritos-anio').value),m=$('distritos-mes').value,t=$('distritos-tipo').value;
 const registros=filas.filter(r=>r.anio===y&&(m==='Todos'||r.mes===Number(m))&&(t==='Todos'||r.modalidad===t)&&filtroGeo(r));
 if(tipo==='detalle'){
  descargarCsv(nombreArchivo('registros_filtrados'),['Año','Mes','Departamento','Provincia','Distrito','Ubigeo','Tipo de delito','Cantidad','Fuente'],registros.map(r=>[r.anio,r.mes,r.departamento,r.provincia,r.distrito,r.ubigeo,r.modalidad,r.cantidad,'SIDPOL']));return;
 }
 const grupos=new Map();for(const r of registros){const k=[r.departamento,r.provincia,r.distrito];const id=JSON.stringify(k);if(!grupos.has(id))grupos.set(id,{k,c:0});grupos.get(id).c+=r.cantidad;}
 const ordenados=[...grupos.values()].sort((a,b)=>b.c-a.c);
 descargarCsv(nombreArchivo('comparacion_distritos'),['Año','Mes','Departamento','Provincia','Distrito','Tipo de delito','Denuncias','Fuente'],ordenados.map(v=>[y,m,...v.k,t,v.c,'SIDPOL']));
}

document.addEventListener('DOMContentLoaded',()=>{
 if(!$('filtro-periodo'))return;
 for(const id of ['evolucion-tipo','distritos-tipo'])poblar($(id),tipos,'Todos');
 for(const id of ['filtro-periodo','filtro-comparacion','evolucion-tipo','distritos-anio','distritos-mes','distritos-tipo','anio-desde','anio-hasta'])$(id).addEventListener('change',actualizar);
 $('filtro-departamento').addEventListener('change',()=>actualizaGeo(1));
 $('filtro-provincia').addEventListener('change',()=>actualizaGeo(2));
 $('filtro-distrito-visible').addEventListener('change',actualizar);
 $('vista-mensual').addEventListener('click',()=>{vista='mensual';$('vista-mensual').classList.add('activo');$('vista-anual').classList.remove('activo');actualizar();});
 $('vista-anual').addEventListener('click',()=>{vista='anual';$('vista-anual').classList.add('activo');$('vista-mensual').classList.remove('activo');actualizar();});
 $('restablecer-filtros').addEventListener('click',()=>{$('filtro-periodo').value='2025';$('filtro-comparacion').value='2024';$('distritos-anio').value='2025';$('distritos-mes').value='Todos';$('evolucion-tipo').value='Todos';$('distritos-tipo').value='Todos';$('filtro-departamento').value='Todos';actualizaGeo(1);});
 [['exportar-tipos','tipos'],['exportar-evolucion','evolucion'],['exportar-distritos','distritos'],['exportar-detalle','detalle']].forEach(([id,t])=>$(id).addEventListener('click',()=>exportar(t)));
 cargar();
});
})();
