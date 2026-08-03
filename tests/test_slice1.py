"""
Slice 1 Acceptance Test Suite.
Verifies real measured caption metric derivation from parsed WebVTT cue timestamps vs program clock.
"""
import pytest
import os
from changeover.config.channels import get_channel_config
from changeover.telemetry.program_clock import ProgramClock
from changeover.telemetry.caption_meter import CaptionMeter, parse_vtt_cues, parse_vtt_timestamp
from changeover.telemetry.prometheus_exporter import PrometheusExporter


def test_vtt_parsing():
    """Verify that WebVTT cue timestamps are parsed into exact floating-point seconds."""
    assert parse_vtt_timestamp("00:00:02.002") == pytest.approx(2.002)
    assert parse_vtt_timestamp("00:01:30.500") == pytest.approx(90.500)

    config = get_channel_config("tears_of_steel")
    assert os.path.exists(config.captions_vtt), f"Missing captions VTT file: {config.captions_vtt}"

    cues = parse_vtt_cues(config.captions_vtt)
    assert len(cues) > 0, "Parsed 0 cues from WebVTT file"
    assert cues[0][0] == pytest.approx(2.002)


def test_caption_meter_healthy_sawtooth():
    """Verify healthy caption meter measurement tracks program clock with sawtooth bounded by cue interval."""
    config = get_channel_config("tears_of_steel")
    clock = ProgramClock(start_position=0.0)
    meter = CaptionMeter(config.captions_vtt, clock)

    # Position before first cue (2.002s)
    clock.set_position(1.0)
    offset1 = meter.update()
    assert meter.last_published_cue_time == 0.0
    assert offset1 == pytest.approx(1.0)

    # Position right after first cue (2.002s)
    clock.set_position(2.5)
    offset2 = meter.update()
    assert meter.last_published_cue_time == pytest.approx(2.002)
    assert offset2 == pytest.approx(0.498)  # 2.5 - 2.002

    # Position right after second cue (4.504s)
    clock.set_position(5.0)
    offset3 = meter.update()
    assert meter.last_published_cue_time == pytest.approx(4.504)
    assert offset3 == pytest.approx(0.496)  # 5.0 - 4.504


def test_caption_meter_fault_injection_climb():
    """
    CRITICAL GUARDRAIL TEST:
    Verify that under fault injection, last_published_cue_time stays frozen,
    and measured offset climbs strictly from the advancing program clock vs frozen cue time.
    """
    config = get_channel_config("tears_of_steel")
    clock = ProgramClock(start_position=5.0)
    meter = CaptionMeter(config.captions_vtt, clock)

    meter.update()
    frozen_cue_time = meter.last_published_cue_time
    assert frozen_cue_time == pytest.approx(4.504)

    # Inject fault: freeze cue publisher
    meter.inject_fault()
    assert meter.publisher_frozen is True

    # Advance clock and observe offset climbing
    clock.set_position(7.0)
    offset_at_7 = meter.update()
    assert meter.last_published_cue_time == pytest.approx(frozen_cue_time)  # Still 4.504
    assert offset_at_7 == pytest.approx(7.0 - 4.504)  # 2.496

    clock.set_position(10.0)
    offset_at_10 = meter.update()
    assert meter.last_published_cue_time == pytest.approx(frozen_cue_time)  # Still 4.504
    assert offset_at_10 == pytest.approx(10.0 - 4.504)  # 5.496

    # Verify monotonic climb
    assert offset_at_10 > offset_at_7


def test_prometheus_exporter_seeding():
    """Verify Prometheus exporter seeds historical telemetry curve."""
    config = get_channel_config("tears_of_steel")
    clock = ProgramClock(start_position=0.0)
    meter = CaptionMeter(config.captions_vtt, clock)
    exporter = PrometheusExporter(port=8999)

    exporter.seed_history(meter, config.id, duration_seconds=100.0, step_seconds=10.0)
    assert len(exporter.history) > 0
    assert exporter.history[-1]["channel"] == "tears_of_steel"
