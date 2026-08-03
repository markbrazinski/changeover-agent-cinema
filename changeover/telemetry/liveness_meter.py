"""
Liveness Meter Module.
MEASURES feed-liveness as the gap between current time and last observed frame-arrival.
Stand-in feed labeled layer="sign_language".
"""
import time
import logging
from typing import Optional

logger = logging.getLogger(__name__)


class LivenessMeter:
    """
    Measures frame arrival gaps for a stand-in video feed.
    """

    def __init__(self, initial_timestamp: Optional[float] = None):
        now = initial_timestamp if initial_timestamp is not None else time.time()
        self.last_observed_frame_time: float = float(now)
        self.frame_source_running: bool = True

    def record_frame_arrival(self, timestamp: Optional[float] = None) -> None:
        """
        Record a frame arrival from the feed source.
        Only records if frame_source_running is True.
        """
        if self.frame_source_running:
            self.last_observed_frame_time = float(timestamp if timestamp is not None else time.time())

    def update(self, current_time: Optional[float] = None) -> float:
        """
        Calculates and returns the feed-liveness gap in seconds.
        Gap = current_time - last_observed_frame_time.
        """
        now = float(current_time if current_time is not None else time.time())
        liveness_gap = max(0.0, now - self.last_observed_frame_time)
        return liveness_gap

    def inject_fault(self) -> None:
        """Stops frame arrivals from the frame source."""
        self.frame_source_running = False
        logger.warning("Liveness fault injected: Frame source stopped")

    def clear_fault(self) -> None:
        """Resumes frame arrivals from the frame source."""
        self.frame_source_running = True
        self.record_frame_arrival()
        logger.info("Liveness fault cleared: Frame source resumed")
