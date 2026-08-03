import React from 'react';

interface FacilityViewProps {
  capacityUsed?: number;
  ch14Restored?: boolean;
  ch27Degraded?: boolean;
}

export const FacilityView: React.FC<FacilityViewProps> = ({
  capacityUsed = 1,
  ch14Restored = false,
  ch27Degraded = false,
}) => {
  return (
    <div
      style={{
        backgroundColor: '#110f0c',
        color: '#f5f3ec',
        padding: '16px 20px',
        borderBottom: '2.5px solid var(--ink)',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
      }}
    >
      {/* Facility View Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              padding: '3px 8px',
              backgroundColor: 'var(--alarm)',
              color: '#f5f3ec',
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              fontWeight: 700,
              borderRadius: '3px',
              letterSpacing: '1px',
            }}
          >
            FACILITY VIEW · CONTENTION SCENARIO
          </div>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', opacity: 0.7 }}>
            M=1 SHARED BACKUP POOL vs N=2 CONCURRENT FAILURES
          </span>
        </div>

        {/* Capacity Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
            padding: '4px 10px',
            borderRadius: '4px',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
          }}
        >
          <span style={{ color: 'var(--accent)', fontWeight: 700 }}>SHARED POOL CAPACITY:</span>
          <span>{ch14Restored ? '1 of 1 allocated (0 free)' : '0 of 1 free (scarcity real)'}</span>
        </div>
      </div>

      {/* Two Full-Size Channel Cards (CH-14 vs CH-27) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
        {/* CH-14 TEARS OF STEEL (Emergency / Public-Information Tier) */}
        <div
          style={{
            backgroundColor: '#1c1a15',
            border: ch14Restored ? '2.5px solid var(--restored-on-dark)' : '2.5px solid var(--alarm)',
            borderRadius: '8px',
            padding: '12px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 700, color: '#f5f3ec' }}>
              CH-14 · TEARS OF STEEL
            </div>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '8.5px',
                padding: '2px 6px',
                borderRadius: '3px',
                backgroundColor: 'rgba(184, 100, 27, 0.25)',
                border: '1px solid var(--accent)',
                color: '#f5f3ec',
              }}
            >
              Emergency / public-information tier (operator-declared policy)
            </div>
          </div>

          {/* Video Player */}
          <div style={{ height: '110px', borderRadius: '4px', overflow: 'hidden', position: 'relative', border: '1px solid rgba(255,255,255,0.2)' }}>
            <video
              src={ch14Restored ? 'http://localhost:8008/films/tears_of_steel/backup.mp4' : 'http://localhost:8008/films/tears_of_steel/source.mp4'}
              autoPlay
              muted
              loop
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                backgroundColor: ch14Restored ? 'rgba(29, 110, 140, 0.92)' : 'rgba(180, 35, 28, 0.92)',
                color: '#f5f3ec',
                padding: '4px 8px',
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                fontWeight: 700,
                textAlign: 'center',
              }}
            >
              {ch14Restored ? '✓ CAPTIONS RESTORED VIA BACKUP (+0.486s)' : '⚠ CAPTIONS FROZEN (+2.996s)'}
            </div>
          </div>

          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '9.5px',
              color: ch14Restored ? 'var(--restored-on-dark)' : 'var(--alarm)',
              fontWeight: 700,
            }}
          >
            {ch14Restored ? '✓ RESTORED — Backup stream allocated & verified' : '▲ ALARM — Caption freeze divergence +2.996s'}
          </div>
        </div>

        {/* CH-27 SINTEL (General Entertainment Tier) */}
        <div
          style={{
            backgroundColor: '#1c1a15',
            border: ch27Degraded ? '2.5px solid var(--alarm)' : '2.5px solid var(--alarm)',
            borderRadius: '8px',
            padding: '12px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 700, color: '#f5f3ec' }}>
              CH-27 · SINTEL
            </div>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '8.5px',
                padding: '2px 6px',
                borderRadius: '3px',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: 'rgba(255, 255, 255, 0.7)',
              }}
            >
              General entertainment tier
            </div>
          </div>

          {/* Video Player */}
          <div style={{ height: '110px', borderRadius: '4px', overflow: 'hidden', position: 'relative', border: '1px solid rgba(255,255,255,0.2)' }}>
            <video
              src="http://localhost:8008/films/sintel/source.mp4"
              autoPlay
              muted
              loop
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                backgroundColor: 'rgba(180, 35, 28, 0.92)',
                color: '#f5f3ec',
                padding: '4px 8px',
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                fontWeight: 700,
                textAlign: 'center',
              }}
            >
              ⚠ CAPTIONS FROZEN (+2.996s)
            </div>
          </div>

          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '9.5px',
              color: 'var(--alarm)',
              fontWeight: 700,
            }}
          >
            {ch27Degraded ? '▲ HELD DEGRADED + FLAGGED — Backup capacity exhausted by priority channel' : '▲ ALARM — Caption freeze divergence +2.996s'}
          </div>
        </div>
      </div>

      {/* Foot Disclosure */}
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '8.5px', color: 'rgba(255,255,255,0.4)', textAlign: 'right' }}>
        Priority rules pre-declared by operator policy before incident · Agent cannot alter criticality tiers
      </div>
    </div>
  );
};
