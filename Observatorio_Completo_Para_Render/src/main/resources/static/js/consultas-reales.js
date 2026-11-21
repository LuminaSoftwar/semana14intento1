(()=>{'use strict';
const $=id=>document.getElementById(id), form=$('consulta-real');if(!form)return;
const opts=(sel,arr)=>{sel.innerHTML='';arr.forEach(v=>{const o=document.createElement('option');o.value=String(v.value??v);o.textContent=String(v.label??v);sel.appendChild(o)})};
const all=[{value:'Todos',label:'Todos'}];let departamentos=[],provincias=[],distritos=[],last=null;
const field=(row,...names)=>{for(const n of names)if(row[n]!==undefined)return row[n];return ''};
async function catalogo(){try{
const base='https://raw.githubusercontent.com/RitchieRD/ubigeos-peru-data/main/json/';
const names=['1_ubigeo_departamentos.json','2_ubigeo_provincias.json','3_ubigeo_distritos.json'];
const data=await Promise.all(names.map(async n=>{const r=await fetch(base+n);if(!r.ok)throw Error('Catálogo territorial no disponible');return r.json()}));
departamentos=data[0].ubigeo_departamentos||[];provincias=data[1].ubigeo_provincias||[];distritos=data[2].ubigeo_distritos||[];
opts($('departamento'),[...all,...departamentos.map(d=>d.departamento).sort()]);actualizarProvincias();
}catch(e){$('estado').textContent='No se pudo cargar el catálogo territorial: '+e.message}}
function actualizarProvincias(){const d=$('departamento').value;const ids=new Set(departamentos.filter(x=>d==='Todos'||x.departamento===d).map(x=>Number(x.id)));
opts($('provincia'),[...all,...new Set(provincias.filter(x=>ids.has(Number(x.departamento_id))).map(x=>x.provincia))].sort());actualizarDistritos()}
function actualizarDistritos(){const d=$('departamento').value,p=$('provincia').value;const ids=new Set(departamentos.filter(x=>d==='Todos'||x.departamento===d).map(x=>Number(x.id)));
const pids=new Set(provincias.filter(x=>ids.has(Number(x.departamento_id))&&(p==='Todos'||x.provincia===p)).map(x=>Number(x.id)));
opts($('distrito'),[...all,...new Set(distritos.filter(x=>pids.has(Number(x.provincia_id))).map(x=>x.distrito))].sort())}
$('departamento').addEventListener('change',actualizarProvincias);$('provincia').addEventListener('change',actualizarDistritos);
opts($('mes'),[{value:0,label:'Todos'},...['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'].map((label,i)=>({value:i+1,label}))]);
$('agrupar').value=form.dataset.defaultGroup||'anio';
$('indicador').addEventListener('change',()=>{const h=$('indicador').value==='homicidios';$('mes').disabled=h;if(h){$('mes').value='0';if($('agrupar').value==='mes')$('agrupar').value='anio'}});
form.addEventListener('submit',async e=>{e.preventDefault();$('estado').textContent='Consultando Supabase…';$('descargar').disabled=true;const q=new URLSearchParams();for(const id of ['indicador','desde','hasta','mes','departamento','provincia','distrito','agrupar'])q.set(id,$(id).value);
try{const r=await fetch('/api/consultas/datos?'+q);if(!r.ok){const t=await r.text();throw Error('HTTP '+r.status+' '+t.slice(0,180))}last={...(await r.json()),filters:Object.fromEntries(q)};const body=$('filas');body.replaceChildren();for(const row of last.filas){const tr=document.createElement('tr');for(const key of ['etiqueta','cantidad']){const td=document.createElement('td');td.textContent=String(row[key]??'');tr.appendChild(td)}body.appendChild(tr)}$('col-etiqueta').textContent=last.agrupacion;$('total').textContent='Total: '+Number(last.total).toLocaleString('es-PE');$('fuente').textContent='Fuente: '+last.fuente+'. '+last.nota;$('estado').textContent=last.filas.length?'Consulta completada. '+last.filas.length+' grupos encontrados.':'Sin datos disponibles para esta selección.';$('descargar').disabled=!last.filas.length;
}catch(err){$('estado').textContent='Error al consultar: '+err.message}});
$('descargar').addEventListener('click',()=>{if(!last)return;const quote=v=>'"'+String(v??'').replaceAll('"','""')+'"';const rows=[['agrupacion','etiqueta','cantidad','indicador','desde','hasta','mes','departamento','provincia','distrito','fuente'],...last.filas.map(r=>[last.agrupacion,r.etiqueta,r.cantidad,...['indicador','desde','hasta','mes','departamento','provincia','distrito'].map(k=>last.filters[k]),last.fuente])];const csv='\uFEFF'+rows.map(r=>r.map(quote).join(',')).join('\r\n');const blob=new Blob([csv],{type:'text/csv;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='observatorio_'+last.filters.indicador+'_'+last.agrupacion+'.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)});
catalogo();})();
