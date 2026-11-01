import { getLanguage } from "@/lib/languages";
import { synthesizeSpeech } from "@/lib/sarvam";
import { fail, handleError } from "@/lib/validation";

export const runtime = "nodejs";
export const maxDuration = 90;

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const text = typeof body?.text === "string" ? body.text.trim() : "";
  const lang = getLanguage(body?.languageCode);
  if (!text) return fail(400, "Nothing to read aloud.");
  if (!lang?.tts) return fail(400, "Audio is not available for this language, but your answer is available as text.");

  try {
    const audio = await synthesizeSpeech(text, lang.code);
    return new Response(new Uint8Array(audio), {
      headers: { "content-type": "audio/mpeg", "cache-control": "no-store" },
    });
  } catch (e) {
    return handleError(e);
  }
}
