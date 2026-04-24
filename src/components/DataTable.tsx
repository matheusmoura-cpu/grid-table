import { useMemo, useState, useCallback, useRef } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
} from '@tanstack/react-table';
import { ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import type { MachineRecord, ViewMode } from '../types';
import { ALL_COLUMNS } from '../data/machines';
import { StatusBadge } from './StatusBadge';
import { HighlightedCell } from './HighlightedCell';

interface DataTableProps {
  data: MachineRecord[];
  visibleColumns: string[];
  columnOrder: string[];
  columnWidths: Record<string, number>;
  onColumnResize: (key: string, width: number) => void;
  viewMode: ViewMode;
  pageSize: number;
  onPageSizeChange: (size: number) => void;
  matches: Map<number, Map<string, [number, number][]>>;
  totalCount: number;
  filteredCount: number;
}

const statusColumns = new Set(['connectivityStatus', 'commissioningState', 'workingState', 'targetWorkingState']);

const columnHelper = createColumnHelper<MachineRecord>();

export function DataTable({
  data,
  visibleColumns,
  columnOrder,
  columnWidths,
  onColumnResize,
  viewMode,
  pageSize,
  onPageSizeChange,
  matches,
  totalCount,
  filteredCount,
}: DataTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const resizingRef = useRef<{ key: string; startX: number; startWidth: number } | null>(null);

  const columns = useMemo(() => {
    const orderedVisible = columnOrder.filter(k => visibleColumns.includes(k));
    return orderedVisible.map(key => {
      const colDef = ALL_COLUMNS.find(c => c.key === key)!;
      const width = columnWidths[key];

      return columnHelper.accessor(key as keyof MachineRecord, {
        header: colDef.label,
        size: width || (viewMode === 'compact' ? 120 : 160),
        cell: info => {
          const value = String(info.getValue());
          const rowId = info.row.original.id;
          const recordMatches = matches.get(rowId);
          const fieldMatches = recordMatches?.get(key);

          if (statusColumns.has(key)) {
            const statusType = key === 'connectivityStatus' ? 'connectivity'
              : key === 'commissioningState' ? 'commissioning' : 'working';
            return <StatusBadge value={value} type={statusType} />;
          }

          if (key === 'activeAlarms') {
            const num = Number(value);
            return (
              <span className={`font-mono text-sm ${num > 0 ? 'text-red-600 font-semibold' : 'text-slate-500'}`}>
                {value}
              </span>
            );
          }

          return <HighlightedCell value={value} indices={fieldMatches} />;
        },
      });
    });
  }, [visibleColumns, columnOrder, columnWidths, viewMode, matches]);

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize } },
  });

  const handleMouseDown = useCallback((key: string, e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = columnWidths[key] || (viewMode === 'compact' ? 120 : 160);
    resizingRef.current = { key, startX, startWidth };

    const handleMouseMove = (ev: MouseEvent) => {
      if (!resizingRef.current) return;
      const delta = ev.clientX - resizingRef.current.startX;
      const newWidth = Math.max(60, resizingRef.current.startWidth + delta);
      onColumnResize(resizingRef.current.key, newWidth);
    };

    const handleMouseUp = () => {
      resizingRef.current = null;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [columnWidths, viewMode, onColumnResize]);

  const isCompact = viewMode === 'compact';

  if (data.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
        <div className="text-slate-400 text-5xl mb-4">🔍</div>
        <p className="text-lg font-medium text-slate-600">No results found</p>
        <p className="text-sm text-slate-400 mt-1">Try adjusting your search or filters</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Table container with horizontal scroll */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table
            className="w-full border-collapse"
            role="grid"
            aria-label="Machine fleet data"
            aria-rowcount={data.length}
          >
            <thead className="sticky top-0 z-10">
              <tr className="bg-slate-50 border-b border-slate-200">
                {table.getHeaderGroups().map(headerGroup =>
                  headerGroup.headers.map(header => {
                    const colKey = header.column.id;
                    return (
                      <th
                        key={header.id}
                        className={`text-left font-semibold text-slate-600 border-b border-slate-200 select-none
                                   ${isCompact ? 'px-3 py-2 text-xs' : 'px-4 py-3 text-xs'}
                                   group relative`}
                        style={{ width: header.getSize(), minWidth: 60 }}
                        scope="col"
                        aria-sort={
                          header.column.getIsSorted()
                            ? header.column.getIsSorted() === 'asc' ? 'ascending' : 'descending'
                            : 'none'
                        }
                      >
                        <button
                          className="inline-flex items-center gap-1 hover:text-slate-900 transition-colors w-full"
                          onClick={header.column.getToggleSortingHandler()}
                          aria-label={`Sort by ${flexRender(header.column.columnDef.header, header.getContext())}`}
                        >
                          <span className="truncate">
                            {flexRender(header.column.columnDef.header, header.getContext())}
                          </span>
                          {header.column.getIsSorted() === 'asc' ? (
                            <ArrowUp className="h-3.5 w-3.5 flex-shrink-0 text-blue-600" />
                          ) : header.column.getIsSorted() === 'desc' ? (
                            <ArrowDown className="h-3.5 w-3.5 flex-shrink-0 text-blue-600" />
                          ) : (
                            <ArrowUpDown className="h-3.5 w-3.5 flex-shrink-0 opacity-0 group-hover:opacity-50" />
                          )}
                        </button>
                        {/* Column resize handle */}
                        <div
                          className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize
                                     hover:bg-blue-400 active:bg-blue-500"
                          onMouseDown={(e) => handleMouseDown(colKey, e)}
                          role="separator"
                          aria-orientation="vertical"
                        />
                      </th>
                    );
                  })
                )}
              </tr>
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row, rowIndex) => (
                <tr
                  key={row.id}
                  className={`border-b border-slate-100 hover:bg-blue-50/30 transition-colors
                             ${rowIndex % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`}
                  role="row"
                >
                  {row.getVisibleCells().map(cell => (
                    <td
                      key={cell.id}
                      className={`text-slate-700 border-b border-slate-100
                                 ${isCompact ? 'px-3 py-1.5 text-xs' : 'px-4 py-3 text-sm'}
                                 max-w-[300px] truncate`}
                      role="gridcell"
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination - chosen over infinite scroll: pagination gives users clear position context,
          is more predictable for accessibility/keyboard navigation, and works better with the
          filtering/sorting model since the full dataset is already client-side */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-1">
        <div className="flex items-center gap-4">
          <p className="text-sm text-slate-500">
            Showing{' '}
            <span className="font-medium text-slate-700">
              {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}
            </span>
            {' '}-{' '}
            <span className="font-medium text-slate-700">
              {Math.min(
                (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                filteredCount
              )}
            </span>
            {' '}of{' '}
            <span className="font-medium text-slate-700">{filteredCount}</span>
            {filteredCount !== totalCount && (
              <span className="text-slate-400"> (filtered from {totalCount})</span>
            )}
          </p>

          <div className="flex items-center gap-2">
            <label htmlFor="page-size" className="text-sm text-slate-500">Rows:</label>
            <select
              id="page-size"
              value={table.getState().pagination.pageSize}
              onChange={e => {
                const size = Number(e.target.value);
                table.setPageSize(size);
                onPageSizeChange(size);
              }}
              className="px-2 py-1 border border-slate-200 rounded-lg text-sm bg-white
                         focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {[10, 25, 50, 100].map(size => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
            className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="First page"
          >
            <ChevronsLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="px-3 py-1 text-sm text-slate-600">
            Page <span className="font-medium">{table.getState().pagination.pageIndex + 1}</span> of{' '}
            <span className="font-medium">{table.getPageCount()}</span>
          </span>
          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <button
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
            className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Last page"
          >
            <ChevronsRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
