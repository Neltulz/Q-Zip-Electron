import { contextBridge, ipcRenderer } from 'electron';

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

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('api', {
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
});
