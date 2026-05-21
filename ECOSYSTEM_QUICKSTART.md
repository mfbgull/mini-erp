# 🌊 Living Ecosystem - Quick Start Guide

## What You'll See

When you open the Living Ecosystem, you'll enter a **bioluminescent underwater world** where:

### 🪸 Coral Reefs (Your ERP Modules)
Each coral reef represents a core module of your Mini ERP:

| Coral Location | Module | Color |
|---------------|--------|-------|
| Center | **Dashboard** | Cyan (00f5d4) |
| Left-Front | **Inventory** | Blue (00bbf9) |
| Right-Front | **Sales** | Purple (9b5de5) |
| Left-Back | **Purchases** | Pink (f72585) |
| Right-Back | **Production** | Yellow (ffbe0b) |
| Far-Left | **Customers** | Green (06d6a0) |
| Far-Right | **Reports** | Teal (118ab2) |
| Center-Back | **Expenses** | Red (ef476f) |

### 🐟 What's Moving?
- **Fish Schools**: Represent sub-features swarming around each module
- **Particle Currents**: Your data flowing through the system
- **Plankton Clouds**: User activity hovering around modules
- **Bubble Vents**: Alert indicators (erupt when problems detected)

## How to Navigate

### Basic Controls
```
🖱️ Mouse Drag    → Rotate your view (swim around)
🖱️ Scroll        → Zoom in/out
🖱️ Click Coral   → Explore module & see live metrics
⌨️ Escape        → Close panel & reset view
```

### Top Bar Buttons
- **🔇 Audio / 🔊 Audio**: Toggle ambient ocean sounds
- **🎯 Reset View**: Return to default overview position
- **👁 Accessibility**: Switch to colorblind-friendly palette

## Interacting with Your Data

### 1. Click Any Coral Reef
When you click a coral, you'll see:
- **Module name & description**
- **Live metrics** from your ERP (if backend is running)
- **Activity level** (how much that module is being used)

### 2. Watch the Bioluminescence
- **Brighter glow** = Higher activity (more data/transactions)
- **Dimmer glow** = Lower activity
- **Pulsing rhythm** = Real-time data updates

### 3. Check for Alerts
If you have **low stock items**:
- Hydrothermal vents will erupt with bubbles
- Located at the edges of the ecosystem
- Red/orange bubble particles

## Example Workflow

### Morning Check
1. Open ecosystem view
2. **Scan the glow**: Which corals are brightest? (most active)
3. **Look for bubbles**: Any vent eruptions? (alerts)
4. **Click Dashboard coral**: See overall metrics
5. **Click Inventory**: Check stock levels
6. **Click Sales**: Review revenue

### Deep Dive
1. **Zoom in** on a specific coral (scroll)
2. **Click it** to see detailed metrics
3. **Rotate view** (drag) to see related modules
4. **Press Escape** to return to overview

## Connection Modes

### ✅ Live Mode
When your Mini ERP backend is running:
- Real data drives coral activity
- Actual metrics display on click
- Vents respond to real alerts
- Status bar shows: "✓ Connected to Mini ERP"

### 🌊 Demo Mode
When backend is not available:
- Simulated data used
- Still fully functional
- Beautiful animation continues
- Status bar shows: "Demo Mode"

## Tips

💡 **Best Experience**: 
- Fullscreen your browser (F11)
- Enable audio for immersion
- Spend 30 seconds watching the ecosystem breathe

💡 **Quick Status Check**:
- Bright Sales coral = Good revenue
- Active Inventory fish = Stock movements
- No bubble vents = No critical alerts

💡 **Accessibility**:
- Colorblind mode improves contrast
- Audio cues for navigation
- Keyboard-only navigation supported

## Troubleshooting

**Q: Everything is dark!**
A: That's intentional - it's a deep ocean biome. The corals glow to guide you.

**Q: No metrics showing when I click?**
A: Ensure Mini ERP backend is running on port 3010 and `/api/dashboard/summary` is accessible.

**Q: Can I add more modules?**
A: Yes! Edit the `moduleData` array in `ecosystem.html` (line ~240).

**Q: Performance sluggish?**
A: Reduce particle count or fish count in the ecosystem.html file.

---

**Now dive in!** → `http://localhost:5173/ecosystem` 🌊
