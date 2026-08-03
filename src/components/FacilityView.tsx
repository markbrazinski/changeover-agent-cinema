import React from 'react';

interface FacilityViewProps {
  capacityUsed?: number;
  ch14Restored?: boolean;
  ch27Degraded?: boolean;
}

export const FacilityView: React.FC<FacilityViewProps> = ({
  capacityUsed = 0,
  ch14Restored = false,
  ch27Degraded = false,
}) => {
  return (
    <div
      style={{
        width: '100%',
        maxWidth: '760px',
        backgroundColor: '#16140f',
        backgroundImage: 'linear-gradient(180deg, #1d1a14 0%, #16140f 100%)',
        color: '#f5f3ec',
        borderRadius: '13px 13px 0 0',
        border: '2.5px solid var(--ink)',
        borderBottom: 'none',
        padding: '13px 17px 15px 17px',
      }}
    >
      {/* Header Row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              fontWeight: 700,
              letterSpacing: '2px',
              textTransform: 'uppercase',
            }}
          >
            FACILITY VIEW
          </span>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '8.5px',
              opacity: 0.6,
              marginLeft: '8px',
            }}
          >
            2 channels · shared backup
          </span>
        </div>

        {/* Capacity Meter (Accent Reserved) */}
        <div
          style={{
            border: '1px solid rgba(245, 243, 236, 0.3)',
            borderRadius: '4px',
            padding: '4px 8px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontFamily: 'var(--font-mono)',
            fontSize: '8px',
          }}
        >
          <div style={{ display: 'flex', gap: '4px' }}>
            <div
              style={{
                width: '9px',
                height: '9px',
                border: '1px solid var(--accent)',
                backgroundColor: capacityUsed >= 1 ? 'var(--accent)' : 'transparent',
              }}
            />
            <div
              style={{
                width: '9px',
                height: '9px',
                border: '1px solid rgba(245, 243, 236, 0.4)',
                backgroundColor: capacityUsed >= 2 ? 'var(--accent)' : 'transparent',
              }}
            />
          </div>
          <span style={{ color: capacityUsed >= 1 ? 'var(--accent)' : '#f5f3ec' }}>
            capacity {1 - Math.min(capacityUsed, 1)} of 1 free · {capacityUsed > 0 ? '2 need it' : '0 active'}
          </span>
        </div>
      </div>

      {/* Two Channel Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '11px' }}>
        {/* CH-14 (Emergency / Public Information Tier - Operator Declared) */}
        <div
          style={{
            borderRadius: '7px',
            border: ch14Restored ? '2.5px solid var(--restored-on-dark)' : '2.5px solid #1d6e8c',
            backgroundColor: '#1c1913',
            padding: '10px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 700, letterSpacing: '1px' }}>
                CH-14
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '6.5px',
                  border: '1px solid #1d6e8c',
                  padding: '1px 4px',
                  borderRadius: '3px',
                  color: 'var(--restored-on-dark)',
                }}
              >
                operator-declared
              </span>
            </div>

            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '8px',
                fontWeight: 700,
                color: ch14Restored ? 'var(--restored-on-dark)' : 'var(--alarm)',
              }}
            >
              {ch14Restored ? '▸ RESTORED' : 'CAPTIONS FROZEN'}
            </span>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {/* Mini Still Tile */}
            <div
              className={!ch14Restored ? 'hatch-alarm' : ''}
              style={{
                width: '96px',
                height: '54px',
                borderRadius: '4px',
                border: ch14Restored ? '1.5px solid var(--restored-on-dark)' : '2px solid var(--alarm)',
                backgroundColor: '#0b0f11',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '7px',
                fontFamily: 'var(--font-mono)',
                color: '#f5f3ec',
              }}
            >
              {ch14Restored ? 'BACKUP LIVE' : 'FROZEN'}
            </div>

            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '7.5px', opacity: 0.8 }}>
                Emergency / public-info
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', fontWeight: 700, marginTop: '2px', color: ch14Restored ? 'var(--restored-on-dark)' : 'var(--alarm)' }}>
                {ch14Restored ? '+0.486s restored' : '+2.996s offset'}
              </div>
            </div>
          </div>
        </div>

        {/* CH-27 (General Entertainment Tier) */}
        <div
          style={{
            borderRadius: '7px',
            border: ch27Degraded ? '2.5px solid var(--alarm)' : '1.5px solid rgba(245, 243, 236, 0.28)',
            backgroundColor: '#1b1712',
            padding: '10px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 700, letterSpacing: '1px' }}>
              CH-27
            </span>

            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '8px',
                fontWeight: 700,
                color: 'var(--alarm)',
              }}
            >
              {ch27Degraded ? 'DEGRADED · FLAGGED' : 'CAPTIONS FROZEN'}
            </span>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {/* Mini Still Tile */}
            <div
              className="hatch-alarm"
              style={{
                width: '96px',
                height: '54px',
                borderRadius: '4px',
                border: '2px solid var(--alarm)',
                backgroundColor: '#0b0f11',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '7px',
                fontFamily: 'var(--font-mono)',
                color: '#f5f3ec',
              }}
            >
              FROZEN
            </div>

            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '7.5px', opacity: 0.8 }}>
                General entertainment
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', fontWeight: 700, marginTop: '2px', color: 'var(--alarm)' }}>
                +2.996s offset
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Demo Scope Foot Disclosure (Mandatory Honesty Labels) */}
      <div
        style={{
          marginTop: '12px',
          paddingTop: '8px',
          borderTop: '1px dashed rgba(245, 243, 236, 0.2)',
          fontFamily: 'var(--font-mono)',
          fontSize: '6.5px',
          opacity: 0.6,
          lineHeight: 1.4,
        }}
      >
        backup is a pre-cut file standing in for a scarce live caption source · SIGN = feed-liveness on a stand-in feed · AD not monitored in this build · tiers operator-declared before incident
      </div>
    </div>
  );
};
