import { ipcMain as u, BrowserWindow as p, app as i } from "electron";
import { fileURLToPath as I } from "node:url";
import s from "node:path";
import { spawn as y } from "child_process";
import { createRequire as E } from "module";
import w from "path";
const d = E(import.meta.url), O = () => {
  if (process.env.NODE_ENV === "development" || !process.resourcesPath)
    try {
      const { path7za: o } = d("7zip-bin");
      return o;
    } catch (o) {
      return console.error("Failed to get 7zip-bin path in development:", o), "7za.exe";
    }
  const a = process.resourcesPath, e = w.join(a, "app.asar.unpacked", "node_modules", "7zip-bin", "win", "x64", "7za.exe"), r = d("fs");
  if (r.existsSync(e))
    return console.log("sevenZip: Using unpacked 7-Zip path:", e), e;
  {
    console.error("sevenZip: 7-Zip binary not found at:", e);
    const o = w.join(process.resourcesPath, "..", "node_modules", "7zip-bin", "win", "x64", "7za.exe");
    return r.existsSync(o) ? (console.log("sevenZip: Using alternative 7-Zip path:", o), o) : e;
  }
}, v = O();
function S() {
  u.handle("compress", async (a, e) => {
    console.log("sevenZip: Compression job received:", e);
    try {
      if (!e || !Array.isArray(e.inputs) || e.inputs.length === 0)
        throw new Error("Invalid job: inputs[] is required");
      if (typeof e.out != "string" || e.out.trim().length === 0)
        throw new Error("Invalid job: out path is required");
      const r = Number.isFinite(e.level) ? Math.max(0, Math.min(9, Number(e.level))) : 5, o = ["a", e.out, ...e.inputs, `-mx=${r}`, "-bsp1", "-bso1"];
      console.log("Starting 7-Zip compression:", { path7za: v, args: o });
      const c = y(v, o, {
        stdio: ["pipe", "pipe", "pipe"],
        shell: !1
      });
      return new Promise((R, h) => {
        let f = "", Z = "";
        c.stdout.on("data", (n) => {
          const t = n.toString();
          Z += t;
          const g = t.match(/(\d+)%/);
          if (g) {
            const z = Number(g[1]);
            p.getAllWindows().forEach((A) => {
              A.webContents.send("compress:progress", {
                percent: Math.min(100, z),
                message: t.trim()
              });
            });
          }
        }), c.stderr.on("data", (n) => {
          f += n.toString();
        }), c.on("error", (n) => {
          console.error("7-Zip spawn error:", n), h(new Error(`Failed to start 7-Zip: ${n.message}`));
        }), c.on("close", (n) => {
          if (console.log("7-Zip process closed with code:", n), n === 0)
            p.getAllWindows().forEach((t) => {
              t.webContents.send("compress:progress", {
                percent: 100,
                message: "Compression completed successfully!"
              });
            }), R({ ok: !0 });
          else {
            const t = f || `7-Zip failed with exit code ${n}`;
            console.error("7-Zip error:", t), h(new Error(t));
          }
        });
      });
    } catch (r) {
      return console.error("Compression handler error:", r), {
        ok: !1,
        error: r instanceof Error ? r.message : "Unknown compression error"
      };
    }
  }), u.handle("dialog:selectOutput", async (a, e) => {
    const { dialog: r } = d("electron"), o = await r.showSaveDialog({
      defaultPath: e || "archive.7z",
      filters: [
        { name: "7-Zip Archive", extensions: ["7z"] },
        { name: "ZIP Archive", extensions: ["zip"] },
        { name: "All Files", extensions: ["*"] }
      ]
    });
    return o.canceled ? null : o.filePath || null;
  }), u.handle("dialog:selectFiles", async () => {
    const { dialog: a } = d("electron"), e = await a.showOpenDialog({
      properties: ["openFile", "multiSelections"],
      filters: [
        { name: "All Files", extensions: ["*"] }
      ]
    });
    return e.canceled ? [] : e.filePaths;
  });
}
const P = s.dirname(I(import.meta.url));
process.env.APP_ROOT = s.join(P, "..");
const m = process.env.VITE_DEV_SERVER_URL, F = s.join(process.env.APP_ROOT, "dist-electron"), _ = s.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = m ? s.join(process.env.APP_ROOT, "public") : _;
let l;
const T = E(import.meta.url), b = T("electron-squirrel-startup");
b && i.quit();
function x() {
  i.setAppUserModelId("com.qzipelectron.app"), l = new p({
    icon: s.join(process.env.VITE_PUBLIC, "electron-vite.svg"),
    width: 1920,
    height: 1080,
    webPreferences: {
      preload: s.join(P, "preload.mjs"),
      nodeIntegration: !1,
      contextIsolation: !0,
      sandbox: !0
    }
  }), S(), process.env.NODE_ENV === "development" && l.webContents.openDevTools({ mode: "detach" }), m ? l.loadURL(m) : l.loadFile(s.join(_, "index.html"));
}
i.on("window-all-closed", () => {
  process.platform !== "darwin" && (i.quit(), l = null);
});
i.on("activate", () => {
  p.getAllWindows().length === 0 && x();
});
i.whenReady().then(x);
export {
  F as MAIN_DIST,
  _ as RENDERER_DIST,
  m as VITE_DEV_SERVER_URL
};
