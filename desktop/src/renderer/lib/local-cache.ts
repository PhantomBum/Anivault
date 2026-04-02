/**
 * IndexedDB cache for poster thumbnails with a hard cap to bound disk use.
 */

const DB_NAME = "anivault-cache";
const STORE = "thumbnails";
const DB_VERSION = 1;
const ORDER_LS = "anivault-thumb-order-v1";
const MAX_THUMBNAILS = 56;

function readOrder(): string[] {
  try {
    const raw = localStorage.getItem(ORDER_LS);
    if (!raw) return [];
    const p = JSON.parse(raw) as unknown;
    return Array.isArray(p) ? p.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function writeOrder(keys: string[]): void {
  try {
    localStorage.setItem(ORDER_LS, JSON.stringify(keys));
  } catch {
    /* ignore quota */
  }
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE);
      }
    };
  });
}

async function deleteKey(db: IDBDatabase, key: string): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function cacheThumbnail(key: string, blob: Blob): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(blob, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();

  let order = readOrder().filter((k) => k !== key);
  order.push(key);
  if (order.length > MAX_THUMBNAILS) {
    const drop = order.slice(0, order.length - MAX_THUMBNAILS);
    order = order.slice(-MAX_THUMBNAILS);
    const db2 = await openDb();
    try {
      for (const k of drop) {
        await deleteKey(db2, k);
      }
    } finally {
      db2.close();
    }
  }
  writeOrder(order);
}

export async function getCachedThumbnail(key: string): Promise<Blob | undefined> {
  const db = await openDb();
  const blob = await new Promise<Blob | undefined>((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).get(key);
    req.onsuccess = () => resolve(req.result as Blob | undefined);
    req.onerror = () => reject(req.error);
  });
  db.close();
  return blob;
}
