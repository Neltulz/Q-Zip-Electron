"use strict";
const electron = require("electron");
try {
  console.log("[preload] loaded. contextIsolation active, exposing api...");
} catch {
}
const api = {
  compress: (job) => electron.ipcRenderer.invoke("compress", job),
  selectFiles: () => electron.ipcRenderer.invoke("dialog:selectFiles"),
  onProgress: (callback) => {
    const listener = (_, data) => callback(data);
    electron.ipcRenderer.on("compress:progress", listener);
    return () => electron.ipcRenderer.removeListener("compress:progress", listener);
  },
  selectOutputPath: () => electron.ipcRenderer.invoke("dialog:selectOutput"),
  // Write dropped file blobs to a temp folder; returns file paths
  createTempCopies: (parts) => electron.ipcRenderer.invoke("temp:createCopies", parts)
};
try {
  console.log("[preload] exposing api keys:", Object.keys(api));
} catch {
}
electron.contextBridge.exposeInMainWorld("api", api);
