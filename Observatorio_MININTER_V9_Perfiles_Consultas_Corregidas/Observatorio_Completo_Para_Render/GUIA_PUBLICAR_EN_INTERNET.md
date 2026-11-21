# Publicar el Observatorio UPN como página web

Esta guía prepara el proyecto Spring Boot para Render mediante Docker. La aplicación se publicará con datos simulados; SQL Server se conectará en una etapa posterior.

## Qué incluye esta versión

- `Dockerfile`: compila con Maven y Java 21 y ejecuta el JAR con Java 21.
- `render.yaml`: define un servicio web Docker en el plan gratuito de Render.
- `.dockerignore` y `.gitignore`: evitan subir archivos de compilación y archivos locales.
- `application.properties`: lee el puerto de la variable `PORT` y escucha en `0.0.0.0`.

## Paso 1. Preparar una copia para publicar

1. Descomprime el ZIP.
2. Abre la carpeta `observatorio-mininter-periodos`, donde están `pom.xml`, `src`, `Dockerfile` y `render.yaml`.
3. No subas contraseñas, archivos `.env`, datos personales ni credenciales.

## Paso 2. Crear un repositorio GitHub

1. Crea un repositorio nuevo para el proyecto. Para mantener el código del trabajo fuera de búsquedas públicas, selecciona **Private**.
2. Sube el CONTENIDO de la carpeta `observatorio-mininter-periodos` a la raíz del repositorio. En la raíz deben quedar `pom.xml`, `Dockerfile`, `render.yaml` y `src/`.
3. No subas la carpeta externa que contiene todo el proyecto como una carpeta anidada; Render debe encontrar `render.yaml` y `Dockerfile` en la raíz.

## Paso 3. Crear el sitio en Render

1. Inicia sesión en Render y conecta GitHub desde el propio panel de Render.
2. En Render, elige **New + → Blueprint** si quieres que lea `render.yaml`, o **New + → Web Service** y selecciona el repositorio.
3. Si usas Blueprint, confirma el servicio `observatorio-seguridad-ciudadana-upn` y el plan `Free`.
4. Si creas el servicio manualmente, selecciona runtime **Docker**, Dockerfile `./Dockerfile` y plan `Free`.
5. Inicia el despliegue y revisa los registros hasta que aparezca como Live.
6. Abre la URL `https://<nombre-del-servicio>.onrender.com` que Render asigne.

## Limitaciones del plan gratuito

- Render detiene un servicio web gratuito después de 15 minutos sin tráfico. La primera visita posterior puede tardar aproximadamente un minuto mientras vuelve a iniciar.
- El sistema de archivos del servicio gratuito es efímero: no se debe guardar allí información que deba persistir.
- Los datos de demostración en memoria se reinician cuando el servicio se reinicia o vuelve a desplegarse. Esto es esperado mientras no conectemos una base de datos.

## Prueba después del despliegue

- `/` pantalla de bienvenida.
- `/ciudadano` entrada al perfil Ciudadano.
- `/investigador` entrada al perfil Investigador.
- `/indicadores`, `/resultados`, `/comparaciones`, `/mapa` y `/ayuda`.
- `/api/v1/indicadores` para comprobar la API de indicadores.
- `/api/v1/territorios/departamentos` para comprobar la API territorial.

## Datos y avisos académicos

Esta publicación es una demostración académica UPN, no un portal oficial del MININTER. Los casos, poblaciones, tasas e intensidades de calor son simulados. El catálogo territorial y los mapas se obtienen desde recursos externos y necesitan conexión a Internet en el navegador.

## Base de datos posterior

No agregues todavía credenciales SQL Server al repositorio. Cuando conectemos la base de datos, las credenciales se configurarán como variables de entorno privadas en el panel de Render y se utilizará una cuenta de aplicación con permisos limitados, no `sa`.
