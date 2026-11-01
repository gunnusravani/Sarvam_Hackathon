# Kisan Voice — Product & Engineering Specification

**Version:** 1.0  
**Project type:** Hackathon MVP  
**Primary goal:** Build and deploy a voice-first, multilingual agricultural information assistant using Sarvam APIs.

---

## 1. Product summary

Kisan Voice helps farmers ask basic crop-care questions in an Indian language they are comfortable speaking. A user can:

1. Choose a preferred language.
2. Ask a question by typing or speaking.
3. Optionally upload a photograph of a crop or affected plant part.
4. Receive a cautious, easy-to-understand response in the selected language.
5. Listen to the response using text-to-speech.

The product should be usable by someone who is not comfortable typing or reading English. The primary experience must therefore be mobile-first, voice-friendly, and low-friction.

**Kisan Voice is an informational assistant, not a certified agronomist, plant pathologist, pesticide recommendation engine, or emergency service.** It must not present a visual guess as a confirmed diagnosis.

## 2. Problem statement

Many farmers and agricultural workers prefer to communicate in their local language. Text-heavy, English-first tools can be difficult to use. A farmer may notice yellowing leaves, spots, wilting, or pest damage but may not know the right terminology or where to find understandable guidance.

Kisan Voice aims to reduce this communication barrier by combining:
- Speech recognition for spoken questions.
- Multimodal image understanding for visible crop symptoms.
- An Indian-language-capable LLM for explanation and follow-up.
- Speech synthesis so the answer can be heard.

## 3. Target users and primary use case

### Target user
A farmer or agricultural worker who:
- Uses an Android phone or a mobile browser.
- Prefers Hindi, Marathi, Telugu, Tamil, Kannada, Bengali, Gujarati, Punjabi, or English.
- May prefer speaking over typing.
- Wants basic, understandable information about a crop concern.

### Primary user journey
1. Open Kisan Voice on a phone.
2. Select a language (default: Hindi; allow changing it).
3. Optionally upload/take a crop photo.
4. Tap the microphone and ask a question, or type it.
5. Review the recognized transcript before submitting (especially useful when speech recognition is uncertain).
6. Receive an answer in the selected language.
7. Tap “Listen” to hear the answer.
8. Ask a follow-up question while keeping the recent conversation context.

Example:
- User language: Hindi
- Spoken question: “मेरे टमाटर के पौधे की पत्तियाँ पीली हो रही हैं। ऐसा क्यों हो सकता है?”
- Optional image: a clear photo of the tomato plant leaves
- Expected response: explain that yellowing can have several causes, mention what additional details would help distinguish them, suggest low-risk observation steps, and recommend local agricultural expertise if the issue is severe or spreading.

## 4. MVP scope

### Must have (P0)
- Responsive, mobile-first web app.
- Language selector with a clearly defined supported-language list.
- Text question input.
- Voice recording/upload and speech-to-text using Sarvam Saaras v4.
- Optional image upload with preview.
- Image understanding using a Sarvam-hosted multimodal model through Sarvam Token Factory.
- Text reasoning using Sarvam-105B.
- Text-to-speech using Sarvam Bulbul v4 Flash for supported languages.
- Display the answer in the selected language.
- Play generated audio in the browser.
- Clear loading, success, and error states.
- API key kept on the server; never exposed to browser code.
- Basic validation for file type and size.
- A visible safety disclaimer.

### Should have (P1)
- Follow-up questions with short conversation history.
- Editable speech transcript before sending.
- “Try again” for failed transcription, answer generation, or audio generation.
- Crop name and optional location/state fields to add context.
- Clear chat/reset conversation.
- Show a short “What I understood” section and “What you can do next” section.

### Out of scope for the hackathon MVP
- Confirmed plant disease diagnosis.
- Pesticide, fertilizer, or dosage prescriptions.
- Real-time market prices or weather unless a separate verified data source is added.
- Government scheme eligibility decisions.
- Farm records, user accounts, payments, SMS/WhatsApp integration.
- Guaranteed identification of crop, pest, or disease from an image.
- Fine-tuning or training a new model.
- Full offline functionality.

Do not spend hackathon time implementing out-of-scope features.

## 5. Critical Sarvam API integration requirements

**All AI capabilities in the MVP must use Sarvam APIs.** Do not silently substitute OpenAI, Gemini, Anthropic, Groq, or another provider.

Use the official Sarvam API documentation as the source of truth. Model availability, account entitlements, request parameters, language coverage, and limits can change. If a request fails because a model is unavailable to the API key, report the exact issue and ask the developer to select an enabled Sarvam model; do not switch providers.

### 5.1 Speech-to-text — Saaras v4

Purpose: Convert the farmer's recorded question into text in the original spoken language.

- API host: `https://api.sarvam.ai`
- Endpoint: `POST /speech-to-text`
- Model: `saaras:v4`
- Mode: `transcribe`
- Authentication: `api-subscription-key: <SARVAM_API_KEY>`
- Send audio as multipart form data using the exact field names and accepted audio formats from the current Sarvam REST API reference.
- Use automatic language detection where supported; if the user has selected a language, pass the corresponding supported language code where the API requires/accepts it.
- Show the returned transcript to the user so they can correct it before submission.

For the synchronous REST API, keep recordings within the documented 30-second limit. Handle longer recordings by asking the user to record a shorter question; do not assume the synchronous endpoint accepts long audio.

### 5.2 Crop photo understanding — Sarvam Token Factory multimodal model

Important model distinction:
- `sarvam-105b` is a text-input model. Do **not** send a crop image to it.
- Sarvam Vision is primarily a document-intelligence/OCR capability. Do **not** treat document OCR as a plant-image diagnosis model.
- For crop photographs, use an image-input model available through Sarvam Token Factory, such as `gemma4` or `glm5.3-flash`, via the Sarvam `/v2/chat/completions` endpoint. Verify that the chosen model is enabled for the API key and supports image input.

Request:
- API host: `https://api.sarvam.ai`
- Endpoint: `POST /v2/chat/completions`
- Model: Prefer `gemma4` for a simple image-understanding MVP, or `glm5.3-flash` if enabled and suitable.
- Authentication: `api-subscription-key: <SARVAM_API_KEY>`
- Provide image content as an inline base64 data URI in an `image_url` message part. The API documentation states that remote HTTP(S) image URLs are not accepted for this endpoint.
- Include a focused instruction: describe only visible evidence, identify uncertainty, do not claim a confirmed disease, and do not recommend chemical treatment or dosage.

The multimodal model should return a short visual observation, not a definitive diagnosis. Example: “The image appears to show yellowing on several lower leaves; the photo alone cannot determine the cause.”

### 5.3 Agricultural explanation and conversation — Sarvam-105B

Purpose: Produce the user-facing answer, combine the user's question with visual observations, ask clarifying questions, and maintain follow-up context.

- API host: `https://api.sarvam.ai`
- Endpoint: `POST /v1/chat/completions` (or `/v2/chat/completions` if using the documented compatible route)
- Model: `sarvam-105b`
- Authentication: `api-subscription-key: <SARVAM_API_KEY>`
- Use a system prompt that requires the answer to be in the selected language and native script.
- Provide the user's question, optional crop name, optional region, optional image observations, and recent conversation turns.
- Do not claim the LLM has consulted live agricultural databases or local experts unless that integration is actually implemented.

The LLM must:
1. Explain plausible causes as possibilities, not certainties.
2. Ask for missing context when needed (crop, plant age, irrigation, soil, spread pattern, recent weather).
3. Prefer low-risk observation and general crop-care steps.
4. Avoid exact pesticide/fertilizer product recommendations, chemical mixtures, or dosage instructions.
5. Recommend contacting a local Krishi Vigyan Kendra (KVK), agricultural extension officer, or qualified agronomist for severe, spreading, or high-stakes problems.
6. Be concise, respectful, and understandable to a non-expert.

### 5.4 Text-to-speech — Bulbul v4 Flash

Purpose: Speak the final answer in the selected language.

- API host: `https://api.sarvam.ai`
- Endpoint: `POST /text-to-speech`
- Model: `bulbul:v4-flash`
- Authentication: `api-subscription-key: <SARVAM_API_KEY>`
- Set `language_code` to a language supported by Bulbul v4 Flash.
- Select a valid speaker/persona ID from the current Bulbul v4 Flash voice catalog. Do not guess speaker IDs.
- Send text in its native script for Indic languages; avoid romanized Indic text because it can reduce speech quality.
- Decode the returned base64 audio and return it to the browser in a playable format.

Bulbul v4 Flash supports a subset of Sarvam's speech languages. Do not assume every Saaras-supported language is also supported by Bulbul v4 Flash. If TTS is unavailable for the selected language, keep the written answer available and explain that audio is not currently available for that language.

### 5.5 API implementation rules
- Use server-side API routes for every Sarvam call.
- Read the secret from `SARVAM_API_KEY`.
- Never put the secret in `NEXT_PUBLIC_*`, frontend JavaScript, HTML, local storage, or client-visible logs.
- Never commit `.env` files.
- Set request timeouts and handle non-2xx responses.
- Do not log API keys, raw audio, or unnecessary personal data.
- Return safe, user-readable errors to the frontend; keep detailed diagnostic errors in server logs with secrets redacted.
- Add a small server-side wrapper for Sarvam requests so endpoint URLs, headers, and error handling are not duplicated.
- Do not hard-code a model or speaker that is not documented or enabled for the user's key.
- Do not create fake/mock AI responses in production mode. Mock mode may exist only for automated tests and must be clearly separated.

## 6. Recommended technical architecture

Use a single Next.js application to minimize deployment complexity.

### Stack
- Next.js (App Router) + TypeScript
- Tailwind CSS
- Browser MediaRecorder API for recording
- Server-side Next.js Route Handlers for Sarvam API calls
- Vercel for deployment
- No database required for the MVP

### High-level flow

```text
Mobile browser
  |
  |-- text question -------------------------------|
  |-- recorded audio --> /api/transcribe           |
  |                         |                       |
  |                         v                       |
  |                    Sarvam Saaras v4             |
  |                         |                       |
  |                    transcript                   |
  |                         |                       |
  |-- optional crop image --> /api/analyze-image     |
  |                         |                       |
  |                         v                       |
  |             Sarvam Token Factory (Gemma 4)       |
  |                         |                       |
  |                  visual observations             |
  |                         |                       |
  |-------------------------v-----------------------|
                            |
                     /api/ask (server)
                            |
                     Sarvam-105B
                            |
                      final answer
                            |
                    /api/speak (server)
                            |
                    Sarvam Bulbul v4
                            |
                     playable audio
```

### Suggested project structure

```text
kisan-voice/
├── app/
│   ├── page.tsx
│   ├── layout.tsx
│   ├── globals.css
│   └── api/
│       ├── transcribe/route.ts
│       ├── analyze-image/route.ts
│       ├── ask/route.ts
│       └── speak/route.ts
├── components/
│   ├── LanguageSelector.tsx
│   ├── VoiceRecorder.tsx
│   ├── ImageUploader.tsx
│   ├── ChatPanel.tsx
│   ├── AnswerCard.tsx
│   └── AudioPlayer.tsx
├── lib/
│   ├── sarvam.ts
│   ├── prompts.ts
│   ├── languages.ts
│   └── validation.ts
├── public/
├── tests/
├── .env.example
├── .gitignore
├── skills.md
├── spec.md
└── README.md
```

Claude may adjust the structure if there is a clear technical reason, but should keep API integrations isolated from UI components.

## 7. User interface requirements

The UI must be mobile-first and usable by a person with limited digital literacy.

### Main screen
- Product name: **Kisan Voice**
- Tagline: **खेती की बात, अपनी भाषा में।**
- Language selector visible near the top.
- Large microphone button with clear recording state.
- Large text input as an alternative.
- Optional photo upload / camera capture.
- One primary “Ask Kisan Voice” action.
- Answer displayed in a large, readable card.
- Prominent “Listen to answer” button.
- Clear “Ask another question” action.

### Design principles
- Use simple words, large tap targets, high contrast, and uncluttered layout.
- Avoid dense dashboards, charts, and technical terminology.
- Clearly show when audio is recording, processing, or ready.
- Show a preview of the selected image and allow removal/replacement.
- Show the recognized transcript and allow editing.
- Do not require sign-up for the demo.
- Do not make voice the only input method; typing must remain available.

## 8. Supported languages

For the hackathon MVP, prioritize languages that can be tested reliably with the chosen Sarvam models.

Suggested initial set:
- Hindi (`hi-IN`)
- Marathi (`mr-IN`)
- Telugu (`te-IN`)
- Tamil (`ta-IN`)
- Bengali (`bn-IN`)
- English (`en-IN`)

Before enabling a language in the UI, verify that it is supported by the specific API used:
- Saaras v4 STT language support.
- Sarvam-105B language capability.
- Bulbul v4 Flash TTS language support.

Do not infer that support in one model means support in every model. If a selected language has no TTS voice, disable or gracefully fall back to text-only output.

## 9. API contracts between frontend and backend

Implement these application endpoints. These are our own Next.js routes, not Sarvam endpoints.

### `POST /api/transcribe`
Input: multipart form data containing `audio` and optional `languageCode`.

Output:
```json
{
  "transcript": "मेरे टमाटर के पौधे की पत्तियाँ पीली हो रही हैं।",
  "languageCode": "hi-IN"
}
```

### `POST /api/analyze-image`
Input: multipart form data containing `image` and optional `cropName`.

Output:
```json
{
  "observations": "The image appears to show yellowing on some lower leaves.",
  "uncertainty": "The cause cannot be confirmed from this image alone."
}
```

### `POST /api/ask`
Input:
```json
{
  "question": "मेरे टमाटर के पौधे की पत्तियाँ पीली क्यों हो रही हैं?",
  "languageCode": "hi-IN",
  "cropName": "Tomato",
  "region": "Maharashtra",
  "imageObservations": "Some lower leaves appear yellow.",
  "history": []
}
```

Output:
```json
{
  "answer": "टमाटर की पत्तियों का पीला होना कई कारणों से हो सकता है...",
  "languageCode": "hi-IN",
  "followUpQuestions": [
    "क्या पीली पत्तियाँ पौधे के नीचे की ओर हैं या ऊपर की ओर?",
    "क्या खेत में पानी सामान्य से अधिक जमा हो रहा है?"
  ],
  "disclaimer": "यह सामान्य जानकारी है, पक्की बीमारी की पहचान नहीं।"
}
```

### `POST /api/speak`
Input:
```json
{
  "text": "टमाटर की पत्तियों का पीला होना कई कारणों से हो सकता है...",
  "languageCode": "hi-IN"
}
```

Output: audio bytes with an appropriate `Content-Type`, or a JSON response containing base64 audio if necessary. Prefer returning playable audio bytes to avoid large JSON payloads.

All endpoints must validate inputs and return structured errors, for example:
```json
{
  "error": {
    "code": "SARVAM_API_ERROR",
    "message": "The speech service is temporarily unavailable. Please try again."
  }
}
```

## 10. Safety, trust, and privacy

- Display: “Kisan Voice provides general agricultural information. It does not replace advice from a qualified agricultural expert.”
- Never state “Your crop definitely has disease X” based only on a photo.
- Never provide pesticide dosage, chemical mixing, or hazardous treatment instructions.
- If the user asks for a high-risk treatment, recommend contacting a qualified local agricultural professional and following official product labels.
- Do not invent local weather, soil data, government schemes, market prices, or crop-specific facts.
- Make uncertainty explicit and ask clarifying questions.
- Do not store uploaded images or audio persistently for the MVP.
- Process uploaded files in memory where practical and discard them after the request.
- Restrict upload types to JPEG, PNG, and WebP for images; accepted audio formats must match Saaras documentation.
- Set conservative file-size limits and reject unsupported files.
- Do not expose stack traces or provider credentials to users.

## 11. Error handling and fallback behavior

- Missing API key: show a clear setup error to the developer; do not expose secret values.
- Sarvam timeout / 5xx: show retry guidance.
- Rate limit / insufficient credits: show a friendly message that the AI service is temporarily unavailable or credits are exhausted.
- Unsupported language for TTS: display the written answer and disable audio for that response.
- Invalid audio: ask user to record again.
- Invalid image: ask user to upload JPEG, PNG, or WebP.
- Image model unavailable: continue with text-only question and explain that image analysis could not be completed.
- Low-confidence or unclear transcript: show transcript for editing before sending.
- Never silently replace a failed Sarvam call with a different AI provider.

## 12. Testing and acceptance criteria

The MVP is complete only when all P0 criteria below work.

### Functional acceptance tests
1. App loads on desktop and mobile.
2. User can select a language.
3. User can type a question and receive a response from Sarvam-105B.
4. User can record a short question and receive a Saaras v4 transcript.
5. User can edit the transcript before submitting.
6. User can upload a crop image and receive visual observations from a Sarvam Token Factory image-input model.
7. The final response uses both the question and image observations when an image is supplied.
8. User can play a Bulbul v4 Flash audio response for a supported language.
9. User can ask at least one follow-up question.
10. API key is not present in browser bundles, network responses, or source control.
11. Errors are displayed clearly.
12. The deployed URL works in a fresh browser session.

### Test scenarios
- Hindi typed question, no image.
- Marathi voice question, no image.
- Telugu typed question with a crop image.
- English question with a crop image.
- Unsupported TTS language.
- Invalid image file.
- Sarvam API key missing or invalid.
- Sarvam API timeout / rate limit.
- Empty question.

### Manual demo script
1. Open the deployed app on a phone.
2. Select Hindi.
3. Upload a clear photo of a plant leaf.
4. Record: “मेरे पौधे की पत्तियाँ पीली क्यों हो रही हैं?”
5. Review and submit the transcript.
6. Show the visual observations.
7. Show the answer in Hindi.
8. Tap “Listen to answer.”
9. Ask a follow-up question.
10. Explain that the system offers preliminary guidance, not a confirmed diagnosis.

## 13. Deployment requirements

Preferred: Vercel deployment of the Next.js app.

Environment variables:
```bash
SARVAM_API_KEY=your_key_here
```

- Add the variable in local `.env.local` and Vercel Project Settings.
- Commit only `.env.example` with placeholder values.
- Ensure all Sarvam requests run in server-side route handlers.
- Deploy and test the production URL, not only localhost.
- If Vercel request/body limits or execution time prevent a feature from working, simplify the request or report the blocker. Do not claim deployment succeeded until the live URL is verified.

## 14. Definition of done

Kisan Voice is ready to submit when:
- The live URL loads.
- At least one Indian language works end-to-end for text input and response.
- At least one Indian language works end-to-end for voice input and audio response, subject to the selected TTS model's language coverage.
- Image understanding works through a Sarvam-hosted multimodal model, or the app clearly degrades to text-only mode if image capability is unavailable.
- The response is cautious and does not claim confirmed diagnosis.
- No API secret is exposed.
- The developer has tested the live deployment and can demonstrate the complete flow.

## 15. Official Sarvam references

Use these current official docs; do not rely on guessed endpoints or old examples.

- Sarvam API overview: https://docs.sarvam.ai/
- Models and language coverage: https://docs.sarvam.ai/api/getting-started/models
- Saaras speech-to-text overview: https://docs.sarvam.ai/api/api-guides-tutorials/speech-to-text/overview
- Saaras REST API: https://docs.sarvam.ai/api/api-guides-tutorials/speech-to-text/rest-api
- Sarvam chat completions: https://docs.sarvam.ai/api/token-factory/chat-completions
- Sarvam-105B: https://docs.sarvam.ai/api/token-factory/models/sarvam-105b
- Token Factory models: https://docs.sarvam.ai/api/token-factory/models
- Chat Completion V2 reference (image input contract): https://docs.sarvam.ai/api-reference/chat/chat-completions-v2
- Bulbul text-to-speech: https://docs.sarvam.ai/api/api-guides-tutorials/models/bulbul
- Bulbul REST API: https://docs.sarvam.ai/api/api-guides-tutorials/text-to-speech/rest-api
- Building for Indian languages: https://docs.sarvam.ai/api/getting-started/building-for-india

---

**Implementation priority:** A reliable, deployed, end-to-end flow is more important than a large feature list. Build the smallest complete product first, test it, then add polish.
