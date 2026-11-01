# Kisan Voice

**Your farm. Your language. Your voice.**

A voice-first, multilingual agricultural information assistant for Indian farmers, built on Sarvam AI. A farmer can ask by voice or text in 11 Indian languages, attach a crop photo, get a cautious structured answer, and listen to it.

> Kisan Voice gives general information only. It does not give confirmed diagnoses or pesticide/fertilizer dosages. For serious crop problems, contact your local KVK or agricultural extension officer.

## Architecture

A single Next.js 15 app (App Router, TypeScript, Tailwind) deployed on Vercel. All Sarvam calls are server-side in `lib/sarvam.ts`, so the API key never reaches the browser.

| Route | Sarvam API | Model |
|---|---|---|
| `POST /api/transcribe` | `POST https://api.sarvam.ai/speech-to-text` (multipart) | `saaras:v4` |
| `POST /api/ask` | `POST https://api.sarvam.ai/v1/chat/completions` (JSON output) | `sarvam-105b` (first turn), `sarvam-105b-conversations` (follow-ups, and fallback when 105b returns empty) |
| `POST /api/analyze-image` | `POST https://api.sarvam.ai/v2/chat/completions` (inline base64 data URI) | `gemma4` (listed with `supports_image_input: true` in `/v2/models`) |
| `POST /api/speak` | `POST https://api.sarvam.ai/text-to-speech` | `bulbul:v4-flash` (default voice) |

Language support (`lib/languages.ts`): Hindi, English, Marathi, Telugu, Tamil, Bengali, Gujarati, Punjabi, Kannada, Malayalam, Odia. This is the overlap of the Saaras and Bulbul language enums in `sarvamai` 0.1.41. Tested live: Hindi (chat, STT, TTS), English (chat), Telugu (chat).

## Prerequisites

- Node.js 20+ (developed on Node 26.5, npm 11.17)
- Python 3.9+ (only for the SDK smoke test)

## Environment

`.env` (never committed). See `.env.example`:

- `SARVAM_API_KEY`: your Sarvam API subscription key. The legacy name `SARVAM_API` is also accepted.

## Run locally

```bash
npm ci
npm run dev        # http://localhost:3000
npm run build && npm start   # production build
```

## Sarvam SDK smoke test (Python)

```bash
python3 -m venv .venv && source .venv/bin/activate
python -m pip install -r requirements.txt
set -a; source .env; set +a
python scripts/sarvam_smoke_test.py
```

## Deploy to Vercel

1. Import this GitHub repo in Vercel (framework: Next.js, defaults are fine).
2. Project Settings → Environment Variables: add `SARVAM_API_KEY` for Production and Preview. Do not use a `NEXT_PUBLIC_` prefix.
3. Deploy. Pushes to `main` redeploy automatically.

## Known limitations

- `sarvam-105b` first-turn answers take about 40–70 s because the model reasons internally. Follow-ups on `sarvam-105b-conversations` take about 1–5 s.
- Voice recordings are capped at 28 s (the Saaras synchronous REST limit is 30 s). Uploads are capped at 4 MB to stay within Vercel's 4.5 MB body limit. Photos are downscaled in the browser.
- Image observations come from a general vision model and are shown as uncertain. They are not a disease diagnosis.
- Conversation history lives only in the browser tab. Nothing is stored server-side.
