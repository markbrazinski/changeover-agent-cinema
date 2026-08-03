"""
Channel configuration module.
"""
from dataclasses import dataclass
from typing import Dict, Optional


@dataclass
class ChannelConfig:
    id: str
    name: str
    source_mp4: str
    backup_mp4: str
    captions_vtt: str
    criticality_tier: str  # e.g., "premium", "standard"
    tier_rationale: str
    backup_pool: str


CHANNELS: Dict[str, ChannelConfig] = {
    "tears_of_steel": ChannelConfig(
        id="tears_of_steel",
        name="Tears of Steel",
        source_mp4="films/tears_of_steel/source.mp4",
        backup_mp4="films/tears_of_steel/backup.mp4",
        captions_vtt="films/tears_of_steel/captions.vtt",
        criticality_tier="premium",
        tier_rationale="Flagship accessibility channel with declared SLA tier",
        backup_pool="shared_pool_1",
    ),
    "sintel": ChannelConfig(
        id="sintel",
        name="Sintel",
        source_mp4="films/sintel/source.mp4",
        backup_mp4="films/sintel/backup.mp4",
        captions_vtt="films/sintel/captions.vtt",
        criticality_tier="standard",
        tier_rationale="Secondary animated film channel with shared backup pool",
        backup_pool="shared_pool_1",
    ),
}


def get_channel_config(channel_id: str) -> ChannelConfig:
    if channel_id not in CHANNELS:
        raise ValueError(f"Unknown channel ID: {channel_id}")
    return CHANNELS[channel_id]
