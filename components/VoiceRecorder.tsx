"use client";

import { useRef, useState } from "react";

const MAX_SECONDS = 28; // Saaras v4 synchronous REST limit is 30s

type Props = {
  languageCode: string;
  disabled?: boolean;
  onTranscript: (text: string) => void;
  onError: (msg: string) => void;
};

export default function VoiceRecorder({ languageCode, disabled, onTranscript, onError }: Props) {
  const [state, setState] = useState<"idle" | "recording" | "transcribing">("idle");
  const [seconds, setSeconds] = useState(0);
  const recorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const cancelled = useRef(false);

  async function start() {
    onError("");
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      onError("Voice recording is not supported in this browser. You can type your question instead.");
      return;
    }
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      onError("Microphone permission was denied. Please allow it, or type your question instead.");
      return;
    }
    const mime = ["audio/webm", "audio/mp4", "audio/ogg"].find((t) => MediaRecorder.isTypeSupported(t));
    const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
    chunks.current = [];
    cancelled.current = false;
    rec.ondataavailable = (e) => e.data.size && chunks.current.push(e.data);
    rec.onstop = () => {
      stream.getTracks().forEach((t) => t.stop());
      if (timer.current) clearInterval(timer.current);
      if (cancelled.current) return setState("idle");
      void upload(new Blob(chunks.current, { type: rec.mimeType || "audio/webm" }));
    };
    recorder.current = rec;
    rec.start();
    setSeconds(0);
    setState("recording");
    timer.current = setInterval(() => {
      setSeconds((s) => {
        if (s + 1 >= MAX_SECONDS) recorder.current?.stop();
        return s + 1;
      });
    }, 1000);
  }

  function stop(cancel = false) {
    cancelled.current = cancel;
    if (recorder.current?.state === "recording") recorder.current.stop();
  }

  async function upload(blob: Blob) {
    if (blob.size < 1000) {
      setState("idle");
      onError("Please record a short voice question.");
      return;
    }
    setState("transcribing");
    try {
      const form = new FormData();
      form.append("audio", blob);
      form.append("languageCode", languageCode);
      const res = await fetch("/api/transcribe", { method: "POST", body: form });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Speech recognition is unavailable right now. You can type your question instead.");
      onTranscript(data.transcript);
    } catch (e) {
      onError(e instanceof Error ? e.message : "Speech recognition failed.");
    } finally {
      setState("idle");
    }
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        type="button"
        disabled={disabled || state === "transcribing"}
        onClick={() => (state === "recording" ? stop() : start())}
        aria-label={state === "recording" ? "Stop recording" : "Start recording your question"}
        className={`flex h-24 w-24 items-center justify-center rounded-full text-white shadow-lg transition focus:outline-none focus-visible:ring-4 focus-visible:ring-leaf-200 disabled:opacity-50 ${
          state === "recording" ? "recording bg-red-600" : "bg-leaf-700 hover:bg-leaf-600 active:scale-95"
        }`}
      >
        {state === "recording" ? (
          <span className="h-8 w-8 rounded-md bg-white" />
        ) : state === "transcribing" ? (
          <span className="h-9 w-9 animate-spin rounded-full border-4 border-white/40 border-t-white" />
        ) : (
          <svg viewBox="0 0 24 24" className="h-11 w-11" fill="currentColor" aria-hidden>
            <path d="M12 15a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v6a3 3 0 0 0 3 3Zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V21h2v-2.08A7 7 0 0 0 19 12h-2Z" />
          </svg>
        )}
      </button>
      <p className="h-6 text-base font-medium text-leaf-900/80" aria-live="polite">
        {state === "recording"
          ? `Listening… ${seconds}s / ${MAX_SECONDS}s`
          : state === "transcribing"
          ? "Converting speech to text…"
          : "Tap to speak"}
      </p>
      {state === "recording" && (
        <button type="button" onClick={() => stop(true)} className="text-sm font-medium text-soil-700 underline">
          Cancel
        </button>
      )}
    </div>
  );
}
