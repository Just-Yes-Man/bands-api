"""Conexión MQTT con la API: suscripción de pedidos y publicación de avances/mediciones."""

from __future__ import annotations

import json
import os
import threading
import time
from typing import Any, Dict

import paho.mqtt.client as mqtt

from simulador.logica_simulador import (
    build_avance_event,
    build_measurement_event,
    extract_order_detail,
    normalize_line,
    parse_payload,
)
from simulador.ui_server import HUB

DEFAULT_BROKER = os.getenv("MQTT_BROKER", "localhost")
DEFAULT_PORT = int(os.getenv("MQTT_PORT", "1883"))
DEFAULT_USERNAME = os.getenv("MQTT_USERNAME")
DEFAULT_PASSWORD = os.getenv("MQTT_PASSWORD")

TOPIC_PEDIDOS_CREACION = "pedidos/creacion"
TOPIC_PEDIDOS_AVANCES = "pedidos/avances"
TOPIC_MEDICIONES = "productos/mediciones"

PROGRESS_DELAY_SEC = float(os.getenv("SIM_PROGRESS_DELAY_SEC", "0.75"))
STAGE_DELAY_SEC = float(os.getenv("SIM_STAGE_DELAY_SEC", "20"))
BAND_COUNT = int(os.getenv("SIM_BAND_COUNT", "5"))


def split_counts(total: int, bands: int) -> list[int]:
    if bands <= 0:
        return [total]
    base = total // bands
    remainder = total % bands
    return [base + (1 if idx < remainder else 0) for idx in range(bands)]


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

    if order_id and lineas:
        normalized_lineas = [normalize_line(linea) for linea in lineas]
        HUB.emit(
            "pedido.creado",
            {
                "orderId": order_id,
                "lineas": normalized_lineas,
            },
        )

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
            HUB.emit(
                "pedido.inspeccionado",
                {
                    "orderId": order_id,
                    "lineaPedidoId": line_id,
                    "modeloProductoId": modelo_producto_id,
                    "ok": True,
                },
            )
        else:
            print(f"[ERROR] Falló publicación ({medicion_result.rc})")

        time.sleep(STAGE_DELAY_SEC)

        band_counts = split_counts(int(cantidad), BAND_COUNT)
        band_threads: list[threading.Thread] = []

        def run_band(band_index: int, band_total: int) -> None:
            if band_total <= 0:
                return
            band_id = f"banda-{band_index + 1}"
            for idx in range(band_total):
                avance = build_avance_event(
                    order_id,
                    line_id,
                    modelo_producto_id,
                    delta_procesadas=1,
                    delta_rechazadas=0,
                    secuencia=idx + 1,
                    total=int(cantidad),
                    banda_id=band_id,
                )
                avance_payload = json.dumps(avance, ensure_ascii=False)
                avance_result = client.publish(TOPIC_PEDIDOS_AVANCES, avance_payload, qos=1)
                if avance_result.rc == mqtt.MQTT_ERR_SUCCESS:
                    print(f"[TX] {TOPIC_PEDIDOS_AVANCES} -> {avance_payload}")
                    HUB.emit(
                        "pedido.avance",
                        {
                            "orderId": order_id,
                            "lineaPedidoId": line_id,
                            "modeloProductoId": modelo_producto_id,
                            "secuencia": idx + 1,
                            "total": int(cantidad),
                            "bandaId": band_id,
                        },
                    )
                else:
                    print(f"[ERROR] Falló publicación ({avance_result.rc})")

                time.sleep(PROGRESS_DELAY_SEC)

        for band_index, band_total in enumerate(band_counts):
            thread = threading.Thread(target=run_band, args=(band_index, band_total), daemon=True)
            thread.start()
            band_threads.append(thread)

        for thread in band_threads:
            thread.join()

        HUB.emit(
            "pedido.clasificado",
            {
                "orderId": order_id,
                "lineaPedidoId": line_id,
                "modeloProductoId": modelo_producto_id,
                "total": int(cantidad),
                "ok": True,
            },
        )


def build_client(client_id: str, username: str | None, password: str | None) -> mqtt.Client:
    client = mqtt.Client(client_id=client_id, protocol=mqtt.MQTTv311)
    if username:
        client.username_pw_set(username, password=password)

    client.on_connect = on_connect
    client.on_message = on_message
    return client
