#!/usr/bin/env bash
set -e

CHANNEL=${1:-"tears_of_steel"}
FAULT_TICK=${2:-"-1"}
DURATION=${3:-"15"}

export PYTHONPATH="$(pwd):$PYTHONPATH"

echo "Executing Changeover Single-Channel Telemetry for '$CHANNEL'..."
python3 -m changeover.runner --channel "$CHANNEL" --inject-fault-at "$FAULT_TICK" --duration "$DURATION"
