"""
Slice 5 Acceptance Test Suite.
Verifies multi-channel generalization (Tears of Steel & Sintel), dynamic derived SLA ceilings (hand_set: false),
distinct backups per channel, per-channel sponsor verification, and UI contract data surface.
"""
import os
import json
import pytest
from changeover.config.channels import CHANNELS, get_channel_config
from changeover.ceilings.derive import derive_channel_ceilings
from changeover.agent.loop import run_single_channel_loop
from changeover.trace.ui_contract import get_ui_contract_data
from scripts.verify_sponsors import verify_sponsors


def test_derived_ceilings():
    """
    CRITICAL GUARDRAIL TEST:
    Verify SLA ceilings are derived from observed baseline, NOT hand-set (hand_set: False).
    """
    for channel_id in ["tears_of_steel", "sintel"]:
        ceilings = derive_channel_ceilings(channel_id, baseline_steps=10)
        assert ceilings["hand_set"] is False
        assert ceilings["derived_caption_ceiling"] > 0.0
        assert ceilings["derived_liveness_ceiling"] > 0.0


def test_distinct_backups_per_channel():
    """
    CRITICAL GUARDRAIL TEST:
    Verify each channel has its own distinct backup file (no shared backup).
    """
    tos_config = get_channel_config("tears_of_steel")
    sintel_config = get_channel_config("sintel")

    assert tos_config.backup_mp4 != sintel_config.backup_mp4
    assert os.path.exists(tos_config.backup_mp4)
    assert os.path.exists(sintel_config.backup_mp4)


from unittest.mock import patch, MagicMock


def test_instanced_agent_across_two_films():
    """
    Gate 5 Test:
    Verify exact same instanced agent logic runs across both films and restores both channels.
    """
    import time
    now = time.time()

    with patch("changeover.agent.loop.GrafanaMCPClient") as mock_mcp_cls, \
         patch("changeover.agent.loop.Diagnoser") as mock_diag_cls:

        mock_mcp = mock_mcp_cls.return_value
        mock_diag = mock_diag_cls.return_value

        mock_mcp.create_annotation_mcp.return_value = (True, {"status": "success"})
        mock_mcp.get_annotation_mcp.return_value = (True, {"id": 6})
        mock_diag.diagnose.return_value = {
            "failed_layer": "captions",
            "adk_execution": True,
            "confidence": 1.0,
        }

        for channel_id in ["tears_of_steel", "sintel"]:
            fresh_evidence = {
                "data": {
                    "result": [
                        {"metric": {"__name__": "caption_cue_sync_offset_seconds", "channel": channel_id}, "value": [now, "2.996"]},
                        {"metric": {"__name__": "feed_liveness_seconds", "channel": channel_id}, "value": [now, "0.0001"]}
                    ]
                }
            }
            mock_mcp.query_with_retry.return_value = ("fresh", fresh_evidence)

            res = run_single_channel_loop(
                channel_id=channel_id,
                human_authorizer="operator:mark",
                inject_fault=True,
            )
            assert res["status"] == "restored"
            assert res["restored"] is True

            # Verify sponsor execution
            assert verify_sponsors(channel_id) is True

            # Verify UI contract surface
            ui_data = get_ui_contract_data(channel_id)
            assert ui_data["channel"] == channel_id
            assert ui_data["restored"] is True
            assert len(ui_data["trace_records"]) > 0
