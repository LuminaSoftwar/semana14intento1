# Matriz de pruebas técnicas

Completar únicamente después de ejecutar la prueba en desarrollo. Resultado permitido: detectado, no detectado o no aplicable. Adjuntar evidencia identificada, sin datos personales.

| Código | Procedimiento | Resultado esperado | Resultado real | Evidencia / observación |
|---|---|---|---|---|
| P01 Interacción Frontend | Abrir Consulta de indicadores; cambiar un filtro; enviar consulta; descargar CSV si hay datos. Revisar Network y GA4 DebugView si está configurado. | Registrar `aplicar_filtro`, `consulta_indicador` y, al descargar, `descargar_datos`; sin valores personales. | Pendiente |  |
| P02 HTTP exitoso | En desarrollo, ejecutar una consulta válida y revisar respuesta Network y Access LOG. | Estado 200 y ruta/método presentes en Access LOG. | Pendiente |  |
| P03 Error HTTP controlado | En desarrollo, solicitar `/ruta-inexistente` y revisar estado en Network y Access LOG. | Estado 404; el Error LOG puede no generar error de aplicación porque el 404 es controlado. | Pendiente |  |
| P04 Backend exitoso | Consultar con filtros válidos; revisar `obs_telemetria_eventos` con fuente `backend`. | `consulta_iniciada` y `consulta_exitosa`; mismo request ID que el Frontend cuando esté disponible. | Pendiente |  |
| P05 Validación Backend fallida | En desarrollo, enviar parámetro inválido, por ejemplo `desde=2026`, a `/api/consultas/datos`. | HTTP de error y evento `validacion_fallida`; no registrar el valor del parámetro. | Pendiente |  |
| P06 Operación registrada en SGBD | Ejecutar una consulta controlada; revisar la fuente nativa de logs de PostgreSQL disponible para el proyecto. | Evidencia de registro del motor o constancia de restricción del proveedor; registrar nombre y hora. | Pendiente |  |
| P07 Trazabilidad integral | Realizar una consulta válida con herramientas abiertas; enlazar Frontend, Access LOG, eventos Backend y registro nativo PostgreSQL por request ID y ventana temporal. | Relación documentada; si PostgreSQL no contiene request ID, marcar asociación aproximada por hora. | Pendiente |  |

No se marca ninguna prueba como ejecutada por anticipado. Evitar activar logs generales o de consultas completas en producción.
