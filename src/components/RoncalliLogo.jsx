import React from 'react';

export const RoncalliLogo = ({ size = 42, style = {} }) => {
  return (
    <div
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '50%',
        overflow: 'hidden',
        background: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '2.5px solid var(--red)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
        flexShrink: 0,
        transition: 'transform 0.2s ease',
        ...style
      }}
    >
      <img 
        src="/logo.png" 
        alt="Roncalli Royals Logo" 
        style={{
          width: '88%',
          height: '88%',
          objectFit: 'contain'
        }}
        onError={(e) => {
          // Fallback if logo.png is not loaded yet
          e.target.style.display = 'none';
        }}
      />
    </div>
  );
};

export default RoncalliLogo;
