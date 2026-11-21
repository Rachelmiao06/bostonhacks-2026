import { settings } from "./content";

export type PhotoMeta = {
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  /** Changes when the photo changes. Used to tell whether an AI check is out of date. */
  signature: string;
};

/** Returns an error message, or null when the file is fine. */
export function validatePhoto(file: File): string | null {
  if (!settings.acceptedPhotoTypes.includes(file.type)) {
    return "That file type is not supported. Please choose a JPG, PNG or WebP photo.";
  }
  if (file.size > settings.maxPhotoBytes) {
    const mb = Math.round(settings.maxPhotoBytes / 1024 / 1024);
    return `That photo is too large (limit ${mb} MB). Please compress it or choose another.`;
  }
  return null;
}

export function metaFor(file: File): PhotoMeta {
  return {
    fileName: file.name,
    mimeType: file.type,
    sizeBytes: file.size,
    signature: `${file.name}:${file.size}:${file.lastModified}`,
  };
}

export function readAsDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

// Photo files live in IndexedDB on this device, never in localStorage and never on our server.
const DB_NAME = "tparty";
const STORE = "photos";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function run<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDb();
  try {
    return await new Promise<T>((resolve, reject) => {
      const request = fn(db.transaction(STORE, mode).objectStore(STORE));
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } finally {
    db.close();
  }
}

export const putPhoto = (key: string, blob: Blob) => run("readwrite", (s) => s.put(blob, key));
export const getPhoto = (key: string) => run<Blob | undefined>("readonly", (s) => s.get(key));
export const deletePhoto = (key: string) => run("readwrite", (s) => s.delete(key));
export const clearPhotos = () => run("readwrite", (s) => s.clear());
