/**
 * DashboardBlock — Individual block wrapper component.
 *
 * Renders inside the 3-column grid. In edit mode, displays drag handle,
 * settings button, delete button, and resize handle.
 * Uses React.memo with a custom comparator to only re-render when
 * position, size, or visibility changes.
 *
 * @see dashboard-customization-spec.md §6 — Frontend Architecture
 */

import { memo, Suspense, useState, useCallback, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { GripVertical, Settings, X, Move } from 'lucide-react';
import { ROW_HEIGHT } from './dashboardConstants';
import { getBlockEntry } from '../../utils/dashboardBlockRegistry';
import type { DashboardBlock as DashboardBlockType } from '../../hooks/useDashboardLayout';
import type { DashboardBlockComponentProps } from './blocks/BlockComponentProps';
import './DashboardBlock.css';

// ═══════════════════════════════════════════════════════════════
//  RESIZE HANDLE
// ═══════════════════════════════════════════════════════════════

interface ResizeHandleProps {
  onResize: (width: number, height: number) => void;
  currentWidth: number;
  currentHeight: number;
  minWidth: number;
  minHeight: number;
  maxWidth: number;
  maxHeight: number;
  allowedWidths: number[];
  allowedHeights: number[];
}

function ResizeHandle({
  onResize,
  currentWidth,
  currentHeight,
  minWidth,
  minHeight,
  maxWidth,
  maxHeight,
  allowedWidths,
  allowedHeights,
}: ResizeHandleProps) {
  const isResizing = useRef(false);
  const startPos = useRef({ x: 0, y: 0 });
  const startSize = useRef({ width: currentWidth, height: currentHeight });

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      isResizing.current = true;
      startPos.current = { x: e.clientX, y: e.clientY };
      startSize.current = { width: currentWidth, height: currentHeight };

      const handleMouseMove = (ev: MouseEvent) => {
        if (!isResizing.current) return;
        // Figure out nearest snap point based on delta
        const dx = ev.clientX - startPos.current.x;
        const dy = ev.clientY - startPos.current.y;

        // Estimate delta in grid units (rough: use 200px per cell as approximation)
        const dCol = Math.round(dx / 200);
        const dRow = Math.round(dy / ROW_HEIGHT);

        let newW = Math.min(maxWidth, Math.max(minWidth, startSize.current.width + dCol));
        let newH = Math.min(maxHeight, Math.max(minHeight, startSize.current.height + dRow));

        // Snap to allowed widths/heights
        newW = allowedWidths.reduce((prev, curr) =>
          Math.abs(curr - newW) < Math.abs(prev - newW) ? curr : prev,
        );
        newH = allowedHeights.reduce((prev, curr) =>
          Math.abs(curr - newH) < Math.abs(prev - newH) ? curr : prev,
        );

        // Visually update while dragging
        if (newW !== currentWidth || newH !== currentHeight) {
          onResize(newW, newH);
        }
      };

      const handleMouseUp = () => {
        isResizing.current = false;
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    [currentWidth, currentHeight, minWidth, minHeight, maxWidth, maxHeight, allowedWidths, allowedHeights, onResize],
  );

  return (
    <div className="dashboard-block-resize-handle" onMouseDown={handleMouseDown} title="Drag to resize">
      <Move size={12} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  BLOCK WRAPPER
// ═══════════════════════════════════════════════════════════════

interface DashboardBlockWrapperProps {
  block: DashboardBlockType;
  isEditing: boolean;
  onRemove: (blockId: string) => void;
  onConfigChange: (blockId: string, config: Record<string, unknown>) => void;
  onTitleChange: (blockId: string, title: string) => void;
  onResize: (blockId: string, width: number, height: number) => void;
  onCancelSettings?: (blockId: string, originalTitle: string, originalConfig: Record<string, unknown>, originalWidth: number, originalHeight: number) => void;
}

function DashboardBlockWrapper({
  block,
  isEditing,
  onRemove,
  onConfigChange,
  onTitleChange,
  onResize,
  onCancelSettings,
}: DashboardBlockWrapperProps) {
  const entry = getBlockEntry(block.type);
  const BlockComponent = entry.component;
  const [showSettings, setShowSettings] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);
  const [settingsPosition, setSettingsPosition] = useState<'left' | 'right'>('right');

  // Snapshot initial values when settings opens, for Cancel revert
  const initialSettingsRef = useRef<{ title: string; config: Record<string, unknown>; width: number; height: number }>({
    title: '',
    config: {},
    width: 0,
    height: 0,
  });

  const handleOpenSettings = useCallback(() => {
    initialSettingsRef.current = {
      title: block.title,
      config: { ...block.config },
      width: block.width,
      height: block.height,
    };
    setShowSettings(true);
  }, [block.title, block.config, block.width, block.height]);

  const handleCancelSettings = useCallback(() => {
    const init = initialSettingsRef.current;
    // Use batch cancel handler if available (reverts without marking dirty)
    if (onCancelSettings) {
      onCancelSettings(block.id, init.title, init.config, init.width, init.height);
    } else {
      // Fallback: revert individually (marks layout dirty per mutation)
      if (init.title !== block.title) {
        onTitleChange(block.id, init.title);
      }
      if (JSON.stringify(init.config) !== JSON.stringify(block.config)) {
        onConfigChange(block.id, init.config);
      }
      if (init.width !== block.width || init.height !== block.height) {
        onResize(block.id, init.width, init.height);
      }
    }
    setShowSettings(false);
  }, [block.id, block.title, block.config, block.width, block.height, onTitleChange, onConfigChange, onResize, onCancelSettings]);

  // Close settings popover on click outside
  useEffect(() => {
    if (!showSettings) return;
    function handleClick(e: MouseEvent) {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setShowSettings(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showSettings]);

  const handleConfigChange = useCallback(
    (config: Record<string, unknown>) => {
      onConfigChange(block.id, config);
    },
    [block.id, onConfigChange],
  );

  const handleDeleteConfirm = useCallback(() => {
    setShowDeleteConfirm(true);
  }, []);

  const handleDelete = useCallback(() => {
    onRemove(block.id);
    setShowDeleteConfirm(false);
  }, [block.id, onRemove]);

  const handleDeleteCancel = useCallback(() => {
    setShowDeleteConfirm(false);
  }, []);

  const isDeprecated = block.type === 'deprecated_block';

  return (
    <div
      className={`dashboard-block ${isEditing ? 'dashboard-block--editing' : ''} ${isDeprecated ? 'dashboard-block--deprecated' : ''}`}
      style={{ contain: 'layout' }}
    >
      {/* Edit Mode Controls */}
      {isEditing && !isDeprecated && (
        <>
          <div className="dashboard-block-drag-handle" title="Drag to move">
            <GripVertical size={14} />
          </div>

          <div className="dashboard-block-actions">
            <button
              className="dashboard-block-action-btn"
              onClick={(e) => {
                e.stopPropagation();
                if (showSettings) {
                  setShowSettings(false);
                } else {
                  handleOpenSettings();
                }
              }}
              title="Settings"
            >
              <Settings size={14} />
            </button>
            <button
              className="dashboard-block-action-btn dashboard-block-action-btn--delete"
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteConfirm();
              }}
              title="Remove block"
            >
              <X size={14} />
            </button>
          </div>

          <ResizeHandle
            onResize={(w, h) => onResize(block.id, w, h)}
            currentWidth={block.width}
            currentHeight={block.height}
            minWidth={entry.minSize.width}
            minHeight={entry.minSize.height}
            maxWidth={entry.maxSize.width}
            maxHeight={entry.maxSize.height}
            allowedWidths={entry.allowedWidths}
            allowedHeights={entry.allowedHeights}
          />

          {/* Settings Popover */}
          {showSettings && (
            <div ref={settingsRef} className="dashboard-block-settings-popover">
              <div className="dashboard-block-settings-header">Block Settings</div>
              <div className="dashboard-block-settings-body">
                <label className="dashboard-block-settings-label">
                  Title
                  <input
                    type="text"
                    className="dashboard-block-settings-input"
                    value={block.title}
                    onChange={(e) => onTitleChange(block.id, e.target.value)}
                    placeholder="Block title"
                    onClick={(e) => e.stopPropagation()}
                  />
                </label>

                <label className="dashboard-block-settings-label">
                  Refresh Interval
                  <select
                    className="dashboard-block-settings-select"
                    value={String(block.config.refreshInterval || 0)}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      handleConfigChange({ refreshInterval: val });
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <option value="0">None</option>
                    <option value="30">Every 30s</option>
                    <option value="60">Every 60s</option>
                    <option value="300">Every 5 min</option>
                    <option value="900">Every 15 min</option>
                  </select>
                </label>

                <label className="dashboard-block-settings-label">
                  Size
                  <div className="dashboard-block-settings-sizes">
                    {entry.allowedWidths.map((w) =>
                      entry.allowedHeights.map((h) => (
                        <button
                          key={`${w}x${h}`}
                          className={`dashboard-block-settings-size-btn ${block.width === w && block.height === h ? 'active' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            onResize(block.id, w, h);
                          }}
                        >
                          {w}×{h}
                        </button>
                      )),
                    )}
                  </div>
                </label>
              </div>
              <div className="dashboard-block-settings-footer">
                <button
                  className="dashboard-block-settings-cancel-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCancelSettings();
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Delete Confirmation — portaled outside draggable tree to avoid @dnd-kit interception */}
      {showDeleteConfirm && createPortal(
        <div className="dashboard-block-delete-overlay">
          <div className="dashboard-block-delete-dialog">
            <p>Remove "{block.title || 'this block'}"?</p>
            <div className="dashboard-block-delete-actions">
              <button onClick={handleDeleteCancel} className="dashboard-block-delete-cancel">Cancel</button>
              <button onClick={handleDelete} className="dashboard-block-delete-confirm">Remove</button>
            </div>
          </div>
        </div>,
        document.body,
      )}

      {/* Block Content */}
      <div className="dashboard-block-content">
        {isDeprecated ? (
          <DeprecatedBlockInner block={block} onRemove={onRemove} />
        ) : BlockComponent ? (
          <Suspense
            fallback={
              <div className="dashboard-block-shimmer" style={{ height: '100%', borderRadius: 8 }} />
            }
          >
            <BlockComponent
              blockId={block.id}
              blockType={block.type}
              apiEndpoint={entry.apiEndpoint}
              config={block.config}
              isEditing={isEditing}
              onConfigChange={handleConfigChange}
            />
          </Suspense>
        ) : (
          <div className="dashboard-block-error">
            <p>Unknown block type: {block.type}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  DEPRECATED BLOCK INNER
// ═══════════════════════════════════════════════════════════════

function DeprecatedBlockInner({
  block,
  onRemove,
}: {
  block: DashboardBlockType;
  onRemove: (id: string) => void;
}) {
  return (
    <div className="dashboard-block-deprecated">
      <p>This block type ({block.type}) is no longer available.</p>
      <button onClick={() => onRemove(block.id)} className="dashboard-block-retry-btn">
        Remove
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  CUSTOM COMPARATOR (React.memo)
// ═══════════════════════════════════════════════════════════════

function arePropsEqual(
  prev: DashboardBlockWrapperProps,
  next: DashboardBlockWrapperProps,
): boolean {
  if (prev.isEditing !== next.isEditing) return false;
  const a = prev.block;
  const b = next.block;
  return (
    a.id === b.id &&
    a.type === b.type &&
    a.x === b.x &&
    a.y === b.y &&
    a.width === b.width &&
    a.height === b.height &&
    a.visible === b.visible &&
    a.title === b.title &&
    JSON.stringify(a.config) === JSON.stringify(b.config)
  );
}

export const DashboardBlock = memo(DashboardBlockWrapper, arePropsEqual);
export default DashboardBlock;
