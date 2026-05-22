import { X } from 'lucide-react';
import type { TableAction, ActionDispatch } from '../types/actions';

interface BulkActionBarProps {
  selectedIds: Set<number>;
  actions: TableAction[];
  onAction: ActionDispatch;
  onClearSelection: () => void;
}

export function BulkActionBar({
  selectedIds,
  actions,
  onAction,
  onClearSelection,
}: BulkActionBarProps) {
  const count = selectedIds.size;
  if (count === 0) return null;

  const ids = Array.from(selectedIds);

  return (
    <div
      role="toolbar"
      aria-label="Bulk actions"
      aria-live="polite"
      className="flex items-center justify-between gap-3 px-4 py-2.5
                 bg-slate-800 text-white rounded-lg shadow-sm"
    >
      {/* Left: count + action buttons */}
      <div className="flex items-center gap-3 min-w-0">
        <span className="text-sm font-medium text-slate-200 whitespace-nowrap flex-shrink-0">
          <span className="text-white font-semibold">{count}</span>
          {' '}{count === 1 ? 'machine' : 'machines'} selected
        </span>

        {actions.length > 0 && (
          <div
            className="h-4 w-px bg-slate-600 flex-shrink-0"
            aria-hidden="true"
          />
        )}

        <div className="flex items-center gap-2 flex-wrap">
          {actions.map(action => {
            const Icon = action.icon;
            const isDanger = action.variant === 'danger';
            return (
              <button
                key={action.id}
                type="button"
                onClick={() => onAction(action.id, ids)}
                aria-label={
                  action.description
                    ? `${action.description} (${count} selected)`
                    : `${action.label} ${count} selected ${count === 1 ? 'machine' : 'machines'}`
                }
                className={[
                  'inline-flex items-center gap-1.5 px-3 py-1.5',
                  'text-sm font-medium rounded border transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2',
                  'focus-visible:ring-white focus-visible:ring-offset-1',
                  'focus-visible:ring-offset-slate-800',
                  isDanger
                    ? 'bg-red-500/20 hover:bg-red-500/30 text-red-200 border-red-500/30 hover:border-red-400/40'
                    : 'bg-white/10 hover:bg-white/20 text-white border-white/20 hover:border-white/30',
                ].join(' ')}
              >
                <Icon className="h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
                <span className="whitespace-nowrap">{action.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right: clear */}
      <button
        type="button"
        onClick={onClearSelection}
        aria-label="Clear selection"
        className="inline-flex items-center gap-1 px-2 py-1.5 flex-shrink-0
                   text-sm text-slate-300 hover:text-white hover:bg-white/10
                   rounded transition-colors
                   focus-visible:outline-none focus-visible:ring-2
                   focus-visible:ring-white focus-visible:ring-offset-1
                   focus-visible:ring-offset-slate-800"
      >
        <X className="h-3.5 w-3.5" aria-hidden="true" />
        <span className="hidden sm:inline">Clear</span>
      </button>
    </div>
  );
}
