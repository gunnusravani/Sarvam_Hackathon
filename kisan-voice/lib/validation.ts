export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const MAX_AUDIO_BYTES = 10 * 1024 * 1024; // 10 MB
export const ALLOWED_AUDIO_TYPES = [
  "audio/wav",
  "audio/webm",
  "audio/ogg",
  "audio/mpeg",
  "audio/mp4",
  "audio/flac",
];

export function validateImage(
  buffer: Buffer,
  mimeType: string
): { ok: true } | { ok: false; message: string } {
  if (!ALLOWED_IMAGE_TYPES.includes(mimeType)) {
    return { ok: false, message: "Please upload a JPEG, PNG, or WebP image." };
  }
  if (buffer.byteLength > MAX_IMAGE_BYTES) {
    return { ok: false, message: "Image must be smaller than 5 MB." };
  }
  return { ok: true };
}

export function validateAudio(
  buffer: Buffer,
  mimeType: string
): { ok: true } | { ok: false; message: string } {
  if (!ALLOWED_AUDIO_TYPES.includes(mimeType)) {
    return {
      ok: false,
      message: "Unsupported audio format. Please record again.",
    };
  }
  if (buffer.byteLength > MAX_AUDIO_BYTES) {
    return { ok: false, message: "Recording is too long. Please keep it under 30 seconds." };
  }
  return { ok: true };
}

export function requireApiKey(): string {
  const key = process.env.SARVAM_API_KEY;
  if (!key) {
    throw new Error(
      "SARVAM_API_KEY is not configured. Add it to .env.local."
    );
  }
  return key;
}
