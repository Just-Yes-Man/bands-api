"""Estado de errores operativos que pueden pausar el emulador."""

from __future__ import annotations

import threading
import time
from typing import Any, Dict

import paho.mqtt.client as mqtt

from simulador.config import (
    SIM_BAND_ERROR_CODE,
    SIM_BAND_ERROR_ENABLED,
    SIM_BAND_ERROR_MESSAGE,
    TOPIC_BANDAS_ALERTAS,
    TOPIC_BANDAS_ERROR_RESOLVER,
)
from simulador.eventos import now_iso
from simulador.mqtt_publicador import publish_json

_lock = threading.Lock()
_resume_event = threading.Event()
_resume_event.set()
_active_error: Dict[str, Any] | None = None
_default_error_triggered = False


def trigger_band_stop_error(
    client: mqtt.Client,
    order_id: Any | None = None,
    line_id: Any | None = None,
) -> Dict[str, Any] | None:
    """Activa una falla una sola vez y detiene todas las bandas simuladas."""

    global _active_error, _default_error_triggered

    if not SIM_BAND_ERROR_ENABLED:
        return None

    with _lock:
        if _active_error:
            return _active_error

        if _default_error_triggered:
            return None

        _default_error_triggered = True
        error_id = f"band-stop-{int(time.time() * 1000)}"
        _active_error = {
            "event": "bandas.error",
            "source": "emulador",
            "errorId": error_id,
            "codigo": SIM_BAND_ERROR_CODE,
            "estado": "ACTIVO",
            "severidad": "CRITICA",
            "mensaje": SIM_BAND_ERROR_MESSAGE,
            "afecta": "TODAS_LAS_BANDAS",
            "pedidoId": order_id,
            "lineaPedidoId": line_id,
            "occurredAt": now_iso(),
        }
        _resume_event.clear()
        payload = dict(_active_error)

    publish_json(client, TOPIC_BANDAS_ALERTAS, payload)
    print(
        "[ALERTA] Bandas detenidas. Esperando resolucion en "
        f"{TOPIC_BANDAS_ERROR_RESOLVER}"
    )
    return payload


def wait_if_band_stopped():
    if _resume_event.is_set():
        return

    print("[INFO] Simulacion pausada por alerta critica de bandas")
    _resume_event.wait()
    print("[INFO] Bandas reanudadas")


def resolve_band_stop_error(client: mqtt.Client, payload: Dict[str, Any]) -> bool:
    global _active_error

    event = payload.get("event") or payload.get("evento")
    if event and event != "bandas.error.resolver":
        print(f"[WARN] Evento de resolucion no soportado: {event}")
        return False

    with _lock:
        if not _active_error:
            print("[WARN] No hay alerta activa para resolver")
            return False

        requested_id = payload.get("errorId")
        if requested_id and requested_id != _active_error.get("errorId"):
            print(
                "[WARN] La resolucion no coincide con la alerta activa "
                f"({requested_id} != {_active_error.get('errorId')})"
            )
            return False

        resolved_payload = {
            **_active_error,
            "event": "bandas.error.resuelto",
            "estado": "RESUELTO",
            "resolvedAt": now_iso(),
            "resolvedBy": payload.get("resolvedBy") or payload.get("actor") or "front",
        }
        _active_error = None
        _resume_event.set()

    publish_json(client, TOPIC_BANDAS_ALERTAS, resolved_payload)
    return True
