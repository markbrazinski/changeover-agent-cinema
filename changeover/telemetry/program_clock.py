"""
Program Clock Module.
Maintains the advancing program-position clock representing position on the media timeline.
"""
import time
from typing import Optional


class ProgramClock:
    """
    Advancing media timeline position clock.
    """

    def __init__(self, start_position: float = 0.0, playback_rate: float = 1.0):
        self._position = float(start_position)
        self.playback_rate = float(playback_rate)
        self._last_tick_time = time.time()

    def tick(self, delta_seconds: Optional[float] = None) -> float:
        """
        Advance program position clock.
        If delta_seconds is provided, advances by delta_seconds * playback_rate.
        Otherwise advances based on elapsed wall clock time.
        """
        now = time.time()
        if delta_seconds is None:
            delta_seconds = now - self._last_tick_time
        self._last_tick_time = now
        self._position += float(delta_seconds) * self.playback_rate
        return self._position

    def get_position(self) -> float:
        """Returns the current media timeline position in seconds."""
        return self._position

    def set_position(self, position: float) -> None:
        """Manually sets the media timeline position in seconds."""
        self._position = float(position)
        self._last_tick_time = time.time()
