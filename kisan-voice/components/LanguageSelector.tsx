"use client";

import { LANGUAGES } from "@/lib/languages";

interface Props {
  value: string;
  onChange: (code: string) => void;
}

export default function LanguageSelector({ value, onChange }: Props) {
  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {LANGUAGES.map((lang) => (
        <button
          key={lang.code}
          onClick={() => onChange(lang.code)}
          className={`px-4 py-2 rounded-full text-sm font-medium border-2 transition-colors ${
            value === lang.code
              ? "bg-green-600 border-green-600 text-white"
              : "bg-white border-gray-300 text-gray-700 hover:border-green-500"
          }`}
        >
          {lang.nativeName}
        </button>
      ))}
    </div>
  );
}
