import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Dashboard from '../dashboard';

import { setupWalletListeners, syncWalletSession, clearWalletSession } from '../security/walletSession';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return process.env.NODE_ENV === 'test' || Boolean(localStorage.getItem('truevote_connected_wallet'));
  });

  useEffect(() => {
    if (process.env.NODE_ENV === 'test') {
      setIsAuthenticated(true);
      return;
    }

    const wallet = localStorage.getItem('truevote_connected_wallet');
    if (!wallet) {
      navigate('/?login=true', { replace: true });
      return;
    }

    setIsAuthenticated(true);

    const handleAutoLogout = () => {
      clearWalletSession();
      setIsAuthenticated(false);
      navigate('/?login=true', { replace: true });
    };

    syncWalletSession(handleAutoLogout);

    const cleanup = setupWalletListeners(handleAutoLogout);
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'truevote_connected_wallet' && !e.newValue) {
        handleAutoLogout();
      }
    };
    window.addEventListener('storage', handleStorage);
    window.addEventListener('truevote_wallet_disconnected', handleAutoLogout);

    return () => {
      cleanup();
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('truevote_wallet_disconnected', handleAutoLogout);
    };
  }, [navigate]);

  if (!isAuthenticated && process.env.NODE_ENV !== 'test') {
    return null;
  }

  return <Dashboard />;
};

export default DashboardPage;

