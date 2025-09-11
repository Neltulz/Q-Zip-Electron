import { useAppStore } from './store/appStore';
import { FileDropZone } from './components/FileDropZone';
import { FileList } from './components/FileList';
import './App.css'

export function App() {
  const {
    files,
    isProcessing,
    error,
    clearFiles,
    removeFile,
  } = useAppStore();

  return (
    <div className="app">
      <header className="app-header">
        <h1>🚀 Q-Zip Electron</h1>
        <div className="badges">
          <span className="badge typescript">TypeScript</span>
          <span className="badge react">React</span>
          <span className="badge zustand">Zustand</span>
        </div>
      </header>

      <main className="app-main">
        <div className="phase-indicator">
          <h2>Phase 5: State Management & Drag & Drop</h2>
          <div className="phase-features">
            <span className="feature-tag">✅ Zustand Store</span>
            <span className="feature-tag">✅ File Drop Zone</span>
            <span className="feature-tag">✅ File Management</span>
          </div>
        </div>

        <div className="drop-zone-section">
          <FileDropZone>
            <div className="drop-zone-content">
              <div className="drop-zone-icon">
                📂
              </div>
              <div className="drop-zone-text">
                <strong>Drop files here to add them for compression</strong>
                <br />
                <small>Supports multiple files and folders</small>
              </div>
            </div>
          </FileDropZone>
        </div>

        {files.length > 0 && (
          <div className="file-list-section">
            <FileList files={files} onRemoveFile={removeFile} />
            <div className="file-actions">
              <button
                type="button"
                className="action-button secondary"
                onClick={clearFiles}
                disabled={isProcessing}
              >
                Clear All Files
              </button>
              <button
                type="button"
                className="action-button primary"
                disabled={files.length === 0 || isProcessing}
              >
                {isProcessing ? 'Processing...' : 'Compress Files'}
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="error-message">
            <strong>Error:</strong> {error}
          </div>
        )}

        <div className="info-section">
          <h3>Phase 5 Features:</h3>
          <ul>
            <li>Zustand state management for files and app state</li>
            <li>React Dropzone for drag & drop file handling</li>
            <li>File list with size display and removal</li>
            <li>Duplicate file prevention</li>
            <li>Processing state management</li>
          </ul>
          <p><strong>Next:</strong> Add 7-Zip integration for actual compression</p>
        </div>
      </main>
    </div>
  );
}

export default App;
