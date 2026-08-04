/**
 * Walkthrough Configuration: Timings & Verbose On-Screen Narration Copy.
 * Configured for guided interactive demo flow with 2 explicit human approval pauses.
 */

export const WALKTHROUGH_CONFIG = {
  TIMINGS: {
    STAGE_01_AT_REST: 3000,          // Beat 1: At rest
    STAGE_02_INJECT_FAULT: 4000,     // Beat 2: Fault injected
    STAGE_03_INVESTIGATE: 4500,      // Beat 3: Investigate (Grafana query + retry)
    STAGE_04_VERIFY_BACKUP: 3000,    // Beat 4: Verify backup (ffprobe)
    STAGE_06_CHANGED_OVER: 3500,     // Beat 6: Post-swap restore
    STAGE_BREATH: 2000,              // Beat 6.5: Breath before contention
    STAGE_09_CONTENTION_FAIL: 3500,  // Beat 7: Contention 2 failures
    STAGE_12_TERMINAL: 5000,         // Beat 10: Terminal partially mitigated hold
  },
  NARRATIONS: {
    STAGE_01_AT_REST: "A broadcast control room. One operator, many channels. Watch the captions moving on the right.",
    STAGE_02_INJECT_FAULT: "The captions just froze — but the board still reads green. No alarm fired. In an exception-managed room, nobody is watching this.",
    STAGE_03_INVESTIGATE: "The agent queries Grafana, retries a failed query, and isolates the caption layer — ruling out the others.",
    STAGE_04_VERIFY_BACKUP: "It verifies a healthy backup exists via ffprobe.",
    STAGE_05_AWAITING_APPROVAL: "⏸ STOP — PAUSED FOR OPERATOR: The agent will not act on its own. YOU are the operator — click AUTHORIZE FAILOVER to switch this channel.",
    STAGE_06_CHANGED_OVER: "Captions restored — confirmed by measurement (+0.486s), not assumption.",
    STAGE_BREATH: "Primary stream restored. Testing multi-channel resource scarcity scenario...",
    STAGE_09_CONTENTION_FAIL: "Now two channels fail at once. There is only one backup. The agent cannot save both.",
    STAGE_10_CONTENTION_DECISION: "⏸ STOP — PAUSED FOR OPERATOR TRADEOFF: The agent recommends protecting the emergency channel — a priority declared before the incident, which the agent cannot change. Click AUTHORIZE PRIORITIZATION to execute.",
    STAGE_11_CONTENTION_AUTH: "Executing human-authorized tradeoff...",
    STAGE_12_TERMINAL: "One channel restored. One honestly degraded and flagged for a human. The agent did not pretend it saved both. This is the honest terminal state.",
  },
};
