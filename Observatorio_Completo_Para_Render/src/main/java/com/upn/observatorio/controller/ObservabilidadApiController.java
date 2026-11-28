package com.upn.observatorio.controller;

import com.upn.observatorio.service.ObservabilidadService;
import com.upn.observatorio.service.ObservabilidadService.RegistroImportado;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import jakarta.servlet.http.HttpServletRequest;
import java.util.*;

@RestController
public class ObservabilidadApiController {
 private static final Set<String> FRONT=Set.of("consulta_indicador","aplicar_filtro","descargar_datos");
 private final ObservabilidadService service; private final JdbcTemplate db;
 @Value("${observatorio.ga4.measurement-id:G-NLDXNKD0T1}") private String ga4Id;
 public ObservabilidadApiController(ObservabilidadService service,JdbcTemplate db){this.service=service;this.db=db;}
 public record FrontEvent(String event){}
 @GetMapping("/api/observabilidad/config") public Map<String,String> config(){return Map.of("ga4MeasurementId",ga4Id==null?"":ga4Id.trim());}
 @PostMapping("/api/observabilidad/evento") public Map<String,Object> frontend(@RequestBody FrontEvent body,HttpServletRequest request){
  if(body==null||!FRONT.contains(body.event()))throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Evento no permitido");
  service.registrar("frontend",body.event(),"ok",request.getHeader("X-Request-ID"),null);return Map.of("ok",true);
 }
 @GetMapping("/admin/api/observabilidad") public Map<String,Object> dashboard(){
  var rows=db.queryForList("SELECT fuente,tipo_evento,resultado,count(*) AS cantidad,COALESCE(AVG(duracion_ms),0)::bigint AS duracion_media_ms FROM public.obs_telemetria_eventos WHERE fecha_evento>=now()-interval '30 days' GROUP BY fuente,tipo_evento,resultado ORDER BY fuente,tipo_evento,resultado");
  Map<String,Object> totals=new LinkedHashMap<>();Map<String,Object> charts=new LinkedHashMap<>();
  for(String source:List.of("frontend","server","backend","database")){var items=rows.stream().filter(r->source.equals(r.get("fuente"))).toList();totals.put(source,items.stream().mapToLong(r->((Number)r.get("cantidad")).longValue()).sum());charts.put(source,items);}
  return Map.of("totales",totals,"graficos",charts,"periodo","Últimos 30 días");
 }
 @PostMapping("/admin/api/observabilidad/importar") public Map<String,Object> importar(@RequestBody List<RegistroImportado> records){
  if(records==null||records.size()>1000)throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Se permiten hasta 1000 eventos por carga");
  return Map.of("importados",service.importar(records));
 }
}
