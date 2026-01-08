# Mini ERP - Windows Desktop Build

This guide shows how to create a Windows executable installer for Mini ERP that installs the application like a regular Windows program.

## Quick Start

```bash
# 1. Install all dependencies
npm run install-deps

# 2. Build the React frontend
npm run build-client

# 3. Build Windows installer (creates .exe in dist/)
npm run dist-win
```

The installer will be created at: `dist/Mini ERP Setup 1.0.0.exe`

## What Gets Installed

When users install the `.exe` file, they get:

1. **Program Files**: All application files in `C:\Program Files\Mini ERP\`
   - Electron application runner
   - Built React frontend
   - Server source code
   - Server dependencies (production)

2. **App Data**: Database and settings in `%APPDATA%\Mini ERP\`
   - SQLite database (`erp.db`)
   - Database migrations
   - User settings and backups

3. **Shortcuts**:
   - Desktop shortcut
   - Start Menu shortcut under "Mini ERP"

4. **Uninstaller**: Can uninstall from Windows "Add or Remove Programs"

## File Structure

```
minierp/
├── electron/              # Electron main process files
│   ├── main.js          # Main entry point
│   └── preload.js        # Preload script
├── client/              # React frontend
│   └── dist/           # Built frontend (generated)
├── server/             # Node.js backend
│   ├── src/           # Server source code
│   ├── migrations/     # Database migrations
│   └── package.json
├── build/             # Build assets
│   └── icon.ico      # App icon (you need to add this)
├── dist/              # Generated installer (created by build)
└── package.json        # Electron build config
```

## Required Files to Add

Before building, you need to add:

### 1. App Icon
Create `build/icon.ico` (256x256 pixels)
- Use Windows ICO format with multiple sizes (16, 32, 48, 64, 128, 256)
- Can convert from PNG using online tools like https://convertico.com/
- Should represent your brand/logo

### 2. Optional: Installer Icon
Create `build/installerIcon.ico` for the installer wizard

## Building the Installer

### Development Build
```bash
npm run dist
```
Creates installers for all platforms configured in `package.json`.

### Windows-Only Build (Recommended)
```bash
npm run dist-win
```
Creates only Windows NSIS installer (faster).

### Output Location
Built installers are placed in the `dist/` directory:
- `Mini ERP Setup 1.0.0.exe` - The Windows installer
- `Mini ERP-1.0.0-unsigned.nupkg` - Update package (for auto-updates)

## Installation Process

When a user runs the installer:

1. **Welcome Screen** - Shows app name and version
2. **License** - Shows your LICENSE file (if exists)
3. **Choose Location** - User selects install directory (default: Program Files)
4. **Choose Components** - (optional, not configured by default)
5. **Start Menu Folder** - User creates Start Menu shortcut
6. **Additional Tasks** - Creates desktop shortcut
7. **Installing** - Progress bar shows files being copied
8. **Completed** - Option to launch app immediately

## Application Data Protection

The SQLite database and user data are stored separately from program files:

```
%APPDATA%\Mini ERP\
├── database\
│   ├── erp.db              # Main database
│   ├── erp.db-wal          # Write-ahead log
│   └── erp.db-shm          # Shared memory
└── migrations\              # Database migration files
```

This ensures:
- User data survives app updates
- User data survives app reinstall (if configured)
- Standard Windows data location

## Source Code Protection

The packaged application:

✅ **Bundled Code**: All source files are packaged into ASAR format (read-only archive)
✅ **Hidden Implementation**: Users cannot see source code easily
✅ **Protected Database**: Database stored in AppData (separate from executable)
✅ **Production Build**: No dev tools, no debug information

Note: ASAR can be extracted with tools. For stronger protection, consider:
- Code obfuscation
- Native modules compilation
- Custom encryption

## Troubleshooting

### Build Fails
```bash
# Clear cache and try again
rm -rf dist node_modules/.electron-builder

# Reinstall Electron dependencies
npm install --save-dev electron electron-builder
```

### App Won't Start
- Check `electron/main.js` console output
- Verify server started successfully
- Check database path permissions

### Database Issues
- Database created in user's AppData folder
- Check: `%APPDATA%\Mini ERP\database\`
- Verify migrations were copied

## Distribution

### For Users
- Email or share the `.exe` file from `dist/`
- Users double-click to install
- No Node.js or npm required on their machine

### For Internal Testing
```bash
# Run installer silently (no UI)
"Mini ERP Setup 1.0.0.exe" /S /D=C:\TestInstall
```

## Advanced Options

### Digital Signing (Code Signing)
To avoid Windows "Unknown Publisher" warnings:

1. Get a code signing certificate from a CA (e.g., DigiCert, GlobalSign)
2. Configure in `package.json`:
```json
"win": {
  "certificateFile": "path/to/cert.pfx",
  "certificatePassword": "your-password"
}
```

3. Build with signed certificate

### Auto-Updater
For automatic updates, configure update server in `electron/main.js`:
```javascript
const { autoUpdater } = require('electron-updater');

autoUpdater.setFeedURL({
  url: 'https://your-server.com/updates',
  requestHeaders: {
    'Cache-Control': 'no-cache'
  }
});

autoUpdater.checkForUpdatesAndNotify();
```

## Testing

Before distributing:

1. Clean install on fresh Windows VM
2. Verify all features work
3. Test uninstallation
4. Test upgrade from previous version
5. Check database migrations
6. Verify data persistence

## Support

For issues:
- Check Electron Builder docs: https://www.electron.build/
- Check Electron docs: https://www.electronjs.org/docs/
- Check NSIS docs: https://nsis.sourceforge.io/Docs/

## License

MIT License - See LICENSE file for details
