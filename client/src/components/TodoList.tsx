"use client";

import { useAppSelector } from "@/store";
import TodoItem from "./TodoItem";
import TodoFilters from "./TodoFilters";
import { TaskListSkeleton } from "@/components/skeletons";

export default function TodoList() {
  const todos = useAppSelector((s) => s.todos.todos);
  const filter = useAppSelector((s) => s.todos.filter);
  const connected = useAppSelector((s) => s.todos.connected);
  const isLoading = useAppSelector((s) => s.todos.isLoading);

  // My Tasks only shows todos not assigned to a board
  const myTasks = todos.filter((t) => t.boardId === null);

  const filtered = myTasks.filter((t) => {
    if (filter === "active") return !t.completed;
    if (filter === "completed") return t.completed;
    if (filter === "important") return t.important;
    return true;
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <TodoFilters />
        <TaskListSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <TodoFilters />

      {!connected && todos.length === 0 && (
        <div className="text-center py-16 text-slate-500">
          <div className="text-4xl mb-3">⚡</div>
          <p className="text-sm">Connecting to server...</p>
        </div>
      )}

      {connected && filtered.length === 0 && (
        <div className="text-center py-16 text-slate-500">
          <div className="text-4xl mb-3">
            {filter === "completed" ? "🎉" : filter === "active" ? "✅" : filter === "important" ? "⭐" : "📋"}
          </div>
          <p className="text-sm">
            {filter === "completed"
              ? "No completed tasks"
              : filter === "active"
              ? "No active tasks"
              : filter === "important"
              ? "No important tasks"
              : "No tasks yet. Add one above!"}
          </p>
        </div>
      )}

      <div className="space-y-2">
        {filtered.map((todo) => (
          <TodoItem key={todo.id} todo={todo} />
        ))}
      </div>
    </div>
  );
}
