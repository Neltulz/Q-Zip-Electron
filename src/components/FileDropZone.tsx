import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useAppStore } from '../store/appStore';

interface FileDropZoneProps {
  className?: string;
  children?: React.ReactNode;
}

export function FileDropZone({ className = '', children }: FileDropZoneProps) {
  const { addFiles, isProcessing } = useAppStore();

  const handleSelectFiles = async () => {
    console.log('FileDropZone: Browse button clicked, window.api exists:', !!window.api);
    if (!window.api || isProcessing) {
      console.error('FileDropZone: window.api is not available or processing');
      return;
    }

    try {
      const filePaths = await window.api.selectFiles();
      console.log('FileDropZone: Selected file paths:', filePaths);
      if (filePaths.length > 0) {
        addFiles(filePaths);
      }
    } catch (error) {
      console.error('Failed to select files:', error);
    }
  };

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      console.log('FileDropZone: Files dropped via drag & drop:', acceptedFiles.map(f => f.name));
      console.log('FileDropZone: First file path property:', (acceptedFiles[0] as any)?.path);
      if (!isProcessing && acceptedFiles.length > 0) {
        addFiles(acceptedFiles);
      }
    },
    [addFiles, isProcessing]
  );

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    disabled: isProcessing,
    noClick: false,
    noKeyboard: false,
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
    <div {...getRootProps()} className={getDropZoneClassName()}>
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
                <span>
                  Drag & drop files here, or{' '}
                  <button
                    type="button"
                    className="link-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectFiles();
                    }}
                    disabled={isProcessing}
                  >
                    browse files
                  </button>
                </span>
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
