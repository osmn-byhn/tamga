import { BrowserWindow, Menu, app, ipcMain, nativeImage } from "electron";
import { updateIfNeeded } from "@osmn-byhn/changelog-github-updater";
import { fileURLToPath } from "node:url";
import path from "node:path";
import "node:fs";
var __dirname = path.dirname(fileURLToPath(import.meta.url));
app.setName("Tamga"), path.join(app.getPath("userData"), "vault.dat");
var isBuilt = __dirname.includes(path.sep + ".vite" + path.sep) || __dirname.endsWith(path.sep + ".vite");
process.env.APP_ROOT = isBuilt ? path.join(__dirname, "../../") : path.join(__dirname, "../");
const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron"), RENDERER_DIST = path.join(process.env.APP_ROOT, "dist"), VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL;
process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, "public") : RENDERER_DIST, process.platform === "win32" && app.disableHardwareAcceleration(), process.platform === "win32" && app.setAppUserModelId(app.getName()), Menu.setApplicationMenu(null), app.requestSingleInstanceLock() || (app.quit(), process.exit(0));
var win = null, preload = path.join(__dirname, "preload.cjs");
path.join(RENDERER_DIST, "index.html");
async function createWindow() {
	let p = process.platform === "win32" ? "tamga.ico" : "tamga.png", m = path.join(process.env.VITE_PUBLIC, p), h = nativeImage.createFromPath(m);
	if (console.log("Setting window icon from:", m), console.log("Icon image size:", h.getSize()), console.log("Icon image is empty:", h.isEmpty()), win = new BrowserWindow({
		title: "Tamga",
		width: 1200,
		height: 800,
		icon: h,
		autoHideMenuBar: !0,
		webPreferences: {
			preload,
			nodeIntegration: !1,
			contextIsolation: !0,
			webSecurity: !1
		}
	}), h.isEmpty() || setTimeout(() => {
		win && win.setIcon(h);
	}, 500), win.webContents.session.setDisplayMediaRequestHandler((e, p) => {
		import("electron").then(({ desktopCapturer: e }) => {
			e.getSources({ types: ["screen"] }).then((e) => {
				e.length > 0 ? p({
					video: e[0],
					audio: "loopback"
				}) : p(null);
			});
		});
	}), win.webContents.on("did-finish-load", () => {
		win?.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
	}), win.webContents.on("did-fail-load", (e, p, m, h) => {
		console.error("Failed to load:", p, m, h);
	}), win.webContents.on("console-message", (e, p, m) => {
		console.log("Renderer console:", p, m);
	}), process.env.VITE_DEV_SERVER_URL) console.log("Loading from custom dev server:", process.env.VITE_DEV_SERVER_URL), await win.loadURL(process.env.VITE_DEV_SERVER_URL), win.webContents.openDevTools();
	else {
		let e;
		e = path.join(__dirname, "../renderer/main_window/index.html"), console.log("Loading from file:", e), win.loadFile(e);
	}
}
app.whenReady().then(() => {
	createWindow(), ipcMain.handle("check-updates", async () => {
		try {
			return {
				success: !0,
				...await updateIfNeeded({
					owner: "osmn-byhn",
					repo: "tamga",
					autoInstall: !0
				})
			};
		} catch (e) {
			return console.error("Update error:", e), {
				success: !1,
				error: e.message
			};
		}
	});
}), app.on("window-all-closed", () => {
	win = null, process.platform !== "darwin" && app.quit();
}), app.on("second-instance", () => {
	win && (win.isMinimized() && win.restore(), win.focus());
}), app.on("activate", () => {
	let p = BrowserWindow.getAllWindows();
	p.length ? p[0].focus() : createWindow();
});
export { MAIN_DIST, RENDERER_DIST, VITE_DEV_SERVER_URL };
