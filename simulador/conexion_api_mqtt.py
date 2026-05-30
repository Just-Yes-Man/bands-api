"""Conexion MQTT con la API: suscripcion de pedidos y arranque de simulaciones."""

from __future__ import annotations

import threading
from typing import Any, Dict

import paho.mqtt.client as mqtt

from simulador.config import (
    DEFAULT_BROKER,
    DEFAULT_PASSWORD,
    DEFAULT_PORT,
    DEFAULT_USERNAME,
    TOPIC_BANDAS_ERROR_RESOLVER,
    TOPIC_PEDIDOS_CREACION,
)
from simulador.errores import resolve_band_stop_error
from simulador.order_payload import extract_order_detail
from simulador.payload_parser import parse_payload
from simulador.simulacion_pedido import simulate_order


def on_connect(client: mqtt.Client, _userdata: Any, _flags: Dict[str, Any], rc: int):
    if rc != 0:
        print(f"[ERROR] No se pudo conectar al broker MQTT (rc={rc})")
        return

    print("[INFO] Conectado al broker MQTT")
    client.subscribe(
        [
            (TOPIC_PEDIDOS_CREACION, 1),
            (TOPIC_BANDAS_ERROR_RESOLVER, 1),
        ]
    )
    print(f"[INFO] Suscripto a: {TOPIC_PEDIDOS_CREACION}")
    print(f"[INFO] Suscripto a: {TOPIC_BANDAS_ERROR_RESOLVER}")


def on_message(client: mqtt.Client, _userdata: Any, msg: mqtt.MQTTMessage):
    pedido = parse_payload(msg.payload)
    print(f"[RX] {msg.topic} -> {pedido}")

    if msg.topic != TOPIC_PEDIDOS_CREACION:
        if msg.topic == TOPIC_BANDAS_ERROR_RESOLVER:
            resolve_band_stop_error(client, pedido)
        return

    detail = extract_order_detail(pedido)
    order_id = detail.get("order_id")
    lineas = detail.get("lineas") or []

    if not order_id or not lineas:
        print("[WARN] Pedido sin lineas para simular")
        return

    threading.Thread(
        target=simulate_order,
        args=(client, order_id, lineas),
        daemon=True,
    ).start()


def build_client(client_id: str, username: str | None, password: str | None) -> mqtt.Client:
    client = mqtt.Client(client_id=client_id, protocol=mqtt.MQTTv311)
    if username:
        client.username_pw_set(username, password=password)

    client.on_connect = on_connect
    client.on_message = on_message
    return client
