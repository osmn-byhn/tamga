import { createRequire as __cjsRequire } from "module";
__cjsRequire(import.meta.url);
import { n as __require, t as __commonJSMin } from "./chunk-DtxsatQ3.js";
var require_dist$1 = /* @__PURE__ */ __commonJSMin(((e, t) => {
	var n = Object.defineProperty, r = Object.getOwnPropertyDescriptor, i = Object.getOwnPropertyNames, a = Object.prototype.hasOwnProperty, o = (e, t) => {
		for (var r in t) n(e, r, {
			get: t[r],
			enumerable: !0
		});
	}, s = (e, t, o, s) => {
		if (t && typeof t == "object" || typeof t == "function") for (let c of i(t)) !a.call(e, c) && c !== o && n(e, c, {
			get: () => t[c],
			enumerable: !(s = r(t, c)) || s.enumerable
		});
		return e;
	}, c = (e) => s(n({}, "__esModule", { value: !0 }), e), l = {};
	o(l, { GithubFetcher: () => f }), t.exports = c(l);
	function u(e) {
		let t = e.match(/v?(\d+)\.(\d+)\.(\d+)(?:-.*)?/i);
		return t ? [
			parseInt(t[1], 10),
			parseInt(t[2], 10),
			parseInt(t[3], 10)
		] : null;
	}
	function d(e, t) {
		if (!t) return "initial";
		let n = u(e), r = u(t);
		return !n || !r ? "unknown" : n[0] > r[0] ? "major" : n[1] > r[1] ? "minor" : n[2] > r[2] ? "patch" : "unknown";
	}
	var f = class {
		constructor(e, t, n) {
			this.owner = e, this.repo = t, this.token = n;
		}
		async fetchReleases(e = 1, t = 30) {
			let n = `https://api.github.com/repos/${this.owner}/${this.repo}/releases?page=${e}&per_page=${t}`, r = { Accept: "application/vnd.github.v3+json" };
			this.token && (r.Authorization = `token ${this.token}`);
			let i = await fetch(n, { headers: r });
			if (!i.ok) throw Error(`Failed to fetch GitHub releases: ${i.status} ${i.statusText}`);
			return await i.json();
		}
		async fetchAndProcessReleases(e = 30) {
			let t = [], n = 1;
			for (; t.length < e;) {
				let r = Math.min(100, e - t.length), i = await this.fetchReleases(n, r);
				if (i.length === 0) break;
				t = t.concat(i), n++;
			}
			let r = [];
			for (let e = 0; e < t.length; e++) {
				let n = t[e], i = e < t.length - 1 ? t[e + 1] : null, a = d(n.tag_name, i ? i.tag_name : null);
				r.push({
					...n,
					versionGroup: a,
					previousVersion: i ? i.tag_name : null
				});
			}
			return r;
		}
	};
})), require_versionManager = /* @__PURE__ */ __commonJSMin(((e) => {
	var n = e && e.__importDefault || function(e) {
		return e && e.__esModule ? e : { default: e };
	};
	Object.defineProperty(e, "__esModule", { value: !0 }), e.setCurrentVersion = e.getCurrentVersion = e.getVersionFile = void 0;
	var r = n(__require("fs")), i = n(__require("path")), a = n(__require("os"));
	e.getVersionFile = (e) => e ? i.default.resolve(e, "updater-version.json") : i.default.join(a.default.tmpdir(), "changelog-github-updater-version.json"), e.getCurrentVersion = (t) => {
		let n = (0, e.getVersionFile)(t);
		if (!r.default.existsSync(n)) return null;
		let i = r.default.readFileSync(n, "utf-8");
		try {
			return JSON.parse(i).currentVersion;
		} catch {
			return null;
		}
	}, e.setCurrentVersion = (t, n) => {
		let i = (0, e.getVersionFile)(n);
		r.default.writeFileSync(i, JSON.stringify({ currentVersion: t }, null, 2));
	};
})), require_updater = /* @__PURE__ */ __commonJSMin(((e) => {
	var n = e && e.__importDefault || function(e) {
		return e && e.__esModule ? e : { default: e };
	};
	Object.defineProperty(e, "__esModule", { value: !0 }), e.updateIfNeeded = e.installUpdate = e.getOSAssetExtension = e.downloadAsset = void 0;
	var a = require_dist$1(), o = require_versionManager(), s = n(__require("os")), c = n(__require("https")), l = n(__require("fs")), u = n(__require("path")), d = __require("child_process"), f = n(__require("process"));
	e.downloadAsset = (t, n) => new Promise((r, i) => {
		let a = l.default.createWriteStream(n);
		c.default.get(t, (o) => {
			if (o.statusCode === 301 || o.statusCode === 302) return (0, e.downloadAsset)(o.headers.location, n).then(r).catch(i);
			if (o.statusCode !== 200) {
				i(/* @__PURE__ */ Error(`Failed to get '${t}' (${o.statusCode})`));
				return;
			}
			o.pipe(a), a.on("finish", () => {
				a.close(), r();
			});
		}).on("error", (e) => {
			l.default.unlink(n, () => i(e));
		});
	}), e.getOSAssetExtension = () => {
		let e = s.default.platform();
		return e === "win32" ? [".exe"] : e === "darwin" ? [".dmg", ".zip"] : e === "linux" ? [
			".deb",
			".AppImage",
			".rpm",
			".tar.gz"
		] : [];
	}, e.installUpdate = (e) => {
		let t = s.default.platform();
		try {
			t === "win32" ? ((0, d.spawn)(e, {
				detached: !0,
				stdio: "ignore"
			}).unref(), f.default.exit()) : t === "darwin" ? (0, d.exec)(`open "${e}"`) : t === "linux" && (e.endsWith(".deb") ? (0, d.exec)(`pkexec dpkg -i "${e}"`, (e, t, n) => {
				e && console.error("Update failed:", e);
			}) : e.endsWith(".AppImage") ? ((0, d.exec)(`chmod +x "${e}" && "${e}"`), f.default.exit()) : (0, d.exec)(`xdg-open "${e}"`));
		} catch (e) {
			console.error("Install step failed", e);
		}
	}, e.updateIfNeeded = async (t, n) => {
		let { owner: r, repo: i, currentVersion: c, tempPath: l, autoInstall: d } = t, f = await new a.GithubFetcher(r, i).fetchAndProcessReleases();
		if (!f || f.length === 0) return { updated: !1 };
		let p = f[0], m = p.tag_name, h = c || (0, o.getCurrentVersion)(l);
		if (h !== m) {
			if (n) try {
				await n(h || "none", m);
			} catch (e) {
				console.error("Middleware çalıştırılırken hata:", e);
			}
			if (d !== !1 && p.assets && p.assets.length > 0) {
				let t = (0, e.getOSAssetExtension)(), n = p.assets.find((e) => t.some((t) => e.name.endsWith(t)));
				if (n && n.browser_download_url) {
					console.log(`Downloading update: ${n.name}...`);
					let t = l || s.default.tmpdir(), r = u.default.join(t, n.name);
					try {
						await (0, e.downloadAsset)(n.browser_download_url, r), console.log(`Download complete: ${r}`), (0, e.installUpdate)(r);
					} catch (e) {
						console.error("İndirme sırasında hata:", e);
					}
				} else console.warn("Uygun bir kurulum dosyası (asset) bulunamadı.");
			}
			return (0, o.setCurrentVersion)(m, l), {
				updated: !0,
				from: h,
				to: m
			};
		}
		return {
			updated: !1,
			from: h
		};
	};
})), require_types = /* @__PURE__ */ __commonJSMin(((e) => {
	Object.defineProperty(e, "__esModule", { value: !0 });
})), require_dist = /* @__PURE__ */ __commonJSMin(((e) => {
	var t = e && e.__createBinding || (Object.create ? (function(e, t, n, r) {
		r === void 0 && (r = n);
		var i = Object.getOwnPropertyDescriptor(t, n);
		(!i || ("get" in i ? !t.__esModule : i.writable || i.configurable)) && (i = {
			enumerable: !0,
			get: function() {
				return t[n];
			}
		}), Object.defineProperty(e, r, i);
	}) : (function(e, t, n, r) {
		r === void 0 && (r = n), e[r] = t[n];
	})), n = e && e.__exportStar || function(e, n) {
		for (var r in e) r !== "default" && !Object.prototype.hasOwnProperty.call(n, r) && t(n, e, r);
	};
	Object.defineProperty(e, "__esModule", { value: !0 }), n(require_updater(), e), n(require_types(), e), n(require_versionManager(), e);
}));
export default require_dist();
