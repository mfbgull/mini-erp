const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

let mainWindow;
let serverProcess;

// Path to server directory - need to go up from electron/ directory
let SERVER_PATH = path.join(__dirname, '..', 'server');
let CLIENT_DIST_PATH = path.join(__dirname, '..', 'client', 'dist');

// Function to get the correct path for packaged app
function getPackagedPaths() {
  const isPackaged = app.isPackaged;
  if (isPackaged) {
    // In packaged app, files are in resources directory
    const resourcesPath = path.join(process.resourcesPath, 'app');
    return {
      server: path.join(resourcesPath, 'server'),
      clientDist: path.join(resourcesPath, 'client', 'dist')
    };
  }
  return {
    server: SERVER_PATH,
    clientDist: CLIENT_DIST_PATH
  };
}

// Database path for the app
const getDatabasePath = () => {
  const userDataPath = app.getPath('userData');
  return path.join(userDataPath, 'database');
};

// Ensure database directory exists
const ensureDatabaseDirectory = () => {
  const dbPath = getDatabasePath();
  if (!fs.existsSync(dbPath)) {
    fs.mkdirSync(dbPath, { recursive: true });
  }
  return dbPath;
};

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, '..', 'build', 'icon.ico')
  });

  // Load the app from local server (which serves static files)
  // In production, server runs on port 3011 and serves client/dist
  mainWindow.loadURL('http://localhost:3010');

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Open DevTools in development
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }
}

// Start the backend server
function startServer() {
  return new Promise((resolve, reject) => {
    // Determine correct paths based on whether app is packaged
    let serverPath = SERVER_PATH;
    if (app.isPackaged) {
      // In packaged app, files are in resources directory
      const resourcesPath = process.resourcesPath;
      const packagedServerPath = path.join(resourcesPath, 'server');

      // Use packaged path if it exists, otherwise fall back to original
      if (fs.existsSync(packagedServerPath)) {
        serverPath = packagedServerPath;
        console.log('[Electron] Using packaged server path:', serverPath);
      }
    }

    // Set environment variables for server
    const env = {
      ...process.env,
      NODE_ENV: 'production',
      PORT: '3011',
      DATABASE_PATH: getDatabasePath()
    };

    // Copy database migrations to userData if they don't exist
    const migrationsPath = path.join(getDatabasePath(), 'migrations');
    if (!fs.existsSync(migrationsPath)) {
      fs.mkdirSync(migrationsPath, { recursive: true });
    }

    // Copy init.sql and migrations if needed
    const serverMigrations = path.join(serverPath, 'src', 'migrations');
    console.log('[Electron] Looking for migrations at:', serverMigrations);
    console.log('[Electron] Migrations path exists:', fs.existsSync(serverMigrations));

    if (fs.existsSync(serverMigrations)) {
      fs.cpSync(serverMigrations, migrationsPath, { recursive: true, overwrite: false, errorOnExist: false });
      console.log('[Electron] Copied migrations to:', migrationsPath);
    } else {
      console.error('[Electron] WARNING: Server migrations directory not found!');
    }

    // Spawn the server process
    // In packaged app, compiled JS is at server/server.js
    // In dev, we still need to use ts-node
    const serverScript = app.isPackaged ? 'server.js' : 'server.ts';
    const nodeArgs = app.isPackaged ? [serverScript] : ['-r', 'ts-node/register', serverScript];

    serverProcess = spawn('node', nodeArgs, {
      cwd: serverPath,
      env: env,
      stdio: 'pipe',
      detached: false
    });

    serverProcess.stdout.on('data', (data) => {
      console.log(`[Server] ${data}`);
    });

    serverProcess.stderr.on('data', (data) => {
      console.error(`[Server Error] ${data}`);
    });

    serverProcess.on('error', (err) => {
      console.error('Failed to start server:', err);
      reject(err);
    });

    serverProcess.on('exit', (code) => {
      console.log(`Server exited with code ${code}`);
    });

    // Give server time to start
    setTimeout(() => {
      resolve();
    }, 3000);
  });
}

// App event handlers
app.whenReady().then(async () => {
  // Ensure database directory exists
  ensureDatabaseDirectory();

  // Start the backend server
  try {
    await startServer();
  } catch (error) {
    console.error('Error starting server:', error);
  }

  // Create the main window
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  // Keep server running when window closes
  // Close server only when app quits
});

app.on('before-quit', () => {
  // Kill the server process
  if (serverProcess) {
    serverProcess.kill();
  }
});

// IPC handlers
ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

ipcMain.handle('get-app-path', () => {
  return app.getPath('userData');
});

ipcMain.handle('restart-server', async () => {
  if (serverProcess) {
    serverProcess.kill();
  }
  await startServer();
});

// Create application menu
const { Menu } = require('electron');

const template = [
  {
    label: 'File',
    submenu: [
      {
        label: 'Exit',
        accelerator: 'CmdOrCtrl+Q',
        click: () => {
          app.quit();
        }
      }
    ]
  },
  {
    label: 'Edit',
    submenu: [
      { role: 'undo' },
      { role: 'redo' },
      { type: 'separator' },
      { role: 'cut' },
      { role: 'copy' },
      { role: 'paste' }
    ]
  },
  {
    label: 'View',
    submenu: [
      { role: 'reload' },
      { role: 'forceReload' },
      { role: 'toggleDevTools' },
      { type: 'separator' },
      { role: 'resetZoom' },
      { role: 'zoomIn' },
      { role: 'zoomOut' }
    ]
  },
  {
    label: 'Help',
    submenu: [
      {
        label: 'About',
        click: () => {
          const { dialog } = require('electron');
          dialog.showMessageBox(mainWindow, {
            type: 'info',
            title: 'About Mini ERP',
            message: 'Mini ERP v1.0.0',
            detail: 'A simple ERP system for small businesses'
          });
        }
      }
    ]
  }
];

const menu = Menu.buildFromTemplate(template);
Menu.setApplicationMenu(menu);
