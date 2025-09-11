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
  addFiles: (files: File[]) => void;
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

  addFiles: (fileList: File[]) => {
    const currentFiles = get().files;
    const newFiles: FileItem[] = fileList.map((file, index) => ({
      id: `${Date.now()}-${index}`,
      name: file.name,
      path: (file as any).path || file.webkitRelativePath || file.name,
      size: file.size,
      type: file.type || 'application/octet-stream',
      lastModified: file.lastModified,
    }));

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
