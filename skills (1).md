# Kisan Voice — Claude Code Project Skills & Working Instructions

This file defines how an AI coding agent (Claude Code or another local coding harness) should work on Kisan Voice. Read this file and `spec.md` before changing code.

## 1. Your role

Act as a senior full-stack engineer who is responsible for delivering a working, deployable hackathon MVP.

Do not stop at explanations, pseudocode, or a static UI. Implement the application, run it locally, test the main user journeys, fix errors, and provide deployment instructions.

The product is **Kisan Voice**, a multilingual, voice-first agricultural information assistant. Its purpose is to help farmers ask basic crop-care questions in their preferred Indian language using text or speech, optionally attach a crop photo, and receive a cautious written and spoken response.

## 2. Mandatory project rules

1. Read `spec.md` completely before implementation.
2. Use Sarvam APIs for every AI capability in this project.
3. Do not use OpenAI, Gemini, Anthropic APIs, Groq, or any other AI provider as a fallback.
4. Never expose `SARVAM_API_KEY` in browser code, `NEXT_PUBLIC_*` variables, HTML, local storage, client logs, or committed files.
5. All Sarvam requests must originate from server-side Next.js route handlers.
6. Use documented, currently available Sarvam model IDs and endpoints. Do not guess request fields, speaker IDs, or language codes.
7. Important distinction: `sarvam-105b` is text-only. Do not send image input to it.
8. For crop photographs, use a Sarvam-hosted image-input model through Token Factory `/v2/chat/completions` (for example, `gemma4` or `glm5.3-flash`, if enabled). Do not confuse Sarvam Vision document OCR with crop-image diagnosis.
9. Do not describe image observations as a confirmed plant disease diagnosis.
10. Build the smallest end-to-end product first. Avoid unnecessary features.
11. Test after each integration. Do not claim something works unless you have run it.
12. Never overwrite working code blindly. Inspect the existing project and preserve useful work.

## 3. Required Sarvam services

Use the official docs linked in `spec.md`.

### Speech input
- Model: `saaras:v4`
- Endpoint: `POST https://api.sarvam.ai/speech-to-text`
- Mode: `transcribe`
- Use multipart form data.
- Keep synchronous recordings within the documented 30-second limit.
- Return the transcript to the UI for user review/editing.

### Crop image understanding
- Endpoint: `POST https://api.sarvam.ai/v2/chat/completions`
- Use a multimodal model that accepts image input, such as `gemma4` or `glm5.3-flash`, subject to API-key access.
- Image must be supplied as an inline base64 data URI in the documented `image_url` content part. Remote image URLs are not accepted by this endpoint.
- Prompt the model to describe visible symptoms and uncertainty only.
- Never use `sarvam-105b` for image input.

### Text reasoning
- Model: `sarvam-105b`
- Endpoint: `POST https://api.sarvam.ai/v1/chat/completions` (or documented V2 route).
- Use a strong system prompt to keep answers in the selected language and native script.
- Pass the user's question, crop context, optional visual observations, and a short recent conversation history.

### Speech output
- Model: `bulbul:v4-flash`
- Endpoint: `POST https://api.sarvam.ai/text-to-speech`
- Use a speaker ID from the current official voice catalog.
- Use the correct language code for the selected voice.
- Send Indic-language text in its native script, not romanized spelling.
- If the selected language is unsupported by the configured TTS model, keep the text answer available and gracefully disable audio.

### Authentication
Use the documented `api-subscription-key` header and `SARVAM_API_KEY` server environment variable unless the current official endpoint documentation specifies otherwise.

## 4. Recommended implementation stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Browser MediaRecorder API
- Next.js Route Handlers
- Vercel deployment

Prefer direct server-side `fetch` calls to Sarvam REST APIs if that is the simplest reliable implementation. An official SDK may be used if it is current and supports the required endpoints. Do not add dependencies without a reason.

No database or authentication is required for the hackathon MVP.

## 5. Required application routes

Implement these server-side routes as described in `spec.md`:

- `POST /api/transcribe`
- `POST /api/analyze-image`
- `POST /api/ask`
- `POST /api/speak`

Each route must:
- Validate request inputs.
- Check that `SARVAM_API_KEY` exists.
- Call only the relevant Sarvam API.
- Apply a reasonable timeout.
- Handle provider errors and rate limits.
- Return a predictable JSON response or audio response.
- Avoid logging secrets or unnecessary user data.

Keep provider request construction in `lib/sarvam.ts` rather than duplicating headers and URL construction in components.

## 6. User experience requirements

The interface must be:
- Mobile-first.
- Simple enough for a user with limited digital literacy.
- Accessible with large buttons and readable text.
- Clear about recording, processing, and playback states.
- Usable by typing even if microphone access is denied.
- Usable without uploading an image.
- Able to show and edit the speech transcript before asking the LLM.
- Able to play the generated audio answer.
- Clear when a language does not support speech output.

Do not build a complicated dashboard. The primary screen should focus on language selection, voice/text question, optional crop photo, answer, and audio playback.

## 7. Agricultural safety behavior

The assistant must not:
- Claim that a crop disease is definitely present based only on an image.
- Recommend pesticide dosages, chemical mixtures, or hazardous treatments.
- Invent local weather, market prices, soil tests, government schemes, or live agricultural data.
- Pretend that it consulted an agricultural expert or external database when it did not.

The assistant should:
- Use phrases such as “possible causes include” and “the image may show”.
- Ask clarifying questions when the crop, location, symptoms, or conditions are unclear.
- Prefer safe observation and general crop-care suggestions.
- Recommend a local KVK, agricultural extension officer, or qualified agronomist for severe or spreading problems.
- Keep language simple and match the user's selected language.

## 8. Suggested system prompt behavior

Use a prompt similar to this for the Sarvam-105B call (improve it if testing reveals issues):

```text
You are Kisan Voice, a careful agricultural information assistant for Indian farmers.

The user selected language: {language}.
Always respond in that language and its normal native script. Use simple, respectful language that a farmer can understand. Avoid unnecessary English technical terms.

You may receive:
- The user's question.
- Crop name and region, if provided.
- Visual observations produced by an image-capable model.
- A short conversation history.

Treat image observations as uncertain. A photograph alone is not enough to confirm a disease, pest, nutrient deficiency, or other diagnosis. Explain plausible possibilities, not certainties.

Ask concise follow-up questions when important context is missing. Prefer low-risk observation and general care guidance. Never prescribe pesticide dosage, chemical mixtures, or hazardous treatment. Do not invent weather, market prices, local data, or expert consultation.

For severe, spreading, or high-stakes crop problems, advise the user to contact a local Krishi Vigyan Kendra (KVK), agricultural extension officer, or qualified agronomist.

Keep the answer concise and structured:
1. What may be happening.
2. What the user can safely check.
3. What additional information would help.
4. When to contact a local expert.

Do not claim certainty when evidence is insufficient.
```

## 9. Development workflow

Follow this order. Keep each step small and verify it before moving on.

### Step 1 — Inspect and plan
- Inspect the repository and current files.
- Read `spec.md`.
- Identify the existing framework and preserve it if it is already suitable.
- Check available scripts and dependencies.
- Report a short implementation plan before large changes.

### Step 2 — Build the UI shell
- Create the main mobile-first screen.
- Add language selector.
- Add text input.
- Add image picker with preview.
- Add microphone recording control.
- Add answer and audio player areas.
- Use realistic empty/loading/error states.

### Step 3 — Configure environment
- Create `.env.example` containing only `SARVAM_API_KEY=`.
- Ensure `.env.local` is ignored by Git.
- Never ask the user to paste the API key into source code or chat.
- If the key is not configured, keep the app buildable and show a developer-facing setup message.

### Step 4 — Integrate text question and Sarvam-105B
- Implement `/api/ask`.
- Verify a typed Hindi question returns a Hindi answer.
- Verify a typed English question returns an answer in the selected language.
- Handle errors and malformed responses.

### Step 5 — Integrate crop image understanding
- Implement `/api/analyze-image`.
- Validate and size-limit the image.
- Convert it to an inline base64 data URI on the server.
- Call a Sarvam Token Factory image-input model.
- Return a cautious visual observation.
- Verify that the selected model is enabled for the user's key.

### Step 6 — Integrate speech
- Implement `/api/transcribe` with Saaras v4.
- Use MediaRecorder in the browser.
- Keep the recording short enough for the synchronous endpoint.
- Display the transcript and allow editing.
- Implement `/api/speak` with Bulbul v4 Flash.
- Return playable audio and verify it in the browser.

### Step 7 — Connect the complete flow
- A user can ask a question with no image.
- A user can ask a question with an image.
- A user can ask by voice.
- The final answer uses the optional visual observations.
- The user can listen to the answer.
- Follow-up questions preserve a small amount of conversation context.

### Step 8 — Test
Run lint, typecheck, build, and relevant tests. Fix all errors introduced by the implementation.

Manually test:
- Hindi typed question.
- Hindi voice question.
- Telugu or Marathi text question.
- Crop image upload.
- Image upload with an empty question.
- Unsupported TTS language.
- Missing API key.
- Invalid file.
- Sarvam API error or timeout.
- Follow-up question.

Do not claim successful live API integration if only mocked responses were tested.

### Step 9 — Deploy
- Deploy to Vercel if the project is compatible.
- Set `SARVAM_API_KEY` in Vercel environment variables.
- Verify the production deployment in a fresh browser session.
- Test at least one live Sarvam end-to-end flow on the deployed URL.

## 10. Coding standards

- Use TypeScript types for API request and response objects.
- Keep components small and focused.
- Keep Sarvam integration in server-side utility functions.
- Use clear names and simple abstractions.
- Avoid `any` unless unavoidable and documented.
- Validate file MIME type and size on the server, not only in the browser.
- Revoke temporary browser object URLs when no longer needed.
- Do not store API keys in React state.
- Avoid unnecessary packages and infrastructure.
- Keep the code easy for a student to explain during a judging demo.

## 11. Required final report from the coding agent

At the end of implementation, report:

1. Features completed.
2. Files created or changed.
3. Sarvam models and endpoints actually integrated.
4. Environment variables required.
5. Tests run and their results.
6. Features not completed and why.
7. Local run instructions.
8. Deployment URL, only if deployment was actually completed and verified.
9. Any known limitations.

Be honest. Do not say “deployed”, “tested”, or “working” unless you verified it.

## 12. Official documentation

- https://docs.sarvam.ai/
- https://docs.sarvam.ai/api/getting-started/models
- https://docs.sarvam.ai/api/api-guides-tutorials/speech-to-text/overview
- https://docs.sarvam.ai/api/api-guides-tutorials/speech-to-text/rest-api
- https://docs.sarvam.ai/api/token-factory/chat-completions
- https://docs.sarvam.ai/api/token-factory/models/sarvam-105b
- https://docs.sarvam.ai/api/token-factory/models
- https://docs.sarvam.ai/api-reference/chat/chat-completions-v2
- https://docs.sarvam.ai/api/api-guides-tutorials/models/bulbul
- https://docs.sarvam.ai/api/api-guides-tutorials/text-to-speech/rest-api
- https://docs.sarvam.ai/api/getting-started/building-for-india
