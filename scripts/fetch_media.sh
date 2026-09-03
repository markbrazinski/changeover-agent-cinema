#!/usr/bin/env bash
# Helper script to link or populate public/media video assets from local films/ source directory.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

mkdir -p "${ROOT_DIR}/public/media"

echo "[fetch_media] Checking public/media assets..."

# Ensure tears of steel & sintel streams exist in public/media/
if [ -f "${ROOT_DIR}/films/tears_of_steel/source.mp4" ] && [ ! -f "${ROOT_DIR}/public/media/tos_source.mp4" ]; then
    cp "${ROOT_DIR}/films/tears_of_steel/source.mp4" "${ROOT_DIR}/public/media/tos_source.mp4"
fi

if [ -f "${ROOT_DIR}/films/tears_of_steel/backup.mp4" ] && [ ! -f "${ROOT_DIR}/public/media/tos_backup.mp4" ]; then
    cp "${ROOT_DIR}/films/tears_of_steel/backup.mp4" "${ROOT_DIR}/public/media/tos_backup.mp4"
fi

if [ -f "${ROOT_DIR}/films/sintel/source.mp4" ] && [ ! -f "${ROOT_DIR}/public/media/sintel_source.mp4" ]; then
    cp "${ROOT_DIR}/films/sintel/source.mp4" "${ROOT_DIR}/public/media/sintel_source.mp4"
fi

if [ -f "${ROOT_DIR}/films/sintel/backup.mp4" ] && [ ! -f "${ROOT_DIR}/public/media/sintel_backup.mp4" ]; then
    cp "${ROOT_DIR}/films/sintel/backup.mp4" "${ROOT_DIR}/public/media/sintel_backup.mp4"
fi

echo "[fetch_media] Media check complete. public/media/ is populated."
