"""Parseo tolerante de payloads recibidos por MQTT."""

from __future__ import annotations

import json
from typing import Any, Dict


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
