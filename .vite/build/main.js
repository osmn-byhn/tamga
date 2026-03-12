import { createRequire as __cjsRequire } from "module";
const require = __cjsRequire(import.meta.url);
import { BrowserWindow, Menu, app, ipcMain, nativeImage } from "electron";
import { fileURLToPath } from "node:url";
import path from "node:path";
import "node:fs";
var __commonJSMin = (e, l) => () => (l || e((l = { exports: {} }).exports, l), l.exports), __require = /* @__PURE__ */ ((e) => require === void 0 ? typeof Proxy < "u" ? new Proxy(e, { get: (e, u) => (require === void 0 ? e : require)[u] }) : e : require)(function(e) {
	if (require !== void 0) return require.apply(this, arguments);
	throw Error("Calling `require` for \"" + e + "\" in an environment that doesn't expose the `require` function.");
}), require_dist$1 = /* @__PURE__ */ __commonJSMin(((e, l) => {
	var u = Object.defineProperty, d = Object.getOwnPropertyDescriptor, f = Object.getOwnPropertyNames, p = Object.prototype.hasOwnProperty, m = (e, l) => {
		for (var d in l) u(e, d, {
			get: l[d],
			enumerable: !0
		});
	}, h = (e, l, m, h) => {
		if (l && typeof l == "object" || typeof l == "function") for (let g of f(l)) !p.call(e, g) && g !== m && u(e, g, {
			get: () => l[g],
			enumerable: !(h = d(l, g)) || h.enumerable
		});
		return e;
	}, g = (e) => h(u({}, "__esModule", { value: !0 }), e), _ = {};
	m(_, { GithubFetcher: () => b }), l.exports = g(_);
	function v(e) {
		let l = e.match(/v?(\d+)\.(\d+)\.(\d+)(?:-.*)?/i);
		return l ? [
			parseInt(l[1], 10),
			parseInt(l[2], 10),
			parseInt(l[3], 10)
		] : null;
	}
	function y(e, l) {
		if (!l) return "initial";
		let u = v(e), d = v(l);
		return !u || !d ? "unknown" : u[0] > d[0] ? "major" : u[1] > d[1] ? "minor" : u[2] > d[2] ? "patch" : "unknown";
	}
	var b = class {
		constructor(e, l, u) {
			this.owner = e, this.repo = l, this.token = u;
		}
		async fetchReleases(e = 1, l = 30) {
			let u = `https://api.github.com/repos/${this.owner}/${this.repo}/releases?page=${e}&per_page=${l}`, d = { Accept: "application/vnd.github.v3+json" };
			this.token && (d.Authorization = `token ${this.token}`);
			let f = await fetch(u, { headers: d });
			if (!f.ok) throw Error(`Failed to fetch GitHub releases: ${f.status} ${f.statusText}`);
			return await f.json();
		}
		async fetchAndProcessReleases(e = 30) {
			let l = [], u = 1;
			for (; l.length < e;) {
				let d = Math.min(100, e - l.length), f = await this.fetchReleases(u, d);
				if (f.length === 0) break;
				l = l.concat(f), u++;
			}
			let d = [];
			for (let e = 0; e < l.length; e++) {
				let u = l[e], f = e < l.length - 1 ? l[e + 1] : null, p = y(u.tag_name, f ? f.tag_name : null);
				d.push({
					...u,
					versionGroup: p,
					previousVersion: f ? f.tag_name : null
				});
			}
			return d;
		}
	};
})), require_versionManager = /* @__PURE__ */ __commonJSMin(((e) => {
	var l = e && e.__importDefault || function(e) {
		return e && e.__esModule ? e : { default: e };
	};
	Object.defineProperty(e, "__esModule", { value: !0 }), e.setCurrentVersion = e.getCurrentVersion = e.getVersionFile = void 0;
	var u = l(__require("fs")), d = l(__require("path")), f = l(__require("os"));
	e.getVersionFile = (e) => e ? d.default.resolve(e, "updater-version.json") : d.default.join(f.default.tmpdir(), "changelog-github-updater-version.json"), e.getCurrentVersion = (l) => {
		let d = (0, e.getVersionFile)(l);
		if (!u.default.existsSync(d)) return null;
		let f = u.default.readFileSync(d, "utf-8");
		try {
			return JSON.parse(f).currentVersion;
		} catch {
			return null;
		}
	}, e.setCurrentVersion = (l, d) => {
		let f = (0, e.getVersionFile)(d);
		u.default.writeFileSync(f, JSON.stringify({ currentVersion: l }, null, 2));
	};
})), require_updater = /* @__PURE__ */ __commonJSMin(((e) => {
	var l = e && e.__importDefault || function(e) {
		return e && e.__esModule ? e : { default: e };
	};
	Object.defineProperty(e, "__esModule", { value: !0 }), e.updateIfNeeded = e.installUpdate = e.getOSAssetExtension = e.downloadAsset = void 0;
	var u = require_dist$1(), d = require_versionManager(), f = l(__require("os")), p = l(__require("https")), m = l(__require("fs")), h = l(__require("path")), g = __require("child_process"), _ = l(__require("process"));
	e.downloadAsset = (l, u) => new Promise((d, f) => {
		let h = m.default.createWriteStream(u);
		p.default.get(l, (p) => {
			if (p.statusCode === 301 || p.statusCode === 302) return (0, e.downloadAsset)(p.headers.location, u).then(d).catch(f);
			if (p.statusCode !== 200) {
				f(/* @__PURE__ */ Error(`Failed to get '${l}' (${p.statusCode})`));
				return;
			}
			p.pipe(h), h.on("finish", () => {
				h.close(), d();
			});
		}).on("error", (e) => {
			m.default.unlink(u, () => f(e));
		});
	}), e.getOSAssetExtension = () => {
		let e = f.default.platform();
		return e === "win32" ? [".exe"] : e === "darwin" ? [".dmg", ".zip"] : e === "linux" ? [
			".deb",
			".AppImage",
			".rpm",
			".tar.gz"
		] : [];
	}, e.installUpdate = (e) => {
		let l = f.default.platform();
		try {
			l === "win32" ? ((0, g.spawn)(e, {
				detached: !0,
				stdio: "ignore"
			}).unref(), _.default.exit()) : l === "darwin" ? (0, g.exec)(`open "${e}"`) : l === "linux" && (e.endsWith(".deb") ? (0, g.exec)(`pkexec dpkg -i "${e}"`, (e, l, u) => {
				e && console.error("Update failed:", e);
			}) : e.endsWith(".AppImage") ? ((0, g.exec)(`chmod +x "${e}" && "${e}"`), _.default.exit()) : (0, g.exec)(`xdg-open "${e}"`));
		} catch (e) {
			console.error("Install step failed", e);
		}
	}, e.updateIfNeeded = async (l, p) => {
		let { owner: m, repo: g, currentVersion: _, tempPath: v, autoInstall: y } = l, b = await new u.GithubFetcher(m, g).fetchAndProcessReleases();
		if (!b || b.length === 0) return { updated: !1 };
		let x = b[0], S = x.tag_name, C = _ || (0, d.getCurrentVersion)(v);
		if (C !== S) {
			if (p) try {
				await p(C || "none", S);
			} catch (e) {
				console.error("Middleware çalıştırılırken hata:", e);
			}
			if (y !== !1 && x.assets && x.assets.length > 0) {
				let l = (0, e.getOSAssetExtension)(), u = x.assets.find((e) => l.some((l) => e.name.endsWith(l)));
				if (u && u.browser_download_url) {
					console.log(`Downloading update: ${u.name}...`);
					let l = v || f.default.tmpdir(), d = h.default.join(l, u.name);
					try {
						await (0, e.downloadAsset)(u.browser_download_url, d), console.log(`Download complete: ${d}`), (0, e.installUpdate)(d);
					} catch (e) {
						console.error("İndirme sırasında hata:", e);
					}
				} else console.warn("Uygun bir kurulum dosyası (asset) bulunamadı.");
			}
			return (0, d.setCurrentVersion)(S, v), {
				updated: !0,
				from: C,
				to: S
			};
		}
		return {
			updated: !1,
			from: C
		};
	};
})), require_types = /* @__PURE__ */ __commonJSMin(((e) => {
	Object.defineProperty(e, "__esModule", { value: !0 });
})), import_dist = (/* @__PURE__ */ __commonJSMin(((e) => {
	var l = e && e.__createBinding || (Object.create ? (function(e, l, u, d) {
		d === void 0 && (d = u);
		var f = Object.getOwnPropertyDescriptor(l, u);
		(!f || ("get" in f ? !l.__esModule : f.writable || f.configurable)) && (f = {
			enumerable: !0,
			get: function() {
				return l[u];
			}
		}), Object.defineProperty(e, d, f);
	}) : (function(e, l, u, d) {
		d === void 0 && (d = u), e[d] = l[u];
	})), u = e && e.__exportStar || function(e, u) {
		for (var d in e) d !== "default" && !Object.prototype.hasOwnProperty.call(u, d) && l(u, e, d);
	};
	Object.defineProperty(e, "__esModule", { value: !0 }), u(require_updater(), e), u(require_types(), e), u(require_versionManager(), e);
})))(), __dirname = path.dirname(fileURLToPath(import.meta.url));
app.setName("Tamga"), path.join(app.getPath("userData"), "vault.dat");
var isBuilt = __dirname.includes(path.sep + ".vite" + path.sep) || __dirname.endsWith(path.sep + ".vite");
process.env.APP_ROOT = isBuilt ? path.join(__dirname, "../../") : path.join(__dirname, "../");
const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron"), RENDERER_DIST = path.join(process.env.APP_ROOT, "dist"), VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL;
process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, "public") : RENDERER_DIST, process.platform === "win32" && app.disableHardwareAcceleration(), process.platform === "win32" && app.setAppUserModelId(app.getName()), Menu.setApplicationMenu(null), app.requestSingleInstanceLock() || (app.quit(), process.exit(0));
var win = null, preload = path.join(__dirname, "preload.cjs");
path.join(RENDERER_DIST, "index.html");
async function createWindow() {
	let e = process.platform === "win32" ? "tamga.ico" : "tamga.png", l = path.join(process.env.VITE_PUBLIC, e), d = nativeImage.createFromPath(l);
	if (console.log("Setting window icon from:", l), console.log("Icon image size:", d.getSize()), console.log("Icon image is empty:", d.isEmpty()), win = new BrowserWindow({
		title: "Tamga",
		width: 1200,
		height: 800,
		icon: d,
		autoHideMenuBar: !0,
		webPreferences: {
			preload,
			nodeIntegration: !1,
			contextIsolation: !0,
			webSecurity: !1
		}
	}), d.isEmpty() || setTimeout(() => {
		win && win.setIcon(d);
	}, 500), win.webContents.session.setDisplayMediaRequestHandler((e, l) => {
		import("electron").then(({ desktopCapturer: e }) => {
			e.getSources({ types: ["screen"] }).then((e) => {
				e.length > 0 ? l({
					video: e[0],
					audio: "loopback"
				}) : l(null);
			});
		});
	}), win.webContents.on("did-finish-load", () => {
		win?.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
	}), win.webContents.on("did-fail-load", (e, l, u, d) => {
		console.error("Failed to load:", l, u, d);
	}), win.webContents.on("console-message", (e, l, u) => {
		console.log("Renderer console:", l, u);
	}), typeof MAIN_WINDOW_VITE_DEV_SERVER_URL < "u") console.log("Loading from Forge dev server:", MAIN_WINDOW_VITE_DEV_SERVER_URL), await win.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL), win.webContents.openDevTools();
	else if (process.env.VITE_DEV_SERVER_URL) console.log("Loading from custom dev server:", process.env.VITE_DEV_SERVER_URL), await win.loadURL(process.env.VITE_DEV_SERVER_URL), win.webContents.openDevTools();
	else {
		let e;
		e = typeof MAIN_WINDOW_VITE_NAME < "u" ? path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`) : path.join(RENDERER_DIST, "index.html"), console.log("Loading from file:", e), win.loadFile(e);
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
