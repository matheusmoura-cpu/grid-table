import type { FC } from 'react';

/**
 * Defines where an action is surfaced in the UI.
 *  'row'  — only in the per-row kebab menu (single-item actions)
 *  'bulk' — only in the bulk action toolbar (multi-item actions)
 *  'both' — available in both surfaces
 */
export type ActionScope = 'row' | 'bulk' | 'both';

export type ActionVariant = 'default' | 'danger';

export interface TableAction {
  id: string;
  label: string;
  /** Lucide icon component */
  icon: FC<{ className?: string }>;
  scope: ActionScope;
  variant?: ActionVariant;
  /** Accessible description used in aria-labels */
  description?: string;
}

/**
 * Single unified callback for all actions.
 * actionId: the TableAction.id
 * ids: the affected row record ids
 */
export type ActionDispatch = (actionId: string, ids: number[]) => void;
