import { app as n, BrowserWindow as t } from "electron";
import { fileURLToPath as c } from "node:url";
import o from "node:path";
const i = o.dirname(c(import.meta.url));
process.env.APP_ROOT = o.join(i, "..");
const s = process.env.VITE_DEV_SERVER_URL, m = o.join(process.env.APP_ROOT, "dist-electron"), r = o.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = s ? o.join(process.env.APP_ROOT, "public") : r;
let e;
function l() {
  e = new t({
    icon: o.join(process.env.VITE_PUBLIC, "electron-vite.svg"),
    width: 1920,
    height: 1080,
    webPreferences: {
      preload: o.join(i, "preload.mjs")
    }
  }), e.webContents.on("did-finish-load", () => {
    e == null || e.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  }), process.env.NODE_ENV === "development" && e.webContents.openDevTools({ mode: "detach" }), s ? e.loadURL(s) : e.loadFile(o.join(r, "index.html"));
}
n.on("window-all-closed", () => {
  process.platform !== "darwin" && (n.quit(), e = null);
});
n.on("activate", () => {
  t.getAllWindows().length === 0 && l();
});
n.whenReady().then(l);
export {
  m as MAIN_DIST,
  r as RENDERER_DIST,
  s as VITE_DEV_SERVER_URL
};
