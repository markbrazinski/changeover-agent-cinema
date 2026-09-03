"""
Recorder Module.
Records structured tool-call traces: {tool, args, result_or_miss, latency_ms, ts}.
"""
import os
import json
import time
from typing import Dict, Any, List, Optional


class TraceRecorder:
    """
    Structured trace recorder for tool calls and telemetry query steps.
    """

    def __init__(self, channel_id: str, log_dir: str = "logs/traces"):
        self.channel_id = channel_id
        self.log_dir = log_dir
        self.trace_file = os.path.join(self.log_dir, f"trace_{channel_id}.json")
        self.records: List[Dict[str, Any]] = []
        os.makedirs(self.log_dir, exist_ok=True)

    def record_call(
        self,
        tool: str,
        args: Dict[str, Any],
        result_or_miss: Any,
        latency_ms: float,
        timestamp: Optional[float] = None,
    ) -> Dict[str, Any]:
        """
        Records a single tool or query invocation.
        """
        record = {
            "tool": tool,
            "args": args,
            "result_or_miss": result_or_miss,
            "latency_ms": round(latency_ms, 2),
            "ts": timestamp if timestamp is not None else time.time(),
        }
        self.records.append(record)
        self.save()
        return record

    def save(self) -> None:
        """Saves trace records to disk."""
        with open(self.trace_file, "w", encoding="utf-8") as f:
            json.dump(self.records, f, indent=2)

    def flush(self) -> None:
        """Alias for save()."""
        self.save()

    def get_records(self) -> List[Dict[str, Any]]:
        """Returns all recorded trace items, loading from disk if needed."""
        if not self.records and os.path.exists(self.trace_file):
            try:
                with open(self.trace_file, "r", encoding="utf-8") as f:
                    self.records = json.load(f)
            except Exception:
                pass
        return self.records
