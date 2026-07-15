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
      <div className="pl-7">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-indigo-500/30
            bg-indigo-500/10 text-xs font-medium text-indigo-300
            hover:bg-indigo-500/20 hover:border-indigo-500/50 transition-all"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Описание проекта
        </button>
      </div>

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
