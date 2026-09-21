/**
 * Tiny IndexedDB wrapper for storing document file blobs.
 * Kept intentionally minimal — one object store, key = storagePath.
 */

const DB_NAME = "lockerr-files";
const STORE = "files";
const VERSION = 1;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function withStore<T>(
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const store = tx.objectStore(STORE);
    const req = fn(store);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function putFile(key: string, blob: Blob): Promise<void> {
  await withStore("readwrite", (s) => s.put(blob, key));
}

export async function getFile(key: string): Promise<Blob | null> {
  const val = await withStore<Blob | undefined>("readonly", (s) => s.get(key));
  return val ?? null;
}

export async function deleteFile(key: string): Promise<void> {
  await withStore("readwrite", (s) => s.delete(key));
}

/** Returns all stored files as a Map<storagePath, Blob>. Used by backup. */
export async function getAllFiles(): Promise<Map<string, Blob>> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const store = tx.objectStore(STORE);
    const result = new Map<string, Blob>();
    const keysReq = store.getAllKeys();
    const valsReq = store.getAll();
    tx.oncomplete = () => {
      const keys = keysReq.result as string[];
      const vals = valsReq.result as Blob[];
      keys.forEach((k, i) => result.set(k, vals[i]!));
      resolve(result);
    };
    tx.onerror = () => reject(tx.error);
  });
}
