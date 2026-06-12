"""Servidor HTTP simple para exponer la UI del emulador y eventos SSE."""

from __future__ import annotations

import json
import os
import queue
import threading
import time
import urllib.error
import urllib.parse
import urllib.request
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any

UI_DIR = Path(__file__).resolve().parent / "ui"
INDEX_PATH = UI_DIR / "index.html"
API_BASE_URL = os.getenv("SIM_API_BASE_URL", "http://localhost:1200/api/v1")
HISTORY_LIMIT = int(os.getenv("SIM_HISTORY_LIMIT", "30"))


class UiEventHub:
    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._subscribers: set[queue.Queue] = set()
        self._events: list[dict[str, Any]] = []
        self._max_events = int(os.getenv("SIM_UI_MAX_EVENTS", "200"))

    def subscribe(self) -> queue.Queue:
        q: queue.Queue = queue.Queue()
        with self._lock:
            self._subscribers.add(q)
        return q

    def unsubscribe(self, q: queue.Queue) -> None:
        with self._lock:
            self._subscribers.discard(q)

    def emit(self, event_type: str, payload: dict[str, Any]) -> None:
        message = {
            "event": event_type,
            "data": payload,
            "timestamp": time.time(),
        }
        with self._lock:
            self._events.append(message)
            if len(self._events) > self._max_events:
                self._events = self._events[-self._max_events :]
        with self._lock:
            subscribers = list(self._subscribers)
        for q in subscribers:
            try:
                q.put_nowait(message)
            except queue.Full:
                continue

    def snapshot(self) -> dict[str, Any]:
        with self._lock:
            return {"events": list(self._events)}


HUB = UiEventHub()


class UiRequestHandler(BaseHTTPRequestHandler):
    def log_message(self, format: str, *args: Any) -> None:
        return

    def do_GET(self) -> None:
        if self.path in ("/", "/index.html"):
            self._serve_index()
            return

        if self.path.startswith("/snapshot"):
            self._serve_snapshot()
            return

        if self.path.startswith("/history"):
            self._serve_history()
            return

        if self.path.startswith("/events"):
            self._serve_events()
            return

        self.send_error(HTTPStatus.NOT_FOUND, "Not found")

    def _serve_index(self) -> None:
        if not INDEX_PATH.exists():
            self.send_error(HTTPStatus.NOT_FOUND, "UI not found")
            return

        content = INDEX_PATH.read_bytes()
        self.send_response(HTTPStatus.OK)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(content)))
        self.end_headers()
        self.wfile.write(content)

    def _serve_events(self) -> None:
        self.send_response(HTTPStatus.OK)
        self.send_header("Content-Type", "text/event-stream")
        self.send_header("Cache-Control", "no-cache")
        self.send_header("Connection", "keep-alive")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()

        q = HUB.subscribe()
        try:
            while True:
                try:
                    message = q.get(timeout=10)
                except queue.Empty:
                    self._send_raw(b": ping\n\n")
                    continue

                payload = json.dumps(message, ensure_ascii=False).encode("utf-8")
                self._send_raw(b"event: message\n")
                self._send_raw(b"data: " + payload + b"\n\n")
        except (BrokenPipeError, ConnectionResetError):
            pass
        finally:
            HUB.unsubscribe(q)

    def _serve_snapshot(self) -> None:
        payload = json.dumps(HUB.snapshot(), ensure_ascii=False).encode("utf-8")
        self.send_response(HTTPStatus.OK)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(payload)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(payload)

    def _serve_history(self) -> None:
        try:
            payload = json.dumps(fetch_history(), ensure_ascii=False).encode("utf-8")
        except Exception as exc:
            payload = json.dumps(
                {
                    "ok": False,
                    "data": [],
                    "error": {
                        "code": "SIM_HISTORY_UNAVAILABLE",
                        "message": str(exc),
                    },
                },
                ensure_ascii=False,
            ).encode("utf-8")
        self.send_response(HTTPStatus.OK)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(payload)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(payload)

    def _send_raw(self, data: bytes) -> None:
        try:
            self.wfile.write(data)
            self.wfile.flush()
        except (BrokenPipeError, ConnectionResetError):
            raise


def start_ui_server(host: str, port: int) -> ThreadingHTTPServer:
    server = ThreadingHTTPServer((host, port), UiRequestHandler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    return server


def fetch_history() -> dict[str, Any]:
    query = urllib.parse.urlencode({"limit": HISTORY_LIMIT})
    errors: list[str] = []

    for url in build_history_urls(query):
        request = urllib.request.Request(url, headers={"Accept": "application/json"})
        try:
            with urllib.request.urlopen(request, timeout=5) as response:
                payload = response.read().decode("utf-8")
                data = json.loads(payload)
                if isinstance(data, dict):
                    return data
                return {"ok": True, "data": []}
        except urllib.error.HTTPError as exc:
            detail = exc.read().decode("utf-8", errors="replace")
            errors.append(
                f"{url} -> API respondio {exc.code}: {detail or exc.reason}"
            )
        except urllib.error.URLError as exc:
            errors.append(f"{url} -> No se pudo conectar: {exc.reason}")

    raise RuntimeError(" ; ".join(errors))


def build_history_urls(query: str) -> list[str]:
    base = API_BASE_URL.rstrip("/")
    candidates = [f"{base}/simulator/orders/history?{query}"]
    if not base.endswith("/api/v1"):
        candidates.insert(0, f"{base}/api/v1/simulator/orders/history?{query}")
    return candidates
