import type { FilterCriteria } from '../types';

export function filtersToParams(filters: FilterCriteria[]): URLSearchParams {
  const params = new URLSearchParams();
  filters.forEach((f, i) => {
    params.set(`f${i}_col`, f.column);
    params.set(`f${i}_type`, f.type);
    params.set(`f${i}_label`, f.label);
    if (Array.isArray(f.value)) {
      params.set(`f${i}_val`, JSON.stringify(f.value));
    } else {
      params.set(`f${i}_val`, String(f.value));
    }
  });
  if (filters.length > 0) {
    params.set('fc', String(filters.length));
  }
  return params;
}

export function paramsToFilters(params: URLSearchParams): FilterCriteria[] {
  const count = Number(params.get('fc') || '0');
  if (count === 0) return [];

  const filters: FilterCriteria[] = [];
  for (let i = 0; i < count; i++) {
    const column = params.get(`f${i}_col`);
    const type = params.get(`f${i}_type`) as FilterCriteria['type'] | null;
    const label = params.get(`f${i}_label`);
    const rawVal = params.get(`f${i}_val`);
    if (!column || !type || !rawVal) continue;

    let value: FilterCriteria['value'];
    if (type === 'dropdown' || type === 'numeric' || type === 'dateRange') {
      try {
        value = JSON.parse(rawVal);
      } catch {
        value = rawVal;
      }
    } else {
      value = rawVal;
    }

    filters.push({
      id: `${column}-${Date.now()}-${i}`,
      column,
      type,
      value,
      label: label || `${column}: ${rawVal}`,
    });
  }
  return filters;
}

export function buildUrl(searchQuery: string, filters: FilterCriteria[]): string {
  const params = filtersToParams(filters);
  if (searchQuery) {
    params.set('search', searchQuery);
  }
  const qs = params.toString();
  return qs ? `?${qs}` : window.location.pathname;
}

export function readUrlState(): { searchQuery: string; filters: FilterCriteria[] } | null {
  const params = new URLSearchParams(window.location.search);
  if (params.toString() === '') return null;

  const searchQuery = params.get('search') || '';
  const filters = paramsToFilters(params);

  if (!searchQuery && filters.length === 0) return null;

  return { searchQuery, filters };
}
