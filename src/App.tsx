import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/electron-vite.animate.svg'
import { PhaseTracker } from './components/PhaseTracker'
import { StatusCard } from './components/StatusCard'
import './styles/phaseStyles.css'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="logo-section">
          <a href="https://electron-vite.github.io" target="_blank">
            <img src={viteLogo} className="logo" alt="Vite logo" />
          </a>
          <a href="https://react.dev" target="_blank">
            <img src={reactLogo} className="logo react" alt="React logo" />
          </a>
        </div>

        <h1>🚀 Q-Zip Electron</h1>

        <div className="tech-badges">
          <span className="badge electron">Electron</span>
          <span className="badge vite">Vite</span>
          <span className="badge typescript">TypeScript</span>
          <span className="badge react">React</span>
          <span className="badge completed">Phase 1-4 Complete</span>
        </div>
      </header>

      <main className="app-main">
        <PhaseTracker />
        <StatusCard />

        <div className="interactive-section">
          <h2>🔄 Hot Module Reload Demo</h2>
          <div className="card">
            <button onClick={() => setCount((count) => count + 1)}>
              count is {count}
            </button>
            <p>
              Edit <code>src/App.tsx</code> and save to test HMR
            </p>
          </div>
          <p className="read-the-docs">
            Click on the Vite and React logos to learn more
          </p>
        </div>
      </main>
    </div>
  )
}

export default App
