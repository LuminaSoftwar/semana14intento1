-- No borra otras tablas de Supabase.
CREATE TABLE IF NOT EXISTS public.obs_delitos_anuales (
 anio integer NOT NULL,
 departamento text NOT NULL,
 provincia text NOT NULL,
 distrito text NOT NULL,
 ubigeo text NOT NULL,
 tipo_delito text NOT NULL,
 cantidad bigint NOT NULL CHECK (cantidad >= 0),
 PRIMARY KEY (anio,departamento,provincia,distrito,ubigeo,tipo_delito)
);
ALTER TABLE public.obs_delitos_anuales ENABLE ROW LEVEL SECURITY;
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.obs_delitos_anuales TO anon, authenticated;
DROP POLICY IF EXISTS obs_lectura_publica ON public.obs_delitos_anuales;
CREATE POLICY obs_lectura_publica ON public.obs_delitos_anuales FOR SELECT TO anon, authenticated USING (true);
