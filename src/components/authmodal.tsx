import React, { useEffect, useState } from 'react';
import './authmodal.css';

export interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect?: (address: string) => void;
}

// Safely locate MetaMask provider (supporting multiple Web3 wallets & EIP-6963)
const getMetaMaskProvider = () => {
  if (typeof window === 'undefined') return null;
  const eth = (window as any).ethereum;
  if (!eth) return null;
  if (eth.providers && Array.isArray(eth.providers)) {
    return eth.providers.find((p: any) => p.isMetaMask) || eth.providers[0];
  }
  return eth;
};

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onConnect }) => {
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [isAnimatingIn, setIsAnimatingIn] = useState(false);
  const [status, setStatus] = useState<'idle' | 'connecting' | 'connected' | 'not_installed' | 'error'>('idle');
  const [account, setAccount] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Check if wallet is already connected or cached
  useEffect(() => {
    const provider = getMetaMaskProvider();
    if (provider) {
      provider.request({ method: 'eth_accounts' })
        .then((accounts: string[]) => {
          if (accounts && accounts.length > 0) {
            setAccount(accounts[0]);
            setStatus('connected');
            if (onConnect) onConnect(accounts[0]);
          }
        })
        .catch(() => {});

      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts && accounts.length > 0) {
          setAccount(accounts[0]);
          setStatus('connected');
          if (onConnect) onConnect(accounts[0]);
        } else {
          setAccount(null);
          setStatus('idle');
        }
      };

      provider.on?.('accountsChanged', handleAccountsChanged);
      return () => {
        provider.removeListener?.('accountsChanged', handleAccountsChanged);
      };
    }
  }, [onConnect]);

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

  // REAL MetaMask Wallet Access Connection
  const handleConnectMetaMask = async () => {
    setStatus('connecting');
    setErrorMessage(null);

    const provider = getMetaMaskProvider();

    // 1. Real MetaMask Extension is Present in Browser
    if (provider) {
      try {
        const accounts = await provider.request({
          method: 'eth_requestAccounts'
        });

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
        console.error('MetaMask connection error:', err);
        setStatus('error');
        if (err?.code === 4001) {
          setErrorMessage('Connection request rejected in MetaMask.');
        } else if (err?.code === -32002) {
          setErrorMessage('MetaMask request already pending. Please click your extension icon.');
        } else {
          setErrorMessage(err?.message || 'Failed to connect to MetaMask');
        }
      }
      return;
    }

    // 2. Mobile Browser: Open MetaMask Mobile App via Deep Link
    const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (isMobileDevice) {
      const cleanUrl = window.location.href.replace(/^https?:\/\//, '');
      window.open(`https://metamask.app.link/dapp/${cleanUrl}`, '_blank');
      setStatus('idle');
      return;
    }

    // 3. Desktop without MetaMask Extension Installed
    setStatus('not_installed');
  };

  const handleInstallMetaMask = () => {
    window.open('https://metamask.io/download/', '_blank');
  };

  const handleDemoConnect = () => {
    const demoAddr = '0x71C8A9b70836262464731D7D28f4E28A3B29';
    setAccount(demoAddr);
    setStatus('connected');
    localStorage.setItem('truevote_connected_wallet', demoAddr);
    if (onConnect) onConnect(demoAddr);
    setTimeout(() => {
      handleClose();
    }, 1000);
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

        {/* State 1: Wallet Connected */}
        {status === 'connected' ? (
          <div className="auth-connected-container">
            <div className="auth-connected-pill">
              <span className="auth-pulse-dot" />
              <span className="auth-connected-text">
                {account ? `${account.slice(0, 6)}...${account.slice(-4)}` : 'Connected'}
              </span>
            </div>
            <button className="auth-disconnect-btn" onClick={handleDisconnect} type="button">
              Disconnect
            </button>
          </div>
        ) : status === 'not_installed' ? (
          /* State 2: MetaMask Extension Not Installed */
          <div className="auth-not-installed-box">
            <div className="auth-alert-badge">
              <img src="/images/stacks/muskmask.webp" alt="MetaMask" className="auth-alert-icon" />
              <span>MetaMask not detected</span>
            </div>
            <p className="auth-alert-desc">
              Please install MetaMask in your browser to enable secure Web3 voting access.
            </p>
            <button 
              className="auth-install-btn" 
              onClick={handleInstallMetaMask}
              type="button"
            >
              <img src="/images/stacks/muskmask.webp" alt="MetaMask" className="auth-btn-icon" />
              <span>Install MetaMask Extension</span>
            </button>
            <button 
              className="auth-demo-btn" 
              onClick={handleDemoConnect}
              type="button"
            >
              Continue in Demo Mode
            </button>
          </div>
        ) : (
          /* State 3: Normal / Connecting / Error Button */
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
