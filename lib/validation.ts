import { NextResponse } from "next/server";
import { SarvamError } from "./sarvam";

export const MAX_AUDIO_BYTES = 4 * 1024 * 1024; // under Vercel's 4.5 MB body limit
export const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
export const MAX_QUESTION_CHARS = 2000;
export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function fail(status: number, error: string) {
  return NextResponse.json({ error }, { status });
}

export function handleError(e: unknown) {
  if (e instanceof SarvamError) return fail(e.status, e.userMessage);
  console.error("Unexpected server error");
  return fail(500, "Something went wrong. Please try again.");
}
