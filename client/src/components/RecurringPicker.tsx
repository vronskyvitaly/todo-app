"use client";

import { useState } from "react";

const DAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

export interface RecurringSettings {
  enabled: boolean;
  days: number[];      // 0=Пн … 6=Вс
  time: string;        // "09:00"
  repeatCount: number; // 0 = бесконечно
}

interface Props {
  value: RecurringSettings;
  onChange: (v: RecurringSettings) => void;
}

export const defaultRecurring: RecurringSettings = {
  enabled: false,
  days: [],
  time: "09:00",
  repeatCount: 0,
};

export default function RecurringPicker({ value, onChange }: Props) {
  const set = (patch: Partial<RecurringSettings>) =>
    onChange({ ...value, ...patch });

  const toggleDay = (i: number) => {
    const days = value.days.includes(i)
      ? value.days.filter((d) => d !== i)
      : [...value.days, i];
    set({ days });
  };

  const clampCount = (n: number) => Math.max(0, Math.min(99, n));

  return (
    <div className="space-y-3">
      {/* Header row with toggle */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-300">Повторяющееся уведомление</span>
        <button
          type="button"
          onClick={() => set({ enabled: !value.enabled })}
          className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent
            transition-colors duration-200 focus:outline-none
            ${value.enabled ? "bg-indigo-600" : "bg-slate-700"}`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow
              transition-transform duration-200
              ${value.enabled ? "translate-x-5" : "translate-x-0"}`}
          />
        </button>
      </div>

      {value.enabled && (
        <div className="rounded-2xl bg-slate-900/60 border border-slate-700/50 p-4 space-y-4">

          {/* Days of week */}
          <div className="space-y-2">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Дни недели</span>
            <div className="flex justify-between">
              {DAYS.map((day, i) => {
                const active = value.days.includes(i);
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => toggleDay(i)}
                    className={`h-9 w-9 rounded-full text-xs font-semibold transition-all duration-150 flex-shrink-0
                      ${active
                        ? "bg-indigo-600 text-white shadow-[0_0_8px_rgba(99,102,241,0.5)]"
                        : "bg-slate-800 text-slate-400 border border-slate-700/60 hover:border-slate-500"
                      }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Time + Repeat count */}
          <div className="flex gap-3">
            {/* Time */}
            <div className="flex-1 space-y-1.5">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Время</span>
              <input
                type="time"
                value={value.time}
                onChange={(e) => set({ time: e.target.value })}
                style={{ colorScheme: "dark" }}
                className="w-full rounded-xl bg-slate-800 border border-slate-700/60 px-3 py-2
                  text-base sm:text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Repeat count */}
            <div className="flex-1 space-y-1.5">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                {value.repeatCount === 0 ? "Повторять" : "Повторений"}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => set({ repeatCount: clampCount(value.repeatCount - 1) })}
                  className="h-9 w-9 flex-shrink-0 rounded-full bg-slate-800 border border-slate-700/60
                    text-slate-300 hover:text-white hover:border-slate-500 text-lg font-bold
                    flex items-center justify-center transition-colors"
                >
                  −
                </button>
                <span className="flex-1 text-center text-sm font-semibold text-slate-100">
                  {value.repeatCount === 0 ? "∞" : value.repeatCount}
                </span>
                <button
                  type="button"
                  onClick={() => set({ repeatCount: clampCount(value.repeatCount + 1) })}
                  className="h-9 w-9 flex-shrink-0 rounded-full bg-slate-800 border border-slate-700/60
                    text-slate-300 hover:text-white hover:border-slate-500 text-lg font-bold
                    flex items-center justify-center transition-colors"
                >
                  +
                </button>
              </div>
              <p className="text-[10px] text-slate-500 text-center">
                {value.repeatCount === 0 ? "бесконечно" : `${value.repeatCount} раз`}
              </p>
            </div>
          </div>

          {/* Summary */}
          {value.days.length > 0 && (
            <div className="rounded-xl bg-indigo-500/10 border border-indigo-500/20 px-3 py-2">
              <p className="text-xs text-indigo-300">
                Каждую неделю в {value.time} по:{" "}
                <span className="font-semibold">
                  {value.days.sort().map((d) => DAYS[d]).join(", ")}
                </span>
                {value.repeatCount > 0 && ` · ${value.repeatCount} раз`}
                {value.repeatCount === 0 && " · бесконечно"}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
