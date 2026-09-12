import React, { useState, useEffect } from 'react';
import { EventItem } from './types';

interface RealtimeAnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string | null;
}

export const RealtimeAnalyticsModal: React.FC<RealtimeAnalyticsModalProps> = ({
  isOpen,
  onClose,
  eventId,
}) => {
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [isClosing, setIsClosing] = useState(false);
  const [event, setEvent] = useState<EventItem | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Load and subscribe to real-time event updates
  useEffect(() => {
    if (!isOpen || !eventId) return;

    const loadEvent = () => {
      try {
        const storedStr = localStorage.getItem('truevote_events');
        if (storedStr) {
          const events: EventItem[] = JSON.parse(storedStr);
          if (Array.isArray(events)) {
            const matched = events.find(
              (e) => e.id === eventId || e.votingNumber === eventId
            );
            if (matched) {
              setEvent(matched);
            }
          }
        }
      } catch (err) {
        console.error('Error reading event for analytics:', err);
      }
    };

    loadEvent();

    // Listen for live vote updates
    window.addEventListener('truevote_events_updated', loadEvent);
    window.addEventListener('storage', loadEvent);
    const interval = setInterval(loadEvent, 1500);

    return () => {
      window.removeEventListener('truevote_events_updated', loadEvent);
      window.removeEventListener('storage', loadEvent);
      clearInterval(interval);
    };
  }, [isOpen, eventId]);

  // Handle open/close animations
  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      setIsClosing(false);
    } else {
      setIsClosing(true);
      const timer = setTimeout(() => {
        setShouldRender(false);
        setIsClosing(false);
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleDismiss = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 240);
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

  const handleCopyLink = () => {
    if (!event) return;
    const link =
      event.shareableLink || `${window.location.origin}/voting/${event.id}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(link).then(() => {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
      });
    }
  };

  if (!shouldRender || !event) return null;

  // Calculate live statistics
  const totalVotesCast =
    event.options.reduce((sum, opt) => sum + (opt.votesCount || 0), 0) ||
    event.totalVotesCast ||
    0;

  // Sort options by vote count descending for rankings
  const sortedOptions = [...event.options].sort(
    (a, b) => (b.votesCount || 0) - (a.votesCount || 0)
  );

  const leadingOption =
    sortedOptions.length > 0 && (sortedOptions[0].votesCount || 0) > 0
      ? sortedOptions[0]
      : null;

  const maxAllowedVotes =
    event.totalAllowedVotes === 'unlimited' ? '∞ Unlimited' : event.totalAllowedVotes;

  const isEventActive =
    event.activationType === 'manual'
      ? event.isActivated === true
      : event.isActivated !== false;

  return (
    <div
      className={`analytics-modal-backdrop ${isClosing ? 'is-closing' : 'is-entering'}`}
      onClick={handleDismiss}
      role="dialog"
      aria-modal="true"
      aria-labelledby="analytics-modal-title"
    >
      <div
        className={`analytics-modal-card ${isClosing ? 'card-closing' : 'card-entering'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* iOS Header */}
        <div className="analytics-modal-header">
          <div className="analytics-live-tag">
            <span className="pulsing-live-dot"></span>
            <span>Real-time Live Analytics</span>
          </div>

          <button
            type="button"
            className="analytics-close-btn"
            onClick={handleDismiss}
            aria-label="Close analytics modal"
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
        </div>

        {/* Event Title & Metadata Bar */}
        <div className="analytics-event-heading">
          <div className="analytics-badge-row">
            <span className="analytics-voting-code">{event.votingNumber}</span>
            <span
              className={`analytics-status-pill ${
                isEventActive ? 'pill-active' : 'pill-inactive'
              }`}
            >
              {isEventActive ? '● Active (Polls Open)' : '○ Inactive (Polls Closed)'}
            </span>
            <span className="analytics-type-pill">
              {event.activationType === 'manual' ? 'Manual Activation' : 'Scheduled (IST)'}
            </span>
          </div>
          <h2 id="analytics-modal-title" className="analytics-event-name">
            {event.name}
          </h2>
          {event.bio && <p className="analytics-event-bio">{event.bio}</p>}
        </div>

        {/* KPI Summary Cards */}
        <div className="analytics-kpi-grid">
          <div className="analytics-kpi-card">
            <span className="kpi-label">Total Ballots Cast</span>
            <div className="kpi-value-row">
              <span className="kpi-primary-val">{totalVotesCast}</span>
              <span className="kpi-secondary-val">/ {maxAllowedVotes}</span>
            </div>
          </div>

          <div className="analytics-kpi-card">
            <span className="kpi-label">Current Leader</span>
            <div className="kpi-value-row">
              <span className="kpi-leader-val">
                {leadingOption ? (
                  <>
                    <span className="crown-icon">🏆</span>
                    <span className="leader-name">{leadingOption.label}</span>
                  </>
                ) : (
                  <span className="no-votes-yet">No votes recorded yet</span>
                )}
              </span>
            </div>
          </div>

          <div className="analytics-kpi-card">
            <span className="kpi-label">Quorum Progress</span>
            <div className="kpi-value-row">
              <span className="kpi-primary-val">
                {event.totalAllowedVotes === 'unlimited'
                  ? 'N/A'
                  : `${Math.min(
                      100,
                      Math.round(
                        (totalVotesCast / (event.totalAllowedVotes as number || 1)) * 100
                      )
                    )}%`}
              </span>
              <span className="kpi-secondary-val">turnout</span>
            </div>
          </div>
        </div>

        {/* Real-time Interactive Vote Distribution Graphs */}
        <div className="analytics-graph-section">
          <div className="graph-section-header">
            <h3 className="graph-section-title">Live Ballot Distribution & Graph</h3>
            <span className="graph-section-meta">
              Auto-refreshes in real-time as votes are sealed
            </span>
          </div>

          <div className="analytics-options-bars">
            {event.options.map((option, idx) => {
              const votes = option.votesCount || 0;
              const percentage =
                totalVotesCast > 0
                  ? Math.round((votes / totalVotesCast) * 1000) / 10
                  : 0;
              const isLeader =
                leadingOption &&
                leadingOption.id === option.id &&
                votes > 0;

              return (
                <div
                  key={option.id}
                  className={`analytics-bar-row ${isLeader ? 'is-leader' : ''}`}
                >
                  <div className="bar-row-info">
                    <div className="bar-name-group">
                      <span className={`bar-rank-badge ${isLeader ? 'rank-leader' : ''}`}>
                        #{idx + 1}
                      </span>
                      <span className="bar-option-name">{option.label}</span>
                      {isLeader && <span className="leader-pill">Leading</span>}
                    </div>

                    <div className="bar-stats-group">
                      <span className="bar-count-badge">
                        {votes} {votes === 1 ? 'vote' : 'votes'}
                      </span>
                      <strong className="bar-percent-badge">{percentage}%</strong>
                    </div>
                  </div>

                  {/* Visual Progress Bar Track */}
                  <div className="analytics-track">
                    <div
                      className={`analytics-fill ${isLeader ? 'fill-leader' : ''}`}
                      style={{
                        width: totalVotesCast > 0 ? `${Math.max(4, percentage)}%` : '0%',
                      }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Shareable Link & Action Controls */}
        <div className="analytics-footer">
          <div className="analytics-link-box">
            <span className="link-label">Public Voting URL:</span>
            <code className="link-url-text">
              {event.shareableLink || `${window.location.origin}/voting/${event.id}`}
            </code>
            <button
              type="button"
              className={`btn-copy-analytics ${copiedLink ? 'copied' : ''}`}
              onClick={handleCopyLink}
            >
              {copiedLink ? 'Copied ✓' : 'Copy Link'}
            </button>
          </div>

          <div className="analytics-footer-actions">
            <a
              href={`/voting/${event.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-open-ballot"
            >
              Open Voting Ballot ↗
            </a>
            <button
              type="button"
              className="btn-done-analytics"
              onClick={handleDismiss}
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RealtimeAnalyticsModal;
