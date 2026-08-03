#!/usr/bin/env python3
"""
Compile N-Wide Acceptance Table.
Executes all channels, derives ceilings, verifies sponsors, and writes logs/acceptance_table.json.
"""
import os
import json
import logging
from changeover.config.channels import CHANNELS
from changeover.ceilings.derive import derive_channel_ceilings
from changeover.agent.loop import run_single_channel_loop
from changeover.trace.ui_contract import get_ui_contract_data
from scripts.verify_sponsors import verify_sponsors

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)


def compile_nwide_acceptance_table(
    human_authorizer: str = "operator:mark",
    out_file: str = "logs/acceptance_table.json",
):
    os.makedirs("logs", exist_ok=True)
    table_results = []

    for channel_id in CHANNELS:
        logger.info(f"=== Compiling N-Wide Acceptance for channel '{channel_id}' ===")

        # 1. Derive SLA ceilings dynamically
        ceilings = derive_channel_ceilings(channel_id)

        # 2. Run instanced single-channel agent loop
        loop_result = run_single_channel_loop(
            channel_id=channel_id,
            human_authorizer=human_authorizer,
            inject_fault=True,
        )

        # 3. Verify sponsor runtime execution
        sponsor_ok = verify_sponsors(channel_id)

        # 4. Extract UI contract surface
        ui_data = get_ui_contract_data(channel_id)

        channel_entry = {
            "channel": channel_id,
            "criticality_tier": CHANNELS[channel_id].criticality_tier,
            "ceilings": ceilings,
            "loop_result": loop_result,
            "sponsor_verification": sponsor_ok,
            "ui_contract_summary": {
                "active_source": ui_data.get("active_source"),
                "restored": ui_data.get("restored"),
                "trace_record_count": len(ui_data.get("trace_records", [])),
            },
        }
        table_results.append(channel_entry)

    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(table_results, f, indent=2)

    logger.info(f"N-Wide Acceptance Table successfully written to '{out_file}'")
    print(f"\n--- N-Wide Acceptance Summary ({len(table_results)} channels) ---")
    for r in table_results:
        print(f"Channel: {r['channel']:15s} | Tier: {r['criticality_tier']:8s} | Status: {r['loop_result']['status']:10s} | HandSetCeilings: {r['ceilings']['hand_set']} | SponsorOK: {r['sponsor_verification']}")


if __name__ == "__main__":
    compile_nwide_acceptance_table()
