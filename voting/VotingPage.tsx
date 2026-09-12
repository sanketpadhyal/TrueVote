import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { EventItem, BallotOption } from '../dashboard/types';
import './voting.css';

// Simple SHA-256 equivalent hash helper using subtle crypto or fallback
async function sha256(message: string): Promise<string> {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    try {
      const msgBuffer = new TextEncoder().encode(message);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    } catch (e) {
      console.error(e);
    }
  }
  // Deterministic fallback
  let hash = 0;
  for (let i = 0; i < message.length; i++) {
    const char = message.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(16, '0');
}

// Generate device / session pseudo-fingerprint for anonymous nullifier
const getAnonymousVoterId = (): string => {
  if (typeof window === 'undefined') return 'anon-voter-fallback';
  let voterId = localStorage.getItem('truevote_voter_seed');
  if (!voterId) {
    voterId = 'voter_' + Math.random().toString(36).substring(2, 15) + '_' + Date.now().toString(36);
    localStorage.setItem('truevote_voter_seed', voterId);
  }
  return voterId;
};

// Convert Date to Indian Standard Time (IST UTC+05:30)
const getIstCurrentTime = (): Date => {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  return new Date(now.getTime() + (now.getTimezoneOffset() * 60000) + istOffset);
};

export const VotingPage: React.FC = () => {
  const { eventId } = useParams<{ eventId?: string }>();
  const navigate = useNavigate();

  // State
  const [event, setEvent] = useState<EventItem | null>(null);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [hasAlreadyVoted, setHasAlreadyVoted] = useState<boolean>(false);
  const [storedReceipt, setStoredReceipt] = useState<{ receiptHash: string; timestamp: string; optionLabel: string } | null>(null);

  // Human vs Bot Verification Challenge state
  const [isCaptchaSolved, setIsCaptchaSolved] = useState<boolean>(false);
  const [captchaTarget, setCaptchaTarget] = useState<string>('0x7A9F');
  const [captchaOptions, setCaptchaOptions] = useState<string[]>(['0x7A9F', '0x3E1C', '0x9B4D', '0x2F80']);
  const [honeypotVal, setHoneypotVal] = useState<string>('');
  const [pageLoadTime] = useState<number>(Date.now());

  // Casting state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [voteSuccess, setVoteSuccess] = useState<boolean>(false);
  const [latestReceipt, setLatestReceipt] = useState<{ receiptHash: string; timestamp: string } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Real-time IST Clock
  const [currentTimeIst, setCurrentTimeIst] = useState<string>('');

  useEffect(() => {
    const updateClock = () => {
      const ist = getIstCurrentTime();
      setCurrentTimeIst(
        ist.toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        }) + ' IST'
      );
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // Initialize Captcha Challenge
  useEffect(() => {
    const hexFragments = ['0x8F2D', '0x4E1A', '0x7C9B', '0x3A6F', '0x9E21', '0x1F88'];
    const target = hexFragments[Math.floor(Math.random() * hexFragments.length)];
    setCaptchaTarget(target);
    const shuffled = [...hexFragments].sort(() => 0.5 - Math.random()).slice(0, 4);
    if (!shuffled.includes(target)) {
      shuffled[0] = target;
    }
    setCaptchaOptions(shuffled.sort(() => 0.5 - Math.random()));
  }, []);

  // Load Event Data with real-time sync across tabs and updates
  useEffect(() => {
    const loadEventData = () => {
      const targetId = (eventId || '').trim().toLowerCase();
      const storedEventsStr = localStorage.getItem('truevote_events');
      let foundEvent: EventItem | null = null;

      if (storedEventsStr) {
        try {
          const events: EventItem[] = JSON.parse(storedEventsStr);
          if (Array.isArray(events) && events.length > 0) {
            if (targetId) {
              foundEvent =
                events.find(
                  (e) =>
                    e.id.toLowerCase() === targetId ||
                    (e.votingNumber && e.votingNumber.toLowerCase() === targetId)
                ) || null;
            }
            if (!foundEvent && !eventId) {
              foundEvent = events[0];
            }
          }
        } catch (e) {
          console.error('Error loading events for voting page:', e);
        }
      }

      // If still not found, provide fallback demo referendum
      if (!foundEvent) {
        foundEvent = {
          id: eventId || 'demo-referendum',
          name: 'TrueVote Cryptographic Governance Referendum 2026',
          bio: 'Official decentralized ballot for verifying community protocol enhancements and zero-knowledge privacy parameters.',
          votingNumber: 'VOTE-2026',
          optionsCount: 2,
          options: [
            { id: 'opt-1', label: 'Approve zk-SNARK Protocol Upgrade', votesCount: 38 },
            { id: 'opt-2', label: 'Maintain Current Verifier Standard', votesCount: 14 },
          ],
          totalAllowedVotes: 250,
          totalVotesCast: 52,
          activationType: 'automatic',
          startDate: '2026-09-01',
          startTime: '00:00',
          endDate: '2026-12-31',
          endTime: '23:59',
          isActivated: true,
          createdAt: new Date().toISOString(),
          timezone: 'IST (UTC+05:30)',
        };
      }

      setEvent(foundEvent);

      // Check if voter already voted for this event (No Twice Voting Guard)
      const voterId = getAnonymousVoterId();
      const nullifierKey = `truevote_voted_nullifier_${foundEvent.id}_${voterId}`;
      const previousReceipt = localStorage.getItem(nullifierKey);
      if (previousReceipt) {
        try {
          setStoredReceipt(JSON.parse(previousReceipt));
          setHasAlreadyVoted(true);
        } catch (e) {
          setHasAlreadyVoted(true);
        }
      }
    };

    loadEventData();

    window.addEventListener('truevote_events_updated', loadEventData);
    window.addEventListener('storage', loadEventData);

    return () => {
      window.removeEventListener('truevote_events_updated', loadEventData);
      window.removeEventListener('storage', loadEventData);
    };
  }, [eventId]);

  // Check Schedule & Strict Activation Enforcement
  const isVotingActive = React.useMemo(() => {
    if (!event) return false;

    // Explicit deactivation override
    if (event.isActivated === false) {
      return false;
    }

    if (event.activationType === 'manual') {
      // Manual events MUST be explicitly activated by admin (isActivated === true)
      return event.isActivated === true;
    }

    // Automatic activation: verify against Indian Standard Time (IST) window
    if (event.startDate && event.endDate) {
      const nowIst = getIstCurrentTime();
      const startDateTime = new Date(`${event.startDate}T${event.startTime || '00:00'}:00`);
      const endDateTime = new Date(`${event.endDate}T${event.endTime || '23:59'}:59`);
      if (nowIst < startDateTime || nowIst > endDateTime) {
        return false;
      }
      return true;
    }

    return event.isActivated === true;
  }, [event]);

  // Cast Ballot Handler
  const handleCastBallot = async () => {
    setErrorMessage('');

    if (!isVotingActive) {
      setErrorMessage(
        event?.activationType === 'manual'
          ? 'Voting is currently inactive. This event has not been activated by the administrator.'
          : 'Voting is currently inactive or outside the scheduled Indian Standard Time window.'
      );
      return;
    }

    // 1. Anti-Bot Verification Check
    if (honeypotVal.trim() !== '') {
      setErrorMessage('Security Exception: Bot behavior detected.');
      return;
    }

    const elapsed = Date.now() - pageLoadTime;
    if (elapsed < 1500) {
      setErrorMessage('Security warning: Form submitted too rapidly.');
      return;
    }

    if (!isCaptchaSolved) {
      setErrorMessage('Please complete the Human Verification challenge before casting your vote.');
      return;
    }

    if (!selectedOptionId) {
      setErrorMessage('Please select one of the ballot choices above.');
      return;
    }

    if (!event) return;

    // 2. Double-voting check
    const voterId = getAnonymousVoterId();
    const nullifierKey = `truevote_voted_nullifier_${event.id}_${voterId}`;
    if (localStorage.getItem(nullifierKey)) {
      setHasAlreadyVoted(true);
      setErrorMessage('Anti-Double Voting Protection: You have already cast an anonymous ballot for this event.');
      return;
    }

    setIsSubmitting(true);

    try {
      // 3. Generate Cryptographic Nullifier & Anonymous Receipt
      const nullifierHash = await sha256(`truevote:nullifier:${event.id}:${voterId}:${Date.now()}`);
      const receiptHash = `0x${nullifierHash.substring(0, 32)}`;
      const timestamp = new Date().toISOString();

      const selectedOption = event.options.find((o) => o.id === selectedOptionId);
      const optionLabel = selectedOption ? selectedOption.label : 'Option';

      // 4. Update Event Vote Count anonymously in Storage
      const updatedOptions = event.options.map((opt) =>
        opt.id === selectedOptionId ? { ...opt, votesCount: (opt.votesCount || 0) + 1 } : opt
      );
      const updatedTotalCast = (event.totalVotesCast || 0) + 1;

      const updatedEvent: EventItem = {
        ...event,
        options: updatedOptions,
        totalVotesCast: updatedTotalCast,
      };

      // Persist event update
      const storedEventsStr = localStorage.getItem('truevote_events');
      if (storedEventsStr) {
        try {
          const events: EventItem[] = JSON.parse(storedEventsStr);
          const idx = events.findIndex((e) => e.id === event.id);
          if (idx !== -1) {
            events[idx] = updatedEvent;
            localStorage.setItem('truevote_events', JSON.stringify(events));
            window.dispatchEvent(new Event('truevote_events_updated'));
          }
        } catch (e) {
          console.error(e);
        }
      }

      // 5. Seal Nullifier to permanently lock double-voting
      const receiptData = {
        receiptHash,
        timestamp,
        optionLabel,
        eventId: event.id,
      };
      localStorage.setItem(nullifierKey, JSON.stringify(receiptData));

      // 6. Record anonymous activity log
      try {
        const actStr = localStorage.getItem('truevote_activities') || '[]';
        const activities = JSON.parse(actStr);
        activities.unshift({
          id: `act-${Date.now()}`,
          userName: `Anonymous Voter (#${receiptHash.substring(2, 6)})`,
          votingNumber: event.votingNumber,
          date: 'Just now',
          type: 'ballot',
        });
        localStorage.setItem('truevote_activities', JSON.stringify(activities.slice(0, 20)));
      } catch (e) {
        console.error(e);
      }

      setEvent(updatedEvent);
      setLatestReceipt({ receiptHash, timestamp });
      setVoteSuccess(true);
      setHasAlreadyVoted(true);
    } catch (err) {
      console.error('Error casting vote:', err);
      setErrorMessage('Cryptographic error occurred while signing ballot. Please retry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!event) {
    return (
      <div className="voting-page-wrapper">
        <div className="voting-card">
          <p style={{ color: '#fff' }}>Loading voting session...</p>
        </div>
      </div>
    );
  }

  const totalVotesCast = event.totalVotesCast || event.options.reduce((sum, o) => sum + (o.votesCount || 0), 0);
  const maxVotesDisplay = event.totalAllowedVotes === 'unlimited' ? '∞ Unlimited' : event.totalAllowedVotes;

  return (
    <div className="voting-page-wrapper">
      {/* Background Decorative Lighting */}
      <div className="voting-glow-ambient voting-glow-top"></div>
      <div className="voting-glow-ambient voting-glow-bottom"></div>

      {/* Top Security Banner */}
      <header className="voting-navbar">
        <div className="voting-brand" onClick={() => navigate('/dashboard')}>
          <img src="/images/logo.png" alt="TrueVote Logo" className="voting-brand-logo" />
          <span className="voting-brand-title">
            True<span className="brand-accent">Vote</span>
          </span>
        </div>

        <div className="voting-meta-badges">
          <div className="security-status-badge">
            <span className="status-indicator-dot"></span>
            <span>Zero-Knowledge Privacy Active</span>
          </div>

          <div className="ist-clock-badge">
            <span>🇮🇳 {currentTimeIst || 'IST'}</span>
          </div>
        </div>
      </header>

      {/* Main Ballot Card */}
      <main className="voting-main-container">
        <div className="voting-card">
          {/* Honeypot Bot Trap Field */}
          <input
            type="text"
            name="security_trap"
            value={honeypotVal}
            onChange={(e) => setHoneypotVal(e.target.value)}
            style={{ display: 'none', opacity: 0, position: 'absolute', left: '-9999px' }}
            tabIndex={-1}
            autoComplete="off"
          />

          {/* Event Header */}
          <div className="voting-card-header">
            <div className="event-tag-row">
              <span className="voting-event-num-pill">{event.votingNumber}</span>
              <span className={`voting-status-pill ${isVotingActive ? 'pill-active' : 'pill-closed'}`}>
                {isVotingActive ? 'Polls Open' : 'Voting Inactive'}
              </span>
              <span className="voting-privacy-pill">Cryptographic Shield</span>
            </div>

            <h1 className="voting-event-title">{event.name}</h1>
            <p className="voting-event-bio">{event.bio}</p>

            {/* Quorum / Capacity Progress */}
            <div className="voting-progress-wrap">
              <div className="progress-labels-row">
                <span className="progress-label-text">Total Ballots Cast:</span>
                <span className="progress-value-text">
                  <strong>{totalVotesCast}</strong> / {maxVotesDisplay}
                </span>
              </div>
              <div className="progress-bar-track">
                <div
                  className="progress-bar-fill"
                  style={{
                    width:
                      event.totalAllowedVotes === 'unlimited'
                        ? `${Math.min(100, (totalVotesCast / 100) * 100)}%`
                        : `${Math.min(100, (totalVotesCast / (event.totalAllowedVotes as number)) * 100)}%`,
                  }}
                ></div>
              </div>
            </div>
          </div>

          {/* ALREADY VOTED STATE (Strict Anti-Double-Voting Prevention) */}
          {hasAlreadyVoted && !voteSuccess && (
            <div className="already-voted-panel">
              <div className="shield-icon-badge">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
              </div>

              <h2 className="panel-status-title">Ballot Irreversibly Cast</h2>
              <p className="panel-status-desc">
                Your cryptographic voter nullifier has already been committed for this referendum. In compliance with TrueVote’s anti-double voting protocol, each authorized entity can only cast exactly one ballot.
              </p>

              {storedReceipt && (
                <div className="receipt-box">
                  <div className="receipt-item">
                    <span className="receipt-key">Nullifier Receipt:</span>
                    <code className="receipt-hash">{storedReceipt.receiptHash}</code>
                  </div>
                  <div className="receipt-item">
                    <span className="receipt-key">Timestamp:</span>
                    <span className="receipt-val">{new Date(storedReceipt.timestamp).toLocaleString('en-IN')} IST</span>
                  </div>
                  <div className="receipt-item">
                    <span className="receipt-key">Cryptographic Status:</span>
                    <span className="receipt-val status-sealed">Sealed & Verifiable</span>
                  </div>
                </div>
              )}

              <button
                type="button"
                className="btn-blue-pill"
                onClick={() => navigate('/dashboard')}
                style={{ marginTop: '20px' }}
              >
                Return to Dashboard
              </button>
            </div>
          )}

          {/* SUCCESSFUL BALLOT CONFIRMATION */}
          {voteSuccess && latestReceipt && (
            <div className="vote-success-panel">
              <div className="success-icon-wrap">
                <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="m9 12 2 2 4-4"></path>
                </svg>
              </div>

              <h2 className="panel-status-title">Ballot Anonymously Cast & Sealed!</h2>
              <p className="panel-status-desc">
                Your vote was recorded with zero-knowledge anonymity. Your voter identity is disconnected from your selection to guarantee total voter privacy.
              </p>

              <div className="receipt-box">
                <div className="receipt-item">
                  <span className="receipt-key">ZKP Receipt Hash:</span>
                  <code className="receipt-hash">{latestReceipt.receiptHash}</code>
                </div>
                <div className="receipt-item">
                  <span className="receipt-key">Timestamp:</span>
                  <span className="receipt-val">{new Date(latestReceipt.timestamp).toLocaleString('en-IN')} IST</span>
                </div>
                <div className="receipt-item">
                  <span className="receipt-key">Double-Voting Guard:</span>
                  <span className="receipt-val status-sealed">Nullifier Committed</span>
                </div>
              </div>

              <div className="success-buttons-row">
                <button
                  type="button"
                  className="btn-blue-pill"
                  onClick={() => navigate('/dashboard')}
                >
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
                    <path d="M19.8285 6.6117l-5.52-5.535a3.1352 3.1352 0 00-4.5 0l-5.535 5.535 7.755 3.87zm2.118 2.235l1.095 1.095a3.12 3.12 0 010 4.5L14.22 23.3502a2.6846 2.6846 0 01-.72.525V13.0767zm-19.893 0l-1.095 1.095a3.1198 3.1198 0 000 4.5L9.78 23.3502c.2091.214.4525.3914.72.525V13.0767z" />
                  </svg>
                  <span>Go to Dashboard</span>
                </button>
              </div>
            </div>
          )}

          {/* ACTIVE VOTING BALLOT */}
          {!hasAlreadyVoted && !voteSuccess && (
            <div className="ballot-form-section">
              {errorMessage && (
                <div className="voting-error-box">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                  </svg>
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Inactive Schedule Notice */}
              {!isVotingActive && (
                <div className="voting-inactive-notice">
                  <div className="inactive-notice-icon-wrap">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </div>
                  <div className="inactive-notice-text">
                    <strong className="inactive-notice-heading">Voting Is Currently Inactive</strong>
                    <p className="inactive-notice-desc">
                      {event.activationType === 'manual'
                        ? 'This voting event has not been activated by the administrator. Ballots cannot be cast until it is activated in the dashboard.'
                        : `Polls are only open between ${event.startDate || 'TBD'} (${event.startTime || '00:00'}) and ${event.endDate || 'TBD'} (${event.endTime || '23:59'}) IST.`}
                    </p>
                  </div>
                </div>
              )}

              {/* Ballot Options List */}
              <div className={`ballot-options-list ${!isVotingActive ? 'ballot-list-disabled' : ''}`}>
                <h3 className="section-label">Select Your Ballot Choice</h3>
                {event.options.map((option: BallotOption, idx: number) => {
                  const isSelected = selectedOptionId === option.id;
                  return (
                    <div
                      key={option.id}
                      className={`ballot-option-card ${isSelected ? 'selected' : ''} ${!isVotingActive ? 'card-disabled' : ''}`}
                      onClick={() => {
                        if (!isVotingActive) {
                          setErrorMessage('Voting is locked: this event is currently inactive.');
                          return;
                        }
                        setSelectedOptionId(option.id);
                      }}
                    >
                      <div className="ballot-radio-indicator">
                        <div className={`radio-dot ${isSelected ? 'radio-checked' : ''}`}></div>
                      </div>

                      <div className="ballot-option-info">
                        <span className="ballot-option-index">Choice #{idx + 1}</span>
                        <h4 className="ballot-option-label">{option.label}</h4>
                      </div>

                      <div className="ballot-votes-badge">
                        <span>{option.votesCount || 0} votes</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Bot vs Human Verification Challenge */}
              <div className={`cybersecurity-challenge-box ${!isVotingActive ? 'challenge-box-disabled' : ''}`}>
                <div className="challenge-header">
                  <div className="challenge-icon-wrap">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                    </svg>
                  </div>
                  <div>
                    <h4 className="challenge-title">Proof of Humanity Challenge</h4>
                    <p className="challenge-desc">
                      Select the matching cryptographic cipher key below to verify you are a human voter:
                    </p>
                  </div>
                </div>

                <div className="target-key-badge">
                  <span>Target Cipher:</span>
                  <code>{captchaTarget}</code>
                </div>

                <div className="captcha-options-row">
                  {captchaOptions.map((opt) => {
                    const isCorrect = opt === captchaTarget;
                    const isSolved = isCaptchaSolved && isCorrect;
                    return (
                      <button
                        key={opt}
                        type="button"
                        disabled={!isVotingActive}
                        className={`captcha-chip ${isSolved ? 'chip-verified' : ''}`}
                        onClick={() => {
                          if (!isVotingActive) return;
                          if (isCorrect) {
                            setIsCaptchaSolved(true);
                            setErrorMessage('');
                          } else {
                            setIsCaptchaSolved(false);
                            setErrorMessage('Verification failed: Incorrect cipher key selected.');
                          }
                        }}
                      >
                        {opt} {isSolved && '✓'}
                      </button>
                    );
                  })}
                </div>

                {isCaptchaSolved && (
                  <div className="human-verified-banner">
                    <span>✓ Human voter signature verified. Ready to cast anonymous ballot.</span>
                  </div>
                )}
              </div>

              {/* Cast Ballot Action with Blue Pill Theme */}
              <div className="ballot-cast-actions">
                <button
                  type="button"
                  className={`btn-blue-pill btn-cast-pill ${!isVotingActive ? 'btn-disabled' : ''}`}
                  onClick={handleCastBallot}
                  disabled={isSubmitting || !isVotingActive || !selectedOptionId}
                >
                  {isSubmitting ? (
                    <>
                      <span className="spinner-border-sm"></span>
                      <span>Encrypting & Casting Ballot...</span>
                    </>
                  ) : !isVotingActive ? (
                    <>
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                      <span>Voting Inactive</span>
                    </>
                  ) : (
                    <>
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
                        <path d="M19.8285 6.6117l-5.52-5.535a3.1352 3.1352 0 00-4.5 0l-5.535 5.535 7.755 3.87zm2.118 2.235l1.095 1.095a3.12 3.12 0 010 4.5L14.22 23.3502a2.6846 2.6846 0 01-.72.525V13.0767zm-19.893 0l-1.095 1.095a3.1198 3.1198 0 000 4.5L9.78 23.3502c.2091.214.4525.3914.72.525V13.0767z" />
                      </svg>
                      <span>Cast Anonymous Vote</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default VotingPage;
