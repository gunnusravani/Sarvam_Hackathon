import { NextRequest, NextResponse } from "next/server";
import { transcribeAudio } from "@/lib/sarvam";
import { validateAudio } from "@/lib/validation";
import { SarvamApiError } from "@/lib/sarvam";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const audioFile = form.get("audio") as File | null;
    const languageCode = (form.get("languageCode") as string) || undefined;

    if (!audioFile) {
      return NextResponse.json(
        { error: { code: "MISSING_AUDIO", message: "No audio file provided." } },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await audioFile.arrayBuffer());
    const mimeType = audioFile.type || "audio/wav";

    const validation = validateAudio(buffer, mimeType);
    if (!validation.ok) {
      return NextResponse.json(
        { error: { code: "INVALID_AUDIO", message: validation.message } },
        { status: 400 }
      );
    }

    const result = await transcribeAudio(buffer, mimeType, languageCode);
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof SarvamApiError) {
      return NextResponse.json(
        { error: { code: "SARVAM_API_ERROR", message: err.message } },
        { status: err.statusCode >= 500 ? 502 : err.statusCode }
      );
    }
    console.error("[/api/transcribe]", err);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred." } },
      { status: 500 }
    );
  }
}
