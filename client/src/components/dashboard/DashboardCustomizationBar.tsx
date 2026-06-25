/**
 * DashboardCustomizationBar — Toolbar shown when the dashboard is in edit mode.
 *
 * Contains:
 * - Layout name (inline-editable)
 * - Undo / Redo buttons
 * - Save button (with state indicators)
 * - Block palette toggle button
 * - Done button (exits edit mode)
 *
 * @see dashboard-customization-spec.md §3 — Edit Mode
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { Undo2, Redo2, Save, LayoutPanelTop, Check, Loader2, AlertCircle, Pencil, RotateCcw, AlertTriangle } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';
import type { SaveState } from '../../hooks/useDashboardLayout';
import './DashboardCustomizationBar.css';

// ═══════════════════════════════════════════════════════════════
//  TYPES
// ═══════════════════════════════════════════════════════════════

interface DashboardCustomizationBarProps {
  /** Current layout name */
  layoutName: string;
  /** Current save state (saved / unsaved / saving / saveFailed) */
  saveState: SaveState;
  /** Whether there are actions to undo */
  canUndo: boolean;
  /** Whether there are actions to redo */
  canRedo: boolean;
  /** Whether block palette is currently open */
  isPaletteOpen: boolean;
  /** Called when the user clicks Undo */
  onUndo: () => void;
  /** Called when the user clicks Redo */
  onRedo: () => void;
  /** Called when the user clicks Save */
  onSave: () => void;
  /** Called when the user clicks the palette toggle */
  onTogglePalette: () => void;
  /** Called when the user clicks Done (exit edit mode) */
  onDone: () => void;
  /** Called when the layout name is edited */
  onRenameLayout: (name: string) => void;
  /** Called when the user confirms reset to default */
  onReset: () => void;
}

// ═══════════════════════════════════════════════════════════════
//  SAVE STATE BADGE
// ═══════════════════════════════════════════════════════════════

function SaveStateBadge({ state }: { state: SaveState }) {
  const { t } = useTranslation();

  if (state === 'saved') return null; // Don't show badge when saved

  const config: Record<SaveState, { icon: typeof Loader2; label: string; className: string }> = {
    unsaved: {
      icon: Pencil,
      label: t('dashboardCustomization.unsaved'),
      className: 'dash-custom-bar-badge--unsaved',
    },
    saving: {
      icon: Loader2,
      label: t('dashboardCustomization.saving'),
      className: 'dash-custom-bar-badge--saving',
    },
    saveFailed: {
      icon: AlertCircle,
      label: t('dashboardCustomization.saveFailed'),
      className: 'dash-custom-bar-badge--failed',
    },
    saved: {
      icon: Check,
      label: t('dashboardCustomization.saved'),
      className: 'dash-custom-bar-badge--saved',
    },
  };

  const { icon: Icon, label, className } = config[state];
  const isSaving = state === 'saving';

  return (
    <span className={`dash-custom-bar-badge ${className}`}>
      <Icon size={14} className={isSaving ? 'dash-custom-bar-spin' : ''} />
      {label}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════
//  LAYOUT NAME EDITOR
// ═══════════════════════════════════════════════════════════════

function LayoutNameEditor({
  name,
  onRename,
}: {
  name: string;
  onRename: (name: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync draft when name changes externally
  useEffect(() => {
    setDraft(name);
  }, [name]);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const handleSave = useCallback(() => {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== name) {
      onRename(trimmed);
    } else {
      setDraft(name);
    }
    setEditing(false);
  }, [draft, name, onRename]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') handleSave();
      if (e.key === 'Escape') {
        setDraft(name);
        setEditing(false);
      }
    },
    [handleSave, name],
  );

  if (editing) {
    return (
      <input
        ref={inputRef}
        className="dash-custom-bar-name-input"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        maxLength={64}
      />
    );
  }

  return (
    <button
      className="dash-custom-bar-name-btn"
      onClick={() => setEditing(true)}
      title="Rename layout"
    >
      <Pencil size={12} />
      <span>{name}</span>
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

export function DashboardCustomizationBar({
  layoutName,
  saveState,
  canUndo,
  canRedo,
  isPaletteOpen,
  onUndo,
  onRedo,
  onSave,
  onTogglePalette,
  onDone,
  onRenameLayout,
  onReset,
}: DashboardCustomizationBarProps) {
  const { t } = useTranslation();
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  return (
    <div className="dash-custom-bar">
      {/* Reset confirmation dialog */}
      {showResetConfirm && (
        <div className="dash-custom-bar-overlay" onClick={() => setShowResetConfirm(false)}>
          <div className="dash-custom-bar-confirm" onClick={(e) => e.stopPropagation()}>
            <div className="dash-custom-bar-confirm-icon">
              <AlertTriangle size={24} />
            </div>
            <h3 className="dash-custom-bar-confirm-title">{t('dashboardCustomization.revertConfirmTitle')}</h3>
            <p className="dash-custom-bar-confirm-msg">{t('dashboardCustomization.revertConfirmMsg')}</p>
            <div className="dash-custom-bar-confirm-actions">
              <button
                className="dash-custom-bar-btn"
                onClick={() => setShowResetConfirm(false)}
              >
                {t('actions.cancel')}
              </button>
              <button
                className="dash-custom-bar-btn dash-custom-bar-btn--danger"
                onClick={() => {
                  setShowResetConfirm(false);
                  onReset();
                }}
              >
                {t('dashboardCustomization.revert')}
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="dash-custom-bar-left">
        {/* Layout Name */}
        <LayoutNameEditor name={layoutName} onRename={onRenameLayout} />

        {/* Undo / Redo */}
        <div className="dash-custom-bar-group">
          <button
            className="dash-custom-bar-btn"
            onClick={onUndo}
            disabled={!canUndo}
            title={t('dashboardCustomization.undo')}
          >
            <Undo2 size={16} />
          </button>
          <button
            className="dash-custom-bar-btn"
            onClick={onRedo}
            disabled={!canRedo}
            title={t('dashboardCustomization.redo')}
          >
            <Redo2 size={16} />
          </button>
        </div>

        {/* Save */}
        <button
          className="dash-custom-bar-btn dash-custom-bar-btn--save"
          onClick={onSave}
          disabled={saveState === 'saving' || saveState === 'saved'}
          title={t('dashboardCustomization.save')}
        >
          <Save size={16} />
          <span className="dash-custom-bar-btn-label">{t('dashboardCustomization.save')}</span>
        </button>

        {/* Save state badge */}
        <SaveStateBadge state={saveState} />
      </div>

      <div className="dash-custom-bar-right">
        {/* Reset to Default */}
        <button
          className="dash-custom-bar-btn dash-custom-bar-btn--revert"
          onClick={() => setShowResetConfirm(true)}
          title={t('dashboardCustomization.revert')}
        >
          <RotateCcw size={16} />
          <span className="dash-custom-bar-btn-label">{t('dashboardCustomization.revert')}</span>
        </button>

        {/* Block Palette Toggle */}
        <button
          className={`dash-custom-bar-btn dash-custom-bar-btn--palette ${isPaletteOpen ? 'dash-custom-bar-btn--active' : ''}`}
          onClick={onTogglePalette}
          title={t('dashboardCustomization.blockPalette')}
        >
          <LayoutPanelTop size={16} />
          <span className="dash-custom-bar-btn-label">{t('dashboardCustomization.blockPalette')}</span>
        </button>

        {/* Done */}
        <button
          className="dash-custom-bar-btn dash-custom-bar-btn--done"
          onClick={onDone}
          title={t('dashboardCustomization.done')}
        >
          <Check size={16} />
          <span className="dash-custom-bar-btn-label">{t('dashboardCustomization.done')}</span>
        </button>
      </div>
    </div>
  );
}

export default DashboardCustomizationBar;
