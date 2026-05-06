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
  selectedIds: Set<number>;
  onToggleRow: (id: number) => void;
  onToggleAll: (ids: number[]) => void;
  onSiteClick: (machineId: number) => void;
}

const statusColumns = new Set(['connectivityStatus', 'commissioningState', 'workingState', 'targetWorkingState']);
const CHECKBOX_COL_WIDTH = 48;

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
  selectedIds,
  onToggleRow,
  onToggleAll,
  onSiteClick,
}: DataTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const resizingRef = useRef<{ key: string; startX: number; startWidth: number } | null>(null);
  const [isScrolledX, setIsScrolledX] = useState(false);

  const isCompact = viewMode === 'compact';
  const defaultColWidth = isCompact ? 120 : 160;

  const orderedVisible = useMemo(
    () => columnOrder.filter(k => visibleColumns.includes(k)),
    [columnOrder, visibleColumns],
  );

  const columns = useMemo(() => {
    return orderedVisible.map(key => {
      const colDef = ALL_COLUMNS.find(c => c.key === key)!;
      const width = columnWidths[key];

      return columnHelper.accessor(key as keyof MachineRecord, {
        header: colDef.label,
        size: width || defaultColWidth,
        cell: info => {
          const value = String(info.getValue());
          const rowId = info.row.original.id;
          const recordMatches = matches.get(rowId);
          const fieldMatches = recordMatches?.get(key);

          if (key === 'site') {
            return (
              <button
                onClick={(e) => { e.stopPropagation(); onSiteClick(info.row.original.id); }}
                className="text-blue-600 hover:text-blue-800 hover:underline underline-offset-2
                           decoration-blue-300 transition-colors text-left font-medium
                           focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1 rounded"
                aria-label={`View details for ${value}`}
              >
                <HighlightedCell value={value} indices={fieldMatches} />
              </button>
            );
          }

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
  }, [orderedVisible, columnWidths, defaultColWidth, matches, onSiteClick]);

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
    const startWidth = columnWidths[key] || defaultColWidth;
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
  }, [columnWidths, defaultColWidth, onColumnResize]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const scrollLeft = (e.target as HTMLDivElement).scrollLeft;
    setIsScrolledX(scrollLeft > 0);
  }, []);

  const pageRowIds = table.getRowModel().rows.map(r => r.original.id);
  const allPageSelected = pageRowIds.length > 0 && pageRowIds.every(id => selectedIds.has(id));
  const somePageSelected = pageRowIds.some(id => selectedIds.has(id));

  const stickyColShadow = isScrolledX ? 'sticky-col-shadow' : '';

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
    <div className="flex flex-col min-h-0 flex-1">
      {/* Scrollable table region */}
      <div
        className="bg-white rounded-xl border border-slate-200 shadow-sm flex-1 min-h-0 overflow-auto"
        onScroll={handleScroll}
        role="region"
        aria-label="Scrollable table"
        tabIndex={0}
      >
        <table
          className="border-collapse"
          style={{ minWidth: 'max-content' }}
          role="grid"
          aria-label="Machine fleet data"
          aria-rowcount={data.length}
        >
          <thead>
            <tr className="sticky-header-shadow">
              {/* Checkbox header — sticky both axes, highest z-index */}
              <th
                className={`text-center border-b border-slate-200 select-none bg-slate-50
                           ${isCompact ? 'px-2 py-2' : 'px-3 py-3'}
                           sticky top-0 left-0 z-30 ${stickyColShadow}`}
                style={{ width: CHECKBOX_COL_WIDTH, minWidth: CHECKBOX_COL_WIDTH }}
                scope="col"
              >
                <input
                  type="checkbox"
                  checked={allPageSelected}
                  ref={el => { if (el) el.indeterminate = somePageSelected && !allPageSelected; }}
                  onChange={() => onToggleAll(pageRowIds)}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500
                             cursor-pointer"
                  aria-label={allPageSelected ? 'Deselect all visible rows' : 'Select all visible rows'}
                />
              </th>

              {/* First data column header — sticky both axes */}
              {table.getHeaderGroups().map(headerGroup => {
                const headers = headerGroup.headers;
                if (headers.length === 0) return null;

                const firstHeader = headers[0];
                const restHeaders = headers.slice(1);

                return [
                  <th
                    key={firstHeader.id}
                    className={`text-left font-semibold text-slate-600 border-b border-slate-200 select-none bg-slate-50
                               ${isCompact ? 'px-3 py-2 text-xs' : 'px-4 py-3 text-xs'}
                               group relative sticky top-0 z-30 ${stickyColShadow}`}
                    style={{
                      width: firstHeader.getSize(),
                      minWidth: 60,
                      left: CHECKBOX_COL_WIDTH,
                      position: 'sticky',
                    }}
                    scope="col"
                    aria-sort={
                      firstHeader.column.getIsSorted()
                        ? firstHeader.column.getIsSorted() === 'asc' ? 'ascending' : 'descending'
                        : 'none'
                    }
                  >
                    <button
                      className="inline-flex items-center gap-1 hover:text-slate-900 transition-colors w-full"
                      onClick={firstHeader.column.getToggleSortingHandler()}
                      aria-label={`Sort by ${flexRender(firstHeader.column.columnDef.header, firstHeader.getContext())}`}
                    >
                      <span className="truncate">
                        {flexRender(firstHeader.column.columnDef.header, firstHeader.getContext())}
                      </span>
                      {firstHeader.column.getIsSorted() === 'asc' ? (
                        <ArrowUp className="h-3.5 w-3.5 flex-shrink-0 text-blue-600" />
                      ) : firstHeader.column.getIsSorted() === 'desc' ? (
                        <ArrowDown className="h-3.5 w-3.5 flex-shrink-0 text-blue-600" />
                      ) : (
                        <ArrowUpDown className="h-3.5 w-3.5 flex-shrink-0 opacity-0 group-hover:opacity-50" />
                      )}
                    </button>
                    <div
                      className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize
                                 hover:bg-blue-400 active:bg-blue-500"
                      onMouseDown={(e) => handleMouseDown(firstHeader.column.id, e)}
                      role="separator"
                      aria-orientation="vertical"
                    />
                  </th>,

                  ...restHeaders.map(header => {
                    const colKey = header.column.id;
                    return (
                      <th
                        key={header.id}
                        className={`text-left font-semibold text-slate-600 border-b border-slate-200 select-none bg-slate-50
                                   ${isCompact ? 'px-3 py-2 text-xs' : 'px-4 py-3 text-xs'}
                                   group relative sticky top-0 z-20`}
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
                        <div
                          className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize
                                     hover:bg-blue-400 active:bg-blue-500"
                          onMouseDown={(e) => handleMouseDown(colKey, e)}
                          role="separator"
                          aria-orientation="vertical"
                        />
                      </th>
                    );
                  }),
                ];
              })}
            </tr>
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row, rowIndex) => {
              const isSelected = selectedIds.has(row.original.id);
              const rowBg = isSelected
                ? 'bg-blue-50/80'
                : rowIndex % 2 === 0
                  ? 'bg-white'
                  : 'bg-slate-50/50';
              const rowBgHover = isSelected ? 'hover:bg-blue-50' : 'hover:bg-blue-50/30';

              const cells = row.getVisibleCells();
              const firstCell = cells[0];
              const restCells = cells.slice(1);

              return (
                <tr
                  key={row.id}
                  className={`border-b border-slate-100 transition-colors ${rowBg} ${rowBgHover}`}
                  role="row"
                  aria-selected={isSelected}
                >
                  {/* Checkbox cell — sticky left */}
                  <td
                    className={`text-center border-b border-slate-100 sticky left-0 z-10
                               ${isCompact ? 'px-2 py-1.5' : 'px-3 py-3'}
                               ${rowBg} ${stickyColShadow}`}
                    style={{ width: CHECKBOX_COL_WIDTH, minWidth: CHECKBOX_COL_WIDTH }}
                    role="gridcell"
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onToggleRow(row.original.id)}
                      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500
                                 cursor-pointer"
                      aria-label={`Select ${row.original.site} - ${row.original.uniqueMachineNumber}`}
                    />
                  </td>

                  {/* First data cell — sticky left (offset by checkbox width) */}
                  {firstCell && (
                    <td
                      key={firstCell.id}
                      className={`text-slate-700 border-b border-slate-100 sticky z-10
                                 ${isCompact ? 'px-3 py-1.5 text-xs' : 'px-4 py-3 text-sm'}
                                 max-w-[300px] truncate ${rowBg} ${stickyColShadow}`}
                      style={{ left: CHECKBOX_COL_WIDTH }}
                      role="gridcell"
                    >
                      {flexRender(firstCell.column.columnDef.cell, firstCell.getContext())}
                    </td>
                  )}

                  {/* Remaining cells — normal flow */}
                  {restCells.map(cell => (
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
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination — fixed below the table, never scrolls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-1 py-3 flex-shrink-0">
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

          {selectedIds.size > 0 && (
            <span className="text-sm text-blue-600 font-medium">
              {selectedIds.size} selected
            </span>
          )}

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
