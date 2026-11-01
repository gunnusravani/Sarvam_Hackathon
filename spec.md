# Kisan Voice — Product, Engineering, Deployment & Delivery Specification

**Version:** 2.0  
**Target:** Hackathon MVP  
**Product:** Voice-first multilingual agricultural assistant  
**Deployment:** Vercel  
**Source control:** GitHub  
**AI provider:** Sarvam AI

---

## 1. Product overview

Kisan Voice is a mobile-first, multilingual, voice-first agricultural information assistant. A farmer can ask a question by speaking or typing in a supported Indian language, optionally attach a crop photograph, and receive a simple, cautious explanation in the selected language. Where supported, the response can also be played as audio.

**Tagline:** Your farm. Your language. Your voice.

Kisan Voice is an agricultural information and triage assistant. It is not a certified agronomist, plant pathologist, pesticide recommender, or definitive crop-disease diagnostic system. It must not claim certainty from a photograph or prescribe chemical dosages.

The application must use Sarvam AI for its AI capabilities, be deployed on Vercel, and have its source code pushed to GitHub.

## 2. Problem and intended users

### Problem
Many farmers face barriers when agricultural information is English-only, text-heavy, or filled with technical terminology. A voice-first interface with Indian-language support can make basic agricultural information easier to access.

### Target users
- Farmers and agricultural workers who prefer speaking in an Indian language.
- Family members or community facilitators helping farmers access information.
- Hackathon judges evaluating a working, deployed Indian-language AI product.

## 3. Goals and non-goals

### Goals
1. Enable users to ask questions by voice or text.
2. Support useful Indian languages based on verified Sarvam model/API support.
3. Return concise, understandable, cautious agricultural information.
4. Support follow-up questions within the current session.
5. Analyze crop photographs using a genuinely image-capable Sarvam model/API, if available to the account.
6. Provide spoken answers using Sarvam TTS for supported languages.
7. Deliver a working application at a public Vercel URL.
8. Push the source code to the intended GitHub repository.
9. Keep all Sarvam credentials server-side.

### Non-goals for the MVP
- Definitive crop disease or pest diagnosis.
- Pesticide, insecticide, herbicide, or fertilizer dosage recommendations.
- Guaranteed yield predictions or live weather forecasts.
- Live mandi prices or government scheme eligibility.
- User accounts, farm management, payments, marketplace, or offline inference.
- Fine-tuning or training a model.
- A complex RAG system or separate microservice architecture unless a demonstrated requirement makes one necessary.

## 4. Core user journeys

### Journey A — Voice question (core)
1. User selects a supported language.
2. User records a short question using the microphone.
3. Browser uploads the audio to the Next.js backend route.
4. Backend calls Sarvam Saaras speech-to-text.
5. UI displays the transcript so the user can review or edit it.
6. Backend sends the question and bounded conversation history to Sarvam chat completion.
7. UI displays the answer in the selected language.
8. Backend optionally calls Sarvam Bulbul text-to-speech.
9. UI provides playback controls for the generated audio.

### Journey B — Typed question (core)
1. User selects a language and types a question.
2. Backend calls Sarvam chat completion.
3. UI displays the answer and provides audio playback if TTS is available for that language.

### Journey C — Crop photograph plus question
1. User attaches a crop photograph and enters or records a question.
2. Backend validates file type and size.
3. Backend sends the image to a currently documented Sarvam model/API that genuinely supports image input and is available to the configured API key.
4. The image model returns observations about visible symptoms.
5. The observations are passed as explicitly uncertain context to the agricultural reasoning model.
6. The answer distinguishes visible observations from possible explanations, asks for missing context, and avoids definitive diagnosis.

Do not send images to a text-only model. Do not treat document OCR as crop-photo understanding. If image model access is unavailable, clearly disable the feature and report the blocker; do not fake image analysis.

### Journey D — Follow-up question
1. User asks a follow-up question.
2. The frontend sends a bounded amount of recent conversation history with the new question.
3. Sarvam generates a contextual response in the selected language.
4. The UI appends the response to the current conversation.

No database is required for the hackathon MVP; conversation history can remain in client memory.

## 5. Feature priorities

### P0 — required
- Responsive, mobile-first Next.js application.
- Language selector populated only with verified language support.
- Typed question flow using a real Sarvam chat completion.
- Voice recording and real Saaras transcription.
- Transcript review/edit before submission.
- Answer display, loading states, and useful error messages.
- Server-side API key protection.
- Vercel-compatible architecture and successful deployment.
- GitHub repository with the implementation pushed.
- README with local setup, environment variables, testing, and deployment instructions.

### P1 — implement after P0 is stable
- Bulbul text-to-speech and audio playback.
- Follow-up conversation context.
- Crop-photo analysis using a verified image-capable Sarvam model/API.
- Copy/replay controls and small UX refinements.

### P2 — out of scope for this hackathon MVP
- Weather, market prices, maps, scheme lookup, user accounts, persistent profiles, marketplace, complex database, native mobile application.

**Priority rule:** A complete typed and voice interaction is more important than optional image analysis or visual polish. Deployment and GitHub delivery remain required final deliverables.

## 6. Sarvam AI integration requirements

Sarvam AI is the primary AI provider for all AI functionality. Do not silently substitute OpenAI, Gemini, Anthropic, or another provider.

Use the official Sarvam documentation as the authority. Verify current model identifiers, endpoint paths, request schemas, supported languages, voice IDs, file constraints, and account access before implementation.

Official documentation:
- Main docs: https://docs.sarvam.ai/
- Getting started: https://docs.sarvam.ai/api/getting-started/welcome
- Quickstart: https://docs.sarvam.ai/api/getting-started/quickstart
- Models: https://docs.sarvam.ai/api/getting-started/models
- Chat completions: https://docs.sarvam.ai/api/token-factory/chat-completions
- Speech-to-text: https://docs.sarvam.ai/api/api-guides-tutorials/speech-to-text/overview
- Text-to-speech: https://docs.sarvam.ai/api/api-guides-tutorials/text-to-speech/overview

### 6.1 Planned model/capability mapping

| Application capability | Planned Sarvam model/API | Purpose |
|---|---|---|
| Voice transcription | `saaras:v4` | Convert spoken question to text |
| Crop image understanding | A verified image-capable Token Factory model, e.g. `gemma4` or `glm5.3-flash` if available | Describe visible crop symptoms |
| Agricultural reasoning | `sarvam-105b` | Generate contextual agricultural guidance |
| Conversational follow-ups | `sarvam-105b-conversations` where appropriate | Conversational response behavior |
| Spoken answer | `bulbul:v4-flash` | Convert answer text to speech |

These are planned model choices, not assumptions about account entitlement. Confirm the exact current model IDs, endpoint, request schema, and access using official documentation and the configured account.

### 6.2 API key and environment configuration

The user already has a Sarvam API key with available credits. The key is stored in the project's existing `.env` file.

**Claude must use the existing key. Do not ask the user to paste it into chat or terminal again.**

Requirements:
- Read the key only on the server using `process.env.SARVAM_API_KEY`.
- Confirm that the environment variable is loaded without printing or revealing its value.
- Never hard-code, log, display, commit, or return the key.
- Never use `NEXT_PUBLIC_SARVAM_API_KEY` or any other public-prefixed variable.
- Ensure `.env`, `.env.local`, and other secret-bearing environment files are included in `.gitignore`.
- Add `.env.example` with a placeholder only, such as `SARVAM_API_KEY=replace_me`.
- Do not overwrite the user's existing `.env` file.
- Do not create a second key or replace the existing key.
- If the key is absent or cannot be loaded, report that clearly without exposing its contents. Do not use dummy credentials or pretend the API call succeeded.
- The local `.env` file does not automatically transfer to Vercel. Configure the same secret separately in Vercel Project Settings → Environment Variables.

### 6.3 Centralized Sarvam client

All Sarvam HTTP calls must be centralized in:

`lib/sarvam.ts`

Implement server-only functions with clear TypeScript types, such as:
- `transcribeAudio(audio, mimeType, languageCode?)`
- `analyzeImage(imageBase64, mimeType, cropName?)`
- `askQuestion(question, languageCode, context)`
- `synthesizeSpeech(text, languageCode)`

These functions must:
- Read `SARVAM_API_KEY` from the server environment.
- Use documented Sarvam endpoints and request formats.
- Handle timeouts and non-2xx responses.
- Parse provider responses defensively.
- Never expose the API key or raw authorization headers.
- Return typed, application-level results rather than leaking provider internals.

Use the official Sarvam SDK where it is appropriate and compatible with the Next.js server runtime. Otherwise use a small HTTP client against the documented REST API. Do not add unnecessary SDKs or dependencies.

### 6.4 Speech-to-text — Saaras

Preferred model: `saaras:v4`.

Use the currently documented speech-to-text endpoint and multipart request format. The expected flow:
1. Browser records audio using `MediaRecorder`.
2. Frontend posts the audio blob to `/api/transcribe`.
3. Server forwards the audio to Sarvam.
4. Server returns the transcript.
5. User reviews or edits the transcript before submission.

Verify supported audio formats, language codes, mode, maximum duration, and response schema. The synchronous Saaras v4 REST flow has a documented 30-second audio limit; verify the current documentation and enforce the actual limit. Do not assume Saaras and Bulbul support identical language sets.

### 6.5 Text reasoning and conversation

Use Sarvam Token Factory chat completions with `sarvam-105b` for agricultural reasoning. Use `sarvam-105b-conversations` where its documented conversational behavior is appropriate.

The commonly documented chat endpoint is:

`POST https://api.sarvam.ai/v1/chat/completions`

Verify the current endpoint and request schema before implementation. Send:
- A system message containing the safety rules in Section 8.
- Current user question.
- Selected language.
- A bounded amount of recent conversation history.
- Optional image observations only if an image-capable Sarvam model actually produced them.

Do not imply that a photo was analysed if no image-model request succeeded.

### 6.6 Image understanding

Use only a currently documented Sarvam Token Factory model/API that explicitly supports image input and is enabled for the user's API key. Candidate model names may include `gemma4` or `glm5.3-flash`; verify availability and exact identifiers.

Requirements:
- Do not send image bytes to `sarvam-105b` or another text-only model.
- Verify the exact multimodal request schema.
- The documented image flow may require an inline base64 data URI; do not assume a remote HTTP image URL is accepted.
- Validate file type and size on the server.
- Do not log image data or base64 payloads.
- Ask the model to describe visible symptoms, not to make a definitive diagnosis.
- Pass observations to the reasoning model as uncertain context.
- If no image-capable model is available, disable the feature with an honest message.

Sarvam Vision is primarily document intelligence/OCR and must not be treated as a crop-photo disease recognition model.

### 6.7 Text-to-speech — Bulbul

Preferred model: `bulbul:v4-flash`, subject to account and language availability.

Use the currently documented text-to-speech endpoint and request schema. Select a valid speaker ID from the current voice catalog.

Requirements:
- Verify support for the selected language and voice.
- Use native-script text as required by the API.
- Do not invent speaker IDs.
- Do not assume all Saaras languages are supported by Bulbul.
- Return playable audio with the correct content type.
- Do not autoplay audio.
- If TTS fails or the language is unsupported, keep the text answer visible and provide a clear text-only fallback.

### 6.8 Language support

Create `lib/languages.ts` with language codes and separate capability flags, for example:
- STT support
- Chat support
- TTS support

A possible initial UI set is English, Hindi, Marathi, Telugu, Tamil, Bengali, Gujarati, and Punjabi. Verify each language independently for every model/API. Do not show a feature as available merely because another Sarvam model supports that language.

## 7. Required application architecture

Use **one Next.js application** as the preferred architecture. Vercel should host both the frontend and server-side API routes. Do not introduce a separate FastAPI backend unless there is a compelling technical requirement that is explained and approved.

Recommended stack:
- Next.js with App Router
- TypeScript
- Tailwind CSS
- React
- Browser `MediaRecorder` API
- Next.js server-side Route Handlers
- Vercel deployment

Suggested structure:

```text
kisan-voice/
├── app/
│   ├── api/
│   │   ├── transcribe/route.ts
│   │   ├── analyze-image/route.ts
│   │   ├── ask/route.ts
│   │   └── speak/route.ts
│   ├── page.tsx
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── LanguageSelector.tsx
│   ├── VoiceRecorder.tsx
│   ├── ImageUploader.tsx
│   ├── QuestionInput.tsx
│   ├── AnswerCard.tsx
│   └── AudioPlayer.tsx
├── lib/
│   ├── sarvam.ts
│   ├── languages.ts
│   ├── prompts.ts
│   └── validation.ts
├── public/
├── .env.example
├── .gitignore
├── README.md
├── spec.md
└── skills.md
```

This is a suggested structure. Reuse existing files if the repository already has a sound structure.

### API routes

Implement these Next.js server-side routes:

| Route | Responsibility |
|---|---|
| `POST /api/transcribe` | Validate audio, call Saaras, return transcript |
| `POST /api/analyze-image` | Validate image, call verified image-capable model, return cautious observations |
| `POST /api/ask` | Call Sarvam chat completion and return answer |
| `POST /api/speak` | Call Bulbul and return audio bytes |

All routes must use `lib/sarvam.ts`. No Sarvam secret or upstream API call should be placed in client components.

### Runtime and serverless constraints

- Ensure API routes use a Vercel-compatible Node.js runtime unless a specific integration requires otherwise.
- Check the current Vercel function duration, request-body and payload constraints for the selected plan/runtime.
- Keep audio and image uploads within documented and hosting limits.
- Avoid local persistent filesystem storage.
- Prefer in-memory processing or temporary files that are cleaned up.
- Use bounded request sizes and timeouts.
- Do not assume long-running jobs or persistent local files are available in serverless functions.
- If a feature exceeds platform limits, explain the limitation and design a suitable fallback.

## 8. Assistant behavior and agricultural safety

Use a system prompt with these requirements:

> You are Kisan Voice, a careful multilingual agricultural information assistant for farmers in India. Respond in the user's selected language, using simple, respectful, practical language and short steps.
>
> You provide general educational information, not a definitive diagnosis or professional agronomic prescription. Do not claim that a disease, pest, or nutrient deficiency is certain based only on a short description or photograph. Explain possibilities as possibilities.
>
> If essential information is missing, ask up to two focused questions, such as crop, growth stage, location/season, irrigation/rainfall, when symptoms began, or whether one plant or many plants are affected.
>
> Prefer low-risk observations and general good practices. Never provide exact pesticide, insecticide, herbicide, or fertilizer dosages, chemical mixing instructions, or unsupported product recommendations. Do not invent local regulations, product approvals, waiting periods, weather, market prices, or government scheme facts.
>
> For severe, spreading, or financially consequential crop problems, advise the user to contact a local KVK, agricultural extension officer, or qualified agronomist.
>
> If an image is provided, describe only visible evidence and state uncertainty. Never imply an image was analysed unless an image-capable API was actually called.
>
> Keep answers concise and structured: (1) possible explanation, (2) what to check, (3) safe next steps, and (4) when to seek local expert help.

Preferred internal response structure:

```json
{
  "summary": "Short explanation in the selected language",
  "possible_causes": ["Possibility one", "Possibility two"],
  "what_to_check": ["Observation one", "Observation two"],
  "safe_next_steps": ["Low-risk step one"],
  "when_to_get_help": "When and whom to contact",
  "uncertainty": "What cannot be concluded yet"
}
```

Validate structured output. If parsing fails, safely fall back to plain text. Never show raw malformed JSON.

## 9. Frontend requirements

The main screen should include:
- Product name: Kisan Voice.
- Tagline: “Your farm. Your language. Your voice.”
- Language selector, defaulting to Hindi if supported by the configured capabilities.
- Large microphone button with visible recording state.
- Text input alternative.
- Transcript display and edit step.
- Image upload with preview, camera capture where browser-supported, and remove option (only if image analysis is implemented).
- Ask/submit button.
- Conversation area with user questions and assistant answers.
- Follow-up question support.
- Audio playback controls for generated speech.
- Clear loading, empty, success, and error states.
- New-question/reset control.

Usability:
- Mobile-first responsive layout.
- Large tap targets, readable typography, high contrast and accessible labels.
- Request microphone permission only after user action.
- Allow recording to stop or cancel.
- Show transcript for review before submission.
- Do not autoplay audio.
- Preserve typed question when a request fails.
- Clearly distinguish possible causes from confirmed facts.
- Avoid clutter, fake statistics and decorative controls that do nothing.

## 10. Privacy and security

- No login or persistent database required for MVP.
- Do not store audio, photos or questions permanently.
- Process uploaded files in memory or temporary storage and clean up promptly.
- Validate all inputs server-side.
- Set reasonable upload limits and timeouts.
- Restrict production CORS only if cross-origin access is needed; same-origin Next.js routes are preferred.
- Never log API keys, authorization headers, raw audio, photos or base64 payloads.
- Do not expose stack traces or raw provider error bodies.
- Ensure `.env`, `.env.local`, build output, temporary uploads and generated secrets are excluded from Git.
- If a key is accidentally committed or exposed, rotate/revoke it immediately.

## 11. Error handling

Every API route must validate inputs, check configuration, call the correct Sarvam endpoint, handle non-2xx responses, parse responses defensively and return safe structured errors.

Handle at least:
- Missing API key.
- Invalid credentials (401/403).
- Rate limit (429).
- Invalid request (400/422).
- Timeout/network failure.
- Provider/server failure (5xx).
- Unsupported language or voice.
- Invalid/oversized audio or image.
- Empty question or recording.
- Vercel request/body/duration constraints.

User-facing examples:
- “Please record a short voice question.”
- “The recording is too long. Please make it shorter.”
- “Speech recognition is unavailable right now. You can type your question instead.”
- “I couldn't generate audio, but your answer is available as text.”
- “Image analysis is not enabled right now. You can still ask a text question.”

Never silently return fabricated AI responses.

## 12. Testing and acceptance criteria

Claude must report tests actually run. Code existing is not proof that a feature works.

### P0 tests
1. `npm run build` succeeds.
2. App starts locally and the main page renders.
3. All server routes compile and run in the intended Next.js runtime.
4. A typed English question receives a real Sarvam response.
5. A typed Indian-language question receives an appropriate response, if supported.
6. A short audio recording is transcribed through Saaras.
7. Transcript is shown for review/editing.
8. Empty question is rejected with a useful message.
9. Missing/invalid key is handled without exposing the key.
10. 401/403, 429, timeout and 5xx errors do not crash the UI.
11. API key is absent from frontend bundles, browser requests and Git-tracked files.
12. Mobile and desktop layouts are usable.

### P1 tests
1. Bulbul audio is generated and playable for a supported language.
2. Unsupported TTS language falls back to text.
3. Follow-up questions use conversation context.
4. Image analysis is tested only if genuine image-model access is verified.
5. Image response communicates uncertainty and avoids definitive diagnosis.
6. Invalid image and oversized upload are rejected.

### Security checks
- Review `git status` and staged changes before committing.
- Search tracked files and frontend build output for accidental secrets.
- Confirm `.env` and `.env.local` are ignored.
- Do not display the key in logs or screenshots.
- Do not commit the real `.env` file.

## 13. GitHub source-control requirements

Pushing the code to GitHub is a required deliverable.

### Initial inspection
1. Inspect the existing Git repository and current branch.
2. Inspect configured Git remotes.
3. Check `git status` before changing files.
4. Preserve existing repository history and branches.

### If a GitHub remote exists
- Verify it points to the intended repository.
- Use the appropriate existing branch.
- Do not overwrite or force-push existing history.
- Commit and push the implementation.

### If no remote exists
- Ask the user for the intended GitHub repository URL or permission to create a new repository.
- Do not invent a repository URL.
- Do not create or push to an unrelated repository.

### Git hygiene
- Use meaningful, incremental commits.
- Use descriptive commit messages.
- Review staged changes before every commit.
- Ensure `.env`, `.env.local`, API keys, credentials and generated secrets are not staged.
- Do not commit `node_modules`, build output or temporary uploads.
- Verify the push succeeded.
- Report the repository URL, branch and latest commit hash.

Do not claim that code was pushed unless Git confirms success.

## 14. Vercel deployment requirements

Deployment to Vercel is a required deliverable, not an optional suggestion.

### Architecture
- Prefer one Next.js application hosted on Vercel.
- Frontend and Sarvam server-side API routes should be deployed together.
- Do not introduce a separate FastAPI backend unless there is a compelling technical reason.
- Ensure API routes are compatible with Vercel's Node.js/serverless runtime and current platform constraints.

### Environment configuration
The local `.env` contains `SARVAM_API_KEY`. It must remain local and must not be committed.

For Vercel:
1. Open the Vercel project settings.
2. Add `SARVAM_API_KEY` under Environment Variables.
3. Enable the required Production and Preview environments as appropriate.
4. Never use a `NEXT_PUBLIC_` prefix for the key.
5. Do not assume local `.env` values transfer automatically to Vercel.
6. Do not print the key while checking configuration.

### Deployment workflow
1. Complete the local implementation.
2. Run `npm run build` and fix all errors.
3. Test every implemented Sarvam integration locally.
4. Review Git status and confirm no secrets are staged.
5. Commit and push the code to GitHub.
6. Connect/import the GitHub repository into Vercel.
7. Configure `SARVAM_API_KEY` in Vercel Project Settings → Environment Variables.
8. Deploy to Vercel.
9. Verify the public deployment URL.
10. Test real Sarvam API calls from the deployed application.
11. Fix deployment-specific problems and redeploy.
12. Report the final verified URL.

Use the Vercel Git integration as the preferred deployment path. The Vercel CLI (`vercel --prod`) may be used if appropriate, but do not assume the CLI is installed or authenticated. Check first. Do not expose credentials or tokens.

### Deployment acceptance
- Public Vercel URL loads successfully over HTTPS.
- Frontend calls the deployed Next.js API routes, not localhost.
- Server-side environment variable is configured.
- At least one real Sarvam request succeeds from the deployed application.
- No API key is exposed in browser code, network responses or frontend assets.
- Deployment status is verified, not assumed.

If deployment cannot be completed, report exactly what is missing and provide local run instructions. Do not claim deployment succeeded.

## 15. README and final deliverables

README must include:
- Product overview and features.
- Architecture summary.
- Prerequisites.
- Local installation and run commands.
- Environment variable names (never actual secret values).
- Test/build commands.
- Sarvam models and endpoints actually integrated.
- Supported languages per capability, based on verification.
- Deployment instructions.
- Known limitations and safety disclaimer.

At completion, provide:
1. GitHub repository URL.
2. Branch name.
3. Latest commit hash.
4. Vercel deployment URL.
5. Build status.
6. Deployment status.
7. Sarvam integrations implemented and tested.
8. Real API test results.
9. Known limitations and unimplemented features.

## 16. Definition of done

The project is complete only when:
- Typed questions receive real Sarvam-generated answers.
- Voice questions receive real Saaras transcripts.
- Answers display in the selected, verified language.
- API credentials remain server-side.
- Core error paths have been tested.
- README includes setup, environment variables, tests and deployment instructions.
- Code is pushed to the intended GitHub repository.
- Application is deployed and verified on Vercel.
- At least one real Sarvam request succeeds from the deployed app.
- Final report lists completed work, unimplemented features, commands/tests, GitHub URL, Vercel URL, commit hash and known limitations.

## 17. Hackathon execution strategy

1. Inspect repository, `.env` presence and Git remote.
2. Verify the existing Sarvam key is loaded without revealing it.
3. Make one real chat-completion request using `sarvam-105b-conversations`.
4. Scaffold/complete the Next.js application.
5. Implement typed Q&A using Sarvam.
6. Add Saaras voice transcription.
7. Add image understanding with a verified multimodal Sarvam model.
8. Add Bulbul TTS.
9. Add follow-up conversation context.
10. Test, build, push to GitHub, deploy to Vercel, and test the deployed app.

**Do not spend most of the 45–50 minute build window polishing the UI before proving a real Sarvam API call. GitHub push and Vercel deployment are mandatory final deliverables.**
