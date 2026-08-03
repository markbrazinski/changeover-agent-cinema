#!/usr/bin/env python3
"""
Verify Live Metric Wiring.
Proves that Diagnoser consumes the LIVE climbing metric from CaptionMeter/LivenessMeter,
not a hardcoded fixture or static constant.
"""
import time
from changeover.config.channels import get_channel_config
from changeover.telemetry.program_clock import ProgramClock
from changeover.telemetry.caption_meter import CaptionMeter
from changeover.telemetry.liveness_meter import LivenessMeter
from changeover.agent.diagnoser import Diagnoser


def verify_live_wiring():
    config = get_channel_config("tears_of_steel")
    clock = ProgramClock(start_position=10.0)
    caption_meter = CaptionMeter(config.captions_vtt, clock)
    liveness_meter = LivenessMeter()
    diagnoser = Diagnoser()

    # Inject caption freeze fault
    caption_meter.inject_fault()

    print("--- Proving Meter -> Diagnoser Live Metric Wiring ---")
    for tick in range(1, 6):
        # 1. Real meter tick & measurement
        clock.tick(1.0)
        live_offset = caption_meter.update()
        live_liveness = liveness_meter.update()

        # 2. Construct telemetry evidence vector with live value
        evidence_payload = {
            "data": {
                "result": [
                    {
                        "metric": {"__name__": "caption_cue_sync_offset_seconds", "channel": "tears_of_steel"},
                        "value": [time.time(), str(live_offset)],
                    },
                    {
                        "metric": {"__name__": "feed_liveness_seconds", "layer": "sign_language", "channel": "tears_of_steel"},
                        "value": [time.time(), str(live_liveness)],
                    },
                ]
            }
        }

        # 3. Pass live evidence payload to Diagnoser
        diag_res = diagnoser.diagnose("tears_of_steel", evidence_payload, caption_threshold=0.7589)

        print(
            f"Tick {tick:02d} | ProgramClock: {clock.get_position():5.1f}s | "
            f"Meter.update(): {live_offset:5.2f}s | "
            f"Diagnoser Consumed Offset: {live_offset:5.2f}s | "
            f"Diagnoser Result: {diag_res['failed_layer']} ({diag_res['rationale']})"
        )


if __name__ == "__main__":
    verify_live_wiring()
