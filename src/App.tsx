import React, { useState, useEffect, useRef } from 'react';
import { agentClient, Mode, InvestigateResponse, ContentionResponse } from './api/agentClient';
import { AUTOPLAY_CONFIG } from './data/autoplayConfig';
import { DemoControlHeader } from './components/DemoControlHeader';
import { PgmHeader } from './components/PgmHeader';
import { SplitHero, VideoState } from './components/SplitHero';
import { EvidenceChart } from './components/EvidenceChart';
import { AgentSpine, SpineStep } from './components/AgentSpine';
import { LaneStrip } from './components/LaneStrip';
import { NarrationBar } from './components/NarrationBar';
import { TerminalBanner } from './components/TerminalBanner';

export type DemoStage =
  | '01_at_rest'
  | '02_fault_injected'
  | '03_investigating'
  | '04_backup_verified'
  | '05_awaiting_approval'
  | '06_changed_over'
  | '07_refusal_wont_switch'
  | '08_refusal_wont_guess'
  | '09_contention_failing'
  | '10_contention_decision'
  | '11_contention_authorized'
  | '12_terminal_partially_mitigated';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const App: React.FC = () => {
  const [mode, setMode] = useState<Mode>('deterministic');
  const [currentStage, setCurrentStage] = useState<DemoStage>('01_at_rest');
  const [isWorking, setIsWorking] = useState<boolean>(false);
  const [isDesaturated, setIsDesaturated] = useState<boolean>(false);
  const [isManualOpen, setIsManualOpen] = useState<boolean>(false);

  // Autoplay Orchestrator State
  const [isPlayingAutoplay, setIsPlayingAutoplay] = useState<boolean>(false);
  const [narrationText, setNarrationText] = useState<string>(AUTOPLAY_CONFIG.NARRATIONS.STAGE_01_AT_REST);
  const autoplayCancelledRef = useRef<boolean>(false);

  // Live state driven by server API responses
  const [captionOffset, setCaptionOffset] = useState<number>(0.510);
  const [postSwapOffset, setPostSwapOffset] = useState<number | undefined>(undefined);
  const [failedLayer, setFailedLayer] = useState<'captions' | 'sign_language' | 'none'>('none');
  const [mcpStatus, setMcpStatus] = useState<string>('fresh');
  const [evidenceTier, setEvidenceTier] = useState<string>('fresh');
  const [queryTrace, setQueryTrace] = useState<any[]>([]);
  const [rationale, setRationale] = useState<string>('');
  const [backupHealthy, setBackupHealthy] = useState<boolean>(true);
  const [contentionData, setContentionData] = useState<ContentionResponse | null>(null);

  // Timecode generator
  const [timecode, setTimecode] = useState<string>('PGM-OUT 20:14:02');

  // Keyboard shortcut listener ('h' or 'H' to toggle manual controls panel)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'h' || e.key === 'H') {
        setIsManualOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Load Video Manifest on startup
  useEffect(() => {
    agentClient.getManifest(mode).catch((e) => console.warn('Manifest load error:', e));
  }, [mode]);

  // Handle Mode Change
  const handleSetMode = (m: Mode) => {
    setMode(m);
    handleReset(m);
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
      setBackupHealthy(true);
      setContentionData(null);
      setTimecode('PGM-OUT 20:14:02');
      setNarrationText(AUTOPLAY_CONFIG.NARRATIONS.STAGE_01_AT_REST);
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
      setNarrationText(AUTOPLAY_CONFIG.NARRATIONS.STAGE_02_INJECT_FAULT);
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
      setNarrationText(AUTOPLAY_CONFIG.NARRATIONS.STAGE_03_INVESTIGATE);
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
      setNarrationText(AUTOPLAY_CONFIG.NARRATIONS.STAGE_04_VERIFY_BACKUP);
    } catch (e) {
      console.error('Verify backup error:', e);
    }
  };

  // 5. Summon Operator Approval
  const handlePrepareApproval = () => {
    setCurrentStage('05_awaiting_approval');
    setTimecode('PGM-OUT 20:14:27');
    setNarrationText(AUTOPLAY_CONFIG.NARRATIONS.STAGE_05_AWAITING_APPROVAL);
  };

  // 6. Execute Human Approval
  const handleExecuteApprove = async () => {
    setIsWorking(true);
    try {
      const res = await agentClient.authorizeFailover('tears_of_steel', 'operator:mark', mode);
      setCurrentStage('06_changed_over');
      setPostSwapOffset(res.post_swap_measured_offset || 0.486);
      setTimecode('PGM-OUT 20:14:33');
      setNarrationText(AUTOPLAY_CONFIG.NARRATIONS.STAGE_06_CHANGED_OVER);
    } catch (e) {
      console.error('Execute approve error:', e);
    } finally {
      setIsWorking(false);
    }
  };

  // Contention Scenario Trigger
  const handleRunContention = async () => {
    setIsWorking(true);
    try {
      setCurrentStage('09_contention_failing');
      setTimecode('PGM-OUT 20:15:02');
      setNarrationText(AUTOPLAY_CONFIG.NARRATIONS.STAGE_09_12_CONTENTION);
      const res = await agentClient.runContention('operator:mark', mode);
      setContentionData(res);

      setTimeout(() => {
        setCurrentStage('10_contention_decision');
        setTimecode('PGM-OUT 20:15:07');
        setIsWorking(false);
      }, 1000);
    } catch (e) {
      console.error('Contention error:', e);
      setIsWorking(false);
    }
  };

  // Authorize Contention Tradeoff
  const handleAuthorizeContentionTradeoff = () => {
    setCurrentStage('11_contention_authorized');
    setTimecode('PGM-OUT 20:15:14');
    setTimeout(() => {
      setCurrentStage('12_terminal_partially_mitigated');
      setTimecode('PGM-OUT 20:15:20');
      setNarrationText(AUTOPLAY_CONFIG.NARRATIONS.STAGE_12_TERMINAL);
    }, 1400);
  };

  // Blind Refusal Test
  const handleBlindRefusal = async () => {
    setIsWorking(true);
    try {
      await agentClient.getBlindRefusal('tears_of_steel', mode);
      setCurrentStage('08_refusal_wont_guess');
      setTimecode('PGM-OUT 20:14:21');
    } catch (e) {
      console.error('Blind refusal error:', e);
    } finally {
      setIsWorking(false);
    }
  };

  // AUTOPLAY ORCHESTRATOR SEQUENCE
  const handleRunAutoplay = async () => {
    autoplayCancelledRef.current = false;
    setIsPlayingAutoplay(true);

    try {
      // Step 1: At Rest (2.5s)
      if (autoplayCancelledRef.current) return;
      await handleReset();
      setNarrationText(AUTOPLAY_CONFIG.NARRATIONS.STAGE_01_AT_REST);
      await delay(AUTOPLAY_CONFIG.TIMINGS.STAGE_01_AT_REST);

      // Step 2: Inject Fault (3.5s)
      if (autoplayCancelledRef.current) return;
      await handleInjectFault();
      setNarrationText(AUTOPLAY_CONFIG.NARRATIONS.STAGE_02_INJECT_FAULT);
      await delay(AUTOPLAY_CONFIG.TIMINGS.STAGE_02_INJECT_FAULT);

      // Step 3: Investigate (4.5s)
      if (autoplayCancelledRef.current) return;
      await handleInvestigate();
      setNarrationText(AUTOPLAY_CONFIG.NARRATIONS.STAGE_03_INVESTIGATE);
      await delay(AUTOPLAY_CONFIG.TIMINGS.STAGE_03_INVESTIGATE);

      // Step 4: Verify Backup (2.5s)
      if (autoplayCancelledRef.current) return;
      await handleVerifyBackup();
      setNarrationText(AUTOPLAY_CONFIG.NARRATIONS.STAGE_04_VERIFY_BACKUP);
      await delay(AUTOPLAY_CONFIG.TIMINGS.STAGE_04_VERIFY_BACKUP);

      // Step 5: Awaiting Approval Beat
      if (autoplayCancelledRef.current) return;
      handlePrepareApproval();
      setNarrationText(AUTOPLAY_CONFIG.NARRATIONS.STAGE_05_AWAITING_APPROVAL);
      await delay(1500);

      // Step 6: Authorize & Restore (3.5s)
      if (autoplayCancelledRef.current) return;
      await handleExecuteApprove();
      setNarrationText(AUTOPLAY_CONFIG.NARRATIONS.STAGE_06_CHANGED_OVER);
      await delay(AUTOPLAY_CONFIG.TIMINGS.STAGE_05_AUTHORIZE_RESTORE);

      // Step 7: Beat of Breath (1.5s)
      if (autoplayCancelledRef.current) return;
      setNarrationText(AUTOPLAY_CONFIG.NARRATIONS.STAGE_BREATH);
      await delay(AUTOPLAY_CONFIG.TIMINGS.STAGE_BREATH);

      // Step 8: Contention Failures (2.5s)
      if (autoplayCancelledRef.current) return;
      await handleRunContention();
      setNarrationText(AUTOPLAY_CONFIG.NARRATIONS.STAGE_09_12_CONTENTION);
      await delay(2500);

      // Step 9: Authorize Contention Tradeoff
      if (autoplayCancelledRef.current) return;
      handleAuthorizeContentionTradeoff();
      await delay(2000);

      // Step 10: Terminal Hold (4.0s)
      if (autoplayCancelledRef.current) return;
      setNarrationText(AUTOPLAY_CONFIG.NARRATIONS.STAGE_12_TERMINAL);
      await delay(AUTOPLAY_CONFIG.TIMINGS.STAGE_12_TERMINAL);

    } catch (e) {
      console.error('Autoplay error:', e);
    } finally {
      setIsPlayingAutoplay(false);
    }
  };

  const handleStopAutoplay = () => {
    autoplayCancelledRef.current = true;
    setIsPlayingAutoplay(false);
  };

  // Determine SplitHero Video State
  let rightVideoState: VideoState = 'fine';
  if (currentStage === '01_at_rest') rightVideoState = 'fine';
  else if (currentStage === '06_changed_over' || currentStage === '11_contention_authorized' || currentStage === '12_terminal_partially_mitigated') rightVideoState = 'restored';
  else if (currentStage === '08_refusal_wont_guess') rightVideoState = 'blind';
  else rightVideoState = 'frozen';

  // Determine Evidence Chart Status
  let evidenceChartStatus: 'nominal' | 'frozen' | 'restored' | 'blind' | 'unconfirmed_backup' = 'frozen';
  if (currentStage === '01_at_rest') evidenceChartStatus = 'nominal';
  else if (currentStage === '06_changed_over' || currentStage === '11_contention_authorized' || currentStage === '12_terminal_partially_mitigated') evidenceChartStatus = 'restored';
  else if (currentStage === '08_refusal_wont_guess') evidenceChartStatus = 'blind';
  else if (currentStage === '07_refusal_wont_switch') evidenceChartStatus = 'unconfirmed_backup';
  else evidenceChartStatus = 'frozen';

  // Contention state flags
  const isContentionStage = currentStage.startsWith('09') || currentStage.startsWith('10') || currentStage.startsWith('11') || currentStage.startsWith('12');
  const ch14RestoredInContention = currentStage === '11_contention_authorized' || currentStage === '12_terminal_partially_mitigated';
  const ch27DegradedInContention = currentStage === '11_contention_authorized' || currentStage === '12_terminal_partially_mitigated';

  // Construct Dynamic Agent Spine Steps
  const spineSteps: SpineStep[] = [];
  if (currentStage === '01_at_rest') {
    spineSteps.push(
      { title: '◇ watching CAP · SIGN', sub: 'both layers nominal ✓', tone: 'done' },
      { title: 'idle — no anomaly', sub: 'watching program clock sync', tone: 'pending' }
    );
  } else if (currentStage === '02_fault_injected') {
    spineSteps.push(
      { title: '14:07 nominal ✓', sub: 'baseline 0.510s verified', tone: 'done' },
      { title: '⚠ CAP FREEZE detected', sub: 'CAP line breaks baseline ▲', tone: 'fill' },
      { title: 'opening investigation…', sub: 'preparing Grafana MCP query', tone: 'pending' }
    );
  } else if (currentStage === '03_investigating') {
    spineSteps.push(
      { title: 'CAP freeze detected ✓', sub: `offset +${captionOffset.toFixed(3)}s > ceiling 0.759s`, tone: 'done' },
      {
        title: '▶ querying Grafana…',
        sub: queryTrace.length > 0
          ? `${queryTrace[0]?.result_or_miss || 'MISS: empty result'} (${Math.round(queryTrace[0]?.latency_ms || 192)}ms) → RETRY success (${Math.round(queryTrace[1]?.latency_ms || 180)}ms)`
          : 'caption_sync climbing ▲',
        tone: 'active',
      },
      { title: 'SIGN flat → not program-wide', sub: 'isolated to captions', tone: 'pending' }
    );
  } else if (currentStage === '04_backup_verified') {
    spineSteps.push(
      { title: '∴ CAPTIONS failed @ switch', sub: `cue divergence +${captionOffset.toFixed(3)}s confirmed`, tone: 'done' },
      { title: 'backup ffprobe verified ✔', sub: 'candidate line healthy · 180s mp4 (15ms)', tone: 'fill' },
      { title: 'safe to offer switch', sub: 'awaiting operator authorization', tone: 'pending' }
    );
  } else if (currentStage === '05_awaiting_approval') {
    spineSteps.push(
      { title: 'backup verified ✔', sub: 'ffprobe health check passed', tone: 'done' },
      { title: 'SUMMON: operator required', sub: 'click APPROVE in side panel to authorize', tone: 'active' }
    );
  } else if (currentStage === '06_changed_over') {
    spineSteps.push(
      { title: 'approved ✔', sub: 'authorizer: operator:mark', tone: 'done' },
      { title: 'switched → re-measuring backup', sub: 'post-swap read verified', tone: 'fill' },
      { title: `✓ confirmed restored · ${postSwapOffset?.toFixed(3) || '0.486'}s`, sub: 'watching for regression', tone: 'done' },
      { title: 'audit entry logged ✎', sub: 'logs/state/feed_state_tears_of_steel.json', tone: 'done' }
    );
  } else if (currentStage === '07_refusal_wont_switch') {
    spineSteps.push(
      { title: 'CAP frozen ✓ · backup located', sub: 'broken candidate file detected', tone: 'done' },
      { title: 'backup probe → sync UNKNOWN', sub: 'candidate line fails ffprobe check', tone: 'fill' },
      { title: '✕ WILL NOT SWITCH', sub: 'unconfirmed backup — holding active feed', tone: 'refuse' }
    );
  } else if (currentStage === '08_refusal_wont_guess') {
    spineSteps.push(
      { title: 'freeze observed on-air ✓', sub: 'telemetry loss detected', tone: 'done' },
      { title: 'Grafana unreachable ✕', sub: 'CAP · SIGN — no series returned', tone: 'fill' },
      { title: '✕ WON\'T GUESS', sub: 'can\'t name a layer w/o evidence', tone: 'refuse' },
      { title: '…still reasoning', sub: 'holding for evidence plane recovery', tone: 'fill' }
    );
  } else if (currentStage === '09_contention_failing' || currentStage === '10_contention_decision') {
    spineSteps.push(
      { title: '2 concurrent CAP freezes ✓', sub: 'CH-14 (+2.996s) & CH-27 (+2.996s)', tone: 'done' },
      { title: '⚠ shared backup — capacity 0/1', sub: 'one pre-cut file, two failures', tone: 'fill' },
      { title: 'POLICY: Emergency > General', sub: 'CH-14 takes precedence over CH-27', tone: 'active' }
    );
  } else if (currentStage === '11_contention_authorized' || currentStage === '12_terminal_partially_mitigated') {
    spineSteps.push(
      { title: 'authorized ✔ · CH-14 priority', sub: 'operator:mark approved tradeoff', tone: 'done' },
      { title: 'switched → post-swap read ✓', sub: 'CH-14 CAP rejoined baseline (0.486s)', tone: 'fill' },
      { title: 'CH-27 held DEGRADED + FLAGGED', sub: 'cost kept visible · state file untouched', tone: 'done' },
      { title: '▲ 1 INCIDENT OPEN', sub: 'CH-27 still degraded (standard tier)', tone: 'refuse' }
    );
  }

  return (
    <div
      className={isDesaturated ? 'desaturated' : ''}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: '100%',
        maxWidth: '1060px',
        margin: '0 auto',
      }}
    >
      {/* Minimal Operator Demo Control Header */}
      <DemoControlHeader
        mode={mode}
        onSetMode={handleSetMode}
        currentStage={currentStage}
        isWorking={isWorking}
        isPlayingAutoplay={isPlayingAutoplay}
        onRunAutoplay={handleRunAutoplay}
        onStopAutoplay={handleStopAutoplay}
        isDesaturated={isDesaturated}
        onToggleDesaturate={() => setIsDesaturated(!isDesaturated)}
        isManualOpen={isManualOpen}
        onToggleManualOpen={() => setIsManualOpen(!isManualOpen)}
        onReset={() => handleReset()}
        onInjectFault={handleInjectFault}
        onInvestigate={handleInvestigate}
        onVerifyBackup={handleVerifyBackup}
        onAuthorize={handlePrepareApproval}
        onContention={handleRunContention}
        onBlind={handleBlindRefusal}
      />

      {/* Main Broadcast Stage Canvas */}
      <main
        style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          border: '3.5px solid var(--ink)',
          borderRadius: '14px',
          boxShadow: '0 18px 48px rgba(0, 0, 0, 0.5)',
          overflow: 'hidden',
          backgroundColor: 'var(--panel-hi)',
        }}
      >
        {/* PGM Header */}
        <PgmHeader
          timecode={timecode}
          hasRefusalBadge={currentStage === '07_refusal_wont_switch' || currentStage === '08_refusal_wont_guess'}
        />

        {/* Body Container: Grid 1fr / 290px with Continuous Solid Separator Line */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 290px',
            backgroundColor: 'var(--panel-hi)',
            borderTop: '2.5px solid var(--ink)',
          }}
        >
          {/* Left Column Stack */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {/* Split Hero */}
            <SplitHero
              rightState={rightVideoState}
              isContention={isContentionStage}
              ch14Restored={ch14RestoredInContention}
              ch27Degraded={ch27DegradedInContention}
            />

            {/* Lane Strip (Expanded on State 03 Investigation beat) */}
            <LaneStrip isExpanded={currentStage === '03_investigating'} />

            {/* Evidence Chart (Enclosed Rounded Card Box) */}
            <EvidenceChart
              primaryOffset={captionOffset}
              postSwapOffset={postSwapOffset}
              status={evidenceChartStatus}
              backupHealthy={backupHealthy}
            />
          </div>

          {/* Right Column: Agent Spine Side Rail */}
          <div style={{ padding: '16px 16px 16px 0' }}>
            <AgentSpine
              substate={currentStage.toUpperCase()}
              steps={spineSteps}
              showGate={currentStage === '05_awaiting_approval'}
              showContentionGate={currentStage === '10_contention_decision'}
              onApprove={
                currentStage === '10_contention_decision'
                  ? handleAuthorizeContentionTradeoff
                  : handleExecuteApprove
              }
              onHold={() => {
                if (currentStage === '10_contention_decision') {
                  setCurrentStage('09_contention_failing');
                } else {
                  setCurrentStage('07_refusal_wont_switch');
                }
              }}
              holdNote={
                currentStage === '08_refusal_wont_guess'
                  ? 'spine solid · will not fabricate'
                  : currentStage === '07_refusal_wont_switch'
                  ? 'backup unconfirmed · holding active feed'
                  : undefined
              }
              isSolidHoldNote={currentStage === '08_refusal_wont_guess'}
            />
          </div>
        </div>

        {/* On-Screen Subtitle Narration Bar */}
        <NarrationBar text={narrationText} isPlaying={isPlayingAutoplay} />

        {/* Terminal Banner (State 12) */}
        {currentStage === '12_terminal_partially_mitigated' && <TerminalBanner />}
      </main>
    </div>
  );
};

export default App;
