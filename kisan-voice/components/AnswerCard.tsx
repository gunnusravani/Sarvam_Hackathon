"use client";

import AudioPlayer from "./AudioPlayer";

interface Props {
  answer: string;
  disclaimer: string;
  followUpQuestions: string[];
  audioUrl: string | null;
  audioLoading: boolean;
  audioError: string | null;
  onListenRequest: () => void;
  onFollowUp: (q: string) => void;
}

export default function AnswerCard({
  answer,
  disclaimer,
  followUpQuestions,
  audioUrl,
  audioLoading,
  audioError,
  onListenRequest,
  onFollowUp,
}: Props) {
  return (
    <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-5 space-y-4">
      <div className="prose prose-sm max-w-none whitespace-pre-wrap text-gray-800 leading-relaxed text-base">
        {answer}
      </div>

      <div className="flex justify-center">
        <AudioPlayer
          audioUrl={audioUrl}
          loading={audioLoading}
          error={audioError}
          onRequest={onListenRequest}
        />
      </div>

      {followUpQuestions.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Suggested follow-up questions
          </p>
          <div className="flex flex-col gap-2">
            {followUpQuestions.map((q, i) => (
              <button
                key={i}
                onClick={() => onFollowUp(q)}
                className="text-left text-sm text-green-700 bg-green-50 hover:bg-green-100 rounded-lg px-3 py-2 transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      <p className="text-xs text-gray-400 italic border-t border-gray-100 pt-3">
        ⚠️ {disclaimer}
      </p>
    </div>
  );
}
