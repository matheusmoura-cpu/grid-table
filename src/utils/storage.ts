import type { UserPreferences, SavedFilterSet, FilterCriteria } from '../types';
import { ALL_COLUMNS } from '../data/machines';

const PREFS_KEY = 'machine-table-preferences';
const FILTERS_KEY = 'machine-table-active-filters';
const SEARCH_KEY = 'machine-table-search';

const defaultPreferences: UserPreferences = {
  viewMode: 'detailed',
  columns: {
    visible: ALL_COLUMNS.map(c => c.key),
    order: ALL_COLUMNS.map(c => c.key),
    widths: {},
  },
  pageSize: 25,
  savedFilterSets: [],
};

export function loadPreferences(): UserPreferences {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) return { ...defaultPreferences };
    return { ...defaultPreferences, ...JSON.parse(raw) };
  } catch {
    return { ...defaultPreferences };
  }
}

export function savePreferences(prefs: UserPreferences): void {
  localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
}

export function loadActiveFilters(): FilterCriteria[] {
  try {
    const raw = localStorage.getItem(FILTERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveActiveFilters(filters: FilterCriteria[]): void {
  localStorage.setItem(FILTERS_KEY, JSON.stringify(filters));
}

export function loadSearchQuery(): string {
  return localStorage.getItem(SEARCH_KEY) ?? '';
}

export function saveSearchQuery(query: string): void {
  localStorage.setItem(SEARCH_KEY, query);
}

export function saveSavedFilterSet(set: SavedFilterSet, prefs: UserPreferences): UserPreferences {
  const updated = {
    ...prefs,
    savedFilterSets: [...prefs.savedFilterSets.filter(s => s.id !== set.id), set],
  };
  savePreferences(updated);
  return updated;
}

export function deleteSavedFilterSet(id: string, prefs: UserPreferences): UserPreferences {
  const updated = {
    ...prefs,
    savedFilterSets: prefs.savedFilterSets.filter(s => s.id !== id),
  };
  savePreferences(updated);
  return updated;
}
