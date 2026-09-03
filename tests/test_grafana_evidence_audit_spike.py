"""
Spike Qualification Tests for Grafana Evidence-to-Audit Delta.
Tests dual-signal retrieval, strict MCP provenance, evidence gating,
post-authorization annotations, idempotency, and authority boundaries.
"""
import os
import json
import pytest
import time
from changeover.evidence.grafana_mcp import GrafanaMCPClient
from changeover.evidence.evidence_gate import EvidenceGate, EvidenceTier
from changeover.agent.diagnoser import Diagnoser
from changeover.agent.loop import run_single_channel_loop
from changeover.trace.recorder import TraceRecorder


def test_dual_signal_evidence_gate_fresh():
    """Verify evidence gate accepts fresh payload containing both required signals."""
    gate = EvidenceGate(heartbeat_threshold_seconds=15.0)
    now = time.time()
    telemetry = {
        "data": {
            "result": [
                {
                    "metric": {"__name__": "caption_cue_sync_offset_seconds", "channel": "tears_of_steel"},
                    "value": [now, "1.25"],
                },
                {
                    "metric": {"__name__": "feed_liveness_seconds", "channel": "tears_of_steel"},
                    "value": [now, "0.10"],
                },
            ]
        }
    }
    eval_res = gate.evaluate(
        mcp_status="fresh",
        telemetry_payload=telemetry,
        required_metrics=["caption_cue_sync_offset_seconds", "feed_liveness_seconds"],
        expected_channel="tears_of_steel",
    )
    assert eval_res.is_trusted is True
    assert eval_res.tier == EvidenceTier.FRESH


def test_evidence_gate_missing_caption_signal():
    """Verify evidence gate rejects payload missing caption signal."""
    gate = EvidenceGate()
    now = time.time()
    telemetry = {
        "data": {
            "result": [
                {
                    "metric": {"__name__": "feed_liveness_seconds", "channel": "tears_of_steel"},
                    "value": [now, "0.10"],
                }
            ]
        }
    }
    eval_res = gate.evaluate(
        mcp_status="fresh",
        telemetry_payload=telemetry,
        required_metrics=["caption_cue_sync_offset_seconds", "feed_liveness_seconds"],
        expected_channel="tears_of_steel",
    )
    assert eval_res.is_trusted is False
    assert eval_res.tier == EvidenceTier.PARTIAL


def test_evidence_gate_missing_liveness_signal():
    """Verify evidence gate rejects payload missing feed liveness signal."""
    gate = EvidenceGate()
    now = time.time()
    telemetry = {
        "data": {
            "result": [
                {
                    "metric": {"__name__": "caption_cue_sync_offset_seconds", "channel": "tears_of_steel"},
                    "value": [now, "1.25"],
                }
            ]
        }
    }
    eval_res = gate.evaluate(
        mcp_status="fresh",
        telemetry_payload=telemetry,
        required_metrics=["caption_cue_sync_offset_seconds", "feed_liveness_seconds"],
        expected_channel="tears_of_steel",
    )
    assert eval_res.is_trusted is False
    assert eval_res.tier == EvidenceTier.PARTIAL


def test_evidence_gate_stale_signal():
    """Verify evidence gate rejects stale payload."""
    gate = EvidenceGate(heartbeat_threshold_seconds=15.0)
    stale_ts = time.time() - 30.0
    telemetry = {
        "data": {
            "result": [
                {
                    "metric": {"__name__": "caption_cue_sync_offset_seconds", "channel": "tears_of_steel"},
                    "value": [stale_ts, "1.25"],
                },
                {
                    "metric": {"__name__": "feed_liveness_seconds", "channel": "tears_of_steel"},
                    "value": [stale_ts, "0.10"],
                },
            ]
        }
    }
    eval_res = gate.evaluate(
        mcp_status="fresh",
        telemetry_payload=telemetry,
        required_metrics=["caption_cue_sync_offset_seconds", "feed_liveness_seconds"],
        expected_channel="tears_of_steel",
    )
    assert eval_res.is_trusted is False
    assert eval_res.tier == EvidenceTier.STALE


def test_evidence_gate_channel_mismatch():
    """Verify evidence gate rejects payload with wrong channel label."""
    gate = EvidenceGate()
    now = time.time()
    telemetry = {
        "data": {
            "result": [
                {
                    "metric": {"__name__": "caption_cue_sync_offset_seconds", "channel": "other_channel"},
                    "value": [now, "1.25"],
                },
                {
                    "metric": {"__name__": "feed_liveness_seconds", "channel": "other_channel"},
                    "value": [now, "0.10"],
                },
            ]
        }
    }
    eval_res = gate.evaluate(
        mcp_status="fresh",
        telemetry_payload=telemetry,
        required_metrics=["caption_cue_sync_offset_seconds", "feed_liveness_seconds"],
        expected_channel="tears_of_steel",
    )
    assert eval_res.is_trusted is False
    assert eval_res.tier == EvidenceTier.ABSENT
    assert "Channel label mismatch" in eval_res.reason


def test_strict_mcp_provenance_no_direct_http_fallback(monkeypatch):
    """
    Verify that when MCP binary is unavailable/invalid, query_mcp strictly refuses
    and does NOT silently call direct HTTP raw_query.
    """
    monkeypatch.setenv("GRAFANA_MCP_BIN", "/nonexistent/mcp-grafana-bin")
    client = GrafanaMCPClient(grafana_url="https://curiousburrito1209.grafana.net", token="test_token")
    
    recorder = TraceRecorder("test_channel")
    success, data, latency = client.query_mcp(
        'caption_cue_sync_offset_seconds{channel="tears_of_steel"}',
        recorder=recorder,
        allow_http_fallback=False,
    )
    assert success is False
    assert "BLIND:" in data or "Refusing" in data


def test_diagnoser_refuses_incomplete_evidence():
    """Verify diagnoser returns error refusal if either metric is missing."""
    diagnoser = Diagnoser(api_key="fake")
    incomplete_evidence = {}
    res = diagnoser.diagnose("tears_of_steel", incomplete_evidence)
    assert res.get("error") == "incomplete_evidence"
    assert res.get("confidence") == 0.0


def test_loop_unauthorized_refusal_no_annotation(tmp_path):
    """Verify unauthorized loop refusal does not execute failover or create annotation."""
    state_dir = str(tmp_path / "state")
    log_dir = str(tmp_path / "traces")
    os.makedirs(state_dir, exist_ok=True)
    os.makedirs(log_dir, exist_ok=True)

    result = run_single_channel_loop(
        channel_id="tears_of_steel",
        human_authorizer=None,  # Unauthorized!
        inject_fault=True,
        state_dir=state_dir,
        log_dir=log_dir,
        force_blind=True,  # Force blind so we test early refusal
    )
    assert result["status"] == "refused_blind"
    assert result["restored"] is False
    assert result.get("annotation_created") is False
