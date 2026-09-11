import React, { useEffect, useState } from 'react';
import './dialoguebox.css';

interface DialogueBoxProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect?: (address: string) => void;
}

export const DialogueBox: React.FC<DialogueBoxProps> = ({ isOpen, onClose, onConnect }) => {
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [isVisible, setIsVisible] = useState(false);
  const [status, setStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
  const [account, setAccount] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync mount and smooth CSS transition animation
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isOpen) {
      setShouldRender(true);
      timer = setTimeout(() => {
        setIsVisible(true);
      }, 20);
    } else {
      setIsVisible(false);
      timer = setTimeout(() => {
        setShouldRender(false);
        setStatus('idle');
        setErrorMessage(null);
      }, 300);
    }
    return () => clearTimeout(timer);
  }, [isOpen]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      setShouldRender(false);
      setStatus('idle');
      setErrorMessage(null);
      onClose();
    }, 280);
  };

  useEffect(() => {
    if (!shouldRender) return;

    // Prevent background scrolling while modal is open
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Close on Escape key
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
      setErrorMessage(err?.message || 'Connection request rejected');
      setTimeout(() => {
        setStatus('idle');
      }, 3000);
    }
  };

  if (!shouldRender) return null;

  return (
    <div 
      className={`wallet-modal-overlay ${isVisible ? 'active' : ''}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="wallet-dialog-title"
    >
      <div className="wallet-modal-card">
        {/* Subtle Decorative Accent Lines matching modern dev aesthetic */}
        <div className="modal-accent-line line-tl" />
        <div className="modal-accent-line line-ml" />
        <div className="modal-accent-line line-mr" />
        <div className="modal-accent-line line-bl" />
        <div className="modal-accent-line line-br" />

        {/* Minimalist Close '✕' Button */}
        <button 
          className="modal-close-btn" 
          onClick={handleClose} 
          aria-label="Close modal"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Center Brand Emblem */}
        <div className="modal-logo-wrapper">
          <div className="modal-logo-glow" />
          <img 
            src="/images/logo.png" 
            alt="TrueVote Logo" 
            className="modal-brand-logo" 
          />
        </div>

        {/* Modal Title & Subtitle */}
        <h2 className="modal-title" id="wallet-dialog-title">
          Welcome to TrueVote
        </h2>
        <p className="modal-subtitle">
          Instant deployments, effortless scale
        </p>

        {/* Primary Action Button: Continue with MetaMask */}
        {status === 'connected' ? (
          <div className="wallet-connected-pill">
            <span className="pulse-indicator" />
            <span className="connected-text">
              Connected: {account ? `${account.slice(0, 6)}...${account.slice(-4)}` : '0x71C...3B29'}
            </span>
          </div>
        ) : (
          <button 
            className={`wallet-continue-btn ${status === 'connecting' ? 'connecting' : ''}`}
            onClick={handleConnectMetaMask}
            disabled={status === 'connecting'}
          >
            {status === 'connecting' ? (
              <>
                <span className="wallet-btn-spinner" />
                <span>Connecting to MetaMask...</span>
              </>
            ) : (
              <>
                <img 
                  src="/images/stacks/muskmask.png" 
                  alt="MetaMask" 
                  className="wallet-btn-icon" 
                />
                <span>Continue with MetaMask</span>
              </>
            )}
          </button>
        )}

        {/* Error Notification */}
        {errorMessage && (
          <p className="modal-error-message">{errorMessage}</p>
        )}
      </div>
    </div>
  );
};

export default DialogueBox;
