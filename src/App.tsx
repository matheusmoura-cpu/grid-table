import { Download, Database, AlertCircle, Loader2 } from 'lucide-react';
import { useTableState } from './hooks/useTableState';
import { SearchBar } from './components/SearchBar';
import { FilterPanel } from './components/FilterPanel';
import { ColumnManager } from './components/ColumnManager';
import { ViewToggle } from './components/ViewToggle';
import { DataTable } from './components/DataTable';
import { CardView } from './components/CardView';
import { exportToCsv } from './utils/csv';

function App() {
  const state = useTableState();

  if (state.error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="bg-white rounded-xl shadow-sm border border-red-200 p-8 max-w-md text-center">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-slate-900 mb-2">Something went wrong</h2>
          <p className="text-sm text-slate-500 mb-4">{state.error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  if (state.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50" role="status" aria-live="polite">
        <div className="text-center">
          <Loader2 className="h-10 w-10 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-sm text-slate-500">Loading machine data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Database className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Machine Fleet Dashboard</h1>
                <p className="text-sm text-slate-500">
                  {state.filteredCount} of {state.totalCount} machines
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <SearchBar value={state.searchQuery} onChange={state.updateSearch} />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6 space-y-4">
        {/* Toolbar */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <FilterPanel
            filters={state.filters}
            onAddFilter={state.addFilter}
            onRemoveFilter={state.removeFilter}
            onClearAll={state.clearAllFilters}
            savedFilterSets={state.preferences.savedFilterSets}
            onSaveFilterSet={state.saveFilterSet}
            onLoadFilterSet={state.loadFilterSet}
            onRemoveFilterSet={state.removeFilterSet}
          />

          <div className="flex items-center gap-2 flex-shrink-0">
            <ViewToggle viewMode={state.preferences.viewMode} onChange={state.setViewMode} />
            <ColumnManager
              visibleColumns={state.preferences.columns.visible}
              columnOrder={state.preferences.columns.order}
              onToggleColumn={state.toggleColumn}
              onReorderColumns={state.reorderColumns}
            />
            <button
              onClick={() => exportToCsv(state.data, state.preferences.columns.visible)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-600
                         hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
              aria-label="Export to CSV"
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>
          </div>
        </div>

        {/* Table / Cards */}
        {state.preferences.viewMode === 'card' ? (
          <CardView
            data={state.data}
            visibleColumns={state.preferences.columns.visible}
            matches={state.matches}
          />
        ) : (
          <DataTable
            data={state.data}
            visibleColumns={state.preferences.columns.visible}
            columnOrder={state.preferences.columns.order}
            columnWidths={state.preferences.columns.widths}
            onColumnResize={state.setColumnWidth}
            viewMode={state.preferences.viewMode}
            pageSize={state.preferences.pageSize}
            onPageSizeChange={state.setPageSize}
            matches={state.matches}
            totalCount={state.totalCount}
            filteredCount={state.filteredCount}
          />
        )}
      </main>
    </div>
  );
}

export default App;
