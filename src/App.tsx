import React, { useState, useEffect, useRef } from 'react';
import { Mode, agentClient, InvestigateResponse, ContentionResponse } from './api/agentClient';
import { DemoControlHeader } from './components/DemoControlHeader';
import { SplitHero, VideoState } from './components/SplitHero';
import { EvidenceChart } from './components/EvidenceChart';
import { AgentSpine, SpineStep } from './components/AgentSpine';
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

  // Timecode generator
  const [timecode, setTimecode] = useState<string>('PGM-OUT 20:14:02');

  // Keyboard shortcut listener:
  // '1' = Start Part 1 (Single Channel A/B Walkthrough)
  // '2' Press 1 = Switch to 2-channel baseline view (CH-14 Tears of Steel vs CH-27 Sintel live & distinct)
  // '2' Press 2 = Trigger contention fault & policy trade-off authorization gate
  // 'h' or 'H' = Toggle manual controls header
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'h' || e.key === 'H') {
        setIsManualOpen((prev) => !prev);
      } else if (e.key === '1') {
        handleRunPart1();
      } else if (e.key === '2') {
        handleRunKey2();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mode, currentStage]);

  // Key '2' Handler: Step 1 = Move to 2-channel baseline, Step 2 = Begin contention animations
  const handleRunKey2 = () => {
    if (currentStage === '09a_contention_baseline') {
      // Second press of '2': Begin contention failure animations & policy gate
      handleRunContention();
    } else {
      // First press of '2': Move screens to 2 distinct channels (CH-14 Tears of Steel vs CH-27 Sintel) playing nominal
      setCurrentStage('09a_contention_baseline');
      setTimecode('PGM-OUT 20:15:00');
    }
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
      const res = await agentClient.authorizeFailover('tears_of_steel', 'operator:mark', mode);
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
    try {
      const res = await agentClient.runContention('operator:mark', mode);
      setContentionData(res);
      setCurrentStage('09_contention_failing');
      setTimecode('PGM-OUT 20:15:10');

      await new Promise((r) => setTimeout(r, 1500));
      setCurrentStage('10_contention_decision');
      setTimecode('PGM-OUT 20:15:14');
    } catch (e) {
      console.error('Contention scenario error:', e);
    } finally {
      setIsWorking(false);
    }
  };

  const handleAuthorizeContention = async () => {
    setIsWorking(true);
    try {
      setCurrentStage('11_contention_authorized');
      setTimecode('PGM-OUT 20:15:20');
      setIsPausedForHuman(false);

      if (humanApprovedResolverRef.current) {
        humanApprovedResolverRef.current();
        humanApprovedResolverRef.current = null;
      }

      await new Promise((r) => setTimeout(r, 2000));
      setCurrentStage('12_terminal_partially_mitigated');
      setTimecode('PGM-OUT 20:15:25');
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
    const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    try {
      // Beat 1: At Rest
      if (walkthroughCancelledRef.current) return;
      await handleReset();
      await delay(WALKTHROUGH_CONFIG.TIMINGS.STAGE_01_AT_REST);

      // Beat 2: Inject Fault
      if (walkthroughCancelledRef.current) return;
      await handleInjectFault();
      await delay(WALKTHROUGH_CONFIG.TIMINGS.STAGE_02_INJECT_FAULT);

      // Beat 3: Investigate
      if (walkthroughCancelledRef.current) return;
      await handleInvestigate();
      await delay(WALKTHROUGH_CONFIG.TIMINGS.STAGE_03_INVESTIGATE);

      // Beat 4: Verify Backup
      if (walkthroughCancelledRef.current) return;
      await handleVerifyBackup();
      await delay(WALKTHROUGH_CONFIG.TIMINGS.STAGE_04_VERIFY_BACKUP);

      // Beat 5: ⏸ STOP & WAIT FOR HUMAN CLICK (Single Channel Failover)
      if (walkthroughCancelledRef.current) return;
      handlePrepareApproval();
      setIsPausedForHuman(true);
      await waitForHumanClick(); // HALTS UNTIL OPERATOR CLICKS AUTHORIZE FAILOVER

      // Beat 6: Changed Over (Restored)
      if (walkthroughCancelledRef.current) return;
      await delay(WALKTHROUGH_CONFIG.TIMINGS.STAGE_06_CHANGED_OVER);

    } catch (e) {
      console.error('Part 1 Walkthrough error:', e);
    } finally {
      setIsPlayingWalkthrough(false);
      setIsPausedForHuman(false);
    }
  };

  // --- PART 2 RECORDING WALKTHROUGH (Key 2) ---
  const handleRunPart2 = async () => {
    if (isPlayingWalkthrough) return;
    setIsPlayingWalkthrough(true);
    walkthroughCancelledRef.current = false;
    const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    try {
      // Beat 7 & 8: Contention Failures & ⏸ STOP & WAIT FOR HUMAN CLICK
      if (walkthroughCancelledRef.current) return;
      await handleRunContention();
      await delay(1200);
      setIsPausedForHuman(true);
      await waitForHumanClick(); // HALTS UNTIL OPERATOR CLICKS AUTHORIZE PRIORITIZATION

      // Beat 9 & 10: Contention Authorized & Terminal Hold
      if (walkthroughCancelledRef.current) return;
      await delay(WALKTHROUGH_CONFIG.TIMINGS.STAGE_12_TERMINAL);

    } catch (e) {
      console.error('Part 2 Walkthrough error:', e);
    } finally {
      setIsPlayingWalkthrough(false);
      setIsPausedForHuman(false);
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

  // Determine Evidence Chart Status
  let evidenceChartStatus: 'nominal' | 'frozen' | 'restored' | 'blind' | 'unconfirmed_backup' = 'frozen';
  if (currentStage === '01_at_rest' || currentStage === '09a_contention_baseline') evidenceChartStatus = 'nominal';
  else if (currentStage === '06_changed_over' || currentStage === '11_contention_authorized' || currentStage === '12_terminal_partially_mitigated') evidenceChartStatus = 'restored';
  else if (currentStage === '08_refusal_wont_guess') evidenceChartStatus = 'blind';
  else if (currentStage === '07_refusal_wont_switch') evidenceChartStatus = 'unconfirmed_backup';
  else evidenceChartStatus = 'frozen';

  // Contention state flags
  const isContentionStage = currentStage.startsWith('09') || currentStage.startsWith('10') || currentStage.startsWith('11') || currentStage.startsWith('12');
  const isContentionBaseline = currentStage === '09a_contention_baseline';
  const ch14RestoredInContention = currentStage === '11_contention_authorized' || currentStage === '12_terminal_partially_mitigated';
  const ch27DegradedInContention = currentStage === '11_contention_authorized' || currentStage === '12_terminal_partially_mitigated';

  // --- CONSTRUCT ACCRUING TOOL CALL LOG FOR AGENT SPINE ---
  const spineSteps: SpineStep[] = [];

  if (isContentionStage) {
    if (isContentionBaseline) {
      // PART 2 STEP 1: INITIAL 2-CHANNEL FACILITY MONITORING BASELINE
      spineSteps.push({
        title: 'mcp:query_prometheus',
        sub: 'watching 2 active channels · CH-14 & CH-27 nominal',
        tone: 'active',
        timestamp: 'T+00:00',
        toolCall: 'query_prometheus(metric="caption_sync", channels=["ch14","ch27"])',
      });
    } else {
      // PART 2 STEP 2: TWO-CHANNEL CONTENTION ACCRUING TOOL CALL LOG
      spineSteps.push({
        title: 'mcp:query_prometheus',
        sub: '2 concurrent CAP freezes · CH-14 (+2.996s) & CH-27 (+2.996s)',
        tone: 'done',
        timestamp: 'T+00:00',
        toolCall: 'query_prometheus(metric="caption_sync", channels=["ch14","ch27"])',
      });

      spineSteps.push({
        title: 'policy_engine:evaluate_capacity',
        sub: '⚠ shared backup line · capacity 0/1 available',
        tone: 'fill',
        timestamp: 'T+00:02',
        toolCall: 'evaluate_capacity(backup_count=1, failing_count=2)',
      });

      spineSteps.push({
        title: 'policy_engine:evaluate_tiers',
        sub: 'CH-14: Emergency Tier > CH-27: General Tier',
        tone: 'active',
        timestamp: 'T+00:04',
        toolCall: 'evaluate_tiers(ch14="emergency", ch27="general")',
      });

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
        });

        spineSteps.push({
          title: 'audit_log:record_terminal_state',
          sub: 'Partially mitigated — 1 restored, 1 incident open',
          tone: 'done',
          timestamp: 'T+00:10',
          toolCall: 'record_state(status="partially_mitigated", incident_open=1)',
        });
      }
    }

  } else {
    // PART 1: SINGLE-CHANNEL A/B ACCRUING TOOL CALL LOG
    spineSteps.push({
      title: 'mcp:query_prometheus',
      sub: 'watching program clock sync · CAP & SIGN nominal',
      tone: currentStage === '01_at_rest' ? 'active' : 'done',
      timestamp: 'T+00:00',
      toolCall: 'query_prometheus(metric="caption_sync", channel="ch14")',
    });

    if (currentStage !== '01_at_rest') {
      spineSteps.push({
        title: 'mcp:query_prometheus',
        sub: `⚠ CAP FREEZE detected · offset +${captionOffset.toFixed(3)}s > 0.759s`,
        tone: currentStage === '02_fault_injected' ? 'active' : 'done',
        timestamp: 'T+00:02',
        toolCall: 'query_prometheus(channel="ch14", metric="caption_sync")',
      });
    }

    if (currentStage === '03_investigating' || currentStage === '04_backup_verified' || currentStage === '05_awaiting_approval' || currentStage === '06_changed_over') {
      spineSteps.push({
        title: 'mcp:query_prometheus (retry)',
        sub: 'MISS (192ms timeout) → RETRY success (180ms) · SIGN flat',
        tone: currentStage === '03_investigating' ? 'active' : 'done',
        timestamp: 'T+00:04',
        toolCall: 'query_prometheus(retry=1, timeout=1200ms)',
      });

      spineSteps.push({
        title: 'adk_agent:isolate_layer',
        sub: 'CAP_FAILED · SIGN_ISOLATED (not program-wide)',
        tone: 'done',
        timestamp: 'T+00:05',
        toolCall: 'isolate_layer(evidence=["cap_freeze", "sign_ok"])',
      });
    }

    if (currentStage === '04_backup_verified' || currentStage === '05_awaiting_approval' || currentStage === '06_changed_over') {
      spineSteps.push({
        title: 'subprocess:ffprobe',
        sub: 'backup line healthy ✔ · container timecode aligned (15ms)',
        tone: currentStage === '04_backup_verified' ? 'fill' : 'done',
        timestamp: 'T+00:06',
        toolCall: 'ffprobe(file="tears_of_steel/backup.mp4")',
      });
    }

    if (currentStage === '05_awaiting_approval' || currentStage === '06_changed_over') {
      spineSteps.push({
        title: 'human_gate:request_authorization',
        sub: currentStage === '05_awaiting_approval' ? 'AWAITING OPERATOR AUTHORIZATION' : 'APPROVED (operator:mark)',
        tone: currentStage === '05_awaiting_approval' ? 'active' : 'done',
        timestamp: 'T+00:08',
        toolCall: 'request_authorization(action="failover_ch14")',
      });
    }

    if (currentStage === '06_changed_over') {
      spineSteps.push({
        title: 'feed_switch:execute_failover',
        sub: `CH-14 RESTORED ✓ · post-swap read +${postSwapOffset?.toFixed(3) || '0.486'}s`,
        tone: 'done',
        timestamp: 'T+00:10',
        toolCall: 'execute_failover(from="primary", to="backup")',
      });

      spineSteps.push({
        title: 'audit_log:write_state',
        sub: 'logs/state/feed_state_tears_of_steel.json',
        tone: 'done',
        timestamp: 'T+00:12',
        toolCall: 'write_state(feed="tears_of_steel", status="restored")',
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
          />
        )}

        {/* Master Control Header */}
        <div
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '14px',
                height: '14px',
                borderRadius: '3px',
                backgroundColor: 'var(--accent)',
                boxShadow: '0 0 8px rgba(184, 100, 27, 0.8)',
              }}
            />
            <span style={{ fontSize: '14px', fontWeight: 700, letterSpacing: '2px' }}>
              CHANGEOVER
            </span>
            <span style={{ fontSize: '11px', opacity: 0.6, letterSpacing: '1px' }}>
              captions layer
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', fontSize: '11px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div className="animate-pulse" style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#d9381e' }} />
              <span style={{ fontWeight: 700, color: '#d9381e', letterSpacing: '1px' }}>ON AIR</span>
            </div>
            <span style={{ opacity: 0.8, fontWeight: 700 }}>{timecode}</span>
          </div>
        </div>

        {/* Main Grid Body — Full Screen Edge-to-Edge Expansion */}
        <main style={{ display: 'grid', gridTemplateColumns: '1fr 380px', flex: 1 }}>
          {/* Left Main Viewing & Telemetry Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0, borderRight: '3.5px solid var(--ink)' }}>
            {/* SplitHero Video Viewer */}
            <SplitHero
              rightState={rightVideoState}
              isContention={isContentionStage}
              isContentionBaseline={isContentionBaseline}
              ch14Restored={ch14RestoredInContention}
              ch27Degraded={ch27DegradedInContention}
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
      </div>
    </div>
  );
}
