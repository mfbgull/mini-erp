/**
 * AG-Grid module registration and CSS imports.
 * Import this from any page/component that uses AG-Grid.
 * Must be called before rendering the grid.
 */
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';

ModuleRegistry.registerModules([AllCommunityModule]);
