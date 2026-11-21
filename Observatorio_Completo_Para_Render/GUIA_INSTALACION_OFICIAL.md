# Actualización conservadora del Observatorio

## Qué se mantiene
Spring Boot, rutas públicas, estructura `src/main`, Bootstrap, Chart.js, Leaflet y diseño de dashboard. Se conservan las tablas antiguas de Supabase sin borrarlas.

## 1. Respaldo
Guarda tu ZIP anterior y crea una rama de respaldo en GitHub antes de sustituir archivos.

## 2. Supabase
1. Abre Supabase → SQL Editor → New query.
2. Pega y ejecuta `01_crear_tablas.sql` del paquete **Supabase_Observatorio_Oficial.zip**.
3. Table Editor → `obs_denuncias_policiales` → Import data from CSV → los archivos separados `denuncias_policiales_2022.csv` hasta `denuncias_policiales_2025.csv` (o el CSV combinado si tu importador lo permite).
4. Importa `homicidios_inei_2022_2024_distritos.csv` a `obs_homicidios_inei`.
5. Importa `homicidios_inei_2025_nacional.csv` a `obs_homicidios_nacional`.
6. Ejecuta `02_verificar.sql` y revisa los totales.
**Atención:** si Supabase limita la carga por tamaño, importa por partes usando CSV divididos por año. No importes dos veces las mismas filas: las claves primarias protegen contra duplicados.

## 3. Render y GitHub
1. Sube el contenido de esta carpeta **Observatorio_Completo_Para_Render** al repositorio GitHub (conservando su carpeta).
2. Render: Environment = Docker, Branch = main, Root Directory = `Observatorio_Completo_Para_Render`, Dockerfile Path = `./Dockerfile`, Docker Build Context Directory = `.`.
3. En Environment de Render define `ADMIN_USERNAME` y `ADMIN_PASSWORD` (contraseña larga y aleatoria). No las escribas en el repositorio.
4. Deploy latest commit. Visita `/dashboard`, `/admin` y `/login`.
5. `/admin` debe redirigir a `/login` si no has iniciado sesión; `/dashboard` debe ser público.

## 4. Importante
- Los homicidios 2025 son una **estimación preliminar nacional** del INEI/CEIC; no se inventan cifras mensuales ni distritales.
- La distribución de denuncias NO incluye homicidios como modalidad, porque es un indicador de otra fuente.
- Las páginas heredadas `/indicadores`, `/resultados`, `/comparaciones` y `/mapa` conservan su estructura, pero sus datos antiguos de memoria se han desactivado para evitar mostrar cifras ficticias. **Necesitan una fase adicional de conexión a las nuevas tablas antes de usarlas como estadísticas verificadas**.
- El panel de administración incluye acceso protegido y documentación de carga; **todavía no permite editar datos ni administrar múltiples cuentas desde la web**. Estas funciones requieren un módulo de gestión con auditoría y permisos persistentes.
- No se garantiza un despliegue hasta probarlo en tu Render/Supabase reales.
