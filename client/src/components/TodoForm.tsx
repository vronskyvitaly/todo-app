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

export default function TodoForm() {
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
    defaultValues: { title: "", description: "", important: false, dueDate: null, priority: "normal", tags: "" },
  });

  const important = watch("important");

  const onSubmit = (data: TodoFormValues) => {
    dispatch({
      type: WS_SEND,
      payload: { type: "CREATE_TODO", payload: formToPayload(data) },
    });
    reset();
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-6 space-y-4 shadow-lg"
    >
      <h2 className="text-lg font-semibold text-slate-200">New Task</h2>

      {/* Title */}
      <div className="space-y-1">
        <label htmlFor="title" className="block text-sm font-medium text-slate-300">
          Title <span className="text-red-400">*</span>
        </label>
        <input
          id="title"
          type="text"
          placeholder="What needs to be done?"
          disabled={!connected}
          {...register("title")}
          className={inputCls(!!errors.title)}
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

      {/* Important + Priority row */}
      <div className="flex items-center gap-3">
        {/* Important toggle */}
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

        {/* Priority */}
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

      {/* Due date + Tags row */}
      <div className="flex gap-3">
        <div className="flex-1 space-y-1">
          <label className="block text-xs font-medium text-slate-400">Due date</label>
          <input
            type="date"
            disabled={!connected}
            {...register("dueDate")}
            className="w-full rounded-xl bg-slate-900/70 border border-slate-700/60 px-3 py-2 text-sm text-slate-100
              focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors
              disabled:opacity-40 disabled:cursor-not-allowed"
          />
        </div>
        <div className="flex-1 space-y-1">
          <label className="block text-xs font-medium text-slate-400">Tags (comma separated)</label>
          <input
            type="text"
            placeholder="work, personal..."
            disabled={!connected}
            {...register("tags")}
            className="w-full rounded-xl bg-slate-900/70 border border-slate-700/60 px-3 py-2 text-sm text-slate-100
              placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors
              disabled:opacity-40 disabled:cursor-not-allowed"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={!connected || isSubmitting}
        className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700
          text-white font-medium py-2.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Add Task
      </button>
    </form>
  );
}
