/**
 * DashboardLayout — 3-column grid layout with drag-and-drop reordering.
 *
 * Renders the block grid using absolute positioning within a CSS Grid container.
 * In edit mode, wraps each block with drag handles via @dnd-kit.
 *
 * @see dashboard-customization-spec.md §2 — Layout System
 * @see dashboard-customization-spec.md §6 — Frontend Architecture
 */

import { useCallback, useMemo, useRef, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  useDraggable,
  useDroppable,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
  type UniqueIdentifier,
} from '@dnd-kit/core';
import { DashboardBlock } from './DashboardBlock';
import type { DashboardBlock as DashboardBlockType } from '../../hooks/useDashboardLayout';
import { GRID_COLUMNS, GRID_GAP, ROW_HEIGHT, CASCADE_CAP } from './dashboardConstants';
import './DashboardLayout.css';

// ═══════════════════════════════════════════════════════════════
//  TYPES
// ═══════════════════════════════════════════════════════════════

interface DashboardLayoutProps {
  blocks: DashboardBlockType[];
  isEditing: boolean;
  /** Called when a block is dropped at a new position */
  onMoveBlock: (blockId: string, x: number, y: number) => void;
  /** Called when a block should be removed */
  onRemoveBlock: (blockId: string) => void;
  /** Called when block config changes (title, refresh, etc.) */
  onUpdateBlockConfig: (blockId: string, config: Record<string, unknown>) => void;
  /** Called when block title changes */
  onUpdateBlockTitle: (blockId: string, title: string) => void;
  /** Called when a block is resized */
  onResizeBlock: (blockId: string, width: number, height: number) => void;
  /** Called when block settings are cancelled (batch revert without marking dirty) */
  onCancelSettings?: (blockId: string, originalTitle: string, originalConfig: Record<string, unknown>, originalWidth: number, originalHeight: number) => void;
}

// ═══════════════════════════════════════════════════════════════
//  GRID HELPERS
// ═══════════════════════════════════════════════════════════════

function snapToGrid(x: number, cellWidth: number): number {
  return Math.max(0, Math.round(x / (cellWidth + GRID_GAP)));
}

function resolveOverlap(
  blocks: DashboardBlockType[],
  targetId: string,
  newX: number,
  newY: number,
  width: number,
  height: number,
): { x: number; y: number } {
  let x = newX;
  let y = newY;
  let attempts = 0;

  // Clamp to grid bounds
  x = Math.min(x, GRID_COLUMNS - width);

  while (attempts < CASCADE_CAP) {
    let hasOverlap = false;

    for (const block of blocks) {
      if (block.id === targetId) continue;

      const overlap =
        x < block.x + block.width &&
        x + width > block.x &&
        y < block.y + block.height &&
        y + height > block.y;

      if (overlap) {
        hasOverlap = true;
        y = block.y + block.height; // Push down
        break;
      }
    }

    if (!hasOverlap) break;
    attempts++;
  }

  return { x, y };
}

// ═══════════════════════════════════════════════════════════════
//  DRAGGABLE BLOCK WRAPPER
// ═══════════════════════════════════════════════════════════════

interface DraggableBlockProps {
  block: DashboardBlockType;
  isEditing: boolean;
  cellWidth: number;
  onRemove: (id: string) => void;
  onConfigChange: (id: string, config: Record<string, unknown>) => void;
  onTitleChange: (id: string, title: string) => void;
  onResize: (id: string, width: number, height: number) => void;
  onCancelSettings?: (blockId: string, originalTitle: string, originalConfig: Record<string, unknown>, originalWidth: number, originalHeight: number) => void;
}

function DraggableBlock({
  block,
  isEditing,
  cellWidth,
  onRemove,
  onConfigChange,
  onTitleChange,
  onResize,
  onCancelSettings,
}: DraggableBlockProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: block.id as UniqueIdentifier,
    data: { block },
    disabled: !isEditing,
  });

  const { setNodeRef: setDroppableRef } = useDroppable({
    id: `${block.id}-drop`,
    data: { block },
  });

  const style: React.CSSProperties = useMemo(
    () => ({
      position: 'absolute',
      left: block.x * (cellWidth + GRID_GAP),
      top: block.y * (ROW_HEIGHT + GRID_GAP),
      width: block.width * cellWidth + (block.width - 1) * GRID_GAP,
      height: block.height * ROW_HEIGHT + (block.height - 1) * GRID_GAP,
      transform: transform ? `translate(${transform.x}px, ${transform.y}px)` : undefined,
      opacity: isDragging ? 0.5 : 1,
      zIndex: isDragging ? 100 : 1,
      transition: isDragging ? 'none' : 'left 0.2s ease, top 0.2s ease, width 0.2s ease, height 0.2s ease',
    }),
    [block.x, block.y, block.width, block.height, cellWidth, transform, isDragging],
  );

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      <div ref={setDroppableRef} style={{ height: '100%' }}>
        <DashboardBlock
          block={block}
          isEditing={isEditing}
          onRemove={onRemove}
          onConfigChange={onConfigChange}
          onTitleChange={onTitleChange}
          onResize={onResize}
          onCancelSettings={onCancelSettings}
        />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  DRAG OVERLAY — rendered while dragging
// ═══════════════════════════════════════════════════════════════

function DragOverlayContent({ block, cellWidth }: { block: DashboardBlockType; cellWidth: number }) {
  return (
    <div
      style={{
        width: block.width * cellWidth + (block.width - 1) * GRID_GAP,
        height: block.height * ROW_HEIGHT + (block.height - 1) * GRID_GAP,
        background: 'var(--card-bg)',
        borderRadius: 12,
        boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
        opacity: 0.9,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '0.85rem',
        color: 'var(--neutral-500)',
      }}
    >
      <DashboardBlock
        block={block}
        isEditing={false}
        onRemove={() => {}}
        onConfigChange={() => {}}
        onTitleChange={() => {}}
        onResize={() => {}}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  DASHBOARD LAYOUT
// ═══════════════════════════════════════════════════════════════

export function DashboardLayout({
  blocks,
  isEditing,
  onMoveBlock,
  onRemoveBlock,
  onUpdateBlockConfig,
  onUpdateBlockTitle,
  onResizeBlock,
  onCancelSettings,
}: DashboardLayoutProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeBlock, setActiveBlock] = useState<DashboardBlockType | null>(null);

  // Configure pointer sensor with distance constraint so button clicks pass through
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  );

  // Calculate cell width from container
  const cellWidth = useMemo(() => {
    // Default: calculate from viewport
    const maxWidth = Math.min(containerRef.current?.clientWidth || 1200, 1400);
    const totalGap = GRID_GAP * (GRID_COLUMNS - 1);
    return Math.max(200, (maxWidth - totalGap) / GRID_COLUMNS);
  }, []); // Recalculate on resize via a ResizeObserver would be ideal, but static is fine

  // Memoize visible blocks
  const visibleBlocks = useMemo(() => blocks.filter((b) => b.visible), [blocks]);

  // ═════════════════════════════════════════════════════════════
  //  DRAG HANDLERS
  // ═════════════════════════════════════════════════════════════

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const block = event.active.data.current?.block as DashboardBlockType | undefined;
    if (block) setActiveBlock(block);
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveBlock(null);

      const { active, delta } = event;
      const block = active.data.current?.block as DashboardBlockType | undefined;
      if (!block) return;

      // Calculate new grid position from delta
      const snappedX = snapToGrid(block.x * (cellWidth + GRID_GAP) + delta.x, cellWidth);
      const snappedY = Math.round((block.y * (ROW_HEIGHT + GRID_GAP) + delta.y) / (ROW_HEIGHT + GRID_GAP));

      const resolved = resolveOverlap(blocks, block.id, snappedX, Math.max(0, snappedY), block.width, block.height);

      if (resolved.x !== block.x || resolved.y !== block.y) {
        onMoveBlock(block.id, resolved.x, resolved.y);
      }
    },
    [blocks, cellWidth, onMoveBlock],
  );

  const handleDragCancel = useCallback(() => {
    setActiveBlock(null);
  }, []);

  // ═════════════════════════════════════════════════════════════
  //  RENDER
  // ═════════════════════════════════════════════════════════════

  const containerHeight = useMemo(() => {
    if (visibleBlocks.length === 0) return 200;
    const maxY = Math.max(...visibleBlocks.map((b) => b.y + b.height));
    return maxY * (ROW_HEIGHT + GRID_GAP) + ROW_HEIGHT;
  }, [visibleBlocks]);

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd} onDragCancel={handleDragCancel}>
      <div
        ref={containerRef}
        className={`dashboard-layout ${isEditing ? 'dashboard-layout--editing' : ''}`}
        style={{ position: 'relative', height: containerHeight, minHeight: 200 }}
      >
        {visibleBlocks.length === 0 ? (
          <div className="dashboard-layout-empty">
            <p>Your dashboard is empty</p>
            {isEditing && <p className="dashboard-layout-empty-hint">Add blocks from the palette to get started</p>}
          </div>
        ) : (
          visibleBlocks.map((block) => (
            <DraggableBlock
              key={block.id}
              block={block}
              isEditing={isEditing}
              cellWidth={cellWidth}
              onRemove={onRemoveBlock}
              onConfigChange={onUpdateBlockConfig}
              onTitleChange={onUpdateBlockTitle}
              onResize={onResizeBlock}
              onCancelSettings={onCancelSettings}
            />
          ))
        )}

        {/* Drag overlay */}
        <DragOverlay>
          {activeBlock ? <DragOverlayContent block={activeBlock} cellWidth={cellWidth} /> : null}
        </DragOverlay>
      </div>
    </DndContext>
  );
}

export default DashboardLayout;
