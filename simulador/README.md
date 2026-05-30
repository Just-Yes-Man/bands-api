# Emulador MQTT de producto

Carpeta del simulador: `simulador/`

## Estructura

- `main.py`: punto de entrada.
- `config.py`: variables de entorno, delays y topicos MQTT.
- `conexion_api_mqtt.py`: conexion MQTT con la API y despacho de pedidos.
- `simulacion_pedido.py`: secuencia de medicion y avance por linea.
- `eventos.py`: construccion de eventos sinteticos.
- `order_payload.py`: extraccion y normalizacion de pedidos/lineas.
- `payload_parser.py`: parseo tolerante de payloads MQTT.
- `mqtt_publicador.py`: publicacion JSON y logs de salida.
- `errores.py`: estado de alerta que puede detener y reanudar todas las bandas.
- `logica_simulador.py`: capa de compatibilidad para imports antiguos.

## Requisitos

```bash
pip install paho-mqtt
```

## Ejecución

Desde la raíz del repo:

```bash
python3 -m simulador.main --broker localhost --port 1883
```

Tambien se mantiene el wrapper historico:

```bash
python3 mqtt_producto_emulador.py --broker localhost --port 1883
```

Variables de entorno soportadas:

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

## Alerta de bandas detenidas

Por defecto, el emulador dispara una alerta critica despues de publicar la
primera medicion de una linea. Mientras la alerta este activa, todas las
bandas simuladas quedan pausadas y no se publican avances.

El emulador publica la alerta en:

```text
bandas/alertas
```

Ejemplo:

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

Para resolverla desde el front, publica en:

```text
bandas/errores/resolver
```

Payload minimo:

```json
{
  "event": "bandas.error.resolver",
  "errorId": "band-stop-1779915600000",
  "resolvedBy": "front"
}
```

Cuando se resuelve, el emulador publica `bandas.error.resuelto` en
`bandas/alertas` y reanuda las bandas.

La pantalla `public/nuevo-ticket.html` tiene el apartado **7) Alerta de bandas**
para ver este estado en tiempo real y enviar la resolucion por la API.
