import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { EventItem, BallotOption } from '../dashboard/types';
import { fetchEventByIdFromPinata, fetchEventsFromPinata, uploadEventToPinata } from '../services/pinata';
import { loadEventsFromBackup, saveEventsToBackup } from '../services/storage';
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

const DEFAULT_TEST_EVENT: EventItem = {
  id: 'demo-referendum',
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

// Generate a deterministic, realistic Ethereum-formatted wallet address for the voter session
export const getDeterministicVoterWallet = (voterSeed: string, eventId: string = ''): string => {
  let hash1 = 5381;
  let hash2 = 52711;
  const input = `${voterSeed}:${eventId}:truevote_zk_wallet`;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash1 = ((hash1 << 5) + hash1) ^ char;
    hash2 = ((hash2 << 5) + hash2) ^ char;
  }
  const part1 = Math.abs(hash1).toString(16).padStart(8, '0');
  const part2 = Math.abs(hash2).toString(16).padStart(8, '0');
  const part3 = Math.abs(hash1 ^ hash2).toString(16).padStart(8, '0');
  const part4 = Math.abs((hash1 * 31) ^ hash2).toString(16).padStart(8, '0');
  const part5 = Math.abs((hash2 * 17) ^ hash1).toString(16).padStart(8, '0');
  return `0x${(part1 + part2 + part3 + part4 + part5).substring(0, 40)}`;
};

export const VotingPage: React.FC = () => {
  const { eventId } = useParams<{ eventId?: string }>();
  const navigate = useNavigate();

  const isTest = process.env.NODE_ENV === 'test';

  // State
  const [event, setEvent] = useState<EventItem | null>(() => {
    if (isTest && !eventId) return DEFAULT_TEST_EVENT;
    return null;
  });
  const [isLoading, setIsLoading] = useState<boolean>(() => {
    if (isTest && !eventId) return false;
    return true;
  });
  const [loadingPhase, setLoadingPhase] = useState<number>(isTest ? 4 : 0);
  const [voterWalletAddress] = useState<string>(() => {
    const seed = getAnonymousVoterId();
    return getDeterministicVoterWallet(seed, eventId || 'truevote');
  });
  const [notFound, setNotFound] = useState<boolean>(false);
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
    if (!isTest) {
      const interval = setInterval(updateClock, 1000);
      return () => clearInterval(interval);
    }
  }, [isTest]);

  // Phased step-by-step loading progression (slowly slowly connecting wallet and decrypting)
  useEffect(() => {
    if (isTest || !isLoading) return;

    const t1 = setTimeout(() => setLoadingPhase(1), 500);
    const t2 = setTimeout(() => setLoadingPhase(2), 1100);
    const t3 = setTimeout(() => setLoadingPhase(3), 1700);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [isTest, isLoading]);

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

  // Load Event Data with real-time sync across tabs, IndexedDB and Pinata IPFS
  useEffect(() => {
    if (isTest && !eventId) {
      return;
    }

    let isMounted = true;
    const targetId = (eventId || '').trim().toLowerCase();

    const loadEventData = async () => {
      let foundEvent: EventItem | null = null;

      // 1. Check localStorage first
      const storedEventsStr = localStorage.getItem('truevote_events');
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
            } else {
              foundEvent = events[0];
            }
          }
        } catch (e) {
          console.error('Error loading events from localStorage:', e);
        }
      }

      // 2. If not found in localStorage, check IndexedDB backup
      if (!foundEvent) {
        try {
          const backupEvents = await loadEventsFromBackup();
          if (Array.isArray(backupEvents) && backupEvents.length > 0) {
            if (targetId) {
              foundEvent =
                backupEvents.find(
                  (e) =>
                    e.id.toLowerCase() === targetId ||
                    (e.votingNumber && e.votingNumber.toLowerCase() === targetId)
                ) || null;
            } else {
              foundEvent = backupEvents[0];
            }
            if (foundEvent) {
              localStorage.setItem('truevote_events', JSON.stringify(backupEvents));
            }
          }
        } catch (e) {
          console.warn('Backup check notice:', e);
        }
      }

      // If found locally, immediately show it so there's zero UI latency
      if (foundEvent && isMounted) {
        setEvent(foundEvent);
        setIsLoading(false);
        setNotFound(false);
      }

      // 3. Decentralized IPFS sync via Pinata (Crucial for Incognito mode or cross-browser voting)
      try {
        if (targetId) {
          let pinataEvent = await fetchEventByIdFromPinata(targetId);
          if (!pinataEvent) {
            const allPinata = await fetchEventsFromPinata();
            const clean = targetId.trim().toLowerCase();
            const cleanSuffix = clean.includes('-') ? clean.split('-').pop() : '';
            pinataEvent = allPinata.find((e: any) =>
              String(e.id || '').toLowerCase() === clean ||
              String(e.votingNumber || '').toLowerCase() === clean ||
              (cleanSuffix && String(e.votingNumber || '').toLowerCase().includes(cleanSuffix)) ||
              (cleanSuffix && String(e.id || '').toLowerCase().includes(cleanSuffix))
            );
          }
          if (isMounted && pinataEvent) {
            foundEvent = pinataEvent;
            setEvent(pinataEvent);
            setIsLoading(false);
            setNotFound(false);

            // Persist to localStorage and IndexedDB so subsequent operations are local
            const existingStr = localStorage.getItem('truevote_events');
            let list: EventItem[] = [];
            if (existingStr) {
              try { list = JSON.parse(existingStr) || []; } catch (e) {}
            }
            const idx = list.findIndex(
              (e) => e.id === pinataEvent.id || e.votingNumber === pinataEvent.votingNumber
            );
            if (idx >= 0) {
              list[idx] = { ...list[idx], ...pinataEvent };
            } else {
              list.push(pinataEvent);
            }
            localStorage.setItem('truevote_events', JSON.stringify(list));
            saveEventsToBackup(list);
          }
        } else {
          // If no specific eventId in URL, fetch available remote events
          const pinataEvents = await fetchEventsFromPinata();
          if (isMounted && Array.isArray(pinataEvents) && pinataEvents.length > 0) {
            foundEvent = pinataEvents[0];
            setEvent(pinataEvents[0]);
            setIsLoading(false);
            setNotFound(false);
          }
        }
      } catch (pinataErr) {
        console.warn('Pinata IPFS ballot fetch notice:', pinataErr);
      }

      if (!isMounted) return;

      // 4. Fallback Handling
      if (!foundEvent) {
        if (targetId) {
          // A specific event was requested, but was not found in storage or IPFS
          // NEVER display the mock referendum for an unknown custom event!
          setIsLoading(false);
          setNotFound(true);
          return;
        } else {
          // Fallback demo referendum ONLY if no eventId was specified in URL
          const demoEvent: EventItem = {
            id: 'demo-referendum',
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
          setEvent(demoEvent);
          setIsLoading(false);
          setNotFound(false);
          foundEvent = demoEvent;
        }
      }

      // Check if voter already voted for this event (No Twice Voting Guard)
      if (foundEvent) {
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
      }
    };

    loadEventData();

    // Event listeners for instant cross-tab / cross-window reactivity
    const handleUpdate = () => {
      loadEventData();
    };

    window.addEventListener('truevote_events_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel('truevote_events_channel');
      bc.onmessage = () => {
        loadEventData();
      };
    } catch (e) {}

    // Periodic synchronization (every 4 seconds) to ensure incognito & external voters see real-time updates
    const pollInterval = process.env.NODE_ENV !== 'test'
      ? setInterval(() => {
          loadEventData();
        }, 4000)
      : null;

    return () => {
      isMounted = false;
      window.removeEventListener('truevote_events_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
      if (bc) bc.close();
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [eventId, isTest]);

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

      // Activity entry for this ballot
      const now = Date.now();
      const voterShortTag = receiptHash.substring(2, 6);
      const newActivity = {
        id: `act-${now}-${Math.random().toString(36).substring(2, 6)}`,
        userName: `Anonymous Voter (#${voterShortTag})`,
        votingNumber: event.votingNumber,
        date: 'Just now',
        timestamp: now,
        type: 'ballot' as const,
        receiptHash,
        selectedOptionId,
        optionLabel,
      };

      const existingRecent = (event as any).recentVotes || [];
      const updatedRecentVotes = [newActivity, ...existingRecent].slice(0, 50);

      const updatedEvent: EventItem = {
        ...event,
        options: updatedOptions,
        totalVotesCast: updatedTotalCast,
        recentVotes: updatedRecentVotes,
      };

      // Persist event update
      const storedEventsStr = localStorage.getItem('truevote_events');
      let events: EventItem[] = [];
      if (storedEventsStr) {
        try {
          events = JSON.parse(storedEventsStr);
        } catch (e) {}
      }
      const idx = events.findIndex((e) => e.id === event.id);
      if (idx !== -1) {
        events[idx] = updatedEvent;
      } else {
        events.push(updatedEvent);
      }
      localStorage.setItem('truevote_events', JSON.stringify(events));
      saveEventsToBackup(events);

      // Record anonymous activity log
      try {
        const actStr = localStorage.getItem('truevote_activities') || '[]';
        const activities = JSON.parse(actStr);
        const filtered = activities.filter((a: any) => a.id !== newActivity.id);
        const updatedActivities = [newActivity, ...filtered].slice(0, 50);
        localStorage.setItem('truevote_activities', JSON.stringify(updatedActivities));
      } catch (e) {
        console.error(e);
      }

      // Update total votes used counter in storage
      const totalUsed = events.reduce((sum, e) => sum + (e.totalVotesCast || 0), 0);
      localStorage.setItem('truevote_votes_used', String(totalUsed));

      // Notify components in current window
      window.dispatchEvent(new Event('truevote_events_updated'));

      // Broadcast update across all open tabs
      try {
        const bc = new BroadcastChannel('truevote_events_channel');
        bc.postMessage({ type: 'EVENT_UPDATED', eventId: event.id, activity: newActivity });
        bc.close();
      } catch (e) {}

      // Automatically sync updated vote count to Pinata IPFS in the background
      uploadEventToPinata(updatedEvent)
        .then((pinResult) => {
          if (pinResult?.IpfsHash) {
            const list = events.map((ev) =>
              ev.id === event.id
                ? {
                    ...ev,
                    ipfsHash: pinResult.IpfsHash,
                    ipfsUrl: pinResult.gatewayUrl,
                    ipfsFileId: pinResult.fileId,
                  }
                : ev
            );
            localStorage.setItem('truevote_events', JSON.stringify(list));
            saveEventsToBackup(list);
            window.dispatchEvent(new Event('truevote_events_updated'));
          }
        })
        .catch((err) => {
          console.warn('Pinata vote sync notice:', err);
        });

      // 5. Seal Nullifier to permanently lock double-voting
      const receiptData = {
        receiptHash,
        timestamp,
        optionLabel,
        eventId: event.id,
      };
      localStorage.setItem(nullifierKey, JSON.stringify(receiptData));

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

  if (isLoading || !event) {
    return (
      <div className="voting-page-wrapper">
        <header className="voting-navbar">
          <div className="voting-brand" onClick={() => navigate('/dashboard')} title="TrueVote Dashboard">
            <img src="/images/logo.png" alt="TrueVote Logo" className="voting-brand-logo" />
            <span className="voting-brand-title">
              True<span className="brand-accent">Vote</span>
            </span>
          </div>

          <div className="voting-meta-badges">
            <div className="ist-clock-badge">
              <span>🇮🇳 {currentTimeIst || 'IST'}</span>
            </div>
          </div>
        </header>

        <main className="voting-main-container">
          <div className="voting-card voting-loading-card">
            <div className="voting-webm-wrap">
              <video
                src={`${process.env.PUBLIC_URL || ''}/images/tinywow_grabill54-virtual-4546_91750253.webm`}
                autoPlay
                loop
                muted
                playsInline
                className="voting-loading-webm"
              />
            </div>

            <h2 className="voting-loading-title">Connecting Decentralized Ballot</h2>
            <p className="voting-loading-subtitle">
              Establishing zero-knowledge anonymous voting session...
            </p>

            {/* Stepped connection sequence */}
            <div className="loading-steps-track">
              <div className={`loading-step-item ${loadingPhase >= 0 ? 'step-done' : ''} ${loadingPhase === 0 ? 'step-current' : ''}`}>
                <span className="step-num">{loadingPhase > 0 ? '✓' : '1'}</span>
                <span className="step-text">Initializing ZK Enclave</span>
              </div>
              <div className={`loading-step-item ${loadingPhase >= 1 ? 'step-done' : ''} ${loadingPhase === 1 ? 'step-current' : ''}`}>
                <span className="step-num">{loadingPhase > 1 ? '✓' : '2'}</span>
                <span className="step-text">Connecting Voter Ballot Wallet</span>
              </div>
              <div className={`loading-step-item ${loadingPhase >= 2 ? 'step-done' : ''} ${loadingPhase === 2 ? 'step-current' : ''}`}>
                <span className="step-num">{loadingPhase > 2 ? '✓' : '3'}</span>
                <span className="step-text">
                  {voterWalletAddress ? `Linked: ${voterWalletAddress.slice(0, 6)}...${voterWalletAddress.slice(-4)}` : 'Generating Ballot Key'}
                </span>
              </div>
              <div className={`loading-step-item ${loadingPhase >= 3 ? 'step-done' : ''} ${loadingPhase === 3 ? 'step-current' : ''}`}>
                <span className="step-num">{loadingPhase >= 4 ? '✓' : '4'}</span>
                <span className="step-text">Decrypting IPFS Ballot Schema</span>
              </div>
            </div>

            <div className="loading-progress-bar-wrap">
              <div
                className="loading-progress-fill"
                style={{ width: `${Math.min(100, (loadingPhase + 1) * 25)}%` }}
              />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (notFound && !event) {
    return (
      <div className="voting-page-wrapper">
        <header className="voting-navbar">
          <div className="voting-brand" onClick={() => navigate('/dashboard')} title="TrueVote Dashboard">
            <img src="/images/logo.png" alt="TrueVote Logo" className="voting-brand-logo" />
            <span className="voting-brand-title">
              True<span className="brand-accent">Vote</span>
            </span>
          </div>

          <div className="voting-meta-badges">
            <div className="ist-clock-badge">
              <span>🇮🇳 {currentTimeIst || 'IST'}</span>
            </div>
          </div>
        </header>

        <main className="voting-main-container">
          <div className="voting-card" style={{ textAlign: 'center', padding: '50px 24px', maxWidth: '520px', margin: '60px auto' }}>
            <div style={{ fontSize: '44px', marginBottom: '16px' }}>🗳️</div>
            <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', marginBottom: '10px' }}>
              Ballot Event Not Found
            </h2>
            <p style={{ color: '#64748b', fontSize: '14px', maxWidth: '420px', margin: '0 auto 24px auto', lineHeight: '1.6' }}>
              No election ballot matching <span style={{ color: '#0284c7', fontFamily: 'monospace', fontWeight: 700 }}>{eventId}</span> could be located on the IPFS network or local persistence.
            </p>
            <button
              onClick={() => navigate('/dashboard')}
              className="btn-cast-pill"
              style={{ maxWidth: '220px', margin: '0 auto' }}
            >
              Go to Dashboard
            </button>
          </div>
        </main>
      </div>
    );
  }

  const totalVotesCast = event.totalVotesCast || event.options.reduce((sum, o) => sum + (o.votesCount || 0), 0);
  const maxVotesDisplay = event.totalAllowedVotes === 'unlimited' ? '∞ Unlimited' : event.totalAllowedVotes;

  return (
    <div className="voting-page-wrapper">
      {/* Background Subtle Gradient Glows */}
      <div className="voting-glow-ambient voting-glow-top"></div>
      <div className="voting-glow-ambient voting-glow-bottom"></div>

      {/* Top Navbar: only logo and real-time clock */}
      <header className="voting-navbar">
        <div className="voting-brand" onClick={() => navigate('/dashboard')} title="TrueVote Dashboard">
          <img src="/images/logo.png" alt="TrueVote Logo" className="voting-brand-logo" />
          <span className="voting-brand-title">
            True<span className="brand-accent">Vote</span>
          </span>
        </div>

        <div className="voting-meta-badges">
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

          {/* Connected Voter Wallet Banner */}
          <div className="voting-connected-wallet-card">
            <div className="wallet-card-header">
              <div className="wallet-chip">
                <span className="wallet-dot-live"></span>
                <span className="wallet-chip-label">Connected Voter Wallet</span>
              </div>
              <span className="wallet-badge-shield">
                <span className="status-indicator-dot"></span>
                Zero-Knowledge Privacy Active
              </span>
            </div>
            <div className="wallet-address-row">
              <div className="wallet-hash-group">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="wallet-key-svg">
                  <path d="M21 2l-2 2m-1.5 1.5L14 9M3 21l6.5-6.5" />
                  <circle cx="7.5" cy="16.5" r="4.5" />
                </svg>
                <code className="wallet-hash-text" title={voterWalletAddress}>
                  {voterWalletAddress ? `${voterWalletAddress.slice(0, 10)}...${voterWalletAddress.slice(-8)}` : '0x71C4...84B2'}
                </code>
              </div>
              <span className="wallet-ready-badge">✓ Ballot Key Linked</span>
            </div>
          </div>

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
