// Local offline storage for user custom alarm audio files using IndexedDB
// Kept entirely isolated from existing planner, habits, profile, and language schemas.

const DB_NAME = 'mw_custom_audio_db_v1';
const DB_VERSION = 1;
const STORE_NAME = 'audio_files';

interface StoredCustomAudio {
  id: string;
  name: string;
  type: string;
  size: number;
  data: ArrayBuffer;
  createdAt: number;
}

// In-memory fallback and decoded buffer cache for instant playback
const inMemoryAudioCache = new Map<string, ArrayBuffer>();
const decodedBufferCache = new Map<string, AudioBuffer>();

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported in this environment'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error || new Error('Failed to open custom audio database'));
    };
  });
}

/**
 * Persists an audio ArrayBuffer in IndexedDB and in-memory cache
 */
export async function saveCustomAudio(
  id: string,
  name: string,
  type: string,
  data: ArrayBuffer
): Promise<void> {
  // Always update in-memory cache
  inMemoryAudioCache.set(id, data);
  // Clear any stale decoded buffer
  decodedBufferCache.delete(id);

  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);

      const record: StoredCustomAudio = {
        id,
        name,
        type: type || 'audio/mpeg',
        size: data.byteLength,
        data,
        createdAt: Date.now(),
      };

      const putRequest = store.put(record);
      putRequest.onsuccess = () => resolve();
      putRequest.onerror = () => reject(putRequest.error);

      tx.oncomplete = () => db.close();
    });
  } catch (err) {
    console.warn('Could not persist to IndexedDB, using in-memory fallback:', err);
  }
}

/**
 * Retrieves a custom audio ArrayBuffer by ID
 */
export async function getCustomAudio(id: string): Promise<ArrayBuffer | null> {
  // Check memory cache first
  if (inMemoryAudioCache.has(id)) {
    return inMemoryAudioCache.get(id)!;
  }

  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);

      const getRequest = store.get(id);
      getRequest.onsuccess = () => {
        const record = getRequest.result as StoredCustomAudio | undefined;
        if (record && record.data) {
          inMemoryAudioCache.set(id, record.data);
          resolve(record.data);
        } else {
          resolve(null);
        }
      };

      getRequest.onerror = () => reject(getRequest.error);
      tx.oncomplete = () => db.close();
    });
  } catch (err) {
    console.warn('Could not read from IndexedDB:', err);
    return null;
  }
}

/**
 * Removes a custom audio record by ID
 */
export async function deleteCustomAudio(id: string): Promise<void> {
  inMemoryAudioCache.delete(id);
  decodedBufferCache.delete(id);

  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);

      const delRequest = store.delete(id);
      delRequest.onsuccess = () => resolve();
      delRequest.onerror = () => reject(delRequest.error);

      tx.oncomplete = () => db.close();
    });
  } catch (err) {
    console.warn('Could not delete from IndexedDB:', err);
  }
}

/**
 * Returns a cached decoded AudioBuffer if available
 */
export function getCachedDecodedBuffer(id: string): AudioBuffer | undefined {
  return decodedBufferCache.get(id);
}

/**
 * Stores a decoded AudioBuffer in cache
 */
export function setCachedDecodedBuffer(id: string, buffer: AudioBuffer): void {
  decodedBufferCache.set(id, buffer);
}
