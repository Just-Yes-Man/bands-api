"""Conexión MQTT con la API: suscripción de pedidos y publicación de avances/mediciones."""

from __future__ import annotations

import json
import os
import random
import ssl
import threading
import time
from dataclasses import dataclass
from typing import Any, Dict

import paho.mqtt.client as mqtt

from simulador.logica_simulador import (
    build_avance_event,
    build_faulty_measurement_event,
    build_measurement_error_event,
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
DEFAULT_TLS = os.getenv("MQTT_TLS", "false").lower() == "true"

TOPIC_PEDIDOS_CREACION = "pedidos/creacion"
TOPIC_PEDIDOS_AVANCES = "pedidos/avances"
TOPIC_MEDICIONES = "productos/mediciones"
TOPIC_ERRORES_MEDICION = os.getenv(
    "SIM_MEASUREMENT_ERROR_TOPIC",
    "productos/mediciones/errores",
)

PROGRESS_DELAY_SEC = float(os.getenv("SIM_PROGRESS_DELAY_SEC", "0.75"))
STAGE_DELAY_SEC = float(os.getenv("SIM_STAGE_DELAY_SEC", "20"))
BAND_COUNT = int(os.getenv("SIM_BAND_COUNT", "5"))
REWORK_DELAY_SEC = float(os.getenv("SIM_REWORK_DELAY_SEC", "2"))
ERROR_PATTERN = (True, False, False)


order_sequence_lock = threading.Lock()
order_sequence_number = 0


@dataclass(frozen=True)
class MqttConnectionSettings:
    broker: str
    port: int
    username: str | None
    password: str | None
    use_tls: bool = False


def split_counts(total: int, bands: int) -> list[int]:
    if bands <= 0:
        return [total]
    base = total // bands
    remainder = total % bands
    return [base + (1 if idx < remainder else 0) for idx in range(bands)]


def estimate_line_time_sec(
    cantidad: int,
    bands: int,
    stage_delay_sec: float,
    progress_delay_sec: float,
) -> float:
    if cantidad <= 0:
        return 0.0
    band_counts = split_counts(cantidad, bands)
    max_band = max(band_counts) if band_counts else cantidad
    return (stage_delay_sec * 2.0) + (max_band * progress_delay_sec)


def _fallback_settings() -> MqttConnectionSettings:
    return MqttConnectionSettings(
        broker=DEFAULT_BROKER,
        port=DEFAULT_PORT,
        username=DEFAULT_USERNAME,
        password=DEFAULT_PASSWORD,
        use_tls=DEFAULT_TLS,
    )


def _coerce_settings(settings: Any) -> MqttConnectionSettings:
    if isinstance(settings, MqttConnectionSettings):
        return settings
    return _fallback_settings()


def _connect_publisher_client(
    client: mqtt.Client,
    settings: MqttConnectionSettings,
) -> None:
    client.connect(settings.broker, settings.port, keepalive=60)
    client.loop_start()

    deadline = time.monotonic() + 5.0
    while not client.is_connected() and time.monotonic() < deadline:
        time.sleep(0.05)

    if not client.is_connected():
        raise TimeoutError("No se confirmó la conexión MQTT del publicador")


def on_connect(client: mqtt.Client, _userdata: Any, _flags: Dict[str, Any], rc: int):
    if rc != 0:
        print(f"[ERROR] No se pudo conectar al broker MQTT (rc={rc})")
        return

    print("[INFO] Conectado al broker MQTT")
    client.subscribe(TOPIC_PEDIDOS_CREACION, qos=1)
    print(f"[INFO] Suscripto a: {TOPIC_PEDIDOS_CREACION}")


def on_message(client: mqtt.Client, userdata: Any, msg: mqtt.MQTTMessage):
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
        normalized_lineas = []
        for linea in lineas:
            normalized = normalize_line(linea)
            cantidad = int(normalized.get("cantidad") or 0)
            normalized["expectedSec"] = round(
                estimate_line_time_sec(
                    cantidad,
                    BAND_COUNT,
                    STAGE_DELAY_SEC,
                    PROGRESS_DELAY_SEC,
                ),
                2,
            )
            normalized_lineas.append(normalized)
        HUB.emit(
            "pedido.creado",
            {
                "orderId": order_id,
                "lineas": normalized_lineas,
            },
        )

    inject_order_error = should_inject_error_for_next_order()

    threading.Thread(
        target=simulate_order,
        args=(userdata, order_id, lineas, inject_order_error),
        daemon=True,
    ).start()


def simulate_order(
    settings: MqttConnectionSettings,
    order_id: Any,
    lineas: list[Dict[str, Any]],
    inject_order_error: bool,
):
    settings = _coerce_settings(settings)
    time.sleep(STAGE_DELAY_SEC)
    order_error_consumed = False

    for linea in lineas:
        normalized = normalize_line(linea)
        line_id = normalized.get("id")
        modelo_producto_id = normalized.get("modeloProductoId")
        cantidad = normalized.get("cantidad") or 0

        if not line_id or not modelo_producto_id or cantidad <= 0:
            continue

        line_client_id = (
            f"emulador-linea-{order_id}-{line_id}-"
            f"{random.randint(1000, 9999)}"
        )
        line_client = build_client(
            line_client_id,
            settings.username,
            settings.password,
            use_tls=settings.use_tls,
            attach_callbacks=False,
        )

        try:
            _connect_publisher_client(line_client, settings)

            inject_error = inject_order_error and not order_error_consumed
            if inject_error:
                order_error_consumed = True
                faulty_medicion = build_faulty_measurement_event(
                    order_id,
                    line_id,
                    modelo_producto_id,
                    TOPIC_PEDIDOS_CREACION,
                )
                error_event = build_measurement_error_event(
                    order_id,
                    line_id,
                    modelo_producto_id,
                    faulty_medicion,
                )
                faulty_payload = json.dumps(faulty_medicion, ensure_ascii=False)
                faulty_result = line_client.publish(TOPIC_MEDICIONES, faulty_payload, qos=1)
                faulty_result.wait_for_publish()
                if faulty_result.rc == mqtt.MQTT_ERR_SUCCESS:
                    print(f"[TX] {TOPIC_MEDICIONES} -> {faulty_payload}")
                    HUB.emit(
                        "pedido.inspeccion.error",
                        {
                            "orderId": order_id,
                            "lineaPedidoId": line_id,
                            "modeloProductoId": modelo_producto_id,
                            "reason": faulty_medicion.get("faultType"),
                            "expected": error_event.get("expected"),
                            "received": error_event.get("received"),
                            "faultyIdempotencyKey": error_event.get("faultyIdempotencyKey"),
                        },
                    )
                else:
                    print(f"[ERROR] Falló publicación ({faulty_result.rc})")

                error_payload = json.dumps(error_event, ensure_ascii=False)
                error_result = line_client.publish(TOPIC_ERRORES_MEDICION, error_payload, qos=1)
                error_result.wait_for_publish()
                if error_result.rc == mqtt.MQTT_ERR_SUCCESS:
                    print(f"[TX] {TOPIC_ERRORES_MEDICION} -> {error_payload}")
                else:
                    print(f"[ERROR] Falló publicación ({error_result.rc})")

                time.sleep(REWORK_DELAY_SEC)

            medicion = build_measurement_event(
                order_id,
                line_id,
                modelo_producto_id,
                TOPIC_PEDIDOS_CREACION,
            )
            medicion_payload = json.dumps(medicion, ensure_ascii=False)
            medicion_result = line_client.publish(TOPIC_MEDICIONES, medicion_payload, qos=1)
            medicion_result.wait_for_publish()
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
                band_client_id = (
                    f"emulador-banda-{order_id}-{line_id}-{band_index + 1}-"
                    f"{random.randint(1000, 9999)}"
                )
                band_client = build_client(
                    band_client_id,
                    settings.username,
                    settings.password,
                    use_tls=settings.use_tls,
                    attach_callbacks=False,
                )

                try:
                    _connect_publisher_client(band_client, settings)
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
                        avance_result = band_client.publish(TOPIC_PEDIDOS_AVANCES, avance_payload, qos=1)
                        avance_result.wait_for_publish()
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
                except Exception as exc:
                    print(f"[ERROR] Banda {band_id} no pudo operar su conexión MQTT: {exc}")
                finally:
                    try:
                        band_client.loop_stop()
                    finally:
                        band_client.disconnect()

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
        except Exception as exc:
            print(f"[ERROR] Línea {line_id} no pudo operar su conexión MQTT: {exc}")
        finally:
            try:
                line_client.loop_stop()
            finally:
                line_client.disconnect()


def should_inject_error_for_next_order() -> bool:
    global order_sequence_number
    with order_sequence_lock:
        inject_error = ERROR_PATTERN[order_sequence_number % len(ERROR_PATTERN)]
        order_sequence_number += 1
        return inject_error


def build_client(
    client_id: str,
    username: str | None,
    password: str | None,
    use_tls: bool = False,
    user_data: Any = None,
    attach_callbacks: bool = True,
) -> mqtt.Client:
    client = mqtt.Client(client_id=client_id, protocol=mqtt.MQTTv311)
    if username:
        client.username_pw_set(username, password=password)

    if use_tls:
        client.tls_set(cert_reqs=ssl.CERT_REQUIRED)
        client.tls_insecure_set(False)

    if user_data is not None:
        client.user_data_set(user_data)

    if attach_callbacks:
        client.on_connect = on_connect
        client.on_message = on_message
    return client
