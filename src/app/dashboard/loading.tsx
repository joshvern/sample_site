export default function DashboardLoading() {
  return (
    <div className="animate-pulse space-y-5" aria-label="Loading dashboard">
      <div className="h-16 w-80 rounded-xl bg-slate-200" />
      <div className="grid grid-cols-4 gap-3">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="h-24 rounded-xl bg-slate-200" />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-5">
        <div className="h-96 rounded-xl bg-slate-200" />
        <div className="h-96 rounded-xl bg-slate-200" />
      </div>
    </div>
  );
}
