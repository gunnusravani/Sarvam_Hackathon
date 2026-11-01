"use client";

import { useEffect, useState } from "react";

import type { StructuredAnswer } from "@/lib/prompts";

type Props = { text: string; structured?: StructuredAnswer | null; languageCode: string; ttsSupported: boolean };

function Section({ icon, title, items, tone }: { icon: string; title: string; items: string[]; tone: string }) {
  if (!items.length) return null;
  return (
    <div className={`rounded-2xl p-4 ${tone}`}>
      <h3 className="mb-1 text-sm font-bold uppercase tracking-wide opacity-80">
        <span aria-hidden>{icon}</span> {title}
      </h3>
      <ul className="list-disc space-y-1 pl-5 text-base leading-relaxed">
        {items.map((it, i) => (
          <li key={i}>{it}</li>
        ))}
      </ul>
    </div>
  );
}

export default function AnswerCard({ text, structured: s, languageCode, ttsSupported }: Props) {
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  async function listen() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/speak", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text, languageCode }),
      });
      if (!res.ok) throw new Error();
      setAudioUrl(URL.createObjectURL(await res.blob()));
    } catch {
      setError("I couldn't generate audio, but your answer is available as text.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <article className="rounded-3xl border border-leaf-100 bg-white p-5 shadow-sm">
      <div className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-leaf-600">
        <span aria-hidden>🌱</span> Kisan Voice
      </div>
      {s ? (
        <div className="flex flex-col gap-3">
          <p className="text-lg leading-relaxed">{s.summary}</p>
          <Section icon="🔍" title="Possible causes" items={s.possible_causes} tone="bg-soil-50 text-soil-700" />
          <Section icon="👀" title="What to check" items={s.what_to_check} tone="bg-leaf-50 text-leaf-900" />
          <Section icon="🌱" title="Safe next steps" items={s.safe_next_steps} tone="bg-leaf-100 text-leaf-900" />
          {s.when_to_get_help && (
            <p className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-base text-amber-900">
              <span aria-hidden>☎️</span> {s.when_to_get_help}
            </p>
          )}
          {s.uncertainty && <p className="text-sm italic text-leaf-900/70">{s.uncertainty}</p>}
          <Section icon="❓" title="Tell me more" items={s.follow_up_questions} tone="bg-white border border-leaf-100" />
        </div>
      ) : (
        <div className="whitespace-pre-wrap text-lg leading-relaxed">{text}</div>
      )}
      <div className="mt-4 flex flex-col gap-3">
        {ttsSupported && !audioUrl && (
          <button
            type="button"
            onClick={listen}
            disabled={loading}
            className="flex w-fit items-center gap-2 rounded-full bg-leaf-100 px-5 py-3 text-base font-semibold text-leaf-700 hover:bg-leaf-200 disabled:opacity-60"
          >
            {loading ? (
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-leaf-500/40 border-t-leaf-700" />
            ) : (
              <span aria-hidden>🔊</span>
            )}
            {loading ? "Preparing audio…" : "Listen to answer"}
          </button>
        )}
        {audioUrl && <audio controls src={audioUrl} className="w-full" aria-label="Spoken answer" />}
        {error && <p className="text-sm text-soil-700">{error}</p>}
        <p className="border-t border-leaf-50 pt-3 text-xs text-leaf-900/60">
          General information only, not a confirmed diagnosis. For serious or spreading problems, contact your local
          KVK or agricultural extension officer.
        </p>
      </div>
    </article>
  );
}
