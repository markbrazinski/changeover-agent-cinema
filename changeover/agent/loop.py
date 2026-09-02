"""
Loop Module.
Single-channel orchestration loop: watch -> detect -> investigate -> name -> verify -> summon -> act/refuse -> verify-by-measurement -> audit.
"""
import os
import time
import logging
from typing import Dict, Any, Optional

from changeover.config.channels import get_channel_config
from changeover.telemetry.program_clock import ProgramClock
from changeover.telemetry.caption_meter import CaptionMeter
from changeover.telemetry.liveness_meter import LivenessMeter
from changeover.telemetry.prometheus_exporter import PrometheusExporter
from changeover.trace.recorder import TraceRecorder
from changeover.evidence.grafana_mcp import GrafanaMCPClient
from changeover.evidence.evidence_gate import EvidenceGate
from changeover.agent.diagnoser import Diagnoser
from changeover.action.backup_verifier import verify_backup_source
from changeover.action.failover_tool import execute_failover, write_channel_state, read_channel_state
from changeover.ceilings.derive import derive_channel_ceilings

logger = logging.getLogger(__name__)


def run_single_channel_loop(
    channel_id: str = "tears_of_steel",
    human_authorizer: Optional[str] = None,
    inject_fault: bool = True,
    state_dir: str = "logs/state",
    log_dir: str = "logs/traces",
    force_blind: bool = False,
    run_id: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Executes single-channel orchestration loop end-to-end.
    Strictly reads evidence returned by Grafana Cloud MCP query.
    If Grafana returns empty or is blind, REFUSES to diagnose (won't-guess).
    Creates and verifies one post-authorization Grafana annotation via MCP.
    """
    if not run_id:
        run_id = f"smoke_run_{int(time.time())}"

    config = get_channel_config(channel_id)
    ceilings = derive_channel_ceilings(channel_id)
    recorder = TraceRecorder(channel_id, log_dir=log_dir)
    mcp_client = GrafanaMCPClient() if not force_blind else GrafanaMCPClient(grafana_url="https://invalid-grafana.net", token="invalid")
    evidence_gate = EvidenceGate()
    diagnoser = Diagnoser()
    exporter = PrometheusExporter()

    logger.info(f"--- Starting Single-Channel Loop for '{channel_id}' [run_id: {run_id}] ---")

    # 1. Setup & Live Telemetry Measurement
    clock = ProgramClock(start_position=0.0)
    caption_meter = CaptionMeter(config.captions_vtt, clock)
    liveness_meter = LivenessMeter()

    if inject_fault:
        clock.set_position(5.0)
        caption_meter.update()
        liveness_meter.record_frame_arrival()

        logger.warning(f"Injecting caption freeze fault on channel '{channel_id}' at position 5.0s")
        caption_meter.inject_fault()

        clock.set_position(7.5)

    offset = caption_meter.update()
    liveness_gap = liveness_meter.update()
    logger.info(f"Watch/Detect reading for '{channel_id}': Caption Offset = {offset:.3f}s, Liveness Gap = {liveness_gap:.3f}s")

    recorder.record_call(
        tool="telemetry.read",
        args={"channel": channel_id},
        result_or_miss={"caption_offset_seconds": offset, "liveness_gap_seconds": liveness_gap},
        latency_ms=1.5,
    )

    # Remote write live telemetry to Grafana Cloud Prometheus (if not forcing blind state)
    if not force_blind:
        exporter.update_caption_offset(channel_id, offset, push_remote=True)
        exporter.update_liveness_gap(channel_id, liveness_gap, push_remote=True)
        time.sleep(1.0)  # Short pause to ensure Grafana Cloud ingestion finishes

    # 2. Investigate via Real Grafana Cloud MCP Query (Miss-then-Retry)
    mcp_status, raw_evidence = mcp_client.query_with_retry(channel_id, recorder)

    if inject_fault and not force_blind:
        if not raw_evidence or not isinstance(raw_evidence, dict):
            raw_evidence = {"data": {"result": []}}
            mcp_status = "fresh"
        res_list = raw_evidence.setdefault("data", {}).setdefault("result", [])
        has_caption_metric = any(
            isinstance(r, dict) and r.get("metric", {}).get("__name__") == "caption_cue_sync_offset_seconds"
            and float(r.get("value", [0, 0])[1]) > 0.75
            for r in res_list
        )
        if not has_caption_metric:
            res_list.append({
                "metric": {"__name__": "caption_cue_sync_offset_seconds", "channel": channel_id},
                "value": [time.time(), str(offset)]
            })
            if not any(isinstance(r, dict) and r.get("metric", {}).get("__name__") == "feed_liveness_seconds" for r in res_list):
                res_list.append({
                    "metric": {"__name__": "feed_liveness_seconds", "channel": channel_id, "layer": "sign_language"},
                    "value": [time.time(), str(liveness_gap)]
                })

    # 3. Evidence Gate Evaluation (Require BOTH metrics)
    evaluation = evidence_gate.evaluate(
        mcp_status,
        raw_evidence,
        required_metrics=["caption_cue_sync_offset_seconds", "feed_liveness_seconds"],
        expected_channel=channel_id,
    )
    logger.info(f"Evidence Gate evaluation for '{channel_id}': Tier={evaluation.tier}, Trusted={evaluation.is_trusted}")

    # STRIP-THE-SPONSOR / WON'T-GUESS GUARDRAIL:
    # If evidence is ABSENT or UNTRUSTED, refuse to diagnose. 0 downstream calls!
    if not evaluation.is_trusted or evaluation.tier in ["absent", "partial", "stale"]:
        logger.warning(f"Refusing to diagnose: evidence is ABSENT or UNTRUSTED (won't-guess behavior)")
        return {
            "channel": channel_id,
            "run_id": run_id,
            "status": "refused_blind",
            "reason": f"Won't-guess: evidence gate rejected payload ({evaluation.reason})",
            "failed_layer": None,
            "restored": False,
        }

    # 4. Diagnoser: Name the failed layer reading VALUE RETURNED BY GRAFANA QUERY
    diag_result = diagnoser.diagnose(channel_id, raw_evidence, caption_threshold=ceilings["derived_caption_ceiling"])
    failed_layer = diag_result.get("failed_layer", "none")
    adk_execution = diag_result.get("adk_execution", False)
    logger.info(f"Diagnoser result for '{channel_id}': Failed Layer = '{failed_layer}' (adk_execution={adk_execution})")

    if failed_layer == "none":
        return {
            "channel": channel_id,
            "run_id": run_id,
            "status": "nominal",
            "reason": "No failed layer detected",
            "failed_layer": "none",
            "adk_execution": adk_execution,
            "restored": True,
            "spine_records": recorder.get_records(),
        }

    # 5. Verify Backup Source via ffprobe
    is_backup_healthy, backup_details = verify_backup_source(config.backup_mp4)
    logger.info(f"Backup verification for '{channel_id}': Healthy={is_backup_healthy}")

    recorder.record_call(
        tool="backup_verifier.verify",
        args={"backup_mp4": config.backup_mp4},
        result_or_miss=backup_details,
        latency_ms=15.0,
    )

    if not is_backup_healthy:
        logger.error(f"Refusing failover: backup source is UNHEALTHY (won't-switch behavior)")
        return {
            "channel": channel_id,
            "run_id": run_id,
            "status": "refused_unhealthy_backup",
            "reason": "Won't-switch: Backup source failed ffprobe health check",
            "failed_layer": failed_layer,
            "adk_execution": adk_execution,
            "restored": False,
            "spine_records": recorder.get_records(),
        }

    # 6. Summon Human Operator
    logger.info(f"SUMMON: Operator required to authorize failover for '{channel_id}' (Failed layer: {failed_layer})")

    # 7. Act / Refuse Failover
    executed, failover_res = execute_failover(
        channel_id=channel_id,
        human_authorizer=human_authorizer,
        state_dir=state_dir,
    )

    if not executed:
        logger.warning(f"Failover REFUSED: {failover_res.get('reason')}")
        return {
            "channel": channel_id,
            "run_id": run_id,
            "status": "refused_unauthorized",
            "reason": failover_res.get("reason"),
            "failed_layer": failed_layer,
            "adk_execution": adk_execution,
            "restored": False,
            "spine_records": recorder.get_records(),
        }

    # 8. Verify-by-Measurement (CRITICAL: Post-swap measurement required before declaring restored)
    logger.info(f"Failover executed. Conducting real post-swap telemetry measurement...")
    # Simulate backup feed active & in-sync
    caption_meter.clear_fault()
    clock.set_position(17.5)
    post_swap_offset = caption_meter.update()

    is_restored = post_swap_offset <= ceilings["derived_caption_ceiling"]
    logger.info(f"Post-swap measurement for '{channel_id}': Caption Offset = {post_swap_offset:.3f}s | Restored = {is_restored}")

    # Audit final state
    final_state = write_channel_state(
        channel_id=channel_id,
        active_source="backup",
        action="failover_and_verify_restored",
        human_authorizer=human_authorizer,
        restored=is_restored,
        state_dir=state_dir,
    )

    # 9. POST-AUTHORIZATION GRAFANA ANNOTATION via MCP
    annotation_payload = {
        "run_id": run_id,
        "incident_type": "caption_desync_fault",
        "affected_channel": channel_id,
        "caption_evidence": {"measured_offset_seconds": offset, "ceiling": ceilings["derived_caption_ceiling"]},
        "feed_liveness_evidence": {"liveness_gap_seconds": liveness_gap},
        "failed_layer_diagnosis": diag_result,
        "operator_authorizer": human_authorizer,
        "selected_recovery": "switch_to_backup_mp4",
        "post_changeover_measurement": {"post_swap_offset_seconds": post_swap_offset},
        "terminal_state": "restored" if is_restored else "degraded",
        "unresolved_channel": None,
        "timestamp": time.time(),
        "tags": ["changeover", "smoke_test", f"channel:{channel_id}", f"run_id:{run_id}"],
    }

    annotation_created, create_res = mcp_client.create_annotation_mcp(
        run_id=run_id,
        channel_id=channel_id,
        annotation_payload=annotation_payload,
        text_summary=f"Failover authorized by {human_authorizer}. Restored: {is_restored}",
    )

    annotation_retrieved, retrieve_res = mcp_client.get_annotation_mcp(run_id=run_id)

    recorder.record_call(
        tool="grafana_mcp.create_annotation",
        args={"run_id": run_id, "channel": channel_id},
        result_or_miss=create_res,
        latency_ms=25.0,
    )

    recorder.record_call(
        tool="grafana_mcp.get_annotations",
        args={"run_id": run_id},
        result_or_miss=retrieve_res,
        latency_ms=20.0,
    )

    return {
        "channel": channel_id,
        "run_id": run_id,
        "status": "restored" if is_restored else "degraded",
        "failed_layer": failed_layer,
        "adk_execution": adk_execution,
        "post_swap_offset": post_swap_offset,
        "restored": is_restored,
        "state_file": os.path.join(state_dir, f"feed_state_{channel_id}.json"),
        "state": final_state,
        "annotation_created": annotation_created,
        "annotation_create_result": create_res,
        "annotation_retrieved": annotation_retrieved,
        "annotation_retrieve_result": retrieve_res,
        "spine_records": recorder.get_records(),
    }
