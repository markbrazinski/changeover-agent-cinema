"""
Single Channel Telemetry Runner.
Runs the program clock, caption meter, and Prometheus exporter for a given channel.
"""
import sys
import time
import argparse
import logging
from changeover.config.channels import get_channel_config
from changeover.telemetry.program_clock import ProgramClock
from changeover.telemetry.caption_meter import CaptionMeter
from changeover.telemetry.prometheus_exporter import PrometheusExporter

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)


def run_channel_loop(channel_id: str = "tears_of_steel", port: int = 8000, inject_fault_at: int = -1, duration: int = 30):
    """
    Runs single channel telemetry loop.
    """
    config = get_channel_config(channel_id)
    logger.info(f"Starting channel telemetry loop for: {config.name} ({config.id})")
    logger.info(f"Using captions VTT: {config.captions_vtt}")

    clock = ProgramClock(start_position=0.0, playback_rate=1.0)
    meter = CaptionMeter(config.captions_vtt, clock)
    exporter = PrometheusExporter(port=port)

    # Start Prometheus HTTP server
    exporter.start_server()

    # Seed history
    logger.info("Seeding 10 minutes of historical telemetry...")
    exporter.seed_history(meter, config.id, duration_seconds=600.0, step_seconds=2.0)

    logger.info(f"Parsed {len(meter.cues)} caption cues from {config.captions_vtt}.")
    if meter.cues:
        logger.info(f"First cue start: {meter.cues[0][0]}s | Last cue start: {meter.cues[-1][0]}s")

    print("\n--- Telemetry Loop Running ---")
    start_wall = time.time()
    for tick in range(1, duration + 1):
        if inject_fault_at > 0 and tick == inject_fault_at:
            logger.warning(f"=== FAULT INJECTION at tick {tick}: Freezing caption cue publisher ===")
            meter.inject_fault()

        # Advance program clock by 1.0 second
        clock.tick(1.0)
        offset = meter.update()
        exporter.update_caption_offset(config.id, offset)

        status = "FROZEN" if meter.publisher_frozen else "HEALTHY"
        print(
            f"Tick {tick:02d} | ProgramClock: {clock.get_position():6.2f}s | "
            f"LastCueTs: {meter.last_published_cue_time:6.2f}s | "
            f"MeasuredOffset: {offset:6.2f}s | PublisherStatus: {status}"
        )
        time.sleep(0.5)

    print("\n--- Telemetry Loop Finished ---\n")


def main():
    parser = argparse.ArgumentParser(description="Run Changeover channel telemetry")
    parser.add_argument("--channel", type=str, default="tears_of_steel", help="Channel ID")
    parser.add_argument("--port", type=int, default=8000, help="Prometheus exporter port")
    parser.add_argument("--inject-fault-at", type=int, default=-1, help="Tick number to inject caption freeze fault")
    parser.add_argument("--duration", type=int, default=30, help="Total duration in ticks")
    args = parser.parse_args()

    run_channel_loop(
        channel_id=args.channel,
        port=args.port,
        inject_fault_at=args.inject_fault_at,
        duration=args.duration,
    )


if __name__ == "__main__":
    main()
