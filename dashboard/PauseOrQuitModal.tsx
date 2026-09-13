import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { EventItem } from './types';

interface PauseOrQuitModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: EventItem | null;
  onPause: (eventId: string) => void;
  onResume?: (eventId: string) => void;
  onDelete?: (event: EventItem) => Promise<void> | void;
  onQuit?: (eventId: string) => void;
}

export const PauseOrQuitModal: React.FC<PauseOrQuitModalProps> = ({
  isOpen,
  onClose,
  event,
  onPause,
  onResume,
  onDelete,
  onQuit,
}) => {
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [isClosing, setIsClosing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const handleDeleteClick = async () => {
    if (!event) return;
    setIsDeleting(true);
    try {
      if (onDelete) {
        await onDelete(event);
      } else if (onQuit) {
        onQuit(event.id);
      }
    } catch (err) {
      console.error('Error deleting event:', err);
    } finally {
      setIsDeleting(false);
      handleDismiss();
    }
  };

  if (!shouldRender || !event || typeof document === 'undefined') return null;

  const isActive = event.isActivated;

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
              stroke={isActive ? '#f59e0b' : '#10b981'}
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
            {isActive ? 'Manage Active Voting Event' : 'Manage Voting Event'}
          </h2>
          <p className="action-sheet-desc">
            <strong>"{event.name}"</strong> ({event.votingNumber}) is currently{' '}
            {isActive ? 'active and accepting anonymous ballots' : 'paused or inactive'}. What would you like to do?
          </p>
        </div>

        {/* Action Buttons Row Styled Like Screenshot 3 */}
        <div className="action-sheet-actions-row">
          {/* Pause or Resume Action Button */}
          {isActive ? (
            <button
              type="button"
              className="btn-action-pause"
              onClick={() => {
                onPause(event.id);
                handleDismiss();
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="currentColor"
                style={{ flexShrink: 0 }}
              >
                <rect x="5.5" y="4" width="4" height="16" rx="1.5" />
                <rect x="14.5" y="4" width="4" height="16" rx="1.5" />
              </svg>
              <span>Pause Voting</span>
            </button>
          ) : (
            <button
              type="button"
              className="btn-action-resume"
              onClick={() => {
                if (onResume) {
                  onResume(event.id);
                } else {
                  onPause(event.id);
                }
                handleDismiss();
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="currentColor"
                style={{ flexShrink: 0 }}
              >
                <path d="M6 4.5c0-.85.94-1.37 1.66-.92l11.5 7.5c.7.45.7 1.49 0 1.94l-11.5 7.5c-.72.45-1.66-.07-1.66-.92V4.5z" />
              </svg>
              <span>Activate Voting</span>
            </button>
          )}

          {/* Delete This Vote Action Button */}
          <button
            type="button"
            className="btn-action-quit btn-action-delete"
            onClick={handleDeleteClick}
            disabled={isDeleting}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ flexShrink: 0 }}
            >
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              <line x1="10" y1="11" x2="10" y2="17" />
              <line x1="14" y1="11" x2="14" y2="17" />
            </svg>
            <span>{isDeleting ? 'Deleting...' : 'Delete This Vote'}</span>
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
