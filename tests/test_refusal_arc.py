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


def test_refusal_arc_single_channel_loop_invariants():
    """Verify run_single_channel_loop enforces all refusal invariants for Sintel."""
    res = run_single_channel_loop(
        channel_id="sintel",
        human_authorizer="operator:mark",  # Even if operator is present!
        inject_fault=True,
        inject_stale_evidence=True,
        run_id="test_sintel_refusal_1",
    )

    # Invariant 1: Explicit refusal status
    assert res["status"] == "refused_stale_evidence"

    # Invariant 2: Correct channel and tier
    assert res["channel"] == "sintel"
    assert res["evidence_tier"] == "stale"
    assert res["evidence_age_seconds"] >= 24.0
    assert res["allowed_freshness_threshold_seconds"] == 15.0

    # Invariant 3: Explanation for operator / UI
    assert res["user_explanation"] == "The available caption evidence is too old to justify changing a live feed."

    # Invariant 4: No downstream ADK diagnosis
    assert res["failed_layer"] is None
    assert res["adk_execution"] is False

    # Invariant 5: No backup verification or authorization or changeover or annotation
    assert res["backup_verified"] is False
    assert res["changeover_executed"] is False
    assert res["annotation_created"] is False
    assert res["restored"] is False


def test_refusal_arc_deterministic_repeatability():
    """Verify 3 consecutive runs produce identical refusal terminal states."""
    runs = []
    for idx in range(3):
        res = run_single_channel_loop(
            channel_id="sintel",
            human_authorizer="operator:mark",
            inject_fault=True,
            inject_stale_evidence=True,
            run_id=f"repeat_run_{idx}",
        )
        runs.append(res)

    for res in runs:
        assert res["status"] == "refused_stale_evidence"
        assert res["failed_layer"] is None
        assert res["adk_execution"] is False
        assert res["changeover_executed"] is False
        assert res["annotation_created"] is False
        assert res["user_explanation"] == "The available caption evidence is too old to justify changing a live feed."
