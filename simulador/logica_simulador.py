"""Lógica base del simulador: parseo de pedidos y generación de eventos sintéticos."""

from __future__ import annotations

import json
import random
from datetime import datetime, timezone
from typing import Any, Dict


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
