# Publicar el Observatorio en Render

1. En GitHub, crea un repositorio y sube el **contenido de esta carpeta** a la raíz del repositorio. `Dockerfile`, `pom.xml`, `render.yaml` y `src/` deben quedar en la raíz, no dentro de `proyecto/`.
2. En Render, elige **New > Web Service**, conecta GitHub y selecciona el repositorio.
3. En Runtime/Language, elige **Docker**. Branch: `main`. Root directory: dejar vacío. Plan: Free, si está disponible. Dockerfile path: `./Dockerfile`.
4. Pulsa **Deploy Web Service** y espera que finalice la compilación. El Dockerfile usa Maven y Java 21 dentro de Render; no necesitas instalarlos localmente.
5. Abre la URL `.onrender.com` que te proporcione Render y entra a `/dashboard` para verificar los indicadores. Si las rutas del controlador difieren, navega desde la página principal.

Supabase: `src/main/resources/static/js/supabase-config.js` contiene la URL y una clave *publishable* pública, no una clave de servicio. El dashboard consulta `obs_delitos_anuales` directamente. Deben existir los datos importados y una política RLS de SELECT para el rol anon.

Importante: los datos mensuales son **estimaciones**, no observaciones mensuales oficiales. El despliegue no verifica por sí solo la conexión con Supabase; comprueba que se carguen los KPI y gráficos.
