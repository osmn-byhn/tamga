import { app, BrowserWindow, Menu, nativeImage } from "electron";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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
// APP_ROOT detection: from .vite/build/ we need ../../, from electron/ we need ../
// We detect by checking if we're inside a .vite directory
const isBuilt = __dirname.includes(path.sep + '.vite' + path.sep) || __dirname.endsWith(path.sep + '.vite');
process.env.APP_ROOT = isBuilt
  ? path.join(__dirname, "../../")
  : path.join(__dirname, "../");

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
const preload = path.join(__dirname, "preload.cjs");
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
    // Forge Vite Dev Server
    console.log("Loading from Forge dev server:", MAIN_WINDOW_VITE_DEV_SERVER_URL);
    await win.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
    win.webContents.openDevTools();
  } else if (process.env.VITE_DEV_SERVER_URL) {
    // Custom Vite Dev Server (our electron:dev script)
    console.log("Loading from custom dev server:", process.env.VITE_DEV_SERVER_URL);
    await win.loadURL(process.env.VITE_DEV_SERVER_URL);
    win.webContents.openDevTools();
  } else {
    // Production Mode
    let htmlPath;
    if (typeof MAIN_WINDOW_VITE_NAME !== 'undefined') {
      // Packaged via Electron Forge plugin-vite
      htmlPath = path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`);
    } else {
      // Packaged manually or running compiled index.html
      htmlPath = path.join(RENDERER_DIST, "index.html");
    }
    console.log("Loading from file:", htmlPath);
    win.loadFile(htmlPath);
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
