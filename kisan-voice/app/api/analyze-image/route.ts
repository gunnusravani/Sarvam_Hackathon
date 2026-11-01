import { NextRequest, NextResponse } from "next/server";
import { analyzeImage, SarvamApiError } from "@/lib/sarvam";
import { validateImage } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const imageFile = form.get("image") as File | null;
    const cropName = (form.get("cropName") as string) || undefined;

    if (!imageFile) {
      return NextResponse.json(
        { error: { code: "MISSING_IMAGE", message: "No image file provided." } },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await imageFile.arrayBuffer());
    const mimeType = imageFile.type || "image/jpeg";

    const validation = validateImage(buffer, mimeType);
    if (!validation.ok) {
      return NextResponse.json(
        { error: { code: "INVALID_IMAGE", message: validation.message } },
        { status: 400 }
      );
    }

    const result = await analyzeImage(buffer, mimeType, cropName);
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof SarvamApiError) {
      return NextResponse.json(
        { error: { code: "SARVAM_API_ERROR", message: err.message } },
        { status: err.statusCode >= 500 ? 502 : err.statusCode }
      );
    }
    console.error("[/api/analyze-image]", err);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred." } },
      { status: 500 }
    );
  }
}
