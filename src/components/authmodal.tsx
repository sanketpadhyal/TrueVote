import React, { useEffect, useState, useRef } from 'react';
import './authmodal.css';

export interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect?: (address: string) => void;
}

const getRealMetaMaskProvider = () => {
  if (typeof window === 'undefined') return null;
  const eth = (window as any).ethereum;
  if (!eth) return null;

  if (eth.providers && Array.isArray(eth.providers)) {

    const realMetaMask = eth.providers.find(
      (p: any) => p.isMetaMask && !p.isPhantom && !p.isBraveWallet && !p.isCoinbaseWallet && !p.isTrust
    );
    if (realMetaMask) return realMetaMask;
    const fallbackMetaMask = eth.providers.find((p: any) => p.isMetaMask);
    if (fallbackMetaMask) return fallbackMetaMask;
  }

  if (eth.isMetaMask) {
    return eth;
  }

  return eth;
};

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onConnect }) => {
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [isClosing, setIsClosing] = useState(false);
  const isClosingRef = React.useRef(false);
  const [status, setStatus] = useState<'idle' | 'connecting' | 'connected' | 'not_installed' | 'error'>('idle');
  const [account, setAccount] = useState<string | null>(() => {
    return localStorage.getItem('truevote_connected_wallet') || null;
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('truevote_connected_wallet');
    if (saved) {
      setAccount(saved);
      setStatus('connected');
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      setIsClosing(false);
      isClosingRef.current = false;
    } else if (shouldRender && !isClosingRef.current) {
      setIsClosing(true);
      isClosingRef.current = true;
      const timer = setTimeout(() => {
        setShouldRender(false);
        setIsClosing(false);
        isClosingRef.current = false;
        setErrorMessage(null);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen, shouldRender]);

  const handleClose = () => {
    if (isClosingRef.current) return;
    setIsClosing(true);
    isClosingRef.current = true;
    setTimeout(() => {
      setShouldRender(false);
      setIsClosing(false);
      isClosingRef.current = false;
      setErrorMessage(null);
      onClose();
    }, 280);
  };

  const handleCloseRef = useRef(handleClose);
  handleCloseRef.current = handleClose;

  useEffect(() => {
    if (!shouldRender) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleCloseRef.current();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [shouldRender]);

  const handleConnectMetaMask = async () => {
    setStatus('connecting');
    setErrorMessage(null);

    const provider = getRealMetaMaskProvider();

    const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    if (!provider || (!provider.isMetaMask && !isMobileDevice)) {
      if (isMobileDevice) {

        const cleanUrl = window.location.href.replace(/^https?:\/\//, '');
        window.open(`https://metamask.app.link/dapp/${cleanUrl}`, '_blank');
        setStatus('idle');
        return;
      }

      setStatus('not_installed');
      return;
    }

    try {
      let accounts: string[] = [];

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

        if (permErr?.code === 4001) {
          setStatus('error');
          setErrorMessage('Connection request was rejected in MetaMask.');
          return;
        }

        accounts = await provider.request({
          method: 'eth_requestAccounts'
        });
      }

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
      className={`auth-modal-overlay ${isClosing ? 'closing' : 'opening'}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <div className={`auth-modal-card ${isClosing ? 'closing' : 'opening'}`}>

        <div className="auth-card-line line-tl" />
        <div className="auth-card-line line-ml" />
        <div className="auth-card-line line-mr" />
        <div className="auth-card-line line-bl" />
        <div className="auth-card-line line-br" />

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

        <div className="auth-logo-wrapper">
          <div className="auth-logo-ambient-glow" />
          <img
            src="/images/logo.png"
            alt="TrueVote Logo"
            className="auth-brand-logo"
          />
        </div>

        <h2 className="auth-modal-title" id="auth-modal-title">
          Welcome to True<span className="auth-brand-accent">Vote</span>
        </h2>
        <p className="auth-modal-subtitle">
          Instant verification, effortless voting
        </p>

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

        {errorMessage && (
          <p className="auth-error-message">{errorMessage}</p>
        )}
      </div>
    </div>
  );
};

export default AuthModal;

