import React, { useState, useEffect } from 'react';
import { EventItem, BallotOption } from './types';
import { uploadEventToPinata } from '../services/pinata';

interface NewEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEventCreated: (event: EventItem) => void;
}

// Format date to YYYY-MM-DD in Indian Standard Time (IST)
const getIstTodayString = (): string => {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istTime = new Date(now.getTime() + (now.getTimezoneOffset() * 60000) + istOffset);
  return istTime.toISOString().split('T')[0];
};

export const NewEventModal: React.FC<NewEventModalProps> = ({
  isOpen,
  onClose,
  onEventCreated,
}) => {
  const [step, setStep] = useState<number>(1);
  const [isClosing, setIsClosing] = useState<boolean>(false);
  const [shouldRender, setShouldRender] = useState<boolean>(isOpen);

  // Form State
  const [optionsCount, setOptionsCount] = useState<number>(2);
  const [options, setOptions] = useState<string[]>(['Option 1', 'Option 2']);
  const [totalVotes, setTotalVotes] = useState<number | 'unlimited'>(100);
  const [customVotesInput, setCustomVotesInput] = useState<string>('100');
  const [eventName, setEventName] = useState<string>('');
  const [eventBio, setEventBio] = useState<string>('');
  const [activationType, setActivationType] = useState<'automatic' | 'manual'>('automatic');
  const [startDate, setStartDate] = useState<string>(getIstTodayString());
  const [startTime, setStartTime] = useState<string>('09:00');
  const [endDate, setEndDate] = useState<string>(getIstTodayString());
  const [endTime, setEndTime] = useState<string>('18:00');

  // Submission / Pinata state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [createdEvent, setCreatedEvent] = useState<EventItem | null>(null);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Handle open/close animation lifecycle
  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      setIsClosing(false);
      // Restore draft from local storage if available
      try {
        const savedDraft = localStorage.getItem('truevote_event_draft');
        if (savedDraft) {
          const draft = JSON.parse(savedDraft);
          if (draft.options && Array.isArray(draft.options)) {
            setOptions(draft.options);
            setOptionsCount(draft.options.length);
          }
          if (draft.totalVotes) setTotalVotes(draft.totalVotes);
          if (draft.eventName) setEventName(draft.eventName);
          if (draft.eventBio) setEventBio(draft.eventBio);
          if (draft.activationType) setActivationType(draft.activationType);
        }
      } catch (e) {
        console.error('Error restoring draft:', e);
      }
    } else {
      setIsClosing(true);
      const timer = setTimeout(() => {
        setShouldRender(false);
        setIsClosing(false);
        setStep(1);
        setCreatedEvent(null);
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

  // Keyboard Escape listener
  useEffect(() => {
    if (!shouldRender) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleDismiss();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldRender]);

  // Save draft to localStorage whenever options or inputs change
  const saveDraftLocally = (opts: string[], count: number) => {
    try {
      const draft = {
        options: opts,
        optionsCount: count,
        totalVotes,
        eventName,
        eventBio,
        activationType,
        startDate,
        startTime,
        endDate,
        endTime,
        lastSaved: new Date().toISOString(),
      };
      localStorage.setItem('truevote_event_draft', JSON.stringify(draft));
    } catch (e) {
      console.error('Error saving draft:', e);
    }
  };

  // Step 1: Change options count
  const handleOptionsCountSelect = (count: number) => {
    setOptionsCount(count);
    let newOptions = [...options];
    if (count > newOptions.length) {
      for (let i = newOptions.length + 1; i <= count; i++) {
        newOptions.push(`Option ${i}`);
      }
    } else {
      newOptions = newOptions.slice(0, count);
    }
    setOptions(newOptions);
    saveDraftLocally(newOptions, count);
  };

  const handleOptionLabelChange = (index: number, val: string) => {
    const updated = [...options];
    updated[index] = val;
    setOptions(updated);
    saveDraftLocally(updated, optionsCount);
  };

  // Step 2: Handle total votes selection
  const handleTotalVotesSelect = (val: number | 'unlimited') => {
    setTotalVotes(val);
    if (val === 'unlimited') {
      setCustomVotesInput('unlimited');
    } else {
      setCustomVotesInput(String(val));
    }
  };

  const handleCustomVotesChange = (val: string) => {
    setCustomVotesInput(val);
    const num = parseInt(val, 10);
    if (!isNaN(num) && num >= 50) {
      setTotalVotes(num);
    }
  };

  // Final Step: Submit and pin to Pinata IPFS
  const handleSubmit = async () => {
    setErrorMsg('');
    if (!eventName.trim()) {
      setErrorMsg('Please provide a valid voting event title.');
      setStep(3);
      return;
    }

    setIsSubmitting(true);
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const eventId = `ev-${Date.now()}-${randomSuffix}`;
    const votingNumber = `VOTE-${randomSuffix}`;

    const ballotOptions: BallotOption[] = options.map((opt, idx) => ({
      id: `opt-${idx + 1}`,
      label: opt.trim() || `Option ${idx + 1}`,
      votesCount: 0,
    }));

    const eventPayload: EventItem = {
      id: eventId,
      name: eventName.trim(),
      bio: eventBio.trim() || 'Anonymous privacy-preserving ballot on TrueVote.',
      votingNumber,
      optionsCount: ballotOptions.length,
      options: ballotOptions,
      totalAllowedVotes: totalVotes,
      totalVotesCast: 0,
      activationType,
      startDate: activationType === 'automatic' ? startDate : undefined,
      startTime: activationType === 'automatic' ? startTime : undefined,
      endDate: activationType === 'automatic' ? endDate : undefined,
      endTime: activationType === 'automatic' ? endTime : undefined,
      isActivated: activationType === 'manual' ? true : undefined,
      createdAt: new Date().toISOString(),
      timezone: 'IST (UTC+05:30)',
      shareableLink: `${window.location.origin}/voting/${eventId}`,
    };

    try {
      // 1. Upload to Pinata IPFS
      const pinResult = await uploadEventToPinata(eventPayload);
      eventPayload.ipfsHash = pinResult.IpfsHash;
      eventPayload.ipfsUrl = pinResult.gatewayUrl;

      // 2. Persist in localStorage
      const existingStr = localStorage.getItem('truevote_events');
      let currentEvents: EventItem[] = [];
      if (existingStr) {
        try {
          const parsed = JSON.parse(existingStr);
          if (Array.isArray(parsed)) currentEvents = parsed;
        } catch (e) {
          console.error(e);
        }
      }
      const updatedEvents = [eventPayload, ...currentEvents];
      localStorage.setItem('truevote_events', JSON.stringify(updatedEvents));
      localStorage.removeItem('truevote_event_draft');

      // Dispatch storage notification
      window.dispatchEvent(new Event('truevote_events_updated'));

      setCreatedEvent(eventPayload);
      onEventCreated(eventPayload);
      setStep(5); // Link generation screen
    } catch (err: any) {
      console.error('Error creating event:', err);
      setErrorMsg('Failed to pin to IPFS or finalize event. Please check connection and retry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = () => {
    if (!createdEvent) return;
    const link = createdEvent.shareableLink || `${window.location.origin}/voting/${createdEvent.id}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(link);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  if (!shouldRender) return null;

  return (
    <div
      className={`logout-modal-backdrop ${isClosing ? 'is-closing' : 'is-entering'}`}
      onClick={handleDismiss}
    >
      <div
        className={`new-event-modal-card ${isClosing ? 'card-closing' : 'card-entering'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Close Button */}
        <button
          type="button"
          className="logout-modal-close-btn"
          onClick={handleDismiss}
          aria-label="Close modal"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        {/* Step Progression Indicators */}
        {step <= 4 && (
          <div className="new-event-steps-indicator">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`step-dot ${step === s ? 'step-active' : step > s ? 'step-done' : ''}`}
                onClick={() => {
                  if (s < step) setStep(s);
                }}
              >
                <span className="step-num">{s}</span>
              </div>
            ))}
          </div>
        )}

        {errorMsg && (
          <div className="new-event-error-alert">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <span>{errorMsg}</span>
          </div>
        )}

        {/* STEP 1: How many things to vote on (1, 2, 3, 4, 5) */}
        {step === 1 && (
          <div className="new-event-step-content">
            <div className="new-event-illustration">
              <svg width="120" height="90" viewBox="0 0 160 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="30" y="20" width="100" height="85" rx="14" fill="#EEF4FF" stroke="#3B82F6" strokeWidth="2.5" />
                <rect x="46" y="38" width="18" height="18" rx="5" fill="#2563EB" />
                <path d="M51 47L54 50L59 44" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                <rect x="72" y="43" width="46" height="8" rx="4" fill="#93C5FD" />
                <rect x="46" y="68" width="18" height="18" rx="5" fill="#DBEAFE" stroke="#93C5FD" strokeWidth="2" />
                <rect x="72" y="73" width="38" height="8" rx="4" fill="#CBD5E1" />
                <circle cx="124" cy="24" r="16" fill="#2563EB" />
                <path d="M120 24H128M124 20V28" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </div>

            <h2 className="new-event-title">How many choices to vote on?</h2>
            <p className="new-event-subtitle">
              Select how many voting options or candidate proposals will be presented on this ballot.
            </p>

            <div className="option-count-selector">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  className={`option-count-btn ${optionsCount === n ? 'active' : ''}`}
                  onClick={() => handleOptionsCountSelect(n)}
                >
                  {n}
                </button>
              ))}
            </div>

            <div className="options-input-list">
              {options.map((opt, idx) => (
                <div key={idx} className="option-input-row">
                  <span className="option-badge-index">#{idx + 1}</span>
                  <input
                    type="text"
                    className="new-event-text-input"
                    value={opt}
                    onChange={(e) => handleOptionLabelChange(idx, e.target.value)}
                    placeholder={`Name for Option ${idx + 1}`}
                  />
                </div>
              ))}
            </div>

            <div className="new-event-actions">
              <button
                type="button"
                className="btn-blue-pill"
                onClick={() => {
                  saveDraftLocally(options, optionsCount);
                  setStep(2);
                }}
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
                  <path d="M19.8285 6.6117l-5.52-5.535a3.1352 3.1352 0 00-4.5 0l-5.535 5.535 7.755 3.87zm2.118 2.235l1.095 1.095a3.12 3.12 0 010 4.5L14.22 23.3502a2.6846 2.6846 0 01-.72.525V13.0767zm-19.893 0l-1.095 1.095a3.1198 3.1198 0 000 4.5L9.78 23.3502c.2091.214.4525.3914.72.525V13.0767z" />
                </svg>
                <span>Continue</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Total Votes Capacity (50 to Unlimited) */}
        {step === 2 && (
          <div className="new-event-step-content">
            <div className="new-event-illustration">
              <svg width="120" height="90" viewBox="0 0 160 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="80" cy="55" r="42" fill="#EFF6FF" stroke="#3B82F6" strokeWidth="2.5" />
                <path d="M80 32V56L96 66" stroke="#2563EB" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                <rect x="42" y="86" width="76" height="24" rx="8" fill="#2563EB" />
                <text x="80" y="103" textAnchor="middle" fill="white" fontSize="13" fontWeight="bold" fontFamily="sans-serif">50 — ∞</text>
              </svg>
            </div>

            <h2 className="new-event-title">Total Votes Requested</h2>
            <p className="new-event-subtitle">
              Set the maximum number of ballots that can be cast (minimum 50 votes) or select unlimited.
            </p>

            <div className="votes-presets-grid">
              {[50, 100, 250, 500, 1000].map((num) => (
                <button
                  key={num}
                  type="button"
                  className={`votes-preset-chip ${totalVotes === num ? 'active' : ''}`}
                  onClick={() => handleTotalVotesSelect(num)}
                >
                  {num} Votes
                </button>
              ))}
              <button
                type="button"
                className={`votes-preset-chip unlimited-chip ${totalVotes === 'unlimited' ? 'active' : ''}`}
                onClick={() => handleTotalVotesSelect('unlimited')}
              >
                ∞ Unlimited
              </button>
            </div>

            {totalVotes !== 'unlimited' && (
              <div className="custom-votes-wrap">
                <label className="input-field-label">Custom Quorum / Max Ballots (Min: 50)</label>
                <input
                  type="number"
                  min="50"
                  className="new-event-text-input"
                  value={customVotesInput}
                  onChange={(e) => handleCustomVotesChange(e.target.value)}
                  placeholder="e.g. 500"
                />
              </div>
            )}

            <div className="new-event-actions-row">
              <button type="button" className="btn-logout-cancel" onClick={() => setStep(1)}>
                Back
              </button>
              <button
                type="button"
                className="btn-blue-pill"
                onClick={() => {
                  if (totalVotes !== 'unlimited' && totalVotes < 50) {
                    setErrorMsg('Total votes must be at least 50 or set to Unlimited.');
                    return;
                  }
                  setErrorMsg('');
                  setStep(3);
                }}
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
                  <path d="M19.8285 6.6117l-5.52-5.535a3.1352 3.1352 0 00-4.5 0l-5.535 5.535 7.755 3.87zm2.118 2.235l1.095 1.095a3.12 3.12 0 010 4.5L14.22 23.3502a2.6846 2.6846 0 01-.72.525V13.0767zm-19.893 0l-1.095 1.095a3.1198 3.1198 0 000 4.5L9.78 23.3502c.2091.214.4525.3914.72.525V13.0767z" />
                </svg>
                <span>Continue</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Vote Title & Bio */}
        {step === 3 && (
          <div className="new-event-step-content">
            <div className="new-event-illustration">
              <svg width="120" height="90" viewBox="0 0 160 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M80 18L124 38V66C124 94 80 108 80 108C80 108 36 94 36 66V38L80 18Z" fill="#EEF4FF" stroke="#3B82F6" strokeWidth="2.5" />
                <path d="M70 60L78 68L94 50" stroke="#2563EB" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="80" cy="62" r="28" stroke="#93C5FD" strokeDasharray="3 3" />
              </svg>
            </div>

            <h2 className="new-event-title">Vote Title & Description</h2>
            <p className="new-event-subtitle">
              Provide a clear title and public bio explaining what voters are deciding in this ballot.
            </p>

            <div className="form-group-field">
              <label className="input-field-label">Election / Event Title *</label>
              <input
                type="text"
                className="new-event-text-input"
                placeholder="e.g. Student Council President Election 2026"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
              />
            </div>

            <div className="form-group-field">
              <label className="input-field-label">Vote Bio / Public Summary</label>
              <textarea
                className="new-event-textarea"
                rows={3}
                placeholder="Explain the goals, candidate qualifications, or proposal details..."
                value={eventBio}
                onChange={(e) => setEventBio(e.target.value)}
              />
            </div>

            <div className="new-event-actions-row">
              <button type="button" className="btn-logout-cancel" onClick={() => setStep(2)}>
                Back
              </button>
              <button
                type="button"
                className="btn-blue-pill"
                onClick={() => {
                  if (!eventName.trim()) {
                    setErrorMsg('Please enter an event title before proceeding.');
                    return;
                  }
                  setErrorMsg('');
                  setStep(4);
                }}
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
                  <path d="M19.8285 6.6117l-5.52-5.535a3.1352 3.1352 0 00-4.5 0l-5.535 5.535 7.755 3.87zm2.118 2.235l1.095 1.095a3.12 3.12 0 010 4.5L14.22 23.3502a2.6846 2.6846 0 01-.72.525V13.0767zm-19.893 0l-1.095 1.095a3.1198 3.1198 0 000 4.5L9.78 23.3502c.2091.214.4525.3914.72.525V13.0767z" />
                </svg>
                <span>Schedule & Activation</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Activation & Indian Standard Time Schedule */}
        {step === 4 && (
          <div className="new-event-step-content">
            <div className="new-event-illustration">
              <svg width="120" height="90" viewBox="0 0 160 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="35" y="24" width="90" height="76" rx="14" fill="#EFF6FF" stroke="#3B82F6" strokeWidth="2.5" />
                <rect x="35" y="24" width="90" height="22" rx="14" fill="#2563EB" />
                <line x1="55" y1="16" x2="55" y2="28" stroke="#1D4ED8" strokeWidth="3" strokeLinecap="round" />
                <line x1="105" y1="16" x2="105" y2="28" stroke="#1D4ED8" strokeWidth="3" strokeLinecap="round" />
                <circle cx="80" cy="68" r="16" fill="white" stroke="#3B82F6" strokeWidth="2" />
                <path d="M80 58V68L87 72" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>

            <h2 className="new-event-title">Activation & Schedule</h2>
            <div className="ist-badge-indicator">
              <span className="flag-icon">🇮🇳</span> Indian Standard Time (IST, UTC+05:30)
            </div>

            <div className="activation-type-toggle">
              <button
                type="button"
                className={`activation-pill ${activationType === 'automatic' ? 'active' : ''}`}
                onClick={() => setActivationType('automatic')}
              >
                <span>Automatic (Scheduled)</span>
              </button>
              <button
                type="button"
                className={`activation-pill ${activationType === 'manual' ? 'active' : ''}`}
                onClick={() => setActivationType('manual')}
              >
                <span>Manual (Admin Toggle)</span>
              </button>
            </div>

            {activationType === 'automatic' ? (
              <div className="schedule-dates-grid">
                <div className="date-field-col">
                  <label className="input-field-label">Start Date & Time (IST)</label>
                  <input
                    type="date"
                    className="new-event-date-input"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                  <input
                    type="time"
                    className="new-event-time-input"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  />
                </div>

                <div className="date-field-col">
                  <label className="input-field-label">End Date & Time (IST)</label>
                  <input
                    type="date"
                    className="new-event-date-input"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                  <input
                    type="time"
                    className="new-event-time-input"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                  />
                </div>
              </div>
            ) : (
              <div className="manual-activation-note">
                <p>
                  In <strong>Manual mode</strong>, you activate and close this voting event on demand from the dashboard whenever you are ready.
                </p>
              </div>
            )}

            <div className="new-event-actions-row">
              <button
                type="button"
                className="btn-logout-cancel"
                onClick={() => setStep(3)}
                disabled={isSubmitting}
              >
                Back
              </button>
              <button
                type="button"
                className="btn-blue-pill"
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="spinner-border-sm"></span>
                    <span>Pinning to IPFS...</span>
                  </>
                ) : (
                  <>
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
                      <path d="M19.8285 6.6117l-5.52-5.535a3.1352 3.1352 0 00-4.5 0l-5.535 5.535 7.755 3.87zm2.118 2.235l1.095 1.095a3.12 3.12 0 010 4.5L14.22 23.3502a2.6846 2.6846 0 01-.72.525V13.0767zm-19.893 0l-1.095 1.095a3.1198 3.1198 0 000 4.5L9.78 23.3502c.2091.214.4525.3914.72.525V13.0767z" />
                    </svg>
                    <span>Publish Event & Generate Link</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: Success & Generated Shareable Voting Link */}
        {step === 5 && createdEvent && (
          <div className="new-event-step-content success-view">
            <div className="new-event-illustration">
              <svg width="130" height="95" viewBox="0 0 160 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="80" cy="60" r="48" fill="#ECFDF5" stroke="#10B981" strokeWidth="2.5" />
                <path d="M58 60L73 75L104 44" stroke="#059669" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="125" cy="28" r="14" fill="#2563EB" />
                <path d="M120 28L123 31L130 24" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>

            <h2 className="new-event-title">Voting Event Published!</h2>
            <p className="new-event-subtitle">
              Your ballot schema has been pinned to decentralized IPFS storage via Pinata. Share this official voting link with voters:
            </p>

            <div className="shareable-link-box">
              <input
                type="text"
                readOnly
                className="shareable-link-input"
                value={createdEvent.shareableLink || `${window.location.origin}/voting/${createdEvent.id}`}
              />
              <button
                type="button"
                className="btn-copy-link"
                onClick={copyToClipboard}
              >
                {copiedLink ? 'Copied!' : 'Copy Link'}
              </button>
            </div>

            {createdEvent.ipfsHash && (
              <div className="ipfs-proof-badge">
                <span className="ipfs-label">IPFS CID:</span>
                <a
                  href={createdEvent.ipfsUrl || `https://gateway.pinata.cloud/ipfs/${createdEvent.ipfsHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ipfs-hash-link"
                >
                  {createdEvent.ipfsHash.substring(0, 18)}...
                </a>
              </div>
            )}

            <div className="new-event-actions-row success-actions">
              <a
                href={createdEvent.shareableLink || `/voting/${createdEvent.id}`}
                className="btn-blue-pill"
                target="_blank"
                rel="noopener noreferrer"
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
                  <path d="M19.8285 6.6117l-5.52-5.535a3.1352 3.1352 0 00-4.5 0l-5.535 5.535 7.755 3.87zm2.118 2.235l1.095 1.095a3.12 3.12 0 010 4.5L14.22 23.3502a2.6846 2.6846 0 01-.72.525V13.0767zm-19.893 0l-1.095 1.095a3.1198 3.1198 0 000 4.5L9.78 23.3502c.2091.214.4525.3914.72.525V13.0767z" />
                </svg>
                <span>Open Voting Page</span>
              </a>

              <button
                type="button"
                className="btn-logout-cancel"
                onClick={handleDismiss}
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NewEventModal;
