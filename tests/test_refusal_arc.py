"""
Unit and Integration Tests for Sintel Evidence-Refusal Arc.
Verifies all 10 required invariants when evidence is stale:
1. Evidence age exceeds threshold (25.0s > 15.0s).
2. Production evidence gate rejects payload.
3. Gemini/ADK diagnoser is NOT invoked.
4. Backup verification is NOT invoked.
5. No recovery recommendation created.
6. No authorization action becomes available.
7. No changeover executes.
8. No post-authorization Grafana annotation written.
9. Incident ends in 'refused_stale_evidence' status.
10. Explanation matches 'The available caption evidence is too old to justify changing a live feed.'
11. Deterministic repeatability across 3 consecutive runs.
"""
import time
import pytest
from changeover.evidence.evidence_gate import EvidenceGate, EvidenceTier
from changeover.agent.loop import run_single_channel_loop


def test_refusal_arc_evidence_gate_stale():
    """Verify production EvidenceGate rejects 25s old payload as STALE."""
    gate = EvidenceGate(heartbeat_threshold_seconds=15.0)
    stale_ts = time.time() - 25.0
    payload = {
        "data": {
            "result": [
                {
                    "metric": {"__name__": "caption_cue_sync_offset_seconds", "channel": "sintel"},
                    "value": [stale_ts, "2.996"]
                },
                {
                    "metric": {"__name__": "feed_liveness_seconds", "channel": "sintel", "layer": "sign_language"},
                    "value": [stale_ts, "0.0000789"]
                }
            ]
        }
    }
    eval_res = gate.evaluate(
        mcp_status="fresh",
        telemetry_payload=payload,
        required_metrics=["caption_cue_sync_offset_seconds", "feed_liveness_seconds"],
        expected_channel="sintel",
    )

    assert eval_res.is_trusted is False
    assert eval_res.tier == EvidenceTier.STALE
    assert eval_res.age_seconds is not None
    assert eval_res.age_seconds >= 24.0
    assert "Evidence is stale" in eval_res.reason


from unittest.mock import patch

def test_refusal_arc_single_channel_loop_invariants():
    """Verify run_single_channel_loop enforces all refusal invariants for Sintel using collaborator spies."""
    stale_ts = time.time() - 25.0
    stale_payload = {
        "data": {
            "result": [
                {
                    "metric": {"__name__": "caption_cue_sync_offset_seconds", "channel": "sintel"},
                    "value": [stale_ts, "2.996"]
                },
                {
                    "metric": {"__name__": "feed_liveness_seconds", "channel": "sintel", "layer": "sign_language"},
                    "value": [stale_ts, "0.0000789"]
                }
            ]
        }
    }

    with patch("changeover.agent.loop.Diagnoser") as mock_diag, \
         patch("changeover.agent.loop.verify_backup_source") as mock_ffprobe, \
         patch("changeover.agent.loop.execute_failover") as mock_failover, \
         patch("changeover.agent.loop.GrafanaMCPClient") as mock_mcp:

        mock_mcp.return_value.query_with_retry.return_value = ("fresh", stale_payload)

        res = run_single_channel_loop(
            channel_id="sintel",
            human_authorizer="operator:mark",
            inject_fault=False,
            run_id="test_sintel_refusal_1",
        )

        # Assert non-invocation of all 4 downstream collaborators
        assert not mock_diag.return_value.diagnose.called
        assert not mock_ffprobe.called
        assert not mock_failover.called
        assert not mock_mcp.return_value.create_annotation_mcp.called

        # Terminal status & explanation
        assert res["status"] == "refused_stale_evidence"
        assert res["channel"] == "sintel"
        assert res["evidence_tier"] == "stale"
        assert res["user_explanation"] == "The available caption evidence is too old to justify changing a live feed."


def test_refusal_arc_cross_channel_tears_of_steel():
    """Prove evidence refusal gate is not Sintel-specific by testing Tears of Steel with stale evidence."""
    stale_ts = time.time() - 25.0
    stale_payload = {
        "data": {
            "result": [
                {
                    "metric": {"__name__": "caption_cue_sync_offset_seconds", "channel": "tears_of_steel"},
                    "value": [stale_ts, "2.996"]
                },
                {
                    "metric": {"__name__": "feed_liveness_seconds", "channel": "tears_of_steel", "layer": "sign_language"},
                    "value": [stale_ts, "0.0000789"]
                }
            ]
        }
    }

    with patch("changeover.agent.loop.Diagnoser") as mock_diag, \
         patch("changeover.agent.loop.verify_backup_source") as mock_ffprobe, \
         patch("changeover.agent.loop.execute_failover") as mock_failover, \
         patch("changeover.agent.loop.GrafanaMCPClient") as mock_mcp:

        mock_mcp.return_value.query_with_retry.return_value = ("fresh", stale_payload)

        res = run_single_channel_loop(
            channel_id="tears_of_steel",
            human_authorizer="operator:mark",
            inject_fault=False,
            run_id="test_tos_refusal_1",
        )

        # Assert non-invocation of all 4 downstream collaborators
        assert not mock_diag.return_value.diagnose.called
        assert not mock_ffprobe.called
        assert not mock_failover.called
        assert not mock_mcp.return_value.create_annotation_mcp.called

        # Terminal status & explanation
        assert res["status"] == "refused_stale_evidence"
        assert res["channel"] == "tears_of_steel"
        assert res["evidence_tier"] == "stale"
        assert res["user_explanation"] == "The available caption evidence is too old to justify changing a live feed."


def test_refusal_arc_deterministic_repeatability():
    """Verify 3 consecutive runs produce identical refusal terminal states using spies."""
    stale_ts = time.time() - 25.0
    stale_payload = {
        "data": {
            "result": [
                {
                    "metric": {"__name__": "caption_cue_sync_offset_seconds", "channel": "sintel"},
                    "value": [stale_ts, "2.996"]
                },
                {
                    "metric": {"__name__": "feed_liveness_seconds", "channel": "sintel", "layer": "sign_language"},
                    "value": [stale_ts, "0.0000789"]
                }
            ]
        }
    }

    for idx in range(3):
        with patch("changeover.agent.loop.Diagnoser") as mock_diag, \
             patch("changeover.agent.loop.verify_backup_source") as mock_ffprobe, \
             patch("changeover.agent.loop.execute_failover") as mock_failover, \
             patch("changeover.agent.loop.GrafanaMCPClient") as mock_mcp:

            mock_mcp.return_value.query_with_retry.return_value = ("fresh", stale_payload)

            res = run_single_channel_loop(
                channel_id="sintel",
                human_authorizer="operator:mark",
                inject_fault=False,
                run_id=f"repeat_run_{idx}",
            )

            assert not mock_diag.return_value.diagnose.called
            assert not mock_ffprobe.called
            assert not mock_failover.called
            assert not mock_mcp.return_value.create_annotation_mcp.called

            assert res["status"] == "refused_stale_evidence"
            assert res["user_explanation"] == "The available caption evidence is too old to justify changing a live feed."
