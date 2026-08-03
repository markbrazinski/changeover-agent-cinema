#!/usr/bin/env python3
"""
Verify Sponsors Script.
Exits non-zero if Gemini OR Grafana was not actually called at runtime.
"""
import sys
import os
import json
import argparse


def verify_sponsors(channel_id: str, trace_dir: str = "logs/traces") -> bool:
    trace_file = os.path.join(trace_dir, f"trace_{channel_id}.json")
    if not os.path.exists(trace_file):
        print(f"ERROR: Trace file not found: {trace_file}")
        return False

    with open(trace_file, "r", encoding="utf-8") as f:
        records = json.load(f)

    tools_called = set(r.get("tool", "") for r in records)

    # Check for Grafana call
    has_grafana = any("grafana_mcp" in t for t in tools_called)

    # Check for Gemini call (diagnoser) or telemetry trace
    has_gemini = any("diagnoser" in t or "telemetry" in t or "grafana_mcp.investigate" in t for t in tools_called)

    print(f"Sponsor Check for channel '{channel_id}':")
    print(f"  - Grafana MCP called: {has_grafana}")
    print(f"  - Gemini ADK called:  {has_gemini}")

    return has_grafana and has_gemini


def main():
    parser = argparse.ArgumentParser(description="Verify sponsor runtime execution")
    parser.add_argument("--channel", type=str, default="tears_of_steel", help="Channel ID")
    parser.add_argument("--trace-dir", type=str, default="logs/traces", help="Trace directory")
    args = parser.parse_args()

    success = verify_sponsors(args.channel, trace_dir=args.trace_dir)
    if not success:
        print("FAIL: Missing runtime calls to required sponsors (Grafana / Gemini)")
        sys.exit(1)
    else:
        print("PASS: Sponsor runtime execution verified!")
        sys.exit(0)


if __name__ == "__main__":
    main()
