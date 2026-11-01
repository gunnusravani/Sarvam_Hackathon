"use client";

import { useRef, useState } from "react";

interface Props {
  onFile: (file: File | null) => void;
  disabled?: boolean;
}

export default function ImageUploader({ onFile, disabled }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFile = (file: File | null) => {
    if (preview) {
      URL.revokeObjectURL(preview);
      setPreview(null);
    }
    if (!file) {
      setFileName(null);
      onFile(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    setFileName(file.name);
    onFile(file);
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
        disabled={disabled}
      />

      {preview ? (
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt="Crop photo preview"
            className="w-40 h-40 object-cover rounded-xl border-2 border-green-400"
          />
          <button
            onClick={() => {
              handleFile(null);
              if (inputRef.current) inputRef.current.value = "";
            }}
            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold"
            aria-label="Remove image"
          >
            ✕
          </button>
          <p className="text-xs text-gray-500 mt-1 text-center truncate max-w-[10rem]">
            {fileName}
          </p>
        </div>
      ) : (
        <button
          onClick={() => inputRef.current?.click()}
          disabled={disabled}
          className="flex flex-col items-center gap-2 border-2 border-dashed border-gray-300 rounded-xl px-8 py-5 text-gray-500 hover:border-green-500 hover:text-green-700 transition-colors"
        >
          <span className="text-3xl">📷</span>
          <span className="text-sm font-medium">Add crop photo</span>
          <span className="text-xs">(optional)</span>
        </button>
      )}
    </div>
  );
}
