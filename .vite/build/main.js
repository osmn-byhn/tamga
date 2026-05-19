import { createRequire as __cjsRequire } from "module";
const require = __cjsRequire(import.meta.url);
import { BrowserWindow, Menu, app, clipboard, desktopCapturer, dialog, ipcMain, nativeImage } from "electron";
import "node:url";
import path from "node:path";
import fs from "node:fs";
var __commonJSMin = (e, f) => () => (f || e((f = { exports: {} }).exports, f), f.exports), __require = /* @__PURE__ */ ((e) => require === void 0 ? typeof Proxy < "u" ? new Proxy(e, { get: (e, p) => (require === void 0 ? e : require)[p] }) : e : require)(function(e) {
	if (require !== void 0) return require.apply(this, arguments);
	throw Error("Calling `require` for \"" + e + "\" in an environment that doesn't expose the `require` function.");
}), require_dist$1 = /* @__PURE__ */ __commonJSMin(((e, f) => {
	var p = Object.defineProperty, m = Object.getOwnPropertyDescriptor, h = Object.getOwnPropertyNames, g = Object.prototype.hasOwnProperty, _ = (e, f) => {
		for (var m in f) p(e, m, {
			get: f[m],
			enumerable: !0
		});
	}, v = (e, f, _, v) => {
		if (f && typeof f == "object" || typeof f == "function") for (let y of h(f)) !g.call(e, y) && y !== _ && p(e, y, {
			get: () => f[y],
			enumerable: !(v = m(f, y)) || v.enumerable
		});
		return e;
	}, y = (e) => v(p({}, "__esModule", { value: !0 }), e), b = {};
	_(b, { GithubFetcher: () => C }), f.exports = y(b);
	function x(e) {
		let f = e.match(/v?(\d+)\.(\d+)\.(\d+)(?:-.*)?/i);
		return f ? [
			parseInt(f[1], 10),
			parseInt(f[2], 10),
			parseInt(f[3], 10)
		] : null;
	}
	function S(e, f) {
		if (!f) return "initial";
		let p = x(e), m = x(f);
		return !p || !m ? "unknown" : p[0] > m[0] ? "major" : p[1] > m[1] ? "minor" : p[2] > m[2] ? "patch" : "unknown";
	}
	var C = class {
		constructor(e, f, p) {
			this.owner = e, this.repo = f, this.token = p;
		}
		async fetchReleases(e = 1, f = 30) {
			let p = `https://api.github.com/repos/${this.owner}/${this.repo}/releases?page=${e}&per_page=${f}`, m = { Accept: "application/vnd.github.v3+json" };
			this.token && (m.Authorization = `token ${this.token}`);
			let h = await fetch(p, { headers: m });
			if (!h.ok) throw Error(`Failed to fetch GitHub releases: ${h.status} ${h.statusText}`);
			return await h.json();
		}
		async fetchAndProcessReleases(e = 30) {
			let f = [], p = 1;
			for (; f.length < e;) {
				let m = Math.min(100, e - f.length), h = await this.fetchReleases(p, m);
				if (h.length === 0) break;
				f = f.concat(h), p++;
			}
			let m = [];
			for (let e = 0; e < f.length; e++) {
				let p = f[e], h = e < f.length - 1 ? f[e + 1] : null, g = S(p.tag_name, h ? h.tag_name : null);
				m.push({
					...p,
					versionGroup: g,
					previousVersion: h ? h.tag_name : null
				});
			}
			return m;
		}
	};
})), require_versionManager = /* @__PURE__ */ __commonJSMin(((e) => {
	var f = e && e.__importDefault || function(e) {
		return e && e.__esModule ? e : { default: e };
	};
	Object.defineProperty(e, "__esModule", { value: !0 }), e.setCurrentVersion = e.getCurrentVersion = e.getVersionFile = void 0;
	var p = f(__require("fs")), m = f(__require("path")), h = f(__require("os"));
	e.getVersionFile = (e) => e ? m.default.resolve(e, "updater-version.json") : m.default.join(h.default.tmpdir(), "changelog-github-updater-version.json"), e.getCurrentVersion = (f) => {
		let m = (0, e.getVersionFile)(f);
		if (!p.default.existsSync(m)) return null;
		let h = p.default.readFileSync(m, "utf-8");
		try {
			return JSON.parse(h).currentVersion;
		} catch {
			return null;
		}
	}, e.setCurrentVersion = (f, m) => {
		let h = (0, e.getVersionFile)(m);
		p.default.writeFileSync(h, JSON.stringify({ currentVersion: f }, null, 2));
	};
})), require_updater = /* @__PURE__ */ __commonJSMin(((e) => {
	var f = e && e.__importDefault || function(e) {
		return e && e.__esModule ? e : { default: e };
	};
	Object.defineProperty(e, "__esModule", { value: !0 }), e.updateIfNeeded = e.installUpdate = e.getOSAssetExtension = e.downloadAsset = void 0;
	var p = require_dist$1(), m = require_versionManager(), h = f(__require("os")), g = f(__require("https")), _ = f(__require("fs")), v = f(__require("path")), y = __require("child_process"), b = f(__require("process"));
	e.downloadAsset = (f, p) => new Promise((m, h) => {
		let v = _.default.createWriteStream(p);
		g.default.get(f, (g) => {
			if (g.statusCode === 301 || g.statusCode === 302) return (0, e.downloadAsset)(g.headers.location, p).then(m).catch(h);
			if (g.statusCode !== 200) {
				h(/* @__PURE__ */ Error(`Failed to get '${f}' (${g.statusCode})`));
				return;
			}
			g.pipe(v), v.on("finish", () => {
				v.close(), m();
			});
		}).on("error", (e) => {
			_.default.unlink(p, () => h(e));
		});
	}), e.getOSAssetExtension = () => {
		let e = h.default.platform();
		return e === "win32" ? [".exe"] : e === "darwin" ? [".dmg", ".zip"] : e === "linux" ? [
			".deb",
			".AppImage",
			".rpm",
			".tar.gz"
		] : [];
	}, e.installUpdate = (e) => {
		let f = h.default.platform();
		try {
			f === "win32" ? ((0, y.spawn)(e, {
				detached: !0,
				stdio: "ignore"
			}).unref(), b.default.exit()) : f === "darwin" ? (0, y.exec)(`open "${e}"`) : f === "linux" && (e.endsWith(".deb") ? (0, y.exec)(`pkexec dpkg -i "${e}"`, (e, f, p) => {
				e && console.error("Update failed:", e);
			}) : e.endsWith(".AppImage") ? ((0, y.exec)(`chmod +x "${e}" && "${e}"`), b.default.exit()) : (0, y.exec)(`xdg-open "${e}"`));
		} catch (e) {
			console.error("Install step failed", e);
		}
	}, e.updateIfNeeded = async (f, g) => {
		let { owner: _, repo: y, currentVersion: b, tempPath: x, autoInstall: S } = f, C = await new p.GithubFetcher(_, y).fetchAndProcessReleases();
		if (!C || C.length === 0) return { updated: !1 };
		let w = C[0], T = w.tag_name, E = b || (0, m.getCurrentVersion)(x);
		if (E !== T) {
			if (g) try {
				await g(E || "none", T);
			} catch (e) {
				console.error("Middleware çalıştırılırken hata:", e);
			}
			if (S !== !1 && w.assets && w.assets.length > 0) {
				let f = (0, e.getOSAssetExtension)(), p = w.assets.find((e) => f.some((f) => e.name.endsWith(f)));
				if (p && p.browser_download_url) {
					console.log(`Downloading update: ${p.name}...`);
					let f = x || h.default.tmpdir(), m = v.default.join(f, p.name);
					try {
						await (0, e.downloadAsset)(p.browser_download_url, m), console.log(`Download complete: ${m}`), (0, e.installUpdate)(m);
					} catch (e) {
						console.error("İndirme sırasında hata:", e);
					}
				} else console.warn("Uygun bir kurulum dosyası (asset) bulunamadı.");
			}
			return (0, m.setCurrentVersion)(T, x), {
				updated: !0,
				from: E,
				to: T
			};
		}
		return {
			updated: !1,
			from: E
		};
	};
})), require_types = /* @__PURE__ */ __commonJSMin(((e) => {
	Object.defineProperty(e, "__esModule", { value: !0 });
})), import_dist = (/* @__PURE__ */ __commonJSMin(((e) => {
	var f = e && e.__createBinding || (Object.create ? (function(e, f, p, m) {
		m === void 0 && (m = p);
		var h = Object.getOwnPropertyDescriptor(f, p);
		(!h || ("get" in h ? !f.__esModule : h.writable || h.configurable)) && (h = {
			enumerable: !0,
			get: function() {
				return f[p];
			}
		}), Object.defineProperty(e, m, h);
	}) : (function(e, f, p, m) {
		m === void 0 && (m = p), e[m] = f[p];
	})), p = e && e.__exportStar || function(e, p) {
		for (var m in e) m !== "default" && !Object.prototype.hasOwnProperty.call(p, m) && f(p, e, m);
	};
	Object.defineProperty(e, "__esModule", { value: !0 }), p(require_updater(), e), p(require_types(), e), p(require_versionManager(), e);
})))(), __dirname = import.meta.dirname;
app.setName("Tamga"), path.join(app.getPath("userData"), "vault.dat"), __dirname.includes(path.sep + ".vite" + path.sep) || __dirname.endsWith(path.sep + ".vite");
var APP_PATH = app.getAppPath();
process.env.APP_ROOT = APP_PATH;
var preload = path.join(APP_PATH, "electron/preload.cjs");
fs.existsSync(preload) || (preload = path.join(APP_PATH, "dist/preload.cjs")), fs.existsSync(preload) || (preload = path.join(__dirname, "preload.cjs")), console.log("[Main] Final Preload Path:", preload);
const MAIN_DIST = path.join(APP_PATH, "dist-electron"), RENDERER_DIST = path.join(APP_PATH, "dist"), VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL;
process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(APP_PATH, "public") : RENDERER_DIST, process.platform === "win32" && app.disableHardwareAcceleration(), process.platform === "win32" && app.setAppUserModelId(app.getName()), Menu.setApplicationMenu(null), app.requestSingleInstanceLock() || (app.quit(), process.exit(0));
var win = null;
path.join(RENDERER_DIST, "index.html");
async function createWindow() {
	let e = process.platform === "win32" ? "tamga.ico" : "tamga.png", f = path.join(process.env.VITE_PUBLIC, e), m = nativeImage.createFromPath(f);
	if (console.log("Setting window icon from:", f), console.log("Icon image size:", m.getSize()), console.log("Icon image is empty:", m.isEmpty()), win = new BrowserWindow({
		title: "Tamga",
		width: 1200,
		height: 800,
		icon: m,
		autoHideMenuBar: !0,
		titleBarStyle: "hidden",
		webPreferences: {
			preload,
			nodeIntegration: !1,
			contextIsolation: !0,
			webSecurity: !1,
			sandbox: !1
		}
	}), m.isEmpty() || setTimeout(() => {
		win && win.setIcon(m);
	}, 500), win.webContents.session.setDisplayMediaRequestHandler((e, f) => {
		desktopCapturer.getSources({ types: ["screen"] }).then((e) => {
			e.length > 0 ? f({
				video: e[0],
				audio: "loopback"
			}) : f(null);
		});
	}), win.webContents.on("did-finish-load", () => {
		win?.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
	}), win.webContents.on("did-fail-load", (e, f, p, m) => {
		console.error("Failed to load:", f, p, m);
	}), win.webContents.on("console-message", (e, f, p) => {
		console.log("Renderer console:", f, p);
	}), typeof MAIN_WINDOW_VITE_DEV_SERVER_URL < "u") console.log("Loading from Forge dev server:", MAIN_WINDOW_VITE_DEV_SERVER_URL), await win.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL), win.webContents.openDevTools();
	else if (process.env.VITE_DEV_SERVER_URL) console.log("Loading from custom dev server:", process.env.VITE_DEV_SERVER_URL), await win.loadURL(process.env.VITE_DEV_SERVER_URL), win.webContents.openDevTools();
	else {
		let e = path.join(RENDERER_DIST, "index.html");
		console.log("Loading from file:", e), console.log("Index.html exists:", fs.existsSync(e));
		try {
			await win.loadFile(e);
		} catch (f) {
			console.error("loadFile failed, trying loadURL:", f), await win.loadURL(`file://${e}`);
		}
	}
}
app.whenReady().then(() => {
	createWindow(), ipcMain.handle("check-updates", async () => {
		try {
			return {
				success: !0,
				...await (0, import_dist.updateIfNeeded)({
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
	}), ipcMain.handle("save-file", async (e, { content: f, defaultPath: p }) => {
		try {
			let { canceled: e, filePath: m } = await dialog.showSaveDialog(win, {
				defaultPath: p,
				filters: [{
					name: "JSON",
					extensions: ["json"]
				}]
			});
			return !e && m ? (fs.writeFileSync(m, f), {
				success: !0,
				filePath: m
			}) : {
				success: !1,
				canceled: !0
			};
		} catch (e) {
			return console.error("Save file error:", e), {
				success: !1,
				error: e.message
			};
		}
	}), ipcMain.handle("select-directory", async () => {
		try {
			let { canceled: e, filePaths: f } = await dialog.showOpenDialog(win, { properties: ["openDirectory"] });
			return !e && f.length > 0 ? {
				success: !0,
				path: f[0]
			} : {
				success: !1,
				canceled: !0
			};
		} catch (e) {
			return console.error("Select directory error:", e), {
				success: !1,
				error: e.message
			};
		}
	}), ipcMain.handle("write-file-direct", async (e, { content: f, filePath: p }) => {
		try {
			return fs.writeFileSync(p, f), { success: !0 };
		} catch (e) {
			return console.error("Write file direct error:", e), {
				success: !1,
				error: e.message
			};
		}
	}), ipcMain.handle("clipboard-write", async (e, f) => (clipboard.writeText(f), !0)), ipcMain.handle("clipboard-read", async () => clipboard.readText()), ipcMain.on("window-minimize", () => {
		win?.minimize();
	}), ipcMain.on("window-maximize", () => {
		win?.isMaximized() ? win.unmaximize() : win?.maximize();
	}), ipcMain.on("window-close", () => {
		win?.close();
	});
}), app.on("window-all-closed", () => {
	win = null, process.platform !== "darwin" && app.quit();
}), app.on("second-instance", () => {
	win && (win.isMinimized() && win.restore(), win.focus());
}), app.on("activate", () => {
	let e = BrowserWindow.getAllWindows();
	e.length ? e[0].focus() : createWindow();
});
export { MAIN_DIST, RENDERER_DIST, VITE_DEV_SERVER_URL };
