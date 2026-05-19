import { createRequire as __cjsRequire } from "module";
const require = __cjsRequire(import.meta.url);
import { BrowserWindow, Menu, app, desktopCapturer, dialog, ipcMain, nativeImage } from "electron";
import "node:url";
import path from "node:path";
import fs from "node:fs";
var __commonJSMin = (e, d) => () => (d || e((d = { exports: {} }).exports, d), d.exports), __require = /* @__PURE__ */ ((e) => require === void 0 ? typeof Proxy < "u" ? new Proxy(e, { get: (e, f) => (require === void 0 ? e : require)[f] }) : e : require)(function(e) {
	if (require !== void 0) return require.apply(this, arguments);
	throw Error("Calling `require` for \"" + e + "\" in an environment that doesn't expose the `require` function.");
}), require_dist$1 = /* @__PURE__ */ __commonJSMin(((e, d) => {
	var f = Object.defineProperty, p = Object.getOwnPropertyDescriptor, m = Object.getOwnPropertyNames, h = Object.prototype.hasOwnProperty, g = (e, d) => {
		for (var p in d) f(e, p, {
			get: d[p],
			enumerable: !0
		});
	}, _ = (e, d, g, _) => {
		if (d && typeof d == "object" || typeof d == "function") for (let v of m(d)) !h.call(e, v) && v !== g && f(e, v, {
			get: () => d[v],
			enumerable: !(_ = p(d, v)) || _.enumerable
		});
		return e;
	}, v = (e) => _(f({}, "__esModule", { value: !0 }), e), y = {};
	g(y, { GithubFetcher: () => S }), d.exports = v(y);
	function b(e) {
		let d = e.match(/v?(\d+)\.(\d+)\.(\d+)(?:-.*)?/i);
		return d ? [
			parseInt(d[1], 10),
			parseInt(d[2], 10),
			parseInt(d[3], 10)
		] : null;
	}
	function x(e, d) {
		if (!d) return "initial";
		let f = b(e), p = b(d);
		return !f || !p ? "unknown" : f[0] > p[0] ? "major" : f[1] > p[1] ? "minor" : f[2] > p[2] ? "patch" : "unknown";
	}
	var S = class {
		constructor(e, d, f) {
			this.owner = e, this.repo = d, this.token = f;
		}
		async fetchReleases(e = 1, d = 30) {
			let f = `https://api.github.com/repos/${this.owner}/${this.repo}/releases?page=${e}&per_page=${d}`, p = { Accept: "application/vnd.github.v3+json" };
			this.token && (p.Authorization = `token ${this.token}`);
			let m = await fetch(f, { headers: p });
			if (!m.ok) throw Error(`Failed to fetch GitHub releases: ${m.status} ${m.statusText}`);
			return await m.json();
		}
		async fetchAndProcessReleases(e = 30) {
			let d = [], f = 1;
			for (; d.length < e;) {
				let p = Math.min(100, e - d.length), m = await this.fetchReleases(f, p);
				if (m.length === 0) break;
				d = d.concat(m), f++;
			}
			let p = [];
			for (let e = 0; e < d.length; e++) {
				let f = d[e], m = e < d.length - 1 ? d[e + 1] : null, h = x(f.tag_name, m ? m.tag_name : null);
				p.push({
					...f,
					versionGroup: h,
					previousVersion: m ? m.tag_name : null
				});
			}
			return p;
		}
	};
})), require_versionManager = /* @__PURE__ */ __commonJSMin(((e) => {
	var d = e && e.__importDefault || function(e) {
		return e && e.__esModule ? e : { default: e };
	};
	Object.defineProperty(e, "__esModule", { value: !0 }), e.setCurrentVersion = e.getCurrentVersion = e.getVersionFile = void 0;
	var f = d(__require("fs")), p = d(__require("path")), m = d(__require("os"));
	e.getVersionFile = (e) => e ? p.default.resolve(e, "updater-version.json") : p.default.join(m.default.tmpdir(), "changelog-github-updater-version.json"), e.getCurrentVersion = (d) => {
		let p = (0, e.getVersionFile)(d);
		if (!f.default.existsSync(p)) return null;
		let m = f.default.readFileSync(p, "utf-8");
		try {
			return JSON.parse(m).currentVersion;
		} catch {
			return null;
		}
	}, e.setCurrentVersion = (d, p) => {
		let m = (0, e.getVersionFile)(p);
		f.default.writeFileSync(m, JSON.stringify({ currentVersion: d }, null, 2));
	};
})), require_updater = /* @__PURE__ */ __commonJSMin(((e) => {
	var d = e && e.__importDefault || function(e) {
		return e && e.__esModule ? e : { default: e };
	};
	Object.defineProperty(e, "__esModule", { value: !0 }), e.updateIfNeeded = e.installUpdate = e.getOSAssetExtension = e.downloadAsset = void 0;
	var f = require_dist$1(), p = require_versionManager(), m = d(__require("os")), h = d(__require("https")), g = d(__require("fs")), _ = d(__require("path")), v = __require("child_process"), y = d(__require("process"));
	e.downloadAsset = (d, f) => new Promise((p, m) => {
		let _ = g.default.createWriteStream(f);
		h.default.get(d, (h) => {
			if (h.statusCode === 301 || h.statusCode === 302) return (0, e.downloadAsset)(h.headers.location, f).then(p).catch(m);
			if (h.statusCode !== 200) {
				m(/* @__PURE__ */ Error(`Failed to get '${d}' (${h.statusCode})`));
				return;
			}
			h.pipe(_), _.on("finish", () => {
				_.close(), p();
			});
		}).on("error", (e) => {
			g.default.unlink(f, () => m(e));
		});
	}), e.getOSAssetExtension = () => {
		let e = m.default.platform();
		return e === "win32" ? [".exe"] : e === "darwin" ? [".dmg", ".zip"] : e === "linux" ? [
			".deb",
			".AppImage",
			".rpm",
			".tar.gz"
		] : [];
	}, e.installUpdate = (e) => {
		let d = m.default.platform();
		try {
			d === "win32" ? ((0, v.spawn)(e, {
				detached: !0,
				stdio: "ignore"
			}).unref(), y.default.exit()) : d === "darwin" ? (0, v.exec)(`open "${e}"`) : d === "linux" && (e.endsWith(".deb") ? (0, v.exec)(`pkexec dpkg -i "${e}"`, (e, d, f) => {
				e && console.error("Update failed:", e);
			}) : e.endsWith(".AppImage") ? ((0, v.exec)(`chmod +x "${e}" && "${e}"`), y.default.exit()) : (0, v.exec)(`xdg-open "${e}"`));
		} catch (e) {
			console.error("Install step failed", e);
		}
	}, e.updateIfNeeded = async (d, h) => {
		let { owner: g, repo: v, currentVersion: y, tempPath: b, autoInstall: x } = d, S = await new f.GithubFetcher(g, v).fetchAndProcessReleases();
		if (!S || S.length === 0) return { updated: !1 };
		let C = S[0], w = C.tag_name, T = y || (0, p.getCurrentVersion)(b);
		if (T !== w) {
			if (h) try {
				await h(T || "none", w);
			} catch (e) {
				console.error("Middleware çalıştırılırken hata:", e);
			}
			if (x !== !1 && C.assets && C.assets.length > 0) {
				let d = (0, e.getOSAssetExtension)(), f = C.assets.find((e) => d.some((d) => e.name.endsWith(d)));
				if (f && f.browser_download_url) {
					console.log(`Downloading update: ${f.name}...`);
					let d = b || m.default.tmpdir(), p = _.default.join(d, f.name);
					try {
						await (0, e.downloadAsset)(f.browser_download_url, p), console.log(`Download complete: ${p}`), (0, e.installUpdate)(p);
					} catch (e) {
						console.error("İndirme sırasında hata:", e);
					}
				} else console.warn("Uygun bir kurulum dosyası (asset) bulunamadı.");
			}
			return (0, p.setCurrentVersion)(w, b), {
				updated: !0,
				from: T,
				to: w
			};
		}
		return {
			updated: !1,
			from: T
		};
	};
})), require_types = /* @__PURE__ */ __commonJSMin(((e) => {
	Object.defineProperty(e, "__esModule", { value: !0 });
})), import_dist = (/* @__PURE__ */ __commonJSMin(((e) => {
	var d = e && e.__createBinding || (Object.create ? (function(e, d, f, p) {
		p === void 0 && (p = f);
		var m = Object.getOwnPropertyDescriptor(d, f);
		(!m || ("get" in m ? !d.__esModule : m.writable || m.configurable)) && (m = {
			enumerable: !0,
			get: function() {
				return d[f];
			}
		}), Object.defineProperty(e, p, m);
	}) : (function(e, d, f, p) {
		p === void 0 && (p = f), e[p] = d[f];
	})), f = e && e.__exportStar || function(e, f) {
		for (var p in e) p !== "default" && !Object.prototype.hasOwnProperty.call(f, p) && d(f, e, p);
	};
	Object.defineProperty(e, "__esModule", { value: !0 }), f(require_updater(), e), f(require_types(), e), f(require_versionManager(), e);
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
	let e = process.platform === "win32" ? "tamga.ico" : "tamga.png", d = path.join(process.env.VITE_PUBLIC, e), p = nativeImage.createFromPath(d);
	if (console.log("Setting window icon from:", d), console.log("Icon image size:", p.getSize()), console.log("Icon image is empty:", p.isEmpty()), win = new BrowserWindow({
		title: "Tamga",
		width: 1200,
		height: 800,
		icon: p,
		autoHideMenuBar: !0,
		titleBarStyle: "hidden",
		webPreferences: {
			preload,
			nodeIntegration: !1,
			contextIsolation: !0,
			webSecurity: !1,
			sandbox: !1
		}
	}), p.isEmpty() || setTimeout(() => {
		win && win.setIcon(p);
	}, 500), win.webContents.session.setDisplayMediaRequestHandler((e, d) => {
		desktopCapturer.getSources({ types: ["screen"] }).then((e) => {
			e.length > 0 ? d({
				video: e[0],
				audio: "loopback"
			}) : d(null);
		});
	}), win.webContents.on("did-finish-load", () => {
		win?.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
	}), win.webContents.on("did-fail-load", (e, d, f, p) => {
		console.error("Failed to load:", d, f, p);
	}), win.webContents.on("console-message", (e, d, f) => {
		console.log("Renderer console:", d, f);
	}), typeof MAIN_WINDOW_VITE_DEV_SERVER_URL < "u") console.log("Loading from Forge dev server:", MAIN_WINDOW_VITE_DEV_SERVER_URL), await win.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL), win.webContents.openDevTools();
	else if (process.env.VITE_DEV_SERVER_URL) console.log("Loading from custom dev server:", process.env.VITE_DEV_SERVER_URL), await win.loadURL(process.env.VITE_DEV_SERVER_URL), win.webContents.openDevTools();
	else {
		let e = path.join(RENDERER_DIST, "index.html");
		console.log("Loading from file:", e), console.log("Index.html exists:", fs.existsSync(e));
		try {
			await win.loadFile(e);
		} catch (d) {
			console.error("loadFile failed, trying loadURL:", d), await win.loadURL(`file://${e}`);
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
	}), ipcMain.handle("save-file", async (e, { content: d, defaultPath: f }) => {
		try {
			let { canceled: e, filePath: p } = await dialog.showSaveDialog(win, {
				defaultPath: f,
				filters: [{
					name: "JSON",
					extensions: ["json"]
				}]
			});
			return !e && p ? (fs.writeFileSync(p, d), {
				success: !0,
				filePath: p
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
			let { canceled: e, filePaths: d } = await dialog.showOpenDialog(win, { properties: ["openDirectory"] });
			return !e && d.length > 0 ? {
				success: !0,
				path: d[0]
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
	}), ipcMain.handle("write-file-direct", async (e, { content: d, filePath: f }) => {
		try {
			return fs.writeFileSync(f, d), { success: !0 };
		} catch (e) {
			return console.error("Write file direct error:", e), {
				success: !1,
				error: e.message
			};
		}
	}), ipcMain.on("window-minimize", () => {
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
