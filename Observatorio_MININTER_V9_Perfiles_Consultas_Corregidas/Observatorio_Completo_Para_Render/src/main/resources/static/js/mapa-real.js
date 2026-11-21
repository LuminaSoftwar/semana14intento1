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
function buildTerritory(){const dep=$('mapa-departamento').value;select('mapa-provincia',['Todos',...[...new Set(catalogue.filter(r=>dep==='Todos'||r.departamento===dep).map(r=>r.provincia))].sort()]);buildDistrict();}
function buildDistrict(){const dep=$('mapa-departamento').value,prov=$('mapa-provincia').value;select('mapa-distrito',['Todos',...[...new Set(catalogue.filter(r=>(dep==='Todos'||r.departamento===dep)&&(prov==='Todos'||r.provincia===prov)).map(r=>r.distrito))].sort()]);}
function period(){return $('mapa-periodo-modo').value==='rango'?[$('mapa-periodo-inicio').value,$('mapa-periodo-fin').value]:[$('mapa-periodo-anio').value,$('mapa-periodo-anio').value];}
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase();
function point(dep){const k=Object.keys(coordenadas).find(k=>norm(k)===norm(dep));return k?coordenadas[k]:null;}
async function load(){const [desde,hasta]=period();if(+desde>+hasta){$('mapa-periodo-error').hidden=false;return;}$('mapa-periodo-error').hidden=true;
const params=new URLSearchParams({desde,hasta,indicador:$('mapa-indicador').value,departamento:$('mapa-departamento').value,provincia:$('mapa-provincia').value,distrito:$('mapa-distrito').value});
$('detalle-mapa').textContent='Consultando registros oficiales…';try{const r=await fetch('/api/mapa/datos?'+params);if(!r.ok)throw Error('HTTP '+r.status);const rows=await r.json();lastRows=rows;draw(rows,desde,hasta);}catch(e){$('detalle-mapa').textContent='No se pudo consultar la base de datos: '+e.message;}}
// Mapa coroplético distrital: cada polígono se une al UBIGEO, nunca a una capital departamental.
const GEO_URL='https://raw.githubusercontent.com/Rodasluis/Peru-maps/main/salida/distrito_simplificado.geojson';
let geoFeatures=null, geoLayer=null, geoError='';
const fmt=n=>Number(n||0).toLocaleString('es-PE');
const ub=s=>String(s??'').trim().padStart(6,'0');
function quantile(sorted,q){if(!sorted.length)return 0;const pos=(sorted.length-1)*q,lo=Math.floor(pos),hi=Math.ceil(pos);return sorted[lo]+(sorted[hi]-sorted[lo])*(pos-lo);}
const colors=['#35a853','#a5d94b','#f4df48','#f49b37','#d83b37'];
function draw(rows,desde,hasta){
 const byUb=new Map(),byDep=new Map();let sum=0;
 for(const r of rows){const n=Number(r.cantidad)||0;sum+=n;const code=ub(r.ubigeo);if(/^\d{6}$/.test(code))byUb.set(code,(byUb.get(code)||0)+n);const dep=String(r.departamento||'Sin departamento');byDep.set(dep,(byDep.get(dep)||0)+n);}
 lastRows=rows;
 $('detalle-mapa').textContent=`${fmt(sum)} registros · ${desde}–${hasta} · ${byUb.size} ubigeos con datos. ${geoError||'Colores relativos por quintiles de distritos con registros.'}`;
 $('mapa-caption').textContent=`Registros filtrados por territorio · ${desde}–${hasta}`;
 const body=$('tabla-mapa');body.replaceChildren();
 for(const [dep,n] of [...byDep].sort((a,b)=>b[1]-a[1])){const tr=document.createElement('tr');for(const val of [dep,fmt(n),`${desde}–${hasta}`]){const td=document.createElement('td');td.textContent=val;tr.append(td);}const td=document.createElement('td'),b=document.createElement('button');b.type='button';b.className='boton secundario';b.textContent='Elegir';b.addEventListener('click',()=>{const opts=[...$('mapa-departamento').options];const target=opts.find(o=>norm(o.value)===norm(dep)||norm(dep)==='LIMA METROPOLITANA'&&norm(o.value)==='LIMA');if(target){$('mapa-departamento').value=target.value;buildTerritory();load();}});td.append(b);tr.append(td);body.append(tr);}
 if(!rows.length){const tr=document.createElement('tr'),td=document.createElement('td');td.colSpan=4;td.textContent='Sin datos disponibles para esta selección.';tr.append(td);body.append(tr);}
 if(!map)return;
 markers.clearLayers();if(geoLayer){map.removeLayer(geoLayer);geoLayer=null;}
 if(!geoFeatures){$('aviso-calor').textContent='No se cargó la cartografía distrital. '+geoError;return;}
 const counts=[...byUb.values()].filter(n=>n>0).sort((a,b)=>a-b),cuts=[.2,.4,.6,.8].map(q=>quantile(counts,q));
 const matched=new Set();const displayed=[];
 geoLayer=L.geoJSON(geoFeatures,{filter:f=>{const code=ub(f.properties?.ubigeo);const yes=byUb.has(code);if(yes)matched.add(code);return yes;},style:f=>{const n=byUb.get(ub(f.properties?.ubigeo))||0;const level=cuts.filter(c=>n>c).length;return {color:'#384c5b',weight:.5,fillColor:colors[level],fillOpacity:.76};},onEachFeature:(f,layer)=>{const pr=f.properties||{},n=byUb.get(ub(pr.ubigeo))||0;layer.bindPopup(`${String(pr.nombre||'Distrito')} · ubigeo ${ub(pr.ubigeo)}: ${fmt(n)} registros`);layer.on('mouseover',()=>layer.setStyle({weight:2,fillOpacity:.92}));layer.on('mouseout',()=>geoLayer&&geoLayer.resetStyle(layer));displayed.push(layer);}});
 $('aviso-calor').textContent=`Distritos representados: ${matched.size} de ${byUb.size} ubigeos con registros. ${byUb.size-matched.size} sin coincidencia cartográfica. Intensidad por quintiles de los distritos con datos, no localización de incidentes.`;
 for(const l of displayed){const c=l.getBounds().getCenter(),n=byUb.get(ub(l.feature.properties.ubigeo));L.circleMarker(c,{radius:5,color:'#1d3342',fillColor:'#fff',fillOpacity:.95,weight:1}).bindPopup(`${l.feature.properties.nombre}: ${fmt(n)} registros`).addTo(markers);}
 showLayer(layer);
 if(displayed.length){const bounds=geoLayer.getBounds();if(bounds.isValid())map.fitBounds(bounds.pad(.12),{maxZoom:11});}
}
function showLayer(v){layer=v;document.querySelectorAll('[data-mapa-capa]').forEach(b=>{b.setAttribute('aria-pressed',String(b.dataset.mapaCapa===v));b.classList.toggle('activo',b.dataset.mapaCapa===v);});if(!map)return;if(map.hasLayer(markers))map.removeLayer(markers);if(geoLayer&&map.hasLayer(geoLayer))map.removeLayer(geoLayer);if(v==='calor'&&geoLayer)geoLayer.addTo(map);else markers.addTo(map);}
async function loadGeo(){try{const r=await fetch(GEO_URL);if(!r.ok)throw Error('HTTP '+r.status);const j=await r.json();if(!Array.isArray(j.features))throw Error('GeoJSON inválido');geoFeatures=j;geoError='';}catch(e){geoError='Cartografía no disponible: '+e.message;console.warn(geoError);}}
async function loadCatalogue(){try{const base='https://raw.githubusercontent.com/RitchieRD/ubigeos-peru-data/main/json/';const data=await Promise.all(['1_ubigeo_departamentos.json','2_ubigeo_provincias.json','3_ubigeo_distritos.json'].map(async name=>{const r=await fetch(base+name);if(!r.ok)throw Error('Catálogo no disponible');return r.json();}));const ds=data[0].ubigeo_departamentos||[],ps=data[1].ubigeo_provincias||[],xs=data[2].ubigeo_distritos||[];const dmap=new Map(ds.map(d=>[String(d.id),d.departamento])),pmap=new Map(ps.map(p=>[String(p.id),{departamento:dmap.get(String(p.departamento_id)),provincia:p.provincia}]));catalogue=xs.map(d=>({...pmap.get(String(d.provincia_id)),distrito:d.distrito})).filter(r=>r.departamento&&r.provincia);$('mapa-departamento').replaceChildren(...['Todos',...[...new Set(catalogue.map(r=>r.departamento))].sort()].map(x=>new Option(x,x)));$('mapa-departamento').value='Todos';buildTerritory();$('mapa-provincia').disabled=false;$('mapa-distrito').disabled=false;document.querySelector('[data-catalogo-status]').textContent=`Catálogo cargado: ${ds.length} departamentos, ${ps.length} provincias y ${xs.length} distritos.`;}catch(e){document.querySelector('[data-catalogo-status]').textContent='No se pudo cargar el catálogo territorial. Se muestran los departamentos disponibles.';select('mapa-departamento',['Todos',...Object.keys(coordenadas)]);select('mapa-provincia',['Todos']);select('mapa-distrito',['Todos']);}}
document.addEventListener('DOMContentLoaded',async()=>{
if(typeof L!=='undefined'){map=L.map('mapa-geografico',{scrollWheelZoom:false}).setView([-9.19,-75.015],5);L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'© OpenStreetMap',maxZoom:18}).addTo(map);markers=L.layerGroup();if(typeof L.heatLayer==='function')heat=L.heatLayer([],{radius:34,blur:24,minOpacity:.25,gradient:{0:'#35a853',.25:'#a5d94b',.5:'#f4df48',.75:'#f49b37',1:'#d83b37'}});}
await Promise.all([loadCatalogue(),loadGeo()]);$('mapa-departamento').addEventListener('change',()=>{buildTerritory();load();});$('mapa-provincia').addEventListener('change',()=>{buildDistrict();load();});$('mapa-distrito').addEventListener('change',load);$('mapa-indicador').addEventListener('change',load);
for(const id of ['mapa-periodo-anio','mapa-periodo-inicio','mapa-periodo-fin'])$(id).addEventListener('change',load);
$('mapa-periodo-modo').addEventListener('change',()=>{const range=$('mapa-periodo-modo').value==='rango';$('mapa-periodo-unico-caja').hidden=range;$('mapa-periodo-inicio-caja').hidden=!range;$('mapa-periodo-fin-caja').hidden=!range;load();});
document.querySelectorAll('[data-mapa-capa]').forEach(b=>b.addEventListener('click',()=>showLayer(b.dataset.mapaCapa)));
$('mapa-consultar').addEventListener('click',load);$('mapa-restablecer').addEventListener('click',()=>{for(const id of ['mapa-departamento','mapa-provincia','mapa-distrito'])$(id).value='Todos';$('mapa-indicador').value='denuncias';$('mapa-periodo-modo').value='unico';$('mapa-periodo-anio').value='2025';$('mapa-periodo-modo').dispatchEvent(new Event('change'));load();});
$('mapa-busqueda').addEventListener('input',e=>{const q=norm(e.target.value);if(q.includes('ROBO'))$('mapa-indicador').value='robos';else if(q.includes('HURTO'))$('mapa-indicador').value='hurtos';else if(q.includes('EXTORS'))$('mapa-indicador').value='extorsion';else if(q.includes('HOMIC'))$('mapa-indicador').value='homicidios';});
const q=new URLSearchParams(location.search);if(q.has('departamento')){const dep=q.get('departamento');if([...$('mapa-departamento').options].some(o=>o.value===dep)){$('mapa-departamento').value=dep;buildTerritory();}const prov=q.get('provincia');if(prov&&[...$('mapa-provincia').options].some(o=>o.value===prov)){$('mapa-provincia').value=prov;buildDistrict();}const dist=q.get('distrito');if(dist&&[...$('mapa-distrito').options].some(o=>o.value===dist))$('mapa-distrito').value=dist;}if(q.has('indicador'))$('mapa-indicador').value=q.get('indicador');if(q.has('desde')&&q.has('hasta')){$('mapa-periodo-modo').value='rango';$('mapa-periodo-inicio').value=q.get('desde');$('mapa-periodo-fin').value=q.get('hasta');$('mapa-periodo-unico-caja').hidden=true;$('mapa-periodo-inicio-caja').hidden=false;$('mapa-periodo-fin-caja').hidden=false;}await load();
});
