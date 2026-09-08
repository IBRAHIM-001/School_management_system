const { app, BrowserWindow, Menu, dialog, shell, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const http = require('http');

let mainWindow = null;
const SERVER_PORT = 3000;
const SERVER_URL = `http://localhost:${SERVER_PORT}`;

// Path to SQLite database file
const DB_DIR = path.join(app ? app.getPath('userData') : process.cwd(), 'database');
const DB_PATH = path.join(process.cwd(), 'database', 'school_management.db');

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1360,
    height: 860,
    minWidth: 1024,
    minHeight: 680,
    title: 'Al-qalam Science Academy - School Management System',
    backgroundColor: '#0f172a',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false
    }
  });

  // Check if server is running, or retry until ready
  function loadAppWithRetry(retries = 15) {
    const req = http.get(SERVER_URL, (res) => {
      if (res.statusCode === 200 || res.statusCode === 304) {
        mainWindow.loadURL(SERVER_URL);
      } else {
        fallbackOrRetry();
      }
    });

    req.on('error', () => {
      fallbackOrRetry();
    });

    function fallbackOrRetry() {
      if (retries > 0) {
        setTimeout(() => loadAppWithRetry(retries - 1), 500);
      } else {
        const distIndex = path.join(__dirname, '..', 'dist', 'index.html');
        if (fs.existsSync(distIndex)) {
          mainWindow.loadFile(distIndex);
        } else {
          mainWindow.loadURL(SERVER_URL);
        }
      }
    }
  }

  loadAppWithRetry();

  // Create Application Menu
  const menuTemplate = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Backup SQLite Database (.sqlite)...',
          accelerator: 'CmdOrCtrl+B',
          click: async () => {
            await handleBackupSQLite();
          }
        },
        {
          label: 'Open SQLite Database Folder',
          click: () => {
            const folder = path.join(process.cwd(), 'database');
            if (fs.existsSync(folder)) {
              shell.openPath(folder);
            } else {
              dialog.showMessageBox(mainWindow, {
                type: 'info',
                title: 'Database Folder',
                message: `Database folder: ${folder}`
              });
            }
          }
        },
        { type: 'separator' },
        { role: 'quit', label: 'Exit Application' }
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
        { role: 'paste' },
        { role: 'selectAll' }
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
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About Al-qalam Academy Manager',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'About Al-qalam Academy Manager',
              message: 'Al-qalam Science Academy, Gusau\nSchool Management System\n\n- Packaged with Electron\n- Storage Engine: SQLite 3\n- Version 1.0.0'
            });
          }
        },
        {
          label: 'SQLite Database Information',
          click: () => {
            const exists = fs.existsSync(DB_PATH);
            const size = exists ? (fs.statSync(DB_PATH).size / 1024).toFixed(1) + ' KB' : 'Not yet created';
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'SQLite Database Status',
              message: `SQLite Storage Engine: Active\nFile Location: ${DB_PATH}\nSize: ${size}\nStatus: Connected`
            });
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(menu);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

async function handleBackupSQLite() {
  if (!mainWindow) return;
  if (!fs.existsSync(DB_PATH)) {
    dialog.showMessageBox(mainWindow, {
      type: 'warning',
      title: 'Database File',
      message: 'No SQLite database file found on disk yet. Start using the system to create it.'
    });
    return;
  }

  const { filePath } = await dialog.showSaveDialog(mainWindow, {
    title: 'Backup SQLite Database',
    defaultPath: `alqalam_backup_${new Date().toISOString().split('T')[0]}.sqlite`,
    filters: [
      { name: 'SQLite Database (*.sqlite;*.db)', extensions: ['sqlite', 'db'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });

  if (filePath) {
    try {
      fs.copyFileSync(DB_PATH, filePath);
      dialog.showMessageBox(mainWindow, {
        type: 'info',
        title: 'Backup Successful',
        message: `SQLite database backed up successfully to:\n${filePath}`
      });
    } catch (e) {
      dialog.showErrorBox('Backup Error', `Failed to copy SQLite database: ${e.message}`);
    }
  }
}

// IPC Handlers
ipcMain.handle('get-sqlite-info', () => {
  const exists = fs.existsSync(DB_PATH);
  return {
    engine: 'SQLite 3',
    path: DB_PATH,
    exists,
    sizeBytes: exists ? fs.statSync(DB_PATH).size : 0
  };
});

ipcMain.handle('backup-sqlite-db', async () => {
  await handleBackupSQLite();
});

ipcMain.handle('open-data-folder', () => {
  const folder = path.join(process.cwd(), 'database');
  if (fs.existsSync(folder)) {
    shell.openPath(folder);
    return true;
  }
  return false;
});

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
