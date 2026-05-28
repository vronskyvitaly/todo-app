"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { todoSchema, TodoFormValues, formToPayload } from "@/lib/validations";
import { useAppDispatch, useAppSelector } from "@/store";
import { setEditingId } from "@/store/todosSlice";
import { WS_SEND } from "@/store/wsMiddleware";

export default function EditModal() {
  const dispatch = useAppDispatch();
  const editingId = useAppSelector((s) => s.todos.editingId);
  const todo = useAppSelector((s) =>
    s.todos.todos.find((t) => t.id === editingId)
  );

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<TodoFormValues>({
    resolver: zodResolver(todoSchema),
    defaultValues: { title: "", description: "", important: false, dueDate: null, priority: "normal", tags: "" },
  });

  const important = watch("important");

  useEffect(() => {
    if (todo) {
      reset({
        title: todo.title,
        description: todo.description,
        important: todo.important,
        dueDate: todo.dueDate ?? null,
        priority: todo.priority,
        tags: todo.tags.join(", "),
      });
    }
  }, [todo, reset]);

  const close = () => dispatch(setEditingId(null));

  const onSubmit = (data: TodoFormValues) => {
    dispatch({
      type: WS_SEND,
      payload: {
        type: "UPDATE_TODO",
        payload: { id: editingId, ...formToPayload(data) },
      },
    });
    close();
  };

  if (!editingId || !todo) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={close}
    >
      <div
        className="w-full max-w-md bg-slate-800 border border-slate-700/60 rounded-2xl p-6 shadow-2xl animate-slide-down mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-slate-200">Edit Task</h2>
          <button
            onClick={close}
            className="text-slate-400 hover:text-slate-200 transition-colors text-xl leading-none"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-300">
              Title <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              {...register("title")}
              className={`w-full rounded-xl bg-slate-900/70 border px-4 py-2.5 text-slate-100
                focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors
                ${errors.title ? "border-red-500/70" : "border-slate-700/60"}`}
            />
            {errors.title && (
              <p className="text-xs text-red-400">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-300">
              Description
            </label>
            <textarea
              rows={2}
              {...register("description")}
              className={`w-full rounded-xl bg-slate-900/70 border px-4 py-2.5 text-slate-100
                focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors resize-none
                ${errors.description ? "border-red-500/70" : "border-slate-700/60"}`}
            />
          </div>

          {/* Important + Priority */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setValue("important", !important)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-medium transition-colors
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
                {...register("priority")}
                className="w-full rounded-xl bg-slate-900/70 border border-slate-700/60 px-3 py-2 text-sm text-slate-100
                  focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
              >
                <option value="low">↓ Low priority</option>
                <option value="normal">→ Normal priority</option>
                <option value="high">↑ High priority</option>
              </select>
            </div>
          </div>

          {/* Due date + Tags */}
          <div className="flex gap-3">
            <div className="flex-1 space-y-1">
              <label className="block text-xs font-medium text-slate-400">Due date</label>
              <input
                type="date"
                {...register("dueDate")}
                className="w-full rounded-xl bg-slate-900/70 border border-slate-700/60 px-3 py-2 text-sm text-slate-100
                  focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
              />
            </div>
            <div className="flex-1 space-y-1">
              <label className="block text-xs font-medium text-slate-400">Tags (comma separated)</label>
              <input
                type="text"
                placeholder="work, personal..."
                {...register("tags")}
                className="w-full rounded-xl bg-slate-900/70 border border-slate-700/60 px-3 py-2 text-sm text-slate-100
                  placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={close}
              className="flex-1 rounded-xl border border-slate-700/60 text-slate-300 hover:bg-slate-700/50
                py-2.5 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700
                text-white font-medium py-2.5 transition-colors"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
