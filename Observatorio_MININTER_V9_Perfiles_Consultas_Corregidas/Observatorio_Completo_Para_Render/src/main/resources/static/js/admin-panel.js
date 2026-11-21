(()=>{'use strict';
const $=id=>document.getElementById(id),csrf=document.querySelector('meta[name="_csrf"]').content,csrfHeader=document.querySelector('meta[name="_csrf_header"]').content;
let seleccion=null,offset=0,validado=false,territorios=[];
const campos=['anio','mes','departamento','provincia','distrito','ubigeo','modalidad','cantidad'];
const txt=(el,value)=>{el.textContent=String(value??'')};
async function api(path,opts={}){const r=await fetch(path,{...opts,headers:{...(opts.body instanceof FormData?{}:{'Content-Type':'application/json'}),[csrfHeader]:csrf,...opts.headers}});const data=await r.json();if(!r.ok)throw Error(data.error||data.mensaje||JSON.stringify(data));return data;}
function opciones(id,values){const e=$(id);e.replaceChildren(new Option('Seleccionar',''));values.forEach(v=>e.add(new Option(v,v)));}
function actualizaProvincias(){const dep=$('departamento').value;opciones('provincia',[...new Set(territorios.filter(r=>r.departamento===dep).map(r=>r.provincia))].sort());opciones('distrito',[]);$('ubigeo').value='';}
function actualizaDistritos(){const dep=$('departamento').value,prov=$('provincia').value;opciones('distrito',territorios.filter(r=>r.departamento===dep&&r.provincia===prov).map(r=>r.distrito).sort());$('ubigeo').value='';}
async function catalogo(){try{
 const base='https://raw.githubusercontent.com/RitchieRD/ubigeos-peru-data/main/json/';
 const [rawD,rawP,rawX]=await Promise.all(['1_ubigeo_departamentos.json','2_ubigeo_provincias.json','3_ubigeo_distritos.json'].map(async n=>{const r=await fetch(base+n);if(!r.ok)throw Error('HTTP '+r.status);return r.json();}));
 const deps=rawD.ubigeo_departamentos||[],provs=rawP.ubigeo_provincias||[],dists=rawX.ubigeo_distritos||[];
 const dep=new Map(deps.map(d=>[String(d.id),d.departamento]));
 const prov=new Map(provs.map(p=>[String(p.id),{dep:dep.get(String(p.departamento_id)),nombre:p.provincia}]));
 territorios=dists.map(d=>{const p=prov.get(String(d.provincia_id));return p?{departamento:p.dep,provincia:p.nombre,distrito:d.distrito,ubigeo:String(d.ubigeo).padStart(6,'0')}:null}).filter(Boolean);
 opciones('departamento',[...new Set(territorios.map(x=>x.departamento))].sort());
 }catch(e){txt($('estado-registro'),'No se pudo cargar el catálogo territorial: '+e.message);}}

function formulario(){return Object.fromEntries(campos.map(c=>[c,$(c).value]));}
function llenar(r){for(const c of ['anio','mes','modalidad','cantidad'])$(c).value=r[c];$('departamento').value=r.departamento;actualizaProvincias();$('provincia').value=r.provincia;actualizaDistritos();$('distrito').value=r.distrito;$('ubigeo').value=r.ubigeo;}
function limpiar(){$('form-registro').reset();seleccion=null;$('guardar').textContent='Agregar registro';$('eliminar').disabled=true;}
async function registros(){try{const rows=await api('/admin/api/datos?offset='+offset);const tbody=$('registros');tbody.replaceChildren();for(const r of rows){const tr=document.createElement('tr');for(const c of ['anio','mes','departamento','provincia','distrito','modalidad','cantidad']){const td=document.createElement('td');txt(td,r[c]);tr.append(td);}const td=document.createElement('td'),b=document.createElement('button');b.className='btn btn-sm btn-outline-primary';b.textContent='Seleccionar';b.addEventListener('click',()=>{seleccion=Object.fromEntries(campos.map(c=>[c,String(r[c])]));llenar(r);$('guardar').textContent='Guardar cambios';$('eliminar').disabled=false;window.scrollTo({top:$('form-registro').getBoundingClientRect().top+scrollY-80,behavior:'smooth'});});td.append(b);tr.append(td);tbody.append(tr);}}catch(e){txt($('estado-registro'),e.message);}}
async function auditoria(){try{const rows=await api('/admin/api/auditoria'),t=$('auditoria');t.replaceChildren();for(const r of rows){const tr=document.createElement('tr');for(const c of ['created_at','actor','action','detail']){const td=document.createElement('td');txt(td,r[c]);tr.append(td);}t.append(tr);}}catch(e){console.warn(e);}}
let chartRutas=null;
function duracion(seg){const s=Math.max(0,Number(seg)||0);return `${Math.floor(s/3600)}h ${String(Math.floor(s%3600/60)).padStart(2,'0')}m ${String(Math.floor(s%60)).padStart(2,'0')}s`;}
function fecha(value){return value?new Date(value).toLocaleString('es-PE'):'—';}
function pintarAnalitica(d){
 txt($('promedio-duracion'),duracion(d.promedioSegundos));txt($('acumulado-visitas'),d.acumulado);
 const body=$('log-sesiones');body.replaceChildren();for(const v of (d.sesionesRecientes||[])){
  const tr=document.createElement('tr');for(const value of [String(v.sesion||'').slice(0,8)+'…',v.ruta,fecha(v.inicio),fecha(v.ultima_actividad),duracion(v.duracion_segundos),v.activa?'Activa':'Inactiva']){const td=document.createElement('td');td.textContent=String(value??'');tr.append(td);}body.append(tr);
 }
 const rows=d.rutasHoy||[],total=rows.reduce((n,r)=>n+Number(r.sesiones||0),0),labels=rows.map(r=>r.path),data=rows.map(r=>total?100*Number(r.sesiones)/total:0);
 if(typeof Chart!=='undefined'){
  if(chartRutas)chartRutas.destroy();chartRutas=new Chart($('grafico-rutas'),{type:'bar',data:{labels,datasets:[{label:'% de sesiones del día',data,backgroundColor:'#316fa7'}]},options:{indexAxis:'y',responsive:true,plugins:{tooltip:{callbacks:{label:ctx=>`${ctx.parsed.x.toFixed(1)}% (${rows[ctx.dataIndex].sesiones} sesiones)`}}},scales:{x:{min:0,max:100,title:{display:true,text:'Porcentaje (%)'}}}}});
 }
}
async function visitas(){try{const d=await api('/admin/api/visitas');for(const k of ['activos','hoy','paginas'])txt($(k),d[k]);pintarAnalitica(d);const t=$('rutas');t.replaceChildren();for(const r of d.rutas){const tr=document.createElement('tr');for(const k of ['path','sesiones','inactivas']){const td=document.createElement('td');txt(td,r[k]);tr.append(td);}t.append(tr);}}catch(e){console.warn(e);}}
async function importar(confirmar){const file=$('csv').files[0];if(!file){txt($('estado-importacion'),'Selecciona un CSV.');return;}const body=new FormData();body.append('archivo',file);try{const d=await api('/admin/api/importar?confirmar='+confirmar,{method:'POST',body});txt($('estado-importacion'),JSON.stringify(d));validado=!confirmar;$('importar').disabled=!validado;if(confirmar){await registros();await auditoria();}}catch(e){validado=false;$('importar').disabled=true;txt($('estado-importacion'),e.message);}}
document.addEventListener('DOMContentLoaded',async()=>{
 $('departamento').addEventListener('change',actualizaProvincias);$('provincia').addEventListener('change',actualizaDistritos);$('distrito').addEventListener('change',()=>{const r=territorios.find(x=>x.departamento===$('departamento').value&&x.provincia===$('provincia').value&&x.distrito===$('distrito').value);$('ubigeo').value=r?r.ubigeo:'';});
 $('validar').addEventListener('click',()=>importar(false));$('importar').addEventListener('click',()=>{if(validado&&confirm('¿Confirmar importación de este CSV?'))importar(true);});$('csv').addEventListener('change',()=>{$('importar').disabled=true;validado=false;});
 $('form-registro').addEventListener('submit',async e=>{e.preventDefault();try{const body=seleccion?{anterior:seleccion,nuevo:formulario()}:formulario();await api('/admin/api/registro',{method:seleccion?'PUT':'POST',body:JSON.stringify(body)});txt($('estado-registro'),'Registro guardado correctamente');limpiar();await registros();await auditoria();}catch(err){txt($('estado-registro'),err.message);}});
 $('eliminar').addEventListener('click',async()=>{if(!seleccion||!confirm('¿Eliminar este registro? Esta acción no se puede deshacer.'))return;try{await api('/admin/api/registro',{method:'DELETE',body:JSON.stringify(seleccion)});limpiar();await registros();await auditoria();}catch(e){txt($('estado-registro'),e.message);}});
 $('cancelar').addEventListener('click',limpiar);$('anterior').addEventListener('click',()=>{offset=Math.max(0,offset-100);registros();});$('siguiente').addEventListener('click',()=>{offset+=100;registros();});
 await Promise.all([catalogo(),registros(),auditoria(),visitas()]);setInterval(visitas,30000);
});
})();
