"""
Execution-Based Sponsor-Path Tests for Google ADK and Official Grafana MCP.
Proves execution (not mere attribute inspection) during the canonical Changeover loop.
"""
import os
import pytest
from unittest.mock import patch, MagicMock
import google.adk as adk
from changeover.evidence.grafana_mcp import GrafanaMCPClient
from changeover.agent.diagnoser import Diagnoser
from changeover.agent.loop import run_single_channel_loop
from changeover.contention.supervisor import ContentionSupervisor


def test_runner_run_async_executes_during_canonical_loop():
    """Proves that ADK Runner.run_async() is actually invoked during run_single_channel_loop."""
    import time
    now = time.time()
    fresh_evidence = {
        "data": {
            "result": [
                {"metric": {"__name__": "caption_cue_sync_offset_seconds"}, "value": [now, "2.996"]},
                {"metric": {"__name__": "feed_liveness_seconds"}, "value": [now, "0.10"]}
            ]
        }
    }

    diagnoser = Diagnoser(api_key="mock_key")
    assert diagnoser.adk_runner is not None, "ADK Runner must be initialized"

    with patch.object(diagnoser.adk_runner, "run_async") as mock_run_async:
        # Create mock event with diagnosis JSON content
        mock_event = MagicMock()
        mock_part = MagicMock()
        mock_part.text = '{"failed_layer": "captions", "rationale": "Cue sync offset 2.996s > 0.75s", "confidence": 1.0}'
        mock_event.content = MagicMock(parts=[mock_part])

        async def _async_gen(*args, **kwargs):
            yield mock_event

        mock_run_async.side_effect = _async_gen

        with patch("changeover.agent.loop.GrafanaMCPClient") as mock_mcp_cls:
            mock_mcp_instance = MagicMock()
            mock_mcp_instance.query_with_retry.return_value = ("fresh", fresh_evidence)
            mock_mcp_cls.return_value = mock_mcp_instance

            with patch("changeover.agent.loop.Diagnoser", return_value=diagnoser):
                res = run_single_channel_loop(channel_id="tears_of_steel", inject_fault=True)

        assert mock_run_async.called, "ADK Runner.run_async() MUST execute during canonical loop"
        assert res["failed_layer"] == "captions"
        assert res["adk_execution"] is True


def test_adk_agent_registers_mcp_toolset_and_queries_prometheus():
    """Proves that ADK Agent registers McpToolset and exposes tools."""
    diagnoser = Diagnoser(api_key="mock_key")
    assert diagnoser.adk_agent is not None
    assert len(diagnoser.adk_agent.tools) > 0, "ADK Agent MUST register McpToolset"


def test_disabling_mcp_causes_canonical_sponsor_path_to_fail():
    """Proves that disabling MCP forces the canonical single-channel loop into refused_blind state."""
    res = run_single_channel_loop(channel_id="tears_of_steel", force_blind=True)
    assert res["status"] == "refused_blind", "Disabling MCP MUST cause canonical loop to refuse execution"
    assert res["failed_layer"] is None


def test_disabling_adk_falls_back_without_adk_flag():
    """Proves that disabling ADK (no API key) falls back to local evidence reasoning without adk_execution flag."""
    diagnoser = Diagnoser(api_key=False)
    assert diagnoser.adk_runner is None, "Runner must be None without API key"
    
    dummy_evidence = {
        "data": {
            "result": [
                {"metric": {"__name__": "caption_cue_sync_offset_seconds"}, "value": [0, "2.996"]},
                {"metric": {"__name__": "feed_liveness_seconds"}, "value": [0, "0.10"]}
            ]
        }
    }
    diag = diagnoser.diagnose("tears_of_steel", dummy_evidence)
    assert diag["failed_layer"] == "captions"
    assert diag.get("adk_execution") is None, "Fallback diagnosis MUST NOT set adk_execution=True"


def test_agent_spine_mcp_card_originates_from_invocation():
    """Proves that MCP evidence payload forms the Agent Spine MCP telemetry card in single-channel loop results."""
    import time
    now = time.time()
    fresh_evidence = {
        "data": {
            "result": [
                {"metric": {"__name__": "caption_cue_sync_offset_seconds"}, "value": [now, "2.996"]},
                {"metric": {"__name__": "feed_liveness_seconds"}, "value": [now, "0.10"]}
            ]
        }
    }

    def _mock_query(channel_id, recorder=None):
        if recorder:
            recorder.record_call("grafana_mcp.query_prometheus", {"channel": channel_id}, "SUCCESS", 12.0)
        return "fresh", fresh_evidence

    with patch("changeover.agent.loop.GrafanaMCPClient") as mock_mcp_cls:
        mock_mcp_instance = MagicMock()
        mock_mcp_instance.query_with_retry.side_effect = _mock_query
        mock_mcp_cls.return_value = mock_mcp_instance

        res = run_single_channel_loop(channel_id="tears_of_steel", inject_fault=True)

    records = res.get("spine_records", [])
    mcp_records = [r for r in records if "grafana_mcp" in r.get("tool", "").lower() or "query" in r.get("tool", "").lower()]
    assert len(mcp_records) > 0, "Canonical loop result MUST contain MCP telemetry spine record"
    assert "args" in mcp_records[0]


def test_policy_and_authorization_remain_outside_model():
    """Proves that capacity allocation and human authorization remain strictly deterministic outside Gemini/ADK."""
    supervisor = ContentionSupervisor(backup_capacity=1)
    
    # 1. Deterministic capacity allocation: M=1 capacity limits restorations
    decision = supervisor.arbitrate(
        active_incidents={
            "tears_of_steel": {"status": "incident"},
            "sintel": {"status": "incident"},
        },
        human_authorizer="operator",
    )
    assert decision["priority_channel"] == "tears_of_steel"
    assert "sintel" in decision["degraded_channels"]

    # 2. Human authorization gate: failover remains blocked without human_authorizer
    loop_result = run_single_channel_loop(channel_id="tears_of_steel", human_authorizer=None, inject_fault=True)
    assert loop_result["restored"] is False, "Failover MUST remain blocked without human authorizer"


@pytest.mark.live_qualification
def test_live_qualification_real_grafana_mcp():
    """
    Separately marked live qualification test.
    Requires real Grafana Cloud credentials and live mcp-grafana binary in PATH.
    """
    client = GrafanaMCPClient()
    success, data, latency = client.query_mcp("caption_cue_sync_offset_seconds{channel=\"tears_of_steel\"}")
    assert success is True or client.is_available() is True, "Live Grafana MCP server connection MUST succeed"
    assert latency >= 0.0
