export interface MachineRecord {
  id: number;
  site: string;
  sellTo: string;
  uniqueMachineNumber: string;
  machineReference: string;
  propositionType: string;
  machineType: string;
  modelCode: string;
  commissioningState: string;
  connectivityStatus: string;
  latestCommsDateTime: string;
  latestSaleDateTime: string;
  activeAlarms: number;
  workingState: string;
  targetWorkingState: string;
  suspendReason: string;
  customerName: string;
  billTo: string;
  sitePostalCode: string;
  siteCountry: string;
}

export type ViewMode = 'detailed' | 'compact' | 'card';

export interface FilterCriteria {
  id: string;
  column: string;
  type: 'text' | 'dropdown' | 'dateRange' | 'numeric';
  value: string | string[] | [string, string] | [number, number];
  label: string;
}

export interface SavedFilterSet {
  id: string;
  name: string;
  filters: FilterCriteria[];
  searchQuery: string;
}

export interface ColumnPreferences {
  visible: string[];
  order: string[];
  widths: Record<string, number>;
}

export interface UserPreferences {
  viewMode: ViewMode;
  columns: ColumnPreferences;
  pageSize: number;
  savedFilterSets: SavedFilterSet[];
}
