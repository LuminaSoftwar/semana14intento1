# Actualización de filtros y estimaciones mensuales

## Qué cambió
- Se conservó Spring Boot, Render, las páginas y el diseño.
- Los tres filtros geográficos se rellenan con **todas las ubicaciones realmente presentes en los cuatro CSV**, consultadas desde Supabase. No se inventan provincias ni distritos que no figuran en los archivos.
- CSV: **35 ubicaciones (distritos/UBIGEO), 26 departamentos y 31 combinaciones departamento-provincia**.
- Se eliminaron los bloqueos que impedían elegir provincia o distrito sin seleccionar antes un departamento.
- La evolución mensual usa un modelo **sintético, variable y reproducible** por año, tipo y ubicación, con total mensual exactamente igual al total anual de los CSV. NO hay datos mensuales reales en estos archivos.
- Los gráficos mensuales por distrito usan el mismo modelo que la evolución mensual.

## Cómo actualizar GitHub y Render
1. Sube **el contenido de la carpeta Observatorio_Completo_Para_Render** a la carpeta de igual nombre en el repositorio GitHub `LuminaSoftwar/Observatorio-Seguridad-UPN2` (reemplaza archivos antiguos).
2. Mantén Render: Root Directory `Observatorio_Completo_Para_Render/`, Dockerfile Path `Dockerfile`, Build Context `.` (como en tu despliegue que ya funcionó).
3. Render debería redesplegarse al recibir el commit; si no, Manual Deploy > Deploy latest commit.

## Supabase
- Si la tabla `public.obs_delitos_anuales` ya tiene los datos correctos, **NO es necesario reimportar**. El cambio de filtros y del gráfico está en JavaScript.
- Para verificar, ejecuta `supabase_importacion/02_verificar_datos.sql` en SQL Editor.
- Si falta información, ejecuta `01_preparar_tabla.sql`; si vas a reemplazar los datos de esa tabla, haz respaldo y luego `03_solo_si_vas_a_reimportar.sql`, y finalmente importa `obs_delitos_anuales_2022_2025.csv` mediante Table Editor. Este CSV contiene 680 filas agrupadas.
- Totales esperados por año (suma de `cantidad`): {2022: 1126824, 2023: 1233421, 2024: 1246999, 2025: 1234300}.
- Nunca subas claves secretas de Supabase a GitHub; el archivo de configuración usa solo la clave pública publishable.

## Alcance real de los datos
Estos CSV no contienen todos los distritos del Perú. Solo se muestran las ubicaciones presentes en ellos. La clasificación de delitos es una agrupación académica simplificada por palabras clave de `subgenerico` y no equivale necesariamente a una taxonomía oficial.

## Nota sobre las estimaciones
Los valores mensuales no se infieren de observaciones mensuales ni representan tendencias históricas reales. El modelo reparte cada total anual con pesos variables deterministas; sirve para visualización demostrativa. Evitar describir aumentos/disminuciones mensuales como hechos reales.
