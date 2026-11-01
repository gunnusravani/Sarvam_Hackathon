"use client";

import { useEffect, useRef, useState } from "react";
import AnswerCard from "@/components/AnswerCard";
import VoiceRecorder from "@/components/VoiceRecorder";
import { DEFAULT_LANGUAGE, getLanguage, LANGUAGES } from "@/lib/languages";
import type { StructuredAnswer } from "@/lib/prompts";

type Turn = {
  role: "user" | "assistant";
  content: string;
  structured?: StructuredAnswer | null;
  imagePreview?: string;
  observations?: string;
};

// Downscale photos client-side so uploads stay well under the serverless body limit.
async function shrinkImage(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1280 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("resize failed"))), "image/jpeg", 0.85)
  );
}

export default function Home() {
  const [languageCode, setLanguageCode] = useState(DEFAULT_LANGUAGE);
  const [question, setQuestion] = useState("");
  const [image, setImage] = useState<{ file: File; preview: string } | null>(null);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const lang = getLanguage(languageCode)!;
  const busy = status !== "";

  // Block body: newer Chrome returns a Promise from scrollIntoView, which React would treat as a cleanup.
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [turns, status]);

  function pickImage(file?: File) {
    setError("");
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Please choose a JPEG, PNG or WebP photo.");
      return;
    }
    setImage({ file, preview: URL.createObjectURL(file) });
  }

  async function ask() {
    const q = question.trim();
    if (!q) return setError("Please type or record a question.");
    setError("");
    let observations: string | undefined;
    try {
      if (image) {
        setStatus("Looking at your photo…");
        const form = new FormData();
        form.append("image", await shrinkImage(image.file), "crop.jpg");
        const res = await fetch("/api/analyze-image", { method: "POST", body: form });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "Image analysis failed. You can still ask a text question.");
        observations = data.observations;
      }
      setStatus("Thinking about your question… this can take up to a minute.");
      const history = turns.map(({ role, content }) => ({ role, content }));
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question: q, languageCode, history, imageObservations: observations }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not get an answer. Please try again.");
      setTurns((t) => [
        ...t,
        { role: "user", content: q, imagePreview: image?.preview, observations },
        { role: "assistant", content: data.answer, structured: data.structured },
      ]);
      setQuestion("");
      setImage(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setStatus("");
    }
  }

  function reset() {
    setTurns([]);
    setQuestion("");
    setImage(null);
    setError("");
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col px-4 pb-10">
      <header className="flex items-center justify-between gap-3 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-leaf-700 text-2xl shadow" aria-hidden>
            🌾
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-leaf-700">Kisan Voice</h1>
            <p className="text-sm text-soil-700">Your farm. Your language. Your voice.</p>
          </div>
        </div>
        <label className="flex flex-col text-xs font-medium text-leaf-900/70">
          Language
          <select
            value={languageCode}
            onChange={(e) => setLanguageCode(e.target.value)}
            className="mt-1 rounded-xl border border-leaf-200 bg-white px-3 py-2 text-base font-semibold text-leaf-900 focus:outline-none focus:ring-2 focus:ring-leaf-500"
          >
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.native} · {l.name}
              </option>
            ))}
          </select>
        </label>
      </header>

      <section className="flex flex-1 flex-col gap-4" aria-live="polite">
        {turns.length === 0 && !busy && (
          <div className="rounded-3xl bg-gradient-to-br from-leaf-700 to-leaf-500 p-6 text-white shadow-md">
            <h2 className="text-xl font-bold">Ask about your crops</h2>
            <p className="mt-2 text-base text-white/90">
              Speak or type in your language. Add a photo of the affected leaf or plant for extra context.
            </p>
            <ul className="mt-4 space-y-1 text-sm text-white/85">
              <li>• “मेरी गेहूं की पत्तियाँ पीली क्यों हो रही हैं?”</li>
              <li>• “When should I water tomato seedlings in summer?”</li>
            </ul>
          </div>
        )}

        {turns.map((t, i) =>
          t.role === "user" ? (
            <div key={i} className="ml-auto max-w-[85%] rounded-3xl rounded-br-md bg-leaf-700 px-5 py-3 text-lg text-white">
              {t.imagePreview && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={t.imagePreview} alt="Your crop photo" className="mb-2 max-h-48 rounded-2xl" />
              )}
              {t.content}
              {t.observations && (
                <details className="mt-2 text-sm text-white/85">
                  <summary className="cursor-pointer">What the photo model saw (uncertain)</summary>
                  <p className="mt-1 whitespace-pre-wrap">{t.observations}</p>
                </details>
              )}
            </div>
          ) : (
            <AnswerCard key={i} text={t.content} structured={t.structured} languageCode={languageCode} ttsSupported={lang.tts} />
          )
        )}

        {busy && (
          <div className="flex items-center gap-3 rounded-3xl bg-white p-5 text-base text-leaf-700 shadow-sm">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-leaf-200 border-t-leaf-700" />
            {status}
          </div>
        )}
        <div ref={endRef} />
      </section>

      <section className="sticky bottom-0 mt-6 rounded-3xl border border-leaf-100 bg-white/95 p-5 shadow-lg backdrop-blur">
        {lang.stt && (
          <VoiceRecorder
            languageCode={languageCode}
            disabled={busy}
            onError={setError}
            onTranscript={(t) => setQuestion((q) => (q ? `${q} ${t}` : t))}
          />
        )}

        <label htmlFor="question" className="mt-4 block text-sm font-semibold text-leaf-900/80">
          {turns.length ? "Ask a follow-up" : "Your question"} <span className="font-normal">(review or edit before asking)</span>
        </label>
        <textarea
          id="question"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          rows={3}
          maxLength={2000}
          placeholder="Type your question here…"
          className="mt-1 w-full resize-none rounded-2xl border border-leaf-200 bg-leaf-50 p-4 text-lg focus:outline-none focus:ring-2 focus:ring-leaf-500"
        />

        {image && (
          <div className="mt-3 flex items-center gap-3 rounded-2xl bg-soil-100 p-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={image.preview} alt="Selected crop photo" className="h-16 w-16 rounded-xl object-cover" />
            <span className="flex-1 truncate text-sm text-soil-700">{image.file.name}</span>
            <button
              type="button"
              onClick={() => setImage(null)}
              className="rounded-full px-3 py-2 text-sm font-semibold text-soil-700 hover:bg-soil-50"
            >
              Remove
            </button>
          </div>
        )}

        {error && (
          <p role="alert" className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-base text-red-800">
            {error}
          </p>
        )}

        <div className="mt-4 flex flex-wrap gap-3">
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              pickImage(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={busy}
            className="flex items-center gap-2 rounded-2xl border-2 border-dashed border-soil-500/50 px-4 py-3 text-base font-semibold text-soil-700 hover:bg-soil-50 disabled:opacity-50"
          >
            📷 {image ? "Change photo" : "Add crop photo"}
          </button>
          <button
            type="button"
            onClick={ask}
            disabled={busy || !question.trim()}
            className="flex-1 rounded-2xl bg-leaf-700 px-6 py-3 text-lg font-bold text-white shadow hover:bg-leaf-600 disabled:opacity-50"
          >
            {busy ? "Please wait…" : "Ask"}
          </button>
          {turns.length > 0 && (
            <button
              type="button"
              onClick={reset}
              disabled={busy}
              className="rounded-2xl px-4 py-3 text-base font-semibold text-leaf-700 hover:bg-leaf-50"
            >
              New question
            </button>
          )}
        </div>
      </section>
    </main>
  );
}
