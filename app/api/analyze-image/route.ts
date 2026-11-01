import { NextResponse } from "next/server";
import { analyzeImage } from "@/lib/sarvam";
import { fail, handleError, IMAGE_TYPES, MAX_IMAGE_BYTES } from "@/lib/validation";

export const runtime = "nodejs";
export const maxDuration = 90;

export async function POST(req: Request) {
  const form = await req.formData().catch(() => null);
  const image = form?.get("image");
  const cropName = String(form?.get("cropName") || "").slice(0, 60) || undefined;
  if (!(image instanceof Blob) || image.size === 0) return fail(400, "Please choose a crop photo.");
  if (!IMAGE_TYPES.includes(image.type)) return fail(415, "Please upload a JPEG, PNG or WebP photo.");
  if (image.size > MAX_IMAGE_BYTES) return fail(413, "The photo is too large. Please use one under 4 MB.");

  try {
    const base64 = Buffer.from(await image.arrayBuffer()).toString("base64");
    const observations = await analyzeImage(base64, image.type, cropName);
    return NextResponse.json({ observations });
  } catch (e) {
    return handleError(e);
  }
}
