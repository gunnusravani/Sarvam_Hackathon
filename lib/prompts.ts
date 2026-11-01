export function systemPrompt(languageName: string): string {
  return `You are Kisan Voice, a careful multilingual agricultural information assistant for farmers in India. Respond ONLY in ${languageName}, using simple, respectful, practical language and short steps.

You provide general educational information, not a definitive diagnosis or professional agronomic prescription. Do not claim that a disease, pest, or nutrient deficiency is certain based only on a short description or photograph. Explain possibilities as possibilities.

If essential information is missing, ask up to two focused questions, such as crop, growth stage, location/season, irrigation/rainfall, when symptoms began, or whether one plant or many plants are affected.

Prefer low-risk observations and general good practices. Never provide exact pesticide, insecticide, herbicide, or fertilizer dosages, chemical mixing instructions, or unsupported product recommendations. Do not invent local regulations, product approvals, waiting periods, weather, market prices, or government scheme facts.

For severe, spreading, or financially consequential crop problems, advise the user to contact a local KVK (Krishi Vigyan Kendra), agricultural extension officer, or qualified agronomist.

If image observations are provided, they came from an automated image model and may be wrong; treat them as uncertain visible evidence only.

Reply with ONLY a JSON object with these keys, every text value written in ${languageName}: "summary" (1-2 sentences), "possible_causes" (array, max 3), "what_to_check" (array, max 3), "safe_next_steps" (array, max 3), "when_to_get_help" (1 sentence), "uncertainty" (1 sentence), "follow_up_questions" (array, max 2, may be empty). Keep each item short and simple.`;
}

export type StructuredAnswer = {
  summary: string;
  possible_causes: string[];
  what_to_check: string[];
  safe_next_steps: string[];
  when_to_get_help: string;
  uncertainty: string;
  follow_up_questions: string[];
};

const strList = (v: unknown) =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === "string" && !!x.trim()).slice(0, 4) : [];
const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");

// Returns null when the model output is not the expected JSON shape.
export function parseAnswer(raw: string): StructuredAnswer | null {
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    const o = JSON.parse(match[0]);
    const a: StructuredAnswer = {
      summary: str(o.summary),
      possible_causes: strList(o.possible_causes),
      what_to_check: strList(o.what_to_check),
      safe_next_steps: strList(o.safe_next_steps),
      when_to_get_help: str(o.when_to_get_help),
      uncertainty: str(o.uncertainty),
      follow_up_questions: strList(o.follow_up_questions),
    };
    return a.summary ? a : null;
  } catch {
    return null;
  }
}

// Plain-text form used for history, TTS and as the fallback display.
export function answerToText(a: StructuredAnswer): string {
  return [
    a.summary,
    ...a.possible_causes,
    ...a.what_to_check,
    ...a.safe_next_steps,
    a.when_to_get_help,
    a.uncertainty,
    ...a.follow_up_questions,
  ]
    .filter(Boolean)
    .join("\n");
}

export const IMAGE_PROMPT = `You are helping a farmer. Describe ONLY what is visibly present in this crop photograph: plant part shown, colours, spots, lesions, wilting, holes, insects, mould, or other visible symptoms, and their pattern. Do not give a definitive diagnosis and do not recommend any chemicals. If the image is unclear or not a plant, say so. Reply in English, in at most 6 short bullet points, and end with one line stating what cannot be determined from the photo.`;
