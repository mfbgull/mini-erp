# 🌊 Mini ERP Living Ecosystem

A **bioluminescent underwater ecosystem** visualization of your Mini ERP system. This is a completely novel way to interact with and understand your business data.

## What Is This?

Instead of traditional dashboards and charts, your entire ERP system is represented as a **living, breathing ocean habitat**:

- **🪸 Coral Reefs** = Core ERP modules (Dashboard, Inventory, Sales, Purchases, Production, etc.)
- **🐟 Fish Schools** = Sub-features and data entities swarming around each module
- **✨ Particle Currents** = Data flowing through your system in real-time
- **🌋 Hydrothermal Vents** = Alerts and notifications (erupt when issues detected)
- **🦠 Plankton Clouds** = User activity and input data

## How to Access

### Option 1: From the Dashboard
1. Open Mini ERP
2. Go to the Dashboard
3. Click the **"Living Ecosystem"** button in Quick Actions (highlighted in bioluminescent teal)

### Option 2: Direct URL
Navigate to: `http://localhost:5173/ecosystem`

### Option 3: Standalone
Open the file directly in your browser: `/home/fawad/ai/minierp/ecosystem.html`

## Features

### 🎨 Visual Representation

| ERP Element | Ecosystem Representation | Behavior |
|-------------|-------------------------|----------|
| **Core Modules** | Bioluminescent coral reefs | Pulse based on real-time activity levels |
| **Sub-features** | Schools of fish | Swarm in patterns around parent module |
| **Data Flow** | Particle currents | Drift through the ecosystem showing data movement |
| **Alerts** | Hydrothermal vents | Erupt bubbles when low stock or issues detected |
| **User Inputs** | Plankton clouds | Float and swirl around active modules |

### 🎮 Interactive Controls

- **Mouse Drag**: Rotate your view around the ecosystem
- **Scroll**: Zoom in/out (swim closer or further)
- **Click on Coral**: Explore a module and see real metrics
- **Escape Key**: Close panel and reset view
- **Reset View Button**: Return to default overview

### 🔊 Audio System
- Toggle ambient ocean soundscape
- Procedural bubble sounds
- Web Audio API powered (no external files needed)

### 👁 Accessibility
- **Colorblind Mode**: Shifts to high-contrast, colorblind-friendly palette
- **Keyboard Navigation**: Full keyboard support
- **Screen Reader Compatible**: ARIA labels on all interactive elements

### 📊 Real Data Integration

When connected to your running Mini ERP backend:
- Coral activity levels reflect actual usage
- Sales reef glows brighter with more revenue
- Inventory coral pulses based on stock levels
- Vents erupt if low stock alerts exist
- Click any coral to see live metrics

## Technical Implementation

### Stack
- **Three.js r128**: 3D rendering via WebGL
- **Web Audio API**: Procedural soundscapes
- **Vanilla JavaScript**: Zero build dependencies
- **CDN-loaded**: No npm install required

### Architecture
```
ecosystem.html (standalone)
├── Three.js scene
│   ├── Seafloor (procedural terrain)
│   ├── Water surface (animated)
│   ├── Coral reefs (8 modules)
│   │   ├── Branching structures
│   │   ├── Bioluminescent tips
│   │   └── Point lights
│   ├── Fish schools (96+ fish)
│   ├── Particle system (2000 particles)
│   ├── Hydrothermal vents (2)
│   └── Plankton clouds (8 clouds, 1600 particles)
├── API Integration
│   └── Fetches /api/dashboard/summary
└── Audio Engine
    ├── Ocean drone (80Hz sine)
    └── Bubble sounds (procedural)
```

### Data Flow
```
Mini ERP Backend (port 3010)
  ↓ HTTP GET /api/dashboard/summary
Ecosystem Visualizer
  ↓ Parse metrics
Living Ecosystem
  ├─ Update coral activity levels
  ├─ Adjust bioluminescence intensity
  ├─ Trigger vent animations
  └─ Display metrics on click
```

## Customization

### Adding New Modules
Edit the `moduleData` array in `ecosystem.html`:
```javascript
const moduleData = [
  { 
    name: 'ModuleName', 
    desc: 'Description', 
    color: 0xhexcolor, 
    position: [x, y, z], 
    scale: size 
  },
  // ...
];
```

### Changing Colors
Each module has a `color` property (hex). The system auto-generates:
- Emissive glow
- Fish school colors
- Plankton cloud colors

### Adjusting Activity Sensitivity
Modify `updateCoralActivity()` to change how data maps to visual intensity:
```javascript
reef.userData.activityLevel = Math.min(1, (metric / threshold));
```

## Performance

- **GPU-accelerated**: WebGL rendering
- **Efficient**: ~60 FPS on modern hardware
- **Lightweight**: Single HTML file, ~500 lines
- **No dependencies**: Loads Three.js from CDN only

## Browser Support

✅ Chrome/Edge 90+\
✅ Firefox 88+\
✅ Safari 14+\
❌ IE11 (no WebGL 2.0)

## Future Enhancements

- [ ] WebXR support for VR immersion
- [ ] Multi-user mode (collaborative ecosystems)
- [ ] Machine learning for predictive coral growth
- [ ] Physics-based water currents (Cannon.js)
- [ ] Seasonal ecosystem changes
- [ ] Sound themes (whalesong, different ocean biomes)

## Why This Matters

This isn't just a gimmick—it's a **new paradigm for data visualization**:

1. **Pattern Recognition**: Humans are evolved to read natural environments
2. **At-a-Glance Health**: See your entire business state in one view
3. **Engagement**: Makes mundane ERP data feel alive and important
4. **Scalability**: Add 100 modules? The ecosystem just grows naturally
5. **Accessibility**: Natural metaphors work across languages/cultures

## Troubleshooting

### "Demo Mode" showing instead of live data?
- Ensure Mini ERP backend is running on port 3010
- Check browser console for CORS errors
- Verify `/api/dashboard/summary` endpoint works

### Performance issues?
- Reduce particle count (line 389: `particleCount = 2000`)
- Lower fish count per school
- Disable audio

### Can't see the ecosystem button?
- Added to Dashboard Quick Actions section
- Also accessible via `/ecosystem` route

## Credits

Created as an innovative visualization layer for Mini ERP.\
Inspired by bioluminescent deep-sea ecosystems.

---

**Try it now**: Open your browser and navigate to `http://localhost:5173/ecosystem` 🌊
