package com.upn.observatorio.controller;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.*;
import com.upn.observatorio.service.ObservabilidadService;
import jakarta.servlet.http.HttpServletRequest;
import java.util.*;

@RestController
@RequestMapping("/api/consultas")
public class ConsultasRealesApiController {
 private final JdbcTemplate db; private final ObservabilidadService observabilidad;
 public ConsultasRealesApiController(JdbcTemplate db,ObservabilidadService observabilidad){this.db=db;this.observabilidad=observabilidad;}
 @GetMapping("/datos")
 public Map<String,Object> consultar(@RequestParam(defaultValue="denuncias") String indicador,
  @RequestParam(defaultValue="2022") int desde,@RequestParam(defaultValue="2025") int hasta,
  @RequestParam(defaultValue="Todos") String departamento,@RequestParam(defaultValue="Todos") String provincia,
  @RequestParam(defaultValue="Todos") String distrito,@RequestParam(defaultValue="0") int mes,
  @RequestParam(defaultValue="anio") String agrupar,HttpServletRequest request){
  long started=System.nanoTime(); String rid=request.getHeader("X-Request-ID"); observabilidad.registrar("backend","consulta_iniciada","iniciada",rid,null);
  try {
  if(desde<2022||hasta>2025||desde>hasta)throw new IllegalArgumentException("Periodo fuera de rango");
  if(mes<0||mes>12)throw new IllegalArgumentException("Mes inválido");
  if(!Set.of("denuncias","robos","hurtos","extorsion","homicidios").contains(indicador))throw new IllegalArgumentException("Indicador inválido");
  if(!Set.of("anio","mes","departamento","provincia","distrito").contains(agrupar))throw new IllegalArgumentException("Agrupación inválida");
  boolean hom=indicador.equals("homicidios");
  if(hom&&mes!=0)throw new IllegalArgumentException("Los homicidios INEI disponibles son anuales; no existe desglose mensual verificado");
  String tabla=hom?"public.obs_homicidios_inei":"public.obs_denuncias_policiales";
  List<Object> args=new ArrayList<>();
  StringBuilder where=new StringBuilder(" WHERE anio BETWEEN ? AND ?");args.add(desde);args.add(hasta);
  if(!departamento.equalsIgnoreCase("Todos")&&!departamento.isBlank()){if(departamento.equalsIgnoreCase("Lima")){where.append(" AND (UPPER(TRIM(departamento)) IN ('LIMA','LIMA METROPOLITANA','REGION LIMA','REGIÓN LIMA','LIMA PROVINCIAS'))");}else{where.append(" AND UPPER(TRIM(departamento))=UPPER(TRIM(?))");args.add(departamento);}}
  if(!provincia.equals("Todos")&&!provincia.isBlank()){where.append(" AND UPPER(TRIM(provincia))=UPPER(TRIM(?))");args.add(provincia);}
  if(!distrito.equals("Todos")&&!distrito.isBlank()){where.append(" AND UPPER(TRIM(distrito))=UPPER(TRIM(?))");args.add(distrito);}
  if(!hom){
   if(mes>0){where.append(" AND mes=?");args.add(mes);}
   if(indicador.equals("robos"))where.append(" AND LOWER(modalidad) LIKE '%robo%'");
   if(indicador.equals("hurtos"))where.append(" AND LOWER(modalidad) LIKE '%hurto%'");
   if(indicador.equals("extorsion"))where.append(" AND (LOWER(modalidad) LIKE '%extorsi%' OR LOWER(modalidad) LIKE '%extorci%')");
  }
  String campo=agrupar.equals("mes")?(hom?"anio":"mes"):agrupar;
  String sql="SELECT "+campo+" AS etiqueta, SUM(cantidad) AS cantidad FROM "+tabla+where+" GROUP BY "+campo+" ORDER BY "+(agrupar.equals("anio")||agrupar.equals("mes")?"etiqueta":"cantidad DESC")+" LIMIT 2000";
  List<Map<String,Object>> filas=db.queryForList(sql,args.toArray());
  Long totalReal=db.queryForObject("SELECT COALESCE(SUM(cantidad),0) FROM "+tabla+where,Long.class,args.toArray());
  Map<String,Object> out=new LinkedHashMap<>();out.put("filas",filas);out.put("fuente",hom?"INEI/CEIC - homicidios anuales":"SIDPOL - denuncias policiales");out.put("agrupacion",campo);out.put("indicador",indicador);out.put("total",totalReal==null?0:totalReal);observabilidad.registrar("backend","consulta_exitosa","ok",rid,(System.nanoTime()-started)/1_000_000);
  out.put("nota",hom?"Homicidios anuales con desglose territorial disponible; 2025 nacional preliminar no se desagrega por distrito.":"Suma de denuncias registradas según los filtros seleccionados.");return out;
  } catch(IllegalArgumentException ex){observabilidad.registrar("backend","validacion_fallida","rechazada",rid,(System.nanoTime()-started)/1_000_000); throw new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.BAD_REQUEST,ex.getMessage());}
 }
}
