interface StatusBadgeProps {
  value: string;
  type: 'connectivity' | 'commissioning' | 'working';
}

const statusColors: Record<string, string> = {
  'Connected': 'bg-emerald-100 text-emerald-800 border-emerald-200',
  'Disconnected': 'bg-amber-100 text-amber-800 border-amber-200',
  'Not Connected': 'bg-slate-100 text-slate-600 border-slate-200',
  'Commissioned': 'bg-emerald-100 text-emerald-800 border-emerald-200',
  'Not Commissioned': 'bg-slate-100 text-slate-600 border-slate-200',
  'Trading': 'bg-emerald-100 text-emerald-800 border-emerald-200',
  'Disabled': 'bg-red-100 text-red-700 border-red-200',
};

export function StatusBadge({ value }: StatusBadgeProps) {
  const colorClass = statusColors[value] ?? 'bg-slate-100 text-slate-600 border-slate-200';

  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full border ${colorClass}`}>
      {value}
    </span>
  );
}
