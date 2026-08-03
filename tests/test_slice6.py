"""
Slice 6 Acceptance Test Suite.
Verifies Contention Supervisor arbitration (M=1 vs N=2), operator-declared tier priority,
human authorization refusal/execution, and proof that the degraded channel is UNTOUCHED (no state file).
"""
import os
import shutil
import json
import pytest
from changeover.contention.supervisor import ContentionSupervisor


def test_contention_unauthorized_refusal():
    """
    CRITICAL GUARDRAIL TEST:
    Verify contention supervisor computes allocation plan but refuses execution without human authorization.
    """
    state_dir = "logs/state_test_unauth"
    if os.path.exists(state_dir):
        shutil.rmtree(state_dir)
    os.makedirs(state_dir, exist_ok=True)

    supervisor = ContentionSupervisor(backup_capacity=1)
    active_incidents = {
        "tears_of_steel": {"caption_offset": 15.0, "tier": "premium"},
        "sintel": {"caption_offset": 15.0, "tier": "standard"},
    }

    res = supervisor.arbitrate(active_incidents, human_authorizer=None, log_dir=state_dir)

    assert res["status"] == "refused_unauthorized"
    assert res["priority_channel"] == "tears_of_steel"
    assert "sintel" in res["degraded_channels"]
    assert res["scarcity_is_real"] is True

    # Confirm no state files created
    assert not os.path.exists(os.path.join(state_dir, "feed_state_tears_of_steel.json"))
    assert not os.path.exists(os.path.join(state_dir, "feed_state_sintel.json"))


def test_contention_authorized_execution_and_untouched_loser_proof():
    """
    Gate 6 Test:
    Verify authorized contention arbitration switches priority channel ONLY (tears_of_steel [premium]),
    degrades/flags loser channel (sintel [standard]), and proves sintel has NO state file (untouched).
    """
    state_dir = "logs/state_test_auth"
    if os.path.exists(state_dir):
        shutil.rmtree(state_dir)
    os.makedirs(state_dir, exist_ok=True)

    supervisor = ContentionSupervisor(backup_capacity=1)
    active_incidents = {
        "tears_of_steel": {"caption_offset": 15.0, "tier": "premium"},
        "sintel": {"caption_offset": 15.0, "tier": "standard"},
    }

    res = supervisor.arbitrate(active_incidents, human_authorizer="operator:mark", log_dir=state_dir)

    assert res["status"] == "authorized_and_executed"
    assert res["priority_channel"] == "tears_of_steel"
    assert "sintel" in res["degraded_channels"]

    # Verify priority channel state file EXISTS
    tos_state_file = os.path.join(state_dir, "state", "feed_state_tears_of_steel.json")
    assert os.path.exists(tos_state_file)

    # CRITICAL PROOF: Degraded channel (sintel) state file DOES NOT EXIST (provably untouched!)
    sintel_state_file = os.path.join(state_dir, "state", "feed_state_sintel.json")
    assert not os.path.exists(sintel_state_file)
    assert res["degraded_untouched_proof"] is True

    # Verify tradeoff log file
    auth_log = os.path.join(state_dir, "contention_authorized.json")
    assert os.path.exists(auth_log)
    with open(auth_log, "r") as f:
        log_data = json.load(f)
    assert log_data["priority_channel"] == "tears_of_steel"
    assert log_data["degraded_channels"] == ["sintel"]
