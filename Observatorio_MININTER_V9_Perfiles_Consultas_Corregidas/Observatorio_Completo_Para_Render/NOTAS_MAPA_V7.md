# Corrección V7 del mapa

Se mantiene Leaflet, pero se reemplazan los puntos de capitales por polígonos distritales GeoJSON. La capa se descarga en el navegador desde Rodasluis/Peru-maps, archivo `salida/distrito_simplificado.geojson`; necesita acceso a GitHub desde el navegador. Si la descarga falla, se muestra el error en el mapa (sin inventar coordenadas).

Se agregan registros por `ubigeo` desde Supabase/PostgreSQL. Los colores son quintiles de los distritos con registros, por lo que no representan umbrales absolutos. Los polígonos sin casos registrados no se colorean; no equivalen a cero. La tabla conserva los totales. El mapa informa cuántos ubigeos no se pudieron cruzar.

PENDIENTE DE VERIFICACIÓN EN PRODUCCIÓN: confirmar acceso a GeoJSON remoto, coincidencia de ubigeos históricos y valores de filtros; no se ejecutó compilación Maven ni pruebas con la base real.
