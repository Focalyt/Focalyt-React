import React from 'react';
import './CircularText.css';

const CircularText = ({ 
  text = "Focalyt*AI*ChatBot*", 
  spinDuration = 23, 
  className = '' 
}) => {
  const letters = Array.from(text);
  const radius = 28; // Radius for circular text (adjusted for smaller button)

  return (
    <div 
      className={`circular-text ${className}`}
      style={{ 
        '--spin-duration': `${spinDuration}s`
      }}
    >
      {letters.map((letter, i) => {
        const angle = (360 / letters.length) * i - 90; // Start from top
        const radian = (angle * Math.PI) / 180;
        const x = Math.cos(radian) * radius;
        const y = Math.sin(radian) * radius;
        
        return (
          <span 
            key={i} 
            className="circular-letter"
            style={{
              transform: `translate(calc(50% + ${x}px), calc(50% + ${y}px)) rotate(${angle + 90}deg)`,
              position: 'absolute',
            }}
          >
            {letter}
          </span>
        );
      })}
    </div>
  );
};

export default CircularText;

