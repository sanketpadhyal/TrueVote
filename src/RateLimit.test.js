import { checkRateLimit, recordSuccessfulVote, resolveClientIp, MAX_BURST_PER_IP_PER_MINUTE } from './security/ratelimit';

describe('Rate Limiter Security Module', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  test('resolves fallback client IP in test environment without crashing', async () => {
    const ip = await resolveClientIp();
    expect(ip).toBe('127.0.0.1');
  });

  test('allows legitimate initial vote', async () => {
    const status = await checkRateLimit('event-test-1');
    expect(status.allowed).toBe(true);
    expect(status.remainingDeviceVotes).toBeGreaterThanOrEqual(1);
  });

  test('blocks rapid consecutive votes from the same device in under one minute', async () => {
    await recordSuccessfulVote('event-test-2');
    const status = await checkRateLimit('event-test-2');
    expect(status.allowed).toBe(false);
    expect(status.reason).toMatch(/Device rate limit reached/i);
    expect(status.retryAfterSeconds).toBeGreaterThan(0);
  });

  test('allows multiple distinct devices on same IP up to burst limit', async () => {
    const status = await checkRateLimit('event-test-shared-wifi');
    expect(status.allowed).toBe(true);
    expect(status.remainingIpVotes).toBe(MAX_BURST_PER_IP_PER_MINUTE);
  });
});
