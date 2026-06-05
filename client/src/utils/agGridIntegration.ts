/**
 * AG-Grid integration utilities.
 * Imports and registers AG-Grid modules and CSS.
 */
import { GridApi } from 'ag-grid-community';
import './registerAgGrid';

export function isAGGridEditing(api: GridApi | null): boolean {
  if (!api) return false;
  return api.getEditingCells().length > 0;
}

export function isAGGridCellFocused(api: GridApi | null): boolean {
  if (!api) return false;
  const focusedCell = api.getFocusedCell();
  return focusedCell !== null;
}

export function shouldIgnoreForAGGrid(api: GridApi | null): boolean {
  if (!api) return false;
  return isAGGridEditing(api) || isAGGridCellFocused(api);
}
