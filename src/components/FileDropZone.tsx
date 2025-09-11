import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useAppStore } from '../store/appStore';

interface FileDropZoneProps {
  className?: string;
  children?: React.ReactNode;
}

export function FileDropZone({ className = '', children }: FileDropZoneProps) {
  const { addFiles, isProcessing } = useAppStore();

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
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
              <span>
                Drag & drop files here, or <button type="button" className="link-button">browse</button>
              </span>
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
