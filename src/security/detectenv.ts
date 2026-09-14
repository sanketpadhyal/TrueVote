export interface IncognitoDetectionResult {
  isPrivate: boolean;
  browserName: string;
}

export interface EnvironmentCheckResult {
  isSafe: boolean;
  isIncognito: boolean;
  isAutomated: boolean;
  reason: string;
  browserName?: string;
}

export async function detectIncognito(): Promise<IncognitoDetectionResult> {
  if (typeof window === 'undefined') {
    return { isPrivate: false, browserName: 'Server' };
  }

  return new Promise<IncognitoDetectionResult>((resolve) => {
    let browserName = 'Unknown';
    let settled = false;

    function finish(isPrivate: boolean, name = browserName): void {
      if (settled) return;
      settled = true;
      resolve({ isPrivate: Boolean(isPrivate), browserName: name });
    }

    setTimeout(() => {
      finish(false);
    }, 1200);

    const ua = navigator.userAgent || '';

    function getEngineID(): number {
      try {
        const neg = parseInt('-1', 10);
        neg.toFixed(neg);
      } catch (e: any) {
        return e.message ? e.message.length : 0;
      }
      return 0;
    }

    const engineId = getEngineID();
    const isSafari = engineId === 44 || engineId === 43;
    const isChrome = engineId === 51 || Boolean((window as any).chrome);
    const isFirefox = engineId === 25 || typeof (window as any).InstallTrigger !== 'undefined';

    function identifyChromium(): string {
      if ((navigator as any).brave !== undefined) return 'Brave';
      if (/Edg\//.test(ua)) return 'Edge';
      if (/OPR\//.test(ua)) return 'Opera';
      if (/Chrome\//.test(ua)) return 'Chrome';
      return 'Chromium';
    }

    // 1. Safari Private Browsing Test
    if (isSafari || (/Safari/.test(ua) && !/Chrome/.test(ua))) {
      browserName = 'Safari';
      try {
        if (navigator.storage && typeof (navigator.storage as any).getDirectory === 'function') {
          (navigator.storage as any).getDirectory()
            .then(() => finish(false))
            .catch((e: any) => {
              const msg = (e && e.message) ? String(e.message) : String(e);
              finish(msg.includes('unknown transient reason') || msg.includes('Security'));
            });
          return;
        }

        const testDbName = '__safari_priv_' + Math.random().toString(36).substring(2);
        const req = window.indexedDB.open(testDbName, 1);
        req.onupgradeneeded = (ev: any) => {
          try {
            const db = ev.target.result;
            db.createObjectStore('t', { autoIncrement: true }).put(new Blob());
            finish(false);
          } catch (err: any) {
            const msg = String(err && err.message ? err.message : err);
            finish(msg.includes('are not yet supported') || msg.includes('QuotaExceeded'));
          } finally {
            try {
              ev.target.result.close();
              window.indexedDB.deleteDatabase(testDbName);
            } catch (ignore) {}
          }
        };
        req.onerror = () => finish(false);
        req.onsuccess = () => {
          try {
            req.result.close();
            window.indexedDB.deleteDatabase(testDbName);
          } catch (ignore) {}
          finish(false);
        };
        return;
      } catch (e) {
        finish(false);
        return;
      }
    }

    // 2. Firefox Private Browsing Test
    if (isFirefox || /Firefox\//.test(ua)) {
      browserName = 'Firefox';
      try {
        if (navigator.storage && typeof (navigator.storage as any).getDirectory === 'function') {
          (navigator.storage as any).getDirectory()
            .then(() => finish(false))
            .catch((e: any) => {
              const msg = (e && e.message) ? String(e.message) : String(e);
              finish(msg.includes('Security error') || msg.includes('Security'));
            });
          return;
        }

        const req = window.indexedDB.open('__ff_private_test');
        req.onerror = (e: any) => {
          if (req.error && req.error.name === 'InvalidStateError') {
            if (e && e.preventDefault) e.preventDefault();
            finish(true);
            return;
          }
          finish(false);
        };
        req.onsuccess = () => {
          try {
            req.result.close();
            window.indexedDB.deleteDatabase('__ff_private_test');
          } catch (ignore) {}
          finish(false);
        };
        return;
      } catch (e) {
        finish(false);
        return;
      }
    }

    // 3. Chrome / Chromium / Edge / Brave / Opera
    if (isChrome || /Chrome|Chromium|CriOS/.test(ua)) {
      browserName = identifyChromium();

      if (navigator.storage && navigator.storage.estimate) {
        navigator.storage.estimate().then((estimate) => {
          if (estimate && typeof estimate.quota === 'number') {
            if (estimate.quota < 120000000) {
              finish(true);
              return;
            }
          }
          runChromiumTiming();
        }).catch(() => {
          runChromiumTiming();
        });
        return;
      }

      runChromiumTiming();
      return;
    }

    function runChromiumTiming(): void {
      try {
        if (window.indexedDB) {
          const dbName = '__cr_priv_' + Math.random().toString(36).substring(2);
          const req = window.indexedDB.open(dbName, 1);
          req.onupgradeneeded = () => {
            req.result.createObjectStore('s');
          };
          req.onerror = () => {
            try { window.indexedDB.deleteDatabase(dbName); } catch (ignore) {}
            finish(false);
          };
          req.onsuccess = () => {
            const db = req.result;
            let honored = false;
            try {
              const t = (db as any).transaction('s', 'readwrite', { durability: 'strict' });
              honored = t.durability === 'strict';
              t.abort();
            } catch (ignore) {}

            if (!honored) {
              db.close();
              try { window.indexedDB.deleteDatabase(dbName); } catch (ignore) {}
              finish(false);
              return;
            }

            const payload = new Uint8Array(16384);
            const block = (durability: string) => new Promise<number>((res, rej) => {
              const t0 = performance.now();
              let i = 0;
              const step = () => {
                if (i === 12) { res(performance.now() - t0); return; }
                const tx = (db as any).transaction('s', 'readwrite', { durability });
                tx.objectStore('s').put(payload, i);
                i++;
                tx.oncomplete = step;
                tx.onerror = tx.onabort = () => rej(tx.error);
              };
              step();
            });

            (async () => {
              try {
                await block('relaxed');
                await block('strict');
                const ratios: number[] = [];
                for (let r = 0; r < 8; r++) {
                  const rel = await block('relaxed');
                  const str = await block('strict');
                  ratios.push(rel > 0 ? str / rel : 1.0);
                }
                ratios.sort((a, b) => a - b);
                db.close();
                try { window.indexedDB.deleteDatabase(dbName); } catch (ignore) {}
                const medianRatio = ratios[Math.floor(ratios.length / 2)];
                finish(medianRatio < 1.3);
              } catch (err) {
                db.close();
                try { window.indexedDB.deleteDatabase(dbName); } catch (ignore) {}
                finish(false);
              }
            })();
          };
          return;
        }
      } catch (err) {
        finish(false);
        return;
      }
      finish(false);
    }

    finish(false);
  });
}

export async function detectSafeEnvironment(): Promise<EnvironmentCheckResult> {
  if (typeof window === 'undefined') {
    return { isSafe: true, isIncognito: false, isAutomated: false, reason: '' };
  }

  if (navigator.webdriver) {
    return {
      isSafe: false,
      isIncognito: false,
      isAutomated: true,
      reason: 'Automated headless browser runner detected (navigator.webdriver).',
    };
  }

  try {
    const incognitoResult = await detectIncognito();
    if (incognitoResult.isPrivate) {
      return {
        isSafe: false,
        isIncognito: true,
        isAutomated: false,
        reason: 'Private/Incognito browsing mode detected.',
        browserName: incognitoResult.browserName,
      };
    }
  } catch (err) {
    // Graceful fallback
  }

  try {
    const testKey = '__tv_env_test__';
    window.localStorage.setItem(testKey, '1');
    window.localStorage.removeItem(testKey);
  } catch (e) {
    return {
      isSafe: false,
      isIncognito: true,
      isAutomated: false,
      reason: 'Browser storage access is blocked or restricted.',
    };
  }

  return {
    isSafe: true,
    isIncognito: false,
    isAutomated: false,
    reason: '',
  };
}

export default detectSafeEnvironment;
