import { ArrowLeft, Wifi, WifiOff, AlertTriangle, MapPin } from 'lucide-react';
import type { MachineRecord } from '../types';
import { ALL_COLUMNS } from '../data/machines';
import { StatusBadge } from './StatusBadge';

interface SiteDetailProps {
  machine: MachineRecord;
  siteMachines: MachineRecord[];
  onBack: () => void;
  onNavigateToMachine: (id: number) => void;
}

const statusColumns = new Set(['connectivityStatus', 'commissioningState', 'workingState', 'targetWorkingState']);

function getConnectivityIcon(status: string) {
  if (status === 'Connected') return <Wifi className="h-5 w-5 text-emerald-600" />;
  if (status === 'Disconnected') return <WifiOff className="h-5 w-5 text-amber-500" />;
  return <WifiOff className="h-5 w-5 text-slate-400" />;
}

export function SiteDetail({ machine, siteMachines, onBack, onNavigateToMachine }: SiteDetailProps) {
  const otherMachines = siteMachines.filter(m => m.id !== machine.id);

  return (
    <div className="space-y-6">
      {/* Breadcrumb / Back nav */}
      <nav aria-label="Breadcrumb">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800
                     transition-colors group"
          aria-label="Back to table"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
          Back to Machine Fleet
        </button>
      </nav>

      {/* Header card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-xl font-bold text-white">{machine.site}</h1>
              <div className="flex items-center gap-3 mt-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/20 text-white
                                 rounded-full text-xs font-medium backdrop-blur-sm">
                  <MapPin className="h-3 w-3" />
                  {machine.sitePostalCode} &middot; {machine.siteCountry}
                </span>
                <span className="text-blue-100 text-sm">
                  Machine: {machine.uniqueMachineNumber}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {getConnectivityIcon(machine.connectivityStatus)}
              {machine.activeAlarms > 0 && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-500/90 text-white
                                 rounded-full text-sm font-medium">
                  <AlertTriangle className="h-4 w-4" />
                  {machine.activeAlarms} Alarm{machine.activeAlarms !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Status bar */}
        <div className="flex flex-wrap gap-3 px-6 py-3 bg-slate-50 border-b border-slate-200">
          <StatusBadge value={machine.connectivityStatus} type="connectivity" />
          <StatusBadge value={machine.commissioningState} type="commissioning" />
          <StatusBadge value={machine.workingState} type="working" />
        </div>
      </div>

      {/* All data fields */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-800">Machine Details</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-0">
          {ALL_COLUMNS.map(col => {
            const value = String(machine[col.key as keyof MachineRecord]);
            const isStatus = statusColumns.has(col.key);

            return (
              <div
                key={col.key}
                className="px-6 py-4 border-b border-slate-100 last:border-b-0
                           sm:[&:nth-last-child(2)]:border-b-0"
              >
                <dt className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">
                  {col.label}
                </dt>
                <dd className="text-sm text-slate-800">
                  {isStatus ? (
                    <StatusBadge
                      value={value}
                      type={col.key === 'connectivityStatus' ? 'connectivity'
                        : col.key === 'commissioningState' ? 'commissioning' : 'working'}
                    />
                  ) : col.key === 'activeAlarms' ? (
                    <span className={`font-mono ${Number(value) > 0 ? 'text-red-600 font-semibold' : 'text-slate-600'}`}>
                      {value}
                    </span>
                  ) : (
                    value || '-'
                  )}
                </dd>
              </div>
            );
          })}
        </div>
      </div>

      {/* Other machines at this site */}
      {otherMachines.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="text-base font-semibold text-slate-800">
              Other Machines at This Site
              <span className="ml-2 text-sm font-normal text-slate-400">
                ({otherMachines.length})
              </span>
            </h2>
          </div>
          <div className="divide-y divide-slate-100">
            {otherMachines.map(m => (
              <button
                key={m.id}
                onClick={() => onNavigateToMachine(m.id)}
                className="w-full flex items-center justify-between px-6 py-3
                           hover:bg-slate-50 transition-colors text-left"
              >
                <div>
                  <p className="text-sm font-medium text-blue-600 hover:text-blue-800">
                    {m.uniqueMachineNumber}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {m.machineType} &middot; {m.modelCode}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge value={m.connectivityStatus} type="connectivity" />
                  {m.activeAlarms > 0 && (
                    <span className="text-xs text-red-600 font-medium">
                      {m.activeAlarms} alarm{m.activeAlarms !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
