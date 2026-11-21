-- Ejecutar una vez en Supabase SQL Editor. No altera las tablas de delitos.
CREATE TABLE IF NOT EXISTS public.obs_admin_audit (
 id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 actor TEXT NOT NULL, action TEXT NOT NULL, detail TEXT NOT NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.obs_web_visits (
 session_id UUID PRIMARY KEY, path TEXT NOT NULL,
 first_seen TIMESTAMPTZ NOT NULL DEFAULT now(),
 last_seen TIMESTAMPTZ NOT NULL DEFAULT now(),
 page_views INTEGER NOT NULL DEFAULT 1
);
CREATE INDEX IF NOT EXISTS obs_web_visits_last_seen_idx ON public.obs_web_visits(last_seen);
REVOKE ALL ON public.obs_admin_audit, public.obs_web_visits FROM anon, authenticated;
