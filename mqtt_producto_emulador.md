# Emulador MQTT de producto

Script compatible: `mqtt_producto_emulador.py`

La implementacion vive segmentada en `simulador/` para separar configuracion,
conexion MQTT, construccion de eventos y secuencia de simulacion.

## ¿Qué hace?

- Escucha eventos de pedidos en el topic:
  - `pedidos/creacion` (ej. `pedido.creado`)
- Publica avances de linea en:
  - `pedidos/avances` (ej. `pedido.avance`)
- Publica una medicion por linea en:
  - `productos/mediciones`
- Publica alertas operativas en:
  - `bandas/alertas`
- Escucha resoluciones de alerta desde el front en:
  - `bandas/errores/resolver`

## Requisitos

```bash
pip install paho-mqtt
```

## Ejecución

```bash
python3 mqtt_producto_emulador.py --broker localhost --port 1883
```

Tambien se puede ejecutar el paquete directamente:

```bash
python3 -m simulador.main --broker localhost --port 1883
```

También soporta variables de entorno:

- `MQTT_BROKER`
- `MQTT_PORT`
- `MQTT_USERNAME`
- `MQTT_PASSWORD`
- `MQTT_TOPIC_BANDAS_ALERTAS`
- `MQTT_TOPIC_BANDAS_ERROR_RESOLVER`
- `SIM_PROGRESS_DELAY_SEC`
- `SIM_STAGE_DELAY_SEC`
- `SIM_BAND_ERROR_ENABLED`
- `SIM_BAND_ERROR_CODE`
- `SIM_BAND_ERROR_MESSAGE`

## Alerta simulada de bandas detenidas

Despues de la primera medicion, el emulador genera una alerta critica que
detiene todas las bandas simuladas. Mientras la alerta este activa, no se
publican avances de pedido.

Alerta publicada en `bandas/alertas`:

```json
{
  "event": "bandas.error",
  "source": "emulador",
  "errorId": "band-stop-1779915600000",
  "codigo": "BANDAS_DETENIDAS",
  "estado": "ACTIVO",
  "severidad": "CRITICA",
  "mensaje": "Todas las bandas fueron detenidas por una alerta critica.",
  "afecta": "TODAS_LAS_BANDAS",
  "pedidoId": 12,
  "lineaPedidoId": 45,
  "occurredAt": "2026-05-27T10:20:00.000000+00:00"
}
```

Para resolverla desde el front, publicar en `bandas/errores/resolver`:

```json
{
  "event": "bandas.error.resolver",
  "errorId": "band-stop-1779915600000",
  "resolvedBy": "front"
}
```

Al resolverse, el emulador publica `bandas.error.resuelto` en `bandas/alertas`
y continua la simulacion.

En el frontend `nuevo-ticket.html`, el apartado **7) Alerta de bandas** muestra
el flujo visual:

1. El emulador publica `bandas.error` en `bandas/alertas`.
2. La API recibe esa alerta por EMQX y la reenvia por Socket.IO como
   `band.alert.updated.v1`.
3. El boton **Resolver y reanudar bandas** llama a
   `POST /api/v1/band-alerts/resolve`.
4. La API publica `bandas.error.resolver` en `bandas/errores/resolver`.
5. El emulador reanuda las bandas y publica `bandas.error.resuelto`.

## Ejemplo de pedido entrante

```json
{
  "evento": "pedido.creado",
  "pedidoId": "PED-1001",
  "productoId": "SKU-9"
}
```

## Ejemplo de salida en `productos/mediciones`

```json
{
  "pedidoId": "PED-1001",
  "productoId": "SKU-9",
  "origen": "pedidos/creacion",
  "timestamp": "2026-04-26T10:20:00.000000+00:00",
  "mediciones": {
    "temperatura_c": 24.2,
    "humedad_pct": 65.7,
    "vibracion_rms": 0.143,
    "presion_kpa": 102.8,
    "consumo_w": 173.5
  },
  "evento": "producto.mediciones.generadas"
}
```
