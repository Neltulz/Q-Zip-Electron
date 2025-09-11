import { spawn } from 'child_process';
import { ipcMain, BrowserWindow } from 'electron';

// Import 7zip-bin using createRequire for ES module compatibility
import { createRequire } from 'module';
import path from 'path';
const require = createRequire(import.meta.url);

// Get the path to 7za.exe directly from the unpacked location
const get7zaPath = (): string => {
  // In development (when running from source)
  if (process.env.NODE_ENV === 'development' || !process.resourcesPath) {
    try {
      // Try to use the 7zip-bin package path in development
      const { path7za } = require('7zip-bin');
      return path7za;
    } catch (error) {
      console.error('Failed to get 7zip-bin path in development:', error);
      return '7za.exe'; // fallback
    }
  }

  // In production (when packaged)
  const appPath = process.resourcesPath;
  const unpackedPath = path.join(appPath, 'app.asar.unpacked', 'node_modules', '7zip-bin', 'win', 'x64', '7za.exe');

  // Verify the file exists
  const fs = require('fs');
  if (fs.existsSync(unpackedPath)) {
    console.log('sevenZip: Using unpacked 7-Zip path:', unpackedPath);
    return unpackedPath;
  } else {
    console.error('sevenZip: 7-Zip binary not found at:', unpackedPath);
    // Try alternative locations
    const altPath = path.join(process.resourcesPath, '..', 'node_modules', '7zip-bin', 'win', 'x64', '7za.exe');
    if (fs.existsSync(altPath)) {
      console.log('sevenZip: Using alternative 7-Zip path:', altPath);
      return altPath;
    }
    return unpackedPath; // return the expected path anyway
  }
};

const path7za = get7zaPath();

export interface CompressJob {
  inputs: string[];
  out: string;
  level?: number;
}

export interface CompressResult {
  ok: boolean;
  error?: string;
}

export function setup7ZipHandlers(): void {
  ipcMain.handle('compress', async (_event, job: CompressJob): Promise<CompressResult> => {
    console.log('sevenZip: Compression job received:', job);
    try {
      if (!job || !Array.isArray(job.inputs) || job.inputs.length === 0) {
        throw new Error('Invalid job: inputs[] is required');
      }
      if (typeof job.out !== 'string' || job.out.trim().length === 0) {
        throw new Error('Invalid job: out path is required');
      }

      const level = Number.isFinite(job.level) ? Math.max(0, Math.min(9, Number(job.level))) : 5;
      const args = ['a', job.out, ...job.inputs, `-mx=${level}`, '-bsp1', '-bso1'];

      console.log('Starting 7-Zip compression:', { path7za, args });

      const child = spawn(path7za, args, {
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: false,
      });

      return new Promise<CompressResult>((resolve, reject) => {
        let stderr = '';
        let stdout = '';

        child.stdout.on('data', (buf) => {
          const line = buf.toString();
          stdout += line;

          // Parse progress from 7-Zip output
          const percentMatch = line.match(/(\d+)%/);
          if (percentMatch) {
            const percent = Number(percentMatch[1]);
            BrowserWindow.getAllWindows().forEach((window) => {
              window.webContents.send('compress:progress', {
                percent: Math.min(100, percent),
                message: line.trim(),
              });
            });
          }
        });

        child.stderr.on('data', (buf) => {
          stderr += buf.toString();
        });

        child.on('error', (err) => {
          console.error('7-Zip spawn error:', err);
          reject(new Error(`Failed to start 7-Zip: ${err.message}`));
        });

        child.on('close', (code) => {
          console.log('7-Zip process closed with code:', code);

          if (code === 0) {
            // Send 100% completion
            BrowserWindow.getAllWindows().forEach((window) => {
              window.webContents.send('compress:progress', {
                percent: 100,
                message: 'Compression completed successfully!',
              });
            });
            resolve({ ok: true });
          } else {
            const errorMsg = stderr || `7-Zip failed with exit code ${code}`;
            console.error('7-Zip error:', errorMsg);
            reject(new Error(errorMsg));
          }
        });
      });
    } catch (error) {
      console.error('Compression handler error:', error);
      return {
        ok: false,
        error: error instanceof Error ? error.message : 'Unknown compression error',
      };
    }
  });

  ipcMain.handle('dialog:selectOutput', async (_event, defaultPath?: string): Promise<string | null> => {
    const { dialog } = require('electron');
    const result = await dialog.showSaveDialog({
      defaultPath: defaultPath || 'archive.7z',
      filters: [
        { name: '7-Zip Archive', extensions: ['7z'] },
        { name: 'ZIP Archive', extensions: ['zip'] },
        { name: 'All Files', extensions: ['*'] },
      ],
    });

    return result.canceled ? null : result.filePath || null;
  });

  ipcMain.handle('dialog:selectFiles', async (): Promise<string[]> => {
    const { dialog } = require('electron');
    const result = await dialog.showOpenDialog({
      properties: ['openFile', 'multiSelections'],
      filters: [
        { name: 'All Files', extensions: ['*'] },
      ],
    });

    return result.canceled ? [] : result.filePaths;
  });
}
