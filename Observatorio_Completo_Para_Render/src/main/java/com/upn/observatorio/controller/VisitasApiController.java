package com.upn.observatorio.controller;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;
import java.util.*;
@RestController
public class VisitasApiController {
 private final JdbcTemplate db;
 public VisitasApiController(JdbcTemplate db){this.db=db;}
 public record Pulse(UUID session,String path,boolean navigation){}
 @PostMapping("/api/visitas/pulso") public Map<String,Boolean> pulso(@RequestBody Pulse p){
  if(p.session()==null||p.path()==null||p.path().length()>120||!p.path().startsWith("/")||p.path().contains("?"))throw new IllegalArgumentException("Datos inválidos");
  int n=db.update("UPDATE public.obs_visitas SET pagina_actual=?, ultima_actividad_en=now(), finalizada_en=NULL WHERE id_visita=?",p.path(),p.session());
  if(n==0){db.update("INSERT INTO public.obs_visitas(id_visita,pagina_actual) VALUES (?,?) ON CONFLICT(id_visita) DO UPDATE SET pagina_actual=EXCLUDED.pagina_actual,ultima_actividad_en=now()",p.session(),p.path());}
  if(p.navigation())db.update("INSERT INTO public.obs_eventos_navegacion(id_visita,pagina,tipo_evento) VALUES (?,?,?)",p.session(),p.path(),n==0?"entrada":"cambio_pagina");
  return Map.of("ok",true);
 }
 @GetMapping("/admin/api/visitas") public Map<String,Object> resumen(){
  Long activos=db.queryForObject("SELECT count(*) FROM public.obs_visitas WHERE ultima_actividad_en>now()-interval '2 minutes'",Long.class);
  Long hoy=db.queryForObject("SELECT count(*) FROM public.obs_visitas WHERE iniciada_en>=date_trunc('day',now())",Long.class);
  Long paginas=db.queryForObject("SELECT count(*) FROM public.obs_eventos_navegacion WHERE tipo_evento IN ('entrada','cambio_pagina')",Long.class);
  var rutas=db.queryForList("SELECT pagina_actual AS path,count(*) AS sesiones,count(*) FILTER(WHERE ultima_actividad_en<=now()-interval '2 minutes') AS inactivas FROM public.obs_visitas GROUP BY pagina_actual ORDER BY sesiones DESC LIMIT 20");
  var recientes=db.queryForList("SELECT id_visita::text AS sesion, pagina_actual AS ruta, iniciada_en AS inicio, ultima_actividad_en AS ultima_actividad, EXTRACT(EPOCH FROM (ultima_actividad_en-iniciada_en))::bigint AS duracion_segundos, (ultima_actividad_en>now()-interval '2 minutes') AS activa FROM public.obs_visitas ORDER BY ultima_actividad_en DESC LIMIT 100");
  Long totalDia=db.queryForObject("SELECT count(*) FROM public.obs_visitas WHERE iniciada_en >= date_trunc('day',now())",Long.class);
  Long acumulado=db.queryForObject("SELECT count(*) FROM public.obs_visitas",Long.class);
  Long segundos=db.queryForObject("SELECT COALESCE(AVG(EXTRACT(EPOCH FROM (ultima_actividad_en-iniciada_en)))::bigint,0) FROM public.obs_visitas WHERE ultima_actividad_en > iniciada_en",Long.class);
  var rutasDia=db.queryForList("SELECT pagina_actual AS path, count(*) AS sesiones, count(*) FILTER (WHERE ultima_actividad_en<=now()-interval '2 minutes') AS inactivas FROM public.obs_visitas WHERE iniciada_en >= date_trunc('day',now()) GROUP BY pagina_actual ORDER BY sesiones DESC");
  Map<String,Object> result=new LinkedHashMap<>();
  result.put("activos",activos);result.put("hoy",hoy);result.put("paginas",paginas);result.put("rutas",rutas);
  result.put("acumulado",acumulado);result.put("promedioSegundos",segundos);result.put("sesionesRecientes",recientes);result.put("rutasHoy",rutasDia);result.put("totalDia",totalDia);
  return result;
 }
}
