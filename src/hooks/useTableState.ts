import { useState, useCallback, useEffect, useMemo } from 'react';
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

export function useTableState() {
  const [preferences, setPreferences] = useState<UserPreferences>(loadPreferences);
  const [filters, setFilters] = useState<FilterCriteria[]>(loadActiveFilters);
  const [searchQuery, setSearchQuery] = useState(loadSearchQuery);
  const [isLoading, setIsLoading] = useState(true);

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

  return {
    ...processedData,
    isLoading,
    error,
    searchQuery,
    filters,
    preferences,
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
  };
}
