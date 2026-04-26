"""Conexión MQTT con la API: suscripción de pedidos y publicación de mediciones."""

from __future__ import annotations

import json
import os
from typing import Any, Dict

import paho.mqtt.client as mqtt

from simulador.logica_simulador import build_mediciones, parse_payload

DEFAULT_BROKER = os.getenv("MQTT_BROKER", "localhost")
DEFAULT_PORT = int(os.getenv("MQTT_PORT", "1883"))
DEFAULT_USERNAME = os.getenv("MQTT_USERNAME")
DEFAULT_PASSWORD = os.getenv("MQTT_PASSWORD")

TOPIC_PEDIDOS_CREACION = "pedidos/creacion"
TOPIC_PEDIDOS_AVANCES = "pedidos/avances"
TOPIC_MEDICIONES = "productos/mediciones"


def on_connect(client: mqtt.Client, _userdata: Any, _flags: Dict[str, Any], rc: int):
    if rc != 0:
        print(f"[ERROR] No se pudo conectar al broker MQTT (rc={rc})")
        return

    print("[INFO] Conectado al broker MQTT")
    client.subscribe(TOPIC_PEDIDOS_CREACION, qos=1)
    client.subscribe(TOPIC_PEDIDOS_AVANCES, qos=1)
    print(f"[INFO] Suscripto a: {TOPIC_PEDIDOS_CREACION}, {TOPIC_PEDIDOS_AVANCES}")


def on_message(client: mqtt.Client, _userdata: Any, msg: mqtt.MQTTMessage):
    pedido = parse_payload(msg.payload)
    print(f"[RX] {msg.topic} -> {pedido}")

    respuesta = build_mediciones(pedido, msg.topic)
    payload = json.dumps(respuesta, ensure_ascii=False)
    result = client.publish(TOPIC_MEDICIONES, payload, qos=1)

    if result.rc == mqtt.MQTT_ERR_SUCCESS:
        print(f"[TX] {TOPIC_MEDICIONES} -> {payload}")
    else:
        print(f"[ERROR] Falló publicación ({result.rc})")


def build_client(client_id: str, username: str | None, password: str | None) -> mqtt.Client:
    client = mqtt.Client(client_id=client_id, protocol=mqtt.MQTTv311)
    if username:
        client.username_pw_set(username, password=password)

    client.on_connect = on_connect
    client.on_message = on_message
    return client
