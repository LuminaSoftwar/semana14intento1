SELECT anio, SUM(cantidad) AS total, COUNT(*) AS filas
FROM public.obs_delitos_anuales GROUP BY anio ORDER BY anio;
SELECT COUNT(DISTINCT departamento) AS departamentos,
 COUNT(DISTINCT (departamento,provincia)) AS provincias,
 COUNT(DISTINCT (departamento,provincia,distrito,ubigeo)) AS distritos
FROM public.obs_delitos_anuales;
