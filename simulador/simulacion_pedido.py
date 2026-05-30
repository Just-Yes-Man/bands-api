"""Secuencia de simulacion para mediciones y avances de un pedido."""

from __future__ import annotations

import time
from typing import Any, Dict

import paho.mqtt.client as mqtt

from simulador.config import (
    PROGRESS_DELAY_SEC,
    STAGE_DELAY_SEC,
    TOPIC_MEDICIONES,
    TOPIC_PEDIDOS_AVANCES,
    TOPIC_PEDIDOS_CREACION,
)
from simulador.eventos import build_avance_event, build_measurement_event
from simulador.errores import trigger_band_stop_error, wait_if_band_stopped
from simulador.mqtt_publicador import publish_json
from simulador.order_payload import normalize_line


def simulate_order(client: mqtt.Client, order_id: Any, lineas: list[Dict[str, Any]]):
    wait_if_band_stopped()
    time.sleep(STAGE_DELAY_SEC)

    for linea in lineas:
        wait_if_band_stopped()
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
        publish_json(client, TOPIC_MEDICIONES, medicion)
        trigger_band_stop_error(client, order_id=order_id, line_id=line_id)
        wait_if_band_stopped()

        time.sleep(STAGE_DELAY_SEC)

        for idx in range(int(cantidad)):
            wait_if_band_stopped()
            avance = build_avance_event(
                order_id,
                line_id,
                modelo_producto_id,
                delta_procesadas=1,
                delta_rechazadas=0,
                secuencia=idx + 1,
                total=int(cantidad),
            )
            publish_json(client, TOPIC_PEDIDOS_AVANCES, avance)

            time.sleep(PROGRESS_DELAY_SEC)
