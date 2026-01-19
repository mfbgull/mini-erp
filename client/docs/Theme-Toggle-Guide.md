# Theme Toggle Feature Guide

## 🎨 Overview

Your miniERP application now includes a **Theme Toggle** feature that allows you to switch between two visual themes:

1. **ERPNext Theme** (Default) - Professional ERPNext-inspired design
2. **Default Theme** - Original miniERP styling

---

## 📍 Location

The **Theme Toggle button** is located in the **top-right corner** of your application:

- **Desktop**: Fixed position, top-right corner
- **Mobile**: Top-right corner (icon only on small screens)
- **Icon**: 🎨 (ERPNext) or 🔷 (Default)
- **Label**: Shows current theme name

---

## 🔄 How to Use

### Switching Themes

1. **Locate the toggle button** in the top-right corner
2. **Click the button** to switch between themes
3. **The button** shows the current theme name
4. **Your preference is saved** automatically (persists across sessions)

### Visual Feedback

- **ERPNext Theme**: Button shows 🎨 icon with blue gradient background
- **Default Theme**: Button shows 🔷 icon with light background
- **Hover effect**: Button lifts slightly with enhanced shadow

---

## 💾 Persistence

- Theme preference is **saved to localStorage**
- Preference **persists across browser sessions**
- Preference **persists across page refreshes**
- Works on **all pages of the application**

---

## 🎨 Theme Details

### ERPNext Theme (Default)

**Characteristics:**
- Gradient button backgrounds
- Layered shadows for depth
- Pill-shaped status badges
- Enhanced hover effects
- Professional color palette
- Smooth transitions (200ms)
- 6px standard border radius
- Systematic spacing (4px base)

**Best For:**
- Professional business environment
- Enterprise-like appearance
- Modern, polished look

### Default Theme

**Characteristics:**
- Flat button colors
- Minimal shadows
- Basic status badges
- Simple hover states
- Original color palette
- Standard transitions
- 4px/8px border radius
- Original spacing

**Best For:**
- Lightweight, minimal aesthetic
- Familiar original look
- Faster rendering

---

## 🔧 Technical Implementation

### Files Involved

1. **`client/src/context/ThemeContext.jsx`**
   - Theme state management
   - localStorage integration
   - Theme class application

2. **`client/src/components/common/ThemeToggle.jsx`**
   - Toggle button component
   - Visual theme indicator

3. **`client/src/components/common/ThemeToggle.css`**
   - Button styling
   - Theme-specific variants
   - Responsive design

4. **`client/src/assets/styles/erpnext-theme.css`**
   - Complete ERPNext design system
   - 50+ CSS variables
   - All component overrides

5. **`client/src/assets/styles/default-theme.css`**
   - Default theme reset styles
   - Applied when `.theme-default` is active

### How It Works

1. **Initialization**:
   ```javascript
   const saved = localStorage.getItem('miniERP-theme')
   const theme = saved || 'erpnext' // Default to ERPNext
   ```

2. **Class Application**:
   ```css
   /* ERPNext Theme */
   :root.theme-erpnext {
     /* ERPNext styles apply */
   }

   /* Default Theme */
   :root.theme-default {
     /* Default styles apply */
   }
   ```

3. **Toggle Action**:
   ```javascript
   toggleTheme() {
     setCurrentTheme(prev =>
       prev === 'default' ? 'erpnext' : 'default'
     )
   }
   ```

---

## 🎯 Theme States

### Active Theme Indicators

**ERPNext Theme Active:**
- Body class: `.theme-erpnext`
- Button icon: 🎨
- Button label: "ERPNext Theme"
- Button style: Blue gradient background

**Default Theme Active:**
- Body class: `.theme-default`
- Button icon: 🔷
- Button label: "Default Theme"
- Button style: Light background with border

---

## 📱 Responsive Behavior

### Desktop (> 640px)
```
┌─────────────────────────────┐
│                    [🎨 ERPNext Theme] │  ← Full button with label
└─────────────────────────────┘
```

### Mobile (< 640px)
```
┌────────────────┐
│             [🎨] │  ← Icon only
└────────────────┘
```

---

## 🎨 Customization

### Change Default Theme

If you want **Default Theme** to be the initial theme instead of ERPNext:

**Edit**: `client/src/context/ThemeContext.jsx`
```javascript
const [currentTheme, setCurrentTheme] = useState(() => {
  const saved = localStorage.getItem('miniERP-theme')
  return saved || THEMES.DEFAULT // Change to default theme
})
```

### Add More Themes

To add additional themes:

1. **Create new theme file**: `client/src/assets/styles/new-theme.css`
2. **Add theme constant**: `client/src/context/ThemeContext.jsx`
   ```javascript
   export const THEMES = {
     DEFAULT: 'default',
     ERPNEXT: 'erpnext',
     CUSTOM: 'your-custom-theme'  // Add new theme
   }
   ```
3. **Update ThemeToggle**: Modify to handle multiple themes
4. **Style theme-specific**: Use `.theme-your-custom-theme` selector

---

## 🔍 Troubleshooting

### Theme Not Switching

**Problem**: Clicking toggle doesn't change theme
**Solution**: Clear browser cache and refresh

### Theme Resets on Refresh

**Problem**: Theme reverts to default after refresh
**Solution**:
1. Check localStorage: `localStorage.getItem('miniERP-theme')`
2. Verify ThemeContext is properly initialized
3. Check console for errors

### Styles Not Applying

**Problem**: New theme styles not visible
**Solution**:
1. Verify CSS files are imported in `main.jsx`
2. Check browser DevTools for CSS load errors
3. Clear cache and reload

### Toggle Button Not Visible

**Problem**: Toggle button not appearing
**Solution**:
1. Verify `ThemeToggle` is imported in `App.jsx`
2. Check z-index conflicts
3. Verify `ThemeProvider` wraps app

---

## 📊 Feature Comparison

| Feature | ERPNext Theme | Default Theme |
|---------|---------------|---------------|
| Button Style | Gradient + Shadows | Flat |
| Status Badges | Pill-shaped | Rounded |
| Shadows | Layered depth | Minimal |
| Transitions | 200ms smooth | Basic |
| Border Radius | 6px consistent | 4px/8px varied |
| Color Palette | Professional | Original |
| Typography | Enhanced | Standard |
| Hover Effects | Lift + Glow | Simple |

---

## 💡 Tips

### Best Practices

1. **Test on Different Pages**: Toggle theme on various pages to ensure consistency
2. **Check Responsive**: Test toggle on mobile and desktop
3. **Clear Cache**: After updates, clear browser cache to see changes
4. **Check Console**: Use DevTools to verify theme class changes

### Performance

- Both themes are **loaded at once** (fast switching)
- No **network requests** when toggling
- **Instant** visual feedback
- **Minimal** JavaScript overhead

---

## 🎯 Future Enhancements

Potential improvements to the theme toggle:

1. **More Themes**: Add additional theme options
2. **Dark Mode**: Implement light/dark theme switching
3. **Theme Settings**: Add settings page for theme customization
4. **Keyboard Shortcut**: Alt+T to toggle theme quickly
5. **Animation**: Add smooth transition when switching themes

---

## 📚 Related Documentation

- **ERPNext Theme Guide**: `client/docs/ERPNext-Theme-Guide.md`
- **Theme Completion Summary**: `client/docs/ERPNext-Theme-Completion-Summary.md`
- **ERPNext Design System**: https://docs.erpnext.com

---

## 📞 Support

### Common Questions

**Q: Can I customize the toggle button?**
A: Yes, edit `client/src/components/common/ThemeToggle.css`

**Q: How do I remove the toggle?**
A: Remove `<ThemeToggle />` from `client/src/App.jsx`

**Q: Can I change the toggle position?**
A: Yes, modify `.theme-toggle` in `ThemeToggle.css`

**Q: Will my theme preference sync across devices?**
A: No, preference is saved per browser/device

---

## 🎉 Enjoy Theme Switching!

Your miniERP now provides **flexible theming** with instant toggle capability. Switch between **ERPNext's professional look** and **original default styling** with just one click!

**Remember**: Your theme preference is automatically saved and restored on your next visit.

---

*Created by: BMad Master*
*Date: 2025-12-27*
*Feature: Theme Toggle*
