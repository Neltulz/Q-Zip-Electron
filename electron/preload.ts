import { contextBridge, ipcRenderer } from 'electron';

// Diagnostics to confirm preload is loaded and bridge is set up
try {
  // eslint-disable-next-line no-console
  console.log('[preload] loaded. contextIsolation active, exposing api...');
} catch { }

export interface CompressJob {
  inputs: string[];
  out: string;
  level?: number;
}

export interface CompressResult {
  ok: boolean;
  error?: string;
}

export interface ProgressData {
  percent: number;
  message: string;
}

type TempFilePart = { name: string; data: ArrayBuffer; relativePath?: string };

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
const api = {
  compress: (job: CompressJob): Promise<CompressResult> =>
    ipcRenderer.invoke('compress', job),

  selectFiles: (): Promise<string[]> =>
    ipcRenderer.invoke('dialog:selectFiles'),

  onProgress: (callback: (data: ProgressData) => void): (() => void) => {
    const listener = (_: unknown, data: ProgressData) => callback(data);
    ipcRenderer.on('compress:progress', listener);
    return () => ipcRenderer.removeListener('compress:progress', listener);
  },

  selectOutputPath: (): Promise<string | null> =>
    ipcRenderer.invoke('dialog:selectOutput'),

  // Write dropped file blobs to a temp folder; returns file paths
  createTempCopies: (parts: TempFilePart[]): Promise<string[]> =>
    ipcRenderer.invoke('temp:createCopies', parts),
};

try {
  // eslint-disable-next-line no-console
  console.log('[preload] exposing api keys:', Object.keys(api));
} catch { }

contextBridge.exposeInMainWorld('api', api);
