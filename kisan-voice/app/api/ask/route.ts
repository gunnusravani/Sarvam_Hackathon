import { NextRequest, NextResponse } from "next/server";
import { askQuestion, SarvamApiError, ChatMessage } from "@/lib/sarvam";
import { LANGUAGES } from "@/lib/languages";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      question,
      languageCode,
      cropName,
      region,
      imageObservations,
      history,
    } = body as {
      question: string;
      languageCode: string;
      cropName?: string;
      region?: string;
      imageObservations?: string;
      history?: ChatMessage[];
    };

    if (!question?.trim()) {
      return NextResponse.json(
        { error: { code: "MISSING_QUESTION", message: "Please enter a question." } },
        { status: 400 }
      );
    }

    const validCode = LANGUAGES.find((l) => l.code === languageCode)?.code ?? "hi-IN";

    const result = await askQuestion(question, validCode, {
      cropName,
      region,
      imageObservations,
      history: (history ?? []).slice(-6), // keep last 3 turns
    });

    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof SarvamApiError) {
      return NextResponse.json(
        { error: { code: "SARVAM_API_ERROR", message: err.message } },
        { status: err.statusCode >= 500 ? 502 : err.statusCode }
      );
    }
    console.error("[/api/ask]", err);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred." } },
      { status: 500 }
    );
  }
}
