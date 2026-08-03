import React, { useState, useEffect } from 'react';
import { agentClient, Mode, InvestigateResponse, ContentionResponse } from './api/agentClient';
import { DemoControlHeader } from './components/DemoControlHeader';
import { PgmHeader } from './components/PgmHeader';
import { SplitHero, VideoState } from './components/SplitHero';
import { EvidenceChart } from './components/EvidenceChart';
import { AgentSpine, SpineStep } from './components/AgentSpine';
import { LaneStrip } from './components/LaneStrip';
import { FacilityView } from './components/FacilityView';
import { DecisionCard } from './components/DecisionCard';
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

export const App: React.FC = () => {
  const [mode, setMode] = useState<Mode>('deterministic');
  const [currentStage, setCurrentStage] = useState<DemoStage>('01_at_rest');
  const [isWorking, setIsWorking] = useState<boolean>(false);
  const [isDesaturated, setIsDesaturated] = useState<boolean>(false);
  const [isControlsHidden, setIsControlsHidden] = useState<boolean>(false);

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

  // Keyboard shortcut listener ('h' or 'H' to toggle controls visibility)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'h' || e.key === 'H') {
        setIsControlsHidden((prev) => !prev);
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

  // 3. Investigate via Grafana MCP + ADK (Sequential Beat Animation)
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
    setIsWorking(true);
    try {
      const res = await agentClient.verifyBackup('tears_of_steel', mode);
      setCurrentStage('04_backup_verified');
      setBackupHealthy(res.is_healthy);
      setTimecode('PGM-OUT 20:14:24');
    } catch (e) {
      console.error('Verify backup error:', e);
    } finally {
      setIsWorking(false);
    }
  };

  // 5/6. Authorize Failover (Human-authorization moment -> post-swap verification)
  const handleAuthorizeFailover = async () => {
    setIsWorking(true);
    try {
      setCurrentStage('05_awaiting_approval');
      setTimecode('PGM-OUT 20:14:27');

      setTimeout(async () => {
        const res = await agentClient.authorizeFailover('tears_of_steel', 'operator:mark', mode);
        setCurrentStage('06_changed_over');
        setPostSwapOffset(res.post_swap_measured_offset || 0.486);
        setTimecode('PGM-OUT 20:14:33');
        setIsWorking(false);
      }, 1200);
    } catch (e) {
      console.error('Authorize failover error:', e);
      setIsWorking(false);
    }
  };

  // Contention Scenario (09 -> 10 -> 11 -> 12 Sequential Animation)
  const handleRunContention = async () => {
    setIsWorking(true);
    try {
      setCurrentStage('09_contention_failing');
      setTimecode('PGM-OUT 20:15:02');
      const res = await agentClient.runContention('operator:mark', mode);
      setContentionData(res);

      setTimeout(() => {
        setCurrentStage('10_contention_decision');
        setTimecode('PGM-OUT 20:15:07');
        setIsWorking(false);
      }, 1400);
    } catch (e) {
      console.error('Contention error:', e);
      setIsWorking(false);
    }
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
      { title: 'SUMMON: operator required', sub: 'will not switch without human authorization', tone: 'active' }
    );
  } else if (currentStage === '06_changed_over') {
    spineSteps.push(
      { title: 'approved ✔', sub: 'authorizer: operator:mark', tone: 'done' },
      { title: 'switched → re-measuring backup', sub: 'post-swap read pending…', tone: 'fill' },
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
      { title: '⚠ shared backup — capacity 1/2', sub: 'one pre-cut file, two failures', tone: 'fill' },
      { title: 'RESTORE ▸ CH-14 vs DEGRADE ▸ CH-27', sub: 'awaiting operator tradeoff decision', tone: 'active' }
    );
  } else if (currentStage === '11_contention_authorized' || currentStage === '12_terminal_partially_mitigated') {
    spineSteps.push(
      { title: 'authorized ✔ · CH-14 priority', sub: 'operator:mark approved tradeoff', tone: 'done' },
      { title: 'switched → post-swap read ✓', sub: 'CH-14 CAP rejoined baseline (0.486s)', tone: 'fill' },
      { title: 'CH-27 held DEGRADED + FLAGGED', sub: 'cost kept visible · state file untouched', tone: 'done' },
      { title: '▲ 1 INCIDENT OPEN', sub: 'CH-27 still degraded (standard tier)', tone: 'refuse' }
    );
  }

  const hasFacilityView = currentStage.startsWith('09') || currentStage.startsWith('10') || currentStage.startsWith('11') || currentStage.startsWith('12');

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
        isDesaturated={isDesaturated}
        onToggleDesaturate={() => setIsDesaturated(!isDesaturated)}
        isHidden={isControlsHidden}
        onToggleHide={() => setIsControlsHidden(!isControlsHidden)}
        onReset={() => handleReset()}
        onInjectFault={handleInjectFault}
        onInvestigate={handleInvestigate}
        onVerifyBackup={handleVerifyBackup}
        onAuthorize={handleAuthorizeFailover}
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
          marginTop: isControlsHidden ? '10px' : '0',
        }}
      >
        {/* Contention Facility View (States 09–12) */}
        {hasFacilityView && (
          <FacilityView
            capacityUsed={1}
            ch14Restored={currentStage === '11_contention_authorized' || currentStage === '12_terminal_partially_mitigated'}
            ch27Degraded={currentStage === '11_contention_authorized' || currentStage === '12_terminal_partially_mitigated'}
          />
        )}

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
            <SplitHero rightState={rightVideoState} />

            {/* Lane Strip (Expanded on State 03 Investigation beat) */}
            <LaneStrip isExpanded={currentStage === '03_investigating'} />

            {/* Evidence Chart (Enclosed Rounded Card Box) */}
            <EvidenceChart
              primaryOffset={captionOffset}
              postSwapOffset={postSwapOffset}
              status={evidenceChartStatus}
              backupHealthy={backupHealthy}
            />

            {/* Contention Decision Card (State 10) */}
            {currentStage === '10_contention_decision' && (
              <DecisionCard
                onAuthorize={() => {
                  setCurrentStage('11_contention_authorized');
                  setTimecode('PGM-OUT 20:15:14');
                  setTimeout(() => {
                    setCurrentStage('12_terminal_partially_mitigated');
                    setTimecode('PGM-OUT 20:15:20');
                  }, 1400);
                }}
                onHold={() => {
                  setCurrentStage('09_contention_failing');
                }}
              />
            )}
          </div>

          {/* Right Column: Agent Spine Side Rail */}
          <div style={{ padding: '16px 16px 16px 0' }}>
            <AgentSpine
              substate={currentStage.toUpperCase()}
              steps={spineSteps}
              showGate={currentStage === '05_awaiting_approval'}
              onApprove={handleAuthorizeFailover}
              onHold={() => setCurrentStage('07_refusal_wont_switch')}
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

        {/* Terminal Banner (State 12) */}
        {currentStage === '12_terminal_partially_mitigated' && <TerminalBanner />}
      </main>
    </div>
  );
};

export default App;
