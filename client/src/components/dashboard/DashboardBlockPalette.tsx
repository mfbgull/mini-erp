/**
 * DashboardBlockPalette — Slide-out sidebar listing all available block types
 * that can be added to the dashboard.
 *
 * Each item shows:
 * - Lucide icon
 * - Block name (from i18n)
 * - Short description (from i18n)
 * - Default size indicator
 *
 * Clicking an item calls `onAddBlock` with the block type key.
 *
 * @see dashboard-customization-spec.md §3 — Edit Mode
 * @see dashboard-customization-spec.md §6 — Frontend Architecture
 */

import { useMemo, useCallback, useEffect, useRef } from 'react';
import { Plus, Grid3X3 } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';
import { getPaletteBlocks, type BlockRegistryEntry } from '../../utils/dashboardBlockRegistry';
import type { DashboardBlockType } from '../../utils/dashboardBlockRegistry';
import './DashboardBlockPalette.css';

// ═══════════════════════════════════════════════════════════════
//  TYPES
// ═══════════════════════════════════════════════════════════════

interface DashboardBlockPaletteProps {
  /** Whether the palette is open */
  isOpen: boolean;
  /** Called when the user clicks a block to add it */
  onAddBlock: (blockType: DashboardBlockType | string) => void;
  /** Called to close the palette */
  onClose: () => void;
  /** Whether the max number of blocks has been reached */
  maxReached: boolean;
}

// ═══════════════════════════════════════════════════════════════
//  PALETTE ITEM
// ═══════════════════════════════════════════════════════════════

function PaletteItem({
  entry,
  onClick,
  disabled,
}: {
  entry: BlockRegistryEntry;
  onClick: () => void;
  disabled: boolean;
}) {
  const { t } = useTranslation();
  const Icon = entry.icon;

  const sizeLabel = `${entry.defaultSize.width}×${entry.defaultSize.height}`;

  return (
    <button
      className="dash-palette-item"
      onClick={onClick}
      disabled={disabled}
      title={`${t(entry.labelKey)} (${sizeLabel})`}
    >
      <div className="dash-palette-item-icon">
        <Icon size={20} strokeWidth={1.5} />
      </div>
      <div className="dash-palette-item-body">
        <span className="dash-palette-item-name">{t(entry.labelKey)}</span>
        <span className="dash-palette-item-desc">{t(entry.descriptionKey)}</span>
      </div>
      <div className="dash-palette-item-size">{sizeLabel}</div>
      <div className="dash-palette-item-action">
        <Plus size={16} />
      </div>
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

export function DashboardBlockPalette({
  isOpen,
  onAddBlock,
  onClose,
  maxReached,
}: DashboardBlockPaletteProps) {
  const { t } = useTranslation();
  const panelRef = useRef<HTMLDivElement>(null);

  // Compute palette blocks — all blocks are shown (permission filtering
  // can be added when the User type includes a permissions array)
  const hasPermission = useCallback(
    () => true,
    [],
  );

  const paletteBlocks = useMemo(() => getPaletteBlocks(hasPermission), [hasPermission]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    // Delay adding the listener to avoid the click that opened the palette
    const timer = setTimeout(() => document.addEventListener('mousedown', handleClick), 100);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClick);
    };
  }, [isOpen, onClose]);

  return (
    <>
      {/* Backdrop */}
      {isOpen && <div className="dash-palette-backdrop" onClick={onClose} />}

      {/* Panel */}
      <div
        ref={panelRef}
        className={`dash-palette ${isOpen ? 'dash-palette--open' : ''}`}
        role="dialog"
        aria-label={t('dashboardCustomization.blockPalette')}
      >
        {/* Header */}
        <div className="dash-palette-header">
          <div className="dash-palette-header-left">
            <Grid3X3 size={18} strokeWidth={1.5} />
            <span>{t('dashboardCustomization.blockPalette')}</span>
          </div>
          <span className="dash-palette-count">{paletteBlocks.length}</span>
        </div>

        {/* Max reached notice */}
        {maxReached && (
          <div className="dash-palette-notice">
            {t('messages.maxItemsAlert') || 'Maximum 20 blocks reached'}
          </div>
        )}

        {/* Block List */}
        <div className="dash-palette-list">
          {paletteBlocks.map((entry) => (
            <PaletteItem
              key={entry.type}
              entry={entry}
              onClick={() => onAddBlock(entry.type)}
              disabled={maxReached}
            />
          ))}
        </div>
      </div>
    </>
  );
}

export default DashboardBlockPalette;
