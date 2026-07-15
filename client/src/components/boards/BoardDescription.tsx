"use client";

import { useState } from "react";

interface Props {
  name: string;
  description: string;
}

const URL_REGEX = /(https?:\/\/[^\s]+)/g;

function renderWithLinks(text: string) {
  const lines = text.split("\n");
  return lines.map((line, li) => {
    const parts = line.split(URL_REGEX);
    return (
      <span key={li}>
        {parts.map((part, pi) =>
          URL_REGEX.test(part) ? (
            <a
              key={pi}
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-indigo-400 hover:text-indigo-300 underline break-all transition-colors"
            >
              {part}
            </a>
          ) : (
            <span key={pi}>{part}</span>
          )
        )}
        {li < lines.length - 1 && <br />}
      </span>
    );
  });
}

export default function BoardDescription({ name, description }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-slate-800/60 transition-colors"
        aria-label="Описание доски"
        title="Описание доски"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-md bg-slate-800 border border-slate-700/60 rounded-2xl p-6 shadow-2xl max-h-[80dvh] overflow-y-auto overflow-x-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 mb-4">
              <h2 className="text-lg font-semibold text-slate-200 break-anywhere min-w-0">{name}</h2>
              <button
                onClick={() => setOpen(false)}
                className="flex-shrink-0 text-slate-400 hover:text-slate-200 transition-colors text-xl leading-none"
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap break-words">
              {renderWithLinks(description)}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
