# Mini ERP Build Instructions

## Creating the Windows Installer

### Prerequisites
1. Node.js (v18 or higher) installed
2. npm installed
3. PowerShell or Command Prompt

### Step 1: Install All Dependencies
```bash
npm run install-deps
```

### Step 2: Build the Client (Frontend)
```bash
npm run build-client
```

### Step 3: Build Windows Installer
```bash
npm run dist-win
```

The installer will be created in the `dist` directory as:
- `Mini ERP Setup 1.0.0.exe` (NSIS installer)

### Installation
1. Double-click `Mini ERP Setup 1.0.0.exe`
2. Follow the installation wizard
3. Choose installation directory (default: `C:\Program Files\Mini ERP\`)
4. The installer will:
   - Create desktop shortcut
   - Create Start Menu shortcut
   - Install all necessary files
   - Configure registry entries

### Application Data
The application stores data in:
```
%APPDATA%\Mini ERP\
```
This includes:
- SQLite database file (`erp.db`)
- Database migrations
- User settings

### Uninstalling
Use the Windows "Add or Remove Programs" control panel to uninstall.

## Development Mode

To run in development mode:
```bash
# Terminal 1: Start server
cd server && npm run dev

# Terminal 2: Start client
cd client && npm run dev

# Terminal 3: Start Electron
npm run start-electron
```

## Icon Requirements
For a professional installer, add:
1. `build/icon.ico` (256x256 ICO file)
2. `build/icon.png` (512x512 PNG file)
3. `build/installerIcon.ico` (Installer icon)

## Source Code Protection
The packaged application will:
- Bundle all source code into ASAR format
- Server code is bundled in `resources/server`
- Client code is bundled in `resources/client/dist`
- SQLite database and migrations are in user data directory
