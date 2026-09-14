export const getMetaMaskProvider = () => {
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

export const clearWalletSession = () => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('truevote_connected_wallet');
  localStorage.removeItem('truevote_wallet_connected_addr');
  sessionStorage.removeItem('truevote_wallet_session');
  window.dispatchEvent(new Event('truevote_wallet_disconnected'));
};

export const syncWalletSession = async (onDisconnect?: () => void) => {
  if (typeof window === 'undefined') return;
  const stored = localStorage.getItem('truevote_connected_wallet');
  if (!stored) return;

  const provider = getMetaMaskProvider();
  if (!provider || typeof provider.request !== 'function') return;

  try {
    const accounts: string[] = await provider.request({ method: 'eth_accounts' });
    if (!accounts || accounts.length === 0) {
      clearWalletSession();
      if (onDisconnect) onDisconnect();
      return;
    }

    const current = accounts[0].toLowerCase();
    if (current !== stored.toLowerCase()) {
      localStorage.setItem('truevote_connected_wallet', accounts[0]);
      window.dispatchEvent(new Event('truevote_wallet_changed'));
    }
  } catch (e) {
  }
};

export const setupWalletListeners = (onDisconnect: () => void, onAccountChange?: (newAccount: string) => void) => {
  if (typeof window === 'undefined') return () => {};
  const provider = getMetaMaskProvider();
  if (!provider || typeof provider.on !== 'function') return () => {};

  const handleAccountsChanged = (accounts: string[]) => {
    if (!accounts || accounts.length === 0) {
      clearWalletSession();
      onDisconnect();
    } else {
      const newAccount = accounts[0];
      localStorage.setItem('truevote_connected_wallet', newAccount);
      if (onAccountChange) onAccountChange(newAccount);
      window.dispatchEvent(new Event('truevote_wallet_changed'));
    }
  };

  const handleDisconnect = () => {
    clearWalletSession();
    onDisconnect();
  };

  provider.on('accountsChanged', handleAccountsChanged);
  provider.on('disconnect', handleDisconnect);

  const pollInterval = setInterval(() => {
    syncWalletSession(onDisconnect);
  }, 1500);

  return () => {
    if (provider.removeListener) {
      provider.removeListener('accountsChanged', handleAccountsChanged);
      provider.removeListener('disconnect', handleDisconnect);
    }
    clearInterval(pollInterval);
  };
};
