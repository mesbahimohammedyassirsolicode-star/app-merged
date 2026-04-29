export function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, idx) => (
          <div key={idx} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="h-4 w-24 animate-pulse rounded bg-slate-200" />
            <div className="mt-3 h-8 w-16 animate-pulse rounded bg-slate-200" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {[...Array(2)].map((_, idx) => (
          <div key={idx} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="h-4 w-40 animate-pulse rounded bg-slate-200" />
            <div className="mt-5 h-48 w-full animate-pulse rounded-xl bg-slate-100" />
          </div>
        ))}
      </div>
    </div>
  );
}
