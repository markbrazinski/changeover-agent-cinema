/**
 * Walkthrough Configuration: Timings & Verbose On-Screen Narration Copy.
 * Configured for locked Use Case 1 demo timeline (53–55s recording spine).
 */

export const WALKTHROUGH_CONFIG = {
  MANIFEST_STATUS: 'PROVISIONAL',
  // Operational holds (No artificial delays in natural hero execution path)
  PROTECTED_HOLDS: {
    CHART_LAG_MS: 0,              // Direct telemetry reaction without artificial lag
    TOOL_CALL_STAGGER_MS: 0,      // Natural service execution speed
    FREEZE_HOLD_MS: 0,
    RESUME_HOLD_MS: 1500,
    CH27_FROZEN_HOLD_MS: 2500,
    CLOSE_HOLD_MS: 1000,
  },
  TIMINGS: {
    STAGE_01_AT_REST: 20000,         // Healthy baseline (0:00–0:20)
    STAGE_02_INJECT_FAULT: 0,        // Caption freeze triggers at ~0:20; natural investigation follows immediately
    STAGE_02B_GAP_UNWATCHED: 0,
    STAGE_03_INVESTIGATE: 0,
    STAGE_04_VERIFY_BACKUP: 0,
    STAGE_06_CHANGED_OVER: 7000,     // Post-swap restored hold (0:48–0:55)
    STAGE_BREATH: 2000,
    STAGE_09_CONTENTION_FAIL: 15000,
    STAGE_12_TERMINAL: 10000,
    CONTENTION_STEP_2: 2300,
    CONTENTION_STEP_3: 4600,
    CONTENTION_BASELINE_HOLD: 4000,
    POST_FREEZE_HOLD: 5000,
    INVESTIGATION_HOLD: 3500,
    VERIFY_BACKUP_HOLD: 2500,
    TERMINAL_HOLD: 8000,
    REFUSAL_BASELINE_HOLD: 1500,
    REFUSAL_WARNING_HOLD: 15200,
    REFUSAL_TERMINAL_HOLD: 3000,
  },
  NARRATIONS: {
    STAGE_01_AT_REST: "Live television depends on many systems staying in sync. One operator watches many channels and responds when something turns red. Captions are regulated access. But this board asks whether the feed is live—not whether a viewer can still follow it. Watch the captions on the right. Everything is working.",
    STAGE_02_INJECT_FAULT: "And then—the captions stop. The picture keeps moving.",
    STAGE_03_INVESTIGATE: "Changeover detects the gap. Gemini works the incident through Google’s ADK, querying Grafana Cloud MCP to isolate the caption layer and verify a healthy backup.",
    STAGE_04_VERIFY_BACKUP: "It compares caption timing with feed liveness, attaches the evidence, and stops.",
    STAGE_05_AWAITING_APPROVAL: "Changeover can investigate and recommend. Only the operator can switch the feed.",
    STAGE_06_CHANGED_OVER: "With the backup confirmed, the operator authorizes failover. The backup takes over. Captions return to sync. The viewer gets the next line.",
    STAGE_BREATH: "Primary stream restored. Testing multi-channel resource scarcity scenario...",
    STAGE_09_CONTENTION_FAIL: "Two channels lose captions at once. One backup available. The agent evaluates priority policies.",
    STAGE_10_CONTENTION_DECISION: "⏸ STOP — AWAITING OPERATOR SELECTION: Select policy trade-off to execute.",
    STAGE_11_CONTENTION_AUTH: "Executing human-authorized tradeoff...",
    STAGE_12_TERMINAL: "Partially mitigated: Emergency channel restored, general channel honestly flagged.",
    STAGE_CLOSE: "The room was watching the signal. Changeover was watching the viewer.",
  },
};
