"""
Slice 4 Acceptance Test Suite.
Verifies real feed liveness measurement, fault injection climb, and layer discrimination (captions vs sign_language stand-in).
"""
import time
import pytest
from changeover.telemetry.liveness_meter import LivenessMeter
from changeover.agent.diagnoser import Diagnoser


def test_liveness_meter_healthy_and_fault_climb():
    """
    Verifies that liveness meter measures frame arrival gaps,
    and stopping the frame source causes the gap to climb continuously.
    """
    start_ts = 100.0
    meter = LivenessMeter(initial_timestamp=start_ts)

    # 1. Healthy: Frame arrives at t=101.0s
    meter.record_frame_arrival(timestamp=101.0)
    gap1 = meter.update(current_time=101.05)
    assert gap1 == pytest.approx(0.05)

    # 2. Inject fault: Stop frame source
    meter.inject_fault()
    assert meter.frame_source_running is False

    # Attempt frame arrival while faulted (should be ignored)
    meter.record_frame_arrival(timestamp=102.0)

    # Gap at t=103.0s (103.0 - 101.0 = 2.0s)
    gap2 = meter.update(current_time=103.0)
    assert meter.last_observed_frame_time == pytest.approx(101.0)
    assert gap2 == pytest.approx(2.0)

    # Gap at t=105.0s (105.0 - 101.0 = 4.0s)
    gap3 = meter.update(current_time=105.0)
    assert gap3 == pytest.approx(4.0)
    assert gap3 > gap2


def test_diagnoser_discrimination():
    """
    Gate 4 Test:
    Verify Diagnoser discriminates caption fault vs liveness fault.
    Two different physical quantities -> two distinct correct diagnoses.
    """
    diagnoser = Diagnoser()

    # 1. Caption Fault Evidence -> Names "captions"
    caption_fault_evidence = {
        "data": {
            "result": [
                {"metric": {"__name__": "caption_cue_sync_offset_seconds"}, "value": [time.time(), "2.50"]},
                {"metric": {"__name__": "feed_liveness_seconds", "layer": "sign_language"}, "value": [time.time(), "0.05"]},
            ]
        }
    }
    diag1 = diagnoser.diagnose("tears_of_steel", caption_fault_evidence)
    assert diag1["failed_layer"] == "captions"

    # 2. Feed Liveness Fault Evidence -> Names "sign_language"
    liveness_fault_evidence = {
        "data": {
            "result": [
                {"metric": {"__name__": "caption_cue_sync_offset_seconds"}, "value": [time.time(), "0.20"]},
                {"metric": {"__name__": "feed_liveness_seconds", "layer": "sign_language"}, "value": [time.time(), "1.80"]},
            ]
        }
    }
    diag2 = diagnoser.diagnose("tears_of_steel", liveness_fault_evidence)
    assert diag2["failed_layer"] == "sign_language"

    # 3. Healthy Evidence -> Names "none"
    healthy_evidence = {
        "data": {
            "result": [
                {"metric": {"__name__": "caption_cue_sync_offset_seconds"}, "value": [time.time(), "0.20"]},
                {"metric": {"__name__": "feed_liveness_seconds", "layer": "sign_language"}, "value": [time.time(), "0.05"]},
            ]
        }
    }
    diag3 = diagnoser.diagnose("tears_of_steel", healthy_evidence)
    assert diag3["failed_layer"] == "none"
