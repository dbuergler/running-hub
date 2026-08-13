import React from 'react';

export const RoncalliLogo = ({ size = 32 }) => (
  <svg width={size} height={size * 1.15} viewBox="0 0 100 115" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.25))' }}>
    {/* Outer Red Shadow/Border Path */}
    <path d="M15 10 H62 C82 10 92 24 92 42 C92 58 80 70 62 72 L85 108 H65 L46 72 H32 V108 H15 V10 Z" fill="#c61030" />
    {/* Inner White Body Path */}
    <path d="M20 15 H59 C75 15 85 27 85 42 C85 54 75 65 59 65 H27 V103 H20 V15 Z" fill="#ffffff" />
    {/* Inner Loop Cutout in Red */}
    <path d="M38 27 H54 C62 27 68 32 68 40 C68 48 62 52 54 52 H38 V27 Z" fill="#c61030" />
    {/* Inner White Cutout inside Loop */}
    <path d="M42 31 H52 C58 31 63 35 63 40 C63 45 58 48 52 48 H42 V31 Z" fill="#ffffff" />
    {/* Royal Blue Sword in Left Stem */}
    <path d="M26 20 H33 V95 H26 Z" fill="#003366" />
    {/* Sword Crossguard */}
    <path d="M18 36 H41 V43 H18 Z" fill="#003366" />
    {/* Diagonal Leg Accent in Crimson Red */}
    <path d="M52 65 L76 103 H60 L38 65 H52 Z" fill="#c61030" />
  </svg>
);

export default RoncalliLogo;
