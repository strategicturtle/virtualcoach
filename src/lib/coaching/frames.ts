"use client";

import { FRAME_MAX_SIDE, MAX_FRAMES, MIN_FRAMES } from "./options";

export type CapturedFrame = { t: number; jpegBase64: string };

function once(el: HTMLMediaElement, event: string, timeoutMs = 8000) {
  return new Promise<void>((resolve, reject) => {
    const timer = window.setTimeout(() => {
      cleanup();
      reject(new Error(`Timed out waiting for ${event}`));
    }, timeoutMs);
    const onEvent = () => {
      cleanup();
      resolve();
    };
    const onError = () => {
      cleanup();
      reject(new Error("The video couldn't be loaded."));
    };
    const cleanup = () => {
      window.clearTimeout(timer);
      el.removeEventListener(event, onEvent);
      el.removeEventListener("error", onError);
    };
    el.addEventListener(event, onEvent);
    el.addEventListener("error", onError);
  });
}

/**
 * Samples evenly spaced JPEG frames from a clip. `fallbackSeconds` covers
 * recordings whose file doesn't report a duration (some WebM from Chrome).
 */
export async function captureFrames(url: string, fallbackSeconds: number): Promise<CapturedFrame[]> {
  const video = document.createElement("video");
  video.crossOrigin = "anonymous"; // bucket CORS allows our origin, so the canvas stays readable
  video.muted = true;
  video.playsInline = true;
  video.preload = "auto";
  video.src = url;

  await once(video, "loadedmetadata");
  // iOS won't decode frames for seeking until playback has started once.
  await video.play().catch(() => {});
  video.pause();

  const duration =
    Number.isFinite(video.duration) && video.duration > 0 ? video.duration : fallbackSeconds;

  const count = Math.min(MAX_FRAMES, Math.max(MIN_FRAMES, Math.ceil(duration * 1.5)));
  const scale = Math.min(1, FRAME_MAX_SIDE / Math.max(video.videoWidth, video.videoHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(video.videoWidth * scale);
  canvas.height = Math.round(video.videoHeight * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx || !canvas.width || !canvas.height) throw new Error("This video has no picture to analyze.");

  const frames: CapturedFrame[] = [];
  const margin = Math.min(0.2, duration / 20);
  for (let i = 0; i < count; i++) {
    const t = margin + ((duration - 2 * margin) * i) / (count - 1);
    video.currentTime = t;
    await once(video, "seeked");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.72);
    frames.push({ t: Math.round(t * 10) / 10, jpegBase64: dataUrl.slice(dataUrl.indexOf(",") + 1) });
  }

  video.removeAttribute("src");
  video.load();
  return frames;
}
