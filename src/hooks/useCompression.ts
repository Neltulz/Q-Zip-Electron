import { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '../store/appStore';

export interface CompressionProgress {
  percent: number;
  message: string;
}

export function useCompression() {
  const [isCompressing, setIsCompressing] = useState(false);
  const [progress, setProgress] = useState<CompressionProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { files, outputPath, setProcessing, setError: setStoreError } = useAppStore();

  // Listen for progress updates
  useEffect(() => {
    // Wait for window.api to be available
    if (!window.api) {
      console.warn('useCompression: window.api not available, progress updates disabled');
      return;
    }

    console.log('useCompression: Setting up progress listener');
    const unsubscribe = window.api.onProgress((data: CompressionProgress) => {
      console.log('useCompression: Progress update:', data);
      setProgress(data);
    });

    return unsubscribe;
  }, []);

  const selectOutputPath = useCallback(async (): Promise<string | null> => {
    if (!window.api) {
      setError('API not available');
      return null;
    }

    try {
      const path = await window.api.selectOutputPath();
      return path;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to select output path';
      setError(errorMsg);
      return null;
    }
  }, [setError]);

  const compressFiles = useCallback(async (outputPathParam?: string): Promise<boolean> => {
    console.log('useCompression: Starting compression, window.api exists:', !!window.api);
    if (!window.api) {
      console.error('useCompression: window.api is undefined');
      setError('API not available');
      return false;
    }

    if (isCompressing) {
      console.log('useCompression: Compression already in progress, skipping');
      return false;
    }

    if (files.length === 0) {
      setError('No files to compress');
      return false;
    }

    const finalOutputPath = outputPathParam || outputPath;
    if (!finalOutputPath) {
      setError('No output path specified');
      return false;
    }

    setIsCompressing(true);
    setError(null);
    setProgress(null);
    setProcessing(true);
    setStoreError(null);

    try {
      // Deduplicate before sending to 7-Zip to avoid duplicate filename collisions
      // Only pass top-level entries (files or directories) to 7-Zip
      const filePathSet = new Set(files.map(f => f.path));
      const filePaths = Array.from(filePathSet);
      console.log('useCompression: File paths to compress:', filePaths);
      console.log('useCompression: Output path:', finalOutputPath);

      const result = await window.api.compress({
        inputs: filePaths,
        out: finalOutputPath,
        level: 5, // Default compression level
      });

      if (!result.ok) {
        throw new Error(result.error || 'Compression failed');
      }

      return true;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Compression failed';
      setError(errorMsg);
      setStoreError(errorMsg);
      return false;
    } finally {
      setIsCompressing(false);
      setProcessing(false);
    }
  }, [files, outputPath, setProcessing, setStoreError]);

  return {
    isCompressing,
    progress,
    error,
    selectOutputPath,
    compressFiles,
  };
}
