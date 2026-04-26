import { createRequire as __cjsRequire } from "module";
const require = __cjsRequire(import.meta.url);
import { BrowserWindow, Menu, app, desktopCapturer, ipcMain, nativeImage } from "electron";
import "node:url";
import path from "node:path";
import fs from "node:fs";
var __commonJSMin = (e, u) => () => (u || e((u = { exports: {} }).exports, u), u.exports), __require = /* @__PURE__ */ ((e) => require === void 0 ? typeof Proxy < "u" ? new Proxy(e, { get: (e, d) => (require === void 0 ? e : require)[d] }) : e : require)(function(e) {
	if (require !== void 0) return require.apply(this, arguments);
	throw Error("Calling `require` for \"" + e + "\" in an environment that doesn't expose the `require` function.");
}), require_dist$1 = /* @__PURE__ */ __commonJSMin(((e, u) => {
	var d = Object.defineProperty, f = Object.getOwnPropertyDescriptor, p = Object.getOwnPropertyNames, m = Object.prototype.hasOwnProperty, h = (e, u) => {
		for (var f in u) d(e, f, {
			get: u[f],
			enumerable: !0
		});
	}, g = (e, u, h, g) => {
		if (u && typeof u == "object" || typeof u == "function") for (let _ of p(u)) !m.call(e, _) && _ !== h && d(e, _, {
			get: () => u[_],
			enumerable: !(g = f(u, _)) || g.enumerable
		});
		return e;
	}, _ = (e) => g(d({}, "__esModule", { value: !0 }), e), v = {};
	h(v, { GithubFetcher: () => x }), u.exports = _(v);
	function y(e) {
		let u = e.match(/v?(\d+)\.(\d+)\.(\d+)(?:-.*)?/i);
		return u ? [
			parseInt(u[1], 10),
			parseInt(u[2], 10),
			parseInt(u[3], 10)
		] : null;
	}
	function b(e, u) {
		if (!u) return "initial";
		let d = y(e), f = y(u);
		return !d || !f ? "unknown" : d[0] > f[0] ? "major" : d[1] > f[1] ? "minor" : d[2] > f[2] ? "patch" : "unknown";
	}
	var x = class {
		constructor(e, u, d) {
			this.owner = e, this.repo = u, this.token = d;
		}
		async fetchReleases(e = 1, u = 30) {
			let d = `https://api.github.com/repos/${this.owner}/${this.repo}/releases?page=${e}&per_page=${u}`, f = { Accept: "application/vnd.github.v3+json" };
			this.token && (f.Authorization = `token ${this.token}`);
			let p = await fetch(d, { headers: f });
			if (!p.ok) throw Error(`Failed to fetch GitHub releases: ${p.status} ${p.statusText}`);
			return await p.json();
		}
		async fetchAndProcessReleases(e = 30) {
			let u = [], d = 1;
			for (; u.length < e;) {
				let f = Math.min(100, e - u.length), p = await this.fetchReleases(d, f);
				if (p.length === 0) break;
				u = u.concat(p), d++;
			}
			let f = [];
			for (let e = 0; e < u.length; e++) {
				let d = u[e], p = e < u.length - 1 ? u[e + 1] : null, m = b(d.tag_name, p ? p.tag_name : null);
				f.push({
					...d,
					versionGroup: m,
					previousVersion: p ? p.tag_name : null
				});
			}
			return f;
		}
	};
})), require_versionManager = /* @__PURE__ */ __commonJSMin(((e) => {
	var u = e && e.__importDefault || function(e) {
		return e && e.__esModule ? e : { default: e };
	};
	Object.defineProperty(e, "__esModule", { value: !0 }), e.setCurrentVersion = e.getCurrentVersion = e.getVersionFile = void 0;
	var d = u(__require("fs")), f = u(__require("path")), p = u(__require("os"));
	e.getVersionFile = (e) => e ? f.default.resolve(e, "updater-version.json") : f.default.join(p.default.tmpdir(), "changelog-github-updater-version.json"), e.getCurrentVersion = (u) => {
		let f = (0, e.getVersionFile)(u);
		if (!d.default.existsSync(f)) return null;
		let p = d.default.readFileSync(f, "utf-8");
		try {
			return JSON.parse(p).currentVersion;
		} catch {
			return null;
		}
	}, e.setCurrentVersion = (u, f) => {
		let p = (0, e.getVersionFile)(f);
		d.default.writeFileSync(p, JSON.stringify({ currentVersion: u }, null, 2));
	};
})), require_updater = /* @__PURE__ */ __commonJSMin(((e) => {
	var u = e && e.__importDefault || function(e) {
		return e && e.__esModule ? e : { default: e };
	};
	Object.defineProperty(e, "__esModule", { value: !0 }), e.updateIfNeeded = e.installUpdate = e.getOSAssetExtension = e.downloadAsset = void 0;
	var d = require_dist$1(), f = require_versionManager(), p = u(__require("os")), m = u(__require("https")), h = u(__require("fs")), g = u(__require("path")), _ = __require("child_process"), v = u(__require("process"));
	e.downloadAsset = (u, d) => new Promise((f, p) => {
		let g = h.default.createWriteStream(d);
		m.default.get(u, (m) => {
			if (m.statusCode === 301 || m.statusCode === 302) return (0, e.downloadAsset)(m.headers.location, d).then(f).catch(p);
			if (m.statusCode !== 200) {
				p(/* @__PURE__ */ Error(`Failed to get '${u}' (${m.statusCode})`));
				return;
			}
			m.pipe(g), g.on("finish", () => {
				g.close(), f();
			});
		}).on("error", (e) => {
			h.default.unlink(d, () => p(e));
		});
	}), e.getOSAssetExtension = () => {
		let e = p.default.platform();
		return e === "win32" ? [".exe"] : e === "darwin" ? [".dmg", ".zip"] : e === "linux" ? [
			".deb",
			".AppImage",
			".rpm",
			".tar.gz"
		] : [];
	}, e.installUpdate = (e) => {
		let u = p.default.platform();
		try {
			u === "win32" ? ((0, _.spawn)(e, {
				detached: !0,
				stdio: "ignore"
			}).unref(), v.default.exit()) : u === "darwin" ? (0, _.exec)(`open "${e}"`) : u === "linux" && (e.endsWith(".deb") ? (0, _.exec)(`pkexec dpkg -i "${e}"`, (e, u, d) => {
				e && console.error("Update failed:", e);
			}) : e.endsWith(".AppImage") ? ((0, _.exec)(`chmod +x "${e}" && "${e}"`), v.default.exit()) : (0, _.exec)(`xdg-open "${e}"`));
		} catch (e) {
			console.error("Install step failed", e);
		}
	}, e.updateIfNeeded = async (u, m) => {
		let { owner: h, repo: _, currentVersion: v, tempPath: y, autoInstall: b } = u, x = await new d.GithubFetcher(h, _).fetchAndProcessReleases();
		if (!x || x.length === 0) return { updated: !1 };
		let S = x[0], C = S.tag_name, w = v || (0, f.getCurrentVersion)(y);
		if (w !== C) {
			if (m) try {
				await m(w || "none", C);
			} catch (e) {
				console.error("Middleware çalıştırılırken hata:", e);
			}
			if (b !== !1 && S.assets && S.assets.length > 0) {
				let u = (0, e.getOSAssetExtension)(), d = S.assets.find((e) => u.some((u) => e.name.endsWith(u)));
				if (d && d.browser_download_url) {
					console.log(`Downloading update: ${d.name}...`);
					let u = y || p.default.tmpdir(), f = g.default.join(u, d.name);
					try {
						await (0, e.downloadAsset)(d.browser_download_url, f), console.log(`Download complete: ${f}`), (0, e.installUpdate)(f);
					} catch (e) {
						console.error("İndirme sırasında hata:", e);
					}
				} else console.warn("Uygun bir kurulum dosyası (asset) bulunamadı.");
			}
			return (0, f.setCurrentVersion)(C, y), {
				updated: !0,
				from: w,
				to: C
			};
		}
		return {
			updated: !1,
			from: w
		};
	};
})), require_types = /* @__PURE__ */ __commonJSMin(((e) => {
	Object.defineProperty(e, "__esModule", { value: !0 });
})), import_dist = (/* @__PURE__ */ __commonJSMin(((e) => {
	var u = e && e.__createBinding || (Object.create ? (function(e, u, d, f) {
		f === void 0 && (f = d);
		var p = Object.getOwnPropertyDescriptor(u, d);
		(!p || ("get" in p ? !u.__esModule : p.writable || p.configurable)) && (p = {
			enumerable: !0,
			get: function() {
				return u[d];
			}
		}), Object.defineProperty(e, f, p);
	}) : (function(e, u, d, f) {
		f === void 0 && (f = d), e[f] = u[d];
	})), d = e && e.__exportStar || function(e, d) {
		for (var f in e) f !== "default" && !Object.prototype.hasOwnProperty.call(d, f) && u(d, e, f);
	};
	Object.defineProperty(e, "__esModule", { value: !0 }), d(require_updater(), e), d(require_types(), e), d(require_versionManager(), e);
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
	let e = process.platform === "win32" ? "tamga.ico" : "tamga.png", u = path.join(process.env.VITE_PUBLIC, e), f = nativeImage.createFromPath(u);
	if (console.log("Setting window icon from:", u), console.log("Icon image size:", f.getSize()), console.log("Icon image is empty:", f.isEmpty()), win = new BrowserWindow({
		title: "Tamga",
		width: 1200,
		height: 800,
		icon: f,
		autoHideMenuBar: !0,
		titleBarStyle: "hidden",
		webPreferences: {
			preload,
			nodeIntegration: !1,
			contextIsolation: !0,
			webSecurity: !1,
			sandbox: !1
		}
	}), f.isEmpty() || setTimeout(() => {
		win && win.setIcon(f);
	}, 500), win.webContents.session.setDisplayMediaRequestHandler((e, u) => {
		desktopCapturer.getSources({ types: ["screen"] }).then((e) => {
			e.length > 0 ? u({
				video: e[0],
				audio: "loopback"
			}) : u(null);
		});
	}), win.webContents.on("did-finish-load", () => {
		win?.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
	}), win.webContents.on("did-fail-load", (e, u, d, f) => {
		console.error("Failed to load:", u, d, f);
	}), win.webContents.on("console-message", (e, u, d) => {
		console.log("Renderer console:", u, d);
	}), typeof MAIN_WINDOW_VITE_DEV_SERVER_URL < "u") console.log("Loading from Forge dev server:", MAIN_WINDOW_VITE_DEV_SERVER_URL), await win.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL), win.webContents.openDevTools();
	else if (process.env.VITE_DEV_SERVER_URL) console.log("Loading from custom dev server:", process.env.VITE_DEV_SERVER_URL), await win.loadURL(process.env.VITE_DEV_SERVER_URL), win.webContents.openDevTools();
	else {
		let e = path.join(RENDERER_DIST, "index.html");
		console.log("Loading from file:", e), console.log("Index.html exists:", fs.existsSync(e));
		try {
			await win.loadFile(e);
		} catch (u) {
			console.error("loadFile failed, trying loadURL:", u), await win.loadURL(`file://${e}`);
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
