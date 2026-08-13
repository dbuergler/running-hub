import React from 'react';

export const RoncalliLogo = ({ size = 34, style = {} }) => {
  return (
    <img 
      src="/logo.png" 
      alt="Roncalli High School Athletics Logo" 
      width={size} 
      height={size}
      style={{
        objectFit: 'contain',
        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))',
        ...style
      }}
      onError={(e) => {
        // Fallback display handling if logo.png hasn't been uploaded to public/ yet
        e.target.style.opacity = '0.5';
      }}
    />
  );
};

export default RoncalliLogo;
