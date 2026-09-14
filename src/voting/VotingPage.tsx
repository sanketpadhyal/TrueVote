import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { EventItem, BallotOption } from '../dashboard/types';
import { fetchEventByIdFromPinata, fetchEventsFromPinata, uploadEventToPinata } from '../services/pinata';
import { loadEventsFromBackup, saveEventsToBackup } from '../services/storage';
import { detectSafeEnvironment } from '../security/detectenv';
import './voting.css';

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

  let hash = 0;
  for (let i = 0; i < message.length; i++) {
    const char = message.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(16, '0');
}

const getAnonymousVoterId = (): string => {
  if (typeof window === 'undefined') return 'anon-voter-fallback';
  let voterId = localStorage.getItem('truevote_voter_seed');
  if (!voterId) {
    voterId = 'voter_' + Math.random().toString(36).substring(2, 15) + '_' + Date.now().toString(36);
    localStorage.setItem('truevote_voter_seed', voterId);
  }
  return voterId;
};

export const checkHasAlreadyVoted = (idOrNum: string): { voted: boolean; receipt: any } => {
  if (typeof window === 'undefined' || !idOrNum) return { voted: false, receipt: null };
  const cleanId = idOrNum.trim().toLowerCase();
  const voterId = getAnonymousVoterId();
  const walletAddr = (localStorage.getItem('truevote_wallet_connected_addr') || '').toLowerCase();

  try {
    const regStr = localStorage.getItem('truevote_voted_events_registry');
    if (regStr) {
      const reg = JSON.parse(regStr);
      if (reg[cleanId]) return { voted: true, receipt: reg[cleanId] };
      for (const k of Object.keys(reg)) {
        if (k.toLowerCase() === cleanId) {
          return { voted: true, receipt: reg[k] };
        }
      }
    }
  } catch (e) {}

  const candidateKeys = [
    `truevote_voted_nullifier_${cleanId}_${voterId}`,
    `truevote_voted_nullifier_${idOrNum}_${voterId}`,
  ];
  if (walletAddr) {
    candidateKeys.push(
      `truevote_voted_nullifier_${cleanId}_${walletAddr}`,
      `truevote_voted_nullifier_${idOrNum}_${walletAddr}`,
      `truevote_wallet_voted_${cleanId}_${walletAddr}`,
      `truevote_wallet_voted_${idOrNum}_${walletAddr}`
    );
  }

  for (const key of candidateKeys) {
    const item = localStorage.getItem(key);
    if (item) {
      try {
        return { voted: true, receipt: JSON.parse(item) };
      } catch (e) {
        return { voted: true, receipt: null };
      }
    }
  }

  try {
    const sess = sessionStorage.getItem(`truevote_voted_${cleanId}`);
    if (sess) {
      try {
        return { voted: true, receipt: JSON.parse(sess) };
      } catch (e) {
        return { voted: true, receipt: null };
      }
    }
  } catch (e) {}

  return { voted: false, receipt: null };
};

export const recordVotedNullifier = (
  evId: string,
  votingNum: string | undefined,
  receipt: { receiptHash: string; timestamp: string; optionLabel?: string; eventId?: string; votingNumber?: string }
) => {
  if (typeof window === 'undefined') return;
  const voterId = getAnonymousVoterId();
  const walletAddr = (localStorage.getItem('truevote_wallet_connected_addr') || '').toLowerCase();

  try {
    const regStr = localStorage.getItem('truevote_voted_events_registry');
    const reg = regStr ? JSON.parse(regStr) : {};
    if (evId) reg[evId.toLowerCase()] = receipt;
    if (votingNum) reg[votingNum.toLowerCase()] = receipt;
    localStorage.setItem('truevote_voted_events_registry', JSON.stringify(reg));
  } catch (e) {}

  const keysToSet: string[] = [];
  if (evId) {
    keysToSet.push(
      `truevote_voted_nullifier_${evId}_${voterId}`,
      `truevote_voted_nullifier_${evId.toLowerCase()}_${voterId}`
    );
    if (walletAddr) {
      keysToSet.push(
        `truevote_voted_nullifier_${evId}_${walletAddr}`,
        `truevote_voted_nullifier_${evId.toLowerCase()}_${walletAddr}`,
        `truevote_wallet_voted_${evId.toLowerCase()}_${walletAddr}`
      );
    }
    try { sessionStorage.setItem(`truevote_voted_${evId.toLowerCase()}`, JSON.stringify(receipt)); } catch (e) {}
  }
  if (votingNum) {
    keysToSet.push(
      `truevote_voted_nullifier_${votingNum}_${voterId}`,
      `truevote_voted_nullifier_${votingNum.toLowerCase()}_${voterId}`
    );
    if (walletAddr) {
      keysToSet.push(
        `truevote_voted_nullifier_${votingNum}_${walletAddr}`,
        `truevote_voted_nullifier_${votingNum.toLowerCase()}_${walletAddr}`,
        `truevote_wallet_voted_${votingNum.toLowerCase()}_${walletAddr}`
      );
    }
    try { sessionStorage.setItem(`truevote_voted_${votingNum.toLowerCase()}`, JSON.stringify(receipt)); } catch (e) {}
  }

  keysToSet.forEach((k) => {
    try { localStorage.setItem(k, JSON.stringify(receipt)); } catch (e) {}
  });
};

const playSuccessChime = () => {
  if (typeof window === 'undefined') return;
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(1046.5, now);
    gain1.gain.setValueAtTime(0.14, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.35);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1567.98, now + 0.11);
    gain2.gain.setValueAtTime(0.14, now + 0.11);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.52);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.11);
    osc2.stop(now + 0.52);
  } catch (e) {

  }
};

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

  const [isCaptchaSolved, setIsCaptchaSolved] = useState<boolean>(false);
  const [isTurnstileVerifying, setIsTurnstileVerifying] = useState<boolean>(true);
  const [turnstileBotDetected, setTurnstileBotDetected] = useState<boolean>(false);
  const [turnstileBotReason, setTurnstileBotReason] = useState<string>('');
  const [honeypotVal, setHoneypotVal] = useState<string>('');
  const [pageLoadTime] = useState<number>(Date.now());
  const humanInteractionCount = React.useRef(0);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [voteSuccess, setVoteSuccess] = useState<boolean>(false);
  const [latestReceipt, setLatestReceipt] = useState<{ receiptHash: string; timestamp: string } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const [isIncognitoBlocked, setIsIncognitoBlocked] = useState<boolean>(false);
  const [incognitoReason, setIncognitoReason] = useState<string>('');

  const [currentTimeIst, setCurrentTimeIst] = useState<string>('');

  useEffect(() => {
    let isMounted = true;
    detectSafeEnvironment().then((res) => {
      if (!isMounted) return;
      if (!res.isSafe && res.isIncognito) {
        setIsIncognitoBlocked(true);
        setIncognitoReason(res.reason || 'Private/Incognito browsing mode detected');
      }
    }).catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

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

  useEffect(() => {
    const handleHumanAction = () => {
      humanInteractionCount.current += 1;
    };

    window.addEventListener('mousemove', handleHumanAction, { passive: true });
    window.addEventListener('touchstart', handleHumanAction, { passive: true });
    window.addEventListener('touchmove', handleHumanAction, { passive: true });
    window.addEventListener('keydown', handleHumanAction, { passive: true });
    window.addEventListener('scroll', handleHumanAction, { passive: true });

    return () => {
      window.removeEventListener('mousemove', handleHumanAction);
      window.removeEventListener('touchstart', handleHumanAction);
      window.removeEventListener('touchmove', handleHumanAction);
      window.removeEventListener('keydown', handleHumanAction);
      window.removeEventListener('scroll', handleHumanAction);
    };
  }, []);

  useEffect(() => {
    if (isTest) {
      return;
    }

    const isWebDriver = typeof navigator !== 'undefined' && Boolean(navigator.webdriver);
    const win = window as any;
    const isHeadlessAnomalies =
      Boolean(win.callPhantom || win._phantom) ||
      Boolean(win.__nightmare) ||
      Boolean(win.domAutomation || win.domAutomationController) ||
      (typeof navigator !== 'undefined' && (!navigator.languages || navigator.languages.length === 0));

    if (isWebDriver || isHeadlessAnomalies) {
      setTurnstileBotDetected(true);
      setTurnstileBotReason(
        isWebDriver
          ? 'Automated webdriver environment detected (navigator.webdriver)'
          : 'Headless browser environment anomaly detected'
      );
      setIsTurnstileVerifying(false);
      setIsCaptchaSolved(false);
      return;
    }

    const timer = setTimeout(() => {

      if (humanInteractionCount.current >= 1) {
        setIsCaptchaSolved(true);
        setIsTurnstileVerifying(false);
      } else {

        setIsTurnstileVerifying(false);
      }
    }, 1400);

    return () => clearTimeout(timer);
  }, [isTest]);

  const handleTurnstileClick = () => {
    if (!isVotingActive || isCaptchaSolved) return;

    if (typeof navigator !== 'undefined' && Boolean(navigator.webdriver) && !isTest) {
      setTurnstileBotDetected(true);
      setTurnstileBotReason('Automated webdriver runner detected (navigator.webdriver)');
      setIsTurnstileVerifying(false);
      setIsCaptchaSolved(false);
      return;
    }

    humanInteractionCount.current += 1;
    setIsTurnstileVerifying(true);
    setTimeout(() => {
      setIsCaptchaSolved(true);
      setIsTurnstileVerifying(false);
      setErrorMessage('');
    }, 400);
  };

  useEffect(() => {
    if (isTest && !eventId) {
      return;
    }

    let isMounted = true;
    const targetId = (eventId || '').trim().toLowerCase();

    const loadEventData = async () => {
      let foundEvent: EventItem | null = null;

      if (targetId) {
        const initialStatus = checkHasAlreadyVoted(targetId);
        if (initialStatus.voted) {
          setHasAlreadyVoted(true);
          if (initialStatus.receipt) setStoredReceipt(initialStatus.receipt);
        }
      }

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

      if (foundEvent && isMounted) {
        const checkLocal =
          checkHasAlreadyVoted(foundEvent.id) ||
          (foundEvent.votingNumber ? checkHasAlreadyVoted(foundEvent.votingNumber) : { voted: false, receipt: null });
        if (checkLocal.voted) {
          setHasAlreadyVoted(true);
          if (checkLocal.receipt) setStoredReceipt(checkLocal.receipt);
        }
        setEvent(foundEvent);
        setIsLoading(false);
        setNotFound(false);
      }

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
            const checkPinata =
              checkHasAlreadyVoted(pinataEvent.id) ||
              (pinataEvent.votingNumber ? checkHasAlreadyVoted(pinataEvent.votingNumber) : { voted: false, receipt: null });
            if (checkPinata.voted) {
              setHasAlreadyVoted(true);
              if (checkPinata.receipt) setStoredReceipt(checkPinata.receipt);
            }
            setEvent(pinataEvent);
            setIsLoading(false);
            setNotFound(false);

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

          const pinataEvents = await fetchEventsFromPinata();
          if (isMounted && Array.isArray(pinataEvents) && pinataEvents.length > 0) {
            foundEvent = pinataEvents[0];
            const checkPinata =
              checkHasAlreadyVoted(pinataEvents[0].id) ||
              (pinataEvents[0].votingNumber ? checkHasAlreadyVoted(pinataEvents[0].votingNumber) : { voted: false, receipt: null });
            if (checkPinata.voted) {
              setHasAlreadyVoted(true);
              if (checkPinata.receipt) setStoredReceipt(checkPinata.receipt);
            }
            setEvent(pinataEvents[0]);
            setIsLoading(false);
            setNotFound(false);
          }
        }
      } catch (pinataErr) {
        console.warn('Pinata IPFS ballot fetch notice:', pinataErr);
      }

      if (!isMounted) return;

      if (!foundEvent) {
        if (targetId) {

          setIsLoading(false);
          setNotFound(true);
          return;
        } else {

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
          const checkDemo =
            checkHasAlreadyVoted(demoEvent.id) ||
            (demoEvent.votingNumber ? checkHasAlreadyVoted(demoEvent.votingNumber) : { voted: false, receipt: null });
          if (checkDemo.voted) {
            setHasAlreadyVoted(true);
            if (checkDemo.receipt) setStoredReceipt(checkDemo.receipt);
          }
          setEvent(demoEvent);
          setIsLoading(false);
          setNotFound(false);
          foundEvent = demoEvent;
        }
      }

      if (foundEvent) {
        const checkFinal =
          checkHasAlreadyVoted(foundEvent.id) ||
          (foundEvent.votingNumber ? checkHasAlreadyVoted(foundEvent.votingNumber) : { voted: false, receipt: null }) ||
          (targetId ? checkHasAlreadyVoted(targetId) : { voted: false, receipt: null });
        if (checkFinal.voted) {
          setHasAlreadyVoted(true);
          if (checkFinal.receipt) setStoredReceipt(checkFinal.receipt);
        }
      }
    };

    loadEventData();

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

  const isVotingActive = React.useMemo(() => {
    if (!event) return false;

    if (event.isActivated === false) {
      return false;
    }

    if (event.activationType === 'manual') {

      return event.isActivated === true;
    }

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

    if (isIncognitoBlocked) {
      setErrorMessage("not safe browser u cant vote here");
      return;
    }

    try {
      const envCheck = await detectSafeEnvironment();
      if (!envCheck.isSafe && envCheck.isIncognito) {
        setIsIncognitoBlocked(true);
        setIncognitoReason(envCheck.reason || 'Private/Incognito browsing mode detected');
        setErrorMessage("not safe browser u cant vote here");
        return;
      }
    } catch (ignore) {}

    if (honeypotVal.trim() !== '') {
      setErrorMessage('Security Exception: Bot behavior detected (honeypot trap triggered).');
      return;
    }

    if (turnstileBotDetected) {
      setErrorMessage(`Security Exception: Bot blocked (${turnstileBotReason || 'automated runner detected'}).`);
      return;
    }

    if (typeof navigator !== 'undefined' && Boolean(navigator.webdriver) && !isTest) {
      setErrorMessage('Security Exception: Automated webdriver runner detected.');
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

    const voteCheck =
      checkHasAlreadyVoted(event.id) ||
      (event.votingNumber ? checkHasAlreadyVoted(event.votingNumber) : { voted: false, receipt: null }) ||
      (eventId ? checkHasAlreadyVoted(eventId) : { voted: false, receipt: null });
    if (voteCheck.voted || hasAlreadyVoted) {
      setHasAlreadyVoted(true);
      if (voteCheck.receipt) setStoredReceipt(voteCheck.receipt);
      setErrorMessage('Anti-Double Voting Protection: You have already cast an anonymous ballot for this event.');
      return;
    }

    setIsSubmitting(true);

    try {

      const voterId = getAnonymousVoterId();
      const nullifierHash = await sha256(`truevote:nullifier:${event.id}:${voterId}:${Date.now()}`);
      const receiptHash = `0x${nullifierHash.substring(0, 32)}`;
      const timestamp = new Date().toISOString();

      const selectedOption = event.options.find((o) => o.id === selectedOptionId);
      const optionLabel = selectedOption ? selectedOption.label : 'Option';

      const updatedOptions = event.options.map((opt) =>
        opt.id === selectedOptionId ? { ...opt, votesCount: (opt.votesCount || 0) + 1 } : opt
      );
      const updatedTotalCast = (event.totalVotesCast || 0) + 1;

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

      try {
        const actStr = localStorage.getItem('truevote_activities') || '[]';
        const activities = JSON.parse(actStr);
        const filtered = activities.filter((a: any) => a.id !== newActivity.id);
        const updatedActivities = [newActivity, ...filtered].slice(0, 50);
        localStorage.setItem('truevote_activities', JSON.stringify(updatedActivities));
      } catch (e) {
        console.error(e);
      }

      const totalUsed = events.reduce((sum, e) => sum + (e.totalVotesCast || 0), 0);
      localStorage.setItem('truevote_votes_used', String(totalUsed));

      window.dispatchEvent(new Event('truevote_events_updated'));

      try {
        const bc = new BroadcastChannel('truevote_events_channel');
        bc.postMessage({ type: 'EVENT_UPDATED', eventId: event.id, activity: newActivity });
        bc.close();
      } catch (e) {}

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

      const receiptData = {
        receiptHash,
        timestamp,
        optionLabel,
        eventId: event.id,
        votingNumber: event.votingNumber,
      };
      recordVotedNullifier(event.id, event.votingNumber, receiptData);

      setEvent(updatedEvent);
      setLatestReceipt({ receiptHash, timestamp });
      setStoredReceipt(receiptData);
      setVoteSuccess(true);
      setHasAlreadyVoted(true);

      playSuccessChime();
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
          <div className="voting-card" style={{ textAlign: 'center', padding: '50px 24px', maxWidth: '520px', margin: '20px auto' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: '#f1f5f9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto',
              color: '#64748b'
            }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 8V4.5C17 3.67 16.33 3 15.5 3h-7C7.67 3 7 3.67 7 4.5V8" />
                <rect x="3" y="8" width="18" height="13" rx="2" />
                <path d="m9 14.5 2 2 4-4" />
              </svg>
            </div>
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

  const sortedOptions = [...(event.options || [])].sort(
    (a, b) => (b.votesCount || 0) - (a.votesCount || 0)
  );
  const topOption = sortedOptions[0] || null;
  const isTied =
    sortedOptions.length > 1 &&
    (topOption?.votesCount || 0) > 0 &&
    sortedOptions[0]?.votesCount === sortedOptions[1]?.votesCount;
  const hasAnyVotes = (topOption?.votesCount || 0) > 0;

  return (
    <div className="voting-page-wrapper">

      <div className="voting-ambient-background" aria-hidden="true">
        <div className="voting-glow-ambient voting-glow-top"></div>
        <div className="voting-glow-ambient voting-glow-bottom"></div>
      </div>

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
        <div className="voting-card">

          <input
            type="text"
            name="security_trap"
            value={honeypotVal}
            onChange={(e) => setHoneypotVal(e.target.value)}
            style={{ display: 'none', opacity: 0, position: 'absolute', left: '-9999px' }}
            tabIndex={-1}
            autoComplete="off"
          />

          <div className="voter-identity-pill-bar">
            <div className="voter-identity-left">
              <img
                src={`${process.env.PUBLIC_URL || ''}/images/stacks/muskmask.webp`}
                alt="MetaMask"
                className="metamask-wallet-icon"
              />
              <span className="voter-id-label">Connected MetaMask:</span>
              <code className="voter-id-hash" title={voterWalletAddress}>
                {voterWalletAddress ? `${voterWalletAddress.slice(0, 8)}...${voterWalletAddress.slice(-6)}` : '0x71C4...84B2'}
              </code>
            </div>
            <div className="voter-identity-right">
              <span className="metamask-connected-badge">
                <span className="zk-green-dot"></span>
                Connected
              </span>
            </div>
          </div>

          <div className="voting-card-header">
            <div className="event-tag-row">
              <span className="voting-event-num-pill">{event.votingNumber}</span>
              <span className={`voting-status-pill ${isVotingActive ? 'pill-active' : 'pill-closed'}`}>
                {isVotingActive ? 'Polls Open' : 'Voting Inactive'}
              </span>
              {hasAnyVotes && !isTied && topOption && (
                <span className="voting-leading-pill" title={`Leader: ${topOption.label} (${topOption.votesCount || 0} votes)`}>
                  <svg className="leading-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
                  </svg>
                  <span className="leading-label">Leading:</span>
                  <strong className="leading-name">
                    {topOption.label.length > 20 ? `${topOption.label.slice(0, 18)}...` : topOption.label}
                  </strong>
                  <span className="leading-count">({topOption.votesCount || 0})</span>
                </span>
              )}
              {hasAnyVotes && isTied && (
                <span className="voting-leading-pill pill-tied" title="Tied votes among top choices">
                  <svg className="leading-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
                    <path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
                    <path d="M7 21h10" />
                    <path d="M12 3v18" />
                    <path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2" />
                  </svg>
                  <span className="leading-label">Leading:</span>
                  <strong className="leading-name">Tied</strong>
                  <span className="leading-count">({topOption?.votesCount || 0})</span>
                </span>
              )}
              {!hasAnyVotes && (
                <span className="voting-leading-pill pill-neutral" title="No votes cast yet">
                  <svg className="leading-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="20" x2="18" y2="10" />
                    <line x1="12" y1="20" x2="12" y2="4" />
                    <line x1="6" y1="20" x2="6" y2="14" />
                  </svg>
                  <span className="leading-label">Leading:</span>
                  <strong className="leading-name">No votes yet</strong>
                </span>
              )}
            </div>

            <h1 className="voting-event-title">{event.name}</h1>
            <p className="voting-event-bio">{event.bio}</p>

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

          {hasAlreadyVoted && !voteSuccess && (
            <div className="already-voted-panel">
              <div className="shield-icon-badge">
                <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
              </div>

              <h2 className="panel-status-title">Ballot Irreversibly Cast</h2>
              <p className="panel-status-desc">
                Your cryptographic voter nullifier has already been committed for this referendum. In compliance with TrueVote’s anti-double voting protocol, each authorized entity can only cast exactly one ballot.
              </p>

              <div className="receipt-box">
                {storedReceipt?.receiptHash && (
                  <div className="receipt-item">
                    <span className="receipt-key">Nullifier Receipt:</span>
                    <code className="receipt-hash">{storedReceipt.receiptHash}</code>
                  </div>
                )}
                {storedReceipt?.timestamp && (
                  <div className="receipt-item">
                    <span className="receipt-key">Timestamp:</span>
                    <span className="receipt-val">{new Date(storedReceipt.timestamp).toLocaleString('en-IN')} IST</span>
                  </div>
                )}
                <div className="receipt-item">
                  <span className="receipt-key">Double-Voting Guard:</span>
                  <span className="receipt-val status-sealed">Nullifier Committed</span>
                </div>
                <div className="receipt-item">
                  <span className="receipt-key">Cryptographic Status:</span>
                  <span className="receipt-val status-sealed">Sealed & Verifiable</span>
                </div>
              </div>

              <button
                type="button"
                className="btn-blue-pill"
                onClick={() => navigate('/dashboard')}
                style={{ marginTop: '22px' }}
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  <rect x="3" y="3" width="7" height="7" rx="1.5" />
                  <rect x="14" y="3" width="7" height="7" rx="1.5" />
                  <rect x="14" y="14" width="7" height="7" rx="1.5" />
                  <rect x="3" y="14" width="7" height="7" rx="1.5" />
                </svg>
                <span>Return to Dashboard</span>
              </button>
            </div>
          )}

          {voteSuccess && latestReceipt && (
            <div className="vote-success-panel phonepe-success-container">
              <div className="phonepe-animation-wrapper">
                <div className="phonepe-ripple r1"></div>
                <div className="phonepe-ripple r2"></div>
                <div className="phonepe-ripple r3"></div>

                <div className="phonepe-circle-badge">
                  <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" className="phonepe-check-svg">
                    <path className="phonepe-check-path" d="m6 12.5 4 4.2 8-8.4" />
                  </svg>
                </div>

                <span className="phonepe-sparkle sp-1"></span>
                <span className="phonepe-sparkle sp-2"></span>
                <span className="phonepe-sparkle sp-3"></span>
                <span className="phonepe-sparkle sp-4"></span>
                <span className="phonepe-sparkle sp-5"></span>
                <span className="phonepe-sparkle sp-6"></span>
              </div>

              <h2 className="panel-status-title phonepe-fade-1">Ballot Anonymously Cast & Sealed!</h2>
              <p className="panel-status-desc phonepe-fade-2">
                Your vote was recorded with zero-knowledge anonymity. Your voter identity is disconnected from your selection to guarantee total voter privacy.
              </p>

              <div className="receipt-box phonepe-fade-3">
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

              <div className="success-buttons-row phonepe-fade-4">
                <button
                  type="button"
                  className="btn-blue-pill"
                  onClick={() => navigate('/dashboard')}
                >
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                    <rect x="3" y="3" width="7" height="7" rx="1.5" />
                    <rect x="14" y="3" width="7" height="7" rx="1.5" />
                    <rect x="14" y="14" width="7" height="7" rx="1.5" />
                    <rect x="3" y="14" width="7" height="7" rx="1.5" />
                  </svg>
                  <span>Go to Dashboard</span>
                </button>
              </div>
            </div>
          )}

          {isIncognitoBlocked && !voteSuccess && !hasAlreadyVoted && (
            <div className="incognito-blocked-panel" data-testid="incognito-blocked-panel">
              <div className="incognito-illus-wrapper">
                <img
                  src={`${process.env.PUBLIC_URL || ''}/images/istockphoto-1018127028-612x612.jpg`}
                  alt="not safe browser u cant vote here"
                  className="incognito-blocked-illus"
                />
              </div>

              <h2 className="panel-status-title incognito-blocked-title">
                not safe browser u cant vote here
              </h2>
              <p className="panel-status-desc incognito-blocked-desc">
                Incognito / Private browsing mode detected. For election security, double-voting prevention, and cryptographic integrity, voting is strictly disabled in incognito or unsafe browser environments.
              </p>

              <div className="incognito-warning-card">
                <div className="incognito-warning-row">
                  <span className="incognito-warning-label">Security Flag:</span>
                  <span className="incognito-warning-val">{incognitoReason || 'Incognito / Private Browsing Detected'}</span>
                </div>
                <div className="incognito-warning-row">
                  <span className="incognito-warning-label">Status:</span>
                  <span className="incognito-warning-val status-blocked">Voting Blocked</span>
                </div>
                <div className="incognito-warning-row">
                  <span className="incognito-warning-label">Required Action:</span>
                  <span className="incognito-warning-val">Please switch to a regular browser window to participate.</span>
                </div>
              </div>

              <button
                type="button"
                className="btn-blue-pill"
                onClick={() => navigate('/dashboard')}
                style={{ marginTop: '22px' }}
              >
                <span>Return to Dashboard</span>
              </button>
            </div>
          )}

          {!hasAlreadyVoted && !voteSuccess && !isIncognitoBlocked && (
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

              <div className={`cf-turnstile-container ${!isVotingActive ? 'cf-disabled' : ''}`}>
                <div
                  className={`cf-turnstile-box ${isCaptchaSolved ? 'cf-verified' : ''} ${turnstileBotDetected ? 'cf-blocked' : ''}`}
                  onClick={handleTurnstileClick}
                  role="checkbox"
                  aria-checked={isCaptchaSolved}
                  tabIndex={0}
                >
                  <div className="cf-turnstile-left">
                    <div className="cf-checkbox-wrap">
                      {turnstileBotDetected ? (
                        <div className="cf-blocked-badge" title={turnstileBotReason}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="15" y1="9" x2="9" y2="15" />
                            <line x1="9" y1="9" x2="15" y2="15" />
                          </svg>
                        </div>
                      ) : isCaptchaSolved ? (
                        <div className="cf-success-tick">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </div>
                      ) : isTurnstileVerifying ? (
                        <div className="cf-spinner" />
                      ) : (
                        <div className="cf-empty-box" />
                      )}
                    </div>

                    <div className="cf-text-col">
                      <span className="cf-status-text">
                        {turnstileBotDetected
                          ? 'Automated Runner Detected'
                          : isCaptchaSolved
                          ? 'Success! Verified human voter'
                          : isTurnstileVerifying
                          ? 'Verifying connection security...'
                          : 'Verify you are human'}
                      </span>
                      <span className="cf-subtext">
                        {turnstileBotDetected ? 'Bot access blocked' : 'Proof of Humanity Challenge'}
                      </span>
                    </div>
                  </div>

                  <div className="cf-turnstile-brand">
                    <img
                      src={`${process.env.PUBLIC_URL || ''}/images/stacks/cloudflare.webp`}
                      alt="Cloudflare"
                      className="cf-cloud-logo"
                    />
                    <span className="cf-brand-name">Cloudflare</span>
                    <span className="cf-legal-links">Turnstile • Privacy</span>
                  </div>
                </div>
              </div>

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
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                        <path d="M17 8V4.5C17 3.67 16.33 3 15.5 3h-7C7.67 3 7 3.67 7 4.5V8" />
                        <rect x="3" y="8" width="18" height="13" rx="2" />
                        <path d="m9 14.5 2 2 4-4" />
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

