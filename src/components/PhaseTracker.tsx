// React import not needed with JSX transform

interface Phase {
  id: number;
  name: string;
  status: 'completed' | 'in_progress' | 'pending';
  description: string;
}

const phases: Phase[] = [
  {
    id: 1,
    name: 'Basic Setup',
    status: 'completed',
    description: 'Electron + Vite foundation'
  },
  {
    id: 2,
    name: 'TypeScript',
    status: 'completed',
    description: 'Type safety integration'
  },
  {
    id: 3,
    name: 'Hot Reload',
    status: 'completed',
    description: 'Vite HMR working'
  },
  {
    id: 4,
    name: 'React',
    status: 'completed',
    description: 'React components & JSX'
  },
  {
    id: 5,
    name: 'State & Drag',
    status: 'pending',
    description: 'Zustand store & file handling'
  },
  {
    id: 6,
    name: '7-Zip',
    status: 'pending',
    description: 'Compression engine'
  },
  {
    id: 7,
    name: 'Features',
    status: 'pending',
    description: 'Virtual scrolling & UI'
  },
  {
    id: 8,
    name: 'Production',
    status: 'pending',
    description: 'Build & deployment'
  }
];

export function PhaseTracker() {
  return (
    <div className="phase-tracker">
      <h2>🚀 Q-Zip Electron - Phase Progress</h2>
      <div className="phase-grid">
        {phases.map((phase) => (
          <div
            key={phase.id}
            className={`phase-card ${phase.status}`}
          >
            <div className="phase-header">
              <span className="phase-number">{phase.id}</span>
              <span className={`phase-status ${phase.status}`}>
                {phase.status === 'completed' && '✅'}
                {phase.status === 'in_progress' && '🔄'}
                {phase.status === 'pending' && '⏳'}
              </span>
            </div>
            <h3>{phase.name}</h3>
            <p>{phase.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
