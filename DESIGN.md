# Mini ERP - Design System

A design system for Mini ERP - a business management application for data entry, reporting, and operations.

## Design Philosophy

Enterprise-grade precision meets friendly accessibility. The system balances:
- **Data density** - Efficient use of screen space for business data
- **Clarity** - Clear hierarchy for quick scanning and editing
- **Professionalism** - Trustworthy appearance for business users

## Use Cases

Best suited for: ERP systems, business management tools, inventory management, accounting interfaces, and data-heavy dashboards.

---

## Visual Theme & Atmosphere

**Aesthetic:** Professional yet approachable. Not as stark as developer tools, not as playful as consumer apps. Think: enterprise SaaS meets modern simplicity.

**Density:** Medium-high. Optimized for business users who spend hours on the app.

**Mood:** Reliable, efficient, trustworthy.

---

## Color Palette

### Light Mode

| Role | Color | Hex | Usage |
|------|-------|-----|-------|
| Background Primary | White | `#FFFFFF` | Main content areas |
| Background Secondary | Light Gray | `#F8FAFC` | Sidebar, cards, headers |
| Background Tertiary | Subtle Gray | `#F1F5F9` | Table stripes, hover states |
| Surface | White | `#FFFFFF` | Cards, modals, dropdowns |
| Border | Light Border | `#E2E8F0` | Dividers, card edges |
| Border Focus | Primary Blue | `#3B82F6` | Input focus states |

### Semantic Colors

| Role | Color | Hex | Usage |
|------|-------|-----|-------|
| Primary | Blue | `#3B82F6` | CTAs, links, active states |
| Primary Hover | Dark Blue | `#2563EB` | Button hover states |
| Primary Light | Light Blue | `#DBEAFE` | Selected rows, badges |
| Success | Green | `#10B981` | Completed, paid, positive |
| Success Light | Light Green | `#D1FAE5` | Success backgrounds |
| Warning | Amber | `#F59E0B` | Pending, attention needed |
| Warning Light | Light Amber | `#FEF3C7` | Warning backgrounds |
| Error | Red | `#EF4444` | Errors, overdue, delete |
| Error Light | Light Red | `#FEE2E2` | Error backgrounds |
| Info | Slate | `#64748B` | Secondary info, labels |

### Dark Mode

| Role | Color | Hex | Usage |
|------|-------|-----|-------|
| Background Primary | Deep Gray | `#0F172A` | Main content areas |
| Background Secondary | Dark Slate | `#1E293B` | Sidebar, cards |
| Background Tertiary | Slate | `#334155` | Hover states, borders |
| Surface | Dark Surface | `#1E293B` | Cards, modals |
| Border | Subtle Dark | `#334155` | Dividers, borders |
| Primary | Cyan | `#22D3EE` | CTAs, links |
| Primary Hover | Light Cyan | `#67E8F9` | Button hover |
| Success | Emerald | `#34D399` | Success states |
| Error | Rose | `#FB7185` | Error states |

---

## Typography

### Font Family

| Element | Font | Stack |
|---------|------|-------|
| Headings | Inter | `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif` |
| Body | Inter | Same |
| Monospace | JetBrains Mono | `'JetBrains Mono', 'Fira Code', monospace` |

### Type Scale

| Level | Size | Weight | Line Height | Usage |
|-------|------|--------|-------------|-------|
| Display | 32px | 700 | 1.2 | Dashboard titles |
| H1 | 28px | 600 | 1.3 | Page titles |
| H2 | 22px | 600 | 1.3 | Section headers |
| H3 | 18px | 600 | 1.4 | Card titles |
| H4 | 16px | 600 | 1.4 | Table headers |
| Body | 14px | 400 | 1.5 | General text |
| Body Small | 13px | 400 | 1.5 | Secondary text |
| Caption | 12px | 500 | 1.4 | Labels, badges |
| Tiny | 11px | 500 | 1.3 | Timestamps, metadata |

### Font Weights

| Weight | Value | Usage |
|--------|-------|-------|
| Regular | 400 | Body text |
| Medium | 500 | Emphasis, labels |
| Semibold | 600 | Headings, buttons |
| Bold | 700 | Display, totals |

---

## Spacing System

### Scale (4px base)

| Token | Value | Usage |
|-------|-------|-------|
| `--space-xs` | 4px | Tight spacing, inline elements |
| `--space-sm` | 8px | Tight component padding |
| `--space-md` | 16px | Standard padding |
| `--space-lg` | 24px | Section spacing |
| `--space-xl` | 32px | Major sections |
| `--space-2xl` | 48px | Page margins |
| `--space-3xl` | 64px | Dashboard padding |

### Usage Guidelines

- **Form fields:** 12px vertical, 16px horizontal
- **Cards:** 20px padding
- **Tables:** 12px cell padding
- **Modals:** 24px content, 16px actions
- **Sidebar:** 16px item padding

---

## Border Radius

| Size | Value | Usage |
|------|-------|-------|
| None | 0 | Inputs, strict elements |
| Small | 4px | Buttons, inputs, badges |
| Medium | 8px | Cards, panels, tables |
| Large | 12px | Modals, dropdowns |
| Full | 9999px | Avatars, pills |

---

## Shadows

### Light Mode

| Level | Shadow | Usage |
|-------|--------|-------|
| Subtle | `0 1px 2px rgba(0,0,0,0.05)` | Card hover, subtle elevation |
| Medium | `0 4px 6px -1px rgba(0,0,0,0.1)` | Dropdowns, popovers |
| Strong | `0 10px 15px -3px rgba(0,0,0,0.1)` | Modals, fixed panels |
| Focus | `0 0 0 3px rgba(59,130,246,0.4)` | Input focus ring |

### Dark Mode

| Level | Shadow | Usage |
|-------|--------|-------|
| Subtle | `0 1px 2px rgba(0,0,0,0.3)` | Card hover |
| Medium | `0 4px 6px -1px rgba(0,0,0,0.4)` | Dropdowns |
| Strong | `0 10px 15px -3px rgba(0,0,0,0.5)` | Modals |

---

## Components

### Buttons

#### Primary
- Background: `#3B82F6`
- Text: White
- Padding: 10px 16px
- Border radius: 6px
- Hover: `#2563EB`
- Active: `#1D4ED8`

#### Secondary
- Background: Transparent
- Border: 1px solid `#E2E8F0`
- Text: `#3B82F6`
- Hover: `#F1F5F9`
- Border radius: 6px

#### Danger
- Background: `#EF4444`
- Text: White
- Hover: `#DC2626`

#### Ghost
- Background: Transparent
- Text: `#64748B`
- Hover: `#F1F5F9`

#### Sizes
- Large: 14px font, 12px 20px padding
- Medium: 14px font, 10px 16px padding
- Small: 13px font, 6px 12px padding

### Inputs

- Background: White
- Border: 1px solid `#E2E8F0`
- Border radius: 6px
- Padding: 10px 14px
- Font size: 14px
- Focus: Blue border + focus ring
- Error: Red border + error text
- Disabled: `#F1F5F9` background

### Cards

- Background: White
- Border: 1px solid `#E2E8F0`
- Border radius: 8px
- Padding: 20px
- Shadow (hover): Subtle shadow
- Shadow (active): Medium shadow

### Tables

- Header: `#F8FAFC` background, `#475569` text, 600 weight
- Row: White background, 14px text
- Row hover: `#F8FAFC` background
- Row selected: `#DBEAFE` background
- Cell padding: 12px 16px
- Border: 1px solid `#E2E8F0`

### Badges/Pills

- Border radius: 9999px (full)
- Padding: 4px 10px
- Font: 12px, 500 weight
- Colors: Use semantic colors at 10% opacity background

### Dropdowns/Select

- Background: White
- Border: 1px solid `#E2E8F0`
- Shadow: Medium
- Border radius: 8px
- Item hover: `#F1F5F9`
- Max height: 300px with scroll

### Modals

- Background: White
- Border radius: 12px
- Padding: 24px
- Shadow: Strong
- Overlay: `rgba(0,0,0,0.5)`
- Max width: 560px (standard), 800px (large)

### Tabs

- Active: Primary color text + bottom border
- Inactive: `#64748B` text
- Hover: `#3B82F6` text
- Padding: 12px 16px

---

## Layout Principles

### Grid System

- 12-column grid
- Gutter: 24px
- Margin: 24px (desktop), 16px (mobile)

### Responsive Breakpoints

| Breakpoint | Width | Layout |
|------------|-------|--------|
| Mobile | < 640px | Single column, stacked |
| Tablet | 640px - 1024px | 2-column where appropriate |
| Desktop | > 1024px | Full grid, sidebar visible |

### Sidebar

- Width: 260px (expanded), 72px (collapsed)
- Background: `#F8FAFC` (light), `#1E293B` (dark)
- Border: Right border `#E2E8F0`

### Content Area

- Max width: 1440px
- Padding: 24px desktop, 16px mobile

### Data Density

- Compact: 32px row height
- Standard: 40px row height
- Comfortable: 48px row height

---

## Depth & Elevation

### Z-Index Scale

| Layer | Value | Usage |
|-------|-------|-------|
| Base | 0 | Default |
| Dropdown | 100 | Dropdowns, popovers |
| Sticky | 200 | Sticky headers |
| Modal | 300 | Modals, dialogs |
| Toast | 400 | Notifications |
| Tooltip | 500 | Tooltips |

---

## Do's and Don'ts

### Do

- ✅ Use semantic colors consistently (green for success, red for errors)
- ✅ Maintain consistent spacing using the spacing scale
- ✅ Use 6px border radius for interactive elements
- ✅ Provide clear hover/focus states for all interactive elements
- ✅ Use data-dense tables for large datasets
- ✅ Include loading states for async operations
- ✅ Use cards for grouped content
- ✅ Apply proper contrast ratios (4.5:1 minimum for text)

### Don't

- ❌ Use multiple shades of blue for different meanings
- ❌ Mix border-radius styles (stick to 4px, 8px, 12px)
- ❌ Use excessive shadows (reserve for elevated elements)
- ❌ Create inconsistent button styles
- ❌ Skip error states on form inputs
- ❌ Use bright colors for backgrounds (use light variants)
- ❌ Make text too small (minimum 13px for body)
- ❌ Forget mobile-responsive layouts

---

## Responsive Behavior

### Desktop (> 1024px)

- Full sidebar visible
- Multi-column layouts
- Horizontal tables
- All features accessible

### Tablet (640px - 1024px)

- Collapsible sidebar
- Stacked layouts for forms
- Horizontal scroll for wide tables
- Touch-friendly targets (44px min)

### Mobile (< 640px)

- Hidden sidebar (hamburger menu)
- Single column layouts
- Card-based data display
- Bottom navigation or tabs
- Swipe actions for list items

### Touch Targets

- Minimum: 44px x 44px
- Recommended: 48px x 48px
- Button padding: minimum 12px

---

## Agent Prompt Guide

### Quick Color Reference

```
Primary: #3B82F6 (Blue)
Success: #10B981 (Green)
Warning: #F59E0B (Amber)
Error: #EF4444 (Red)
Text Primary: #1E293B
Text Secondary: #64748B
Border: #E2E8F0
Background: #F8FAFC
```

### Example Prompts

**"Create a data table with sorting and filtering using Mini ERP design tokens."**

**"Build a form with validation states following the Mini ERP input styles."**

**"Design a dashboard card component with proper shadows and hover states."**

**"Create a modal dialog with the Mini ERP modal styling - centered, with backdrop blur."**

---

## Notes

- This design system prioritizes data density and efficiency for business users
- Dark mode should be a first-class citizen, not an afterthought
- All interactive elements must have visible focus states for accessibility
- Test with real business data to ensure readability at scale