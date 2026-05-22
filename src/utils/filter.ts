import type { MachineRecord, FilterCriteria } from '../types';

function parseDate(dateStr: string): Date | null {
  if (!dateStr || dateStr === '-') return null;
  const parts = dateStr.match(/(\d{2})-(\d{2})-(\d{4})\s+(\d{2}):(\d{2}):(\d{2})/);
  if (!parts) return null;
  return new Date(+parts[3], +parts[2] - 1, +parts[1], +parts[4], +parts[5], +parts[6]);
}

export function applyFilters(data: MachineRecord[], filters: FilterCriteria[]): MachineRecord[] {
  if (filters.length === 0) return data;

  return data.filter(record => {
    return filters.every(filter => {
      const key = filter.column as keyof MachineRecord;
      const val = record[key];

      switch (filter.type) {
        case 'text': {
          const searchVal = (filter.value as string).toLowerCase();
          return String(val).toLowerCase().includes(searchVal);
        }
        case 'dropdown': {
          const selectedValues = filter.value as string[];
          if (selectedValues.length === 0) return true;
          return selectedValues.includes(String(val));
        }
        case 'numeric': {
          const [min, max] = filter.value as [number, number];
          const numVal = typeof val === 'number' ? val : Number(val);
          if (isNaN(numVal)) return false;
          return numVal >= min && numVal <= max;
        }
        case 'dateRange': {
          const [startStr, endStr] = filter.value as [string, string];
          const dateVal = parseDate(String(val));
          if (!dateVal) return !startStr && !endStr;
          if (startStr) {
            const start = new Date(startStr);
            if (dateVal < start) return false;
          }
          if (endStr) {
            const end = new Date(endStr);
            end.setHours(23, 59, 59);
            if (dateVal > end) return false;
          }
          return true;
        }
        default:
          return true;
      }
    });
  });
}
