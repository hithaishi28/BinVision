/**
 * Local persistence for analysis sessions (frontend-only, no backend yet).
 * Analyses are stored in localStorage so Dashboard / Results can read what
 * the Detection page produced. When the real backend lands, this module is
 * the single place to swap for API-backed history.
 */

import { useSyncExternalStore } from "react";
import type { WasteAnalysisResponse } from "./detection";

export interface StoredAnalysis {
  id: string;
  /** Provider used for this run; optional for results saved before this field existed. */
  analysisMode?: "api" | "mock";
  fileName: string;
  imageDataUrl: string;
  imageWidth: number;
  imageHeight: number;
  analyzedAt: string; // ISO
  analysis: WasteAnalysisResponse;
}

const KEY = "binvision:analyses";
const EVENT = "binvision:analyses-changed";
const MAX_ENTRIES = 12;

const EMPTY: StoredAnalysis[] = [];
let cache: StoredAnalysis[] = EMPTY;

function read(): StoredAnalysis[] {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) {
      cache = EMPTY;
      return cache;
    }
    const parsed = JSON.parse(raw);
    // Ignore records saved by the previous pre-contract demo format.
    cache = Array.isArray(parsed)
      ? (parsed.filter((item): item is StoredAnalysis =>
          Boolean(
            item &&
            typeof item.id === "string" &&
            typeof item.imageDataUrl === "string" &&
            item.analysis &&
            typeof item.analysis.image_id === "string" &&
            Array.isArray(item.analysis.detections) &&
            item.analysis.summary,
          ),
        ) as StoredAnalysis[])
      : EMPTY;
    return cache;
  } catch {
    cache = EMPTY;
    return cache;
  }
}

function getSnapshot(): StoredAnalysis[] {
  // useSyncExternalStore requires a stable reference between changes.
  const prev = cache;
  const next = read();
  // Same data after a storage event we already handled: keep old reference.
  if (prev !== EMPTY && next.length === prev.length && next[0]?.id === prev[0]?.id) {
    cache = prev;
    return prev;
  }
  return next;
}

export function getAnalyses(): StoredAnalysis[] {
  return read();
}

export function saveAnalysis(analysis: StoredAnalysis): void {
  const next = [analysis, ...read()].slice(0, MAX_ENTRIES);
  window.localStorage.setItem(KEY, JSON.stringify(next));
  window.dispatchEvent(new Event(EVENT));
}

export function clearAnalyses(): void {
  window.localStorage.removeItem(KEY);
  window.dispatchEvent(new Event(EVENT));
}

export function getAnalysis(id: string): StoredAnalysis | undefined {
  return read().find((a) => a.id === id);
}

function subscribe(cb: () => void): () => void {
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

export function useAnalyses(): StoredAnalysis[] {
  return useSyncExternalStore(subscribe, getSnapshot, () => EMPTY);
}

export function newAnalysisId(): string {
  return `a_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}
