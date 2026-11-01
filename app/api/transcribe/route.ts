import { NextResponse } from "next/server";
import { getLanguage } from "@/lib/languages";
import { transcribeAudio } from "@/lib/sarvam";
import { fail, handleError, MAX_AUDIO_BYTES } from "@/lib/validation";

export const runtime = "nodejs";
export const maxDuration = 90;

const EXT: Record<string, string> = { webm: "webm", ogg: "ogg", mp4: "mp4", mpeg: "mp3", wav: "wav", "x-m4a": "m4a" };

export async function POST(req: Request) {
  const form = await req.formData().catch(() => null);
  const audio = form?.get("audio");
  const lang = getLanguage(String(form?.get("languageCode") || ""));
  if (!(audio instanceof Blob) || audio.size === 0) return fail(400, "Please record a short voice question.");
  if (audio.size > MAX_AUDIO_BYTES) return fail(413, "The recording is too long. Please make it shorter.");
  const baseType = audio.type.split(";")[0].trim();
  const subtype = baseType.split("/")[1] || "";
  if (!baseType.startsWith("audio/") || !EXT[subtype]) return fail(415, "Unsupported audio format.");
  if (!lang?.stt) return fail(400, "Voice input is not supported for this language. Please type instead.");

  try {
    // Browsers report e.g. "audio/webm;codecs=opus"; Sarvam only accepts the bare MIME type.
    const clean = new Blob([await audio.arrayBuffer()], { type: baseType });
    const transcript = await transcribeAudio(clean, `question.${EXT[subtype]}`, lang.code);
    if (!transcript) return fail(422, "We could not hear any speech. Please try again.");
    return NextResponse.json({ transcript });
  } catch (e) {
    return handleError(e);
  }
}
