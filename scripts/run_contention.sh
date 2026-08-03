#!/usr/bin/env bash
set -e

export PYTHONPATH="$(pwd):$PYTHONPATH"

echo "Executing Changeover Contention Scenario (M=1 vs N=2)..."
python3 scripts/run_contention_scenario.py
