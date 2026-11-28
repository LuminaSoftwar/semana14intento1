# Práctica de Campo 15 – Observabilidad

## Arquitectura implementada

1. **Frontend propio:** `static/js/observabilidad.js` captura tres eventos permitidos y los envía al backend. La API no acepta detalles arbitrarios ni datos del usuario. `X-Request-ID` puede correlacionar una consulta.
2. **Herramienta existente en Frontend:** GA4 está preconfigurado con el ID de medición del flujo Web creado para el proyecto. Si se cambia la propiedad, se puede sobrescribir mediante la variable `GA4_MEASUREMENT_ID` en Render. El ID de medición es público y no es una contraseña. La etiqueta empieza a enviar datos cuando se despliega esta versión. Verifica la recepción en el informe Tiempo real. 
3. **Servidor:** Access LOG nativo de Tomcat activado por configuración. Se registran fecha, método, ruta sin query, protocolo, estado, bytes y duración; el patrón omite IP. Revisa Error LOG en los logs de aplicación de Render.
4. **Backend propio:** eventos `consulta_iniciada`, `consulta_exitosa` y `validacion_fallida` en la consulta real. Se almacenan en PostgreSQL con resultado, duración y request ID opcional. No se guardan parámetros.
5. **SGBD:** PostgreSQL/Supabase. Los logs nativos se consultan desde el panel del proveedor según permisos. El repositorio propio solo recibe eventos normalizados importados manualmente; no reemplaza el log nativo.
6. **Dashboard:** cuatro KPI y cuatro gráficos; muestra agregados de los últimos 30 días. La ausencia de datos se representa como cero o sin registros, nunca como actividad simulada.

## Instalación y configuración

1. Descomprime el proyecto y abre `Observatorio_Completo_Para_Render`.
2. Revisa primero si existe una tabla de telemetría equivalente en Supabase. La aplicación ya conserva las tablas de visitas y navegación. Si no existe equivalente, ejecuta `database/15_observabilidad.sql` en SQL Editor con una cuenta autorizada.
3. Define las variables que ya usa el despliegue (`DATABASE_URL`, credenciales y administrador). GA4 queda activado con el ID del flujo Web. Si se reemplaza por otra propiedad, define `GA4_MEASUREMENT_ID` en Render; no es necesario pegar la etiqueta manualmente en los HTML.
4. Despliega y entra al panel de administración. Los eventos Frontend/Backend aparecen tras usar Consulta de indicadores.
5. Para añadir Access LOG o PostgreSQL CSVLOG, obtén una exportación permitida, normalízala localmente con los scripts en `herramientas/`, verifica que el JSONL no incluya datos sensibles y súbelo desde Administración. Máximo 1000 filas por carga.
6. Revisa los gráficos, captura evidencias reales y completa las matrices de `formatos/`. No marques resultados pendientes como ejecutados.

## Alternativas por fuente

| Fuente | Herramienta existente | Solución propia | Límite actual |
|---|---|---|---|
| Frontend | Google Analytics 4 configurado | JavaScript + API propia | El ID del flujo está en `application.properties`; se puede cambiar con variable de entorno |
| Servidor | Tomcat Access LOG y logs de Render; GoAccess puede analizar exportación compatible | Parser local a JSONL + importador | Render/Supabase pueden limitar descarga/exportación |
| Backend | Spring Boot logging estándar / logs de Render | Eventos de negocio en API propia | Correlación depende de que llegue `X-Request-ID` |
| SGBD | PostgreSQL/Supabase Logs Explorer | Parser local de CSVLOG + agregación del panel | El acceso depende del plan/permisos y formato exportado |

La aplicación no lee logs crudos de Render/Supabase automáticamente. El flujo para esos dos orígenes es exportar, normalizar y cargar manualmente. No habilites query logging general en producción.

## Obtener los registros nativos

- **Render:** abre el servicio web y su página Logs. Filtra por hora, nivel y texto para revisar los logs de aplicación (incluidos errores Spring). La disponibilidad de logs HTTP generados por Render depende del plan del workspace; si no aparecen, el Access LOG de Tomcat sigue siendo la alternativa instrumentada. El archivo de Tomcat se escribe en `logs/` dentro del contenedor; Render puede no conservarlo tras reinicios. Usa la salida de logs disponible en el plan o una copia de desarrollo local. No afirmes que descargaste un log si el panel no te lo permite.
- **Supabase/PostgreSQL:** en el proyecto abre Logs, limita el rango de tiempo, selecciona Postgres y examina el evento. Para descargar, usa Download logs y elige CSV/JSON. Para la consola SQL, solo usa la fuente Database para consultas de diagnóstico autorizadas; los logs de plataforma se consultan en Logs. Revisa retención y tipo de evento. No habilites registro general de sentencias en producción. Si no hay exportación o permisos, documenta la limitación con una captura del panel.
- **GoAccess:** es una alternativa existente para analizar access logs compatibles; ejecutar en una copia local anonimizada con formato correspondiente. No es necesario desplegarlo ni comprar un servicio para esta práctica.

## Evidencia y pruebas

Usa `formatos/PRUEBAS_TECNICAS.md` para siete pruebas y `formatos/PRUEBAS_USUARIO.md` para tres participantes × dos tareas. Se dejan resultados en blanco para la ejecución real. Adjunta capturas de Network y GA4 en Tiempo real, logs anonimizados y panel, sin publicar registros crudos.

## Requisitos de informe

El informe está en `docs/Informe_Practica_Campo_15.docx` y su PDF. Mantiene marcadores para datos del equipo y resultados/evidencias que deben completar las personas responsables. Máximo diez páginas de contenido, sin carátula ni anexos.
