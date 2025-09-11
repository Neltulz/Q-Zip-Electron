import { useState } from 'react';
import { useAppStore } from '../store/appStore';
import { useCompression } from '../hooks/useCompression';

export function CompressionControls() {
  const { files, isProcessing } = useAppStore();
  const { compressFiles, selectOutputPath, isCompressing } = useCompression();
  const [outputPath, setOutputPath] = useState<string>('');

  const handleSelectOutput = async () => {
    const path = await selectOutputPath();
    if (path) {
      setOutputPath(path);
    }
  };

  const handleCompress = async () => {
    let finalPath = outputPath;
    if (!finalPath) {
      const selectedPath = await selectOutputPath();
      if (!selectedPath) return;
      finalPath = selectedPath;
      setOutputPath(finalPath);
    }

    const success = await compressFiles(finalPath);
    if (success) {
      // Could add success notification here
      console.log('Compression completed successfully!');
    }
  };

  if (files.length === 0) return null;

  return (
    <div className="compression-controls">
      <div className="output-selection">
        <label htmlFor="output-path">Output Archive:</label>
        <div className="output-input-group">
          <input
            id="output-path"
            type="text"
            value={outputPath}
            onChange={(e) => setOutputPath(e.target.value)}
            placeholder="Select output path..."
            disabled={isProcessing}
            className="output-path-input"
          />
          <button
            type="button"
            onClick={handleSelectOutput}
            disabled={isProcessing}
            className="browse-button"
          >
            Browse...
          </button>
        </div>
      </div>

      <div className="compression-actions">
        <button
          type="button"
          onClick={handleCompress}
          disabled={isProcessing || files.length === 0}
          className="compress-button"
        >
          {isCompressing ? 'Compressing...' : `Compress ${files.length} File${files.length !== 1 ? 's' : ''}`}
        </button>
      </div>
    </div>
  );
}
