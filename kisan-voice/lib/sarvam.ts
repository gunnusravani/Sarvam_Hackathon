import { buildSystemPrompt, buildImageAnalysisPrompt } from "./prompts";
import { getLanguage } from "./languages";

const SARVAM_HOST = "https://api.sarvam.ai";
const TIMEOUT_MS = 30_000;

function getApiKey(): string {
  const key = process.env.SARVAM_API_KEY;
  if (!key) throw new Error("SARVAM_API_KEY environment variable is not set.");
  return key;
}

function sarvamHeaders(apiKey: string): Record<string, string> {
  return {
    "api-subscription-key": apiKey,
  };
}

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  ms = TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

// ── Speech-to-Text (Saaras v4) ────────────────────────────────────────────────

export async function transcribeAudio(
  audioBuffer: Buffer,
  mimeType: string,
  languageCode?: string
): Promise<{ transcript: string; languageCode: string }> {
  const apiKey = getApiKey();

  const form = new FormData();
  form.append(
    "file",
    new Blob([new Uint8Array(audioBuffer)], { type: mimeType }),
    "audio.wav"
  );
  form.append("model", "saaras:v4");
  form.append("mode", "transcribe");
  if (languageCode) form.append("language_code", languageCode);

  const res = await fetchWithTimeout(
    `${SARVAM_HOST}/speech-to-text`,
    { method: "POST", headers: sarvamHeaders(apiKey), body: form }
  );

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error("[sarvam] STT error", res.status, body);
    throw new SarvamApiError("Speech recognition failed. Please try again.", res.status);
  }

  const data = await res.json();
  return {
    transcript: data.transcript ?? "",
    languageCode: data.language_code ?? languageCode ?? "hi-IN",
  };
}

// ── Image Analysis (Gemma 4 / GLM via Token Factory) ─────────────────────────

export async function analyzeImage(
  imageBuffer: Buffer,
  mimeType: string,
  cropName?: string
): Promise<{ observations: string; uncertainty: string }> {
  const apiKey = getApiKey();

  const base64 = imageBuffer.toString("base64");
  const dataUri = `data:${mimeType};base64,${base64}`;

  const contextNote = cropName ? ` The crop is: ${cropName}.` : "";
  const userMessage = buildImageAnalysisPrompt() + contextNote;

  const body = {
    model: "gemma4",
    messages: [
      {
        role: "user",
        content: [
          { type: "image_url", image_url: { url: dataUri } },
          { type: "text", text: userMessage },
        ],
      },
    ],
    max_tokens: 300,
    temperature: 0.2,
  };

  const res = await fetchWithTimeout(
    `${SARVAM_HOST}/v2/chat/completions`,
    {
      method: "POST",
      headers: { ...sarvamHeaders(apiKey), "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) {
    const errBody = await res.text().catch(() => "");
    console.error("[sarvam] image analysis error", res.status, errBody);
    throw new SarvamApiError(
      "Image analysis is currently unavailable. Your question will be answered without image context.",
      res.status
    );
  }

  const data = await res.json();
  const text: string = data.choices?.[0]?.message?.content ?? "";

  return {
    observations: text,
    uncertainty: "The cause cannot be confirmed from this image alone.",
  };
}

// ── Agricultural Q&A (Sarvam-105B) ───────────────────────────────────────────

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AskResult {
  answer: string;
  languageCode: string;
  followUpQuestions: string[];
  disclaimer: string;
}

export async function askQuestion(
  question: string,
  languageCode: string,
  opts: {
    cropName?: string;
    region?: string;
    imageObservations?: string;
    history?: ChatMessage[];
  } = {}
): Promise<AskResult> {
  const apiKey = getApiKey();
  const lang = getLanguage(languageCode);
  const langName = lang ? `${lang.name} (${lang.nativeName})` : languageCode;

  let userContent = question;
  if (opts.cropName) userContent += `\n\nCrop: ${opts.cropName}`;
  if (opts.region) userContent += `\nRegion: ${opts.region}`;
  if (opts.imageObservations) {
    userContent += `\n\nVisual observations from crop photo: ${opts.imageObservations}`;
  }

  const messages: ChatMessage[] = [
    ...(opts.history ?? []),
    { role: "user", content: userContent },
  ];

  const body = {
    model: "sarvam-105b",
    messages: [
      { role: "system", content: buildSystemPrompt(langName) },
      ...messages,
    ],
    max_tokens: 4096,
    temperature: 0.4,
  };

  const res = await fetchWithTimeout(
    `${SARVAM_HOST}/v1/chat/completions`,
    {
      method: "POST",
      headers: { ...sarvamHeaders(apiKey), "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) {
    const errBody = await res.text().catch(() => "");
    console.error("[sarvam] ask error", res.status, errBody);
    throw new SarvamApiError("The AI service is temporarily unavailable. Please try again.", res.status);
  }

  const data = await res.json();
  const rawText: string = data.choices?.[0]?.message?.content ?? "";

  // Parse the trailing JSON the prompt requests
  let followUpQuestions: string[] = [];
  let disclaimer = "Kisan Voice provides general agricultural information. It does not replace advice from a qualified agricultural expert.";
  let answer = rawText.trim();

  const jsonMatch = rawText.match(/\{[\s\S]*"followUpQuestions"[\s\S]*\}$/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      followUpQuestions = parsed.followUpQuestions ?? [];
      disclaimer = parsed.disclaimer ?? disclaimer;
      answer = rawText.slice(0, rawText.lastIndexOf(jsonMatch[0])).trim();
    } catch {
      // keep answer as-is
    }
  }

  return { answer, languageCode, followUpQuestions, disclaimer };
}

// ── Text-to-Speech (Bulbul v4-flash) ─────────────────────────────────────────

export async function synthesizeSpeech(
  text: string,
  languageCode: string
): Promise<Buffer> {
  const apiKey = getApiKey();
  const lang = getLanguage(languageCode);

  if (!lang?.ttsSupported) {
    throw new SarvamApiError(
      `Text-to-speech is not available for ${lang?.name ?? languageCode}.`,
      422
    );
  }

  // Bulbul v4-flash accepts up to ~500 chars per call; truncate gracefully
  const truncated = text.length > 500 ? text.slice(0, 497) + "…" : text;

  const body = {
    inputs: [truncated],
    target_language_code: languageCode,
    speaker: lang.ttsVoice ?? "meera",
    model: "bulbul:v4-flash",
    pitch: 0,
    pace: 1.0,
    loudness: 1.0,
    speech_sample_rate: 22050,
    enable_preprocessing: true,
  };

  const res = await fetchWithTimeout(
    `${SARVAM_HOST}/text-to-speech`,
    {
      method: "POST",
      headers: { ...sarvamHeaders(apiKey), "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) {
    const errBody = await res.text().catch(() => "");
    console.error("[sarvam] TTS error", res.status, errBody);
    throw new SarvamApiError("Audio generation failed. The written answer is still available.", res.status);
  }

  const data = await res.json();
  const b64: string = data.audios?.[0];
  if (!b64) throw new SarvamApiError("No audio returned from TTS service.", 500);

  return Buffer.from(b64, "base64");
}

// ── Error class ───────────────────────────────────────────────────────────────

export class SarvamApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number
  ) {
    super(message);
    this.name = "SarvamApiError";
  }
}
