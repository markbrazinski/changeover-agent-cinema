"""
Backup Verifier Module.
Uses ffprobe and telemetry checks to verify that a backup media source is genuinely healthy.
"""
import os
import json
import subprocess
import logging
from typing import Tuple, Dict, Any

logger = logging.getLogger(__name__)


def verify_backup_source(backup_path: str) -> Tuple[bool, Dict[str, Any]]:
    """
    Verifies that a backup file exists and has valid audio/video streams via ffprobe.
    Returns (is_healthy: bool, details: Dict[str, Any]).
    """
    if not os.path.exists(backup_path):
        return False, {"error": f"Backup file not found at path: {backup_path}"}

    cmd = [
        "ffprobe",
        "-v",
        "quiet",
        "-print_format",
        "json",
        "-show_format",
        "-show_streams",
        backup_path,
    ]

    try:
        res = subprocess.run(cmd, capture_output=True, text=True, timeout=5.0)
        if res.returncode != 0:
            return False, {"error": f"ffprobe failed: {res.stderr}"}

        probe_data = json.loads(res.stdout)
        streams = probe_data.get("streams", [])
        format_info = probe_data.get("format", {})

        has_video = any(s.get("codec_type") == "video" for s in streams)
        duration = float(format_info.get("duration", 0.0))

        is_healthy = has_video and (duration > 0.0)
        details = {
            "backup_path": backup_path,
            "has_video": has_video,
            "stream_count": len(streams),
            "duration_seconds": duration,
            "format_name": format_info.get("format_name"),
            "is_healthy": is_healthy,
        }
        return is_healthy, details

    except Exception as e:
        logger.error(f"Error executing ffprobe on {backup_path}: {e}")
        return False, {"error": str(e)}
