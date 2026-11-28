# Procesamiento local de registros

Los scripts leen de stdin, descartan campos potencialmente sensibles y emiten JSONL compatible con el importador del panel. No subas los LOG crudos a GitHub ni a herramientas externas.

## Tomcat Access LOG

`python3 normalizar_access_log.py < access_log.2026-11-28.txt > access.normalizado.jsonl`

Reconoce el patrón configurado en `application.properties` y Nginx combined. En Tomcat, `%D` entrega microsegundos; el script lo convierte a milisegundos. El path no contiene query string; se descarta IP y User-Agent. Si se usa otro formato, adapta el parser con una copia anonimizada.

## PostgreSQL CSVLOG

Exporta desde Supabase Logs únicamente los registros necesarios, o usa PostgreSQL CSVLOG si se dispone del archivo nativo. El script acepta CSVLOG estándar (orden PostgreSQL) o un CSV de proveedor con encabezado `timestamp`/`log_time`; en este último caso conserva solo timestamp y nivel/severidad. Nunca conserva el mensaje. Luego:

`python3 normalizar_postgres_csvlog.py < postgres.csv > postgres.normalizado.jsonl`

El parser conserva fecha, tipo de operación y severidad cuando el formato lo permite. No exporta campos `query`, `detail`, usuario, base, dirección, ni sesión. Si el proveedor entrega un formato distinto sin timestamp reconocido, no lo fuerces: documenta el formato y crea un parser que elimine SQL y datos personales.

Cada línea generada puede importarse como archivo JSONL desde Administración. El endpoint acepta hasta 1000 líneas por carga. No se simulan ni fabrican eventos.
