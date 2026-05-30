"""Publicacion JSON sobre MQTT con logging uniforme."""

from __future__ import annotations

import json
from typing import Any, Dict

import paho.mqtt.client as mqtt


def publish_json(client: mqtt.Client, topic: str, payload: Dict[str, Any], qos: int = 1) -> bool:
    payload_raw = json.dumps(payload, ensure_ascii=False)
    result = client.publish(topic, payload_raw, qos=qos)
    if result.rc == mqtt.MQTT_ERR_SUCCESS:
        print(f"[TX] {topic} -> {payload_raw}")
        return True

    print(f"[ERROR] Fallo publicacion ({result.rc})")
    return False
