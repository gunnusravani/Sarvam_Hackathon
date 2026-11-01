"use client";

import { useState, useRef, useCallback } from "react";

interface Props {
  languageCode: string;
  onTranscript: (text: string) => void;
  disabled?: boolean;
}

type RecordState = "idle" | "recording" | "processing" | "error";

export default function VoiceRecorder({ languageCode, onTranscript, disabled }: Props) {
  const [state, setState] = useState<RecordState>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = useCallback(async () => {
    setErrorMsg("");

    const sendAudio = async (blob: Blob) => {
      setState("processing");
      try {
        const form = new FormData();
        form.append("audio", blob, "recording.webm");
        form.append("languageCode", languageCode);

        const res = await fetch("/api/transcribe", { method: "POST", body: form });
        const data = await res.json();

        if (!res.ok || data.error) {
          throw new Error(data.error?.message ?? "Transcription failed.");
        }

        onTranscript(data.transcript);
        setState("idle");
      } catch (err: unknown) {
        setState("error");
        setErrorMsg(err instanceof Error ? err.message : "Transcription failed. Please try again.");
      }
    };

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        await sendAudio(blob);
      };
      recorder.start();
      mediaRef.current = recorder;
      setState("recording");

      // Auto-stop at 25 seconds (within Saaras 30s limit)
      setTimeout(() => {
        if (mediaRef.current?.state === "recording") {
          mediaRef.current.stop();
        }
      }, 25_000);
    } catch {
      setState("error");
      setErrorMsg("Microphone access denied. Please type your question instead.");
    }
  }, [languageCode, onTranscript]);

  const stopRecording = useCallback(() => {
    if (mediaRef.current?.state === "recording") {
      mediaRef.current.stop();
      setState("processing");
    }
  }, []);

  const isRecording = state === "recording";
  const isProcessing = state === "processing";

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        onClick={isRecording ? stopRecording : startRecording}
        disabled={disabled || isProcessing}
        className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl shadow-lg transition-all ${
          isRecording
            ? "bg-red-500 animate-pulse scale-110"
            : isProcessing
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-green-600 hover:bg-green-700 active:scale-95"
        } text-white`}
        aria-label={isRecording ? "Stop recording" : "Start recording"}
      >
        {isProcessing ? "⏳" : isRecording ? "⏹" : "🎙️"}
      </button>

      <p className="text-sm text-gray-500">
        {isRecording
          ? "Recording… tap to stop (max 25s)"
          : isProcessing
          ? "Converting speech to text…"
          : "Tap to speak your question"}
      </p>

      {state === "error" && (
        <p className="text-sm text-red-600 text-center max-w-xs">{errorMsg}</p>
      )}
    </div>
  );
}
