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
  const [mode, setMode] = useState<Mode>(() => {
    if (typeof window !== 'undefined') {
      const search = window.location.search;
      if (search.includes('mode=real') || search.includes('api=real')) {
        return 'real';
      }
    }
    return 'deterministic';
  });
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
      const t1 = setTimeout(() => setContentionStepIndex(2), WALKTHROUGH_CONFIG.TIMINGS.CONTENTION_STEP_2);
      const t2 = setTimeout(() => setContentionStepIndex(3), WALKTHROUGH_CONFIG.TIMINGS.CONTENTION_STEP_3);
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

  const sequenceIdRef = useRef<number>(0);
  const sequenceStartTimeRef = useRef<number>(0);
  const activeFullDemoAuthRef = useRef<{
    onAct1Authorize?: () => void;
    onAct3Authorize?: () => void;
  } | null>(null);

  const startNewSequence = () => {
    sequenceIdRef.current += 1;
    activeFullDemoAuthRef.current = null;
    walkthroughCancelledRef.current = true;
    setIsPlayingWalkthrough(false);
    setIsPausedForHuman(false);
    stopWalkthroughTimer();
    if (humanApprovedResolverRef.current) {
      humanApprovedResolverRef.current();
      humanApprovedResolverRef.current = null;
    }
    return sequenceIdRef.current;
  };

  const delayWithSeq = (ms: number, seqId: number) => {
    return new Promise<boolean>((resolve) => {
      const timer = setTimeout(() => {
        resolve(seqId === sequenceIdRef.current);
      }, ms);
    });
  };

  const waitUntilAbsoluteSec = async (targetOffsetSec: number, seqId: number): Promise<boolean> => {
    if (seqId !== sequenceIdRef.current) return false;
    const targetMs = sequenceStartTimeRef.current + targetOffsetSec * 1000;
    const remainingMs = targetMs - performance.now();
    if (remainingMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, remainingMs));
    }
    return seqId === sequenceIdRef.current;
  };

  const isFilmingMode =
    (typeof window !== 'undefined' &&
      (window.location.search.includes('mode=film') ||
        window.location.search.includes('mode=real') ||
        window.location.search.includes('api=real'))) ||
    mode === 'real';

  // Keyboard shortcut listener:
  // 'F' = Start Full End-to-End Demo (Act I -> Act II -> Act III -> Ending -> Attribution)
  // '1' = Act I: Caption Recovery
  // '2' = Act II: Evidence Refusal
  // '3' = Act III: Capacity Contention
  // 'R' = Reset All
  // 'H' = Toggle manual controls header
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }

      const key = e.key.toUpperCase();
      if (key === 'H') {
        setIsManualOpen((prev) => !prev);
      } else if (key === 'F') {
        setShowTimer(false);
        handleRunFullDemo();
      } else if (key === '1') {
        setShowTimer(false);
        handleRunAct1();
      } else if (key === '2') {
        setShowTimer(false);
        handleRunAct2();
      } else if (key === '3') {
        setShowTimer(false);
        handleRunAct3();
      } else if (key === 'R') {
        handleResetAll();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mode, currentStage, isPlayingWalkthrough]);

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
      const res = await agentClient.authorizeFailover('tears_of_steel', 'operator:mark', mode);
      setCurrentStage('06_changed_over');
      setPostSwapOffset(res.post_swap_measured_offset || 0.486);
      setTimecode('PGM-OUT 20:14:33');
      setIsPausedForHuman(false);

      if (activeFullDemoAuthRef.current?.onAct1Authorize) {
        activeFullDemoAuthRef.current.onAct1Authorize();
      }

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
      const res = await agentClient.runContention('operator:mark', mode);
      logWave2Milestone('grafana_results_received');
      logWave2Milestone('gemini_synthesis_completed');
      logWave2Milestone('policy_evaluated');
      setContentionData(res);

      // Visual staggering for Agent Spine cards (2.3s per card, slowed down by +0.5s per card)
      await delay(WALKTHROUGH_CONFIG.TIMINGS.CONTENTION_STEP_2);
      await delay(WALKTHROUGH_CONFIG.TIMINGS.CONTENTION_STEP_2);

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

      if (activeFullDemoAuthRef.current?.onAct3Authorize) {
        activeFullDemoAuthRef.current.onAct3Authorize();
      }

      if (humanApprovedResolverRef.current) {
        humanApprovedResolverRef.current();
        humanApprovedResolverRef.current = null;
      }

      logWave2Milestone('restoration_completed');

      // 2.0s restoration animation hold
      await delay(WALKTHROUGH_CONFIG.TIMINGS.POST_FREEZE_HOLD);
      setCurrentStage('12_terminal_partially_mitigated');
      setTimecode('PGM-OUT 20:15:25');
      logWave2Milestone('terminal_partially_mitigated');

      // Hold terminal state for at least 6 seconds
      await delay(WALKTHROUGH_CONFIG.TIMINGS.TERMINAL_HOLD);
      logWave2Milestone('closing_lockup_shown');
    } catch (e) {
      console.error('Authorize contention error:', e);
    } finally {
      setIsWorking(false);
    }
  };

  // --- SEQUENCE CONTROLLER (ACT I, ACT II, ACT III, FULL DEMO, RESET) ---

  // FULL END-TO-END DEMO (F Key / FULL DEMO Button)
  const handleRunFullDemo = async () => {
    const seqId = startNewSequence();
    setIsPlayingWalkthrough(true);
    walkthroughCancelledRef.current = false;
    startWalkthroughTimer();
    sequenceStartTimeRef.current = performance.now();

    const isAct1AuthorizedRef = { current: false };
    const isAct3AuthorizedRef = { current: false };

    activeFullDemoAuthRef.current = {
      onAct1Authorize: () => {
        isAct1AuthorizedRef.current = true;
      },
      onAct3Authorize: () => {
        isAct3AuthorizedRef.current = true;
      },
    };

    try {
      // --- ACT 1: CAPTION RECOVERY (TOTAL 54 SECONDS) ---
      // 0.0s: Master Start -> Reset to nominal
      if (seqId !== sequenceIdRef.current) return;
      await handleReset();
      setCurrentStage('01_at_rest');

      // 14.0s: Step 1 -> Inject fault (caption freeze)
      if (!(await waitUntilAbsoluteSec(14.0, seqId))) return;
      await handleInjectFault();

      // 20.0s: Step 2 -> Investigation & clock drift isolation
      if (!(await waitUntilAbsoluteSec(20.0, seqId))) return;
      await handleInvestigate();

      // 26.0s: Step 3 -> Verify backup line container
      if (!(await waitUntilAbsoluteSec(26.0, seqId))) return;
      await handleVerifyBackup();

      // 32.0s: ACT 1 HUMAN GATE RENDERS (32.0s Mark)
      if (!(await waitUntilAbsoluteSec(32.0, seqId))) return;
      handlePrepareApproval();
      setIsPausedForHuman(true);

      // 54.0s: ACT 1 COMPLETE (Total 54s) -> Hard Cut 1 to Refusal baseline
      if (!(await waitUntilAbsoluteSec(54.0, seqId))) return;
      setIsPausedForHuman(false);
      if (!isAct1AuthorizedRef.current) {
        console.warn('[FILM DIAGNOSTIC] Act I authorization missed/incomplete at 54.0s');
      }
      setCurrentStage('08a_refusal_baseline');
      setTimecode('PGM-OUT 20:14:35');

      // --- ACT 2: EVIDENCE REFUSAL (TOTAL 18 SECONDS) ---
      // 58.0s: Sintel baseline runs 4 seconds -> Analysis & warning begins
      if (!(await waitUntilAbsoluteSec(58.0, seqId))) return;
      setCurrentStage('08b_refusal_warning');
      setTimecode('PGM-OUT 20:14:38');

      // 66.0s: ACT 2 POLICY HEADLINE RENDERS (12.0s Mark)
      if (!(await waitUntilAbsoluteSec(66.0, seqId))) return;
      setCurrentStage('08_refusal_stale_evidence');
      setTimecode('PGM-OUT 20:14:40');

      // 72.0s: ACT 2 COMPLETE (Total 18s) -> Hard Cut 2 to Contention baseline
      if (!(await waitUntilAbsoluteSec(72.0, seqId))) return;
      setCurrentStage('09a_contention_baseline');
      setTimecode('PGM-OUT 20:15:00');

      // --- ACT 3: CAPACITY CONTENTION (TOTAL 54 SECONDS) ---
      // 76.5s: Contention baseline films run 4.5 seconds -> Dual channel failure (videos lock up)
      if (!(await waitUntilAbsoluteSec(76.5, seqId))) return;
      await handleRunContention();

      // 106.0s: ACT 3 HUMAN GATE RENDERS (34.0s Mark)
      if (!(await waitUntilAbsoluteSec(106.0, seqId))) return;
      setIsPausedForHuman(true);

      // 126.0s: ACT 3 COMPLETE (Total 54s / Total Sequence 126s) -> Master Demo Complete
      if (!(await waitUntilAbsoluteSec(126.0, seqId))) return;
      setIsPausedForHuman(false);
      if (!isAct3AuthorizedRef.current) {
        console.warn('[FILM DIAGNOSTIC] Act III authorization missed/incomplete at 126.0s');
      }
    } catch (e) {
      console.error('Full demo error:', e);
    } finally {
      if (seqId === sequenceIdRef.current) {
        setIsPlayingWalkthrough(false);
        setIsPausedForHuman(false);
        stopWalkthroughTimer();
        activeFullDemoAuthRef.current = null;
      }
    }
  };

  // ACT I: CAPTION RECOVERY (Key 1 / CAPTION RECOVERY Button)
  const handleRunAct1 = async () => {
    const seqId = startNewSequence();
    setIsPlayingWalkthrough(true);
    walkthroughCancelledRef.current = false;
    startWalkthroughTimer();

    try {
      if (seqId !== sequenceIdRef.current) return;
      await handleReset();
      if (!(await delayWithSeq(WALKTHROUGH_CONFIG.TIMINGS.STAGE_01_AT_REST, seqId))) return;

      if (seqId !== sequenceIdRef.current) return;
      await handleInjectFault();
      if (!(await delayWithSeq(WALKTHROUGH_CONFIG.TIMINGS.POST_FREEZE_HOLD, seqId))) return;

      if (seqId !== sequenceIdRef.current) return;
      await handleInvestigate();
      if (!(await delayWithSeq(WALKTHROUGH_CONFIG.TIMINGS.INVESTIGATION_HOLD, seqId))) return;

      if (seqId !== sequenceIdRef.current) return;
      await handleVerifyBackup();
      if (!(await delayWithSeq(WALKTHROUGH_CONFIG.TIMINGS.VERIFY_BACKUP_HOLD, seqId))) return;

      if (seqId !== sequenceIdRef.current) return;
      handlePrepareApproval();
      setIsPausedForHuman(true);
      await waitForHumanClick();
      if (seqId !== sequenceIdRef.current) return;

      if (!(await delayWithSeq(WALKTHROUGH_CONFIG.TIMINGS.STAGE_06_CHANGED_OVER, seqId))) return;
    } catch (e) {
      console.error('Act I error:', e);
    } finally {
      if (seqId === sequenceIdRef.current) {
        setIsPlayingWalkthrough(false);
        setIsPausedForHuman(false);
        stopWalkthroughTimer();
      }
    }
  };

  // ACT II: EVIDENCE REFUSAL (Key 2 / EVIDENCE REFUSAL Button)
  const handleRunAct2 = async () => {
    const seqId = startNewSequence();
    setIsPlayingWalkthrough(true);
    walkthroughCancelledRef.current = false;
    startWalkthroughTimer();

    try {
      if (seqId !== sequenceIdRef.current) return;
      setCurrentStage('08a_refusal_baseline');
      setTimecode('PGM-OUT 20:14:35');
      if (!(await delayWithSeq(WALKTHROUGH_CONFIG.TIMINGS.REFUSAL_BASELINE_HOLD, seqId))) return;

      if (seqId !== sequenceIdRef.current) return;
      setCurrentStage('08b_refusal_warning');
      setTimecode('PGM-OUT 20:14:38');
      if (!(await delayWithSeq(WALKTHROUGH_CONFIG.TIMINGS.REFUSAL_WARNING_HOLD, seqId))) return;

      if (seqId !== sequenceIdRef.current) return;
      setCurrentStage('08_refusal_stale_evidence');
      setTimecode('PGM-OUT 20:14:40');
      if (!(await delayWithSeq(WALKTHROUGH_CONFIG.TIMINGS.REFUSAL_TERMINAL_HOLD, seqId))) return;
    } catch (e) {
      console.error('Act II error:', e);
    } finally {
      if (seqId === sequenceIdRef.current) {
        setIsPlayingWalkthrough(false);
        setIsPausedForHuman(false);
        stopWalkthroughTimer();
      }
    }
  };

  // ACT III: CAPACITY CONTENTION (Key 3 / CAPACITY CONTENTION Button)
  const handleRunAct3 = async () => {
    const seqId = startNewSequence();
    setIsPlayingWalkthrough(true);
    walkthroughCancelledRef.current = false;
    wave2StartTimeRef.current = performance.now();
    logWave2Milestone('wave2_started');
    startWalkthroughTimer();

    try {
      if (seqId !== sequenceIdRef.current) return;
      setCurrentStage('09a_contention_baseline');
      setTimecode('PGM-OUT 20:15:00');
      if (!(await delayWithSeq(WALKTHROUGH_CONFIG.TIMINGS.CONTENTION_BASELINE_HOLD, seqId))) return;

      if (seqId !== sequenceIdRef.current) return;
      await handleRunContention();
      if (seqId !== sequenceIdRef.current) return;

      setIsPausedForHuman(true);
      await waitForHumanClick();
      if (seqId !== sequenceIdRef.current) return;

      if (!(await delayWithSeq(WALKTHROUGH_CONFIG.TIMINGS.TERMINAL_HOLD, seqId))) return;
    } catch (e) {
      console.error('Act III error:', e);
    } finally {
      if (seqId === sequenceIdRef.current) {
        setIsPlayingWalkthrough(false);
        setIsPausedForHuman(false);
        stopWalkthroughTimer();
      }
    }
  };

  // RESET ALL (Key R)
  const handleResetAll = async () => {
    startNewSequence();
    await handleReset();
  };

  // Backward compatibility aliases
  const handleRunPart1 = handleRunAct1;
  const handleRunPart2 = handleRunAct3;
  const handleRunRefusal = handleRunAct2;
  const handleRunWalkthrough = handleRunFullDemo;
  const handleStopWalkthrough = () => {
    startNewSequence();
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
  const isScenario3Active = currentStage === '08_refusal_stale_evidence' || currentStage === '08_refusal_wont_guess';


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
          sub: currentStage === '10_contention_decision' ? 'AWAITING OPERATOR SELECTION' : 'APPROVED (operator:mark)',
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
            authorizer: 'operator:mark',
            restoredMetric: '+0.486s (CH-14 Restored)',
          },
        });

        spineSteps.push({
          title: 'grafana:record_annotation',
          sub: 'Post-decision operational record written & read-back verified',
          tone: 'done',
          timestamp: 'T+00:12',
          toolCall: 'create_annotation_mcp(run_id="closure_run_contention_1788388918", channels=["tears_of_steel","sintel"])',
          grafanaRecord: {
            runId: 'closure_run_contention_1788388918',
            annotationId: 6,
            why: '2 concurrent caption failures vs 1 shared backup stream (Scarcity Real)',
            action: 'Authorized prioritization of CH-14 (Emergency Tier)',
            followUp: 'CH-27 (Sintel) unresolved / open incident (General Tier)',
            readBackVerified: true,
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
        sub: currentStage === '05_awaiting_approval' ? 'AWAITING OPERATOR AUTHORIZATION' : 'APPROVED (operator:mark)',
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
          authorizer: 'operator:mark',
          restoredMetric: '+0.486s (Measured Post-Swap)',
        },
      });

      spineSteps.push({
        title: 'grafana:record_annotation',
        sub: 'Post-decision operational record written & read-back verified',
        tone: 'done',
        timestamp: 'T+00:14',
        toolCall: 'create_annotation_mcp(run_id="closure_run_single_1788388918", channel="tears_of_steel")',
        grafanaRecord: {
          runId: 'closure_run_single_1788388918',
          annotationId: 6,
          why: 'Caption drift (+2.996s) exceeded ceiling (+0.759s) while feed liveness remained healthy (0.000s)',
          action: 'Authorized failover to verified backup line (operator:mark)',
          readBackVerified: true,
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

    if (currentStage === '08b_refusal_warning' || currentStage === '08_refusal_stale_evidence') {
      spineSteps.push({
        title: 'mcp:query_prometheus',
        sub: '⚠ STALE CAPTION TELEMETRY · Sintel age 25.0s > threshold 15.0s',
        tone: 'refuse',
        timestamp: 'T+00:00',
        toolCall: 'query_prometheus(channel="sintel", metric="caption_sync")',
        jsonPayload: {
          channel: "sintel",
          caption_sync_offset_seconds: 2.996,
          feed_liveness_seconds: 0.0000789,
          measured_age_seconds: 25.0,
          allowed_freshness_threshold: 15.0,
        },
      });

      spineSteps.push({
        title: 'evidence_gate:evaluate',
        sub: '✕ EVIDENCE STALE (25.0s old > 15.0s limit)',
        tone: 'refuse',
        timestamp: 'T+00:02',
        toolCall: 'evaluate_evidence(mcp_status="fresh", required=["caption_sync","feed_liveness"])',
        codeSnippet: `EVIDENCE GATE EVALUATION:\nChannel: sintel\nTier: STALE (25.0s > 15.0s limit)\nTrusted: FALSE\nReason: Evidence is stale (25.0s old > threshold 15.0s)`,
      });
    }

    if (currentStage === '08_refusal_stale_evidence') {
      spineSteps.push({
        title: 'changeover:refuse_action',
        sub: '✕ RECOMMENDATION WITHHELD · NO CHANGE EXECUTED',
        tone: 'refuse',
        timestamp: 'T+00:04',
        toolCall: 'refuse_action(reason="refused_stale_evidence")',
        codeSnippet: `REFUSAL DECISION:\nExplanation: The available caption evidence is too old to justify changing a live feed.\nAction: 0 downstream calls · No failover recommended · Feed untouched`,
        policyComparison: [
          { channel: 'CH-14 (Tears of Steel)', tier: 'Emergency Tier', action: 'NO FAILOVER (STALE EVIDENCE)', isRecommended: false },
        ],
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
      {/* Hidden Media Preloader for Zero-Latency Hard Cuts */}
      <div style={{ display: 'none' }} aria-hidden="true">
        <video preload="auto" src="/media/tos_source.mp4" />
        <video preload="auto" src="/media/tos_backup.mp4" />
        <video preload="auto" src="/media/sintel_source.mp4" />
        <video preload="auto" src="/media/sintel_backup.mp4" />
      </div>

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

            {/* Scenario Controls (Visible in Judge mode, hidden in Filming mode) */}
            {!isFilmingMode && (
              <div data-testid="scenario-controls" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '4px' }}>
                <button
                  aria-label="Run full end-to-end demo"
                  data-testid="scenario-full-demo-button"
                  onClick={handleRunFullDemo}
                  disabled={isPlayingWalkthrough || isWorking}
                  style={{
                    padding: '4px 10px',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '10px',
                    fontWeight: 700,
                    letterSpacing: '0.5px',
                    color: isPlayingWalkthrough || isWorking ? 'rgba(255, 255, 255, 0.35)' : '#f5f3ec',
                    backgroundColor: isPlayingWalkthrough || isWorking ? 'rgba(255, 255, 255, 0.03)' : 'rgba(255, 255, 255, 0.06)',
                    border: isPlayingWalkthrough || isWorking ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid rgba(255, 255, 255, 0.25)',
                    borderRadius: '4px',
                    cursor: (isPlayingWalkthrough || isWorking) ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    whiteSpace: 'nowrap',
                  }}
                  className="scenario-btn"
                >
                  FULL DEMO
                </button>

                <button
                  aria-label="Run caption recovery scenario"
                  data-testid="scenario-caption-recovery-button"
                  onClick={handleRunAct1}
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
                  aria-label="Run evidence refusal scenario"
                  data-testid="scenario-evidence-refusal-button"
                  onClick={handleRunAct2}
                  disabled={isPlayingWalkthrough || isWorking}
                  style={{
                    padding: '4px 10px',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '10px',
                    fontWeight: 700,
                    letterSpacing: '0.5px',
                    color: isScenario3Active ? '#ffe0b2' : (isPlayingWalkthrough || isWorking ? 'rgba(255, 255, 255, 0.35)' : '#f5f3ec'),
                    backgroundColor: isScenario3Active ? 'rgba(255, 152, 0, 0.2)' : (isPlayingWalkthrough || isWorking ? 'rgba(255, 255, 255, 0.03)' : 'rgba(255, 255, 255, 0.06)'),
                    border: isScenario3Active ? '1px solid #ff9800' : (isPlayingWalkthrough || isWorking ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid rgba(255, 255, 255, 0.25)'),
                    borderRadius: '4px',
                    cursor: (isPlayingWalkthrough || isWorking) ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    whiteSpace: 'nowrap',
                  }}
                  className="scenario-btn"
                >
                  {isScenario3Active && <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#ff9800' }} className="animate-pulse" />}
                  EVIDENCE REFUSAL
                </button>

                <button
                  aria-label="Run capacity contention scenario"
                  data-testid="scenario-capacity-contention-button"
                  onClick={handleRunAct3}
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
            )}
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
              channelName={currentStage.startsWith('08') ? 'SINTEL' : 'TEARS OF STEEL'}
              sourceVideoUrl={currentStage.startsWith('08') ? '/media/sintel_source.mp4' : '/media/tos_source.mp4'}
              backupVideoUrl={currentStage.startsWith('08') ? '/media/sintel_backup.mp4' : '/media/tos_backup.mp4'}
              captionsVttUrl={currentStage.startsWith('08') ? '/media/captions_sintel.vtt' : '/media/captions_tos.vtt'}
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
                currentStage === '08_refusal_stale_evidence'
                  ? '✕ REFUSED: The available caption evidence is too old to justify changing a live feed.'
                  : currentStage === '07_refusal_wont_switch'
                  ? '✕ REFUSED: Candidate backup line unconfirmed by ffprobe. Holding active feed.'
                  : currentStage === '08_refusal_wont_guess'
                  ? '✕ REFUSED: Evidence plane unreadable (Grafana query empty). Agent won\'t guess.'
                  : undefined
              }
              isSolidHoldNote={currentStage === '08_refusal_stale_evidence' || currentStage === '08_refusal_wont_guess'}
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
