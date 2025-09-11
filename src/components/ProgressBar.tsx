import { CompressionProgress } from '../hooks/useCompression';

interface ProgressBarProps {
  progress: CompressionProgress | null;
  isVisible: boolean;
}

export function ProgressBar({ progress, isVisible }: ProgressBarProps) {
  if (!isVisible || !progress) return null;

  return (
    <div className="progress-container">
      <div className="progress-header">
        <h3>Compressing Files...</h3>
        <span className="progress-percent">{progress.percent}%</span>
      </div>

      <div className="progress-bar">
        <div
          className="progress-fill"
          style={{ width: `${progress.percent}%` }}
        />
      </div>

      <div className="progress-message">
        {progress.message}
      </div>
    </div>
  );
}
