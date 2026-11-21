import { settings } from "./content";

export type PhotoMeta = {
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  /** Changes when the photo changes. Used to tell whether an AI check is out of date. */
  signature: string;
};

const TYPE_PROBLEM = "That file type is not supported. Please choose a JPG, PNG or WebP photo.";

/** Returns an error message when the file type is not accepted, or null. */
export function photoTypeProblem(file: File): string | null {
  return settings.acceptedPhotoTypes.includes(file.type) ? null : TYPE_PROBLEM;
}

/** Returns an error message, or null when the file is fine. */
export function validatePhoto(file: File): string | null {
  const typeProblem = photoTypeProblem(file);
  if (typeProblem) return typeProblem;
  if (file.size > settings.maxPhotoBytes) {
    const mb = Math.round(settings.maxPhotoBytes / 1024 / 1024);
    return `That photo is too large (limit ${mb} MB). Please compress it or choose another.`;
  }
  return null;
}

/** Longest side after shrinking. Plenty for an AI check and an on-screen preview. */
const MAX_SIDE = 1600;

/**
 * Re-saves a photo as a smaller JPEG. Phone cameras make big files (often over our size limit),
 * and re-saving through a canvas also drops hidden EXIF data such as GPS location.
 * If the browser cannot do it, the original file comes back unchanged.
 */
export async function shrinkPhoto(file: File): Promise<File> {
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) return file;
    context.fillStyle = "white"; // JPEG has no transparency; this fills any see-through areas
    context.fillRect(0, 0, width, height);
    context.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));
    if (!blob) return file;
    const name = `${file.name.replace(/\.[^.]+$/, "") || "photo"}.jpg`;
    return new File([blob], name, { type: "image/jpeg", lastModified: file.lastModified });
  } catch {
    return file;
  }
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
