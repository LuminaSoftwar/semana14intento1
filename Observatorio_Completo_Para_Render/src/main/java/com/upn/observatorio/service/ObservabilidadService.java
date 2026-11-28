package com.upn.observatorio.service;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.dao.DataAccessException;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.time.OffsetDateTime;
import java.util.*;

@Service
public class ObservabilidadService {
 private static final Logger log=LoggerFactory.getLogger(ObservabilidadService.class);
 private final JdbcTemplate db;
 public ObservabilidadService(JdbcTemplate db){this.db=db;}
 public void registrar(String source,String event,String status,String requestId,Long durationMs){
  log.info("observability source={} event={} result={} requestId={}",source,event,status,limitar(requestId,80));
  try { db.update("INSERT INTO public.obs_telemetria_eventos(fuente,tipo_evento,resultado,request_id,duracion_ms,fecha_evento) VALUES (?,?,?,?,?,now())",
    source,event,status,limitar(requestId,80),durationMs); } catch(DataAccessException ex) { log.warn("telemetry persistence unavailable: {}",ex.getClass().getSimpleName()); }
 }
 public int importar(List<RegistroImportado> records){int n=0;for(var r:records){
  if(r==null||!Set.of("server","database").contains(r.source())||r.event()==null||r.event().isBlank()||r.event().length()>80)continue;
  String status=r.status()==null?"observado":limitar(r.status(),40);
  Long ms=r.duration_ms(); if(ms!=null&&(ms<0||ms>86_400_000))ms=null;
  OffsetDateTime at=r.timestamp()==null?null:r.timestamp();
  n+=db.update("INSERT INTO public.obs_telemetria_eventos(fuente,tipo_evento,resultado,request_id,duracion_ms,fecha_evento,importado) VALUES (?,?,?,?,?,COALESCE(?,now()),true) ON CONFLICT DO NOTHING",r.source(),r.event(),status,limitar(r.request_id(),80),ms,at);
 }return n;}
 private String limitar(String s,int n){return s==null?null:s.substring(0,Math.min(n,s.length()));}
 public record RegistroImportado(String source,String event,String status,OffsetDateTime timestamp,Long duration_ms,String request_id){}
}
