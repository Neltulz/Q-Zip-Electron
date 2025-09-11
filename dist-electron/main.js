import { ipcMain, BrowserWindow, app } from "electron";
import { fileURLToPath } from "node:url";
import path$1 from "node:path";
import fs from "node:fs";
import { spawn } from "child_process";
import { createRequire } from "module";
import path from "path";
const require$1 = createRequire(import.meta.url);
const get7zaPath = () => {
  if (process.env.NODE_ENV === "development" || !process.resourcesPath) {
    try {
      const { path7za: path7za2 } = require$1("7zip-bin");
      return path7za2;
    } catch (error) {
      console.error("Failed to get 7zip-bin path in development:", error);
      return "7za.exe";
    }
  }
  const appPath = process.resourcesPath;
  const unpackedPath = path.join(appPath, "app.asar.unpacked", "node_modules", "7zip-bin", "win", "x64", "7za.exe");
  const fs2 = require$1("fs");
  if (fs2.existsSync(unpackedPath)) {
    console.log("sevenZip: Using unpacked 7-Zip path:", unpackedPath);
    return unpackedPath;
  } else {
    console.error("sevenZip: 7-Zip binary not found at:", unpackedPath);
    const altPath = path.join(process.resourcesPath, "..", "node_modules", "7zip-bin", "win", "x64", "7za.exe");
    if (fs2.existsSync(altPath)) {
      console.log("sevenZip: Using alternative 7-Zip path:", altPath);
      return altPath;
    }
    return unpackedPath;
  }
};
const path7za = get7zaPath();
function setup7ZipHandlers() {
  ipcMain.handle("compress", async (_event, job) => {
    console.log("sevenZip: Compression job received:", job);
    try {
      if (!job || !Array.isArray(job.inputs) || job.inputs.length === 0) {
        throw new Error("Invalid job: inputs[] is required");
      }
      if (typeof job.out !== "string" || job.out.trim().length === 0) {
        throw new Error("Invalid job: out path is required");
      }
      const level = Number.isFinite(job.level) ? Math.max(0, Math.min(9, Number(job.level))) : 5;
      const args = ["a", job.out, ...job.inputs, `-mx=${level}`, "-bsp1", "-bso1"];
      console.log("Starting 7-Zip compression:", { path7za, args });
      const child = spawn(path7za, args, {
        stdio: ["pipe", "pipe", "pipe"],
        shell: false
      });
      return new Promise((resolve, reject) => {
        let stderr = "";
        let stdout = "";
        child.stdout.on("data", (buf) => {
          const line = buf.toString();
          stdout += line;
          const percentMatch = line.match(/(\d+)%/);
          if (percentMatch) {
            const percent = Number(percentMatch[1]);
            BrowserWindow.getAllWindows().forEach((window) => {
              window.webContents.send("compress:progress", {
                percent: Math.min(100, percent),
                message: line.trim()
              });
            });
          }
        });
        child.stderr.on("data", (buf) => {
          stderr += buf.toString();
        });
        child.on("error", (err) => {
          console.error("7-Zip spawn error:", err);
          reject(new Error(`Failed to start 7-Zip: ${err.message}`));
        });
        child.on("close", (code) => {
          console.log("7-Zip process closed with code:", code);
          if (code === 0) {
            BrowserWindow.getAllWindows().forEach((window) => {
              window.webContents.send("compress:progress", {
                percent: 100,
                message: "Compression completed successfully!"
              });
            });
            resolve({ ok: true });
          } else {
            const errorMsg = stderr || `7-Zip failed with exit code ${code}`;
            console.error("7-Zip error:", errorMsg);
            reject(new Error(errorMsg));
          }
        });
      });
    } catch (error) {
      console.error("Compression handler error:", error);
      return {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown compression error"
      };
    }
  });
  ipcMain.handle("dialog:selectOutput", async (_event, defaultPath) => {
    const { dialog } = require$1("electron");
    const result = await dialog.showSaveDialog({
      defaultPath: defaultPath || "archive.7z",
      filters: [
        { name: "7-Zip Archive", extensions: ["7z"] },
        { name: "ZIP Archive", extensions: ["zip"] },
        { name: "All Files", extensions: ["*"] }
      ]
    });
    return result.canceled ? null : result.filePath || null;
  });
  ipcMain.handle("dialog:selectFiles", async () => {
    const { dialog } = require$1("electron");
    const result = await dialog.showOpenDialog({
      properties: ["openFile", "multiSelections"],
      filters: [
        { name: "All Files", extensions: ["*"] }
      ]
    });
    return result.canceled ? [] : result.filePaths;
  });
  ipcMain.handle("temp:createCopies", async (_event, parts) => {
    const fs2 = require$1("fs");
    const os = require$1("os");
    const pathLocal = require$1("path");
    const tmpDir = fs2.mkdtempSync(pathLocal.join(os.tmpdir(), "qzip-drop-"));
    const filePaths = [];
    for (const part of parts) {
      const safeName = String(part.name || "file");
      const rel = part.relativePath && typeof part.relativePath === "string" && part.relativePath.trim().length > 0 ? part.relativePath : safeName;
      const target = pathLocal.join(tmpDir, rel);
      const targetDir = pathLocal.dirname(target);
      fs2.mkdirSync(targetDir, { recursive: true });
      const buf = Buffer.from(part.data);
      fs2.writeFileSync(target, buf);
      filePaths.push(target);
    }
    return filePaths;
  });
}
const __dirname = path$1.dirname(fileURLToPath(import.meta.url));
process.env.APP_ROOT = path$1.join(__dirname, "..");
const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
const MAIN_DIST = path$1.join(process.env.APP_ROOT, "dist-electron");
const RENDERER_DIST = path$1.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path$1.join(process.env.APP_ROOT, "public") : RENDERER_DIST;
let win;
const require2 = createRequire(import.meta.url);
const squirrelStartup = require2("electron-squirrel-startup");
if (squirrelStartup) {
  app.quit();
}
function createWindow() {
  app.setAppUserModelId("com.qzipelectron.app");
  const preloadDir = __dirname;
  const preloadMjs = path$1.join(preloadDir, "preload.mjs");
  let preloadPath = preloadMjs;
  try {
    if (fs.existsSync(preloadMjs)) {
      const content = fs.readFileSync(preloadMjs, "utf-8");
      if (/\brequire\(/.test(content) || /module\.exports/.test(content)) {
        const cjsPath = path$1.join(preloadDir, "preload.cjs");
        fs.writeFileSync(cjsPath, content, "utf-8");
        preloadPath = cjsPath;
      }
    } else {
      const jsPath = path$1.join(preloadDir, "preload.js");
      if (fs.existsSync(jsPath)) preloadPath = jsPath;
    }
  } catch {
  }
  win = new BrowserWindow({
    icon: path$1.join(process.env.VITE_PUBLIC, "electron-vite.svg"),
    width: 1920,
    height: 1080,
    webPreferences: {
      preload: preloadPath,
      nodeIntegration: false,
      contextIsolation: true,
      // Disable sandbox so Electron exposes File.path in the renderer for drag & drop
      sandbox: false
    }
  });
  try {
    win.webContents.on("will-navigate", (e, url) => {
      if (url.startsWith("file://") || url.startsWith("http://") || url.startsWith("https://")) {
        console.log("[MAIN] will-navigate prevented:", url);
        e.preventDefault();
      }
    });
    win.webContents.on("did-start-navigation", (_e, url, isInPlace) => {
      console.log("[MAIN] did-start-navigation url:", url, "inPlace:", isInPlace);
    });
  } catch {
  }
  setup7ZipHandlers();
  if (process.env.NODE_ENV === "development") {
    win.webContents.openDevTools({ mode: "detach" });
  }
  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path$1.join(RENDERER_DIST, "index.html"));
  }
}
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
    win = null;
  }
});
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
app.whenReady().then(createWindow);
export {
  MAIN_DIST,
  RENDERER_DIST,
  VITE_DEV_SERVER_URL
};
