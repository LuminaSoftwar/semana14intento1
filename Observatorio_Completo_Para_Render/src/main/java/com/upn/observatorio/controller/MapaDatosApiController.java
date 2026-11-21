package com.upn.observatorio.controller;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;
import java.util.*;
@RestController
@RequestMapping("/api/mapa")
public class MapaDatosApiController {
 private final JdbcTemplate db;
 public MapaDatosApiController(JdbcTemplate db){this.db=db;}
 @GetMapping("/datos") public List<Map<String,Object>> datos(@RequestParam(defaultValue="2025") int desde,@RequestParam(defaultValue="2025") int hasta,@RequestParam(defaultValue="denuncias") String indicador,@RequestParam(defaultValue="Todos") String departamento,@RequestParam(defaultValue="Todos") String provincia,@RequestParam(defaultValue="Todos") String distrito){
  if(desde<2022||hasta>2025||desde>hasta)throw new IllegalArgumentException("Periodo inválido");
  if(!Set.of("denuncias","robos","hurtos","extorsion","homicidios").contains(indicador))throw new IllegalArgumentException("Indicador inválido");
  List<Object> args=new ArrayList<>();StringBuilder where=new StringBuilder(" WHERE anio BETWEEN ? AND ? ");args.add(desde);args.add(hasta);
  if(!departamento.equals("Todos")){
   if(departamento.equalsIgnoreCase("Lima"))where.append(" AND (UPPER(TRIM(departamento)) IN ('LIMA','LIMA METROPOLITANA','REGION LIMA','REGIÓN LIMA'))");
   else {where.append(" AND UPPER(TRIM(departamento))=UPPER(TRIM(?))");args.add(departamento);}
  }
  if(!provincia.equals("Todos")){where.append(" AND UPPER(TRIM(provincia))=UPPER(TRIM(?))");args.add(provincia);}
  if(!distrito.equals("Todos")){where.append(" AND UPPER(TRIM(distrito))=UPPER(TRIM(?))");args.add(distrito);}
  String tabla=indicador.equals("homicidios")?"public.obs_homicidios_inei":"public.obs_denuncias_policiales";
  if(indicador.equals("robos")){where.append(" AND (LOWER(modalidad) LIKE '%robo%' OR LOWER(modalidad) LIKE '%robos%')");}
  if(indicador.equals("hurtos")){where.append(" AND LOWER(modalidad) LIKE '%hurto%'");}
  if(indicador.equals("extorsion")){where.append(" AND (LOWER(modalidad) LIKE '%extorsi%' OR LOWER(modalidad) LIKE '%extorci%')");}
  return db.queryForList("SELECT ubigeo,departamento,provincia,distrito,SUM(cantidad) AS cantidad FROM "+tabla+where+" GROUP BY ubigeo,departamento,provincia,distrito ORDER BY cantidad DESC LIMIT 5000",args.toArray());
 }
}
