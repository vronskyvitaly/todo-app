"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { todoSchema, TodoFormValues } from "@/lib/validations";
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
    formState: { errors },
  } = useForm<TodoFormValues>({
    resolver: zodResolver(todoSchema),
    defaultValues: { title: "", description: "" },
  });

  useEffect(() => {
    if (todo) {
      reset({ title: todo.title, description: todo.description });
    }
  }, [todo, reset]);

  const close = () => dispatch(setEditingId(null));

  const onSubmit = (data: TodoFormValues) => {
    dispatch({
      type: WS_SEND,
      payload: {
        type: "UPDATE_TODO",
        payload: { id: editingId, ...data },
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
              rows={3}
              {...register("description")}
              className={`w-full rounded-xl bg-slate-900/70 border px-4 py-2.5 text-slate-100
                focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors resize-none
                ${errors.description ? "border-red-500/70" : "border-slate-700/60"}`}
            />
            {errors.description && (
              <p className="text-xs text-red-400">{errors.description.message}</p>
            )}
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
