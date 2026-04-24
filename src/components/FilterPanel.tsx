import { useState } from 'react';
import { Plus, X, Filter, Save, Trash2, FolderOpen } from 'lucide-react';
import type { FilterCriteria, SavedFilterSet } from '../types';
import { ALL_COLUMNS, getUniqueValues, type ColumnKey } from '../data/machines';

interface FilterPanelProps {
  filters: FilterCriteria[];
  onAddFilter: (filter: FilterCriteria) => void;
  onRemoveFilter: (id: string) => void;
  onClearAll: () => void;
  savedFilterSets: SavedFilterSet[];
  onSaveFilterSet: (name: string) => void;
  onLoadFilterSet: (set: SavedFilterSet) => void;
  onRemoveFilterSet: (id: string) => void;
}

export function FilterPanel({
  filters,
  onAddFilter,
  onRemoveFilter,
  onClearAll,
  savedFilterSets,
  onSaveFilterSet,
  onLoadFilterSet,
  onRemoveFilterSet,
}: FilterPanelProps) {
  const [showAddFilter, setShowAddFilter] = useState(false);
  const [showSavedSets, setShowSavedSets] = useState(false);
  const [selectedColumn, setSelectedColumn] = useState<string>('');
  const [filterValue, setFilterValue] = useState<string>('');
  const [filterValues, setFilterValues] = useState<string[]>([]);
  const [numericRange, setNumericRange] = useState<[string, string]>(['', '']);
  const [dateRange, setDateRange] = useState<[string, string]>(['', '']);
  const [saveSetName, setSaveSetName] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  const selectedColDef = ALL_COLUMNS.find(c => c.key === selectedColumn);

  const getFilterType = (colKey: string): FilterCriteria['type'] => {
    const col = ALL_COLUMNS.find(c => c.key === colKey);
    if (!col) return 'text';
    if (col.type === 'dropdown') return 'dropdown';
    if (col.type === 'date') return 'dateRange';
    if (col.type === 'numeric') return 'numeric';
    return 'text';
  };

  const addFilter = () => {
    if (!selectedColumn) return;
    const filterType = getFilterType(selectedColumn);
    const label = ALL_COLUMNS.find(c => c.key === selectedColumn)?.label ?? selectedColumn;

    let value: FilterCriteria['value'];
    let displayLabel: string;

    switch (filterType) {
      case 'text':
        if (!filterValue.trim()) return;
        value = filterValue;
        displayLabel = `${label}: "${filterValue}"`;
        break;
      case 'dropdown':
        if (filterValues.length === 0) return;
        value = filterValues;
        displayLabel = `${label}: ${filterValues.join(', ')}`;
        break;
      case 'numeric':
        value = [numericRange[0] ? Number(numericRange[0]) : 0, numericRange[1] ? Number(numericRange[1]) : 99999];
        displayLabel = `${label}: ${numericRange[0] || '0'} - ${numericRange[1] || '∞'}`;
        break;
      case 'dateRange':
        value = dateRange;
        displayLabel = `${label}: ${dateRange[0] || 'any'} to ${dateRange[1] || 'any'}`;
        break;
      default:
        return;
    }

    onAddFilter({
      id: `${selectedColumn}-${Date.now()}`,
      column: selectedColumn,
      type: filterType,
      value,
      label: displayLabel,
    });

    setSelectedColumn('');
    setFilterValue('');
    setFilterValues([]);
    setNumericRange(['', '']);
    setDateRange(['', '']);
    setShowAddFilter(false);
  };

  const handleDropdownToggle = (val: string) => {
    setFilterValues(prev =>
      prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setShowAddFilter(!showAddFilter)}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-blue-700 bg-blue-50
                     hover:bg-blue-100 rounded-lg transition-colors"
          aria-label="Add filter"
        >
          <Plus className="h-4 w-4" />
          Add Filter
        </button>

        <button
          onClick={() => setShowSavedSets(!showSavedSets)}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-600
                     hover:bg-slate-100 rounded-lg transition-colors"
          aria-label="Saved filter sets"
        >
          <FolderOpen className="h-4 w-4" />
          Saved Sets
          {savedFilterSets.length > 0 && (
            <span className="ml-1 px-1.5 py-0.5 bg-slate-200 text-slate-700 rounded-full text-xs">
              {savedFilterSets.length}
            </span>
          )}
        </button>

        {filters.length > 0 && (
          <>
            <button
              onClick={() => setShowSaveDialog(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-emerald-700
                         hover:bg-emerald-50 rounded-lg transition-colors"
              aria-label="Save current filters"
            >
              <Save className="h-4 w-4" />
              Save Set
            </button>
            <button
              onClick={onClearAll}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-red-600
                         hover:bg-red-50 rounded-lg transition-colors"
              aria-label="Clear all filters"
            >
              <Trash2 className="h-4 w-4" />
              Clear All
            </button>
          </>
        )}
      </div>

      {/* Active filter chips */}
      {filters.length > 0 && (
        <div className="flex flex-wrap gap-2" role="list" aria-label="Active filters">
          {filters.map(filter => (
            <div
              key={filter.id}
              role="listitem"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-800
                         border border-blue-200 rounded-full text-sm"
            >
              <Filter className="h-3 w-3" />
              <span>{filter.label}</span>
              <button
                onClick={() => onRemoveFilter(filter.id)}
                className="ml-1 hover:text-blue-600 hover:bg-blue-100 rounded-full p-0.5"
                aria-label={`Remove filter: ${filter.label}`}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Save dialog */}
      {showSaveDialog && (
        <div className="p-4 bg-white border border-slate-200 rounded-lg shadow-sm">
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Filter set name..."
              value={saveSetName}
              onChange={e => setSaveSetName(e.target.value)}
              className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyDown={e => {
                if (e.key === 'Enter' && saveSetName.trim()) {
                  onSaveFilterSet(saveSetName.trim());
                  setSaveSetName('');
                  setShowSaveDialog(false);
                }
              }}
            />
            <button
              onClick={() => {
                if (saveSetName.trim()) {
                  onSaveFilterSet(saveSetName.trim());
                  setSaveSetName('');
                  setShowSaveDialog(false);
                }
              }}
              disabled={!saveSetName.trim()}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save
            </button>
            <button
              onClick={() => setShowSaveDialog(false)}
              className="px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Saved filter sets dropdown */}
      {showSavedSets && savedFilterSets.length > 0 && (
        <div className="p-3 bg-white border border-slate-200 rounded-lg shadow-sm space-y-2">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Saved Filter Sets</p>
          {savedFilterSets.map(set => (
            <div key={set.id} className="flex items-center justify-between px-3 py-2 hover:bg-slate-50 rounded-lg">
              <button
                onClick={() => { onLoadFilterSet(set); setShowSavedSets(false); }}
                className="text-sm text-slate-700 hover:text-blue-600"
              >
                {set.name}
                <span className="ml-2 text-xs text-slate-400">
                  ({set.filters.length} filter{set.filters.length !== 1 ? 's' : ''})
                </span>
              </button>
              <button
                onClick={() => onRemoveFilterSet(set.id)}
                className="p-1 text-slate-400 hover:text-red-500"
                aria-label={`Delete filter set: ${set.name}`}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {showSavedSets && savedFilterSets.length === 0 && (
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-500 text-center">
          No saved filter sets yet. Apply some filters and click "Save Set" to create one.
        </div>
      )}

      {/* Add filter form */}
      {showAddFilter && (
        <div className="p-4 bg-white border border-slate-200 rounded-lg shadow-sm space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Column</label>
              <select
                value={selectedColumn}
                onChange={e => {
                  setSelectedColumn(e.target.value);
                  setFilterValue('');
                  setFilterValues([]);
                  setNumericRange(['', '']);
                  setDateRange(['', '']);
                }}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm
                           focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">Select column...</option>
                {ALL_COLUMNS.map(col => (
                  <option key={col.key} value={col.key}>{col.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Value</label>

              {(!selectedColDef || selectedColDef.type === 'text') && (
                <input
                  type="text"
                  placeholder="Filter value..."
                  value={filterValue}
                  onChange={e => setFilterValue(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm
                             focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onKeyDown={e => e.key === 'Enter' && addFilter()}
                />
              )}

              {selectedColDef?.type === 'dropdown' && (
                <div className="max-h-40 overflow-auto border border-slate-200 rounded-lg p-2 space-y-1">
                  {getUniqueValues(selectedColumn as ColumnKey).map(val => (
                    <label key={val} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-slate-50 px-2 py-1 rounded">
                      <input
                        type="checkbox"
                        checked={filterValues.includes(val)}
                        onChange={() => handleDropdownToggle(val)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      {val}
                    </label>
                  ))}
                </div>
              )}

              {selectedColDef?.type === 'numeric' && (
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={numericRange[0]}
                    onChange={e => setNumericRange([e.target.value, numericRange[1]])}
                    className="w-1/2 px-3 py-2 border border-slate-200 rounded-lg text-sm
                               focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={numericRange[1]}
                    onChange={e => setNumericRange([numericRange[0], e.target.value])}
                    className="w-1/2 px-3 py-2 border border-slate-200 rounded-lg text-sm
                               focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              {selectedColDef?.type === 'date' && (
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={dateRange[0]}
                    onChange={e => setDateRange([e.target.value, dateRange[1]])}
                    className="w-1/2 px-3 py-2 border border-slate-200 rounded-lg text-sm
                               focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="date"
                    value={dateRange[1]}
                    onChange={e => setDateRange([dateRange[0], e.target.value])}
                    className="w-1/2 px-3 py-2 border border-slate-200 rounded-lg text-sm
                               focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowAddFilter(false)}
              className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={addFilter}
              disabled={!selectedColumn}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Apply Filter
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
