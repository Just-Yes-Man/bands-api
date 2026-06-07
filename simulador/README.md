# Emulador MQTT de producto

Carpeta del simulador: `simulador/`

## Estructura

- `main.py`: punto de entrada.
- `logica_simulador.py`: lógica base (parseo + generación de eventos sintéticos).
- `conexion_api_mqtt.py`: conexión MQTT con la API (suscripción y publicación).

## Requisitos

```bash
pip install paho-mqtt
```

## Ejecución

Desde la raíz del repo:

```bash
python3 -m simulador.main --broker localhost --port 1883
```

Para un broker MQTT con TLS:

```bash
MQTT_TLS=true python3 -m simulador.main --broker <host> --port 8883 --username <user> --password <password>
```

Variables de entorno soportadas:

- `MQTT_BROKER`
- `MQTT_PORT`
- `MQTT_USERNAME`
- `MQTT_PASSWORD`
- `MQTT_TLS` (`true` para brokers TLS, por ejemplo puerto 8883)
- `SIM_PROGRESS_DELAY_SEC`
- `SIM_STAGE_DELAY_SEC`
- `SIM_BAND_COUNT` (default: 5)
- `SIM_MEASUREMENT_ERROR_RATE` (default: 0.25, usa 1 para forzar error)
- `SIM_MEASUREMENT_ERROR_TOPIC` (default: productos/mediciones/errores)
- `SIM_REWORK_DELAY_SEC` (default: 2)
- `SIM_UI_HOST` (default: 0.0.0.0)
- `SIM_UI_PORT` (default: 5055)
- `SIM_UI_MAX_EVENTS` (default: 200)

Cuando se inyecta un error, el emulador publica primero una medicion defectuosa
en `productos/mediciones`, avisa en `productos/mediciones/errores` y luego
publica una medicion corregida para que el pedido continue su flujo.

## UI del emulador

El emulador expone una UI web para visualizar la creacion, inspeccion y
clasificacion de pedidos.

URL por defecto:

```
http://localhost:5055
```
