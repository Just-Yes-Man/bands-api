#!/usr/bin/env python3
"""Wrapper compatible para ejecutar el emulador MQTT desde la raiz."""

from __future__ import annotations

import sys

from simulador.main import main


if __name__ == "__main__":
    sys.exit(main())
