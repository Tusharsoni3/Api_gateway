export default function StatCard({ icon: Icon, value, label, color = 'text-gatex-green', borderColor = 'border-gatex-green' }) {
  return (
    <div className={`relative flex items-center gap-4 rounded-lg border-2 border-gatex-border bg-gatex-card p-5 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.4)] overflow-hidden group hover:border-opacity-60 transition-all duration-200`}>
      {/* colored left accent bar */}
      <div className={`absolute left-0 top-0 h-full w-1 ${borderColor.replace('border-', 'bg-')}`} />
      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border-2 border-gatex-border bg-gatex-bg ${color} transition-transform duration-200 group-hover:scale-110`}>
        <Icon size={22} />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-bold tracking-tight text-white">{value}</p>
        <p className="truncate text-sm text-slate-400">{label}</p>
      </div>
    </div>
  );
}
