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
