import { app, BrowserWindow, Menu } from "electron";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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
process.env.APP_ROOT = path.join(__dirname, "../");

function readVault() {
  if (!fs.existsSync(dataPath)) return null;
  return fs.readFileSync(dataPath);
}

// Dosyaya yaz
function writeVault(encryptedData) {
  fs.writeFileSync(dataPath, encryptedData);
}

export const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
export const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");
export const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL;

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, "public")
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
const preload = path.join(__dirname, "preload.js");
const indexHtml = path.join(RENDERER_DIST, "index.html");

async function createWindow() {
  const iconPath = path.join(process.env.VITE_PUBLIC, "tamga.png");
  console.log("Icon path:", iconPath);
  console.log("Icon exists:", fs.existsSync(iconPath));

  win = new BrowserWindow({
    title: "Tamga",
    width: 1200,
    height: 800,
    icon: iconPath,
    autoHideMenuBar: true, // Hide menu bar
    webPreferences: {
      preload,
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false, // Allow loading from dev server
    },
  });

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

  // Try to load from dev server first
  const devServerUrl =
    process.env.VITE_DEV_SERVER_URL || "http://localhost:5173";

  if (process.env.NODE_ENV === "development" || VITE_DEV_SERVER_URL) {
    try {
      console.log("Loading from dev server:", devServerUrl);
      await win.loadURL(devServerUrl);
      // Open devTool if the app is not packaged
      win.webContents.openDevTools();
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
