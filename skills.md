# Kisan Voice — Claude Code Skills and Engineering Instructions

**Project:** Kisan Voice  
**Product specification:** `spec.md` (Version 2.0)  
**AI provider:** Sarvam AI  
**Frontend and backend deployment:** Vercel (single Next.js application)  
**Source control:** GitHub

Read `spec.md` completely before implementation. It is the source of truth for product scope, API behavior, safety, deployment and delivery requirements. This file defines how you must work.

---

## 1. Your role

Act as a senior full-stack engineer and product-minded AI engineer. Build Kisan Voice as a working, tested, secure and deployable application—not merely a UI mockup.

You are responsible for:
- Inspecting the existing repository and preserving useful work.
- Setting up clean, isolated development environments.
- Installing and documenting all required dependencies.
- Integrating real Sarvam APIs.
- Building and testing the complete application.
- Pushing code to the intended GitHub repository.
- Deploying and verifying the application on Vercel.
- Reporting progress and blockers accurately.

## 2. Mandatory first steps

Before editing or installing anything:

1. Read `spec.md` and this file completely.
2. Inspect the repository root, current files, package manager, Git status, current branch and configured Git remotes.
3. Identify the operating system and check installed versions of Node.js, npm, Python and pip.
4. Inspect the existing `.env` file without displaying or printing its contents.
5. Check whether `SARVAM_API_KEY` is present in the environment. You may report only whether it is configured—not its value, length, prefix or other identifying fragments.
6. Confirm `.env` and `.env.local` are ignored by Git.
7. Check whether the current Git remote points to the intended repository. Do not overwrite history or invent a remote.
8. Present a concise setup and implementation plan, then proceed with routine steps.

Do not ask the user to paste the API key into chat or terminal. The user has already said the key is stored in the project's `.env` file.

If the repository contains only the specification files, treat it as the intended project directory and scaffold the application there. Do not create a nested duplicate project directory unless the user explicitly asks for one.

## 3. Environment setup and dependency management

Create a clean, isolated environment and install the dependencies required by the project. Do not install packages globally unless unavoidable and explicitly explained.

### 3.1 Node.js / Next.js environment — production application

The deployed application must be a single Next.js project so that Vercel can host both the frontend and server-side API routes.

1. Check whether Node.js and npm are installed.
2. If Node.js is missing, install a current compatible LTS version using a suitable version manager such as `nvm`. Do not use `sudo npm install -g` as a routine workaround.
3. Verify `node --version` and `npm --version`.
4. Scaffold or configure Next.js with:
   - TypeScript
   - App Router
   - Tailwind CSS
   - ESLint (if supported by the selected Next.js setup)
5. Install only dependencies actually needed by the implementation.
6. Commit the Node dependency manifest and lockfile (`package.json` and the npm lockfile, or the equivalent for the selected package manager).
7. Use `npm ci` for reproducible installs when a valid `package-lock.json` exists.
8. Do not commit `node_modules`, `.next`, build output or local caches.

The Node dependency manifest and lockfile are the authoritative dependency specification for the deployed Next.js application.

### 3.2 Python virtual environment — Sarvam SDK verification / Python utilities

The production application should not require a separate Python backend. However, create an isolated Python environment for the requested Sarvam Python SDK verification script and any Python utilities that are genuinely used.

1. Check the available Python version.
2. Create a project-local virtual environment named `.venv`:
   - macOS/Linux: `python3 -m venv .venv`
   - Windows: `py -m venv .venv` or the appropriate installed Python command.
3. Activate it before installing Python packages.
4. Upgrade pip inside the virtual environment.
5. Install the official Sarvam SDK:
   - `python -m pip install -U sarvamai`
6. Create a root-level `requirements.txt` containing the Python dependencies actually needed by the repository, with compatible pinned or bounded versions.
7. Ensure `.venv/`, `__pycache__/`, `.pyc` files and other Python-generated artifacts are ignored by Git.
8. Verify installation using `python -m pip check` and `python -m pip freeze` (review the output before deciding what belongs in `requirements.txt`).

Important distinction:
- `requirements.txt` documents Python dependencies.
- `package.json` plus the lockfile documents Node/Next.js dependencies.
- Do not put Node packages in `requirements.txt`.
- Do not add FastAPI, Uvicorn or a Python web server unless a specific approved requirement makes a separate Python service necessary.
- The Python virtual environment is for the SDK smoke test or actual Python utilities; Vercel will deploy the Next.js application, not this virtual environment.

If the repository has no Python code beyond the SDK smoke test, keep the Python requirements minimal. Do not add unrelated packages.

### 3.3 Environment files

The user already has a `.env` file containing `SARVAM_API_KEY`.

- Preserve the existing `.env`; do not overwrite it.
- Do not display its contents.
- Use the key in Next.js server code via `process.env.SARVAM_API_KEY`.
- For Python SDK verification, load the key from the process environment. If needed, source the existing `.env` into the shell using a safe method; do not add `python-dotenv` solely for this.
- Do not print the key or any part of it.
- Create `.env.example` with placeholders only, e.g. `SARVAM_API_KEY=replace_me`.
- Ensure `.env`, `.env.local`, `.env.*` secret files, and any local credential files are in `.gitignore`. Do not ignore `.env.example`.
- Do not use `NEXT_PUBLIC_` or `VITE_` prefixes for the key.
- Never commit secrets.

## 4. Sarvam AI is the only AI provider

Use real Sarvam API calls for all AI features. Do not silently substitute OpenAI, Gemini, Anthropic or another provider. Do not use mock responses in the finished application.

Planned model mapping (verify current model IDs, access, endpoint and schema from official docs):
- Speech-to-text: `saaras:v4`
- Agricultural reasoning: `sarvam-105b`
- Conversational responses: `sarvam-105b-conversations` where appropriate
- Text-to-speech: `bulbul:v4-flash`
- Crop image understanding: a documented image-capable Token Factory model such as `gemma4` or `glm5.3-flash`, only if enabled for the user's key.

Official documentation:
- https://docs.sarvam.ai/
- https://docs.sarvam.ai/api/getting-started/welcome
- https://docs.sarvam.ai/api/getting-started/quickstart
- https://docs.sarvam.ai/api/getting-started/models
- https://docs.sarvam.ai/api/token-factory/chat-completions
- https://docs.sarvam.ai/api/api-guides-tutorials/speech-to-text/overview
- https://docs.sarvam.ai/api/api-guides-tutorials/text-to-speech/overview

Before coding each integration, verify:
- Current model identifier.
- Endpoint and HTTP method.
- Authentication header.
- Request and response schema.
- Supported language codes.
- Audio/image formats and size/duration limits.
- Account access and model availability.

Never invent an endpoint, model, field, voice ID or successful result.

## 5. First verify the existing Sarvam key with one real call

Before building all application features, verify that the existing key works.

1. Create a small Python script, for example `scripts/sarvam_smoke_test.py`.
2. Use the official `sarvamai` SDK.
3. Initialize the client using the key read from the process environment.
4. Make one chat-completion request with `sarvam-105b-conversations`, following the current official SDK documentation.
5. Use a simple prompt such as: “Reply with one short greeting in Hindi.”
6. Print only the model's reply and safe diagnostic status. Never print the API key, request headers or environment file contents.
7. Do not use dummy credentials or make a request if the key is missing.
8. If the key is not available to the process, stop and tell the user to configure the existing `.env`; do not attempt workarounds.
9. After a successful response, report the model, endpoint/SDK operation and result, without revealing credentials.

This is a verification milestone, not a separate production backend. After it succeeds, continue with the Next.js application.

## 6. Production application architecture

Use one Next.js application as the default architecture. Vercel should host the frontend and all server-side API routes. Do not introduce FastAPI or another separate backend unless there is a compelling, explained and approved reason.

Recommended structure:

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
├── lib/
│   ├── sarvam.ts
│   ├── languages.ts
│   ├── prompts.ts
│   └── validation.ts
├── scripts/
│   └── sarvam_smoke_test.py
├── public/
├── .env.example
├── .gitignore
├── package.json
├── package-lock.json
├── requirements.txt
├── README.md
├── spec.md
└── skills.md
```

Adapt to the existing repository where appropriate. Do not duplicate project roots.

### Central Sarvam client

All production Sarvam HTTP calls must live in server-only `lib/sarvam.ts`. Implement typed functions equivalent to:
- `transcribeAudio(audio, mimeType, languageCode?)`
- `analyzeImage(imageBase64, mimeType, cropName?)`
- `askQuestion(question, languageCode, context)`
- `synthesizeSpeech(text, languageCode)`

Use the official SDK only if it is suitable for the Next.js server runtime and the relevant API. Otherwise use `fetch` or a small HTTP client with the documented Sarvam REST API. The Python SDK smoke test does not mean the production Next.js routes must invoke Python.

### API routes

Implement:
- `POST /api/transcribe`
- `POST /api/analyze-image`
- `POST /api/ask`
- `POST /api/speak`

All routes must validate input, call the centralized server-only Sarvam client, and return safe predictable responses. `/api/speak` may return audio bytes with the correct content type.

### Vercel compatibility

- Use the Node.js runtime for Next.js route handlers unless a documented requirement dictates otherwise.
- Check Vercel request-size, duration and runtime limits for the selected plan.
- Validate and limit audio/image uploads.
- Avoid local persistent filesystem storage.
- Use memory or temporary storage with cleanup.
- Add request timeouts and safe error handling.
- Do not assume long-running processes or persistent local files exist in serverless functions.

## 7. Sarvam integration rules

### Speech-to-text — Saaras
- Use the currently documented Saaras model and endpoint.
- Browser records audio using `MediaRecorder`.
- Backend forwards the audio to Sarvam.
- Verify supported formats, language codes and duration limit. The synchronous Saaras v4 REST flow has a documented 30-second limit; confirm current docs.
- Return transcript for user review before submission.
- Do not assume Saaras and Bulbul support the same languages.

### Text reasoning — Sarvam-105B
- Use documented chat completions.
- Include selected language, current question, bounded recent history and safety prompt.
- Test real responses in at least one language before claiming integration works.

### Conversation — Sarvam-105B Conversations
- Use where appropriate for natural conversational turns.
- Verify the current model and SDK/API usage.
- Do not assume it replaces every other API capability.

### Crop image understanding
- Use only a documented image-capable Sarvam model/API enabled for the account.
- Do not send images to `sarvam-105b` or other text-only models.
- Do not confuse Sarvam Vision document OCR with crop-image understanding.
- Verify image content format; it may require inline base64 data URI.
- Validate type/size and never log image payloads.
- Return observations with uncertainty, not a definitive diagnosis.
- If no image model is available, disable the feature honestly.

### Text-to-speech — Bulbul
- Use the documented Bulbul model and schema.
- Verify selected language and a valid speaker ID.
- Use native script as required.
- Keep text answer visible if speech generation fails.
- Do not autoplay audio.

### Language configuration
Create `lib/languages.ts` with separate verified flags for STT, chat and TTS. Do not claim a language is supported across all models because one API supports it.

## 8. Agricultural safety

Follow the system prompt and safety requirements in `spec.md`.

Always:
- Respond in the selected language when supported.
- Use simple, respectful language.
- Distinguish observations, possible explanations and confirmed facts.
- State uncertainty.
- Ask up to two focused follow-up questions when needed.
- Recommend a local KVK, agricultural extension officer or qualified agronomist for severe or consequential crop problems.

Never:
- Claim a diagnosis is confirmed from a photo or short description.
- Give exact pesticide, insecticide, herbicide or fertilizer dosage or chemical-mixing instructions.
- Invent local rules, product approvals, market prices or weather.
- Claim an image was analysed unless the image API was actually called.
- Fabricate sources or official endorsements.

## 9. UI requirements

Build a clean, accessible, mobile-first interface:
- Kisan Voice name and tagline.
- Language selector, default Hindi only if verified.
- Microphone recording with visible state and permission handling.
- Typed question alternative.
- Transcript review/edit.
- Optional image upload, preview and removal only if real image analysis is enabled.
- Conversation history and follow-up.
- Answer card with uncertainty/disclaimer.
- Audio playback controls when TTS succeeds.
- Clear loading, empty and error states.

Do not add fake statistics, inert controls or placeholder AI outputs.

## 10. Error handling and security

Every API route must:
1. Validate input.
2. Check `SARVAM_API_KEY` configuration.
3. Call the correct documented endpoint.
4. Apply a timeout.
5. Handle non-2xx responses.
6. Parse output defensively.
7. Return a safe structured error.
8. Never expose secrets, raw provider errors or stack traces.

Handle missing key, 401/403, 429, 400/422, timeout, 5xx, unsupported language/voice, invalid file and empty input.

Do not log API keys, auth headers, raw audio, photos or base64 data. If a key is exposed, stop using it and tell the user to rotate/revoke it.

## 11. Testing discipline

After each milestone:
- Run the relevant test, build or smoke-test command.
- Inspect actual output and fix failures.
- Report exactly what passed and failed.
- Distinguish “coded” from “verified”.
- Never claim a real API integration worked without a successful real request.

Minimum checks:
- Python virtual environment created and SDK installation verified.
- `python -m pip check` passes.
- `requirements.txt` accurately reflects Python dependencies.
- Node/npm versions recorded.
- Frontend dependencies installed from the lockfile.
- Sarvam chat smoke test succeeds with the existing key.
- Typed question returns a real Sarvam answer.
- Saaras transcription tested with real audio.
- Bulbul tested for at least one supported language if implemented.
- Image analysis tested only if image model access is verified.
- Empty/malformed input and provider errors handled.
- `npm run build` succeeds.
- API key absent from frontend bundle and Git-tracked files.
- Mobile viewport checked.
- Deployed app makes at least one real Sarvam request.

## 12. GitHub requirements

Pushing code to GitHub is mandatory.

1. Inspect current remote, branch and Git status.
2. Preserve existing repository history.
3. If a remote exists, verify it is the intended repository.
4. If no remote exists, ask the user for the repository URL or permission to create one. Never invent a URL.
5. Use meaningful incremental commits.
6. Review staged files before committing.
7. Ensure `.env`, `.env.local`, `.venv`, `node_modules`, build outputs, credentials and temporary files are not committed.
8. Push to the appropriate branch without force-pushing or overwriting history.
9. Verify the push succeeded.
10. Report repository URL, branch and commit hash.

## 13. Vercel deployment requirements

Vercel deployment is mandatory.

- Deploy the single Next.js application to Vercel.
- Prefer connecting the GitHub repository to Vercel for automatic deployments.
- Configure `SARVAM_API_KEY` in Vercel Project Settings → Environment Variables for the required environments.
- Local `.env` values do not automatically transfer to Vercel.
- Never use a `NEXT_PUBLIC_` prefix for the secret.
- Check whether Vercel CLI is installed/authenticated before using it; do not assume it is.
- Run `npm run build` before deployment.
- Push the intended code to GitHub.
- Import/connect the GitHub repository to Vercel.
- Configure the environment variable.
- Deploy and verify the public URL.
- Test the deployed application with at least one real Sarvam API call.
- Confirm the deployed frontend uses deployed API routes, not localhost.
- Fix deployment issues and redeploy.
- Do not claim deployment succeeded until verified.

If deployment is blocked, report the exact missing permission, configuration or platform limitation and provide local run instructions.

## 14. README and dependency documentation

README must explain:
- Product overview and architecture.
- Node.js version requirement.
- Python version requirement if the SDK smoke-test environment is retained.
- How to install Node dependencies using the package manager and lockfile.
- How to create/activate `.venv`.
- How to install Python packages from `requirements.txt`.
- Environment variables (names only, never secret values).
- How to run the Sarvam smoke test.
- How to start the Next.js app.
- How to run tests and production build.
- Sarvam models and endpoints actually integrated.
- Verified language support per capability.
- GitHub and Vercel deployment instructions.
- Known limitations and agricultural safety disclaimer.

Keep dependency manifests accurate:
- `package.json` and its lockfile for the Next.js app.
- `requirements.txt` for Python scripts/utilities only.
- Do not list globally installed tools as project dependencies.
- Do not add unused packages.

## 15. Progress report format

After each milestone, report:

- **Done:** files/features completed.
- **Environment:** versions and dependencies installed; do not show secrets.
- **Verified:** exact commands/tests and outcomes.
- **Pending:** remaining work.
- **Blockers:** credentials, account access, permissions, API limits or deployment configuration.
- **Next:** the single highest-priority next step.

Do not report “complete” when code has only been written but not tested.

## 16. Final handoff checklist

- [ ] Existing repository inspected and preserved.
- [ ] Node.js/npm installed and versions verified.
- [ ] Python `.venv` created and activated for SDK smoke test/utilities.
- [ ] `sarvamai` installed in `.venv`.
- [ ] `requirements.txt` contains only required Python dependencies.
- [ ] `package.json` and lockfile contain the Next.js dependencies.
- [ ] Existing `.env` preserved and key verified without disclosure.
- [ ] `.env.example` and `.gitignore` configured safely.
- [ ] Real `sarvam-105b-conversations` smoke test succeeds.
- [ ] Real Sarvam chat integration works in the Next.js application.
- [ ] Saaras voice transcription works if included.
- [ ] Bulbul speech generation works if included.
- [ ] Image analysis is genuine or clearly disabled.
- [ ] Agricultural safety rules are implemented.
- [ ] `npm run build` succeeds.
- [ ] No secrets are committed or exposed.
- [ ] Code is pushed to the intended GitHub repository.
- [ ] Application is deployed and verified on Vercel.
- [ ] At least one real Sarvam request succeeds from the deployed app.
- [ ] README and final report are complete.

**Start by inspecting the repository, existing `.env` presence (without reading its value aloud or printing it), installed tool versions and Git remote. Set up the isolated environments and dependency manifests, then run the real Sarvam chat smoke test. Continue into the Next.js application only after reporting the smoke-test result.**
