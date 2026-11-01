import { NextRequest, NextResponse } from "next/server";
import { synthesizeSpeech, SarvamApiError } from "@/lib/sarvam";
import { isTTSSupported } from "@/lib/languages";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { text, languageCode } = body as { text: string; languageCode: string };

    if (!text?.trim()) {
      return NextResponse.json(
        { error: { code: "MISSING_TEXT", message: "No text provided." } },
        { status: 400 }
      );
    }

    if (!isTTSSupported(languageCode)) {
      return NextResponse.json(
        {
          error: {
            code: "TTS_UNSUPPORTED",
            message: `Audio is not available for this language. The written answer is shown above.`,
          },
        },
        { status: 422 }
      );
    }

    const audioBuffer = await synthesizeSpeech(text, languageCode);

    return new NextResponse(new Uint8Array(audioBuffer), {
      status: 200,
      headers: {
        "Content-Type": "audio/wav",
        "Content-Length": String(audioBuffer.byteLength),
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    if (err instanceof SarvamApiError) {
      return NextResponse.json(
        { error: { code: "SARVAM_API_ERROR", message: err.message } },
        { status: err.statusCode >= 500 ? 502 : err.statusCode }
      );
    }
    console.error("[/api/speak]", err);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred." } },
      { status: 500 }
    );
  }
}
