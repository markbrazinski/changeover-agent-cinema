import React, { useState, useEffect, useRef } from 'react';
import { Mode, agentClient, InvestigateResponse, ContentionResponse } from './api/agentClient';
import { DemoControlHeader } from './components/DemoControlHeader';
import { SplitHero, VideoState } from './components/SplitHero';
import { EvidenceChart } from './components/EvidenceChart';
import { AgentSpine, SpineStep } from './components/AgentSpine';
import { CueCardIcon } from './components/CueCardIcon';
import { ReplayProvenanceBanner } from './components/ReplayProvenanceBanner';
import { WALKTHROUGH_CONFIG } from './data/autoplayConfig';

export default function App() {
  const [mode, setMode] = useState<Mode>('deterministic');
  const [currentStage, setCurrentStage] = useState<string>('01_at_rest');
  const [captionOffset, setCaptionOffset] = useState<number>(0.510);
  const [postSwapOffset, setPostSwapOffset] = useState<number | undefined>(undefined);
  const [isWorking, setIsWorking] = useState<boolean>(false);
  const [isManualOpen, setIsManualOpen] = useState<boolean>(false);

  // Guided interactive walkthrough states
  const [isPlayingWalkthrough, setIsPlayingWalkthrough] = useState<boolean>(false);
  const [isPausedForHuman, setIsPausedForHuman] = useState<boolean>(false);
  const [showTimer, setShowTimer] = useState<boolean>(false);
  const walkthroughCancelledRef = useRef<boolean>(false);
  const humanApprovedResolverRef = useRef<(() => void) | null>(null);

  // Investigation & Evidence states
  const [failedLayer, setFailedLayer] = useState<'captions' | 'sign' | 'none'>('none');
  const [mcpStatus, setMcpStatus] = useState<string>('fresh');
  const [evidenceTier, setEvidenceTier] = useState<string>('fresh');
  const [queryTrace, setQueryTrace] = useState<any[]>([]);
  const [rationale, setRationale] = useState<string>('');
  const [backupHealthy, setBackupHealthy] = useState<boolean>(false);
  const [contentionData, setContentionData] = useState<ContentionResponse | null>(null);

  // Live Recording Walkthrough Timecode Counter State
  const [walkthroughElapsedSec, setWalkthroughElapsedSec] = useState<number>(0);
  const walkthroughTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);


  const startWalkthroughTimer = () => {
    setWalkthroughElapsedSec(0);
    if (walkthroughTimerRef.current) clearInterval(walkthroughTimerRef.current);
    walkthroughTimerRef.current = setInterval(() => {
      setWalkthroughElapsedSec((prev) => prev + 1);
    }, 1000);
  };

  const stopWalkthroughTimer = () => {
    if (walkthroughTimerRef.current) {
      clearInterval(walkthroughTimerRef.current);
      walkthroughTimerRef.current = null;
    }
  };

  // Delayed chart freeze flag (2.5s delay from visual caption freeze to chart update)
  const [isChartFrozen, setIsChartFrozen] = useState<boolean>(false);
  // Contention staggered tool call index
  const [contentionStepIndex, setContentionStepIndex] = useState<number>(0);

  useEffect(() => {
    if (currentStage === '01_at_rest' || currentStage === '09a_contention_baseline') {
      setIsChartFrozen(false);
      setContentionStepIndex(0);
    } else if (currentStage === '02_fault_injected' || currentStage === '09_contention_failing') {
      setIsChartFrozen(false);
      const timer = setTimeout(() => {
        setIsChartFrozen(true);
      }, WALKTHROUGH_CONFIG.PROTECTED_HOLDS.CHART_LAG_MS); // 2.5s initial chart delay
      return () => clearTimeout(timer);
    } else {
      setIsChartFrozen(true);
    }
  }, [currentStage]);

  useEffect(() => {
    if (currentStage === '09_contention_failing') {
      setContentionStepIndex(1);
      const t1 = setTimeout(() => setContentionStepIndex(2), 2300);
      const t2 = setTimeout(() => setContentionStepIndex(3), 4600);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    } else if (currentStage === '10_contention_decision' || currentStage === '11_contention_authorized' || currentStage === '12_terminal_partially_mitigated') {
      setContentionStepIndex(3);
    } else {
      setContentionStepIndex(0);
    }
  }, [currentStage]);

  // Timecode generator
  const [timecode, setTimecode] = useState<string>('PGM-OUT 20:14:02');

  // Wave 2 Monotonic Clock Ref & Milestone Logging Helper
  const wave2StartTimeRef = useRef<number>(0);
  const logWave2Milestone = (event: string, detail?: any) => {
    const startTime = wave2StartTimeRef.current || performance.now();
    const elapsedSec = ((performance.now() - startTime) / 1000).toFixed(3);
    console.log(`[WAVE 2 +${elapsedSec}s] ${event}`, detail || '');
  };

  // Keyboard shortcut listener:
  // '1' = Start Part 1 (Clean Walkthrough without timer overlay)
  // '3' = Start Part 1 (Walkthrough with Training Timer Overlay)
  // '2' = Single-press Wave 2 Launch (2-channel baseline -> 7.5s fault -> real investigation -> human gate)
  // 'h' or 'H' = Toggle manual controls header
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'h' || e.key === 'H') {
        setIsManualOpen((prev) => !prev);
      } else if (e.key === '1') {
        setShowTimer(false);
        handleRunPart1();
      } else if (e.key === '3') {
        setShowTimer(true);
        handleRunPart1();
      } else if (e.key === '2') {
        handleRunKey2();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mode, currentStage, isPlayingWalkthrough]);

  // Key '2' Handler: Single-press Wave 2 launch command
  const handleRunKey2 = () => {
    if (
      currentStage === '09a_contention_baseline' ||
      currentStage === '09_contention_failing' ||
      currentStage === '10_contention_decision' ||
      currentStage === '11_contention_authorized' ||
      currentStage === '12_terminal_partially_mitigated'
    ) {
      console.log('Wave 2 already in progress. Ignoring repeated (2) keypress.');
      return;
    }
    handleRunPart2();
  };

  // Load Video Manifest on startup
  useEffect(() => {
    agentClient.getManifest(mode).catch((e) => console.warn('Manifest load error:', e));
  }, [mode]);

  // Handle Mode Change
  const handleSetMode = (m: Mode) => {
    setMode(m);
    handleReset(m);
  };

  // Helper to wait for explicit human click
  const waitForHumanClick = (): Promise<void> => {
    return new Promise((resolve) => {
      humanApprovedResolverRef.current = resolve;
    });
  };

  // 1. Reset Demo (At Rest)
  const handleReset = async (overrideMode?: Mode) => {
    const activeMode = overrideMode || mode;
    setIsWorking(true);
    try {
      await agentClient.resetDemo(activeMode);
      setCurrentStage('01_at_rest');
      setCaptionOffset(0.510);
      setPostSwapOffset(undefined);
      setFailedLayer('none');
      setMcpStatus('fresh');
      setEvidenceTier('fresh');
      setBackupHealthy(false);
      setContentionData(null);
      setTimecode('PGM-OUT 20:14:02');
      setIsPausedForHuman(false);
    } catch (e) {
      console.error('Reset error:', e);
    } finally {
      setIsWorking(false);
    }
  };

  // 2. Inject Freeze Fault
  const handleInjectFault = async () => {
    setIsWorking(true);
    try {
      const res = await agentClient.injectFault('tears_of_steel', mode);
      setCurrentStage('02_fault_injected');
      setCaptionOffset(res.caption_offset || 2.996);
      setFailedLayer('captions');
      setTimecode('PGM-OUT 20:14:16');
    } catch (e) {
      console.error('Inject fault error:', e);
    } finally {
      setIsWorking(false);
    }
  };

  // 3. Investigate via Grafana MCP + ADK
  const handleInvestigate = async () => {
    setIsWorking(true);
    try {
      setCurrentStage('03_investigating');
      setTimecode('PGM-OUT 20:14:19');
      const res: InvestigateResponse = await agentClient.investigate('tears_of_steel', mode);
      setCaptionOffset(res.caption_offset || 2.996);
      setFailedLayer('captions');
      setMcpStatus(res.mcp_status || 'fresh');
      setEvidenceTier(res.evidence_tier || 'fresh');
      setQueryTrace(res.query_trace || []);
      setRationale(res.rationale || 'Caption cue-sync offset (+2.996s) exceeded ceiling (0.759s).');
    } catch (e) {
      console.error('Investigate error:', e);
    } finally {
      setIsWorking(false);
    }
  };

  // 4. Verify Backup via ffprobe
  const handleVerifyBackup = async () => {
    try {
      const res = await agentClient.verifyBackup('tears_of_steel', mode);
      setCurrentStage('04_backup_verified');
      setBackupHealthy(res.is_healthy);
      setTimecode('PGM-OUT 20:14:24');
    } catch (e) {
      console.error('Verify backup error:', e);
    }
  };

  // 5. Summon Operator Approval
  const handlePrepareApproval = () => {
    setCurrentStage('05_awaiting_approval');
    setTimecode('PGM-OUT 20:14:27');
  };

  // 6. Execute Human Approval
  const handleExecuteApprove = async () => {
    setIsWorking(true);
    try {
      const res = await agentClient.authorizeFailover('tears_of_steel', 'operator:demo', mode);
      setCurrentStage('06_changed_over');
      setPostSwapOffset(res.post_swap_measured_offset || 0.486);
      setTimecode('PGM-OUT 20:14:33');
      setIsPausedForHuman(false);

      if (humanApprovedResolverRef.current) {
        humanApprovedResolverRef.current();
        humanApprovedResolverRef.current = null;
      }
    } catch (e) {
      console.error('Approve failover error:', e);
    } finally {
      setIsWorking(false);
    }
  };

  // 7. Refusal 07 (Unconfirmed Backup)
  const handleRefuseUnconfirmedBackup = async () => {
    setIsWorking(true);
    try {
      setCurrentStage('07_refusal_wont_switch');
      setTimecode('PGM-OUT 20:14:38');
    } catch (e) {
      console.error('Refusal unconfirmed error:', e);
    } finally {
      setIsWorking(false);
    }
  };

  // 8. Refusal 08 (Blind Telemetry)
  const handleRefuseBlind = async () => {
    setIsWorking(true);
    try {
      await agentClient.getBlindRefusal('tears_of_steel', mode);
      setCurrentStage('08_refusal_wont_guess');
      setTimecode('PGM-OUT 20:14:42');
    } catch (e) {
      console.error('Refusal blind error:', e);
    } finally {
      setIsWorking(false);
    }
  };

  // 9–11. Contention Scenario (2 Channels vs 1 Backup)
  const handleRunContention = async () => {
    setIsWorking(true);
    const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
    try {
      logWave2Milestone('contention_fault_injected');
      setCurrentStage('09_contention_failing');
      setTimecode('PGM-OUT 20:15:10');

      logWave2Milestone('investigation_started');
      const res = await agentClient.runContention('operator:demo', mode);
      logWave2Milestone('grafana_results_received');
      logWave2Milestone('gemini_synthesis_completed');
      logWave2Milestone('policy_evaluated');
      setContentionData(res);

      // Visual staggering for Agent Spine cards (2.3s per card, slowed down by +0.5s per card)
      await delay(2300);
      await delay(2300);

      setCurrentStage('10_contention_decision');
      setTimecode('PGM-OUT 20:15:14');
      logWave2Milestone('human_gate_ready');
    } catch (e) {
      console.error('Contention scenario error:', e);
    } finally {
      setIsWorking(false);
    }
  };

  const handleAuthorizeContention = async () => {
    setIsWorking(true);
    const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
    try {
      logWave2Milestone('operator_authorized');
      setCurrentStage('11_contention_authorized');
      setTimecode('PGM-OUT 20:15:20');
      setIsPausedForHuman(false);

      if (humanApprovedResolverRef.current) {
        humanApprovedResolverRef.current();
        humanApprovedResolverRef.current = null;
      }

      logWave2Milestone('restoration_completed');

      // 2.0s restoration animation hold
      await delay(2000);
      setCurrentStage('12_terminal_partially_mitigated');
      setTimecode('PGM-OUT 20:15:25');
      logWave2Milestone('terminal_partially_mitigated');

      // Hold terminal state for at least 6 seconds
      await delay(6000);
      logWave2Milestone('closing_lockup_shown');
    } catch (e) {
      console.error('Authorize contention error:', e);
    } finally {
      setIsWorking(false);
    }
  };

  // --- PART 1 RECORDING WALKTHROUGH (Key 1) ---
  const handleRunPart1 = async () => {
    if (isPlayingWalkthrough) return;
    setIsPlayingWalkthrough(true);
    walkthroughCancelledRef.current = false;
    startWalkthroughTimer();
    const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    try {
      // 1. Reset Demo & Start Movies at 0.0s (0:00 - 0:20 Healthy Baseline)
      if (walkthroughCancelledRef.current) return;
      await handleReset();
      await delay(WALKTHROUGH_CONFIG.TIMINGS.STAGE_01_AT_REST); // 20.0s healthy baseline

      // 2. Right-side Captions Freeze at second 20 (0:20 - 0:21)
      if (walkthroughCancelledRef.current) return;
      await handleInjectFault();
      await delay(2000); // 2.0s hold after freeze so VO says "And then—the captions stop."

      // 3. Staggered Investigation & Backup Verification (0:22 - 0:30)
      if (walkthroughCancelledRef.current) return;
      await handleInvestigate();
      await delay(3500); // 3.5s hold while Gemini ADK & Grafana MCP evidence populates

      if (walkthroughCancelledRef.current) return;
      await handleVerifyBackup();
      await delay(2500); // 2.5s hold while ffprobe backup verification populates

      // 4. Human Authorization Gate Ready at ~0:30 (0:30 - 0:48)
      if (walkthroughCancelledRef.current) return;
      handlePrepareApproval();
      setIsPausedForHuman(true);
      await waitForHumanClick(); // HALTS INDEFINITELY UNTIL OPERATOR CLICKS AUTHORIZE FAILOVER (CLICK TARGET: 0:48)

      // 5. Failover Execution & Restoration Hold (0:48 - 0:55)
      if (walkthroughCancelledRef.current) return;
      await delay(WALKTHROUGH_CONFIG.TIMINGS.STAGE_06_CHANGED_OVER);

    } catch (e) {
      console.error('Part 1 Walkthrough error:', e);
    } finally {
      setIsPlayingWalkthrough(false);
      setIsPausedForHuman(false);
      stopWalkthroughTimer();
    }
  };

  // --- PART 2 RECORDING WALKTHROUGH (Key 2) ---
  const handleRunPart2 = async () => {
    if (
      currentStage === '09a_contention_baseline' ||
      currentStage === '09_contention_failing' ||
      currentStage === '10_contention_decision' ||
      currentStage === '11_contention_authorized' ||
      currentStage === '12_terminal_partially_mitigated'
    ) {
      return;
    }

    walkthroughCancelledRef.current = true;
    setIsPlayingWalkthrough(true);
    walkthroughCancelledRef.current = false;
    wave2StartTimeRef.current = performance.now();
    logWave2Milestone('wave2_started');
    startWalkthroughTimer();

    const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    try {
      // 1. T+0.0s: Enter healthy two-channel baseline
      if (walkthroughCancelledRef.current) return;
      setCurrentStage('09a_contention_baseline');
      setTimecode('PGM-OUT 20:15:00');

      // 2. T+7.5s: Automatic concurrent caption failure injection after ~7.5s healthy baseline
      await delay(7500);
      if (walkthroughCancelledRef.current) return;

      // 3. Trigger concurrent fault injection & real natural-speed investigation
      await handleRunContention();

      // 4. HALT INDEFINITELY AT HUMAN GATE UNTIL OPERATOR CLICKS AUTHORIZE PRIORITIZATION
      if (walkthroughCancelledRef.current) return;
      setIsPausedForHuman(true);
      await waitForHumanClick(); // HALTS INDEFINITELY UNTIL OPERATOR CLICKS

    } catch (e) {
      console.error('Part 2 Walkthrough error:', e);
    } finally {
      setIsPlayingWalkthrough(false);
      setIsPausedForHuman(false);
      stopWalkthroughTimer();
    }
  };

  // FULL WALKTHROUGH
  const handleRunWalkthrough = async () => {
    await handleRunPart1();
    if (!walkthroughCancelledRef.current) {
      await handleRunPart2();
    }
  };

  const handleStopWalkthrough = () => {
    walkthroughCancelledRef.current = true;
    setIsPlayingWalkthrough(false);
    setIsPausedForHuman(false);
    if (humanApprovedResolverRef.current) {
      humanApprovedResolverRef.current();
      humanApprovedResolverRef.current = null;
    }
  };

  // Determine SplitHero Video State
  let rightVideoState: VideoState = 'fine';
  if (currentStage === '01_at_rest' || currentStage === '09a_contention_baseline') rightVideoState = 'fine';
  else if (currentStage === '06_changed_over' || currentStage === '11_contention_authorized' || currentStage === '12_terminal_partially_mitigated') rightVideoState = 'restored';
  else if (currentStage === '08_refusal_wont_guess') rightVideoState = 'blind';
  else rightVideoState = 'frozen';

  // Determine Evidence Chart Status (with 2.5s delay after visual caption freeze)
  let evidenceChartStatus: 'nominal' | 'frozen' | 'restored' | 'blind' | 'unconfirmed_backup' = 'nominal';
  if (currentStage === '01_at_rest' || currentStage === '09a_contention_baseline') evidenceChartStatus = 'nominal';
  else if (currentStage === '06_changed_over' || currentStage === '11_contention_authorized' || currentStage === '12_terminal_partially_mitigated') evidenceChartStatus = 'restored';
  else if (currentStage === '08_refusal_wont_guess') evidenceChartStatus = 'blind';
  else if (currentStage === '07_refusal_wont_switch') evidenceChartStatus = 'unconfirmed_backup';
  else if (isChartFrozen) evidenceChartStatus = 'frozen';
  else evidenceChartStatus = 'nominal';

  // Contention state flags
  const isContentionStage = currentStage.startsWith('09') || currentStage.startsWith('10') || currentStage.startsWith('11') || currentStage.startsWith('12');
  const isContentionBaseline = currentStage === '09a_contention_baseline';
  const ch14RestoredInContention = currentStage === '11_contention_authorized' || currentStage === '12_terminal_partially_mitigated';
  const ch27DegradedInContention = currentStage === '11_contention_authorized' || currentStage === '12_terminal_partially_mitigated';

  // Active scenario flags for header controls
  const isScenario1Active = isPlayingWalkthrough && !isContentionStage;
  const isScenario2Active = (isPlayingWalkthrough && isContentionStage) || (isContentionStage && currentStage !== '01_at_rest');


  // --- CONSTRUCT ACCRUING TOOL CALL LOG FOR AGENT SPINE ---
  const spineSteps: SpineStep[] = [];

  if (isContentionStage) {
    if (!isContentionBaseline) {
      // PART 2: TWO-CHANNEL CONTENTION ACCRUING TOOL CALL LOG (Staggered by 1.8s)
      if (contentionStepIndex >= 1) {
        spineSteps.push({
          title: 'mcp:query_prometheus',
          sub: '2 concurrent CAP freezes · CH-14 (+2.996s) & CH-27 (+2.996s)',
          tone: contentionStepIndex === 1 ? 'active' : 'done',
          timestamp: 'T+00:00',
          toolCall: 'query_prometheus(metric="caption_sync", channels=["ch14","ch27"])',
          jsonPayload: {
            ch14_caption_drift: "+2.996s",
            ch27_caption_drift: "+2.996s",
            concurrent_faults: 2,
            liveness_plane: "nominal_ok",
          },
        });
      }

      if (contentionStepIndex >= 2) {
        spineSteps.push({
          title: 'policy_engine:evaluate_capacity',
          sub: '⚠ shared backup line · capacity 0/1 available',
          tone: contentionStepIndex === 2 ? 'fill' : 'done',
          timestamp: 'T+00:02',
          toolCall: 'evaluate_capacity(backup_count=1, failing_count=2)',
          scarcityCapacity: { available: 1, demand: 2 },
          codeSnippet: `$ changeover-policy eval --capacity\nDemand: CH-14 (Emergency) + CH-27 (General) = 2\nCapacity: 1 Shared Backup Stream\nStatus: SCARCITY_REAL (Resource Exhausted)`,
        });
      }

      if (contentionStepIndex >= 3) {
        spineSteps.push({
          title: 'policy_engine:evaluate_tiers',
          sub: 'CH-14: Emergency Tier > CH-27: General Tier',
          tone: 'done',
          timestamp: 'T+00:04',
          toolCall: 'evaluate_tiers(ch14="emergency", ch27="general")',
          policyComparison: [
            { channel: 'CH-14 (Tears of Steel)', tier: 'Emergency / Public-Info', action: 'RECOMMENDED RESTORE', isRecommended: true },
            { channel: 'CH-27 (Sintel)', tier: 'General Entertainment', action: 'FLAG UNMITIGATED', isRecommended: false },
          ],
        });
      }

      if (currentStage === '10_contention_decision' || currentStage === '11_contention_authorized' || currentStage === '12_terminal_partially_mitigated') {
        spineSteps.push({
          title: 'human_gate:request_prioritization',
          sub: currentStage === '10_contention_decision' ? 'AWAITING OPERATOR SELECTION' : 'APPROVED (operator:demo)',
          tone: currentStage === '10_contention_decision' ? 'active' : 'done',
          timestamp: 'T+00:06',
          toolCall: 'request_prioritization(policy_recommendation="CH-14")',
        });
      }

      if (currentStage === '11_contention_authorized' || currentStage === '12_terminal_partially_mitigated') {
        spineSteps.push({
          title: 'feed_switch:execute_priority_restoration',
          sub: 'CH-14 RESTORED ✓ · CH-27 DEGRADED + FLAGGED',
          tone: 'done',
          timestamp: 'T+00:08',
          toolCall: 'execute_priority_restoration(target="ch14")',
          codeSnippet: `SUCCESS: Priority restoration executed on CH-14.\nMeasured offset: +0.486s (RESTORED)\nCH-27: Untouched (0 capacity) — Flagged Degraded`,
        });

        spineSteps.push({
          title: 'audit_log:record_terminal_state',
          sub: 'Partially mitigated — 1 restored, 1 incident open',
          tone: 'done',
          timestamp: 'T+00:10',
          toolCall: 'record_state(status="partially_mitigated", incident_open=1)',
          auditReceipt: {
            status: 'PARTIALLY_MITIGATED',
            hash: '0x8f3c4e92a1b5e01f',
            authorizer: 'operator:demo',
            restoredMetric: '+0.486s (CH-14 Restored)',
          },
        });
      }
    }

  } else {
    // PART 1: SINGLE-CHANNEL A/B ACCRUING TOOL CALL LOG
    if (currentStage !== '01_at_rest') {
      spineSteps.push({
        title: 'mcp:query_prometheus',
        sub: `⚠ CAP FREEZE detected · offset +${captionOffset.toFixed(3)}s > 0.759s`,
        tone: currentStage === '02_fault_injected' ? 'active' : 'done',
        timestamp: 'T+00:00',
        toolCall: 'query_prometheus(channel="ch14", metric="caption_sync")',
        jsonPayload: {
          channel: "ch14",
          metric: "caption_sync_offset_seconds",
          value: Number(captionOffset.toFixed(3)),
          threshold: 0.759,
          alarm: true,
        },
      });
    }

    if (currentStage === '03_investigating' || currentStage === '04_backup_verified' || currentStage === '05_awaiting_approval' || currentStage === '06_changed_over') {
      spineSteps.push({
        title: 'mcp:query_prometheus',
        sub: `fresh telemetry returned · caption_sync_offset_seconds=${captionOffset.toFixed(3)}`,
        tone: 'done',
        timestamp: 'T+00:01',
        toolCall: 'query_prometheus(channel="ch14", metric="caption_sync")',
        jsonPayload: {
          status: "200 OK",
          latency_ms: 42,
          caption_sync_offset_seconds: Number(captionOffset.toFixed(3)),
          peer_liveness: 0.000,
          evidence_tier: evidenceTier || "fresh",
        },
      });

      spineSteps.push({
        title: 'adk_agent:measure_clock_drift',
        sub: `program_clock=20:14:19 · caption_sync_gap=${captionOffset.toFixed(3)}s`,
        tone: 'done',
        timestamp: 'T+00:02',
        toolCall: 'measure_clock_drift(feed="tears_of_steel")',
        codeSnippet: `$ adk-measure --feed tears_of_steel\nPGM_CLOCK: 20:14:19.482\nCAP_CLOCK: 20:14:16.486\nDRIFT_GAP: +${captionOffset.toFixed(3)}s [CRITICAL DRIFT]`,
      });

      spineSteps.push({
        title: 'adk_agent:isolate_layer',
        sub: 'CAP_FAILED · SIGN_ISOLATED (feed-liveness flat 0.000s -> peer ruled out)',
        tone: currentStage === '03_investigating' ? 'active' : 'done',
        timestamp: 'T+00:03',
        toolCall: 'isolate_layer(evidence=["cap_freeze", "sign_ok"])',
        diagnosticMatrix: [
          { layer: 'VIDEO (SIGN)', status: 'ok', detail: '1080p60 · Ruled Out' },
          { layer: 'AUDIO (PCM)', status: 'ok', detail: '-14 dBFS · Ruled Out' },
          { layer: 'CAPTIONS (VTT)', status: 'fail', detail: `Drift +${captionOffset.toFixed(3)}s · Fault Isolated` },
        ],
      });
    }

    if (currentStage === '04_backup_verified' || currentStage === '05_awaiting_approval' || currentStage === '06_changed_over') {
      spineSteps.push({
        title: 'subprocess:ffprobe',
        sub: 'backup line healthy ✔ · container timecode aligned (15ms)',
        tone: currentStage === '04_backup_verified' ? 'fill' : 'done',
        timestamp: 'T+00:06',
        toolCall: 'ffprobe(file="tears_of_steel/backup.mp4")',
        codeSnippet: `$ ffprobe -v error -show_entries stream=duration,codec_name tears_of_steel/backup.mp4\n[STREAM 0] h264 · 1080p24 · HEALTHY\n[STREAM 1] aac  · 48kHz stereo · HEALTHY\n[STREAM 2] vtt   · timecode aligned (15ms offset)`,
      });
    }

    if (currentStage === '05_awaiting_approval' || currentStage === '06_changed_over') {
      spineSteps.push({
        title: 'human_gate:request_authorization',
        sub: currentStage === '05_awaiting_approval' ? 'AWAITING OPERATOR AUTHORIZATION' : 'APPROVED (operator:demo)',
        tone: currentStage === '05_awaiting_approval' ? 'active' : 'done',
        timestamp: 'T+00:08',
        toolCall: 'request_authorization(action="failover_ch14")',
        policyComparison: [
          { channel: 'CH-14 (Tears of Steel)', tier: 'Emergency Tier', action: 'RECOMMENDED FAILOVER', isRecommended: true },
        ],
      });
    }

    if (currentStage === '06_changed_over') {
      spineSteps.push({
        title: 'feed_switch:execute_failover',
        sub: `CH-14 RESTORED ✓ · post-swap read +${postSwapOffset?.toFixed(3) || '0.486'}s`,
        tone: 'done',
        timestamp: 'T+00:10',
        toolCall: 'execute_failover(from="primary", to="backup")',
        codeSnippet: `SUCCESS: CH-14 primary -> backup feed switch executed.\nMeasured post-swap caption offset: +0.486s (VERIFIED RESTORED)`,
      });

      spineSteps.push({
        title: 'audit_log:write_state',
        sub: 'logs/state/feed_state_tears_of_steel.json',
        tone: 'done',
        timestamp: 'T+00:12',
        toolCall: 'write_state(feed="tears_of_steel", status="restored")',
        auditReceipt: {
          status: 'RESTORED',
          hash: '0x3a7b1c90d8ef',
          authorizer: 'operator:demo',
          restoredMetric: '+0.486s (Measured Post-Swap)',
        },
      });
    }

    // Refusal special cases
    if (currentStage === '07_refusal_wont_switch') {
      spineSteps.push({
        title: 'subprocess:ffprobe',
        sub: '✕ candidate backup fails sync check',
        tone: 'refuse',
        timestamp: 'T+00:06',
        toolCall: 'ffprobe(file="tears_of_steel/backup.mp4")',
      });
      spineSteps.push({
        title: 'adk_agent:refuse_action',
        sub: '✕ WILL NOT SWITCH (unconfirmed backup)',
        tone: 'refuse',
        timestamp: 'T+00:08',
        toolCall: 'refuse(reason="unconfirmed_backup")',
      });
    }

    if (currentStage === '08_refusal_wont_guess') {
      spineSteps.push({
        title: 'mcp:query_prometheus',
        sub: '✕ Grafana unreachable (CAP & SIGN empty)',
        tone: 'refuse',
        timestamp: 'T+00:04',
        toolCall: 'query_prometheus(retry=3, timeout=exceeded)',
      });
      spineSteps.push({
        title: 'adk_agent:refuse_action',
        sub: '✕ WON\'T GUESS (evidence plane unreadable)',
        tone: 'refuse',
        timestamp: 'T+00:06',
        toolCall: 'refuse(reason="unreadable_evidence")',
      });
    }
  }

  return (
    <div
      style={{
        width: '100vw',
        minHeight: '100vh',
        backgroundColor: 'var(--surface)',
        color: 'var(--ink)',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ width: '100%', flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: 'var(--surface)' }}>
        {/* Top Control Bar (Only rendered when isManualOpen = true via 'H' key) */}
        {isManualOpen && (
          <DemoControlHeader
            mode={mode}
            onSetMode={handleSetMode}
            currentStage={currentStage}
            isWorking={isWorking}
            isPlayingAutoplay={isPlayingWalkthrough}
            onRunAutoplay={handleRunWalkthrough}
            onStopAutoplay={handleStopWalkthrough}
            isDesaturated={false}
            onToggleDesaturate={() => {}}
            isManualOpen={isManualOpen}
            onToggleManualOpen={() => setIsManualOpen(!isManualOpen)}
            onReset={() => handleReset()}
            onInjectFault={handleInjectFault}
            onInvestigate={handleInvestigate}
            onVerifyBackup={handleVerifyBackup}
            onAuthorize={handleExecuteApprove}
            onContention={handleRunContention}
            onBlind={handleRefuseBlind}
            isPlayingWalkthrough={isPlayingWalkthrough && showTimer}
            walkthroughElapsedSec={walkthroughElapsedSec}
          />
        )}

        {/* Truthful Replay Provenance Banner */}
        <ReplayProvenanceBanner />

        {/* Master Control Header */}
        <header
          data-testid="master-header"
          style={{
            backgroundColor: '#16140f',
            color: '#f5f3ec',
            padding: '14px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontFamily: 'var(--font-mono)',
            borderBottom: '3.5px solid var(--ink)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <CueCardIcon size={20} color="#f5f3ec" />
            <span style={{ fontSize: '14px', fontWeight: 700, letterSpacing: '2px' }}>
              CHANGEOVER
            </span>
            <span style={{ fontSize: '11px', opacity: 0.6, letterSpacing: '1px', marginRight: '4px' }}>
              captions layer
            </span>

            {/* Visible Scenario Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '4px' }}>
              <button
                aria-label="Run caption recovery scenario"
                data-testid="scenario-caption-recovery-button"
                onClick={handleRunPart1}
                disabled={isPlayingWalkthrough || isWorking}
                style={{
                  padding: '4px 10px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '10px',
                  fontWeight: 700,
                  letterSpacing: '0.5px',
                  color: isScenario1Active ? '#ffe0b2' : (isPlayingWalkthrough || isWorking ? 'rgba(255, 255, 255, 0.35)' : '#f5f3ec'),
                  backgroundColor: isScenario1Active ? 'rgba(255, 152, 0, 0.2)' : (isPlayingWalkthrough || isWorking ? 'rgba(255, 255, 255, 0.03)' : 'rgba(255, 255, 255, 0.06)'),
                  border: isScenario1Active ? '1px solid #ff9800' : (isPlayingWalkthrough || isWorking ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid rgba(255, 255, 255, 0.25)'),
                  borderRadius: '4px',
                  cursor: (isPlayingWalkthrough || isWorking) ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  whiteSpace: 'nowrap',
                }}
                className="scenario-btn"
              >
                {isScenario1Active && <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#ff9800' }} className="animate-pulse" />}
                CAPTION RECOVERY
              </button>

              <button
                aria-label="Run capacity contention scenario"
                data-testid="scenario-capacity-contention-button"
                onClick={handleRunKey2}
                disabled={isPlayingWalkthrough || isWorking}
                style={{
                  padding: '4px 10px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '10px',
                  fontWeight: 700,
                  letterSpacing: '0.5px',
                  color: isScenario2Active ? '#ffe0b2' : (isPlayingWalkthrough || isWorking ? 'rgba(255, 255, 255, 0.35)' : '#f5f3ec'),
                  backgroundColor: isScenario2Active ? 'rgba(255, 152, 0, 0.2)' : (isPlayingWalkthrough || isWorking ? 'rgba(255, 255, 255, 0.03)' : 'rgba(255, 255, 255, 0.06)'),
                  border: isScenario2Active ? '1px solid #ff9800' : (isPlayingWalkthrough || isWorking ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid rgba(255, 255, 255, 0.25)'),
                  borderRadius: '4px',
                  cursor: (isPlayingWalkthrough || isWorking) ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  whiteSpace: 'nowrap',
                }}
                className="scenario-btn"
              >
                {isScenario2Active && <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#ff9800' }} className="animate-pulse" />}
                CAPACITY CONTENTION
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', fontSize: '11px' }}>
            {isPlayingWalkthrough && showTimer && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: '#261200',
                  border: '1px solid #ff9800',
                  padding: '4px 10px',
                  borderRadius: '4px',
                  color: '#ffe0b2',
                  fontSize: '11px',
                  fontWeight: 700,
                }}
              >
                <span style={{ color: '#ff3d00' }}>🔴 REC TIMECODE</span>
                <span style={{ color: '#ffffff' }}>
                  {String(Math.floor(walkthroughElapsedSec / 60)).padStart(2, '0')}:{String(walkthroughElapsedSec % 60).padStart(2, '0')} / 00:55
                </span>
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div className="animate-pulse" style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#d9381e' }} />
              <span style={{ fontWeight: 700, color: '#d9381e', letterSpacing: '1px' }}>ON AIR</span>
            </div>
            <span style={{ opacity: 0.8, fontWeight: 700 }}>{timecode}</span>
          </div>
        </header>

        {/* Main Grid Body — Full Screen Edge-to-Edge Expansion */}
        <main style={{ display: 'grid', gridTemplateColumns: '1fr 380px', flex: 1 }}>
          {/* Left Main Viewing & Telemetry Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0, borderRight: '3.5px solid var(--ink)' }}>
            {/* SplitHero Video Viewer */}
            <SplitHero
              currentStage={currentStage}
              rightState={rightVideoState}
              isContention={isContentionStage}
              isContentionBaseline={isContentionBaseline}
              ch14Restored={ch14RestoredInContention}
              ch27Degraded={ch27DegradedInContention}
              isPlayingWalkthrough={isPlayingWalkthrough && showTimer}
              walkthroughElapsedSec={walkthroughElapsedSec}
            />

            {/* Layer Telemetry Chart Card */}
            <EvidenceChart
              primaryOffset={captionOffset}
              postSwapOffset={postSwapOffset}
              status={evidenceChartStatus}
              backupHealthy={backupHealthy}
            />
          </div>

          {/* Right Column: Pinned Agent Spine Panel */}
          <div style={{ padding: '16px 16px 16px 0px', backgroundColor: 'var(--surface)' }}>
            <AgentSpine
              substate={currentStage}
              steps={spineSteps}
              showGate={currentStage === '05_awaiting_approval'}
              showContentionGate={currentStage === '10_contention_decision'}
              onApprove={
                currentStage === '05_awaiting_approval'
                  ? handleExecuteApprove
                  : handleAuthorizeContention
              }
              onAlternativeApprove={handleAuthorizeContention}
              onHold={handleStopWalkthrough}
              holdNote={
                currentStage === '07_refusal_wont_switch'
                  ? '✕ REFUSED: Candidate backup line unconfirmed by ffprobe. Holding active feed.'
                  : currentStage === '08_refusal_wont_guess'
                  ? '✕ REFUSED: Evidence plane unreadable (Grafana query empty). Agent won\'t guess.'
                  : undefined
              }
              isSolidHoldNote={currentStage === '08_refusal_wont_guess'}
            />
          </div>
        </main>

        {/* Persistent On-Screen Disclosures & Sponsor Footer Bar */}
        <div
          style={{
            backgroundColor: '#16140f',
            color: '#a09c94',
            padding: '8px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontFamily: 'var(--font-mono)',
            fontSize: '10.5px',
            borderTop: '2.5px solid var(--ink)',
            flexShrink: 0,
          }}
        >
          {/* Left: Dynamic Disclosure Notes */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span>CC BY 3.0 Blender Foundation · Tears of Steel & Sintel</span>
            {(currentStage === '04_backup_verified' || currentStage === '05_awaiting_approval' || currentStage === '06_changed_over') && (
              <span style={{ color: 'var(--accent)', fontWeight: 600 }}>
                · Backup: pre-cut stand-in for a scarce live caption source
              </span>
            )}
            {isContentionStage && (
              <span style={{ color: 'var(--accent)', fontWeight: 600 }}>
                · Priority tier: operator-declared before incident
              </span>
            )}
          </div>

          {/* Right: Persistent Sponsor Footer */}
          <div style={{ fontWeight: 700, color: '#f5f3ec', letterSpacing: '0.5px' }}>
            Changeover · Google Gemini + ADK · Grafana
          </div>
        </div>
      </div>
    </div>
  );
}
