export const MAX_VOTES_PER_DEVICE_PER_MINUTE = 1;
export const MAX_VOTES_PER_DEVICE_PER_HOUR = 3;

export const MAX_BURST_PER_IP_PER_MINUTE = 20;
export const MAX_VOTES_PER_IP_PER_HOUR = 600;

const IP_STORAGE_KEY = 'truevote_ip_rate_tracker';
const DEVICE_STORAGE_KEY = 'truevote_device_rate_tracker';

let cachedIp = null;
let cachedIpTime = 0;

export async function resolveClientIp() {
  if (typeof window === 'undefined') return '127.0.0.1';
  if (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'test') {
    return '127.0.0.1';
  }

  const now = Date.now();
  if (cachedIp && (now - cachedIpTime) < 300000) {
    return cachedIp;
  }

  const stored = sessionStorage.getItem('truevote_resolved_ip');
  if (stored) {
    cachedIp = stored;
    cachedIpTime = now;
    return stored;
  }

  const controllers = [new AbortController(), new AbortController()];
  const timeouts = controllers.map((c) => setTimeout(() => c.abort(), 1800));

  try {
    const res = await Promise.race([
      fetch('https://api64.ipify.org?format=json', { signal: controllers[0].signal })
        .then((r) => (r.ok ? r.json() : Promise.reject(r.statusText)))
        .then((d) => d.ip),
      fetch('https://cloudflare.com/cdn-cgi/trace', { signal: controllers[1].signal })
        .then((r) => (r.ok ? r.text() : Promise.reject(r.statusText)))
        .then((txt) => {
          const match = txt.match(/ip=([^\n]+)/);
          return match ? match[1].trim() : Promise.reject('No IP in trace');
        }),
    ]);

    timeouts.forEach(clearTimeout);

    if (res && typeof res === 'string' && res.length > 3) {
      cachedIp = res;
      cachedIpTime = now;
      sessionStorage.setItem('truevote_resolved_ip', res);
      return res;
    }
  } catch (e) {
    timeouts.forEach(clearTimeout);
  }

  const fallbackIp = '127.0.0.1';
  cachedIp = fallbackIp;
  cachedIpTime = now;
  return fallbackIp;
}

function getStoredTimestamps(key) {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter((t) => typeof t === 'number' && !isNaN(t));
    }
  } catch (e) {}
  return [];
}

function saveTimestamps(key, list) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(list));
  } catch (e) {}
}

export async function checkRateLimit(eventId) {
  if (typeof window === 'undefined') {
    return {
      allowed: true,
      remainingIpVotes: MAX_BURST_PER_IP_PER_MINUTE,
      remainingDeviceVotes: MAX_VOTES_PER_DEVICE_PER_MINUTE,
    };
  }

  const now = Date.now();
  const oneMinuteAgo = now - 60 * 1000;
  const oneHourAgo = now - 60 * 60 * 1000;

  const deviceKey = `${DEVICE_STORAGE_KEY}_${eventId || 'global'}`;
  const deviceHistory = getStoredTimestamps(deviceKey).filter((t) => t > oneHourAgo);
  const deviceRecentMinute = deviceHistory.filter((t) => t > oneMinuteAgo);

  if (deviceRecentMinute.length >= MAX_VOTES_PER_DEVICE_PER_MINUTE) {
    const oldestInMinute = deviceRecentMinute[0];
    const retryAfterSeconds = Math.max(1, Math.ceil((oldestInMinute + 60 * 1000 - now) / 1000));
    return {
      allowed: false,
      reason: `Device rate limit reached. Please wait ${retryAfterSeconds} seconds before attempting another ballot.`,
      remainingIpVotes: 0,
      remainingDeviceVotes: 0,
      retryAfterSeconds,
    };
  }

  if (deviceHistory.length >= MAX_VOTES_PER_DEVICE_PER_HOUR) {
    const oldestInHour = deviceHistory[0];
    const retryAfterSeconds = Math.max(1, Math.ceil((oldestInHour + 60 * 60 * 1000 - now) / 1000));
    return {
      allowed: false,
      reason: 'Device submission quota reached for this hour. Please try again later.',
      remainingIpVotes: 0,
      remainingDeviceVotes: 0,
      retryAfterSeconds,
    };
  }

  const clientIp = await resolveClientIp();
  const ipKey = `${IP_STORAGE_KEY}_${clientIp.replace(/[^a-zA-Z0-9]/g, '_')}`;
  const ipHistory = getStoredTimestamps(ipKey).filter((t) => t > oneHourAgo);
  const ipRecentMinute = ipHistory.filter((t) => t > oneMinuteAgo);

  if (ipRecentMinute.length >= MAX_BURST_PER_IP_PER_MINUTE) {
    const oldestInMinute = ipRecentMinute[0];
    const retryAfterSeconds = Math.max(1, Math.ceil((oldestInMinute + 60 * 1000 - now) / 1000));
    return {
      allowed: false,
      reason: `High burst traffic detected on this Wi-Fi network. Please wait ${retryAfterSeconds} seconds to preserve network integrity.`,
      remainingIpVotes: 0,
      remainingDeviceVotes: Math.max(0, MAX_VOTES_PER_DEVICE_PER_MINUTE - deviceRecentMinute.length),
      retryAfterSeconds,
      clientIp,
    };
  }

  if (ipHistory.length >= MAX_VOTES_PER_IP_PER_HOUR) {
    return {
      allowed: false,
      reason: 'Network voting capacity reached on this shared connection. Please try again shortly.',
      remainingIpVotes: 0,
      remainingDeviceVotes: 0,
      clientIp,
    };
  }

  return {
    allowed: true,
    remainingIpVotes: Math.max(0, MAX_BURST_PER_IP_PER_MINUTE - ipRecentMinute.length),
    remainingDeviceVotes: Math.max(0, MAX_VOTES_PER_DEVICE_PER_MINUTE - deviceRecentMinute.length),
    clientIp,
  };
}

export async function recordSuccessfulVote(eventId) {
  if (typeof window === 'undefined') return;

  const now = Date.now();
  const oneHourAgo = now - 60 * 60 * 1000;

  const deviceKey = `${DEVICE_STORAGE_KEY}_${eventId || 'global'}`;
  const deviceHistory = getStoredTimestamps(deviceKey).filter((t) => t > oneHourAgo);
  deviceHistory.push(now);
  saveTimestamps(deviceKey, deviceHistory);

  try {
    const clientIp = await resolveClientIp();
    const ipKey = `${IP_STORAGE_KEY}_${clientIp.replace(/[^a-zA-Z0-9]/g, '_')}`;
    const ipHistory = getStoredTimestamps(ipKey).filter((t) => t > oneHourAgo);
    ipHistory.push(now);
    saveTimestamps(ipKey, ipHistory);
  } catch (e) {}
}
