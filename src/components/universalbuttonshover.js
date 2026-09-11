import React from 'react';
import './universalbuttonshover.css';

/**
 * FlipText: Text wrapper that applies the Framer-style rolling hover animation.
 * When hovered, the primary text glides UP and a duplicate text glides in from the bottom.
 *
 * Usage:
 *   <button className="btn-primary-blue framer-flip-btn">
 *     <FlipText>Get Started</FlipText>
 *   </button>
 */
export const FlipText = ({ children, className = '' }) => {
  return (
    <span className={`flip-text-track ${className}`}>
      <span className="flip-text-item flip-text-primary">{children}</span>
      <span className="flip-text-item flip-text-secondary" aria-hidden="true">{children}</span>
    </span>
  );
};

/**
 * UniversalButtonHover: Standalone button component with built-in Framer-style text roll hover.
 *
 * Usage:
 *   <UniversalButtonHover className="btn-primary-blue" onClick={handleClick}>
 *     Get Started
 *   </UniversalButtonHover>
 */
export const UniversalButtonHover = ({ 
  children, 
  className = '', 
  onClick, 
  style = {}, 
  type = 'button',
  ...props 
}) => {
  return (
    <button 
      type={type}
      className={`framer-flip-btn ${className}`} 
      onClick={onClick}
      style={style}
      {...props}
    >
      <FlipText>{children}</FlipText>
    </button>
  );
};

export default UniversalButtonHover;
