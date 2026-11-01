import { NextResponse } from "next/server";
import { getLanguage } from "@/lib/languages";
import { answerToText, parseAnswer } from "@/lib/prompts";
import { askQuestion, type ChatTurn } from "@/lib/sarvam";
import { fail, handleError, MAX_QUESTION_CHARS } from "@/lib/validation";

export const runtime = "nodejs";
export const maxDuration = 90;

const MAX_HISTORY = 6;

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const question = typeof body?.question === "string" ? body.question.trim() : "";
  const lang = getLanguage(body?.languageCode);
  if (!question) return fail(400, "Please type or record a question.");
  if (question.length > MAX_QUESTION_CHARS) return fail(400, "The question is too long. Please shorten it.");
  if (!lang?.chat) return fail(400, "This language is not supported.");

  const history: ChatTurn[] = Array.isArray(body?.history)
    ? body.history
        .filter(
          (t: ChatTurn) =>
            (t?.role === "user" || t?.role === "assistant") && typeof t.content === "string" && t.content.trim()
        )
        .slice(-MAX_HISTORY)
        .map((t: ChatTurn) => ({ role: t.role, content: t.content.slice(0, 3000) }))
    : [];
  const observations =
    typeof body?.imageObservations === "string" ? body.imageObservations.slice(0, 3000) : undefined;

  try {
    const { text: raw, model } = await askQuestion(question, lang.name, history, observations);
    const structured = parseAnswer(raw);
    // If the model did not return valid JSON, fall back to its text, but never show raw JSON.
    const text = structured ? answerToText(structured) : raw.trim().startsWith("{") ? "" : raw;
    if (!text) return fail(502, "Could not get a clear answer. Please try again.");
    return NextResponse.json({ answer: text, structured, model });
  } catch (e) {
    return handleError(e);
  }
}
