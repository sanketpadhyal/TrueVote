import React, { useEffect, useState } from 'react';
import './dialoguebox.css';

interface DialogueBoxProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DialogueBox: React.FC<DialogueBoxProps> = ({ isOpen, onClose }) => {
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);

  const handleClose = () => {
    setIsAnimatingOut(true);
    setTimeout(() => {
      setIsAnimatingOut(false);
      onClose();
    }, 380); // matches reverse animation duration
  };

  useEffect(() => {
    if (!isOpen) return;

    // Prevent body scrolling while modal is open
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Close on Escape key press
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsAnimatingOut(true);
        setTimeout(() => {
          setIsAnimatingOut(false);
          onClose();
        }, 380);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen && !isAnimatingOut) return null;

  return (
    <div 
      className={`ios-dialogue-overlay ${isAnimatingOut ? 'closing' : ''}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialogue-title"
    >
      <div className="ios-dialogue-card">
        {/* iOS Drag Indicator Pill */}
        <div className="ios-drag-pill" />

        {/* Circular iOS Close Button */}
        <button 
          className="ios-close-btn" 
          onClick={handleClose} 
          aria-label="Close modal"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Top Hackathon Banner Image */}
        <div className="ios-dialogue-image-box">
          <img 
            src="/images/illus.webp" 
            alt="Hackathon Team Collaboration" 
            className="ios-dialogue-image" 
          />
        </div>

        {/* Modal Title */}
        <h3 className="ios-dialogue-title" id="dialogue-title">
          Hackathon Project Prototype
        </h3>

        {/* Notice Description */}
        <p className="ios-dialogue-text">
          Welcome to <strong>TrueVote</strong>! This project is an experimental <strong>MVP (Minimum Viable Product)</strong> built specifically for hackathon judging and demonstration purposes.
        </p>

        {/* Primary Action Button */}
        <button className="ios-action-btn" onClick={handleClose}>
          <span>Understood, Explore TrueVote</span>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14" />
            <path d="m12 5 7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default DialogueBox;
