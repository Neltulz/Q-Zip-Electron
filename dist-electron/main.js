import { ipcMain as f, BrowserWindow as v, app as m } from "electron";
import { fileURLToPath as z } from "node:url";
import c from "node:path";
import g from "node:fs";
import { spawn as Z } from "child_process";
import { createRequire as x } from "module";
import E from "path";
const h = x(import.meta.url), D = () => {
  if (process.env.NODE_ENV === "development" || !process.resourcesPath)
    try {
      const { path7za: t } = h("7zip-bin");
      return t;
    } catch (t) {
      return console.error("Failed to get 7zip-bin path in development:", t), "7za.exe";
    }
  const a = process.resourcesPath, e = E.join(a, "app.asar.unpacked", "node_modules", "7zip-bin", "win", "x64", "7za.exe"), o = h("fs");
  if (o.existsSync(e))
    return console.log("sevenZip: Using unpacked 7-Zip path:", e), e;
  {
    console.error("sevenZip: 7-Zip binary not found at:", e);
    const t = E.join(process.resourcesPath, "..", "node_modules", "7zip-bin", "win", "x64", "7za.exe");
    return o.existsSync(t) ? (console.log("sevenZip: Using alternative 7-Zip path:", t), t) : e;
  }
}, _ = D();
function b() {
  f.handle("compress", async (a, e) => {
    console.log("sevenZip: Compression job received:", e);
    try {
      if (!e || !Array.isArray(e.inputs) || e.inputs.length === 0)
        throw new Error("Invalid job: inputs[] is required");
      if (typeof e.out != "string" || e.out.trim().length === 0)
        throw new Error("Invalid job: out path is required");
      const o = Number.isFinite(e.level) ? Math.max(0, Math.min(9, Number(e.level))) : 5, t = ["a", e.out, ...e.inputs, `-mx=${o}`, "-bsp1", "-bso1"];
      console.log("Starting 7-Zip compression:", { path7za: _, args: t });
      const n = Z(_, t, {
        stdio: ["pipe", "pipe", "pipe"],
        shell: !1
      });
      return new Promise((r, p) => {
        let l = "", w = "";
        n.stdout.on("data", (s) => {
          const i = s.toString();
          w += i;
          const u = i.match(/(\d+)%/);
          if (u) {
            const P = Number(u[1]);
            v.getAllWindows().forEach((R) => {
              R.webContents.send("compress:progress", {
                percent: Math.min(100, P),
                message: i.trim()
              });
            });
          }
        }), n.stderr.on("data", (s) => {
          l += s.toString();
        }), n.on("error", (s) => {
          console.error("7-Zip spawn error:", s), p(new Error(`Failed to start 7-Zip: ${s.message}`));
        }), n.on("close", (s) => {
          if (console.log("7-Zip process closed with code:", s), s === 0)
            v.getAllWindows().forEach((i) => {
              i.webContents.send("compress:progress", {
                percent: 100,
                message: "Compression completed successfully!"
              });
            }), r({ ok: !0 });
          else {
            const i = l || `7-Zip failed with exit code ${s}`;
            console.error("7-Zip error:", i), p(new Error(i));
          }
        });
      });
    } catch (o) {
      return console.error("Compression handler error:", o), {
        ok: !1,
        error: o instanceof Error ? o.message : "Unknown compression error"
      };
    }
  }), f.handle("dialog:selectOutput", async (a, e) => {
    const { dialog: o } = h("electron"), t = await o.showSaveDialog({
      defaultPath: e || "archive.7z",
      filters: [
        { name: "7-Zip Archive", extensions: ["7z"] },
        { name: "ZIP Archive", extensions: ["zip"] },
        { name: "All Files", extensions: ["*"] }
      ]
    });
    return t.canceled ? null : t.filePath || null;
  }), f.handle("dialog:selectFiles", async () => {
    const { dialog: a } = h("electron"), e = await a.showOpenDialog({
      properties: ["openFile", "multiSelections"],
      filters: [
        { name: "All Files", extensions: ["*"] }
      ]
    });
    return e.canceled ? [] : e.filePaths;
  }), f.handle("temp:createCopies", async (a, e) => {
    const o = h("fs"), t = h("os"), n = h("path"), r = o.mkdtempSync(n.join(t.tmpdir(), "qzip-drop-")), p = [];
    for (const l of e) {
      const w = String(l.name || "file"), s = l.relativePath && typeof l.relativePath == "string" && l.relativePath.trim().length > 0 ? l.relativePath : w, i = n.join(r, s), u = n.dirname(i);
      o.mkdirSync(u, { recursive: !0 });
      const P = Buffer.from(l.data);
      o.writeFileSync(i, P), p.push(i);
    }
    return p;
  });
}
const S = c.dirname(z(import.meta.url));
process.env.APP_ROOT = c.join(S, "..");
const y = process.env.VITE_DEV_SERVER_URL, V = c.join(process.env.APP_ROOT, "dist-electron"), A = c.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = y ? c.join(process.env.APP_ROOT, "public") : A;
let d;
const C = x(import.meta.url), N = C("electron-squirrel-startup");
N && m.quit();
function I() {
  m.setAppUserModelId("com.qzipelectron.app");
  const a = S, e = c.join(a, "preload.cjs"), o = c.join(a, "preload.mjs");
  let t = e;
  try {
    if (!g.existsSync(e) && g.existsSync(o)) {
      const n = g.readFileSync(o, "utf-8"), r = e;
      g.writeFileSync(r, n, "utf-8"), t = r;
    }
  } catch {
  }
  d = new v({
    icon: c.join(process.env.VITE_PUBLIC, "electron-vite.svg"),
    width: 1920,
    height: 1080,
    webPreferences: {
      preload: t,
      nodeIntegration: !1,
      contextIsolation: !0,
      // Disable sandbox so Electron exposes File.path in the renderer for drag & drop
      sandbox: !1
    }
  });
  try {
    d.webContents.on("will-navigate", (n, r) => {
      (r.startsWith("file://") || r.startsWith("http://") || r.startsWith("https://")) && (console.log("[MAIN] will-navigate prevented:", r), n.preventDefault());
    }), d.webContents.on("did-start-navigation", (n, r, p) => {
      console.log("[MAIN] did-start-navigation url:", r, "inPlace:", p);
    });
  } catch {
  }
  b(), process.env.NODE_ENV === "development" && d.webContents.openDevTools({ mode: "detach" }), y ? d.loadURL(y) : d.loadFile(c.join(A, "index.html"));
}
m.on("window-all-closed", () => {
  process.platform !== "darwin" && (m.quit(), d = null);
});
m.on("activate", () => {
  v.getAllWindows().length === 0 && I();
});
m.whenReady().then(I);
export {
  V as MAIN_DIST,
  A as RENDERER_DIST,
  y as VITE_DEV_SERVER_URL
};
