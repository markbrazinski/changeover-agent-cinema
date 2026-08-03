#!/usr/bin/env bash
set -e

export PYTHONPATH="$(pwd):$PYTHONPATH"

echo "Executing Changeover N-Wide Multi-Channel Orchestration..."
python3 scripts/compile_nwide.py
