"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  audioUrl: string | null;
  loading?: boolean;
  error?: string | null;
  onRequest: () => void;
}

export default function AudioPlayer({ audioUrl, loading, error, onRequest }: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    setPlaying(false);
  }, [audioUrl]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      audio.play();
      setPlaying(true);
    }
  };

  if (error) {
    return (
      <p className="text-sm text-amber-600 text-center">{error}</p>
    );
  }

  if (!audioUrl && !loading) {
    return (
      <button
        onClick={onRequest}
        className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-full font-medium transition-colors"
      >
        🔊 Listen to answer
      </button>
    );
  }

  if (loading) {
    return (
      <p className="text-sm text-gray-500 animate-pulse">Generating audio…</p>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <audio
        ref={audioRef}
        src={audioUrl!}
        onEnded={() => setPlaying(false)}
        className="hidden"
      />
      <button
        onClick={togglePlay}
        className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-full font-medium transition-colors"
      >
        {playing ? "⏸ Pause" : "▶ Play answer"}
      </button>
    </div>
  );
}
