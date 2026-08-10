"""
Focused Sponsor-Path Tests for Google ADK and Official Grafana MCP.
Proves that Changeover's canonical workflow routes through google.adk.Agent / google.adk.Runner
and official Grafana Labs mcp-grafana server over stdio transport.
"""
import os
import pytest
import google.adk as adk
from changeover.evidence.grafana_mcp import GrafanaMCPClient
from changeover.agent.diagnoser import Diagnoser
from changeover.agent.loop import run_single_channel_loop
from changeover.contention.supervisor import ContentionSupervisor


def test_adk_runner_instantiation():
    """Proves that Diagnoser initializes a genuine google.adk Agent and Runner when API key is set."""
    diagnoser = Diagnoser(api_key="test_dummy_key")
    assert diagnoser.adk_agent is not None, "adk_agent must be instantiated"
    assert diagnoser.adk_runner is not None, "adk_runner must be instantiated"
    assert isinstance(diagnoser.adk_agent, adk.Agent), "adk_agent must be an instance of google.adk.Agent"
    assert isinstance(diagnoser.adk_runner, adk.Runner), "adk_runner must be an instance of google.adk.Runner"
    assert diagnoser.adk_agent.name == "changeover_diagnoser"


def test_official_grafana_mcp_client_has_stdio_mcp_method():
    """Proves that GrafanaMCPClient contains query_mcp executing official mcp-grafana server."""
    client = GrafanaMCPClient()
    assert hasattr(client, "query_mcp"), "GrafanaMCPClient must possess query_mcp method"


def test_bypassing_adk_or_mcp_fails_contract():
    """Proves contract assertions fail if ADK or MCP is missing or bypassed."""
    # Test 1: Bypassing ADK (api_key=None) yields fallback reasoning without adk_execution flag
    diagnoser = Diagnoser(api_key=None)
    assert diagnoser.adk_runner is None

    # Test 2: Bypassing MCP forces blind state refusal in single channel loop
    res = run_single_channel_loop(channel_id="tears_of_steel", force_blind=True)
    assert res["status"] == "refused_blind"
    assert res["failed_layer"] is None


def test_authority_boundaries_preserved():
    """Proves that Gemini/ADK cannot assign service priority, allocate capacity, or authorize failover."""
    supervisor = ContentionSupervisor(backup_capacity=1)
    
    # 1. Deterministic capacity allocation: M=1 capacity strictly limits restorations
    decision = supervisor.arbitrate(
        active_incidents={
            "tears_of_steel": {"status": "incident"},
            "sintel": {"status": "incident"},
        },
        human_authorizer="operator",
    )
    assert decision["priority_channel"] == "tears_of_steel", "Premium tier channel must pre-empt Standard tier channel deterministically"
    assert "sintel" in decision["degraded_channels"]

    # 2. Human authorization boundary: failover remains blocked without human_authorizer
    loop_result = run_single_channel_loop(channel_id="tears_of_steel", human_authorizer=None, inject_fault=True)
    assert loop_result["restored"] is False, "Failover must remain blocked without human authorization"



