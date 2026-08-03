"""
Slice 2 Acceptance Test Suite.
Verifies real Grafana MCP queries, failed-query-then-retry, trace recorder, and 4-tier Evidence Gate.
"""
import os
import json
import time
import pytest
from changeover.trace.recorder import TraceRecorder
from changeover.evidence.grafana_mcp import GrafanaMCPClient
from changeover.evidence.evidence_gate import EvidenceGate, EvidenceTier


def test_trace_recorder():
    """Verify trace recorder logs structured tool calls to disk."""
    recorder = TraceRecorder("test_channel")
    recorder.record_call("test_tool", {"arg1": "val1"}, "SUCCESS", latency_ms=12.34)

    records = recorder.get_records()
    assert len(records) == 1
    assert records[0]["tool"] == "test_tool"
    assert records[0]["latency_ms"] == 12.34

    assert os.path.exists(recorder.trace_file)
    with open(recorder.trace_file, "r") as f:
        data = json.load(f)
    assert len(data) == 1


def test_grafana_mcp_real_query_and_retry():
    """
    Gate 2 Test:
    Verifies real Grafana Cloud MCP query, failed-query-then-retry pattern, and trace recording with latency.
    """
    recorder = TraceRecorder("tears_of_steel")
    client = GrafanaMCPClient()

    assert client.is_available() is True, "Grafana Cloud endpoint is not available"

    status, data = client.query_with_retry("tears_of_steel", recorder)

    # Verify retry recorded 2 queries (1 miss, 1 retry)
    records = recorder.get_records()
    assert len(records) >= 2

    miss_record = records[0]
    retry_record = records[1]

    assert miss_record["tool"] == "grafana_mcp.query"
    assert "invalid_caption_offset" in miss_record["args"]["query"]
    assert "MISS" in str(miss_record["result_or_miss"])

    assert retry_record["tool"] == "grafana_mcp.query"
    assert "caption_cue_sync_offset" in retry_record["args"]["query"]
    assert retry_record["latency_ms"] > 0.0


def test_evidence_gate_tiers():
    """Verifies 4-tier trust gate classification: FRESH, STALE, PARTIAL, ABSENT."""
    gate = EvidenceGate(heartbeat_threshold_seconds=15.0)

    now = time.time()

    # 1. FRESH
    fresh_payload = {"data": {"result": [{"metric": {"__name__": "caption_cue_sync_offset_seconds"}, "value": [now, "1.5"]}]}}
    eval_fresh = gate.evaluate("fresh", fresh_payload)
    assert eval_fresh.tier == EvidenceTier.FRESH
    assert eval_fresh.is_trusted is True

    # 2. STALE
    stale_payload = {"data": {"result": [{"metric": {"__name__": "caption_cue_sync_offset_seconds"}, "value": [now - 30.0, "1.5"]}]}}
    eval_stale = gate.evaluate("fresh", stale_payload)
    assert eval_stale.tier == EvidenceTier.STALE
    assert eval_stale.is_trusted is False

    # 3. PARTIAL
    eval_partial = gate.evaluate("fresh", fresh_payload, required_metrics=["caption_cue_sync_offset_seconds", "feed_liveness_seconds"])
    assert eval_partial.tier == EvidenceTier.PARTIAL
    assert eval_partial.is_trusted is False

    # 4. ABSENT / BLIND
    eval_absent = gate.evaluate("blind", None)
    assert eval_absent.tier == EvidenceTier.ABSENT
    assert eval_absent.is_trusted is False


def test_blind_state_guardrail():
    """
    CRITICAL GUARDRAIL TEST:
    Verify that an unreachable endpoint returns 'blind' status and ABSENT evidence tier.
    """
    recorder = TraceRecorder("blind_test")
    client = GrafanaMCPClient(grafana_url="https://invalid-grafana-url-xyz123.net", token="invalid")

    assert client.is_available() is False

    status, data = client.query_with_retry("blind_test", recorder)
    assert status == "blind"
    assert data is None

    gate = EvidenceGate()
    eval_result = gate.evaluate(status, data)
    assert eval_result.tier == EvidenceTier.ABSENT
    assert eval_result.is_trusted is False
