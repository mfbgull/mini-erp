# Drag-and-Drop Library Research for Custom Report Builder

**Date:** 2026-06-24  
**Project:** MiniERP — Ad-hoc Report Builder  
**Context:** We need a drag-and-drop library to let users drag fields from a palette into a column drop zone, reorder columns within the drop zone, and configure filters/sorts via drag interactions.

---

## Project Environment

| Dependency | Version |
|-----------|---------|
| React | ^19.2.4 |
| AG-Grid (Community) | ^35.1.0 |
| Chart.js (via react-chartjs-2) | installed |
| Existing DnD Library | **None** |

---

## Candidate Comparison

### 1. @dnd-kit (Recommended)

| Metric | Value |
|--------|-------|
| **Bundle size** (core + sortable) | ~15–20 kB min+gzip (tree-shakeable) |
| **Last release** | 2025–2026 (actively maintained) |
| **React 19** | ✅ Fully compatible |
| **License** | MIT |
| **GitHub stars** | ~14k |
| **Learning curve** | Moderate (Sensor/Modifier/Collisions architecture) |

**Strengths:**
- Built for the **drag-from-palette-into-dropzone** pattern — official "Multiple Containers" example demonstrates exactly this
- Tree-shakeable: import only what you need (`core`, `sortable`, `utilities`)
- Excellent collision detection and custom sensor support
- First-class accessibility primitives (keyboard, screen reader, touch) — must be wired up by developer
- Grid layout support is excellent

**Weaknesses:**
- Requires more boilerplate than `@hello-pangea/dnd` for simple lists
- Accessibility requires explicit implementation (not automatic)

### 2. @hello-pangea/dnd (Maintained fork of react-beautiful-dnd)

| Metric | Value |
|--------|-------|
| **Bundle size** | ~50–60 kB (monolithic) |
| **Last release** | 2025 (stable, "feature complete") |
| **React 19** | ✅ Compatible |
| **License** | Apache 2.0 |
| **GitHub stars** | ~3.5k |
| **Learning curve** | Low (drop-in replacement for react-beautiful-dnd) |

**Strengths:**
- Best "out of the box" experience for simple vertical/horizontal lists
- Exceptional built-in accessibility (screen readers, keyboard control work without manual config)
- Very well-documented with clear patterns

**Weaknesses:**
- **Monolithic** — significantly larger bundle (3x `@dnd-kit`)
- Creates wrapper DOM nodes that can interfere with complex layouts like AG-Grid
- "Feature complete" = slower to adopt new React patterns
- Limited grid/multi-container support compared to `@dnd-kit`

### 3. react-dnd

| Metric | Value |
|--------|-------|
| **Bundle size** | ~10–15 kB core + ~5 kB HTML5 backend (modular) |
| **Last release** | 2024 (slow, steady development) |
| **React 19** | ✅ Compatible |
| **License** | MIT |
| **GitHub stars** | ~21k |
| **Learning curve** | High (deep HTML5 DnD API knowledge required) |

**Strengths:**
- Most flexible for low-level control
- Excellent for connecting to AG-Grid's native drag API
- Proven, long-standing project

**Weaknesses:**
- **Steep learning curve**
- Requires significant manual effort for accessibility and touch support
- Slow development pace
- Overkill for our use case (we don't need low-level HTML5 DnD API access)

---

## AG-Grid Compatibility Notes

Important: AG-Grid has its own internal drag-and-drop system for row dragging and column reordering. This is **separate** from our use case.

**What we need from DnD:** Drag field items from a **palette** (left panel) into a **column drop zone** (part of the builder UI, **not** the AG-Grid table itself). The AG-Grid table is only used to *display results*, not to configure them.

**Therefore:**
- We are **not** trying to make AG-Grid rows sortable via an external DnD library
- We are **not** trying to drag things into/out of the AG-Grid DOM
- The DnD interactions happen entirely in the **configuration panel**, independent of AG-Grid
- → **No conflict with AG-Grid's internal DnD**

All three libraries work fine for this use case.

---

## Recommendation: @dnd-kit

### Why @dnd-kit wins for this project

| Requirement | @dnd-kit | @hello-pangea/dnd | react-dnd |
|-------------|----------|-------------------|-----------|
| Drag palette → drop zone | ✅ Excellent (official example) | ✅ Good | ✅ Excellent |
| Reorder within drop zone | ✅ (useSortable) | ✅ (native) | ✅ (needs setup) |
| Multiple containers | ✅ Native support | ⚠️ Works but limited | ✅ Good |
| Bundle efficiency | ✅ **Best** (~15–20 kB) | ❌ ~50–60 kB | ✅ ~15–20 kB |
| React 19 support | ✅ Modern hooks | ✅ Compatible | ✅ Compatible |
| Future-proofing | ✅ Active development | ⚠️ Feature-complete | ⚠️ Slow pace |
| Accessibility | ⚠️ Manual setup needed | ✅ Best built-in | ❌ Heavy manual work |
| Learning curve | ⚠️ Moderate | ✅ Low | ❌ High |

### Specific features we'll use from @dnd-kit

```typescript
// Packages to install:
// - @dnd-kit/core          → DndContext, useDraggable, useDroppable
// - @dnd-kit/sortable      → SortableContext, useSortable, arrayMove, arraySwap
// - @dnd-kit/utilities     → CSS.Transform helpers

// Pattern: Multiple Containers
// - Left panel (FieldPalette): useDraggable items, no SortableContext
// - Right panel (ColumnDropZone): useDroppable + SortableContext with useSortable
// - onDragEnd: detect source → if from palette, add to columns; if within zone, reorder
// - onDragOver: detect when hovering over zone for visual feedback
```

### Accessibility plan

Wire up keyboard sensor + screen reader announcements:
```typescript
import { KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';

const sensors = useSensors(
  useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
);
```

### Installation

```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
# No other peer dependencies needed
```

---

## Conclusion

**Use `@dnd-kit`.** It's the best fit for the palette-to-dropzone pattern, has the smallest tree-shakeable bundle, is actively maintained with React 19 support, and its moderate learning curve is well worth the flexibility trade-off. The "Multiple Containers" example in its docs maps directly to our report builder UX.
