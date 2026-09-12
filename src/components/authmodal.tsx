import React, { useEffect, useState } from 'react';
import './authmodal.css';

export interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect?: (address: string) => void;
}

// Safely locate genuine MetaMask provider (distinguishing from Phantom/Coinbase/Brave hijackers)
const getRealMetaMaskProvider = () => {
  if (typeof window === 'undefined') return null;
  const eth = (window as any).ethereum;
  if (!eth) return null;

  // Multi-wallet EIP-6963 / window.ethereum.providers array
  if (eth.providers && Array.isArray(eth.providers)) {
    // Specifically search for MetaMask that is NOT Phantom, Coinbase, Brave, or Trust
    const realMetaMask = eth.providers.find(
      (p: any) => p.isMetaMask && !p.isPhantom && !p.isBraveWallet && !p.isCoinbaseWallet && !p.isTrust
    );
    if (realMetaMask) return realMetaMask;
    const fallbackMetaMask = eth.providers.find((p: any) => p.isMetaMask);
    if (fallbackMetaMask) return fallbackMetaMask;
  }

  // Single provider check
  if (eth.isMetaMask) {
    return eth;
  }

  return eth;
};

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onConnect }) => {
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [isAnimatingIn, setIsAnimatingIn] = useState(false);
  const [status, setStatus] = useState<'idle' | 'connecting' | 'connected' | 'not_installed' | 'error'>('idle');
  const [account, setAccount] = useState<string | null>(() => {
    return localStorage.getItem('truevote_connected_wallet') || null;
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Synchronize internal account state when localStorage or onConnect changes
  useEffect(() => {
    const saved = localStorage.getItem('truevote_connected_wallet');
    if (saved) {
      setAccount(saved);
      setStatus('connected');
    }
  }, []);

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
        setErrorMessage(null);
      }, 360);
    }
    return () => clearTimeout(timer);
  }, [isOpen]);

  const handleClose = () => {
    setIsAnimatingIn(false);
    setTimeout(() => {
      setShouldRender(false);
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

  // REAL METAMASK WALLET CONNECTION HANDLER
  const handleConnectMetaMask = async () => {
    setStatus('connecting');
    setErrorMessage(null);

    const provider = getRealMetaMaskProvider();

    // Check if on mobile device
    const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    if (!provider || (!provider.isMetaMask && !isMobileDevice)) {
      if (isMobileDevice) {
        // Redirect to MetaMask Mobile app directly
        const cleanUrl = window.location.href.replace(/^https?:\/\//, '');
        window.open(`https://metamask.app.link/dapp/${cleanUrl}`, '_blank');
        setStatus('idle');
        return;
      }
      // MetaMask extension is not installed in desktop browser
      setStatus('not_installed');
      return;
    }

    try {
      let accounts: string[] = [];

      // Method 1: Request permissions to explicitly trigger the real MetaMask prompt UI
      try {
        const permissions = await provider.request({
          method: 'wallet_requestPermissions',
          params: [{ eth_accounts: {} }]
        });
        const accountsPermission = permissions?.find?.((p: any) => p.parentCapability === 'eth_accounts');
        if (accountsPermission?.caveats?.[0]?.value) {
          accounts = accountsPermission.caveats[0].value;
        }
      } catch (permErr: any) {
        // User explicitly cancelled / rejected the MetaMask popup
        if (permErr?.code === 4001) {
          setStatus('error');
          setErrorMessage('Connection request was rejected in MetaMask.');
          return;
        }
        // Fallback if wallet_requestPermissions is not supported by client
        accounts = await provider.request({
          method: 'eth_requestAccounts'
        });
      }

      // If accounts were not populated by permissions, request directly
      if (!accounts || accounts.length === 0) {
        accounts = await provider.request({
          method: 'eth_requestAccounts'
        });
      }

      if (accounts && accounts.length > 0) {
        const userAddr = accounts[0];
        setAccount(userAddr);
        setStatus('connected');
        localStorage.setItem('truevote_connected_wallet', userAddr);
        if (onConnect) onConnect(userAddr);
        setTimeout(() => {
          handleClose();
        }, 1200);
      } else {
        setStatus('idle');
      }
    } catch (err: any) {
      console.error('Real MetaMask connection error:', err);
      setStatus('error');
      if (err?.code === 4001) {
        setErrorMessage('Connection request was cancelled in MetaMask.');
      } else if (err?.code === -32002) {
        setErrorMessage('MetaMask is already open. Please check your browser extension to approve.');
      } else {
        setErrorMessage(err?.message || 'Could not connect to MetaMask. Please try again.');
      }
    }
  };

  const handleInstallMetaMask = () => {
    window.open('https://metamask.io/download/', '_blank');
  };

  const handleDisconnect = () => {
    setAccount(null);
    setStatus('idle');
    localStorage.removeItem('truevote_connected_wallet');
    if (onConnect) onConnect('');
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

        {/* State 1: Already Connected */}
        {status === 'connected' && account ? (
          <div className="auth-connected-container">
            <div className="auth-connected-pill">
              <span className="auth-pulse-dot" />
              <span className="auth-connected-text">
                Connected: {account.slice(0, 6)}...{account.slice(-4)}
              </span>
            </div>
            <button 
              className="auth-continue-btn" 
              onClick={handleConnectMetaMask}
              type="button"
              style={{ marginTop: '0.45rem' }}
            >
              <img 
                src="/images/stacks/muskmask.webp" 
                alt="MetaMask" 
                className="auth-btn-icon" 
              />
              <span>Switch or Reconnect MetaMask</span>
            </button>
            <button className="auth-disconnect-btn" onClick={handleDisconnect} type="button">
              Disconnect Wallet
            </button>
          </div>
        ) : status === 'not_installed' ? (
          /* State 2: MetaMask Extension is NOT installed in browser */
          <div className="auth-not-installed-box">
            <div className="auth-alert-badge">
              <img src="/images/stacks/muskmask.webp" alt="MetaMask" className="auth-alert-icon" />
              <span>MetaMask extension not found</span>
            </div>
            <p className="auth-alert-desc">
              MetaMask is required to access your Web3 ballot. Please install the extension in your browser.
            </p>
            <button 
              className="auth-install-btn" 
              onClick={handleInstallMetaMask}
              type="button"
            >
              <img src="/images/stacks/muskmask.webp" alt="MetaMask" className="auth-btn-icon" />
              <span>Install MetaMask</span>
            </button>
          </div>
        ) : (
          /* State 3: Connect with MetaMask Button */
          <button 
            className={`auth-continue-btn ${status === 'connecting' ? 'connecting' : ''}`}
            onClick={handleConnectMetaMask}
            disabled={status === 'connecting'}
            type="button"
          >
            {status === 'connecting' ? (
              <>
                <span className="auth-btn-spinner" />
                <span>Waiting for MetaMask...</span>
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
