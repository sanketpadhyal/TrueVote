/**
 * TrueVote Persistent IndexedDB Backup Service
 * Ensures election sessions and ballots survive browser localStorage clears and relogins.
 */

const DB_NAME = 'truevote_persistence_db';
const STORE_NAME = 'events';
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase | null> {
  if (typeof window === 'undefined' || !window.indexedDB) {
    return Promise.resolve(null);
  }
  return new Promise((resolve) => {
    try {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
    } catch (e) {
      resolve(null);
    }
  });
}

export async function saveEventsToBackup(events: any[]): Promise<void> {
  try {
    const db = await openDB();
    if (!db) return;
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.clear();
    for (const ev of events) {
      store.put(ev);
    }
  } catch (e) {
    console.warn('IndexedDB backup save notice:', e);
  }
}

export async function loadEventsFromBackup(): Promise<any[]> {
  try {
    const db = await openDB();
    if (!db) return [];
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.getAll();
      request.onsuccess = () => {
        resolve(Array.isArray(request.result) ? request.result : []);
      };
      request.onerror = () => resolve([]);
    });
  } catch (e) {
    console.warn('IndexedDB backup load notice:', e);
    return [];
  }
}

export async function removeEventFromBackup(id: string, votingNumber?: string): Promise<void> {
  try {
    const db = await openDB();
    if (!db) return;
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.delete(id);
    if (votingNumber) {
      store.delete(votingNumber);
    }
    const req = store.openCursor();
    req.onsuccess = (e: any) => {
      const cursor = e.target.result;
      if (cursor) {
        const val = cursor.value;
        if (
          val.id === id ||
          (votingNumber && (val.votingNumber === votingNumber || val.id === votingNumber)) ||
          (val.votingNumber && val.votingNumber === id)
        ) {
          cursor.delete();
        }
        cursor.continue();
      }
    };
  } catch (e) {
    console.warn('IndexedDB delete notice:', e);
  }
}
