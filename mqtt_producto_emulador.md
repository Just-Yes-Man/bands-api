# Emulador MQTT de producto

Script: `mqtt_producto_emulador.py`

## ¿Qué hace?

- Escucha eventos de pedidos en el topic:
  - `pedidos/creacion` (ej. `pedido.creado`)
- Publica avances de linea en:
  - `pedidos/avances` (ej. `pedido.avance`)
- Publica una medicion por linea en:
  - `productos/mediciones`
- Si se inyecta un fallo, avisa en:
  - `productos/mediciones/errores`

## Requisitos

```bash
pip install paho-mqtt
```

## Ejecución

```bash
python3 mqtt_producto_emulador.py --broker localhost --port 1883
```

También soporta variables de entorno:

- `MQTT_BROKER`
- `MQTT_PORT`
- `MQTT_USERNAME`
- `MQTT_PASSWORD`
- `SIM_PROGRESS_DELAY_SEC`
- `SIM_STAGE_DELAY_SEC`
- `SIM_MEASUREMENT_ERROR_RATE` (default: 0.25, usa 1 para forzar error)
- `SIM_MEASUREMENT_ERROR_TOPIC` (default: productos/mediciones/errores)
- `SIM_REWORK_DELAY_SEC` (default: 2)

Cuando ocurre un fallo simulado, el emulador publica una medicion defectuosa,
notifica el error por topic y despues vuelve a generar la medicion correcta para
que el pedido pueda continuar.

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
