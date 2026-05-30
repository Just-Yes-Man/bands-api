#!/usr/bin/env python3
"""Emulador MQTT para pedidos de producto.

Escucha pedidos en:
- pedidos/creacion (evento pedido.creado)

Y publica eventos en:
- pedidos/avances (avance por linea)
- productos/mediciones (una medicion por linea)
"""

from __future__ import annotations

import argparse
import json
import os
import random
import threading
import time
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

PROGRESS_DELAY_SEC = float(os.getenv("SIM_PROGRESS_DELAY_SEC", "0.35"))
STAGE_DELAY_SEC = float(os.getenv("SIM_STAGE_DELAY_SEC", "15"))


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


def extract_order_detail(pedido: Dict[str, Any]) -> Dict[str, Any]:
    if not isinstance(pedido, dict):
        return {"order_id": None, "lineas": []}

    order = pedido.get("order") or pedido.get("pedido") or {}
    if not isinstance(order, dict):
        order = {}

    order_id = (
        order.get("id")
        or pedido.get("pedidoId")
        or pedido.get("pedido_id")
        or pedido.get("id")
    )

    lineas = pedido.get("lineas") or order.get("lineas") or pedido.get("lines") or []
    if not isinstance(lineas, list):
        lineas = []

    return {"order_id": order_id, "lineas": lineas}


def normalize_line(linea: Dict[str, Any]) -> Dict[str, Any]:
    if not isinstance(linea, dict):
        return {"id": None, "modeloProductoId": None, "cantidad": 0}

    return {
        "id": linea.get("id") or linea.get("lineaPedidoId") or linea.get("linea_id"),
        "modeloProductoId": linea.get("modeloProductoId")
        or linea.get("modelo_producto_id")
        or linea.get("productoId"),
        "cantidad": int(linea.get("cantidad") or 0),
    }


def build_avance_event(
    order_id: Any,
    line_id: Any,
    modelo_producto_id: Any,
    delta_procesadas: int,
    delta_rechazadas: int,
    secuencia: int,
    total: int,
) -> Dict[str, Any]:
    return {
        "event": "pedido.avance",
        "source": "emulador",
        "occurredAt": now_iso(),
        "pedidoId": order_id,
        "lineaPedidoId": line_id,
        "modeloProductoId": modelo_producto_id,
        "deltaProcesadas": delta_procesadas,
        "deltaRechazadas": delta_rechazadas,
        "secuencia": secuencia,
        "total": total,
    }


def build_measurement_event(
    order_id: Any,
    line_id: Any,
    modelo_producto_id: Any,
    origen_topic: str,
) -> Dict[str, Any]:
    base = build_mediciones(
        {
            "pedidoId": order_id,
            "producto": {"productoId": modelo_producto_id},
        },
        origen_topic,
    )

    base.update(
        {
            "event": "producto.medicion",
            "source": "emulador",
            "pedidoId": order_id,
            "lineaPedidoId": line_id,
            "modeloProductoId": modelo_producto_id,
            "idempotencyKey": f"mqtt-{order_id}-{line_id}",
            "qrOk": True,
            "pesoOk": True,
            "colorOk": True,
            "alturaOk": True,
        }
    )

    return base


def on_connect(client: mqtt.Client, _userdata: Any, _flags: Dict[str, Any], rc: int):
    if rc != 0:
        print(f"[ERROR] No se pudo conectar al broker MQTT (rc={rc})")
        return

    print("[INFO] Conectado al broker MQTT")
    client.subscribe(TOPIC_PEDIDOS_CREACION, qos=1)
    print(f"[INFO] Suscripto a: {TOPIC_PEDIDOS_CREACION}")


def on_message(client: mqtt.Client, _userdata: Any, msg: mqtt.MQTTMessage):
    pedido = parse_payload(msg.payload)
    print(f"[RX] {msg.topic} -> {pedido}")

    if msg.topic != TOPIC_PEDIDOS_CREACION:
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


def simulate_order(client: mqtt.Client, order_id: Any, lineas: list[Dict[str, Any]]):
    time.sleep(STAGE_DELAY_SEC)

    for linea in lineas:
        normalized = normalize_line(linea)
        line_id = normalized.get("id")
        modelo_producto_id = normalized.get("modeloProductoId")
        cantidad = normalized.get("cantidad") or 0

        if not line_id or not modelo_producto_id or cantidad <= 0:
            continue

        medicion = build_measurement_event(
            order_id,
            line_id,
            modelo_producto_id,
            TOPIC_PEDIDOS_CREACION,
        )
        medicion_payload = json.dumps(medicion, ensure_ascii=False)
        medicion_result = client.publish(TOPIC_MEDICIONES, medicion_payload, qos=1)
        if medicion_result.rc == mqtt.MQTT_ERR_SUCCESS:
            print(f"[TX] {TOPIC_MEDICIONES} -> {medicion_payload}")
        else:
            print(f"[ERROR] Falló publicación ({medicion_result.rc})")

        time.sleep(STAGE_DELAY_SEC)

        for idx in range(int(cantidad)):
            avance = build_avance_event(
                order_id,
                line_id,
                modelo_producto_id,
                delta_procesadas=1,
                delta_rechazadas=0,
                secuencia=idx + 1,
                total=int(cantidad),
            )
            avance_payload = json.dumps(avance, ensure_ascii=False)
            avance_result = client.publish(TOPIC_PEDIDOS_AVANCES, avance_payload, qos=1)
            if avance_result.rc == mqtt.MQTT_ERR_SUCCESS:
                print(f"[TX] {TOPIC_PEDIDOS_AVANCES} -> {avance_payload}")
            else:
                print(f"[ERROR] Falló publicación ({avance_result.rc})")

            time.sleep(PROGRESS_DELAY_SEC)


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
