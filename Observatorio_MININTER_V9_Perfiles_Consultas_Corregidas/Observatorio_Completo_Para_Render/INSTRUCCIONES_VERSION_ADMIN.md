# Observatorio MININTER – versión administrativa

## Configuración obligatoria

1. En Supabase > SQL Editor ejecuta `database/02_admin_y_visitas.sql` **una sola vez**. Este script crea únicamente tablas nuevas para auditoría y actividad de visitantes. No elimina datos.
2. En Render configura `SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME` y `SPRING_DATASOURCE_PASSWORD` (credenciales del pooler PostgreSQL), además de `ADMIN_USERNAME` y `ADMIN_PASSWORD` (credenciales distintas para el administrador). La conexión JDBC **sí se usa ahora** en los nuevos endpoints administrativos y de visitas.
3. Despliega como Docker. Si `Dockerfile`, `pom.xml` y `src` están en la carpeta `Observatorio_Completo_Para_Render`, establece Root Directory a esa carpeta, Dockerfile Path a `Observatorio_Completo_Para_Render/Dockerfile` y Docker Build Context a `Observatorio_Completo_Para_Render` (los dos últimos relativos a la raíz del repositorio).
4. Entra a `/login`, luego a `/admin`. El dashboard público permanece en `/dashboard`.

## Funcionalidades incorporadas

- Dashboard público: CSV de distribución por delito, evolución mensual/comparación anual, comparación por distrito y registros filtrados. Los archivos reflejan los filtros generales y específicos, y las cifras proceden de los registros SIDPOL consultados desde Supabase.
- Panel administrativo: visitantes activos aproximados (últimos 2 minutos), sesiones del día, páginas vistas, última ruta conocida; historial de acciones.
- Gestión de **denuncias SIDPOL**: alta individual, modificación, eliminación, importación CSV con prevalidación, confirmación y transacción. La clave primaria de SIDPOL es compuesta: año, mes, ubigeo, modalidad, departamento, provincia, distrito.
- Para el formulario, departamento/provincia/distrito son selectores dependientes. El backend valida formatos, pero **no valida todavía contra un catálogo territorial interno**; los archivos importados deben ser verificados también en cuanto a correspondencia de ubigeos y territorios.

## Límites conocidos

- Las secciones heredadas `/indicadores`, `/resultados`, `/comparaciones` y `/mapa` aún usan el módulo demostrativo original (`app.js`), claramente marcado como simulado. **No se han conectado aún a las tablas oficiales.** Para datos oficiales usa `/dashboard`. No interpretar las otras secciones como cifras oficiales.
- Gestión manual e importación implementadas únicamente para `obs_denuncias_policiales`. Homicidios INEI/nacionales están disponibles en el dashboard público, pero **no** tienen edición administrativa, porque tienen estructura y procedencia distintas.
- La validación CSV comprueba cabeceras, tipos y rangos. No detecta duplicados previos durante la vista previa: una colisión con la clave primaria provocará rechazo de la transacción, sin importación parcial.
- Las métricas de uso son aproximadas por pestaña/sesión y ruta, no identifican personas ni pueden inferir aburrimiento. No registrar IP ni información personal.
- Esta entrega fue verificada mediante análisis de código y `node --check` para JavaScript; **no fue posible compilar ni probar contra Supabase/Render desde este entorno**. Verificar el primer despliegue y sus logs.
