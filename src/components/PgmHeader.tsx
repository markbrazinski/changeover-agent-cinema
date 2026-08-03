import React from 'react';

interface PgmHeaderProps {
  timecode: string;
  hasRefusalBadge?: boolean;
}

export const PgmHeader: React.FC<PgmHeaderProps> = ({
  timecode,
  hasRefusalBadge = false,
}) => {
  return (
    <header
      style={{
        width: '100%',
        maxWidth: '760px',
        height: '46px',
        padding: '12px 17px',
        background: 'linear-gradient(180deg, #1d1a14 0%, #16140f 100%)',
        color: '#f5f3ec',
        display: 'flex',
        alignItems: 'center',
        gap: '11px',
        borderRadius: '13px 13px 0 0',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
      }}
    >
      {/* Cue-Mark Logo */}
      <div
        style={{
          width: '21px',
          height: '21px',
          borderRadius: '5px',
          backgroundColor: '#16140f',
          border: '1.5px solid #f5f3ec',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: '#b8641b', // Cue dot
            position: 'absolute',
            top: '3px',
            right: '3px',
          }}
        />
      </div>

      {/* Wordmark */}
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontWeight: 700,
          fontSize: '13px',
          letterSpacing: '3px',
          textTransform: 'uppercase',
        }}
      >
        CHANGEOVER
      </span>

      {/* Layer Tag */}
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '9.5px',
          opacity: 0.6,
        }}
      >
        captions layer
      </span>

      {/* Optional Refusal Badge */}
      {hasRefusalBadge && (
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '8px',
            fontWeight: 700,
            letterSpacing: '1px',
            textTransform: 'uppercase',
            border: '1.5px solid #f5f3ec',
            padding: '2px 6px',
            borderRadius: '4px',
            color: '#f5f3ec',
          }}
        >
          REFUSAL
        </span>
      )}

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* ON AIR Tally */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <div
          className="animate-pulse"
          style={{
            width: '7px',
            height: '7px',
            borderRadius: '50%',
            backgroundColor: '#b4231c',
            boxShadow: '0 0 0 3px rgba(180, 35, 28, 0.3)',
          }}
        />
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '9px',
            fontWeight: 700,
            letterSpacing: '1px',
            color: '#f5f3ec',
          }}
        >
          ON AIR
        </span>
      </div>

      {/* Timecode */}
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '11px',
          letterSpacing: '0.5px',
          color: '#f5f3ec',
          marginLeft: '6px',
        }}
      >
        {timecode}
      </span>
    </header>
  );
};
