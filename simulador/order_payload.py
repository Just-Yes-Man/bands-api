"""Extraccion y normalizacion de pedidos recibidos por el emulador."""

from __future__ import annotations

from typing import Any, Dict


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
