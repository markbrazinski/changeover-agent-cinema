#!/usr/bin/env python3
"""
Artifact B Execution Script:
Real un-mocked BLIND run showing Grafana endpoint unreachable/empty -> agent REFUSES to diagnose (won't-guess).
"""
import time
import logging
from changeover.agent.loop import run_single_channel_loop

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")


def run_artifact_b():
    print("=======================================================================")
    print("  ARTIFACT B: REAL UNMOCKED BLIND RUN (WON'T-GUESS REFUSAL)")
    print("=======================================================================\n")

    start_time = time.time()

    # Run loop forcing blind / invalid Grafana endpoint
    res = run_single_channel_loop(
        channel_id="tears_of_steel",
        human_authorizer="operator:mark",
        inject_fault=True,
        force_blind=True,
    )

    elapsed = time.time() - start_time

    print("\n[BLIND / WON'T-GUESS RUN RESULT]")
    print(f"    - Status:        {res.get('status')}")
    print(f"    - Failed Layer:  {res.get('failed_layer')} (No layer named!)")
    print(f"    - Reason:        {res.get('reason')}")
    print(f"    - Restored:      {res.get('restored')}")
    print(f"    - Wall Execution Time: {elapsed:.3f}s\n")


if __name__ == "__main__":
    run_artifact_b()
