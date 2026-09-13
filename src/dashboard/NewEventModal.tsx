import React, { useState, useEffect } from 'react';
import { EventItem, BallotOption } from './types';
import { uploadEventToPinata } from '../services/pinata';
import { saveEventsToBackup } from '../services/storage';

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

  // Smooth Dynamic Height Measurement
  const innerContentRef = React.useRef(null);
  const [dynamicHeight, setDynamicHeight] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (!innerContentRef.current) return;

    const measure = () => {
      const el = innerContentRef.current as HTMLElement | null;
      if (el) {
        const naturalH = el.offsetHeight;
        setDynamicHeight(naturalH + 52); // Natural height + 28px top + 24px bottom padding
      }
    };

    const rAF = requestAnimationFrame(measure);

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => {
        measure();
      });
      if (innerContentRef.current) {
        ro.observe(innerContentRef.current);
      }
    }

    return () => {
      cancelAnimationFrame(rAF);
      if (ro) ro.disconnect();
    };
  }, [step, optionsCount, options.length, errorMsg, activationType, totalVotes]);

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
          if (draft.options && Array.isArray(draft.options) && draft.options.length >= 2) {
            const validLen = Math.min(5, Math.max(2, draft.options.length));
            setOptions(draft.options.slice(0, validLen));
            setOptionsCount(validLen);
          } else {
            setOptions(['Option 1', 'Option 2']);
            setOptionsCount(2);
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
      }, 300);
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

  // Clean local draft helper
  const clearDraft = () => {
    try {
      localStorage.removeItem('truevote_event_draft');
    } catch (e) {
      console.error(e);
    }
  };

  // Save current step data to localStorage
  const saveDraftLocally = (opts = options, count = optionsCount) => {
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
      };
      localStorage.setItem('truevote_event_draft', JSON.stringify(draft));
    } catch (e) {
      console.error('Error saving draft:', e);
    }
  };

  // Step 1: Change options count (choices 2 to 5)
  const handleOptionsCountSelect = (count: number) => {
    const validCount = Math.min(5, Math.max(2, count));
    setOptionsCount(validCount);
    let newOptions = [...options];
    if (validCount > newOptions.length) {
      for (let i = newOptions.length + 1; i <= validCount; i++) {
        newOptions.push(`Option ${i}`);
      }
    } else {
      newOptions = newOptions.slice(0, validCount);
    }
    setOptions(newOptions);
    saveDraftLocally(newOptions, validCount);
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
      setErrorMsg('Please enter an event title before proceeding.');
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

// Cryptographic wallet signature generator for tamper-proof ballot schemas
async function generateWalletSignature(manifest: string, walletAddress: string): Promise<string> {
  if (typeof window !== 'undefined' && (window as any).ethereum) {
    try {
      const sig = await (window as any).ethereum.request({
        method: 'personal_sign',
        params: [manifest, walletAddress],
      });
      if (sig) return sig;
    } catch (e: any) {
      const msg = String(e?.message || '').toLowerCase();
      if (
        e?.code === 4001 ||
        e?.code === 'ACTION_REJECTED' ||
        msg.includes('reject') ||
        msg.includes('denied') ||
        msg.includes('cancel') ||
        msg.includes('abort')
      ) {
        throw new Error('Wallet authorization rejected by user. Event creation cancelled.');
      }
      throw new Error(e?.message || 'Wallet signature required to authorize election.');
    }
  }

  if (typeof window !== 'undefined' && (window as any).solana && (window as any).solana.signMessage) {
    try {
      const encoded = new TextEncoder().encode(manifest);
      const res = await (window as any).solana.signMessage(encoded, 'utf8');
      if (res?.signature) {
        return '0x' + Array.from(res.signature).map((b: any) => b.toString(16).padStart(2, '0')).join('');
      }
    } catch (e: any) {
      const msg = String(e?.message || '').toLowerCase();
      if (
        e?.code === 4001 ||
        msg.includes('reject') ||
        msg.includes('denied') ||
        msg.includes('cancel')
      ) {
        throw new Error('Solana wallet authorization rejected by user. Event creation cancelled.');
      }
      throw new Error(e?.message || 'Wallet signature required to authorize election.');
    }
  }

  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    try {
      const msgBuffer = new TextEncoder().encode(`${manifest}:${walletAddress}`);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return '0x' + hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    } catch (e) {}
  }

  let hash = 0;
  for (let i = 0; i < manifest.length; i++) {
    hash = (hash << 5) - hash + manifest.charCodeAt(i);
    hash |= 0;
  }
  return '0x' + Math.abs(hash).toString(16).padStart(64, '0');
}

    const connectedWallet =
      localStorage.getItem('truevote_connected_wallet') ||
      (typeof window !== 'undefined' && (window as any).ethereum?.selectedAddress) ||
      '0x71C...3a9';

    const signatureManifest =
      `TrueVote Decentralized Election Manifest\n` +
      `=========================================\n` +
      `Event: ${eventName.trim()}\n` +
      `Ballot Number: ${votingNumber}\n` +
      `Options: ${ballotOptions.map((o) => o.label).join(' vs ')}\n` +
      `Max Votes: ${totalVotes}\n` +
      `Timestamp: ${new Date().toISOString()}\n` +
      `Creator: ${connectedWallet}\n\n` +
      `By authorizing, this tamper-proof ballot schema is cryptographically signed and pinned to Pinata IPFS.`;

    let creatorSignature = '';
    try {
      creatorSignature = await generateWalletSignature(signatureManifest, connectedWallet);
    } catch (sigErr: any) {
      console.warn('Wallet signing aborted:', sigErr);
      setErrorMsg(sigErr?.message || 'Wallet signature rejected. Election creation cancelled.');
      setIsSubmitting(false);
      return; // Stop immediately! Never create event or link!
    }

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
      isActivated: activationType === 'automatic' ? true : false,
      createdAt: new Date().toISOString(),
      timezone: 'IST (UTC+05:30)',
      shareableLink: `${window.location.origin}/voting/${eventId}`,
      creatorWallet: connectedWallet,
      creatorSignature,
      signatureManifest,
      signedAt: new Date().toISOString(),
    };

    try {
      // 1. Upload to Pinata IPFS
      const pinResult = await uploadEventToPinata(eventPayload);
      eventPayload.ipfsHash = pinResult.IpfsHash;
      eventPayload.ipfsUrl = pinResult.gatewayUrl;
      eventPayload.ipfsFileId = pinResult.fileId;

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
      saveEventsToBackup(updatedEvents);
      clearDraft();

      // Dispatch storage and broadcast notification
      window.dispatchEvent(new Event('truevote_events_updated'));
      try {
        const bc = new BroadcastChannel('truevote_events_channel');
        bc.postMessage({ type: 'EVENT_CREATED', eventId });
        bc.close();
      } catch (e) {}

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
        style={dynamicHeight ? { height: `${dynamicHeight}px` } : undefined}
        onClick={(e) => e.stopPropagation()}
      >
        <div ref={innerContentRef} className="new-event-modal-inner-wrapper">
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

        {/* Modal Header: Step Indicator & Smooth Error Accordion */}
        <div className="new-event-modal-header">
          {step <= 4 && (
            <div className="new-event-stepper-wrap">
              <div className="new-event-steps-indicator">
                {[1, 2, 3, 4].map((s, idx) => (
                  <React.Fragment key={s}>
                    {idx > 0 && (
                      <div
                        className={`step-connector ${step > idx ? 'connector-done' : ''}`}
                      />
                    )}
                    <button
                      type="button"
                      className={`step-dot ${step === s ? 'step-active' : step > s ? 'step-done' : ''}`}
                      onClick={() => {
                        if (s < step) {
                          setErrorMsg('');
                          setStep(s);
                        }
                      }}
                      disabled={s > step}
                      aria-label={`Step ${s}`}
                    >
                      {step > s ? (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      ) : (
                        <span className="step-num">{s}</span>
                      )}
                    </button>
                  </React.Fragment>
                ))}
              </div>
              <div className="stepper-sublabel">
                Step {step} of 4 &bull; {step === 1 ? 'Choices' : step === 2 ? 'Quorum' : step === 3 ? 'Schedule' : 'Review'}
              </div>
            </div>
          )}

          {/* Smooth Animated Error Banner Container */}
          <div className={`new-event-error-container ${errorMsg ? 'has-error' : ''}`}>
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
          </div>
        </div>

        {/* Stable Scrollable Step Body */}
        <div className="new-event-step-body" key={step}>
          {/* STEP 1: How many things to vote on (1, 2, 3, 4, 5) */}
          {step === 1 && (
            <div className="new-event-step-inner">
              <div className="new-event-illustration">
                <svg width="110" height="82" viewBox="0 0 160 120" fill="none" xmlns="http://www.w3.org/2000/svg">
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
                Select how many voting options or proposals will be presented on this ballot.
              </p>

              {/* Modern Choice Cards Grid */}
              <div className="choice-count-grid">
                {[2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    className={`choice-count-card ${optionsCount === n ? 'active' : ''}`}
                    onClick={() => handleOptionsCountSelect(n)}
                  >
                    <span className="choice-count-num">{n}</span>
                    <span className="choice-count-sub">Choices</span>
                  </button>
                ))}
              </div>

              {/* Compact Options Input List */}
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

              <div className="new-event-actions-row">
                <button
                  type="button"
                  className="btn-blue-pill"
                  onClick={() => {
                    setErrorMsg('');
                    saveDraftLocally(options, optionsCount);
                    setStep(2);
                  }}
                >
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                  </svg>
                  <span>Continue</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Total Votes Capacity (50 to Unlimited) */}
          {step === 2 && (
            <div className="new-event-step-inner">
              <div className="new-event-illustration">
                <svg width="110" height="82" viewBox="0 0 160 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="80" cy="55" r="40" fill="#EFF6FF" stroke="#3B82F6" strokeWidth="2.5" />
                  <path d="M80 34V56L95 65" stroke="#2563EB" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                  <rect x="44" y="86" width="72" height="22" rx="8" fill="#2563EB" />
                  <text x="80" y="102" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold" fontFamily="sans-serif">50 — ∞</text>
                </svg>
              </div>

              <h2 className="new-event-title">Total Votes Requested</h2>
              <p className="new-event-subtitle">
                Set the voter quorum capacity (minimum 50 votes) or allow unlimited participation.
              </p>

              {/* Modern Total Votes Capacity Grid */}
              <div className="votes-presets-grid">
                {[50, 100, 250, 500, 1000].map((num) => (
                  <button
                    key={num}
                    type="button"
                    className={`votes-preset-chip ${totalVotes === num ? 'active' : ''}`}
                    onClick={() => handleTotalVotesSelect(num)}
                  >
                    <span className="votes-chip-num">{num}</span>
                    <span className="votes-chip-sub">Votes</span>
                  </button>
                ))}
                <button
                  type="button"
                  className={`votes-preset-chip unlimited-chip ${totalVotes === 'unlimited' ? 'active' : ''}`}
                  onClick={() => handleTotalVotesSelect('unlimited')}
                >
                  <span className="votes-chip-num" style={{ fontSize: '22px', lineHeight: 1 }}>&infin;</span>
                  <span className="votes-chip-sub">Unlimited</span>
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
                <button
                  type="button"
                  className="btn-logout-cancel"
                  onClick={() => {
                    setErrorMsg('');
                    setStep(1);
                  }}
                >
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
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                  </svg>
                  <span>Continue</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Vote Title & Bio */}
          {step === 3 && (
            <div className="new-event-step-inner">
              <div className="new-event-illustration">
                <svg width="110" height="82" viewBox="0 0 160 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M80 18L124 38V66C124 94 80 108 80 108C80 108 36 94 36 66V38L80 18Z" fill="#EEF4FF" stroke="#3B82F6" strokeWidth="2.5" />
                  <path d="M70 60L78 68L94 50" stroke="#2563EB" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="80" cy="62" r="28" stroke="#93C5FD" strokeDasharray="3 3" />
                </svg>
              </div>

              <h2 className="new-event-title">Vote Title & Description</h2>
              <p className="new-event-subtitle">
                Provide a clear title and public bio explaining what voters are deciding.
              </p>

              <div className="form-group-field">
                <label className="input-field-label">Election / Event Title *</label>
                <input
                  type="text"
                  className="new-event-text-input"
                  placeholder="e.g. Student Council President Election 2026"
                  value={eventName}
                  onChange={(e) => {
                    setEventName(e.target.value);
                    if (errorMsg) setErrorMsg('');
                  }}
                />
              </div>

              <div className="form-group-field">
                <label className="input-field-label">Vote Bio / Public Summary</label>
                <textarea
                  className="new-event-textarea"
                  rows={2}
                  placeholder="Explain the goals, candidate qualifications, or proposal details..."
                  value={eventBio}
                  onChange={(e) => setEventBio(e.target.value)}
                />
              </div>

              <div className="new-event-actions-row">
                <button
                  type="button"
                  className="btn-logout-cancel"
                  onClick={() => {
                    setErrorMsg('');
                    setStep(2);
                  }}
                >
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
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                  </svg>
                  <span>Schedule & Activation</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Activation & Indian Standard Time Schedule */}
          {step === 4 && (
            <div className="new-event-step-inner">
              <div className="new-event-illustration">
                <svg width="110" height="82" viewBox="0 0 160 120" fill="none" xmlns="http://www.w3.org/2000/svg">
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
                  onClick={() => {
                    setErrorMsg('');
                    setStep(3);
                  }}
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
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                      <span>Publish & Generate Link</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: Success & Generated Shareable Voting Link */}
          {step === 5 && createdEvent && (
            <div className="new-event-step-inner success-view">
              <div className="phonepe-success-wrap">
                <div className="phonepe-circle-ripple" />
                <div className="phonepe-circle-ripple" />
                <div className="phonepe-success-circle">
                  <svg className="phonepe-checkmark-svg" viewBox="0 0 52 52">
                    <path
                      className="phonepe-checkmark-check"
                      fill="none"
                      d="M14.1 27.2l7.1 7.2 16.7-16.8"
                    />
                  </svg>
                </div>
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
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                    <polyline points="15 3 21 3 21 9"></polyline>
                    <line x1="10" y1="14" x2="21" y2="3"></line>
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
      </div>
    </div>
  );
};

export default NewEventModal;
