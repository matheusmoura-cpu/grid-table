import { useMemo, useRef, useEffect } from 'react';
import { Download, Database, AlertCircle, Loader2 } from 'lucide-react';
import { useTableState } from './hooks/useTableState';
import { SearchBar, type SearchBarHandle } from './components/SearchBar';
import { FilterPanel } from './components/FilterPanel';
import { ColumnManager } from './components/ColumnManager';
import { ViewToggle } from './components/ViewToggle';
import { DataTable } from './components/DataTable';
import { CardView } from './components/CardView';
import { SiteDetail } from './components/SiteDetail';
import { exportToCsv } from './utils/csv';

const PAGE_TITLE = 'Machine Management Table Prototype';

function App() {
  const state = useTableState();
  const searchBarRef = useRef<SearchBarHandle>(null);

  // CMD+K / CTRL+K global shortcut
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchBarRef.current?.focus();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Set document title
  useEffect(() => {
    document.title = PAGE_TITLE;
  }, []);

  const siteDetailMachine = useMemo(() => {
    if (!state.currentPage?.startsWith('site-detail:')) return null;
    const machineId = Number(state.currentPage.split(':')[1]);
    return state.allData.find(m => m.id === machineId) ?? null;
  }, [state.currentPage, state.allData]);

  const siteMachines = useMemo(() => {
    if (!siteDetailMachine) return [];
    return state.allData.filter(m => m.site === siteDetailMachine.site);
  }, [siteDetailMachine, state.allData]);

  const handleExport = () => {
    const selectedData = state.selectedIds.size > 0
      ? state.data.filter(row => state.selectedIds.has(row.id))
      : state.data;
    exportToCsv(selectedData, state.preferences.columns.visible);
  };

  const exportLabel = state.selectedIds.size > 0
    ? `Export ${state.selectedIds.size} Selected`
    : 'Export CSV';

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
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Database className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">{PAGE_TITLE}</h1>
              <p className="text-sm text-slate-500">
                {state.filteredCount} of {state.totalCount} machines
                {state.selectedIds.size > 0 && (
                  <span className="text-blue-600 ml-2 font-medium">
                    &middot; {state.selectedIds.size} selected
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6 space-y-4">
        {/* Site Detail View */}
        {siteDetailMachine ? (
          <SiteDetail
            machine={siteDetailMachine}
            siteMachines={siteMachines}
            onBack={state.navigateBack}
            onNavigateToMachine={state.navigateToSite}
          />
        ) : (
          <>
            {/* Search + Filter row: search left, filters after */}
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <SearchBar ref={searchBarRef} value={state.searchQuery} onChange={state.updateSearch} />
                <div className="flex items-center gap-2 flex-shrink-0">
                  <ViewToggle viewMode={state.preferences.viewMode} onChange={state.setViewMode} />
                  <ColumnManager
                    visibleColumns={state.preferences.columns.visible}
                    columnOrder={state.preferences.columns.order}
                    onToggleColumn={state.toggleColumn}
                    onReorderColumns={state.reorderColumns}
                  />
                  <button
                    onClick={handleExport}
                    className={`inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium
                               rounded-lg transition-colors border
                               ${state.selectedIds.size > 0
                                 ? 'text-blue-700 bg-blue-50 border-blue-200 hover:bg-blue-100'
                                 : 'text-slate-600 border-slate-200 hover:bg-slate-100'
                               }`}
                    aria-label={exportLabel}
                    title={state.selectedIds.size > 0
                      ? `Export ${state.selectedIds.size} selected row(s) to CSV`
                      : 'Export all filtered rows to CSV'}
                  >
                    <Download className="h-4 w-4" />
                    <span className="hidden sm:inline">{exportLabel}</span>
                  </button>
                </div>
              </div>

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
            </div>

            {/* Selection indicator bar */}
            {state.selectedIds.size > 0 && (
              <div className="flex items-center justify-between px-4 py-2.5 bg-blue-50 border border-blue-200
                              rounded-lg" role="status" aria-live="polite">
                <p className="text-sm text-blue-800">
                  <span className="font-semibold">{state.selectedIds.size}</span> row{state.selectedIds.size !== 1 ? 's' : ''} selected
                </p>
                <button
                  onClick={state.clearSelection}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  Clear selection
                </button>
              </div>
            )}

            {/* Table / Cards */}
            {state.preferences.viewMode === 'card' ? (
              <CardView
                data={state.data}
                visibleColumns={state.preferences.columns.visible}
                matches={state.matches}
                selectedIds={state.selectedIds}
                onToggleRow={state.toggleRowSelection}
                onSiteClick={state.navigateToSite}
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
                selectedIds={state.selectedIds}
                onToggleRow={state.toggleRowSelection}
                onToggleAll={state.toggleAllSelection}
                onSiteClick={state.navigateToSite}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default App;
