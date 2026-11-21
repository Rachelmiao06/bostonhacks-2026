"use client";

import { useSyncExternalStore } from "react";
import { content } from "./content";

// Completed station ids, saved in this browser (localStorage) for now.

const EMPTY: ReadonlySet<string> = new Set();
const listeners = new Set<() => void>();
let cachedRaw: string | null = null;
let cachedSet: ReadonlySet<string> = EMPTY;

function read(): ReadonlySet<string> {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(content.storageKey);
  } catch {
    // Storage blocked (private mode): keep what we have in memory.
    return cachedSet;
  }
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    try {
      cachedSet = new Set<string>(raw ? JSON.parse(raw) : []);
    } catch {
      cachedSet = EMPTY;
    }
  }
  return cachedSet;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

export function useCompleted(): ReadonlySet<string> {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

export function toggleCompleted(stationId: string) {
  const next = new Set(read());
  if (!next.delete(stationId)) next.add(stationId);
  const raw = JSON.stringify([...next]);
  try {
    window.localStorage.setItem(content.storageKey, raw);
  } catch {
    cachedRaw = raw;
    cachedSet = next;
  }
  listeners.forEach((listener) => listener());
}
