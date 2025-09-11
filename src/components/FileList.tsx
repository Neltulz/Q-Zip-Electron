import { FileItem } from '../store/appStore';
import { formatFileSize } from '../utils/formatters';

interface FileListProps {
  files: FileItem[];
  onRemoveFile: (id: string) => void;
}

function FileListItem({ file, onRemove }: { file: FileItem; onRemove: (id: string) => void }) {
  return (
    <div className="file-item">
      <div className="file-info">
        <div className="file-name" title={file.name}>
          {file.name}
        </div>
        <div className="file-details">
          <span className="file-size">{formatFileSize(file.size)}</span>
          <span className="file-type">{file.type}</span>
        </div>
      </div>
      <button
        type="button"
        className="remove-button"
        onClick={() => onRemove(file.id)}
        aria-label={`Remove ${file.name}`}
      >
        ✕
      </button>
    </div>
  );
}

export function FileList({ files, onRemoveFile }: FileListProps) {
  if (files.length === 0) {
    return (
      <div className="file-list-empty">
        <p>No files added yet. Drag files above or click to browse.</p>
      </div>
    );
  }

  return (
    <div className="file-list">
      <div className="file-list-header">
        <h3>Files to Compress ({files.length})</h3>
        <div className="file-list-total">
          Total: {formatFileSize(files.reduce((sum, file) => sum + file.size, 0))}
        </div>
      </div>
      <div className="file-list-items">
        {files.map(file => (
          <FileListItem
            key={file.id}
            file={file}
            onRemove={onRemoveFile}
          />
        ))}
      </div>
    </div>
  );
}
