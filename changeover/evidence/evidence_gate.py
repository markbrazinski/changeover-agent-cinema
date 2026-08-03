"""
Evidence Gate Module.
4-tier trust gate: FRESH, STALE, PARTIAL, ABSENT.
"""
import time
from dataclasses import dataclass
from typing import Dict, Any, Optional


class EvidenceTier:
    FRESH = "fresh"
    STALE = "stale"
    PARTIAL = "partial"
    ABSENT = "absent"


@dataclass
class EvidenceEvaluation:
    tier: str
    is_trusted: bool
    reason: str
    telemetry_data: Optional[Dict[str, Any]] = None
    age_seconds: Optional[float] = None


class EvidenceGate:
    """
    Evaluates raw telemetry / Grafana query payloads into one of 4 trust tiers.
    """

    def __init__(self, heartbeat_threshold_seconds: float = 15.0):
        self.heartbeat_threshold = heartbeat_threshold_seconds

    def evaluate(
        self,
        mcp_status: str,
        telemetry_payload: Optional[Dict[str, Any]] = None,
        data_timestamp: Optional[float] = None,
        required_metrics: Optional[list] = None,
    ) -> EvidenceEvaluation:
        """
        Evaluates evidence quality and freshness.
        """
        if mcp_status == "blind" or telemetry_payload is None:
            return EvidenceEvaluation(
                tier=EvidenceTier.ABSENT,
                is_trusted=False,
                reason="Evidence absent or Grafana endpoint blind",
                telemetry_data=None,
            )

        # Extract result array
        results = telemetry_payload.get("data", {}).get("result", [])
        if not results:
            return EvidenceEvaluation(
                tier=EvidenceTier.ABSENT,
                is_trusted=False,
                reason="Query result vector is empty",
                telemetry_data=telemetry_payload,
            )

        # Check freshness
        now = time.time()
        sample_ts = None
        if data_timestamp is not None:
            sample_ts = data_timestamp
        else:
            # Try parsing timestamp from PromQL vector result item: [timestamp, value]
            try:
                sample_ts = float(results[0]["value"][0])
            except (KeyError, IndexError, ValueError, TypeError):
                sample_ts = now

        age = max(0.0, now - sample_ts)

        if age > self.heartbeat_threshold:
            return EvidenceEvaluation(
                tier=EvidenceTier.STALE,
                is_trusted=False,
                reason=f"Evidence is stale ({age:.1f}s old > threshold {self.heartbeat_threshold}s)",
                telemetry_data=telemetry_payload,
                age_seconds=age,
            )

        # Check completeness / required metrics if specified
        if required_metrics:
            present_metrics = set()
            for r in results:
                metric_name = r.get("metric", {}).get("__name__")
                if metric_name:
                    present_metrics.add(metric_name)

            missing = [m for m in required_metrics if m not in present_metrics]
            if missing:
                return EvidenceEvaluation(
                    tier=EvidenceTier.PARTIAL,
                    is_trusted=False,
                    reason=f"Partial evidence: missing required metrics {missing}",
                    telemetry_data=telemetry_payload,
                    age_seconds=age,
                )

        return EvidenceEvaluation(
            tier=EvidenceTier.FRESH,
            is_trusted=True,
            reason=f"Evidence fresh ({age:.1f}s old <= threshold {self.heartbeat_threshold}s) and complete",
            telemetry_data=telemetry_payload,
            age_seconds=age,
        )
