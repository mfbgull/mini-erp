import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pencil } from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import { useKeyboardShortcut } from '../hooks/useKeyboardShortcut';
import { useTranslation } from '../hooks/useTranslation';
import { useDashboardLayout } from '../hooks/useDashboardLayout';
import { DashboardLayout } from '../components/dashboard/DashboardLayout';
import { DashboardCustomizationBar } from '../components/dashboard/DashboardCustomizationBar';
import { DashboardBlockPalette } from '../components/dashboard/DashboardBlockPalette';
import './Dashboard.css';

export default function Dashboard() {
  const { user } = useAuth();

  const { t } = useTranslation();
  const navigate = useNavigate();

  // ═══════════════════════════════════════════════════════════════════
  //  DASHBOARD CUSTOMIZATION HOOK
  // ═══════════════════════════════════════════════════════════════════

  const {
    blocks,
    layoutName,
    isEditing,
    saveState,
    isLoading: layoutLoading,
    undoStack,
    redoStack,
    setEditing,
    addBlock,
    removeBlock,
    moveBlock,
    resizeBlock,
    updateBlockConfig,
    updateBlockTitle,
    undo,
    redo,
    saveNow,
    renameLayout,
    resetToDefault,
    cancelBlockSettings,
    maxBlocksReached,
  } = useDashboardLayout();

  const [isPaletteOpen, setIsPaletteOpen] = useState(false);

  const handleTogglePalette = useCallback(() => {
    setIsPaletteOpen((prev) => !prev);
  }, []);

  const handleAddBlock = useCallback(
    (blockType: string) => {
      addBlock(blockType);
      setIsPaletteOpen(false);
    },
    [addBlock],
  );

  // Keyboard shortcuts for edit mode
  useEffect(() => {
    if (!isEditing) return;

    function handleKeyDown(e: KeyboardEvent) {
      // Ctrl+Z / Cmd+Z → Undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      // Ctrl+Shift+Z / Cmd+Shift+Z → Redo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        redo();
      }
      // Escape → Exit edit mode
      if (e.key === 'Escape') {
        setEditing(false);
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isEditing, undo, redo, setEditing]);

  // Existing keyboard shortcuts
  useKeyboardShortcut('Alt+N', () => {
    navigate('/inventory/items?action=create');
  }, { context: 'dashboard', id: 'dashboard-quick-add', label: 'New item' });

  useKeyboardShortcut('Alt+R', () => {
    window.location.reload();
  }, { context: 'dashboard', id: 'dashboard-refresh', label: 'Refresh' });

  const isLoading = layoutLoading;

  if (isLoading) {
    return (
      <div className="dashboard">
        <div className="dashboard-loading">
          <div className="loading-spinner" />
          <p>{t('messages.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`dashboard ${isEditing ? 'dashboard--editing' : ''}`}>
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1>{t('dashboard.welcome')}, {user?.username || t('common.user')}</h1>
          <p className="dashboard-subtitle">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' } as Intl.DateTimeFormatOptions)}
          </p>
        </div>
        {!isEditing && (
          <button
            className="dashboard-customize-btn"
            onClick={() => setEditing(true)}
            title={t('dashboardCustomization.customize')}
          >
            <Pencil size={16} />
            <span>{t('dashboardCustomization.customize')}</span>
          </button>
        )}
      </div>

      {/* Edit Mode */}
      {isEditing ? (
        <div className="dashboard-edit-mode">
          {/* Customization Toolbar */}
          <DashboardCustomizationBar
            layoutName={layoutName}
            saveState={saveState}
            canUndo={undoStack.length > 0}
            canRedo={redoStack.length > 0}
            isPaletteOpen={isPaletteOpen}
            onUndo={undo}
            onRedo={redo}
            onSave={saveNow}
            onTogglePalette={handleTogglePalette}
            onDone={() => setEditing(false)}
            onRenameLayout={renameLayout}
            onReset={resetToDefault}
          />

          {/* Draggable Grid */}
          <DashboardLayout
            blocks={blocks}
            isEditing={isEditing}
            onMoveBlock={moveBlock}
            onRemoveBlock={removeBlock}
            onUpdateBlockConfig={updateBlockConfig}
            onUpdateBlockTitle={updateBlockTitle}
            onResizeBlock={resizeBlock}
            onCancelSettings={cancelBlockSettings}
          />

          {/* Block Palette */}
          <DashboardBlockPalette
            isOpen={isPaletteOpen}
            onAddBlock={handleAddBlock}
            onClose={() => setIsPaletteOpen(false)}
            maxReached={maxBlocksReached}
          />

          {/* Drag hint */}
          <div className="dashboard-edit-hint">
            <span>{t('dashboardCustomization.dragHint')}</span>
            <span className="dashboard-edit-hint-shortcut">
              {t('dashboardCustomization.editShortcuts')}
            </span>
          </div>
        </div>
      ) : (
        /* ════════════════════════════════════════════════════════
           BLOCK VIEW (read-only, uses saved layout)
           ════════════════════════════════════════════════════════ */
        <DashboardLayout
          blocks={blocks}
          isEditing={false}
          onMoveBlock={moveBlock}
          onRemoveBlock={removeBlock}
          onUpdateBlockConfig={updateBlockConfig}
          onUpdateBlockTitle={updateBlockTitle}
          onResizeBlock={resizeBlock}
        />
      )}
    </div>
  );
}
