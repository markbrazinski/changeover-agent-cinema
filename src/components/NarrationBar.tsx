import React from 'react';

interface NarrationBarProps {
  text: string;
  isPlaying?: boolean;
}

export const NarrationBar: React.FC<NarrationBarProps> = ({ text, isPlaying = false }) => {
  if (!text) return null;

  return (
    <div
      style={{
        width: '100%',
        backgroundColor: '#110f0c',
        color: '#f5f3ec',
        padding: '10px 16px',
        borderTop: '2.5px solid var(--ink)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.1)',
      }}
    >
      {/* Subtitle Badge Indicator */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '3px 8px',
          borderRadius: '4px',
          backgroundColor: isPlaying ? 'var(--accent)' : 'rgba(255, 255, 255, 0.12)',
          color: '#f5f3ec',
          fontFamily: 'var(--font-mono)',
          fontSize: '9px',
          fontWeight: 700,
          letterSpacing: '1px',
          whiteSpace: 'nowrap',
          flexShrink: 0,
        }}
      >
        <div
          className={isPlaying ? 'animate-pulse' : ''}
          style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#fff' }}
        />
        {isPlaying ? 'AUTOPLAY NARRATION' : 'NARRATION'}
      </div>

      {/* Narration Text Content */}
      <div
        style={{
          fontFamily: 'var(--font-grotesk)',
          fontSize: '12.5px',
          fontWeight: 500,
          color: '#f5f3ec',
          letterSpacing: '0.2px',
          lineHeight: 1.3,
        }}
      >
        "{text}"
      </div>
    </div>
  );
};
