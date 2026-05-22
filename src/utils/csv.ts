import type { MachineRecord } from '../types';
import { ALL_COLUMNS } from '../data/machines';

export function exportToCsv(data: MachineRecord[], visibleColumns: string[]): void {
  const cols = ALL_COLUMNS.filter(c => visibleColumns.includes(c.key));
  const header = cols.map(c => `"${c.label}"`).join(',');
  const rows = data.map(row =>
    cols.map(c => {
      const val = String(row[c.key as keyof MachineRecord]);
      return `"${val.replace(/"/g, '""')}"`;
    }).join(',')
  );

  const csv = [header, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `machine-fleet-export-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
