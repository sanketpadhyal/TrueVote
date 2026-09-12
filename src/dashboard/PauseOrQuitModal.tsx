import React, { useEffect, useState } from 'react';
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

  if (!shouldRender || !event) return null;

  return (
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

        {/* Option Choices */}
        <div className="action-sheet-options">
          {/* Pause Action */}
          <button
            type="button"
            className="action-choice-btn btn-choice-pause"
            onClick={() => {
              onPause(event.id);
              handleDismiss();
            }}
          >
            <div className="choice-icon-badge badge-pause">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <rect x="6" y="4" width="4" height="16" rx="1.5" />
                <rect x="14" y="4" width="4" height="16" rx="1.5" />
              </svg>
            </div>
            <div className="choice-text-wrap">
              <strong className="choice-title">Pause Voting (Temporary)</strong>
              <span className="choice-sub">
                Temporarily disable ballots. You can reactivate anytime with one click.
              </span>
            </div>
          </button>

          {/* Quit / End Action */}
          <button
            type="button"
            className="action-choice-btn btn-choice-quit"
            onClick={() => {
              onQuit(event.id);
              handleDismiss();
            }}
          >
            <div className="choice-icon-badge badge-quit">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <rect x="9" y="9" width="6" height="6" rx="1" fill="currentColor" />
              </svg>
            </div>
            <div className="choice-text-wrap">
              <strong className="choice-title">Quit & End Event (Permanent)</strong>
              <span className="choice-sub">
                Permanently conclude polls. Tally results and lock further ballots.
              </span>
            </div>
          </button>
        </div>

        {/* Cancel Button */}
        <div className="action-sheet-footer">
          <button
            type="button"
            className="btn-cancel-sheet"
            onClick={handleDismiss}
          >
            Keep Active (Cancel)
          </button>
        </div>
      </div>
    </div>
  );
};

export default PauseOrQuitModal;
