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
  // One staging root per session; we copy blobs/files here so we can
  // pass relative paths to 7-Zip and keep archive entries rooted cleanly
  let sessionRoot: string | null = null;
  const ensureSessionRoot = (): string => {
    const fs = require('fs');
    const os = require('os');
    const pathLocal = require('path');
    if (sessionRoot && typeof sessionRoot === 'string' && fs.existsSync(sessionRoot)) return sessionRoot as string;
    sessionRoot = fs.mkdtempSync(pathLocal.join(os.tmpdir(), 'qzip-staging-'));
    return sessionRoot as string;
  };
  const cleanupSessionRoot = () => {
    try {
      if (!sessionRoot) return;
      const fs = require('fs');
      if (fs.existsSync(sessionRoot)) {
        fs.rmSync(sessionRoot, { recursive: true, force: true });
      }
      sessionRoot = null;
    } catch (e) {
      console.warn('cleanupSessionRoot: unexpected error', e);
    }
  };
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
      // If inputs are inside our sessionRoot, use relative paths and set cwd to sessionRoot
      const pathLocal = require('path');
      const root = ensureSessionRoot();
      const relInputs: string[] = [];
      let allUnderRoot = true;
      for (const p of job.inputs) {
        const rel = pathLocal.relative(root, p);
        if (rel.startsWith('..') || pathLocal.isAbsolute(rel)) {
          allUnderRoot = false;
          break;
        }
        relInputs.push(rel);
      }

      const useRel = allUnderRoot && relInputs.length === job.inputs.length && relInputs.length > 0;
      const args = useRel
        ? ['a', job.out, ...relInputs, `-mx=${level}`, '-bsp1', '-bso1']
        : ['a', job.out, ...job.inputs, `-mx=${level}`, '-bsp1', '-bso1'];

      console.log('Starting 7-Zip compression:', { path7za, args });

      const child = spawn(path7za, args, {
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: false,
        cwd: useRel ? root : undefined,
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

        const cleanupTemp = () => {
          cleanupSessionRoot();
        };

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
            cleanupTemp();
            resolve({ ok: true });
          } else {
            const errorMsg = stderr || `7-Zip failed with exit code ${code}`;
            console.error('7-Zip error:', errorMsg);
            cleanupTemp();
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

  // No need for resolveDroppedFilePaths: with sandbox disabled, renderer gets File.path directly

  // Create temp copies from dropped blobs to obtain usable file paths
  ipcMain.handle('temp:createCopies', async (_event, parts: Array<{ name: string; data: ArrayBuffer; relativePath?: string }>): Promise<string[]> => {
    const fs = require('fs');
    const pathLocal = require('path');

    const tmpDir = ensureSessionRoot();
    const filePaths: string[] = [];
    const topLevelSet: Set<string> = new Set();
    for (const part of parts) {
      const safeName = String(part.name || 'file');
      const rel = part.relativePath && typeof part.relativePath === 'string' && part.relativePath.trim().length > 0
        ? part.relativePath
        : safeName;
      // Track top-level entry name for folder summarization
      const seg = rel.split(/[\\\/]+/).filter(Boolean)[0] || safeName;
      const topPath = pathLocal.join(tmpDir, seg);
      topLevelSet.add(topPath);
      const target = pathLocal.join(tmpDir, rel);
      const targetDir = pathLocal.dirname(target);
      fs.mkdirSync(targetDir, { recursive: true });
      const buf = Buffer.from(part.data);
      fs.writeFileSync(target, buf);
      filePaths.push(target);
    }
    // Return only top-level entries (folders or single files) so UI shows folder(s), not every file
    return Array.from(topLevelSet);
  });
}
