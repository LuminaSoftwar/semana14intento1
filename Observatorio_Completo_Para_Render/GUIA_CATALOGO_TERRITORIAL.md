# Corrección del catálogo territorial del dashboard

## Qué cambia
- Los filtros cargan el catálogo nacional de departamentos, provincias y distritos, independientemente de las estadísticas disponibles en Supabase.
- Fuente pública del catálogo: https://github.com/RitchieRD/ubigeos-peru-data (licencia CC0, actualizado a 2026 según el repositorio).
- Se obtiene en el navegador mediante CDN jsDelivr. Se requiere conexión a Internet y disponibilidad del CDN. Si falla, el dashboard usa como respaldo las ubicaciones presentes en Supabase y muestra un aviso.
- La tabla `obs_delitos_anuales` y los CSV 2022–2025 NO se modifican.
- Si un territorio no figura en los CSV, se muestran valores cero y una advertencia de falta de registros. Cero no significa que allí no hubo delitos.
- Los CSV contienen `dpto_pjfs`, `prov_pjfs`, `dist_pjfs`, ubicaciones de sedes fiscales; no son registros distritales completos del lugar de ocurrencia.

## Cómo desplegar
1. Subir el contenido de este ZIP a la carpeta del proyecto en GitHub (sin duplicar directorios).
2. En Render, desplegar el último commit de `main`.
3. Abrir /dashboard y probar Lima, sus provincias y sus distritos.
4. Comprobar la consola del navegador si el catálogo nacional no carga.

## Limitación estadística
Para mostrar denuncias reales en cada distrito del Perú hay que obtener un conjunto de datos que incluya el distrito de ocurrencia. No se deben repartir las denuncias de una sede fiscal entre distritos sin evidencia.
