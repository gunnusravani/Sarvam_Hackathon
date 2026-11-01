import "server-only";
import { IMAGE_PROMPT, systemPrompt } from "./prompts";

// Endpoints and schemas verified against the official sarvamai SDK (v0.1.41)
// and the live /v2/models listing for this account.
const BASE = "https://api.sarvam.ai";
const CHAT_MODEL = "sarvam-105b";
const CONVERSATION_MODEL = "sarvam-105b-conversations";
const IMAGE_MODEL = "gemma4"; // supports_image_input: true, whitelisted
const STT_MODEL = "saaras:v4";
const TTS_MODEL = "bulbul:v4-flash";
const TIMEOUT_MS = 85_000;

export class SarvamError extends Error {
  constructor(public status: number, public userMessage: string) {
    super(userMessage);
  }
}

export type ChatTurn = { role: "user" | "assistant"; content: string };

function apiKey(): string {
  // .env currently names the variable SARVAM_API; SARVAM_API_KEY is preferred.
  const key = process.env.SARVAM_API_KEY || process.env.SARVAM_API;
  if (!key) throw new SarvamError(500, "The AI service is not configured on the server.");
  return key;
}

function mapStatus(status: number): SarvamError {
  if (status === 401 || status === 403)
    return new SarvamError(502, "The AI service rejected the server credentials.");
  if (status === 429) return new SarvamError(429, "Too many requests. Please wait a moment and try again.");
  if (status === 400 || status === 422)
    return new SarvamError(400, "The AI service could not process this request.");
  return new SarvamError(502, "The AI service is unavailable right now. Please try again.");
}

async function call(path: string, init: RequestInit): Promise<Response> {
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      ...init,
      headers: { ...(init.headers || {}), "api-subscription-key": apiKey() },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (e) {
    if (e instanceof SarvamError) throw e;
    throw new SarvamError(504, "The AI service took too long to respond. Please try again.");
  }
  if (!res.ok) {
    console.error(`Sarvam ${path} failed with status ${res.status}`);
    throw mapStatus(res.status);
  }
  return res;
}

async function chat(path: string, body: object): Promise<string> {
  const res = await call(path, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => null);
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== "string" || !content.trim())
    throw new SarvamError(502, "The AI service returned an empty answer. Please try again.");
  return content.trim();
}

export async function askQuestion(
  question: string,
  languageName: string,
  history: ChatTurn[],
  imageObservations?: string
): Promise<{ text: string; model: string }> {
  let userContent = question;
  if (imageObservations) {
    userContent = `Automated observations from the farmer's crop photo (uncertain, may be wrong):\n${imageObservations}\n\nFarmer's question: ${question}`;
  }
  const request = (model: string) =>
    chat("/v1/chat/completions", {
      model,
      messages: [{ role: "system", content: systemPrompt(languageName) }, ...history, { role: "user", content: userContent }],
      // sarvam-105b reasons internally; reasoning tokens count against max_tokens.
      reasoning_effort: "low",
      response_format: { type: "json_object" },
      max_tokens: 6000,
      temperature: 0.3,
    });

  // Follow-ups use the conversational model. sarvam-105b occasionally returns an
  // empty message, in which case we retry once on the conversational model.
  if (history.length) return { text: await request(CONVERSATION_MODEL), model: CONVERSATION_MODEL };
  try {
    return { text: await request(CHAT_MODEL), model: CHAT_MODEL };
  } catch (e) {
    if (!(e instanceof SarvamError) || e.status !== 502) throw e;
    return { text: await request(CONVERSATION_MODEL), model: CONVERSATION_MODEL };
  }
}

export async function analyzeImage(imageBase64: string, mimeType: string, cropName?: string): Promise<string> {
  const text = cropName ? `${IMAGE_PROMPT}\nThe farmer says the crop is: ${cropName}.` : IMAGE_PROMPT;
  return chat("/v2/chat/completions", {
    model: IMAGE_MODEL,
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text },
          { type: "image_url", image_url: { url: `data:${mimeType};base64,${imageBase64}` } },
        ],
      },
    ],
    max_tokens: 600,
    temperature: 0.2,
  });
}

export async function transcribeAudio(audio: Blob, fileName: string, languageCode?: string): Promise<string> {
  const form = new FormData();
  form.append("file", audio, fileName);
  form.append("model", STT_MODEL);
  form.append("mode", "transcribe");
  if (languageCode) form.append("language_code", languageCode);
  const res = await call("/speech-to-text", { method: "POST", body: form });
  const data = await res.json().catch(() => null);
  if (typeof data?.transcript !== "string")
    throw new SarvamError(502, "Speech recognition returned no transcript.");
  return data.transcript.trim();
}

export async function synthesizeSpeech(text: string, languageCode: string): Promise<Buffer> {
  // speaker omitted: bulbul:v4-flash uses its documented default voice.
  const res = await call("/text-to-speech", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      text: text.slice(0, 2500),
      language_code: languageCode,
      model: TTS_MODEL,
      output_audio_codec: "mp3",
    }),
  });
  const data = await res.json().catch(() => null);
  const audios: unknown = data?.audios;
  if (!Array.isArray(audios) || !audios.length || typeof audios[0] !== "string")
    throw new SarvamError(502, "Speech generation returned no audio.");
  return Buffer.concat(audios.map((a: string) => Buffer.from(a, "base64")));
}
