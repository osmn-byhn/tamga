import { BrowserWindow, Menu, app, nativeImage } from "electron";
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
	let u = process.platform === "win32" ? "tamga.ico" : "tamga.png", d = path.join(process.env.VITE_PUBLIC, u), p = nativeImage.createFromPath(d);
	if (console.log("Setting window icon from:", d), console.log("Icon image size:", p.getSize()), console.log("Icon image is empty:", p.isEmpty()), win = new BrowserWindow({
		title: "Tamga",
		width: 1200,
		height: 800,
		icon: p,
		autoHideMenuBar: !0,
		webPreferences: {
			preload,
			nodeIntegration: !1,
			contextIsolation: !0,
			webSecurity: !1
		}
	}), p.isEmpty() || setTimeout(() => {
		win && win.setIcon(p);
	}, 500), win.webContents.session.setDisplayMediaRequestHandler((e, u) => {
		import("electron").then(({ desktopCapturer: e }) => {
			e.getSources({ types: ["screen"] }).then((e) => {
				e.length > 0 ? u({
					video: e[0],
					audio: "loopback"
				}) : u(null);
			});
		});
	}), win.webContents.on("did-finish-load", () => {
		win?.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
	}), win.webContents.on("did-fail-load", (e, u, d, f) => {
		console.error("Failed to load:", u, d, f);
	}), win.webContents.on("console-message", (e, u, d) => {
		console.log("Renderer console:", u, d);
	}), process.env.VITE_DEV_SERVER_URL) console.log("Loading from custom dev server:", process.env.VITE_DEV_SERVER_URL), await win.loadURL(process.env.VITE_DEV_SERVER_URL), win.webContents.openDevTools();
	else {
		let e;
		e = path.join(__dirname, "../renderer/main_window/index.html"), console.log("Loading from file:", e), win.loadFile(e);
	}
}
app.whenReady().then(createWindow), app.on("window-all-closed", () => {
	win = null, process.platform !== "darwin" && app.quit();
}), app.on("second-instance", () => {
	win && (win.isMinimized() && win.restore(), win.focus());
}), app.on("activate", () => {
	let u = BrowserWindow.getAllWindows();
	u.length ? u[0].focus() : createWindow();
});
export { MAIN_DIST, RENDERER_DIST, VITE_DEV_SERVER_URL };
