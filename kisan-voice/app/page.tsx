"use client";

import { useState, useRef } from "react";
import LanguageSelector from "@/components/LanguageSelector";
import VoiceRecorder from "@/components/VoiceRecorder";
import ImageUploader from "@/components/ImageUploader";
import AnswerCard from "@/components/AnswerCard";
import { DEFAULT_LANGUAGE_CODE } from "@/lib/languages";

interface HistoryEntry {
  role: "user" | "assistant";
  content: string;
}

interface AnswerState {
  answer: string;
  disclaimer: string;
  followUpQuestions: string[];
  languageCode: string;
}

export default function Home() {
  const [languageCode, setLanguageCode] = useState(DEFAULT_LANGUAGE_CODE);
  const [question, setQuestion] = useState("");
  const [cropName, setCropName] = useState("");
  const [, setImageFile] = useState<File | null>(null);
  const [imageObservations, setImageObservations] = useState<string | null>(null);
  const [imageAnalyzing, setImageAnalyzing] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [answer, setAnswer] = useState<AnswerState | null>(null);

  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioLoading, setAudioLoading] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);

  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const prevAudioUrl = useRef<string | null>(null);

  // ── Image analysis ──────────────────────────────────────────────────────────

  const handleImageSelected = async (file: File | null) => {
    setImageFile(file);
    setImageObservations(null);
    setImageError(null);

    if (!file) return;

    setImageAnalyzing(true);
    try {
      const form = new FormData();
      form.append("image", file);
      if (cropName) form.append("cropName", cropName);

      const res = await fetch("/api/analyze-image", { method: "POST", body: form });
      const data = await res.json();

      if (!res.ok || data.error) {
        setImageError(data.error?.message ?? "Image analysis failed.");
      } else {
        setImageObservations(data.observations);
      }
    } catch {
      setImageError("Image analysis failed. Your question will proceed without image context.");
    } finally {
      setImageAnalyzing(false);
    }
  };

  // ── Ask question ────────────────────────────────────────────────────────────

  const submitQuestion = async (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) {
      setError("Please enter or speak a question.");
      return;
    }

    // Release previous audio
    if (prevAudioUrl.current) {
      URL.revokeObjectURL(prevAudioUrl.current);
      prevAudioUrl.current = null;
    }
    setAudioUrl(null);
    setAudioError(null);
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: trimmed,
          languageCode,
          cropName: cropName || undefined,
          imageObservations: imageObservations ?? undefined,
          history,
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setError(data.error?.message ?? "Failed to get an answer. Please try again.");
        return;
      }

      setAnswer({
        answer: data.answer,
        disclaimer: data.disclaimer,
        followUpQuestions: data.followUpQuestions ?? [],
        languageCode: data.languageCode,
      });

      // Update conversation history (keep last 3 user+assistant pairs = 6 entries)
      setHistory((prev) =>
        [
          ...prev,
          { role: "user" as const, content: trimmed },
          { role: "assistant" as const, content: data.answer },
        ].slice(-6)
      );
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── TTS ─────────────────────────────────────────────────────────────────────

  const handleListenRequest = async () => {
    if (!answer) return;
    setAudioLoading(true);
    setAudioError(null);

    try {
      const res = await fetch("/api/speak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: answer.answer, languageCode }),
      });

      if (!res.ok) {
        const data = await res.json();
        setAudioError(data.error?.message ?? "Audio generation failed.");
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      prevAudioUrl.current = url;
      setAudioUrl(url);
    } catch {
      setAudioError("Could not load audio. The written answer is available above.");
    } finally {
      setAudioLoading(false);
    }
  };

  // ── Reset ────────────────────────────────────────────────────────────────────

  const handleReset = () => {
    setQuestion("");
    setCropName("");
    setImageFile(null);
    setImageObservations(null);
    setImageError(null);
    setAnswer(null);
    setError(null);
    setAudioUrl(null);
    setAudioError(null);
    setHistory([]);
    if (prevAudioUrl.current) {
      URL.revokeObjectURL(prevAudioUrl.current);
      prevAudioUrl.current = null;
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  const isSubmitting = loading || imageAnalyzing;

  return (
    <main className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <header className="text-center space-y-1">
          <h1 className="text-3xl font-bold text-green-800">🌾 Kisan Voice</h1>
          <p className="text-gray-500 text-sm">खेती की बात, अपनी भाषा में।</p>
        </header>

        {/* Language selector */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 text-center">
            Select language / भाषा चुनें
          </p>
          <LanguageSelector value={languageCode} onChange={(code) => {
            setLanguageCode(code);
            setAudioUrl(null);
            setAudioError(null);
          }} />
        </section>

        {/* Input section */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-5">
          {/* Voice recorder */}
          <div className="flex flex-col items-center">
            <VoiceRecorder
              languageCode={languageCode}
              onTranscript={(text) => setQuestion((prev) => (prev ? prev + " " + text : text))}
              disabled={isSubmitting}
            />
          </div>

          <div className="flex items-center gap-2 text-gray-300">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400">or type</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Text input */}
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Type your crop question here…"
            rows={3}
            disabled={isSubmitting}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base resize-none focus:outline-none focus:ring-2 focus:ring-green-400 disabled:bg-gray-50"
          />

          {/* Crop name (optional) */}
          <input
            type="text"
            value={cropName}
            onChange={(e) => setCropName(e.target.value)}
            placeholder="Crop name (optional, e.g. Tomato)"
            disabled={isSubmitting}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 disabled:bg-gray-50"
          />

          {/* Image uploader */}
          <div className="flex flex-col items-center">
            <ImageUploader onFile={handleImageSelected} disabled={isSubmitting} />
            {imageAnalyzing && (
              <p className="text-xs text-gray-500 mt-2 animate-pulse">Analyzing crop photo…</p>
            )}
            {imageObservations && !imageAnalyzing && (
              <p className="text-xs text-green-700 mt-2 text-center max-w-xs">
                ✅ Photo analyzed — observations will be included with your question.
              </p>
            )}
            {imageError && (
              <p className="text-xs text-amber-600 mt-2 text-center max-w-xs">{imageError}</p>
            )}
          </div>

          {/* Submit */}
          <button
            onClick={() => submitQuestion(question)}
            disabled={isSubmitting || !question.trim()}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white font-semibold py-3 rounded-xl text-lg transition-colors"
          >
            {loading ? "Getting answer…" : "Ask Kisan Voice"}
          </button>

          {error && (
            <p className="text-sm text-red-600 text-center">{error}</p>
          )}
        </section>

        {/* Answer */}
        {answer && (
          <section>
            <AnswerCard
              answer={answer.answer}
              disclaimer={answer.disclaimer}
              followUpQuestions={answer.followUpQuestions}
              audioUrl={audioUrl}
              audioLoading={audioLoading}
              audioError={audioError}
              onListenRequest={handleListenRequest}
              onFollowUp={(q) => {
                setQuestion(q);
                submitQuestion(q);
              }}
            />

            <button
              onClick={handleReset}
              className="mt-4 w-full border border-gray-300 text-gray-600 hover:bg-gray-50 py-2.5 rounded-xl text-sm font-medium transition-colors"
            >
              Ask another question
            </button>
          </section>
        )}

        {/* Disclaimer */}
        <footer className="text-center text-xs text-gray-400 pb-4">
          Kisan Voice provides general agricultural information. It does not replace advice from a qualified agricultural expert.
        </footer>
      </div>
    </main>
  );
}
