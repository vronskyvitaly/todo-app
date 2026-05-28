"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { todoSchema, TodoFormValues } from "@/lib/validations";
import { useAppDispatch, useAppSelector } from "@/store";
import { WS_SEND } from "@/store/wsMiddleware";

export default function TodoForm() {
  const dispatch = useAppDispatch();
  const connected = useAppSelector((s) => s.todos.connected);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TodoFormValues>({
    resolver: zodResolver(todoSchema),
    defaultValues: { title: "", description: "" },
  });

  const onSubmit = (data: TodoFormValues) => {
    dispatch({
      type: WS_SEND,
      payload: { type: "CREATE_TODO", payload: data },
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
          className={`w-full rounded-xl bg-slate-900/70 border px-4 py-2.5 text-slate-100 placeholder-slate-500
            focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors
            disabled:opacity-40 disabled:cursor-not-allowed
            ${errors.title ? "border-red-500/70" : "border-slate-700/60"}`}
        />
        {errors.title && (
          <p className="text-xs text-red-400 mt-1">{errors.title.message}</p>
        )}
      </div>

      {/* Description */}
      <div className="space-y-1">
        <label htmlFor="description" className="block text-sm font-medium text-slate-300">
          Description
        </label>
        <textarea
          id="description"
          rows={3}
          placeholder="Optional details..."
          disabled={!connected}
          {...register("description")}
          className={`w-full rounded-xl bg-slate-900/70 border px-4 py-2.5 text-slate-100 placeholder-slate-500
            focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors resize-none
            disabled:opacity-40 disabled:cursor-not-allowed
            ${errors.description ? "border-red-500/70" : "border-slate-700/60"}`}
        />
        {errors.description && (
          <p className="text-xs text-red-400 mt-1">{errors.description.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={!connected || isSubmitting}
        className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700
          text-white font-medium py-2.5 transition-colors
          disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Add Task
      </button>
    </form>
  );
}
