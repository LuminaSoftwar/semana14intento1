package com.upn.observatorio.controller;

import org.springframework.http.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.security.core.Authentication;
import org.apache.commons.csv.*;
import java.io.*;
import java.nio.charset.StandardCharsets;
import java.util.*;

@RestController
@RequestMapping("/admin/api")
public class AdminDatosApiController {
 private final JdbcTemplate db;
 public AdminDatosApiController(JdbcTemplate db){this.db=db;}
 private static final List<String> C=List.of("anio","mes","departamento","provincia","distrito","ubigeo","modalidad","cantidad");
 private static final Set<String> TABLES=Set.of("obs_denuncias_policiales","obs_homicidios_inei","obs_homicidios_nacional");
 private void audit(String actor,String action,String detail){
  String accion=switch(action){case "CREATE"->"crear";case "UPDATE"->"editar";case "DELETE"->"eliminar";case "IMPORT"->"importar";default->"editar";};
  db.update("INSERT INTO public.obs_auditoria_admin(administrador,accion,tabla_afectada,clave_registro) VALUES (?,?,?,CAST(? AS jsonb))",actor,accion,"obs_denuncias_policiales","{}");
 }
 private String table(String s){if(!TABLES.contains(s))throw new IllegalArgumentException("Tabla no autorizada");return s;}
 private void validate(Map<String,String> r){
  for(String c:C)if(!r.containsKey(c)||r.get(c)==null||r.get(c).isBlank())throw new IllegalArgumentException("Falta columna o valor: "+c);
  int year=Integer.parseInt(r.get("anio")),month=Integer.parseInt(r.get("mes")),n=Integer.parseInt(r.get("cantidad"));
  if(year<2000||year>2100||month<1||month>12||n<0)throw new IllegalArgumentException("Año, mes o cantidad fuera de rango");
  if(!r.get("ubigeo").matches("[0-9]{6}"))throw new IllegalArgumentException("Ubigeo debe tener seis dígitos");
  if(r.values().stream().anyMatch(v->v!=null&&v.length()>250))throw new IllegalArgumentException("Texto demasiado largo");
  // El UBIGEO debe coincidir con una ubicación existente en los datos oficiales o el catálogo territorial.
  // La validación de ubicaciones sin registros requiere catálogo UBIGEO propio en servidor.

 }
 private void insert(Map<String,String> r){db.update("INSERT INTO public.obs_denuncias_policiales(anio,mes,departamento,provincia,distrito,ubigeo,modalidad,cantidad) VALUES (?,?,?,?,?,?,?,?)",Integer.parseInt(r.get("anio")),Integer.parseInt(r.get("mes")),r.get("departamento"),r.get("provincia"),r.get("distrito"),r.get("ubigeo"),r.get("modalidad"),Integer.parseInt(r.get("cantidad")));}
 @GetMapping("/datos") public List<Map<String,Object>> datos(@RequestParam(defaultValue="obs_denuncias_policiales") String tabla,@RequestParam(defaultValue="0") int offset){return db.queryForList("SELECT * FROM public."+table(tabla)+" LIMIT 100 OFFSET ?",Math.max(0,offset));}
 @PostMapping("/registro") public Map<String,Object> crear(@RequestBody Map<String,String> row,Authentication auth){validate(row);insert(row);audit(auth.getName(),"CREATE","Denuncia "+row.get("ubigeo")+" / "+row.get("anio"));return Map.of("ok",true);}
 @PutMapping("/registro") public Map<String,Object> editar(@RequestBody Map<String,Map<String,String>> payload,Authentication auth){
  Map<String,String> old=payload.get("anterior"),row=payload.get("nuevo");validate(old);validate(row);
  int n=db.update("UPDATE public.obs_denuncias_policiales SET anio=?,mes=?,departamento=?,provincia=?,distrito=?,ubigeo=?,modalidad=?,cantidad=? WHERE anio=? AND mes=? AND ubigeo=? AND modalidad=? AND departamento=? AND provincia=? AND distrito=?",Integer.parseInt(row.get("anio")),Integer.parseInt(row.get("mes")),row.get("departamento"),row.get("provincia"),row.get("distrito"),row.get("ubigeo"),row.get("modalidad"),Integer.parseInt(row.get("cantidad")),Integer.parseInt(old.get("anio")),Integer.parseInt(old.get("mes")),old.get("ubigeo"),old.get("modalidad"),old.get("departamento"),old.get("provincia"),old.get("distrito"));
  if(n>0)audit(auth.getName(),"UPDATE",old.toString()+" -> "+row.toString());return Map.of("updated",n);
 }
 @DeleteMapping("/registro") public Map<String,Object> eliminar(@RequestBody Map<String,String> row,Authentication auth){validate(row);
  int n=db.update("DELETE FROM public.obs_denuncias_policiales WHERE anio=? AND mes=? AND ubigeo=? AND modalidad=? AND departamento=? AND provincia=? AND distrito=?",Integer.parseInt(row.get("anio")),Integer.parseInt(row.get("mes")),row.get("ubigeo"),row.get("modalidad"),row.get("departamento"),row.get("provincia"),row.get("distrito"));
  if(n>0)audit(auth.getName(),"DELETE",row.toString());return Map.of("deleted",n);
 }
 @PostMapping("/importar") public ResponseEntity<?> importar(@RequestParam("archivo") MultipartFile file,@RequestParam(defaultValue="false") boolean confirmar,Authentication auth)throws IOException{
  if(file.isEmpty()||file.getSize()>8_000_000)return ResponseEntity.badRequest().body(Map.of("error","CSV vacío o mayor de 8 MB"));
  List<Map<String,String>> valid=new ArrayList<>();List<String> errors=new ArrayList<>();
  try(Reader reader=new InputStreamReader(file.getInputStream(),StandardCharsets.UTF_8);CSVParser parser=CSVFormat.DEFAULT.builder().setHeader().setSkipHeaderRecord(true).setIgnoreSurroundingSpaces(true).get().parse(reader)){
   if(!parser.getHeaderMap().keySet().containsAll(C))return ResponseEntity.badRequest().body(Map.of("error","Columnas requeridas: "+String.join(",",C)));
   for(CSVRecord record:parser){if(valid.size()+errors.size()>10000){errors.add("Máximo 10 000 filas por archivo");break;}
    try{Map<String,String> row=new LinkedHashMap<>();for(String c:C)row.put(c,record.get(c));validate(row);valid.add(row);}catch(Exception ex){errors.add("Fila "+record.getRecordNumber()+": "+ex.getMessage());}
   }
  }catch(Exception ex){return ResponseEntity.badRequest().body(Map.of("error","CSV inválido: "+ex.getMessage()));}
  if(!errors.isEmpty())return ResponseEntity.badRequest().body(Map.of("validas",valid.size(),"errores",errors.subList(0,Math.min(30,errors.size())),"mensaje","No se importó ninguna fila"));
  if(!confirmar)return ResponseEntity.ok(Map.of("validas",valid.size(),"errores",0,"mensaje","Validación correcta. Confirma para importar."));
  // Todas las filas ya fueron validadas; la operación se ejecuta dentro de una transacción.
  new org.springframework.transaction.support.TransactionTemplate(new org.springframework.jdbc.datasource.DataSourceTransactionManager(Objects.requireNonNull(db.getDataSource()))).execute(status->{for(Map<String,String> row:valid)insert(row);audit(auth.getName(),"IMPORT","filas="+valid.size());
   db.update("INSERT INTO public.obs_importaciones(archivo_nombre,tabla_destino,administrador,estado,finalizada_en,filas_totales,filas_validas,filas_insertadas) VALUES (?,?,?,?,now(),?,?,?)",file.getOriginalFilename()==null?"archivo.csv":file.getOriginalFilename(),"obs_denuncias_policiales",auth.getName(),"completada",valid.size(),valid.size(),valid.size());return null;});
  return ResponseEntity.ok(Map.of("importadas",valid.size()));
 }
 @GetMapping("/auditoria") public List<Map<String,Object>> auditoria(){return db.queryForList("SELECT administrador AS actor,accion AS action,tabla_afectada AS detail,ocurrido_en AS created_at FROM public.obs_auditoria_admin ORDER BY ocurrido_en DESC LIMIT 100");}
}
