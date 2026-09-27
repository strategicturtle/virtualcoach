"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { addMyVideo } from "@/lib/myVideos";
import { MAX_RECORDING_SECONDS } from "@/lib/videos";

type Phase = "starting" | "live" | "recording" | "review" | "uploading" | "saved" | "error";
type Facing = "user" | "environment";
type Recording = { blob: Blob; url: string; seconds: number; contentType: string };

// Safari records MP4, Chrome/Firefox usually WebM; take the first the browser supports.
const MIME_CANDIDATES = [
  "video/mp4;codecs=avc1,mp4a",
  "video/mp4",
  "video/webm;codecs=vp9,opus",
  "video/webm;codecs=vp8,opus",
  "video/webm",
];

function pickMimeType() {
  if (typeof MediaRecorder === "undefined") return undefined;
  return MIME_CANDIDATES.find((t) => MediaRecorder.isTypeSupported(t));
}

function baseType(mime: string) {
  return mime.includes("mp4") ? "video/mp4" : "video/webm";
}

function cameraErrorMessage(err: unknown) {
  const name = err instanceof DOMException ? err.name : "";
  if (name === "NotAllowedError") {
    return "Camera access is blocked. Allow camera and microphone for this site in your browser settings, then reload.";
  }
  if (name === "NotFoundError" || name === "OverconstrainedError") {
    return "No camera was found on this device.";
  }
  if (name === "NotReadableError") {
    return "Your camera is being used by another app. Close it and try again.";
  }
  return "Couldn't start the camera on this browser.";
}

function formatTime(s: number) {
  return `0:${String(Math.max(0, Math.ceil(s))).padStart(2, "0")}`;
}

export default function Recorder() {
  const [facing, setFacing] = useState<Facing>("user");
  const [session, setSession] = useState(0);
  const [phase, setPhase] = useState<Phase>("starting");
  const [error, setError] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [recording, setRecording] = useState<Recording | null>(null);
  const [uploadError, setUploadError] = useState("");
  const [progress, setProgress] = useState(0);
  const [savedId, setSavedId] = useState("");

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<number | undefined>(undefined);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  // (Re)start the camera whenever the facing direction changes or the user retakes.
  useEffect(() => {
    let cancelled = false;

    async function start() {
      if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
        setError("This browser can't record video. Try the latest Safari or Chrome.");
        setPhase("error");
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: true,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
        setPhase("live");
      } catch (err) {
        if (cancelled) return;
        setError(cameraErrorMessage(err));
        setPhase("error");
      }
    }

    start();
    return () => {
      cancelled = true;
      stopStream();
    };
  }, [facing, session, stopStream]);

  // Free the camera, timer and preview URL when leaving the page.
  useEffect(() => {
    return () => {
      window.clearInterval(timerRef.current);
      if (recorderRef.current?.state === "recording") recorderRef.current.stop();
    };
  }, []);

  useEffect(() => {
    return () => {
      if (recording) URL.revokeObjectURL(recording.url);
    };
  }, [recording]);

  const stopRecording = useCallback(() => {
    window.clearInterval(timerRef.current);
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
    }
  }, []);

  function startRecording() {
    const stream = streamRef.current;
    if (!stream) return;

    const mimeType = pickMimeType();
    const recorder = new MediaRecorder(stream, {
      ...(mimeType ? { mimeType } : {}),
      videoBitsPerSecond: 2_500_000,
    });
    const chunks: Blob[] = [];
    const startedAt = performance.now();

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };
    recorder.onstop = () => {
      const contentType = baseType(recorder.mimeType || mimeType || chunks[0]?.type || "");
      const blob = new Blob(chunks, { type: contentType });
      const seconds = Math.max(
        1,
        Math.min(MAX_RECORDING_SECONDS, Math.round((performance.now() - startedAt) / 1000)),
      );
      stopStream();
      setRecording({ blob, url: URL.createObjectURL(blob), seconds, contentType });
      setUploadError("");
      setPhase("review");
    };

    recorderRef.current = recorder;
    recorder.start(250);
    setElapsed(0);
    setPhase("recording");

    timerRef.current = window.setInterval(() => {
      const secs = (performance.now() - startedAt) / 1000;
      setElapsed(Math.min(secs, MAX_RECORDING_SECONDS));
      if (secs >= MAX_RECORDING_SECONDS) stopRecording();
    }, 100);
  }

  function retake() {
    setRecording(null);
    setSavedId("");
    setElapsed(0);
    setPhase("starting");
    setSession((s) => s + 1);
  }

  function flipCamera() {
    setPhase("starting");
    setFacing((f) => (f === "user" ? "environment" : "user"));
  }

  async function save() {
    if (!recording) return;
    setUploadError("");
    setProgress(0);
    setPhase("uploading");

    try {
      const res = await fetch("/api/videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentType: recording.contentType, size: recording.blob.size }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed.");

      // XHR instead of fetch so we can show upload progress.
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", data.uploadUrl);
        xhr.setRequestHeader("Content-Type", recording.contentType);
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) setProgress(e.loaded / e.total);
        };
        xhr.onload = () =>
          xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error("Upload failed."));
        xhr.onerror = () => reject(new Error("Upload failed. Check your connection."));
        xhr.send(recording.blob);
      });

      addMyVideo({ id: data.id, createdAt: new Date().toISOString(), seconds: recording.seconds });
      setSavedId(data.id);
      setPhase("saved");
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed.");
      setPhase("review");
    }
  }

  const cameraVisible = phase === "starting" || phase === "live" || phase === "recording";
  const remaining = MAX_RECORDING_SECONDS - elapsed;

  return (
    <main className="flex h-[calc(100dvh-env(safe-area-inset-top)-env(safe-area-inset-bottom))] flex-col bg-black">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="font-semibold text-gold hover:underline">
          ‹ Home
        </Link>
        {cameraVisible && (
          <span
            className={`rounded-full px-3 py-1 font-mono text-sm font-bold tabular-nums ${
              phase === "recording" ? "bg-neon text-black" : "bg-surface text-foreground"
            }`}
            aria-live="polite"
          >
            {phase === "recording" ? `● ${formatTime(remaining)}` : formatTime(MAX_RECORDING_SECONDS)}
          </span>
        )}
        <button
          type="button"
          onClick={flipCamera}
          disabled={phase !== "live"}
          className={`rounded-full bg-surface px-3 py-1.5 text-sm font-semibold disabled:opacity-40 ${
            cameraVisible ? "" : "invisible"
          }`}
          aria-label="Switch camera"
        >
          ⟲ Flip
        </button>
      </div>

      {/* Recording progress */}
      <div className="h-1 bg-surface">
        {phase === "recording" && (
          <div
            className="h-full bg-neon"
            style={{ width: `${(elapsed / MAX_RECORDING_SECONDS) * 100}%` }}
          />
        )}
      </div>

      {/* Stage */}
      <div className="relative min-h-0 flex-1">
        {cameraVisible && (
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className={`size-full object-contain ${facing === "user" ? "-scale-x-100" : ""}`}
          />
        )}
        {phase === "starting" && (
          <p className="absolute inset-0 flex items-center justify-center text-muted">
            Starting camera…
          </p>
        )}
        {(phase === "review" || phase === "uploading") && recording && (
          <video
            src={recording.url}
            controls
            playsInline
            className="size-full object-contain"
          />
        )}
        {phase === "saved" && (
          <div className="flex size-full flex-col items-center justify-center gap-3 px-6 text-center">
            <p className="text-3xl font-extrabold text-gold-shine">Saved!</p>
            <p className="text-muted">Your clip is uploaded and listed on the home page.</p>
          </div>
        )}
        {phase === "error" && (
          <div className="flex size-full flex-col items-center justify-center gap-4 px-6 text-center">
            <p className="max-w-md text-lg">{error}</p>
            <button
              type="button"
              onClick={retake}
              className="rounded-full border-2 border-gold px-6 py-2 font-bold text-gold"
            >
              Try again
            </button>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex min-h-28 flex-col items-center justify-center gap-3 px-4 py-4">
        {phase === "live" && (
          <button
            type="button"
            onClick={startRecording}
            aria-label="Start recording"
            className="flex size-20 items-center justify-center rounded-full border-4 border-white"
          >
            <span className="size-14 rounded-full bg-neon" />
          </button>
        )}
        {phase === "recording" && (
          <button
            type="button"
            onClick={stopRecording}
            aria-label="Stop recording"
            className="flex size-20 items-center justify-center rounded-full border-4 border-white"
          >
            <span className="size-8 rounded-md bg-neon" />
          </button>
        )}
        {phase === "review" && (
          <>
            {uploadError && <p className="text-sm text-neon">{uploadError}</p>}
            <div className="flex w-full max-w-md gap-3">
              <button
                type="button"
                onClick={retake}
                className="flex-1 rounded-full border-2 border-gold py-3 font-bold text-gold"
              >
                Retake
              </button>
              <button
                type="button"
                onClick={save}
                className="flex-1 rounded-full bg-neon py-3 font-bold text-black hover:brightness-110"
              >
                {uploadError ? "Try again" : "Save video"}
              </button>
            </div>
          </>
        )}
        {phase === "uploading" && (
          <div className="w-full max-w-md">
            <p className="mb-2 text-center text-sm text-muted">
              Uploading… {Math.round(progress * 100)}%
            </p>
            <div className="h-2 overflow-hidden rounded-full bg-surface">
              <div
                className="h-full transition-[width]"
                style={{ backgroundImage: "var(--gold-shine)", width: `${progress * 100}%` }}
              />
            </div>
          </div>
        )}
        {phase === "saved" && (
          <div className="flex w-full max-w-md gap-3">
            <Link
              href={`/watch/${savedId}`}
              className="flex-1 rounded-full border-2 border-gold py-3 text-center font-bold text-gold"
            >
              Watch
            </Link>
            <button
              type="button"
              onClick={retake}
              className="flex-1 rounded-full bg-neon py-3 font-bold text-black hover:brightness-110"
            >
              Record another
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
