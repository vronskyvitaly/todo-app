"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { todoSchema, TodoFormValues, formToPayload } from "@/lib/validations";
import { useAppDispatch, useAppSelector } from "@/store";
import { WS_SEND } from "@/store/wsMiddleware";

const inputCls = (err?: boolean) =>
  `w-full rounded-xl bg-slate-900/70 border px-4 py-2.5 text-slate-100 placeholder-slate-500
   focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors
   disabled:opacity-40 disabled:cursor-not-allowed
   ${err ? "border-red-500/70" : "border-slate-700/60"}`;

interface Props {
  onClose: () => void;
}

export default function TodoForm({ onClose }: Props) {
  const dispatch = useAppDispatch();
  const connected = useAppSelector((s) => s.todos.connected);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<TodoFormValues>({
    resolver: zodResolver(todoSchema),
    defaultValues: { title: "", description: "", important: false, dueDate: null, priority: "normal", tags: "", reminderMinutes: "" },
  });

  const { important, dueDate: watchedDueDate } = watch();

  const onSubmit = (data: TodoFormValues) => {
    dispatch({
      type: WS_SEND,
      payload: { type: "CREATE_TODO", payload: formToPayload(data) },
    });
    reset();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-md bg-slate-800 border border-slate-700/60 rounded-t-2xl sm:rounded-2xl p-6 shadow-2xl sm:mx-4 max-h-[90dvh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle for mobile bottom sheet */}
        <div className="sm:hidden w-10 h-1 bg-slate-600 rounded-full mx-auto mb-4" />
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-slate-200">New Task</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition-colors text-xl leading-none"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Title */}
          <div className="space-y-1">
            <label htmlFor="title" className="block text-sm font-medium text-slate-300">
              Title <span className="text-red-400">*</span>
            </label>
            <textarea
              id="title"
              rows={2}
              autoFocus
              placeholder="What needs to be done?"
              disabled={!connected}
              {...register("title")}
              className={inputCls(!!errors.title) + " resize-none"}
            />
            {errors.title && <p className="text-xs text-red-400">{errors.title.message}</p>}
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label htmlFor="description" className="block text-sm font-medium text-slate-300">
              Description
            </label>
            <textarea
              id="description"
              rows={2}
              placeholder="Optional details..."
              disabled={!connected}
              {...register("description")}
              className={inputCls(!!errors.description) + " resize-none"}
            />
          </div>

          {/* Important + Priority */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={!connected}
              onClick={() => setValue("important", !important)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-medium transition-colors disabled:opacity-40
                ${important
                  ? "bg-amber-500/20 border-amber-500/50 text-amber-400"
                  : "border-slate-700/60 text-slate-400 hover:text-slate-200"
                }`}
            >
              <svg className="w-4 h-4" fill={important ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
              Important
            </button>
            <div className="flex-1">
              <select
                disabled={!connected}
                {...register("priority")}
                className="w-full rounded-xl bg-slate-900/70 border border-slate-700/60 px-3 py-2 text-sm text-slate-100
                  focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors
                  disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <option value="low">↓ Low priority</option>
                <option value="normal">→ Normal priority</option>
                <option value="high">↑ High priority</option>
              </select>
            </div>
          </div>

          {/* Due date + Tags */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 min-w-0 space-y-1">
              <label className="block text-xs font-medium text-slate-400">Due date</label>
              <div className="relative">
                {/* Styled button — full control over appearance */}
                <div className={`w-full rounded-xl border px-4 py-2.5 flex items-center gap-2 text-sm transition-colors
                  ${!connected ? "opacity-40" : ""}
                  ${watchedDueDate
                    ? "bg-slate-900/70 border-indigo-500/40 text-slate-100"
                    : "bg-slate-900/70 border-slate-700/60 text-slate-500"
                  }`}>
                  <svg className="w-4 h-4 flex-shrink-0 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="flex-1">
                    {watchedDueDate
                      ? new Date(watchedDueDate + "T12:00:00").toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })
                      : "Select date…"}
                  </span>
                </div>
                {/* Invisible native input — overlaps button, opens native date picker on tap */}
                <input
                  type="date"
                  disabled={!connected}
                  {...register("dueDate")}
                  style={{ colorScheme: "dark", opacity: 0, position: "absolute", inset: 0, width: "100%", height: "100%", cursor: "pointer", zIndex: 1 }}
                />
                {/* Clear button — above native input */}
                {watchedDueDate && (
                  <button
                    type="button"
                    disabled={!connected}
                    onClick={() => setValue("dueDate", null)}
                    style={{ zIndex: 2 }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
            <div className="flex-1 min-w-0 space-y-1">
              <label className="block text-xs font-medium text-slate-400">Tags (comma separated)</label>
              <input
                type="text"
                placeholder="work, personal..."
                disabled={!connected}
                {...register("tags")}
                className="w-full rounded-xl bg-slate-900/70 border border-slate-700/60 px-3 py-2.5 text-sm text-slate-100
                  placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors
                  disabled:opacity-40 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          {/* Reminder */}
          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-400">Remind me</label>
            <select
              disabled={!connected}
              {...register("reminderMinutes")}
              className="w-full rounded-xl bg-slate-900/70 border border-slate-700/60 px-3 py-2.5 text-sm text-slate-100
                focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors
                disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <option value="">No reminder</option>
              <option value="1">In 1 minute</option>
              <option value="5">In 5 minutes</option>
              <option value="15">In 15 minutes</option>
              <option value="30">In 30 minutes</option>
              <option value="60">In 1 hour</option>
              <option value="120">In 2 hours</option>
              <option value="1440">Tomorrow</option>
            </select>
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-slate-700/60 text-slate-300 hover:bg-slate-700/50
                py-2.5 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!connected || isSubmitting}
              className="flex-1 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700
                text-white font-medium py-2.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Add Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
