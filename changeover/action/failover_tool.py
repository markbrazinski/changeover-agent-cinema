"""
Failover Tool Module.
Actuator tool that performs channel source toggle. Requires human_authorizer.
"""
import os
import json
import time
import logging
from typing import Dict, Any, Optional, Tuple

logger = logging.getLogger(__name__)


def read_channel_state(channel_id: str, state_dir: str = "logs/state") -> Dict[str, Any]:
    """Reads current channel state from disk."""
    state_file = os.path.join(state_dir, f"feed_state_{channel_id}.json")
    if os.path.exists(state_file):
        try:
            with open(state_file, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            logger.warning(f"Error reading state file {state_file}: {e}")

    # Default initial state
    return {
        "channel": channel_id,
        "active_source": "primary",
        "last_action": "initialized",
        "human_authorizer": None,
        "timestamp": time.time(),
        "restored": False,
    }


def write_channel_state(
    channel_id: str,
    active_source: str,
    action: str,
    human_authorizer: Optional[str],
    restored: bool = False,
    state_dir: str = "logs/state",
) -> Dict[str, Any]:
    """Writes channel state audit record to disk."""
    os.makedirs(state_dir, exist_ok=True)
    state_file = os.path.join(state_dir, f"feed_state_{channel_id}.json")

    state_data = {
        "channel": channel_id,
        "active_source": active_source,
        "last_action": action,
        "human_authorizer": human_authorizer,
        "timestamp": time.time(),
        "restored": restored,
    }

    with open(state_file, "w", encoding="utf-8") as f:
        json.dump(state_data, f, indent=2)

    return state_data


def execute_failover(
    channel_id: str,
    human_authorizer: Optional[str] = None,
    state_dir: str = "logs/state",
) -> Tuple[bool, Dict[str, Any]]:
    """
    Executes source toggle (primary <-> backup) for channel_id.
    CRITICAL GUARDRAIL: Requires a non-empty human_authorizer argument.
    If human_authorizer is absent or empty, execution is REFUSED.
    """
    if not human_authorizer or not str(human_authorizer).strip():
        logger.warning(f"Failover REFUSED for channel '{channel_id}': missing human_authorizer")
        return False, {
            "status": "refused_unauthorized",
            "reason": "Human authorizer required for failover action",
            "channel": channel_id,
        }

    current_state = read_channel_state(channel_id, state_dir)
    current_source = current_state.get("active_source", "primary")

    # Toggle primary <-> backup
    new_source = "backup" if current_source == "primary" else "primary"

    updated_state = write_channel_state(
        channel_id=channel_id,
        active_source=new_source,
        action=f"failover_toggle_to_{new_source}",
        human_authorizer=str(human_authorizer).strip(),
        restored=False,  # Note: restored is set to True only after real post-swap telemetry measurement!
        state_dir=state_dir,
    )

    logger.info(
        f"Failover EXECUTED for '{channel_id}': {current_source} -> {new_source} | Authorizer: {human_authorizer}"
    )
    return True, {
        "status": "executed",
        "previous_source": current_source,
        "new_source": new_source,
        "human_authorizer": str(human_authorizer).strip(),
        "state": updated_state,
    }
