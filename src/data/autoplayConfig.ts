/**
 * Autoplay Demo Configuration: Timings & Narration Copy.
 * Easily edit stage holds and narration text for screen recordings and judge evaluations.
 */

export const AUTOPLAY_CONFIG = {
  TIMINGS: {
    STAGE_01_AT_REST: 2500,          // 1. At Rest
    STAGE_02_INJECT_FAULT: 3500,     // 2. Fault Injected
    STAGE_03_INVESTIGATE: 4500,      // 3. Investigate (Grafana query + retry)
    STAGE_04_VERIFY_BACKUP: 2500,    // 4. Verify Backup (ffprobe)
    STAGE_05_AUTHORIZE_RESTORE: 3500,// 5/6. Human Authorization + Post-Swap Read
    STAGE_BREATH: 1500,              // 6. Beat of Breath transition
    STAGE_09_CONTENTION_FAIL: 2500,  // 7a. Contention 2 failures
    STAGE_10_CONTENTION_DECISION: 3500, // 7b. Policy decision gate
    STAGE_11_CONTENTION_AUTH: 3000,  // 7c. Authorized priority restore
    STAGE_12_TERMINAL: 4000,         // 8. Terminal partially mitigated
  },
  NARRATIONS: {
    STAGE_01_AT_REST: "The board reads green — main program and viewer stream playing in sync at 0.510s baseline.",
    STAGE_02_INJECT_FAULT: "The main program continues — but this viewer's captions visibly froze +2.996s ago.",
    STAGE_03_INVESTIGATE: "The agent queries Grafana Cloud MCP, retries a query miss, and isolates the caption layer.",
    STAGE_04_VERIFY_BACKUP: "The agent verifies candidate backup health via ffprobe before offering a switch.",
    STAGE_05_AWAITING_APPROVAL: "Human-in-the-loop gate — agent halts and summons operator authorization.",
    STAGE_06_CHANGED_OVER: "Human operator authorizes failover — captions resume in sync on backup feed (+0.486s).",
    STAGE_BREATH: "Primary stream restored. Testing multi-channel resource scarcity scenario...",
    STAGE_09_12_CONTENTION: "One backup, two failures — agent enforces operator policy, protecting emergency tier over general tier.",
    STAGE_12_TERMINAL: "Partially mitigated — 1 restored, 1 incident open. Resource scarcity cost remains visible.",
  },
};
