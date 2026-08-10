import React from 'react';

interface CueMarkIconProps {
  size?: number;
  color?: string;
  variant?: 'paper' | 'dark';
  style?: React.CSSProperties;
}

export const CueMarkIcon: React.FC<CueMarkIconProps> = ({
  size = 20,
  color,
  variant = 'paper',
  style,
}) => {
  const isDark = variant === 'dark';
  const strokeColor = color || (isDark ? '#f5f3ec' : '#16140f');
  const dashColor = isDark ? '#a8a29e' : '#16140f';
  const dotColor = color || (isDark ? '#f5f3ec' : '#16140f');

  if (isDark) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
      >
        {/* Filled Dark Container with rounded corners */}
        <rect x="6" y="6" width="88" height="88" rx="22" fill="#16140f" />
        <rect x="6" y="6" width="88" height="88" rx="22" stroke="#f5f3ec" strokeWidth="6" />
        {/* Left Vertical 3 Dashes */}
        <rect x="20" y="24" width="7" height="14" rx="3.5" fill="#a8a29e" />
        <rect x="20" y="43" width="7" height="14" rx="3.5" fill="#a8a29e" />
        <rect x="20" y="62" width="7" height="14" rx="3.5" fill="#a8a29e" />
        {/* Top-Right Cue Mark Dot */}
        <circle cx="68" cy="32" r="14" fill="#f5f3ec" />
      </svg>
    );
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
    >
      {/* Outer Stroked Box */}
      <rect x="10" y="10" width="80" height="80" rx="22" stroke={strokeColor} strokeWidth="8" fill="none" />
      {/* Left Vertical 3 Dashes */}
      <rect x="22" y="26" width="6" height="13" rx="3" fill={dashColor} opacity="0.55" />
      <rect x="22" y="44" width="6" height="13" rx="3" fill={dashColor} opacity="0.55" />
      <rect x="22" y="62" width="6" height="13" rx="3" fill={dashColor} opacity="0.55" />
      {/* Top-Right Cue Mark Dot */}
      <circle cx="66" cy="34" r="13" fill={dotColor} />
    </svg>
  );
};

export const CueCardIcon = CueMarkIcon;
