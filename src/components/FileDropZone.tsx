import React, { useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { useAppStore } from '../store/appStore';

interface FileDropZoneProps {
  className?: string;
  children?: React.ReactNode;
}

export function FileDropZone({ className = '', children }: FileDropZoneProps) {
  const { addFiles, isProcessing } = useAppStore();
  // Keep a side-channel for computed relative paths from directory traversal
  const relativePathMapRef = useRef<WeakMap<File, string>>(new WeakMap());

  const onDrop = useCallback(
    (acceptedFiles: File[], _fileRejections?: unknown, event?: unknown) => {
      console.groupCollapsed('%c[Drop] acceptedFiles', 'color:#0bf');
      try {
        console.log('names:', acceptedFiles.map(f => f.name));
        const first = acceptedFiles[0] as unknown as Record<string, unknown> | undefined;
        console.log('first acceptedFile keys:', first ? Object.keys(first) : null);
        console.log('first acceptedFile.path:', (first as unknown as { path?: string })?.path);
      } catch { }
      console.groupEnd();

      if (isProcessing) {
        console.error('FileDropZone: processing in progress, ignoring drop');
        return;
      }

      let droppedPaths: string[] = [];
      const isFolderDrop = acceptedFiles.some(f => {
        const mapRel = relativePathMapRef.current.get(f as File);
        if (typeof mapRel === 'string' && mapRel.includes('/')) return true;
        const rp = (f as any).webkitRelativePath as string | undefined;
        return typeof rp === 'string' && rp.includes('/');
      });
      const dragEvent = event as DragEvent | undefined;
      const dt = dragEvent?.dataTransfer;
      const dtFiles = dt?.files;
      console.groupCollapsed('%c[Drop] dataTransfer', 'color:#fa0');
      try {
        console.log('types:', dt?.types);
        console.log('items length:', dt?.items?.length);
        if (dt?.items) {
          const itemInfo = Array.from(dt.items).map(i => ({ kind: i.kind, type: i.type }));
          console.log('items:', itemInfo);
        }
        console.log('files length:', dtFiles?.length);
        if (dtFiles && dtFiles.length > 0) {
          const f0 = dtFiles.item(0) as unknown as Record<string, unknown> | null;
          console.log('first dt file keys:', f0 ? Object.keys(f0) : null);
          console.log('first dt file.path:', (dtFiles.item(0) as unknown as { path?: string })?.path);
        }
      } catch { }
      console.groupEnd();

      if (!isFolderDrop && dtFiles && dtFiles.length > 0) {
        droppedPaths = Array.from(dtFiles)
          .map((file) => (file as unknown as { path?: string }).path)
          .filter((p): p is string => Boolean(p));
      }

      if (!isFolderDrop && droppedPaths.length === 0) {
        droppedPaths = acceptedFiles
          .map((file) => (file as unknown as { path?: string }).path)
          .filter((p): p is string => Boolean(p));
      }

      if (!isFolderDrop && droppedPaths.length === 0 && dt) {
        const uriList = dt.getData('text/uri-list');
        console.log('[Drop] text/uri-list:', uriList);
        if (uriList && uriList.trim()) {
          const fileUriToPath = (uri: string): string | null => {
            try {
              const u = new URL(uri);
              if (u.protocol !== 'file:') return null;
              let p = decodeURIComponent(u.pathname);
              if (p.startsWith('/') && /^[a-zA-Z]:/.test(p.slice(1))) {
                p = p.slice(1);
              }
              if (navigator.userAgent.includes('Windows')) {
                p = p.replace(/\//g, '\\');
              }
              return p;
            } catch {
              return null;
            }
          };
          const uris = uriList.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
          const parsed = uris.map(fileUriToPath).filter((p): p is string => Boolean(p));
          if (parsed.length > 0) {
            droppedPaths = parsed;
          }
        }
      }

      if (!isFolderDrop && droppedPaths.length === 0 && dt) {
        const plain = dt.getData('text/plain');
        console.log('[Drop] text/plain:', plain);
        if (plain && plain.trim()) {
          const candidates = plain.split(/\r?\n/).map(s => s.trim().replace(/^\"|\"$/g, '')).filter(Boolean);
          const windowsPath = /^(?:[a-zA-Z]:\\\\|\\\\\\\\)/;
          const maybePaths = candidates.filter(line => windowsPath.test(line));
          if (maybePaths.length > 0) {
            droppedPaths = maybePaths;
          }
        }
      }

      const finalize = (paths: string[]) => {
        if (paths.length === 0) {
          console.error('FileDropZone: No file paths available from drop');
          alert('Drag & drop paths are unavailable for this source. Try dragging from your file manager.');
          return;
        }
        // Only unique paths; main already reduces folder drops to top-level entries
        const unique = Array.from(new Set(paths));
        console.log('[Drop] final droppedPaths:', unique);
        addFiles(unique);
      };

      if (droppedPaths.length > 0) {
        finalize(droppedPaths);
        return;
      }

      // Last resort / folder drop: read blobs and create temp copies via main process
      (async () => {
        try {
          console.log('[Drop] fallback: creating temp copies from blobs');
          const parts = await Promise.all(
            acceptedFiles.map(async (f: File & { webkitRelativePath?: string }) => ({
              // Prefer relative path captured during traversal; fallback to native; else filename
              relativePath: (relativePathMapRef.current.get(f as File)) || (f.webkitRelativePath && f.webkitRelativePath.trim().length > 0 ? f.webkitRelativePath : f.name),
              // Top-level folder name (first segment) if we have a relative path; else filename
              name: (() => {
                const rel = relativePathMapRef.current.get(f as File) || f.webkitRelativePath;
                if (rel && rel.includes('/')) return rel.split('/')[0];
                return f.name;
              })(),
              data: await f.arrayBuffer(),
            }))
          );
          const tempPaths = await window.api.createTempCopies(parts);
          finalize(tempPaths);
        } catch (err) {
          console.error('[Drop] temp copy fallback failed:', err);
          alert('Could not access dropped files from this source.');
        }
      })();
    },
    [addFiles, isProcessing]
  );

  // Recursively read dropped directories to produce File objects with webkitRelativePath
  const getFilesFromEvent = async (event: unknown): Promise<File[]> => {
    const ev = event as DragEvent;
    const dt = ev?.dataTransfer;
    if (!dt) return [];

    const entries: any[] = [];
    if (dt.items && dt.items.length > 0) {
      for (let i = 0; i < dt.items.length; i++) {
        const item = dt.items[i] as any;
        const entry = item.webkitGetAsEntry ? item.webkitGetAsEntry() : null;
        if (entry) entries.push(entry);
      }
    }

    const files: File[] = [];

    const readEntry = async (entry: any, parentPath: string): Promise<void> => {
      if (!entry) return;
      if (entry.isFile) {
        await new Promise<void>((resolve) => {
          entry.file((file: File) => {
            const rel = parentPath ? `${parentPath}/${file.name}` : file.name;
            try { (file as any).webkitRelativePath = rel; } catch { }
            // Persist the computed relative path in side-channel map
            relativePathMapRef.current.set(file, rel);
            files.push(file);
            resolve();
          });
        });
      } else if (entry.isDirectory) {
        const dirReader = entry.createReader();
        await new Promise<void>((resolve) => {
          const readBatch = () => {
            dirReader.readEntries(async (batch: any[]) => {
              if (!batch || batch.length === 0) {
                resolve();
                return;
              }
              for (const child of batch) {
                await readEntry(child, parentPath ? `${parentPath}/${entry.name}` : entry.name);
              }
              readBatch();
            });
          };
          readBatch();
        });
      }
    };

    if (entries.length > 0) {
      for (const entry of entries) {
        await readEntry(entry, '');
      }
      return files;
    }

    // Fallback: plain files
    if (dt.files && dt.files.length > 0) {
      return Array.from(dt.files) as unknown as File[];
    }
    return [];
  };

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    disabled: isProcessing,
    noClick: true, // Disable click to open file dialog, we'll handle that separately
    noKeyboard: false,
    noDragEventsBubbling: true,
    multiple: true,
    // Use custom directory traversal to preserve folder structure for folder drops
    useFsAccessApi: false,
    getFilesFromEvent,
    onDragEnter: (event) => {
      try {
        const types = (event as React.DragEvent).dataTransfer?.types;
        console.log('[DZ] onDragEnter types:', types);
      } catch { }
    },
    onDragOver: (event) => {
      try {
        const dt = (event as React.DragEvent).dataTransfer;
        console.log('[DZ] onDragOver files length:', dt?.files?.length, 'items length:', dt?.items?.length, 'types:', dt?.types);
      } catch { }
    },
    onDragLeave: () => { console.log('[DZ] onDragLeave'); },
    onDropAccepted: (files) => { console.log('[DZ] onDropAccepted count:', files.length); },
    onDropRejected: (rejections) => { console.log('[DZ] onDropRejected count:', rejections.length); },
    onFileDialogCancel: () => { console.log('[DZ] onFileDialogCancel'); },
  });

  const getDropZoneClassName = () => {
    let baseClass = 'drop-zone';
    if (className) baseClass += ` ${className}`;
    if (isDragActive) baseClass += ' drop-zone--active';
    if (isDragReject) baseClass += ' drop-zone--reject';
    if (isProcessing) baseClass += ' drop-zone--disabled';
    return baseClass;
  };

  return (
    <div
      {...getRootProps()}
      className={getDropZoneClassName()}
    >
      <input {...getInputProps()} />
      {children || (
        <div className="drop-zone-content">
          <div className="drop-zone-icon">
            {isDragActive ? '📂' : '📁'}
          </div>
          <div className="drop-zone-text">
            {isProcessing ? (
              <span>Processing files...</span>
            ) : isDragActive ? (
              <span>Drop files here...</span>
            ) : (
              <div>
                <div style={{ marginBottom: '8px' }}>
                  Drag & drop files here
                </div>
                <div style={{ fontSize: '12px', color: '#666' }}>
                  Tip: Drag & drop works best with files on the same drive
                </div>
              </div>
            )}
          </div>
          {isDragReject && (
            <div className="drop-zone-error">
              Some files were rejected. Please try again.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
