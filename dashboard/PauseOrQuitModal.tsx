import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { EventItem } from './types';

interface PauseOrQuitModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: EventItem | null;
  onPause: (eventId: string) => void;
  onQuit: (eventId: string) => void;
}

export const PauseOrQuitModal: React.FC<PauseOrQuitModalProps> = ({
  isOpen,
  onClose,
  event,
  onPause,
  onQuit,
}) => {
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      setIsClosing(false);
    } else {
      setIsClosing(true);
      const timer = setTimeout(() => {
        setShouldRender(false);
        setIsClosing(false);
      }, 240);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleDismiss = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 220);
  };

  useEffect(() => {
    if (!shouldRender) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleDismiss();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldRender]);

  if (!shouldRender || !event || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className={`action-sheet-backdrop ${isClosing ? 'is-closing' : 'is-entering'}`}
      onClick={handleDismiss}
      role="dialog"
      aria-modal="true"
      aria-labelledby="pause-quit-title"
    >
      <div
        className={`action-sheet-card ${isClosing ? 'card-closing' : 'card-entering'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* iOS Dismiss Icon */}
        <button
          type="button"
          className="action-sheet-close-btn"
          onClick={handleDismiss}
          aria-label="Close dialog"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Icon & Title */}
        <div className="action-sheet-header">
          <div className="action-sheet-icon-wrap">
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#f59e0b"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>

          <h2 id="pause-quit-title" className="action-sheet-title">
            Manage Active Voting Event
          </h2>
          <p className="action-sheet-desc">
            <strong>"{event.name}"</strong> ({event.votingNumber}) is currently active and
            accepting anonymous ballots. What would you like to do?
          </p>
        </div>

        {/* Action Buttons Row Styled Like Screenshot 3 */}
        <div className="action-sheet-actions-row">
          {/* Pause Action Button with Cube Icon & Amber Halo */}
          <button
            type="button"
            className="btn-action-pause"
            onClick={() => {
              onPause(event.id);
              handleDismiss();
            }}
          >
            <svg
              width="17"
              height="17"
              viewBox="0 0 24 24"
              fill="currentColor"
              style={{ flexShrink: 0 }}
            >
              <path d="M19.8285 6.6117l-5.52-5.535a3.1352 3.1352 0 00-4.5 0l-5.535 5.535 7.755 3.87zm2.118 2.235l1.095 1.095a3.12 3.12 0 010 4.5L14.22 23.3502a2.6846 2.6846 0 01-.72.525V13.0767zm-19.893 0l-1.095 1.095a3.1198 3.1198 0 000 4.5L9.78 23.3502c.2091.214.4525.3914.72.525V13.0767z" />
            </svg>
            <span>Pause Voting</span>
          </button>

          {/* Quit / End Action Button with Cube Icon & Red Halo */}
          <button
            type="button"
            className="btn-action-quit"
            onClick={() => {
              onQuit(event.id);
              handleDismiss();
            }}
          >
            <svg
              width="17"
              height="17"
              viewBox="0 0 24 24"
              fill="currentColor"
              style={{ flexShrink: 0 }}
            >
              <path d="M19.8285 6.6117l-5.52-5.535a3.1352 3.1352 0 00-4.5 0l-5.535 5.535 7.755 3.87zm2.118 2.235l1.095 1.095a3.12 3.12 0 010 4.5L14.22 23.3502a2.6846 2.6846 0 01-.72.525V13.0767zm-19.893 0l-1.095 1.095a3.1198 3.1198 0 000 4.5L9.78 23.3502c.2091.214.4525.3914.72.525V13.0767z" />
            </svg>
            <span>Quit Event</span>
          </button>

          {/* Cancel Button */}
          <button
            type="button"
            className="btn-action-cancel"
            onClick={handleDismiss}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default PauseOrQuitModal;
