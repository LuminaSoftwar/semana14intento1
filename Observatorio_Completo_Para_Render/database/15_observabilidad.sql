-- Práctica de Campo 15: repositorio de eventos del sistema de observabilidad.
-- No reemplaza ni duplica obs_visitas u obs_eventos_navegacion.
-- Revisar primero existencia: si ya existe una tabla equivalente, adaptar el código a ella.
CREATE TABLE IF NOT EXISTS public.obs_telemetria_eventos (
 id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 fuente TEXT NOT NULL CHECK (fuente IN ('frontend','server','backend','database')),
 tipo_evento TEXT NOT NULL CHECK (char_length(tipo_evento) BETWEEN 1 AND 80),
 resultado TEXT NOT NULL DEFAULT 'observado',
 request_id TEXT NULL CHECK (request_id IS NULL OR char_length(request_id)<=80),
 duracion_ms BIGINT NULL CHECK (duracion_ms IS NULL OR duracion_ms BETWEEN 0 AND 86400000),
 fecha_evento TIMESTAMPTZ NOT NULL DEFAULT now(),
 importado BOOLEAN NOT NULL DEFAULT false
);
CREATE INDEX IF NOT EXISTS obs_telemetria_fecha_fuente_idx ON public.obs_telemetria_eventos(fecha_evento,fuente);
-- Evita duplicar la misma línea al volver a importar un LOG normalizado.
CREATE UNIQUE INDEX IF NOT EXISTS obs_telemetria_import_dedupe_idx ON public.obs_telemetria_eventos(fuente,tipo_evento,resultado,fecha_evento,(COALESCE(request_id,''))) WHERE importado=true;
REVOKE ALL ON public.obs_telemetria_eventos FROM anon, authenticated;
-- La aplicación usa la conexión JDBC protegida; nunca habilitar escritura directa desde el navegador.
