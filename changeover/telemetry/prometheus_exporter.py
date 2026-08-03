"""
Prometheus Exporter Module.
Exposes measured metrics via Prometheus Gauge and remote-writes live samples directly to Grafana Cloud Prometheus.
"""
import os
import time
import struct
import logging
import requests
from typing import Dict, List, Optional
from dotenv import load_dotenv
from prometheus_client import Gauge, start_http_server, CollectorRegistry, REGISTRY

load_dotenv()

logger = logging.getLogger(__name__)

CAPTION_OFFSET_GAUGE = Gauge(
    "caption_cue_sync_offset_seconds",
    "Measured offset in seconds between advancing program clock and last published caption cue",
    ["channel"],
)

LIVENESS_GAUGE = Gauge(
    "feed_liveness_seconds",
    "Measured feed liveness gap in seconds for stand-in feed",
    ["channel", "layer"],
)


def _encode_varint(value: int) -> bytes:
    out = []
    while value >= 0x80:
        out.append((value & 0x7F) | 0x80)
        value >>= 7
    out.append(value & 0x7F)
    return bytes(out)


def _encode_string(field_num: int, val_bytes: bytes) -> bytes:
    tag = (field_num << 3) | 2
    return _encode_varint(tag) + _encode_varint(len(val_bytes)) + val_bytes


def _encode_label(name: str, val: str) -> bytes:
    b1 = _encode_string(1, name.encode("utf-8"))
    b2 = _encode_string(2, val.encode("utf-8"))
    return _encode_string(1, b1 + b2)


def _encode_sample(value: float, timestamp_ms: int) -> bytes:
    b1 = _encode_varint((1 << 3) | 1) + struct.pack("<d", float(value))
    b2 = _encode_varint((2 << 3) | 0) + _encode_varint(timestamp_ms)
    return _encode_string(2, b1 + b2)


def _encode_timeseries(labels: Dict[str, str], value: float, timestamp_ms: int) -> bytes:
    body = b""
    for k in sorted(labels.keys()):
        body += _encode_label(k, labels[k])
    body += _encode_sample(value, timestamp_ms)
    return _encode_string(1, body)


def remote_write_to_grafana_cloud(
    labels: Dict[str, str], value: float, timestamp_ms: Optional[int] = None
) -> bool:
    """
    Pushes a live metric sample directly to Grafana Cloud Prometheus via Remote Write.
    """
    url = os.getenv("GRAFANA_CLOUD_PROM_REMOTE_WRITE_URL")
    user = os.getenv("GRAFANA_CLOUD_PROM_USERNAME")
    token = os.getenv("GRAFANA_CLOUD_PROM_TOKEN")

    if not url or not user or not token:
        logger.warning("Remote Write credentials missing in .env")
        return False

    ts_ms = timestamp_ms if timestamp_ms is not None else int(time.time() * 1000)

    try:
        import cramjam
        ts_bytes = _encode_timeseries(labels, value, ts_ms)
        compressed = bytes(cramjam.snappy.compress_raw(ts_bytes))

        headers = {
            "Content-Type": "application/x-protobuf",
            "Content-Encoding": "snappy",
            "X-Prometheus-Remote-Write-Version": "0.1.0",
        }

        res = requests.post(
            url, auth=(user, token), headers=headers, data=compressed, timeout=4.0
        )
        if res.status_code in (200, 204):
            logger.info(f"Successfully remote-written metric {labels.get('__name__')}={value:.3f} to Grafana Cloud")
            return True
        else:
            logger.warning(f"Remote Write returned HTTP {res.status_code}: {res.text}")
            return False
    except Exception as e:
        logger.warning(f"Remote Write push failed: {e}")
        return False


class PrometheusExporter:
    """
    Exposes measured telemetry gauges locally and remote-writes to Grafana Cloud.
    """

    def __init__(self, port: int = 8000, registry: CollectorRegistry = REGISTRY):
        self.port = port
        self.registry = registry
        self.history: List[Dict[str, Any]] = []
        self._server_started = False

    def start_server(self) -> None:
        if not self._server_started:
            try:
                start_http_server(self.port, registry=self.registry)
                self._server_started = True
            except Exception as e:
                logger.warning(f"Could not start Prometheus HTTP server on port {self.port}: {e}")

    def update_caption_offset(
        self, channel_id: str, offset_seconds: float, timestamp: Optional[float] = None, push_remote: bool = True
    ) -> None:
        CAPTION_OFFSET_GAUGE.labels(channel=channel_id).set(offset_seconds)
        ts = timestamp if timestamp is not None else time.time()
        self.history.append({"timestamp": ts, "channel": channel_id, "metric": "caption_offset", "value": offset_seconds})

        if push_remote:
            labels = {"__name__": "caption_cue_sync_offset_seconds", "channel": channel_id}
            remote_write_to_grafana_cloud(labels, offset_seconds, timestamp_ms=int(ts * 1000))

    def update_liveness_gap(
        self, channel_id: str, gap_seconds: float, layer: str = "sign_language", timestamp: Optional[float] = None, push_remote: bool = True
    ) -> None:
        LIVENESS_GAUGE.labels(channel=channel_id, layer=layer).set(gap_seconds)
        ts = timestamp if timestamp is not None else time.time()
        self.history.append({"timestamp": ts, "channel": channel_id, "metric": "liveness_gap", "layer": layer, "value": gap_seconds})

        if push_remote:
            labels = {"__name__": "feed_liveness_seconds", "channel": channel_id, "layer": layer}
            remote_write_to_grafana_cloud(labels, gap_seconds, timestamp_ms=int(ts * 1000))

    def seed_history(
        self, caption_meter, channel_id: str, duration_seconds: float = 600.0, step_seconds: float = 2.0
    ) -> None:
        now = time.time()
        start_time = now - duration_seconds
        num_steps = int(duration_seconds / step_seconds)

        orig_pos = caption_meter.program_clock.get_position()
        orig_frozen = caption_meter.publisher_frozen

        caption_meter.program_clock.set_position(0.0)
        caption_meter.clear_fault()

        for step in range(num_steps):
            step_ts = start_time + (step * step_seconds)
            caption_meter.program_clock.tick(step_seconds)
            offset = caption_meter.update()
            self.history.append({"timestamp": step_ts, "channel": channel_id, "value": offset})

        caption_meter.program_clock.set_position(orig_pos)
        caption_meter.publisher_frozen = orig_frozen
        current_offset = caption_meter.update()
        self.update_caption_offset(channel_id, current_offset, timestamp=now)
