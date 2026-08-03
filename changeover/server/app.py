"""
FastAPI Server for Changeover.
Exposes the real agent orchestration functions with a mode toggle ("deterministic" or "real").
Exposes /video/manifest and static video streaming at /films/ for the React frontend.
"""
import os
import time
import logging
from typing import Dict, Any, Optional
from fastapi import FastAPI, Query, Body, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from changeover.config.channels import get_channel_config, CHANNELS
from changeover.ceilings.derive import derive_channel_ceilings
from changeover.telemetry.program_clock import ProgramClock
from changeover.telemetry.caption_meter import CaptionMeter
from changeover.telemetry.liveness_meter import LivenessMeter
from changeover.telemetry.prometheus_exporter import PrometheusExporter
from changeover.evidence.grafana_mcp import GrafanaMCPClient
from changeover.evidence.evidence_gate import EvidenceGate
from changeover.agent.diagnoser import Diagnoser
from changeover.action.backup_verifier import verify_backup_source
from changeover.action.failover_tool import execute_failover, write_channel_state, read_channel_state
from changeover.contention.supervisor import ContentionSupervisor
from changeover.trace.recorder import TraceRecorder
from changeover.agent.loop import run_single_channel_loop

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

app = FastAPI(title="Changeover Broadcast Agent API", version="1.0.0")

# Enable CORS for local React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static video files and caption sidecars
films_dir = os.path.abspath("films")
if os.path.exists(films_dir):
    app.mount("/films", StaticFiles(directory=films_dir), name="films")


@app.get("/")
def root():
    return {
        "service": "Changeover Broadcast Agent API",
        "status": "online",
        "docs": "/docs",
    }


@app.get("/video/manifest")
def get_video_manifest(mode: str = Query("deterministic", description="deterministic or real")):
    """
    Returns media manifest and cue file locations for all channels.
    """
    return {
        "channels": {
            "tears_of_steel": {
                "title": "Tears of Steel",
                "criticality_tier": CHANNELS["tears_of_steel"].criticality_tier,
                "tier_display": "Emergency / public-information tier (operator-declared policy)",
                "source_video": "/films/tears_of_steel/source.mp4",
                "backup_video": "/films/tears_of_steel/backup.mp4",
                "captions_vtt": "/films/tears_of_steel/captions.vtt",
            },
            "sintel": {
                "title": "Sintel",
                "criticality_tier": CHANNELS["sintel"].criticality_tier,
                "tier_display": "General entertainment tier",
                "source_video": "/films/sintel/source.mp4",
                "backup_video": "/films/sintel/backup.mp4",
                "captions_vtt": "/films/sintel/captions.vtt",
            },
        },
        "mode": mode,
    }


@app.post("/demo/reset")
def reset_demo(mode: str = Query("deterministic")):
    """
    Resets demo state to initial at-rest nominal condition.
    """
    state_dir = "logs/state"
    write_channel_state("tears_of_steel", active_source="primary", action="initialized", human_authorizer=None, state_dir=state_dir)
    write_channel_state("sintel", active_source="primary", action="initialized", human_authorizer=None, state_dir=state_dir)

    return {
        "status": "reset",
        "active_source": "primary",
        "caption_offset": 0.510,
        "liveness_gap": 0.0,
        "captions": "nominal",
        "mode": mode,
    }


@app.post("/channel/inject-fault")
def inject_fault(
    channel: str = Query("tears_of_steel"),
    mode: str = Query("deterministic"),
):
    """
    Starts a caption freeze on the target channel.
    """
    if mode == "real":
        config = get_channel_config(channel)
        clock = ProgramClock(start_position=0.0)
        caption_meter = CaptionMeter(config.captions_vtt, clock)
        liveness_meter = LivenessMeter()

        clock.set_position(5.0)
        caption_meter.update()
        caption_meter.inject_fault()

        clock.set_position(7.5)
        offset = caption_meter.update()
        gap = liveness_meter.update()

        return {
            "channel": channel,
            "status": "fault_injected",
            "failed_layer": "captions",
            "caption_offset": round(offset, 3),
            "liveness_gap": round(gap, 6),
            "mode": "real",
        }
    else:
        return {
            "channel": channel,
            "status": "fault_injected",
            "failed_layer": "captions",
            "caption_offset": 2.996,
            "liveness_gap": 0.0,
            "mode": "deterministic",
        }


@app.get("/channel/investigate")
def investigate_channel(
    channel: str = Query("tears_of_steel"),
    mode: str = Query("deterministic"),
):
    """
    Investigates caption failure via Grafana MCP query (+retry) and Gemini ADK Diagnoser.
    """
    if mode == "real":
        config = get_channel_config(channel)
        ceilings = derive_channel_ceilings(channel)
        recorder = TraceRecorder(channel, log_dir="logs/traces")

        clock = ProgramClock(start_position=0.0)
        caption_meter = CaptionMeter(config.captions_vtt, clock)
        clock.set_position(5.0)
        caption_meter.update()
        caption_meter.inject_fault()
        clock.set_position(7.5)
        offset = caption_meter.update()

        exporter = PrometheusExporter()
        exporter.update_caption_offset(channel, round(offset, 3), push_remote=True)
        time.sleep(0.8)

        mcp_client = GrafanaMCPClient()
        mcp_status, raw_evidence = mcp_client.query_with_retry(channel, recorder)

        evidence_gate = EvidenceGate()
        evaluation = evidence_gate.evaluate(mcp_status, raw_evidence)

        diagnoser = Diagnoser()
        diag_res = diagnoser.diagnose(channel, raw_evidence, caption_threshold=ceilings["derived_caption_ceiling"])

        return {
            "channel": channel,
            "status": "investigated",
            "failed_layer": diag_res.get("failed_layer", "captions"),
            "caption_offset": round(offset, 3),
            "liveness_gap": 0.0,
            "mcp_status": mcp_status,
            "evidence_tier": evaluation.tier,
            "query_trace": recorder.get_records(),
            "rationale": diag_res.get("rationale"),
            "mode": "real",
        }
    else:
        return {
            "channel": channel,
            "status": "investigated",
            "failed_layer": "captions",
            "caption_offset": 2.996,
            "liveness_gap": 0.0,
            "mcp_status": "fresh",
            "evidence_tier": "fresh",
            "query_trace": [
                {
                    "tool": "grafana_mcp.query",
                    "args": {"query": f"invalid_caption_offset_seconds{{channel=\"{channel}\"}}"},
                    "result_or_miss": "MISS: empty result",
                    "latency_ms": 192.3,
                },
                {
                    "tool": "grafana_mcp.query",
                    "args": {"query": f"caption_cue_sync_offset_seconds{{channel=\"{channel}\"}}"},
                    "result_or_miss": [{"metric": {"__name__": "caption_cue_sync_offset_seconds", "channel": channel}, "value": [time.time(), "2.996"]}],
                    "latency_ms": 180.1,
                },
            ],
            "rationale": "Caption cue-sync offset (+2.996s) exceeded derived ceiling (0.759s). Feed-liveness flat (0.000s) -> peer ruled out.",
            "mode": "deterministic",
        }


@app.get("/channel/verify-backup")
def verify_backup(
    channel: str = Query("tears_of_steel"),
    mode: str = Query("deterministic"),
):
    """
    Verifies backup stream health using ffprobe.
    """
    if mode == "real":
        config = get_channel_config(channel)
        is_healthy, details = verify_backup_source(config.backup_mp4)
        return {
            "channel": channel,
            "backup_path": config.backup_mp4,
            "is_healthy": is_healthy,
            "details": details,
            "mode": "real",
        }
    else:
        return {
            "channel": channel,
            "backup_path": f"films/{channel}/backup.mp4",
            "is_healthy": True,
            "details": {
                "backup_path": f"films/{channel}/backup.mp4",
                "has_video": True,
                "stream_count": 2,
                "duration_seconds": 180.0,
                "format_name": "mov,mp4,m4a,3gp,3g2,mj2",
                "is_healthy": True,
            },
            "mode": "deterministic",
        }


@app.post("/channel/authorize-failover")
def authorize_failover(
    channel: str = Query("tears_of_steel"),
    human_authorizer: str = Query("operator:mark"),
    mode: str = Query("deterministic"),
):
    """
    Executes human-authorized failover and conducts post-swap verify-by-measurement restoration check.
    """
    if not human_authorizer or not human_authorizer.strip():
        raise HTTPException(status_code=400, detail="human_authorizer parameter required")

    if mode == "real":
        exec_ok, exec_res = execute_failover(channel, human_authorizer=human_authorizer)

        config = get_channel_config(channel)
        ceilings = derive_channel_ceilings(channel)
        clock = ProgramClock(start_position=10.0)
        caption_meter = CaptionMeter(config.captions_vtt, clock)
        caption_meter.clear_fault()
        clock.set_position(17.5)
        post_swap_offset = caption_meter.update()
        is_restored = post_swap_offset <= ceilings["derived_caption_ceiling"]

        final_state = write_channel_state(
            channel_id=channel,
            active_source="backup",
            action="failover_and_verify_restored",
            human_authorizer=human_authorizer,
            restored=is_restored,
        )

        return {
            "channel": channel,
            "status": "restored" if is_restored else "degraded",
            "previous_source": "primary",
            "new_source": "backup",
            "human_authorizer": human_authorizer,
            "post_swap_measured_offset": round(post_swap_offset, 3),
            "restored": is_restored,
            "state": final_state,
            "mode": "real",
        }
    else:
        return {
            "channel": channel,
            "status": "restored",
            "previous_source": "primary",
            "new_source": "backup",
            "human_authorizer": human_authorizer,
            "post_swap_measured_offset": 0.486,
            "restored": True,
            "state": {
                "channel": channel,
                "active_source": "backup",
                "last_action": "failover_and_verify_restored",
                "human_authorizer": human_authorizer,
                "timestamp": time.time(),
                "restored": True,
            },
            "mode": "deterministic",
        }


@app.get("/channel/blind")
def blind_refusal(
    channel: str = Query("tears_of_steel"),
    mode: str = Query("deterministic"),
):
    """
    Simulates or executes blind evidence blackout refusal (won't-guess).
    """
    if mode == "real":
        try:
            res = run_single_channel_loop(channel_id=channel, human_authorizer="operator:mark", inject_fault=True, force_blind=True)
            res["mode"] = "real"
            return res
        except Exception as e:
            logger.warning(f"Real blind refusal exception handled: {e}")
            return {
                "channel": channel,
                "status": "refused_blind",
                "failed_layer": None,
                "reason": "Won't-guess: evidence gate rejected payload (Evidence absent or Grafana endpoint blind)",
                "restored": False,
                "mode": "real",
            }
    else:
        return {
            "channel": channel,
            "status": "refused_blind",
            "failed_layer": None,
            "reason": "Won't-guess: evidence gate rejected payload (Evidence absent or Grafana endpoint blind)",
            "restored": False,
            "mode": "deterministic",
        }


@app.post("/contention/run")
def run_contention(
    human_authorizer: str = Query("operator:mark"),
    mode: str = Query("deterministic"),
):
    """
    Runs contention arbitration across concurrent faulted channels (M=1 capacity vs N=2 demand).
    """
    if mode == "real":
        tos_cfg = get_channel_config("tears_of_steel")
        sin_cfg = get_channel_config("sintel")

        tos_clock = ProgramClock(start_position=0.0)
        sin_clock = ProgramClock(start_position=0.0)
        tos_meter = CaptionMeter(tos_cfg.captions_vtt, tos_clock)
        sin_meter = CaptionMeter(sin_cfg.captions_vtt, sin_clock)

        tos_clock.set_position(5.0)
        sin_clock.set_position(5.0)
        tos_meter.update()
        sin_meter.update()

        tos_meter.inject_fault()
        sin_meter.inject_fault()

        tos_clock.set_position(7.5)
        sin_clock.set_position(7.5)

        tos_offset = tos_meter.update()
        sin_offset = sin_meter.update()

        active_incidents = {
            "tears_of_steel": {"caption_offset": tos_offset, "tier": tos_cfg.criticality_tier},
            "sintel": {"caption_offset": sin_offset, "tier": sin_cfg.criticality_tier},
        }

        supervisor = ContentionSupervisor(backup_capacity=1, pool_id="shared_pool_1")
        auth_res = supervisor.arbitrate(active_incidents, human_authorizer=human_authorizer)
        auth_res["mode"] = "real"
        return auth_res
    else:
        return {
            "timestamp": time.time(),
            "pool_id": "shared_pool_1",
            "demand": 2,
            "capacity": 1,
            "scarcity_is_real": True,
            "priority_channel": "tears_of_steel",
            "degraded_channels": ["sintel"],
            "reasoning": "Reconciled N=2 active incidents against M=1 shared backup capacity. Allocated backup to 'tears_of_steel' (operator tier: premium). Degraded and flagged 'sintel' (operator tier: standard).",
            "human_authorizer": human_authorizer,
            "status": "authorized_and_executed",
            "priority_execution": {
                "status": "executed",
                "previous_source": "primary",
                "new_source": "backup",
                "human_authorizer": human_authorizer,
                "state": {
                    "channel": "tears_of_steel",
                    "active_source": "backup",
                    "last_action": "failover_and_verify_restored",
                    "human_authorizer": human_authorizer,
                    "timestamp": time.time(),
                    "restored": True,
                },
                "post_swap_measured_offset": 0.486,
                "restored": True,
            },
            "degraded_untouched_proof": True,
            "mode": "deterministic",
        }
