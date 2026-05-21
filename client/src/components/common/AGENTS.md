# Client Components (Common)

**Parent:** `/AGENTS.md` | **Complexity:** High (30 component files)

## OVERVIEW
Reusable UI components for desktop (AG-Grid) and mobile (Compact Cards).

## WHERE TO LOOK
| Task | Location |
|------|---------|
| Tables | `components/common/` |
| Forms | `components/common/` |
| Modals | `components/common/` |

## CONVENTIONS
- Desktop: AG-Grid for lists
- Mobile (<768px): Compact Card View
- All components fully typed
- Loading states required

## ANTI-PATTERNS
- NO inline styles (use CSS classes)
- NO `any` types
- NO empty catch blocks
- NO suppress TypeScript errors

## KEY COMPONENTS
- `DataTable.tsx` - AG-Grid wrapper
- `CompactCard.tsx` - Mobile list item
- `SearchInput.tsx` - Search with debounce
- `ThreeDotMenu.tsx` - Mobile actions