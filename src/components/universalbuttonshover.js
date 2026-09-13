import React from 'react';
import './universalbuttonshover.css';

export const FlipText = ({ children, className = '' }) => {
  return (
    <span className={`flip-text-track ${className}`}>
      <span className="flip-text-item flip-text-primary">{children}</span>
      <span className="flip-text-item flip-text-secondary" aria-hidden="true">{children}</span>
    </span>
  );
};

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

