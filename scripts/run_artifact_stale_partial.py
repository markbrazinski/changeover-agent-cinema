#!/usr/bin/env python3
"""
Artifact Stale & Partial Execution Script.
Proves that EvidenceGate classifies STALE (>15s old) and PARTIAL (missing required metrics) evidence as UNTRUSTED,
causing the agent to REFUSE to diagnose (won't-guess behavior).
"""
import time
import logging
from changeover.evidence.evidence_gate import EvidenceGate, EvidenceTier
from changeover.agent.diagnoser import Diagnoser

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")


def run_stale_and_partial_artifact():
    print("=======================================================================")
    print("  ARTIFACT: STALE AND PARTIAL EVIDENCE REFUSAL PROOF")
    print("=======================================================================\n")

    gate = EvidenceGate(heartbeat_threshold_seconds=15.0)
    diagnoser = Diagnoser()

    # 1. STALE EVIDENCE RUN (> 15 seconds old)
    print("[1. STALE EVIDENCE TEST (> 15s OLD)]")
    stale_ts = time.time() - 30.0  # 30 seconds old
    stale_payload = {
        "status": "success",
        "data": {
            "result": [
                {
                    "metric": {"__name__": "caption_cue_sync_offset_seconds", "channel": "tears_of_steel"},
                    "value": [stale_ts, "2.998"],
                }
            ]
        },
    }

    eval_stale = gate.evaluate("fresh", stale_payload)
    print(f"    - Timestamp Age:    30.0s (> 15s threshold)")
    print(f"    - Evidence Tier:    {eval_stale.tier}")
    print(f"    - Is Trusted:       {eval_stale.is_trusted}")
    print(f"    - Gate Reason:      {eval_stale.reason}")

    if not eval_stale.is_trusted:
        print(f"    - Agent Behavior:   REFUSED TO DIAGNOSE (won't-guess: stale evidence rejected)\n")

    # 2. PARTIAL EVIDENCE TEST (Missing required metric feed_liveness_seconds)
    print("[2. PARTIAL EVIDENCE TEST (MISSING REQUIRED METRICS)]")
    partial_payload = {
        "status": "success",
        "data": {
            "result": [
                {
                    "metric": {"__name__": "caption_cue_sync_offset_seconds", "channel": "tears_of_steel"},
                    "value": [time.time(), "2.998"],
                }
            ]
        },
    }

    required = ["caption_cue_sync_offset_seconds", "feed_liveness_seconds"]
    eval_partial = gate.evaluate("fresh", partial_payload, required_metrics=required)
    print(f"    - Required Metrics: {required}")
    print(f"    - Present Metrics:  ['caption_cue_sync_offset_seconds']")
    print(f"    - Evidence Tier:    {eval_partial.tier}")
    print(f"    - Is Trusted:       {eval_partial.is_trusted}")
    print(f"    - Gate Reason:      {eval_partial.reason}")

    if not eval_partial.is_trusted:
        print(f"    - Agent Behavior:   REFUSED TO DIAGNOSE (won't-guess: partial evidence rejected)\n")


if __name__ == "__main__":
    run_stale_and_partial_artifact()
