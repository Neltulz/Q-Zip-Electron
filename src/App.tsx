import { useAppStore } from './store/appStore';
import { useCompression } from './hooks/useCompression';
import { FileDropZone } from './components/FileDropZone';
import { FileList } from './components/FileList';
import { CompressionControls } from './components/CompressionControls';
import { ProgressBar } from './components/ProgressBar';
import './App.css'

export function App() {
  const {
    files,
    error,
    removeFile,
  } = useAppStore();

  const { progress, isCompressing } = useCompression();

  return (
    <div className="app">
      <header className="app-header">
        <h1>🚀 Q-Zip Electron</h1>
        <div className="badges">
          <span className="badge typescript">TypeScript</span>
          <span className="badge react">React</span>
          <span className="badge zustand">Zustand</span>
          <span className="badge sevenzip">7-Zip</span>
        </div>
      </header>

      <main className="app-main">
        <div className="phase-indicator">
          <h2>Phase 6: 7-Zip Integration</h2>
          <div className="phase-features">
            <span className="feature-tag">✅ IPC Communication</span>
            <span className="feature-tag">✅ 7-Zip Binary</span>
            <span className="feature-tag">✅ Progress Tracking</span>
            <span className="feature-tag">✅ File Compression</span>
          </div>
        </div>

        <ProgressBar progress={progress} isVisible={isCompressing} />

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
            <CompressionControls />
          </div>
        )}

        {error && (
          <div className="error-message">
            <strong>Error:</strong> {error}
          </div>
        )}

        <div className="info-section">
          <h3>Phase 6 Features:</h3>
          <ul>
            <li>7-Zip binary integration for file compression</li>
            <li>IPC communication between main and renderer processes</li>
            <li>Real-time compression progress tracking</li>
            <li>Output path selection dialog</li>
            <li>Secure context isolation with preload script</li>
          </ul>
          <p><strong>Next:</strong> Add advanced features (virtual lists, dialogs, etc.)</p>
        </div>
      </main>
    </div>
  );
}

export default App;
