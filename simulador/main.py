#!/usr/bin/env python3
"""Punto de entrada del simulador MQTT de producto."""

from __future__ import annotations

import argparse
import os
import random
import signal
import sys
import time
from typing import Any

from simulador.conexion_api_mqtt import (
    DEFAULT_BROKER,
    DEFAULT_PASSWORD,
    DEFAULT_PORT,
    DEFAULT_USERNAME,
    build_client,
)
from simulador.ui_server import start_ui_server

running = True


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

    ui_host = os.getenv("SIM_UI_HOST", "0.0.0.0")
    ui_port = int(os.getenv("SIM_UI_PORT", "5055"))

    signal.signal(signal.SIGINT, handle_signal)
    signal.signal(signal.SIGTERM, handle_signal)

    client = build_client(args.client_id, args.username, args.password)

    start_ui_server(ui_host, ui_port)
    print(f"[INFO] UI disponible en http://{ui_host}:{ui_port}")

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
