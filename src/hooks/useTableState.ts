import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import type { FilterCriteria, UserPreferences, ViewMode, SavedFilterSet } from '../types';
import { machineData } from '../data/machines';
import { fuzzySearch, resetFuseInstance } from '../utils/search';
import { applyFilters } from '../utils/filter';
import {
  loadPreferences, savePreferences,
  loadActiveFilters, saveActiveFilters,
  loadSearchQuery, saveSearchQuery,
  saveSavedFilterSet, deleteSavedFilterSet,
} from '../utils/storage';
import { buildUrl, readUrlState } from '../utils/urlState';

function initSearchQuery(): string {
  const urlState = readUrlState();
  return urlState?.searchQuery ?? loadSearchQuery();
}

function initFilters(): FilterCriteria[] {
  const urlState = readUrlState();
  return urlState?.filters ?? loadActiveFilters();
}

export function useTableState() {
  const [preferences, setPreferences] = useState<UserPreferences>(loadPreferences);
  const [filters, setFilters] = useState<FilterCriteria[]>(initFilters);
  const [searchQuery, setSearchQuery] = useState(initSearchQuery);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [currentPage, setCurrentPage] = useState<string | null>(null);

  const isPopstateRef = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    saveActiveFilters(filters);
  }, [filters]);

  useEffect(() => {
    saveSearchQuery(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    savePreferences(preferences);
  }, [preferences]);

  // Sync state -> URL (push)
  useEffect(() => {
    if (isPopstateRef.current) {
      isPopstateRef.current = false;
      return;
    }
    const url = buildUrl(searchQuery, filters);
    const currentUrl = window.location.pathname + window.location.search;
    if (url !== currentUrl) {
      window.history.pushState({ searchQuery, filters }, '', url);
    }
  }, [searchQuery, filters]);

  // Handle browser back/forward
  useEffect(() => {
    function handlePopstate(event: PopStateEvent) {
      isPopstateRef.current = true;
      if (event.state) {
        setSearchQuery(event.state.searchQuery ?? '');
        setFilters(event.state.filters ?? []);
      } else {
        const urlState = readUrlState();
        setSearchQuery(urlState?.searchQuery ?? '');
        setFilters(urlState?.filters ?? []);
      }
    }
    window.addEventListener('popstate', handlePopstate);
    return () => window.removeEventListener('popstate', handlePopstate);
  }, []);

  const processedData = useMemo(() => {
    try {
      resetFuseInstance();
      const filtered = applyFilters(machineData, filters);
      const { results, matches } = fuzzySearch(filtered, searchQuery);
      return { data: results, matches, totalCount: machineData.length, filteredCount: results.length, computeError: null as string | null };
    } catch (e) {
      return { data: [], matches: new Map(), totalCount: 0, filteredCount: 0, computeError: String(e) };
    }
  }, [filters, searchQuery]);

  const error = processedData.computeError;

  const addFilter = useCallback((filter: FilterCriteria) => {
    setFilters(prev => [...prev.filter(f => f.id !== filter.id), filter]);
  }, []);

  const removeFilter = useCallback((id: string) => {
    setFilters(prev => prev.filter(f => f.id !== id));
  }, []);

  const clearAllFilters = useCallback(() => {
    setFilters([]);
    setSearchQuery('');
  }, []);

  const updateSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const setViewMode = useCallback((mode: ViewMode) => {
    setPreferences(prev => ({ ...prev, viewMode: mode }));
  }, []);

  const toggleColumn = useCallback((key: string) => {
    setPreferences(prev => ({
      ...prev,
      columns: {
        ...prev.columns,
        visible: prev.columns.visible.includes(key)
          ? prev.columns.visible.filter(k => k !== key)
          : [...prev.columns.visible, key],
      },
    }));
  }, []);

  const reorderColumns = useCallback((newOrder: string[]) => {
    setPreferences(prev => ({
      ...prev,
      columns: { ...prev.columns, order: newOrder },
    }));
  }, []);

  const setColumnWidth = useCallback((key: string, width: number) => {
    setPreferences(prev => ({
      ...prev,
      columns: { ...prev.columns, widths: { ...prev.columns.widths, [key]: width } },
    }));
  }, []);

  const setPageSize = useCallback((size: number) => {
    setPreferences(prev => ({ ...prev, pageSize: size }));
  }, []);

  const saveFilterSet = useCallback((name: string) => {
    const set: SavedFilterSet = {
      id: crypto.randomUUID(),
      name,
      filters: [...filters],
      searchQuery,
    };
    setPreferences(prev => saveSavedFilterSet(set, prev));
  }, [filters, searchQuery]);

  const loadFilterSet = useCallback((set: SavedFilterSet) => {
    setFilters(set.filters);
    setSearchQuery(set.searchQuery);
  }, []);

  const removeFilterSet = useCallback((id: string) => {
    setPreferences(prev => deleteSavedFilterSet(id, prev));
  }, []);

  const toggleRowSelection = useCallback((id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const toggleAllSelection = useCallback((ids: number[]) => {
    setSelectedIds(prev => {
      const allSelected = ids.every(id => prev.has(id));
      if (allSelected) {
        const next = new Set(prev);
        ids.forEach(id => next.delete(id));
        return next;
      }
      return new Set([...prev, ...ids]);
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const navigateToSite = useCallback((machineId: number) => {
    setCurrentPage(`site-detail:${machineId}`);
  }, []);

  const navigateBack = useCallback(() => {
    setCurrentPage(null);
  }, []);

  return {
    ...processedData,
    allData: machineData,
    isLoading,
    error,
    searchQuery,
    filters,
    preferences,
    selectedIds,
    currentPage,
    addFilter,
    removeFilter,
    clearAllFilters,
    updateSearch,
    setViewMode,
    toggleColumn,
    reorderColumns,
    setColumnWidth,
    setPageSize,
    saveFilterSet,
    loadFilterSet,
    removeFilterSet,
    setFilters,
    toggleRowSelection,
    toggleAllSelection,
    clearSelection,
    navigateToSite,
    navigateBack,
  };
}
