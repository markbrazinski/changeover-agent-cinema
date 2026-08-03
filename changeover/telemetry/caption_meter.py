"""
Caption Meter Module.
MEASURES caption cue-vs-program-clock offset by parsing WebVTT cue timestamps.
"""
import re
from typing import List, Tuple, Optional
from changeover.telemetry.program_clock import ProgramClock


def parse_vtt_timestamp(ts_str: str) -> float:
    """
    Parses a WebVTT timestamp string (e.g., '00:00:02.002' or '02:00.500') into seconds as float.
    """
    ts_str = ts_str.strip()
    parts = ts_str.split(":")
    if len(parts) == 3:
        hours = float(parts[0])
        minutes = float(parts[1])
        seconds = float(parts[2])
        return hours * 3600.0 + minutes * 60.0 + seconds
    elif len(parts) == 2:
        minutes = float(parts[0])
        seconds = float(parts[1])
        return minutes * 60.0 + seconds
    else:
        return float(ts_str)


def parse_vtt_cues(vtt_path: str) -> List[Tuple[float, float, str]]:
    """
    Parses a WebVTT file and returns a list of tuples: (start_time, end_time, text)
    sorted by start_time.
    """
    cues = []
    cue_pattern = re.compile(
        r"^((?:\d{2}:)?\d{2}:\d{2}\.\d{3})\s*-->\s*((?:\d{2}:)?\d{2}:\d{2}\.\d{3})"
    )

    with open(vtt_path, "r", encoding="utf-8") as f:
        lines = f.readlines()

    i = 0
    while i < len(lines):
        line = lines[i].strip()
        match = cue_pattern.match(line)
        if match:
            start_sec = parse_vtt_timestamp(match.group(1))
            end_sec = parse_vtt_timestamp(match.group(2))
            text_lines = []
            i += 1
            while i < len(lines) and lines[i].strip() != "":
                text_lines.append(lines[i].strip())
                i += 1
            text = " ".join(text_lines)
            cues.append((start_sec, end_sec, text))
        else:
            i += 1

    cues.sort(key=lambda x: x[0])
    return cues


class CaptionMeter:
    """
    Measures the cue-sync offset between the advancing program clock and the last published caption cue.
    """

    def __init__(self, vtt_path: str, program_clock: ProgramClock):
        self.vtt_path = vtt_path
        self.program_clock = program_clock
        self.cues = parse_vtt_cues(vtt_path)
        self.cue_starts = [c[0] for x in [self.cues] for c in x]

        self.publisher_frozen: bool = False
        self.last_published_cue_time: float = 0.0
        self.last_published_cue_index: int = -1

    def update(self) -> float:
        """
        Updates measurement and returns the current caption cue-sync offset in seconds.
        If publisher is active (not frozen), last_published_cue_time advances to the latest cue start <= program clock.
        If publisher is frozen, last_published_cue_time does not advance, causing offset to climb as program clock advances.
        """
        current_program_pos = self.program_clock.get_position()

        if not self.publisher_frozen:
            # Update last published cue timestamp to highest cue start_time <= current_program_pos
            latest_cue_time = 0.0
            latest_idx = -1
            for idx, start_time in enumerate(self.cue_starts):
                if start_time <= current_program_pos:
                    latest_cue_time = start_time
                    latest_idx = idx
                else:
                    break
            self.last_published_cue_time = latest_cue_time
            self.last_published_cue_index = latest_idx

        # Measured offset is program clock position minus last published cue timestamp
        measured_offset = max(0.0, current_program_pos - self.last_published_cue_time)
        return measured_offset

    def inject_fault(self) -> None:
        """Freezes the caption publisher."""
        self.publisher_frozen = True

    def clear_fault(self) -> None:
        """Unfreezes the caption publisher."""
        self.publisher_frozen = False
