import React, { useEffect, useState } from 'react';
import { FlipText } from '../universalbuttonshover';
import './dialoguebox.css';

interface DialogueBoxProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DialogueBox: React.FC<DialogueBoxProps> = ({ isOpen, onClose }) => {
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [isClosing, setIsClosing] = useState(false);
  const isClosingRef = React.useRef(false);

  // Sync internal state whenever isOpen changes
  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      setIsClosing(false);
      isClosingRef.current = false;
    } else if (shouldRender && !isClosingRef.current) {
      setIsClosing(true);
      isClosingRef.current = true;
      const timer = setTimeout(() => {
        setShouldRender(false);
        setIsClosing(false);
        isClosingRef.current = false;
      }, 420);
      return () => clearTimeout(timer);
    }
  }, [isOpen, shouldRender]);

  const handleClose = () => {
    if (isClosingRef.current) return;
    setIsClosing(true);
    isClosingRef.current = true;

    setTimeout(() => {
      setShouldRender(false);
      setIsClosing(false);
      isClosingRef.current = false;
      onClose();
    }, 400);
  };

  useEffect(() => {
    if (!shouldRender) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldRender]);

  if (!shouldRender) return null;

  return (
    <div 
      className={`ios-dialogue-overlay ${isClosing ? 'closing' : 'opening'}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialogue-title"
    >
      <div className={`ios-dialogue-card ${isClosing ? 'closing' : 'opening'}`}>
        {/* Decorative Grid Lines matching TrueVote theme */}
        <div className="hackathon-card-line line-tl" />
        <div className="hackathon-card-line line-mr" />
        <div className="hackathon-card-line line-bl" />
        <div className="hackathon-card-line line-br" />

        {/* Circular Close Button */}
        <button 
          className="ios-close-btn" 
          onClick={handleClose} 
          aria-label="Close modal"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
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

        {/* Modal Title with Signature Website Serif Italic Accent */}
        <h3 className="ios-dialogue-title" id="dialogue-title">
          Hackathon Project <span className="serif-italic-accent" style={{ color: '#1d6bf3', fontSize: '1.08em' }}>Prototype</span>
        </h3>

        {/* Notice Description with TrueVote Brand Styling */}
        <p className="ios-dialogue-text">
          Welcome to <strong>True<span style={{ color: '#1d6bf3' }}>Vote</span></strong>! This project is an experimental <strong>MVP (Minimum Viable Product)</strong> built specifically for hackathon judging and demonstration purposes.
        </p>

        {/* Primary Action Button Matching Website Theme */}
        <button className="btn-primary-blue framer-flip-btn ios-action-btn" onClick={handleClose}>
          <FlipText>Understood, Explore TrueVote</FlipText>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <path d="M5 12h14" />
            <path d="m12 5 7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default DialogueBox;
