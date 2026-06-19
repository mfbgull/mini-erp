/**
 * AG-Grid module registration.
 * Import this from any page/component that uses AG-Grid.
 * Must be called before rendering the grid.
 * 
 * Note: AG Grid v33+ uses the Theming API by default (themeQuartz).
 * No CSS file imports are needed — the old ag-grid.css / ag-theme-quartz.css
 * files should NOT be imported as they conflict with the Theming API.
 */
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';

ModuleRegistry.registerModules([AllCommunityModule]);

/**
 * Ensure AG-Grid modules are registered. Safe to call multiple times.
 * Side-effect call — modules register globally on first import.
 */
export function registerAgGrid(): void {
  // Modules are registered as a side effect of importing this module.
}
