import { create } from 'zustand';

export interface FileItem {
  id: string;
  name: string;
  path: string;
  size: number;
  type: string;
  lastModified: number;
}

export interface AppState {
  files: FileItem[];
  isProcessing: boolean;
  error: string | null;
  outputPath: string | null;

  // Actions
  addFiles: (filePaths: string[]) => void;
  removeFile: (id: string) => void;
  clearFiles: () => void;
  setProcessing: (processing: boolean) => void;
  setError: (error: string | null) => void;
  setOutputPath: (path: string | null) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  files: [],
  isProcessing: false,
  error: null,
  outputPath: null,

  addFiles: (filePaths: string[]) => {
    const currentFiles = get().files;
    console.log('appStore: addFiles called with file paths:', filePaths);

    const newFiles: FileItem[] = filePaths.map((filePath, index) => {
      console.log('appStore: Processing file path:', filePath);
      const fileName = filePath.split(/[/\\]/).pop() || 'unknown';
      return {
        id: `${Date.now()}-${index}`,
        name: fileName,
        path: filePath,
        size: 0, // Size not available from path alone
        type: 'application/octet-stream',
        lastModified: Date.now(),
      };
    });

    // Avoid duplicates based on path
    const existingPaths = new Set(currentFiles.map(f => f.path));
    const uniqueNewFiles = newFiles.filter(f => !existingPaths.has(f.path));

    set(state => ({
      files: [...state.files, ...uniqueNewFiles],
      error: null,
    }));
  },

  removeFile: (id: string) => {
    set(state => ({
      files: state.files.filter(f => f.id !== id),
    }));
  },

  clearFiles: () => {
    set({
      files: [],
      error: null,
    });
  },

  setProcessing: (processing: boolean) => {
    set({ isProcessing: processing });
  },

  setError: (error: string | null) => {
    set({ error });
  },

  setOutputPath: (path: string | null) => {
    set({ outputPath: path });
  },
}));
