/**
 * Shared props interface for all dashboard block components.
 *
 * Each block receives these props from the DashboardBlock wrapper.
 * Blocks use TanStack Query internally for data fetching, scoped by blockId.
 */

export interface DashboardBlockComponentProps {
  /** Unique block instance ID (UUID) */
  blockId: string;
  /** Block type key matching the registry (e.g. 'stat_cards') */
  blockType: string;
  /** API endpoint to fetch data (null for static blocks like quick_actions, custom_text) */
  apiEndpoint: string | null;
  /** Block-specific configuration from the saved layout */
  config: Record<string, unknown>;
  /** Whether the dashboard is in edit mode */
  isEditing: boolean;
  /** Called when the user modifies block-level config (title, refreshInterval, etc.) */
  onConfigChange: (config: Record<string, unknown>) => void;
}
