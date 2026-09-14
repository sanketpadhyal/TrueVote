import { clearWalletSession } from './security/walletSession';

describe('Wallet Session Handler', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  test('clearWalletSession removes local and session credentials and fires event', () => {
    localStorage.setItem('truevote_connected_wallet', '0x1234567890123456789012345678901234567890');
    sessionStorage.setItem('truevote_wallet_session', 'active');

    let eventFired = false;
    window.addEventListener('truevote_wallet_disconnected', () => {
      eventFired = true;
    });

    clearWalletSession();

    expect(localStorage.getItem('truevote_connected_wallet')).toBeNull();
    expect(sessionStorage.getItem('truevote_wallet_session')).toBeNull();
    expect(eventFired).toBe(true);
  });
});
