# Emulador MQTT de producto

Script: `mqtt_producto_emulador.py`

## ¿Qué hace?

- Escucha eventos de pedidos en los topics:
  - `pedidos/creacion` (ej. `pedido.creado`)
  - `pedidos/avances` (ej. `pedido.avance`)
- Publica una respuesta con mediciones inventadas en:
  - `productos/mediciones`

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
