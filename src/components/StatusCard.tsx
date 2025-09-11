import { useState, useEffect } from 'react';

interface Feature {
  name: string;
  status: 'completed' | 'working' | 'pending';
  description: string;
}

const features: Feature[] = [
  {
    name: 'Electron + Vite',
    status: 'completed',
    description: 'Cross-platform desktop app framework'
  },
  {
    name: 'TypeScript',
    status: 'completed',
    description: 'Type-safe JavaScript development'
  },
  {
    name: 'Hot Module Reload',
    status: 'working',
    description: 'Instant updates during development'
  },
  {
    name: 'React Components',
    status: 'completed',
    description: 'Modern UI with component architecture'
  },
  {
    name: 'IPC Bridge',
    status: 'completed',
    description: 'Secure communication between processes'
  },
  {
    name: 'Development Tools',
    status: 'completed',
    description: 'DevTools, ESLint, and build pipeline'
  }
];

export function StatusCard() {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Simulate loading state for demonstration
    const timer = setTimeout(() => setIsLoaded(true), 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="status-card">
      <h2>📊 Current Status</h2>

      <div className="current-phase">
        <div className="phase-indicator">
          <span className="phase-label">Current Phase</span>
          <span className="phase-value">Phase 1-4 Consolidated</span>
        </div>
        <p>Boilerplate setup with Electron, Vite, React, and TypeScript</p>
      </div>

      <div className="features-list">
        {features.map((feature) => (
          <div key={feature.name} className="feature-item">
            <div className="feature-header">
              <span className={`feature-status ${feature.status}`}>
                {feature.status === 'completed' && '✅'}
                {feature.status === 'working' && '🔄'}
                {feature.status === 'pending' && '⏳'}
              </span>
              <h3>{feature.name}</h3>
            </div>
            <p>{feature.description}</p>
          </div>
        ))}
      </div>

      <div className="app-health">
        <div className="health-indicator">
          <span className="health-label">App Status:</span>
          <span className={`health-value ${isLoaded ? 'healthy' : 'loading'}`}>
            {isLoaded ? '✅ Healthy' : '⏳ Loading...'}
          </span>
        </div>
        <p>React app loaded: {isLoaded ? 'Yes' : 'No'}</p>
      </div>
    </div>
  );
}
