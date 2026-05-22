import { LayoutGrid, List, CreditCard } from 'lucide-react';
import type { ViewMode } from '../types';

interface ViewToggleProps {
  viewMode: ViewMode;
  onChange: (mode: ViewMode) => void;
}

const views: { mode: ViewMode; icon: typeof List; label: string }[] = [
  { mode: 'detailed', icon: List, label: 'Detailed' },
  { mode: 'compact', icon: LayoutGrid, label: 'Compact' },
  { mode: 'card', icon: CreditCard, label: 'Cards' },
];

export function ViewToggle({ viewMode, onChange }: ViewToggleProps) {
  return (
    <div className="inline-flex rounded-lg border border-slate-200 bg-white" role="radiogroup" aria-label="Table view mode">
      {views.map(({ mode, icon: Icon, label }) => (
        <button
          key={mode}
          role="radio"
          aria-checked={viewMode === mode}
          onClick={() => onChange(mode)}
          className={`inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors
                     first:rounded-l-lg last:rounded-r-lg
                     ${viewMode === mode
                       ? 'bg-blue-50 text-blue-700 border-blue-200'
                       : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                     }`}
        >
          <Icon className="h-4 w-4" />
          <span className="hidden sm:inline">{label}</span>
        </button>
      ))}
    </div>
  );
}
