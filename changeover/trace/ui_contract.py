"""
UI Contract Module.
Exposes metric-series and trace surfaces for front end binding.
"""
import os
import json
from typing import Dict, Any, List, Optional
from changeover.trace.recorder import TraceRecorder
from changeover.action.failover_tool import read_channel_state


def get_ui_contract_data(channel_id: str, log_dir: str = "logs/traces", state_dir: str = "logs/state") -> Dict[str, Any]:
    """
    Exposes unified UI contract data surface for front-end binding.
    """
    recorder = TraceRecorder(channel_id, log_dir=log_dir)
    trace_records = recorder.get_records()
    channel_state = read_channel_state(channel_id, state_dir=state_dir)

    # Extract metric series from trace records
    metric_series: List[Dict[str, Any]] = []
    for rec in trace_records:
        if rec.get("tool") == "telemetry.read":
            result = rec.get("result_or_miss", {})
            if isinstance(result, dict):
                metric_series.append({
                    "ts": rec.get("ts"),
                    "caption_offset": result.get("caption_offset_seconds"),
                    "liveness_gap": result.get("liveness_gap_seconds"),
                })

    return {
        "channel": channel_id,
        "active_source": channel_state.get("active_source", "primary"),
        "restored": channel_state.get("restored", False),
        "human_authorizer": channel_state.get("human_authorizer"),
        "metric_series": metric_series,
        "trace_records": trace_records,
    }
