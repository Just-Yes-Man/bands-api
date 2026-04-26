#!/usr/bin/env python3
"""Emulador MQTT para pedidos de producto.

Escucha pedidos en:
- pedidos/creacion (evento pedido.creado)
- pedidos/avances (evento pedido.avance)

Y responde con mediciones inventadas en:
- productos/mediciones
"""

from __future__ import annotations

import argparse
import json
import os
import random
import signal
import sys
import time
from datetime import datetime, timezone
from typing import Any, Dict

import paho.mqtt.client as mqtt


DEFAULT_BROKER = os.getenv("MQTT_BROKER", "localhost")
DEFAULT_PORT = int(os.getenv("MQTT_PORT", "1883"))
DEFAULT_USERNAME = os.getenv("MQTT_USERNAME")
DEFAULT_PASSWORD = os.getenv("MQTT_PASSWORD")

TOPIC_PEDIDOS_CREACION = "pedidos/creacion"
TOPIC_PEDIDOS_AVANCES = "pedidos/avances"
TOPIC_MEDICIONES = "productos/mediciones"


running = True


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def parse_payload(payload_raw: bytes) -> Dict[str, Any]:
    if not payload_raw:
        return {}

    payload_str = payload_raw.decode("utf-8", errors="replace").strip()
    if not payload_str:
        return {}

    try:
        data = json.loads(payload_str)
        if isinstance(data, dict):
            return data
        return {"raw": data}
    except json.JSONDecodeError:
        return {"raw": payload_str}


def build_mediciones(pedido: Dict[str, Any], origen_topic: str) -> Dict[str, Any]:
    pedido_id = (
        pedido.get("pedidoId")
        or pedido.get("pedido_id")
        or pedido.get("id")
        or f"pedido-{random.randint(1000, 9999)}"
    )

    producto = pedido.get("producto") or pedido.get("product") or {}
    if not isinstance(producto, dict):
        producto = {"nombre": str(producto)}

    producto_id = (
        producto.get("productoId")
        or producto.get("id")
        or pedido.get("productoId")
        or f"prod-{random.randint(10, 99)}"
    )

    base = random.uniform(20.0, 28.0)
    mediciones = {
        "pedidoId": pedido_id,
        "productoId": producto_id,
        "origen": origen_topic,
        "timestamp": now_iso(),
        "mediciones": {
            "temperatura_c": round(base + random.uniform(-2.0, 2.0), 2),
            "humedad_pct": round(random.uniform(35.0, 85.0), 2),
            "vibracion_rms": round(random.uniform(0.05, 1.4), 3),
            "presion_kpa": round(random.uniform(95.0, 108.0), 2),
            "consumo_w": round(random.uniform(20.0, 450.0), 2),
        },
        "evento": "producto.mediciones.generadas",
    }

    avance = pedido.get("avance")
    if avance is not None:
        mediciones["avance"] = avance

    return mediciones


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


def handle_signal(_signum: int, _frame: Any):
    global running
    running = False


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Emulador MQTT: recibe pedidos y devuelve mediciones inventadas."
    )
    parser.add_argument("--broker", default=DEFAULT_BROKER, help="Host del broker MQTT")
    parser.add_argument("--port", type=int, default=DEFAULT_PORT, help="Puerto del broker MQTT")
    parser.add_argument("--client-id", default=f"emulador-producto-{random.randint(1000,9999)}")
    parser.add_argument("--username", default=DEFAULT_USERNAME)
    parser.add_argument("--password", default=DEFAULT_PASSWORD)
    return parser.parse_args()


def main() -> int:
    args = parse_args()

    signal.signal(signal.SIGINT, handle_signal)
    signal.signal(signal.SIGTERM, handle_signal)

    client = build_client(args.client_id, args.username, args.password)

    print(
        f"[INFO] Iniciando emulador MQTT en {args.broker}:{args.port} "
        f"(client-id={args.client_id})"
    )

    try:
        client.connect(args.broker, args.port, keepalive=60)
    except Exception as exc:
        print(f"[ERROR] No se pudo conectar al broker: {exc}")
        return 1

    client.loop_start()

    try:
        while running:
            time.sleep(0.25)
    finally:
        client.loop_stop()
        client.disconnect()
        print("[INFO] Emulador finalizado")

    return 0


if __name__ == "__main__":
    sys.exit(main())
