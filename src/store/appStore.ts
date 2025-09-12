import { create } from 'zustand';

export interface FileItem {
  id: string;
  name: string;
  path: string;
  isDirectory?: boolean;
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

    // Deduplicate against existing and within this batch
    const seenPaths = new Set(currentFiles.map(f => f.path));
    const dedupedPaths: string[] = [];
    for (const p of filePaths) {
      if (!seenPaths.has(p)) {
        seenPaths.add(p);
        dedupedPaths.push(p);
      } else {
        console.log('appStore: Skipping duplicate path:', p);
      }
    }

    const now = Date.now();
    const newFiles: FileItem[] = dedupedPaths.map((filePath, index) => {
      console.log('appStore: Processing file path:', filePath);
      const fileName = filePath.split(/[/\\]/).pop() || 'unknown';
      return {
        id: `${now}-${index}`,
        name: fileName,
        path: filePath,
        isDirectory: !/\.[^\\/.]+$/.test(fileName),
        size: 0, // Size not available from path alone
        type: 'application/octet-stream',
        lastModified: now,
      };
    });

    if (newFiles.length === 0) {
      console.log('appStore: No new files to add after dedup');
      set(state => ({ ...state, error: null }));
      return;
    }

    set(state => ({
      files: [...state.files, ...newFiles],
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
