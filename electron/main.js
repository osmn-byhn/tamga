import { app, BrowserWindow, Menu, nativeImage, ipcMain, desktopCapturer, dialog, clipboard } from "electron";
import { updateIfNeeded } from "@osmn-byhn/changelog-github-updater";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";

const __dirname = import.meta.dirname;

// Set application name early for Linux/Windows
app.setName("Tamga");

const dataPath = path.join(app.getPath("userData"), "vault.dat");
const isBuilt = __dirname.includes(path.sep + '.vite' + path.sep) || __dirname.endsWith(path.sep + '.vite');

const APP_PATH = app.getAppPath();
process.env.APP_ROOT = APP_PATH;

// Robust preload path resolution
let preload = path.join(APP_PATH, "electron/preload.cjs");
if (!fs.existsSync(preload)) {
    preload = path.join(APP_PATH, "dist/preload.cjs");
}
if (!fs.existsSync(preload)) {
    preload = path.join(__dirname, "preload.cjs");
}

console.log("[Main] Final Preload Path:", preload);

function readVault() {
  if (!fs.existsSync(dataPath)) return null;
  return fs.readFileSync(dataPath);
}

// Dosyaya yaz
function writeVault(encryptedData) {
  fs.writeFileSync(dataPath, encryptedData);
}

export const MAIN_DIST = path.join(APP_PATH, "dist-electron");
export const RENDERER_DIST = path.join(APP_PATH, "dist");
export const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL;

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(APP_PATH, "public")
  : RENDERER_DIST;

// Disable GPU Acceleration for Windows 7
if (process.platform === "win32") app.disableHardwareAcceleration();

// Set application name for Windows 10+ notifications
if (process.platform === "win32") app.setAppUserModelId(app.getName());

// Remove menu bar
Menu.setApplicationMenu(null);

if (!app.requestSingleInstanceLock()) {
  app.quit();
  process.exit(0);
}

let win = null;
const indexHtml = path.join(RENDERER_DIST, "index.html");

async function createWindow() {
  const iconFile = process.platform === 'win32' ? 'tamga.ico' : 'tamga.png';
  const iconPath = path.join(process.env.VITE_PUBLIC, iconFile);
  const iconImage = nativeImage.createFromPath(iconPath);
  console.log("Setting window icon from:", iconPath);
  console.log("Icon image size:", iconImage.getSize());
  console.log("Icon image is empty:", iconImage.isEmpty());

  win = new BrowserWindow({
    title: "Tamga",
    width: 1200,
    height: 800,
    icon: iconImage,
    autoHideMenuBar: true,
    titleBarStyle: 'hidden',
    webPreferences: {
      preload,
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false,
      sandbox: false,
    },
  });

  // Explicitly set icon again for some Linux environments with a small delay
  if (!iconImage.isEmpty()) {
    setTimeout(() => {
      if (win) win.setIcon(iconImage);
    }, 500);
  }

  // Enable screen capture
  win.webContents.session.setDisplayMediaRequestHandler((request, callback) => {
    desktopCapturer.getSources({ types: ['screen'] }).then((sources) => {
      if (sources.length > 0) {
        callback({ video: sources[0], audio: 'loopback' });
      } else {
        callback(null);
      }
    });
  });

  // Test active push message to Renderer-process
  win.webContents.on("did-finish-load", () => {
    win?.webContents.send("main-process-message", new Date().toLocaleString());
  });

  // Debug: Log errors
  win.webContents.on(
    "did-fail-load",
    (event, errorCode, errorDescription, validatedURL) => {
      console.error(
        "Failed to load:",
        errorCode,
        errorDescription,
        validatedURL,
      );
    },
  );

  win.webContents.on("console-message", (event, level, message) => {
    console.log("Renderer console:", level, message);
  });

  // Load URL or File
  if (typeof MAIN_WINDOW_VITE_DEV_SERVER_URL !== 'undefined') {
    console.log("Loading from Forge dev server:", MAIN_WINDOW_VITE_DEV_SERVER_URL);
    await win.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
    win.webContents.openDevTools();
  } else if (process.env.VITE_DEV_SERVER_URL) {
    console.log("Loading from custom dev server:", process.env.VITE_DEV_SERVER_URL);
    await win.loadURL(process.env.VITE_DEV_SERVER_URL);
    win.webContents.openDevTools();
  } else {
    // Production Mode
    const htmlPath = path.join(RENDERER_DIST, "index.html");
    console.log("Loading from file:", htmlPath);
    console.log("Index.html exists:", fs.existsSync(htmlPath));
    
    // Try both loadFile and loadURL for maximum compatibility
    try {
      await win.loadFile(htmlPath);
    } catch (err) {
      console.error("loadFile failed, trying loadURL:", err);
      await win.loadURL(`file://${htmlPath}`);
    }
  }
}

app.whenReady().then(() => {
  createWindow();

  ipcMain.handle('check-updates', async () => {
    try {
      const result = await updateIfNeeded({
        owner: 'osmn-byhn',
        repo: 'tamga',
        autoInstall: true
      });
      return { success: true, ...result };
    } catch (error) {
      console.error("Update error:", error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('save-file', async (event, { content, defaultPath }) => {
    try {
      const { canceled, filePath } = await dialog.showSaveDialog(win, {
        defaultPath,
        filters: [{ name: 'JSON', extensions: ['json'] }]
      });
      
      if (!canceled && filePath) {
        fs.writeFileSync(filePath, content);
        return { success: true, filePath };
      }
      return { success: false, canceled: true };
    } catch (error) {
      console.error("Save file error:", error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('select-directory', async () => {
    try {
      const { canceled, filePaths } = await dialog.showOpenDialog(win, {
        properties: ['openDirectory']
      });
      if (!canceled && filePaths.length > 0) {
        return { success: true, path: filePaths[0] };
      }
      return { success: false, canceled: true };
    } catch (error) {
      console.error("Select directory error:", error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('write-file-direct', async (event, { content, filePath }) => {
    try {
      fs.writeFileSync(filePath, content);
      return { success: true };
    } catch (error) {
      console.error("Write file direct error:", error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('clipboard-write', async (event, text) => {
    clipboard.writeText(text);
    return true;
  });

  ipcMain.handle('clipboard-read', async () => {
    return clipboard.readText();
  });

  // Window Controls
  ipcMain.on('window-minimize', () => {
    win?.minimize();
  });

  ipcMain.on('window-maximize', () => {
    if (win?.isMaximized()) {
      win.unmaximize();
    } else {
      win?.maximize();
    }
  });

  ipcMain.on('window-close', () => {
    win?.close();
  });
});

app.on("window-all-closed", () => {
  win = null;
  if (process.platform !== "darwin") app.quit();
});

app.on("second-instance", () => {
  if (win) {
    // Focus on the main window if the user tried to open another
    if (win.isMinimized()) win.restore();
    win.focus();
  }
});

app.on("activate", () => {
  const allWindows = BrowserWindow.getAllWindows();
  if (allWindows.length) {
    allWindows[0].focus();
  } else {
    createWindow();
  }
});
