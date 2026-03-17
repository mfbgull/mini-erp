import { GridApi } from 'ag-grid-community';

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
