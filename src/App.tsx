import React, { useState, useEffect } from 'react';
import { LeftNav } from './components/LeftNav';
import { PgmHeader } from './components/PgmHeader';
import { SplitHero, VideoState } from './components/SplitHero';
import { EvidenceChart } from './components/EvidenceChart';
import { AgentSpine } from './components/AgentSpine';
import { LaneStrip } from './components/LaneStrip';
import { FacilityView } from './components/FacilityView';
import { DecisionCard } from './components/DecisionCard';
import { TerminalBanner } from './components/TerminalBanner';
import { SCREEN_STATES } from './data/traceModule';

export const App: React.FC = () => {
  const [activeStateId, setActiveStateId] = useState<string>('01');
  const [isDesaturated, setIsDesaturated] = useState<boolean>(false);

  const stateDef = SCREEN_STATES[activeStateId] || SCREEN_STATES['01'];

  // Keyboard Navigation (Left / Right Arrow Keys)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        const num = parseInt(activeStateId, 10);
        if (num < 12) {
          const nextId = (num + 1).toString().padStart(2, '0');
          setActiveStateId(nextId);
        }
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        const num = parseInt(activeStateId, 10);
        if (num > 0) {
          const prevId = (num - 1).toString().padStart(2, '0');
          setActiveStateId(prevId);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeStateId]);

  // Determine Video State for Split Hero
  let rightVideoState: VideoState = 'fine';
  if (stateDef.id === '00' || stateDef.id === '01') {
    rightVideoState = 'fine';
  } else if (stateDef.id === '06' || stateDef.id === '11' || stateDef.id === '12') {
    rightVideoState = 'restored';
  } else if (stateDef.id === '08') {
    rightVideoState = 'blind';
  } else {
    rightVideoState = 'frozen';
  }

  // Determine Evidence Status
  let evidenceChartStatus: 'nominal' | 'frozen' | 'restored' | 'blind' | 'unconfirmed_backup' = 'frozen';
  if (stateDef.id === '00' || stateDef.id === '01') {
    evidenceChartStatus = 'nominal';
  } else if (stateDef.id === '06' || stateDef.id === '11' || stateDef.id === '12') {
    evidenceChartStatus = 'restored';
  } else if (stateDef.id === '08') {
    evidenceChartStatus = 'blind';
  } else if (stateDef.id === '07') {
    evidenceChartStatus = 'unconfirmed_backup';
  } else {
    evidenceChartStatus = 'frozen';
  }

  return (
    <div
      className={isDesaturated ? 'desaturated' : ''}
      style={{
        display: 'flex',
        gap: '24px',
        width: '100%',
        maxWidth: '1080px',
        alignItems: 'flex-start',
      }}
    >
      {/* Left Navigation Shell */}
      <LeftNav
        activeStateId={activeStateId}
        onSelectState={setActiveStateId}
        isDesaturated={isDesaturated}
        onToggleDesaturate={() => setIsDesaturated(!isDesaturated)}
      />

      {/* Main Broadcast Stage Canvas (760px Fixed Frame) */}
      <main
        style={{
          width: '760px',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 12px 32px rgba(0, 0, 0, 0.4)',
          borderRadius: '13px',
          overflow: 'hidden',
          backgroundColor: 'var(--panel-mute)',
        }}
      >
        {/* Contention Facility View (States 09–12) */}
        {stateDef.hasFacilityView && (
          <FacilityView
            capacityUsed={stateDef.id === '09' || stateDef.id === '10' ? 1 : 1}
            ch14Restored={stateDef.id === '11' || stateDef.id === '12'}
            ch27Degraded={stateDef.id === '11' || stateDef.id === '12'}
          />
        )}

        {/* PGM Header */}
        <PgmHeader
          timecode={stateDef.timecode}
          hasRefusalBadge={stateDef.refusalType !== undefined && stateDef.refusalType !== 'none'}
        />

        {/* Body Container: Grid 1fr / 238px */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 238px',
            backgroundColor: 'var(--panel-hi)',
            borderLeft: '2.5px solid var(--ink)',
            borderRight: '2.5px solid var(--ink)',
            borderBottom: stateDef.id === '12' ? 'none' : '2.5px solid var(--ink)',
          }}
        >
          {/* Left Column Stack */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {/* Split Hero */}
            <SplitHero rightState={rightVideoState} />

            {/* Lane Strip (Expanded on State 03 Investigation beat) */}
            <LaneStrip isExpanded={stateDef.id === '03'} />

            {/* Evidence Chart (Two-line CAP + SIGN + AD static row) */}
            <EvidenceChart
              primaryOffset={stateDef.primaryOffset}
              postSwapOffset={stateDef.postSwapOffset}
              status={evidenceChartStatus}
              backupHealthy={stateDef.id !== '07'}
            />

            {/* Contention Decision Card (State 10) */}
            {stateDef.id === '10' && (
              <DecisionCard
                onAuthorize={() => setActiveStateId('11')}
                onHold={() => setActiveStateId('09')}
              />
            )}
          </div>

          {/* Right Column: Agent Spine */}
          <div style={{ padding: '15px 14px 15px 0' }}>
            <AgentSpine
              substate={stateDef.substate}
              steps={stateDef.spineSteps}
              showGate={stateDef.id === '05'}
              onApprove={() => setActiveStateId('06')}
              onHold={() => setActiveStateId('07')}
              holdNote={
                stateDef.id === '08'
                  ? 'spine solid · will not fabricate'
                  : stateDef.id === '07'
                  ? 'backup unconfirmed · holding active feed'
                  : undefined
              }
              isSolidHoldNote={stateDef.id === '08'}
            />
          </div>
        </div>

        {/* Terminal Banner (State 12) */}
        {stateDef.id === '12' && <TerminalBanner />}
      </main>
    </div>
  );
};

export default App;
