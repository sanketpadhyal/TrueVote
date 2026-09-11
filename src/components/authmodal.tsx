import React, { useEffect, useState } from 'react';
import './authmodal.css';

export interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect?: (address: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onConnect }) => {
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [isAnimatingIn, setIsAnimatingIn] = useState(false);
  const [status, setStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
  const [account, setAccount] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Manage mount lifecycle and smooth animated entrance
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isOpen) {
      setShouldRender(true);
      timer = setTimeout(() => {
        setIsAnimatingIn(true);
      }, 30);
    } else {
      setIsAnimatingIn(false);
      timer = setTimeout(() => {
        setShouldRender(false);
        setStatus('idle');
        setErrorMessage(null);
      }, 360);
    }
    return () => clearTimeout(timer);
  }, [isOpen]);

  const handleClose = () => {
    setIsAnimatingIn(false);
    setTimeout(() => {
      setShouldRender(false);
      setStatus('idle');
      setErrorMessage(null);
      onClose();
    }, 340);
  };

  useEffect(() => {
    if (!shouldRender) return;

    // Prevent background scrolling while modal is active
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

  const handleConnectMetaMask = async () => {
    setStatus('connecting');
    setErrorMessage(null);

    try {
      if (typeof window !== 'undefined' && (window as any).ethereum) {
        const accounts = await (window as any).ethereum.request({
          method: 'eth_requestAccounts'
        });
        if (accounts && accounts.length > 0) {
          const userAddr = accounts[0];
          setAccount(userAddr);
          setStatus('connected');
          if (onConnect) onConnect(userAddr);
          setTimeout(() => {
            handleClose();
          }, 1200);
        } else {
          setStatus('idle');
        }
      } else {
        // Fallback for non-Web3 browsers or demo mode
        setTimeout(() => {
          const demoAddr = '0x71C8A9b70836262464731D7D28f4E28A3B29';
          setAccount(demoAddr);
          setStatus('connected');
          if (onConnect) onConnect(demoAddr);
          setTimeout(() => {
            handleClose();
          }, 1300);
        }, 900);
      }
    } catch (err: any) {
      console.error('MetaMask connection error:', err);
      setStatus('error');
      setErrorMessage(err?.message || 'Connection request cancelled');
      setTimeout(() => {
        setStatus('idle');
      }, 3200);
    }
  };

  if (!shouldRender) return null;

  return (
    <div 
      className={`auth-modal-overlay ${isAnimatingIn ? 'active' : ''}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <div className={`auth-modal-card ${isAnimatingIn ? 'visible' : ''}`}>
        {/* Subtle Decorative Geometric Lines */}
        <div className="auth-card-line line-tl" />
        <div className="auth-card-line line-ml" />
        <div className="auth-card-line line-mr" />
        <div className="auth-card-line line-bl" />
        <div className="auth-card-line line-br" />

        {/* Minimalist Close '✕' Button */}
        <button 
          className="auth-close-btn" 
          onClick={handleClose} 
          aria-label="Close modal"
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Center Brand Emblem with Frosted Glow */}
        <div className="auth-logo-wrapper">
          <div className="auth-logo-ambient-glow" />
          <img 
            src="/images/logo.png" 
            alt="TrueVote Logo" 
            className="auth-brand-logo" 
          />
        </div>

        {/* Modal Title & Subtitle */}
        <h2 className="auth-modal-title" id="auth-modal-title">
          Welcome to True<span className="auth-brand-accent">Vote</span>
        </h2>
        <p className="auth-modal-subtitle">
          Instant verification, effortless voting
        </p>

        {/* Primary Action Button: Continue with MetaMask */}
        {status === 'connected' ? (
          <div className="auth-connected-pill">
            <span className="auth-pulse-dot" />
            <span className="auth-connected-text">
              Connected: {account ? `${account.slice(0, 6)}...${account.slice(-4)}` : '0x71C...3B29'}
            </span>
          </div>
        ) : (
          <button 
            className={`auth-continue-btn ${status === 'connecting' ? 'connecting' : ''}`}
            onClick={handleConnectMetaMask}
            disabled={status === 'connecting'}
          >
            {status === 'connecting' ? (
              <>
                <span className="auth-btn-spinner" />
                <span>Connecting to MetaMask...</span>
              </>
            ) : (
              <>
                <img 
                  src="/images/stacks/muskmask.webp" 
                  alt="MetaMask" 
                  className="auth-btn-icon" 
                />
                <span>Continue with MetaMask</span>
              </>
            )}
          </button>
        )}

        {/* Error Notification */}
        {errorMessage && (
          <p className="auth-error-message">{errorMessage}</p>
        )}
      </div>
    </div>
  );
};

export default AuthModal;
