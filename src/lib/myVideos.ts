"use client";

import { useMemo, useSyncExternalStore } from "react";

// No accounts yet, so each device remembers which videos it recorded.
export type MyVideo = { id: string; createdAt: string; seconds: number };

const STORAGE_KEY = "vc.myVideos";
const CHANGE_EVENT = "vc-my-videos";

function read(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? "[]";
  } catch {
    return "[]";
  }
}

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

function parse(raw: string): MyVideo[] {
  try {
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function useMyVideos(): MyVideo[] {
  const raw = useSyncExternalStore(subscribe, read, () => "[]");
  return useMemo(() => parse(raw), [raw]);
}

export function addMyVideo(video: MyVideo) {
  const list = [video, ...parse(read())];
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    // Storage blocked (private mode); the upload still succeeded.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}
