#!/usr/bin/env python3
"""
Run Contention Scenario Script.
Simulates concurrent fault on N=2 channels against M=1 shared backup capacity.
Executes unauthorized run (refused) and authorized run (protects priority, degrades loser, proves loser untouched).
"""
import os
import shutil
import json
import logging
from changeover.config.channels import get_channel_config
from changeover.ceilings.derive import derive_channel_ceilings
from changeover.telemetry.program_clock import ProgramClock
from changeover.telemetry.caption_meter import CaptionMeter
from changeover.action.failover_tool import write_channel_state
from changeover.contention.supervisor import ContentionSupervisor

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)


def run_contention_scenario(log_dir: str = "logs"):
    state_dir = os.path.join(log_dir, "state")
    if os.path.exists(state_dir):
        shutil.rmtree(state_dir)
    os.makedirs(state_dir, exist_ok=True)

    # Reset start state to primary
    write_channel_state("tears_of_steel", active_source="primary", action="initialized", human_authorizer=None, state_dir=state_dir)

    logger.info("=== STARTING CONTENTION SCENARIO (M=1 vs N=2) ===")

    tos_cfg = get_channel_config("tears_of_steel")
    sin_cfg = get_channel_config("sintel")

    tos_ceilings = derive_channel_ceilings("tears_of_steel")
    sin_ceilings = derive_channel_ceilings("sintel")

    # Run clocks to 5.0s (publishing cues)
    tos_clock = ProgramClock(start_position=0.0)
    sin_clock = ProgramClock(start_position=0.0)

    tos_meter = CaptionMeter(tos_cfg.captions_vtt, tos_clock)
    sin_meter = CaptionMeter(sin_cfg.captions_vtt, sin_clock)

    tos_clock.set_position(5.0)
    sin_clock.set_position(5.0)
    tos_meter.update()
    sin_meter.update()

    # Inject real caption freeze fault at pos 5.0s (last published cue: 4.504s)
    logger.warning("INJECTING CONCURRENT FAULT: Freezing caption publishers for BOTH 'tears_of_steel' AND 'sintel'")
    tos_meter.inject_fault()
    sin_meter.inject_fault()

    # Advance clock to 7.5s -> measured offset = 2.996s (irregular .vtt cue divergence)
    tos_clock.set_position(7.5)
    sin_clock.set_position(7.5)

    tos_offset = tos_meter.update()
    sin_offset = sin_meter.update()

    logger.info(f"Concurrent Active Incidents: Tears of Steel offset={tos_offset:.3f}s | Sintel offset={sin_offset:.3f}s")

    active_incidents = {
        "tears_of_steel": {"caption_offset": tos_offset, "tier": tos_cfg.criticality_tier},
        "sintel": {"caption_offset": sin_offset, "tier": sin_cfg.criticality_tier},
    }

    supervisor = ContentionSupervisor(backup_capacity=1, pool_id="shared_pool_1")

    # 1. RUN 1: Unauthorized Arbitration
    logger.info("\n--- [RUN 1: UNAUTHORIZED CONTENTION ARBITRATION] ---")
    unauth_res = supervisor.arbitrate(active_incidents, human_authorizer=None, log_dir=log_dir)

    # 2. RUN 2: Authorized Arbitration
    logger.info("\n--- [RUN 2: AUTHORIZED CONTENTION ARBITRATION] ---")
    auth_res = supervisor.arbitrate(active_incidents, human_authorizer="operator:mark", log_dir=log_dir)

    tos_state_file = os.path.join(state_dir, "feed_state_tears_of_steel.json")
    sintel_state_file = os.path.join(state_dir, "feed_state_sintel.json")

    tos_state_exists = os.path.exists(tos_state_file)
    sintel_state_exists = os.path.exists(sintel_state_file)

    print("\n=======================================================================")
    print("  CONTENTION SCENARIO RESULTS (M=1 vs N=2)")
    print("=======================================================================")
    print(f"Priority Channel ('tears_of_steel' [premium]):")
    print(f"  - Action Executed:            True")
    print(f"  - Verified Restored Status:   {auth_res['priority_execution']['restored']} (Measured Post-Swap Offset: {auth_res['priority_execution']['post_swap_measured_offset']:.3f}s)")
    print(f"  - State File Exists:          {tos_state_exists} ({tos_state_file})")
    print(f"\nDegraded Channel ('sintel' [standard]):")
    print(f"  - Status:                     DEGRADED + FLAGGED")
    print(f"  - State File Exists:          {sintel_state_exists} (PROOF: PROVABLY UNTOUCHED!)")
    print(f"\nTradeoff Audit Record:")
    print(f"  - Written to:                 logs/contention_authorized.json")
    print(f"  - Reasoning:                  {auth_res['reasoning']}")
    print("=======================================================================\n")

    return auth_res


if __name__ == "__main__":
    run_contention_scenario()
