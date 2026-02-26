import { app, BrowserWindow, Menu, nativeImage, dialog } from "electron";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";

// Safe __dirname detection
const _dirname = typeof __dirname !== 'undefined'
  ? __dirname
  : path.dirname(fileURLToPath(import.meta.url));

// Set application name early for Linux/Windows
app.setName("Tamga");

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬─┬ dist-electron
// │ │ │ ├── main.js
// │ │ │ └── preload.js
// │ │
//

const dataPath = path.join(app.getPath("userData"), "vault.dat");

// Robust path detection for packaged apps
const isPackaged = app.isPackaged;
process.env.APP_ROOT = isPackaged
  ? path.join(app.getAppPath(), "..", "..") // resources/app.asar -> resources/
  : path.join(_dirname, "..");              // electron/ -> project root

// For renderer files, use app.getAppPath() when packaged as it points into the ASAR
const rendererBase = isPackaged ? app.getAppPath() : process.env.APP_ROOT;

export const RENDERER_DIST = path.join(rendererBase, "dist");
export const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL;

process.env.VITE_PUBLIC = (process.env.NODE_ENV === "development" || VITE_DEV_SERVER_URL)
  ? path.join(process.env.APP_ROOT, "public")
  : RENDERER_DIST;

function readVault() {
  if (!fs.existsSync(dataPath)) return null;
  return fs.readFileSync(dataPath);
}

// Dosyaya yaz
function writeVault(encryptedData) {
  fs.writeFileSync(dataPath, encryptedData);
}

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
const preload = path.join(_dirname, "preload.cjs");

const indexHtml = (function () {
  const appPath = app.getAppPath();

  // When using 'extraResources' in forge.config.js, the dist/ folder is
  // copied to the 'resources/' directory, which is ONE LEVEL UP from app.asar.
  const candidates = [
    path.join(appPath, "..", "dist", "index.html"),        // extraResources location (resources/dist/)
    path.join(appPath, "dist", "index.html"),              // inside ASAR
    path.join(appPath, ".vite", "renderer", "main_window", "index.html"),
    path.join(appPath, "..", "renderer", "main_window", "index.html"),
    path.join(appPath, "index.html"),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }

  return path.join(appPath, "..", "dist", "index.html"); // Default fallback
})();

async function createWindow() {
  const iconPath = path.join(process.env.VITE_PUBLIC, "tamga.ico");
  const iconImage = nativeImage.createFromPath(iconPath);
  console.log("Setting window icon from:", iconPath);
  console.log("Icon image size:", iconImage.getSize());
  console.log("Icon image is empty:", iconImage.isEmpty());

  win = new BrowserWindow({
    title: "TAMGA VERSION 300",
    width: 1200,
    height: 800,
    icon: iconImage,
    autoHideMenuBar: true,
    webPreferences: {
      preload,
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false,
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
    // Automatically allow the first source (usually the entire screen)
    // Or open a picker if multiple sources needed. 
    // For "Select Region" logic in frontend, user usually wants the whole screen first.
    // However, Electron requires us to select a source.
    // We can list sources and pick the first one (screen) or show a default picker.
    // Let's use the default picker for now as it's safest, or auto-select the first screen.

    // Simple implementation: grant access to the first screen available
    // desktopCapturer is needed in main process to list sources if we want to auto-select
    // But request handler uses a different callback structure. 

    // To show standard picker:
    // callback({ video: request.video, audio: request.audio }); 
    // BUT we need to select a specific sourceId. 

    // Let's try to find a screen source.
    import('electron').then(({ desktopCapturer }) => {
      desktopCapturer.getSources({ types: ['screen'] }).then((sources) => {
        // Find the primary display or just take the first one
        if (sources.length > 0) {
          callback({ video: sources[0], audio: 'loopback' });
        } else {
          // Fallback to standard picker if no screen found (unlikely)
          callback(null);
        }
      });
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
      let debugInfo = "--- DEBUG INFO V2 ---\n";
      try {
        const appPath = app.getAppPath();
        const files = fs.readdirSync(appPath, { recursive: true }).slice(0, 30);
        debugInfo += `App Path: ${appPath}\n`;
        debugInfo += `Found indexHtml candidate: ${indexHtml}\n`;
        debugInfo += `Node Env: ${process.env.NODE_ENV}\n`;
        debugInfo += `Files in App:\n${files.join("\n")}`;
      } catch (e) {
        debugInfo += `Could not list files: ${e.message}`;
      }

      const errorMsg = `ERROR: ${errorCode} (${errorDescription})\nURL: ${validatedURL}\n\n${debugInfo}`;
      console.error(errorMsg);
      if (app.isPackaged) {
        dialog.showErrorBox("DEBUG VERSION - Startup Error", errorMsg);
      }
    },
  );

  win.webContents.on("console-message", (event, level, message) => {
    console.log("Renderer console:", level, message);
  });

  // Try to load from dev server first
  const devServerUrl =
    process.env.VITE_DEV_SERVER_URL || "http://localhost:5173";

  if (process.env.NODE_ENV === "development" || VITE_DEV_SERVER_URL) {
    try {
      console.log("Loading from dev server:", devServerUrl);
      await win.loadURL(devServerUrl);
      // Open devTool if the app is not packaged
      // win.webContents.openDevTools();
      console.log("Debug: DevTools auto-open is DISABLED in main.js");
    } catch (error) {
      console.error("Failed to load from dev server, trying file:", error);
      win.loadFile(indexHtml);
    }
  } else {
    // Load from built files
    console.log("Loading from file:", indexHtml);
    win.loadFile(indexHtml);
  }
}

app.whenReady().then(createWindow);

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
