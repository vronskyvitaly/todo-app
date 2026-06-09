// Shared pulse block
const Pulse = ({ className }: { className: string }) => (
  <div className={`animate-pulse rounded-xl bg-slate-700/40 ${className}`} />
);

// ─── My Tasks: Stats cards + progress bar ──────────────────────────────────
export function StatsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-slate-800/40 border border-slate-700/30 rounded-2xl px-4 py-4 space-y-3">
            <Pulse className="w-5 h-5" />
            <div className="space-y-1.5">
              <Pulse className="w-10 h-7" />
              <Pulse className="w-14 h-3" />
            </div>
          </div>
        ))}
      </div>
      <div className="bg-slate-800/40 border border-slate-700/30 rounded-2xl px-5 py-4 space-y-3">
        <div className="flex justify-between">
          <Pulse className="w-24 h-4" />
          <Pulse className="w-10 h-4" />
        </div>
        <Pulse className="w-full h-2" />
        <Pulse className="w-40 h-3" />
      </div>
    </div>
  );
}

// ─── My Tasks: Task list items ─────────────────────────────────────────────
export function TaskListSkeleton() {
  return (
    <div className="space-y-2">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="flex items-start gap-4 bg-slate-800/40 border border-slate-700/30 rounded-xl px-5 py-4">
          <Pulse className="w-5 h-5 mt-0.5 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Pulse className={`h-4 ${i % 2 === 0 ? "w-3/4" : "w-1/2"}`} />
            <Pulse className="w-1/3 h-3" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Boards page: Board cards grid ────────────────────────────────────────
export function BoardGridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="bg-slate-800/40 border border-slate-700/30 rounded-xl px-5 py-4 space-y-3">
          <Pulse className={`h-5 ${i % 3 === 0 ? "w-2/3" : i % 3 === 1 ? "w-1/2" : "w-3/4"}`} />
          <Pulse className="w-full h-3" />
          <Pulse className="w-1/4 h-3" />
        </div>
      ))}
    </div>
  );
}

// ─── Board detail page: Kanban columns ────────────────────────────────────
export function KanbanSkeleton() {
  return (
    <div className="flex gap-4 h-full items-start">
      {[...Array(3)].map((_, col) => (
        <div key={col} className="flex-shrink-0 w-72 bg-slate-800/40 border border-slate-700/30 rounded-2xl p-4 space-y-3">
          {/* Column header */}
          <div className="flex items-center justify-between">
            <Pulse className="w-24 h-5" />
            <Pulse className="w-6 h-5" />
          </div>
          {/* Cards */}
          {[...Array(col === 1 ? 3 : 2)].map((_, card) => (
            <div key={card} className="bg-slate-800/60 border border-slate-700/30 rounded-xl px-4 py-3 space-y-2">
              <Pulse className={`h-4 ${card % 2 === 0 ? "w-4/5" : "w-3/5"}`} />
              <Pulse className="w-full h-3" />
              <Pulse className="w-1/3 h-3" />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
