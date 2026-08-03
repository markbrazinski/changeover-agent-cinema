"""
Slice 3 Acceptance Test Suite.
Verifies diagnosis, ffprobe backup verification, human-authorized failover refusal & execution,
verify-by-measurement restoration gating, and state auditing.
"""
import os
import json
import pytest
from changeover.action.backup_verifier import verify_backup_source
from changeover.action.failover_tool import execute_failover, read_channel_state
from changeover.agent.loop import run_single_channel_loop


def test_backup_verifier_ffprobe():
    """Verify backup verifier executes ffprobe on valid backup media."""
    backup_path = "films/tears_of_steel/backup.mp4"
    is_healthy, details = verify_backup_source(backup_path)

    assert is_healthy is True
    assert details["has_video"] is True
    assert details["duration_seconds"] > 0.0


def test_failover_tool_refusal_and_execution():
    """
    CRITICAL GUARDRAIL TEST:
    Verify failover_tool refuses when human_authorizer is absent/empty,
    and executes toggle when human_authorizer is provided.
    """
    channel_id = "test_failover_ch"
    state_file = f"logs/state/feed_state_{channel_id}.json"
    if os.path.exists(state_file):
        os.remove(state_file)

    # 1. Refusal on missing authorizer
    executed1, res1 = execute_failover(channel_id, human_authorizer=None)
    assert executed1 is False
    assert res1["status"] == "refused_unauthorized"

    # 2. Refusal on empty whitespace authorizer
    executed2, res2 = execute_failover(channel_id, human_authorizer="   ")
    assert executed2 is False
    assert res2["status"] == "refused_unauthorized"

    # 3. Execution when authorizer provided
    executed3, res3 = execute_failover(channel_id, human_authorizer="operator:mark")
    assert executed3 is True
    assert res3["status"] == "executed"
    assert res3["new_source"] == "backup"
    assert res3["human_authorizer"] == "operator:mark"


def test_single_channel_loop_end_to_end_unauthorized_refusal():
    """Verify full orchestration loop refuses failover when human_authorizer is missing."""
    res = run_single_channel_loop(
        channel_id="tears_of_steel",
        human_authorizer=None,
        inject_fault=True,
    )

    assert res["status"] == "refused_unauthorized"
    assert res["failed_layer"] == "captions"
    assert res["restored"] is False


def test_single_channel_loop_end_to_end_authorized_restoration():
    """
    Gate 3 Test:
    Verify full orchestration loop detects fault -> investigates -> names captions ->
    verifies backup -> summons -> executes authorized failover -> verifies post-swap measurement ->
    declares restored -> writes feed_state_tears_of_steel.json audit record.
    """
    res = run_single_channel_loop(
        channel_id="tears_of_steel",
        human_authorizer="operator:mark",
        inject_fault=True,
    )

    assert res["status"] == "restored"
    assert res["failed_layer"] == "captions"
    assert res["restored"] is True
    assert res["post_swap_offset"] <= 0.75

    state_file = res["state_file"]
    assert os.path.exists(state_file)

    with open(state_file, "r") as f:
        state_data = json.load(f)

    assert state_data["channel"] == "tears_of_steel"
    assert state_data["active_source"] == "backup"
    assert state_data["human_authorizer"] == "operator:mark"
    assert state_data["restored"] is True
