# Construction BOQ Calculator

A desktop-first Bill of Quantities (BOQ) calculator for construction professionals in Pakistan and South Asia.

## Features

- **Room-Based Specification Engine** — Define floors and rooms with L×W×H dimensions. Auto-calculates material quantities (cement, steel, bricks, sand, plaster, paint, flooring, MEP, etc.) using Pakistan construction thumb-rules.
- **Wall Entity Model** — Each wall is stored once, referenced by both adjacent spaces. Two independent faces (face_a, face_b) with their own finish types, openings, and BOQ contribution. Shared walls never double-count.
- **AG Grid BOQ Editor** — Fast, keyboard-navigable spreadsheet interface. Copy/paste, inline editing, section headers, drag-to-reorder.
- **Rate Library** — Master rates for materials and labour. Editable cards view or AG Grid view.
- **Payment Plans** — 8-milestone construction phase schedule. Auto-recalculates amounts when total cost changes.
- **Reports** — Phase-wise BOQ breakdown with KPI strip, material quantity summary.
- **Export** — PDF (jsPDF), Excel (xlsx), Print with professional A4 layouts.
- **Offline-First** — All data persisted locally. Works without internet.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + TypeScript + Vite |
| Desktop | Tauri v2 |
| State | Zustand |
| Grid | AG Grid Community |
| Database | SQLite via localStorage (Tauri-ready) |

## Getting Started

```bash
npm install
npm run dev
```

## Wall Entity Model

```
┌─────────────────┬─────────────────┐
│   Room A        │      Room B    │
│   (paint)      │      (paint)   │
└──────┬──────────┴──────┬──────────┘
       │  Shared Wall   │
       │  4m × 3m = 12m² each face
```

Key rules:
- Each wall stored **ONCE**, referenced by both spaces
- Each face owns its finish **independently** (no 50% split)
- Face types: `room`, `kitchen`, `bathroom`, `corridor`, `external`, `open`
- Status badges: Shared (amber), External (blue), Open (gray), Unlinked (red)
- Unlinked walls: neighbor room not yet created — treated as external

## Architecture

```
src/
  features/
    boq/          — AG Grid BOQ editor
    projects/     — Project CRUD
    spec/         — Room spec engine + calculations
    walls/        — Wall entity model (store, db, components)
    report/       — Phase-wise BOQ report
    payment/      — Milestone payment plans
    rates/        — Rate library
    export/       — PDF/Excel/Print
  types/
    wall.ts       — Wall entity types + pure calculation functions
```

### Rules
- **Feature-based** — All code lives inside `features/` modules
- **Pure functions** — Calculations have no side effects
- **Strict TypeScript** — No `any`, explicit interfaces
- **Wall model** — Shared walls contribute to both rooms independently

## Modules

| Tab | Description |
|---|---|
| **Projects** | Create and manage construction projects |
| **BOQ** | AG Grid spreadsheet for line items |
| **Specification** | Room-based spec with wall management |
| **Report** | Phase breakdown with material quantities |
| **Payments** | Milestone payment schedule |
| **Rates** | Material and labour rate library |
| **Export** | PDF, Excel, Print |