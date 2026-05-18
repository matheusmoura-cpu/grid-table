import { ArrowRightLeft, X } from 'lucide-react';

interface BulkActionToolbarProps {
  selectedCount: number;
  onMoveMachine: () => void;
  onClearSelection: () => void;
}

export function BulkActionToolbar({ selectedCount, onMoveMachine, onClearSelection }: BulkActionToolbarProps) {
  if (selectedCount === 0) return null;

  return (
    <div
      className="flex items-center justify-between px-4 py-2.5 bg-slate-800 text-white
                 rounded-lg shadow-sm"
      role="toolbar"
      aria-label="Bulk actions"
      aria-live="polite"
    >
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-slate-200">
          <span className="text-white font-semibold">{selectedCount}</span>
          {' '}{selectedCount === 1 ? 'machine' : 'machines'} selected
        </span>

        <div className="h-4 w-px bg-slate-600" aria-hidden="true" />

        <button
          type="button"
          onClick={onMoveMachine}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium
                     bg-white/10 hover:bg-white/20 text-white rounded
                     border border-white/20 hover:border-white/30
                     transition-colors
                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-1 focus-visible:ring-offset-slate-800"
          aria-label={`Move ${selectedCount} selected ${selectedCount === 1 ? 'machine' : 'machines'}`}
        >
          <ArrowRightLeft className="h-3.5 w-3.5" aria-hidden="true" />
          Move Machine
        </button>
      </div>

      <button
        type="button"
        onClick={onClearSelection}
        className="inline-flex items-center gap-1 px-2 py-1.5 text-sm text-slate-300
                   hover:text-white hover:bg-white/10 rounded transition-colors
                   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-1 focus-visible:ring-offset-slate-800"
        aria-label="Clear selection"
      >
        <X className="h-3.5 w-3.5" aria-hidden="true" />
        <span className="hidden sm:inline">Clear</span>
      </button>
    </div>
  );
}
