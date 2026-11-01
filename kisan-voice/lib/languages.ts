export interface Language {
  code: string;
  name: string;
  nativeName: string;
  sttSupported: boolean;
  ttsSupported: boolean;
  ttsVoice: string; // Bulbul v4-flash speaker ID (verified from API)
}

// Speakers verified from Bulbul v4-flash catalog
export const LANGUAGES: Language[] = [
  { code: "hi-IN", name: "Hindi",   nativeName: "हिंदी",    sttSupported: true, ttsSupported: true, ttsVoice: "ritu_hi_conversation" },
  { code: "mr-IN", name: "Marathi", nativeName: "मराठी",   sttSupported: true, ttsSupported: true, ttsVoice: "ishita_mr_conversational" },
  { code: "te-IN", name: "Telugu",  nativeName: "తెలుగు",  sttSupported: true, ttsSupported: true, ttsVoice: "kavitha_te_conversation" },
  { code: "ta-IN", name: "Tamil",   nativeName: "தமிழ்",   sttSupported: true, ttsSupported: true, ttsVoice: "gokul_ta_narration" },
  { code: "bn-IN", name: "Bengali", nativeName: "বাংলা",   sttSupported: true, ttsSupported: true, ttsVoice: "roopa_bn_conversational" },
  { code: "en-IN", name: "English", nativeName: "English",  sttSupported: true, ttsSupported: true, ttsVoice: "roopa_en_conversational" },
];

export const DEFAULT_LANGUAGE_CODE = "hi-IN";

export function getLanguage(code: string): Language | undefined {
  return LANGUAGES.find((l) => l.code === code);
}

export function isTTSSupported(code: string): boolean {
  return getLanguage(code)?.ttsSupported ?? false;
}
