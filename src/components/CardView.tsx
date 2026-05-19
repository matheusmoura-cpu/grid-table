import type { MachineRecord } from '../types';
import { ALL_COLUMNS } from '../data/machines';
import { StatusBadge } from './StatusBadge';
import { HighlightedCell } from './HighlightedCell';
import { Wifi, WifiOff, AlertTriangle } from 'lucide-react';

interface CardViewProps {
  data: MachineRecord[];
  visibleColumns: string[];
  matches: Map<number, Map<string, [number, number][]>>;
  selectedIds: Set<number>;
  onToggleRow: (id: number) => void;
  onSiteClick: (machineId: number) => void;
}

const statusColumns = ['connectivityStatus', 'commissioningState', 'workingState', 'targetWorkingState'];

function getConnectivityIcon(status: string) {
  if (status === 'Connected') return <Wifi className="h-4 w-4 text-emerald-600" />;
  if (status === 'Disconnected') return <WifiOff className="h-4 w-4 text-amber-500" />;
  return <WifiOff className="h-4 w-4 text-slate-400" />;
}

export function CardView({ data, visibleColumns, matches, selectedIds, onToggleRow, onSiteClick }: CardViewProps) {
  if (data.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500">
        <p className="text-lg">No machines found</p>
        <p className="text-sm mt-1">Try adjusting your search or filters</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {data.map(record => {
        const recordMatches = matches.get(record.id);
        const isSelected = selectedIds.has(record.id);
        return (
          <div
            key={record.id}
            className={`bg-white rounded-xl border shadow-sm hover:shadow-md
                       transition-shadow p-4 space-y-3
                       ${isSelected ? 'border-blue-300 ring-2 ring-blue-100' : 'border-slate-200'}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-2.5 flex-1 min-w-0">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => onToggleRow(record.id)}
                  className="h-4 w-4 mt-0.5 rounded border-slate-300 text-blue-600
                             focus:ring-blue-500 cursor-pointer flex-shrink-0"
                  aria-label={`Select ${record.site}`}
                />
                <div className="min-w-0">
                  <h3 className="font-semibold text-sm truncate">
                    <button
                      onClick={() => onSiteClick(record.id)}
                      className="text-blue-600 hover:text-blue-800 hover:underline underline-offset-2
                                 decoration-blue-300 transition-colors text-left
                                 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1 rounded"
                      aria-label={`View details for ${record.site}`}
                    >
                      <HighlightedCell
                        value={record.site}
                        indices={recordMatches?.get('site')}
                      />
                    </button>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    <HighlightedCell
                      value={record.uniqueMachineNumber}
                      indices={recordMatches?.get('uniqueMachineNumber')}
                    />
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 ml-2">
                {getConnectivityIcon(record.connectivityStatus)}
                {record.activeAlarms > 0 && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-50 text-red-700
                                   rounded-full text-xs font-medium">
                    <AlertTriangle className="h-3 w-3" />
                    {record.activeAlarms}
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5">
              <StatusBadge value={record.connectivityStatus} type="connectivity" />
              <StatusBadge value={record.workingState} type="working" />
            </div>

            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
              {visibleColumns
                .filter(k => !['site', 'uniqueMachineNumber', 'connectivityStatus', 'workingState', 'activeAlarms'].includes(k))
                .slice(0, 8)
                .map(key => {
                  const col = ALL_COLUMNS.find(c => c.key === key);
                  if (!col) return null;
                  const val = String(record[key as keyof MachineRecord]);
                  const isStatus = statusColumns.includes(key);

                  return (
                    <div key={key}>
                      <span className="text-slate-400">{col.label}</span>
                      <p className="text-slate-700 truncate mt-0.5">
                        {isStatus ? (
                          <StatusBadge value={val} type={key === 'commissioningState' ? 'commissioning' : 'working'} />
                        ) : (
                          <HighlightedCell value={val} indices={recordMatches?.get(key)} />
                        )}
                      </p>
                    </div>
                  );
                })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
