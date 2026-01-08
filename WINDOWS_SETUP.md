# Windows Setup Complete

I've configured your Mini ERP application to build as a Windows executable installer.

## What Was Created

### Core Files
- `electron/main.js` - Electron main process (starts server + shows app window)
- `electron/preload.js` - Security bridge between main process and renderer
- `package.json` - Updated with Electron build configuration
- `electron.gitignore` - Git ignore for build artifacts
- `.npmignore` - NPM packaging configuration

### Build Files
- `build/installer.nsh` - NSIS installer template (customizable)
- `build/README.md` - Instructions for adding app icon
- `build-windows.bat` - One-click build script for Windows
- `WINDOWS_BUILD_README.md` - Complete documentation
- `BUILD_INSTRUCTIONS.md` - Quick start guide

## Quick Build Steps

### Option 1: Using the batch script (Windows)
```batch
build-windows.bat
```

### Option 2: Manual build
```bash
# 1. Install all dependencies
npm run install-deps

# 2. Build React frontend
npm run build-client

# 3. Build Windows installer
npm run dist-win
```

## What You Need to Add

Before building, add your app icon to `build/icon.ico`:
- Create or download a 256x256 icon
- Convert to ICO format (see `build/README.md`)
- Save as `build/icon.ico`

## How It Works

1. **Electron** creates a desktop window
2. **Backend Server** (Node.js + Express) runs embedded
3. **Frontend** (React) loads from built files
4. **SQLite Database** stores data in user's AppData folder
5. **Installer** (NSIS) creates a professional Windows installer

## Result

After building, you'll get:
- `dist/Mini ERP Setup 1.0.0.exe` - The installer you can distribute
- Users install like any Windows program
- No source code visible to end users
- Database stored in `%APPDATA%\Mini ERP\`

## Distribution

1. Build the installer (see Quick Build Steps above)
2. Copy `dist/Mini ERP Setup 1.0.0.exe` to share location
3. Send to users via email, upload to website, or put on USB
4. Users double-click to install

## Testing

After building, test the installer:
1. Run the .exe on a clean Windows machine or VM
2. Verify the app starts correctly
3. Check that database is created in AppData
4. Test uninstall from "Add or Remove Programs"
5. Test reinstall to verify data persistence

## Security Note

The application packages source code in ASAR format (read-only archive). For stronger protection:
- Consider code obfuscation
- Use native modules for sensitive logic
- Implement proper authentication

## Need Help?

See `WINDOWS_BUILD_README.md` for complete documentation including:
- Troubleshooting
- Advanced options (code signing)
- Auto-updater setup
- Distribution best practices

---

**Ready to build! Just add your icon and run the build script.**
