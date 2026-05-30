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

Variables de entorno soportadas:

- `MQTT_BROKER`
- `MQTT_PORT`
- `MQTT_USERNAME`
- `MQTT_PASSWORD`
- `SIM_PROGRESS_DELAY_SEC`
- `SIM_STAGE_DELAY_SEC`
- `SIM_BAND_COUNT` (default: 5)
- `SIM_UI_HOST` (default: 0.0.0.0)
- `SIM_UI_PORT` (default: 5055)
- `SIM_UI_MAX_EVENTS` (default: 200)

## UI del emulador

El emulador expone una UI web para visualizar la creacion, inspeccion y
clasificacion de pedidos.

URL por defecto:

```
http://localhost:5055
```
