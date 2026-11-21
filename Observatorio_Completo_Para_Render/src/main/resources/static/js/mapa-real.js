"use strict";
// Mapa real: las coordenadas son capitales departamentales aproximadas, NO ubicaciones de incidentes.
const coordenadas={
 'Amazonas':[-6.2317,-77.869], 'Áncash':[-9.5278,-77.5278], 'Apurímac':[-13.6339,-72.8814],
 'Arequipa':[-16.3989,-71.535], 'Ayacucho':[-13.1588,-74.2239], 'Cajamarca':[-7.1617,-78.5128],
 'Callao':[-12.0566,-77.1181], 'Cusco':[-13.5319,-71.9675], 'Huancavelica':[-12.7862,-74.9764],
 'Huánuco':[-9.9298,-76.2422], 'Ica':[-14.0678,-75.7286], 'Junín':[-12.0651,-75.2049],
 'La Libertad':[-8.1116,-79.0287], 'Lambayeque':[-6.7714,-79.8409], 'Lima':[-12.0464,-77.0428],
 'Loreto':[-3.7491,-73.2538], 'Madre de Dios':[-12.5933,-69.1891], 'Moquegua':[-17.1949,-70.9353],
 'Pasco':[-10.6833,-76.2567], 'Piura':[-5.1945,-80.6328], 'Puno':[-15.8402,-70.0219],
 'San Martín':[-6.0342,-76.9717], 'Tacna':[-18.0066,-70.2463], 'Tumbes':[-3.5669,-80.4515],
 'Ucayali':[-8.3791,-74.5539]
};
const $=id=>document.getElementById(id);
let map,markers,heat,layer='calor',catalogue=[],lastRows=[];
const select=(id,values)=>{const el=$(id),prev=el.value;el.replaceChildren(...values.map(v=>new Option(v,v)));if(values.includes(prev))el.value=prev;};
function buildTerritory(){const dep=$('mapa-departamento').value;select('mapa-provincia',['Todos',...new Set(catalogue.filter(r=>r.departamento===dep).map(r=>r.provincia))].sort());buildDistrict();}
function buildDistrict(){const dep=$('mapa-departamento').value,prov=$('mapa-provincia').value;select('mapa-distrito',['Todos',...new Set(catalogue.filter(r=>r.departamento===dep&&r.provincia===prov).map(r=>r.distrito))].sort());}
function period(){return $('mapa-periodo-modo').value==='rango'?[$('mapa-periodo-inicio').value,$('mapa-periodo-fin').value]:[$('mapa-periodo-anio').value,$('mapa-periodo-anio').value];}
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase();
function point(dep){const k=Object.keys(coordenadas).find(k=>norm(k)===norm(dep));return k?coordenadas[k]:null;}
async function load(){const [desde,hasta]=period();if(+desde>+hasta){$('mapa-periodo-error').hidden=false;return;}$('mapa-periodo-error').hidden=true;
const params=new URLSearchParams({desde,hasta,indicador:$('mapa-indicador').value,departamento:$('mapa-departamento').value,provincia:$('mapa-provincia').value,distrito:$('mapa-distrito').value});
$('detalle-mapa').textContent='Consultando registros oficiales…';try{const r=await fetch('/api/mapa/datos?'+params);if(!r.ok)throw Error('HTTP '+r.status);const rows=await r.json();lastRows=rows;draw(rows,desde,hasta);}catch(e){$('detalle-mapa').textContent='No se pudo consultar la base de datos: '+e.message;}}
function draw(rows,desde,hasta){const totals=new Map();let sum=0;for(const r of rows){const n=Number(r.cantidad)||0;sum+=n;totals.set(r.departamento,(totals.get(r.departamento)||0)+n);}
$('detalle-mapa').textContent=`${sum.toLocaleString('es-PE')} registros agregados · ${desde}–${hasta}. Fuente: ${$('mapa-indicador').value==='homicidios'?'INEI (desglose anual)':'SIDPOL (denuncias)'}; los puntos son referencias departamentales, no ubicaciones de incidentes.`;
$('mapa-caption').textContent=`Registros oficiales filtrados · ${desde}–${hasta}`;
const body=$('tabla-mapa');body.replaceChildren();for(const [dep,n] of [...totals].sort((a,b)=>b[1]-a[1])){const tr=document.createElement('tr');for(const val of [dep,n.toLocaleString('es-PE'),`${desde}–${hasta}`]){const td=document.createElement('td');td.textContent=val;tr.append(td);}const td=document.createElement('td'),b=document.createElement('button');b.type='button';b.className='boton secundario';b.textContent='Elegir';b.addEventListener('click',()=>{$('mapa-departamento').value=dep;buildTerritory();load();});td.append(b);tr.append(td);body.append(tr);}
if(!rows.length){const tr=document.createElement('tr'),td=document.createElement('td');td.colSpan=4;td.textContent='Sin datos disponibles para esta selección.';tr.append(td);body.append(tr);}
if(!map)return;markers.clearLayers();const max=Math.max(1,...totals.values()),heatPoints=[];
for(const [dep,n] of totals){const coord=point(dep);if(!coord)continue;const intensity=n/max;heatPoints.push([...coord,Math.max(.05,intensity)]);const marker=L.marker(coord).addTo(markers);const div=document.createElement('div');div.textContent=`${dep}: ${n.toLocaleString('es-PE')} registros (ubicación departamental aproximada)`;marker.bindPopup(div);}
if(heat)heat.setLatLngs(heatPoints);showLayer(layer);
}
function showLayer(v){layer=v;document.querySelectorAll('[data-mapa-capa]').forEach(b=>{b.setAttribute('aria-pressed',String(b.dataset.mapaCapa===v));b.classList.toggle('activo',b.dataset.mapaCapa===v);});if(!map)return;if(map.hasLayer(markers))map.removeLayer(markers);if(heat&&map.hasLayer(heat))map.removeLayer(heat);if(v==='calor'&&heat)heat.addTo(map);else markers.addTo(map);}
async function loadCatalogue(){try{const base='https://raw.githubusercontent.com/RitchieRD/ubigeos-peru-data/main/json/';const data=await Promise.all(['1_ubigeo_departamentos.json','2_ubigeo_provincias.json','3_ubigeo_distritos.json'].map(async name=>{const r=await fetch(base+name);if(!r.ok)throw Error('Catálogo no disponible');return r.json();}));const ds=data[0].ubigeo_departamentos||[],ps=data[1].ubigeo_provincias||[],xs=data[2].ubigeo_distritos||[];const dmap=new Map(ds.map(d=>[String(d.id),d.departamento])),pmap=new Map(ps.map(p=>[String(p.id),{departamento:dmap.get(String(p.departamento_id)),provincia:p.provincia}]));catalogue=xs.map(d=>({...pmap.get(String(d.provincia_id)),distrito:d.distrito})).filter(r=>r.departamento&&r.provincia);$('mapa-departamento').replaceChildren(...['Todos',...new Set(catalogue.map(r=>r.departamento))].sort().map(x=>new Option(x,x)));$('mapa-departamento').value='Todos';buildTerritory();$('mapa-provincia').disabled=false;$('mapa-distrito').disabled=false;document.querySelector('[data-catalogo-status]').textContent=`Catálogo cargado: ${ds.length} departamentos, ${ps.length} provincias y ${xs.length} distritos.`;}catch(e){document.querySelector('[data-catalogo-status]').textContent='No se pudo cargar el catálogo territorial. Se muestran los departamentos disponibles.';select('mapa-departamento',['Todos',...Object.keys(coordenadas)]);select('mapa-provincia',['Todos']);select('mapa-distrito',['Todos']);}}
document.addEventListener('DOMContentLoaded',async()=>{
if(typeof L!=='undefined'){map=L.map('mapa-geografico',{scrollWheelZoom:false}).setView([-9.19,-75.015],5);L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'© OpenStreetMap',maxZoom:18}).addTo(map);markers=L.layerGroup();if(typeof L.heatLayer==='function')heat=L.heatLayer([],{radius:34,blur:24,minOpacity:.25,gradient:{0:'#35a853',.25:'#a5d94b',.5:'#f4df48',.75:'#f49b37',1:'#d83b37'}});}
await loadCatalogue();$('mapa-departamento').addEventListener('change',()=>{buildTerritory();load();});$('mapa-provincia').addEventListener('change',()=>{buildDistrict();load();});$('mapa-distrito').addEventListener('change',load);$('mapa-indicador').addEventListener('change',load);
for(const id of ['mapa-periodo-anio','mapa-periodo-inicio','mapa-periodo-fin'])$(id).addEventListener('change',load);
$('mapa-periodo-modo').addEventListener('change',()=>{const range=$('mapa-periodo-modo').value==='rango';$('mapa-periodo-unico-caja').hidden=range;$('mapa-periodo-inicio-caja').hidden=!range;$('mapa-periodo-fin-caja').hidden=!range;load();});
document.querySelectorAll('[data-mapa-capa]').forEach(b=>b.addEventListener('click',()=>showLayer(b.dataset.mapaCapa)));
$('mapa-consultar').addEventListener('click',load);$('mapa-restablecer').addEventListener('click',()=>{for(const id of ['mapa-departamento','mapa-provincia','mapa-distrito'])$(id).value='Todos';$('mapa-indicador').value='denuncias';$('mapa-periodo-modo').value='unico';$('mapa-periodo-anio').value='2025';$('mapa-periodo-modo').dispatchEvent(new Event('change'));load();});
$('mapa-busqueda').addEventListener('input',e=>{const q=norm(e.target.value);if(q.includes('ROBO'))$('mapa-indicador').value='robos';else if(q.includes('HURTO'))$('mapa-indicador').value='hurtos';else if(q.includes('EXTORS'))$('mapa-indicador').value='extorsion';else if(q.includes('HOMIC'))$('mapa-indicador').value='homicidios';});
await load();
});
