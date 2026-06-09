"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useAppDispatch } from "@/store";
import { WS_SEND } from "@/store/wsMiddleware";
import { Board } from "@/types/todo";

interface FormValues {
  name: string;
  description: string;
}

interface Props {
  board?: Board | null;
  onClose: () => void;
}

export default function BoardForm({ board, onClose }: Props) {
  const dispatch = useAppDispatch();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    defaultValues: { name: "", description: "" },
  });

  useEffect(() => {
    if (board) {
      reset({ name: board.name, description: board.description });
    } else {
      reset({ name: "", description: "" });
    }
  }, [board, reset]);

  const onSubmit = (data: FormValues) => {
    if (board) {
      dispatch({
        type: WS_SEND,
        payload: {
          type: "UPDATE_BOARD",
          payload: { id: board.id, name: data.name.trim(), description: data.description.trim() },
        },
      });
    } else {
      dispatch({
        type: WS_SEND,
        payload: {
          type: "CREATE_BOARD",
          payload: { name: data.name.trim(), description: data.description.trim() },
        },
      });
    }
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
          <h2 className="text-lg font-semibold text-slate-200">
            {board ? "Edit Board" : "Create Board"}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition-colors text-xl leading-none"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-300">
              Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              {...register("name", { required: "Name is required" })}
              autoFocus
              className={`w-full rounded-xl bg-slate-900/70 border px-4 py-2.5 text-slate-100
                focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors
                ${errors.name ? "border-red-500/70" : "border-slate-700/60"}`}
            />
            {errors.name && (
              <p className="text-xs text-red-400">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-300">Description</label>
            <textarea
              rows={2}
              {...register("description")}
              className="w-full rounded-xl bg-slate-900/70 border border-slate-700/60 px-4 py-2.5 text-slate-100
                focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors resize-none"
            />
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
              className="flex-1 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700
                text-white font-medium py-2.5 transition-colors"
            >
              {board ? "Save" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
