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

const PROTECTED_COLUMNS = ['site'] as const;

function enforceProtectedColumns(prefs: UserPreferences): UserPreferences {
  let { visible, order } = prefs.columns;

  // Ensure every protected column is always visible.
  for (const col of PROTECTED_COLUMNS) {
    if (!visible.includes(col)) {
      visible = [col, ...visible];
    }
  }

  // Ensure protected columns appear first in order (in definition order).
  const protectedInOrder = PROTECTED_COLUMNS.filter(col => order.includes(col));
  const rest = order.filter(col => !(PROTECTED_COLUMNS as readonly string[]).includes(col));
  order = [...protectedInOrder, ...rest];

  // Add any protected columns that were somehow absent from order.
  for (const col of PROTECTED_COLUMNS) {
    if (!order.includes(col)) {
      order = [col, ...order];
    }
  }

  return { ...prefs, columns: { ...prefs.columns, visible, order } };
}

export function loadPreferences(): UserPreferences {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) return { ...defaultPreferences };
    const loaded: UserPreferences = { ...defaultPreferences, ...JSON.parse(raw) };
    return enforceProtectedColumns(loaded);
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
