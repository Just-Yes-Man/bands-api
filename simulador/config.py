"""Configuracion y topicos del emulador MQTT."""

from __future__ import annotations

import os


DEFAULT_BROKER = os.getenv("MQTT_BROKER", "localhost")
DEFAULT_PORT = int(os.getenv("MQTT_PORT", "1883"))
DEFAULT_USERNAME = os.getenv("MQTT_USERNAME")
DEFAULT_PASSWORD = os.getenv("MQTT_PASSWORD")

TOPIC_PEDIDOS_CREACION = "pedidos/creacion"
TOPIC_PEDIDOS_AVANCES = "pedidos/avances"
TOPIC_MEDICIONES = "productos/mediciones"
TOPIC_BANDAS_ALERTAS = os.getenv("MQTT_TOPIC_BANDAS_ALERTAS", "bandas/alertas")
TOPIC_BANDAS_ERROR_RESOLVER = os.getenv(
    "MQTT_TOPIC_BANDAS_ERROR_RESOLVER",
    "bandas/errores/resolver",
)

PROGRESS_DELAY_SEC = float(os.getenv("SIM_PROGRESS_DELAY_SEC", "0.35"))
STAGE_DELAY_SEC = float(os.getenv("SIM_STAGE_DELAY_SEC", "15"))
SIM_BAND_ERROR_ENABLED = os.getenv("SIM_BAND_ERROR_ENABLED", "true").lower() == "true"
SIM_BAND_ERROR_CODE = os.getenv("SIM_BAND_ERROR_CODE", "BANDAS_DETENIDAS")
SIM_BAND_ERROR_MESSAGE = os.getenv(
    "SIM_BAND_ERROR_MESSAGE",
    "Todas las bandas fueron detenidas por una alerta critica.",
)
