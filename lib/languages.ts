// Capability flags per language, taken from the sarvamai SDK enums (v0.1.41):
// Saaras STT (SpeechToTextLanguage), Bulbul TTS (TextToSpeechLanguage).
// Chat support covers the Indian languages Sarvam-105B is documented for.
export type Language = {
  code: string;
  name: string;
  native: string;
  stt: boolean;
  chat: boolean;
  tts: boolean;
};

export const LANGUAGES: Language[] = [
  { code: "hi-IN", name: "Hindi", native: "हिन्दी", stt: true, chat: true, tts: true },
  { code: "en-IN", name: "English", native: "English", stt: true, chat: true, tts: true },
  { code: "mr-IN", name: "Marathi", native: "मराठी", stt: true, chat: true, tts: true },
  { code: "te-IN", name: "Telugu", native: "తెలుగు", stt: true, chat: true, tts: true },
  { code: "ta-IN", name: "Tamil", native: "தமிழ்", stt: true, chat: true, tts: true },
  { code: "bn-IN", name: "Bengali", native: "বাংলা", stt: true, chat: true, tts: true },
  { code: "gu-IN", name: "Gujarati", native: "ગુજરાતી", stt: true, chat: true, tts: true },
  { code: "pa-IN", name: "Punjabi", native: "ਪੰਜਾਬੀ", stt: true, chat: true, tts: true },
  { code: "kn-IN", name: "Kannada", native: "ಕನ್ನಡ", stt: true, chat: true, tts: true },
  { code: "ml-IN", name: "Malayalam", native: "മലയാളം", stt: true, chat: true, tts: true },
  { code: "od-IN", name: "Odia", native: "ଓଡ଼ିଆ", stt: true, chat: true, tts: true },
];

export const DEFAULT_LANGUAGE = "hi-IN";

export function getLanguage(code: string): Language | undefined {
  return LANGUAGES.find((l) => l.code === code);
}
