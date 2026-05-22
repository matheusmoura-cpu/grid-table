import Fuse from 'fuse.js';
import type { MachineRecord } from '../types';
import { ALL_COLUMNS } from '../data/machines';

const fuseKeys = ALL_COLUMNS.map(c => c.key);

let fuseInstance: Fuse<MachineRecord> | null = null;

export function getFuseInstance(data: MachineRecord[]): Fuse<MachineRecord> {
  if (!fuseInstance) {
    fuseInstance = new Fuse(data, {
      keys: fuseKeys,
      threshold: 0.3,
      includeMatches: true,
      ignoreLocation: true,
      minMatchCharLength: 2,
    });
  }
  return fuseInstance;
}

export function resetFuseInstance(): void {
  fuseInstance = null;
}

export function fuzzySearch(data: MachineRecord[], query: string) {
  if (!query.trim()) return { results: data, matches: new Map<number, Map<string, [number, number][]>>() };

  const fuse = getFuseInstance(data);
  const fuseResults = fuse.search(query);

  const matchMap = new Map<number, Map<string, [number, number][]>>();

  fuseResults.forEach(result => {
    if (result.matches) {
      const fieldMap = new Map<string, [number, number][]>();
      result.matches.forEach(m => {
        if (m.key) {
          fieldMap.set(m.key, m.indices as [number, number][]);
        }
      });
      matchMap.set(result.item.id, fieldMap);
    }
  });

  return {
    results: fuseResults.map(r => r.item),
    matches: matchMap,
  };
}

export function getAutocompleteSuggestions(data: MachineRecord[], query: string): string[] {
  if (!query.trim() || query.length < 2) return [];

  const lowerQuery = query.toLowerCase();
  const suggestions = new Set<string>();

  for (const record of data) {
    for (const col of ALL_COLUMNS) {
      const val = String(record[col.key as keyof MachineRecord]);
      if (val !== '-' && val !== 'N/A' && val.toLowerCase().includes(lowerQuery)) {
        suggestions.add(val);
        if (suggestions.size >= 8) return Array.from(suggestions);
      }
    }
  }

  return Array.from(suggestions);
}
