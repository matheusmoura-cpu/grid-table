import { Pencil, ArrowRightLeft } from 'lucide-react';
import type { TableAction } from '../types/actions';

/**
 * Central registry of all table row actions.
 *
 * To add a new action in the future, append one entry here.
 * No changes to DataTable, RowActionsMenu, or BulkActionBar are needed —
 * they derive their rendered items from this list automatically.
 *
 * scope:
 *   'row'  — shown only in the per-row kebab menu
 *   'bulk' — shown only in the bulk action toolbar
 *   'both' — shown in both
 */
export const TABLE_ACTIONS: TableAction[] = [
  {
    id: 'edit',
    label: 'Edit',
    icon: Pencil,
    scope: 'row',
    description: 'Edit this machine record',
  },
  {
    id: 'move',
    label: 'Move',
    icon: ArrowRightLeft,
    scope: 'both',
    description: 'Move machine to a different site',
  },
];

/** Actions visible in the per-row kebab menu */
export const ROW_MENU_ACTIONS = TABLE_ACTIONS.filter(
  a => a.scope === 'row' || a.scope === 'both',
);

/** Actions visible in the bulk selection toolbar */
export const BULK_BAR_ACTIONS = TABLE_ACTIONS.filter(
  a => a.scope === 'bulk' || a.scope === 'both',
);
