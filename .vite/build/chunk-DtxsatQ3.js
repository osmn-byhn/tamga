import { createRequire as __cjsRequire } from "module";
const require = __cjsRequire(import.meta.url);
var __create = Object.create, __defProp = Object.defineProperty, __getOwnPropDesc = Object.getOwnPropertyDescriptor, __getOwnPropNames = Object.getOwnPropertyNames, __getProtoOf = Object.getPrototypeOf, __hasOwnProp = Object.prototype.hasOwnProperty, __commonJSMin = (e, a) => () => (a || e((a = { exports: {} }).exports, a), a.exports), __copyProps = (e, a, o, c) => {
	if (a && typeof a == "object" || typeof a == "function") for (var l = __getOwnPropNames(a), u = 0, d = l.length, f; u < d; u++) f = l[u], !__hasOwnProp.call(e, f) && f !== o && __defProp(e, f, {
		get: ((e) => a[e]).bind(null, f),
		enumerable: !(c = __getOwnPropDesc(a, f)) || c.enumerable
	});
	return e;
}, __toESM = (e, a, s) => (s = e == null ? {} : __create(__getProtoOf(e)), __copyProps(a || !e || !e.__esModule ? __defProp(s, "default", {
	value: e,
	enumerable: !0
}) : s, e)), __toDynamicImportESM = (e) => (a) => __toESM(a.default, e), __require = /* @__PURE__ */ ((e) => require === void 0 ? typeof Proxy < "u" ? new Proxy(e, { get: (e, o) => (require === void 0 ? e : require)[o] }) : e : require)(function(e) {
	if (require !== void 0) return require.apply(this, arguments);
	throw Error("Calling `require` for \"" + e + "\" in an environment that doesn't expose the `require` function.");
});
export { __require as n, __toDynamicImportESM as r, __commonJSMin as t };
