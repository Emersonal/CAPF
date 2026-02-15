/**
 * DSA Simulator - Decisive Strategic Advantage Signaling Model
 * Interactive visualization of the Patell DSA signaling model
 */

import { AssumptionPanel } from './components/Controls';
import { EquilibriumDisplay } from './components/GameTheory';
import { TurnControls } from './components/Timeline';
import './App.css';

function App() {
  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">DSA Simulator</h1>
            <p className="text-sm text-gray-400">
              Decisive Strategic Advantage Signaling Model
            </p>
          </div>
          <p className="text-xs text-gray-500 max-w-md text-right">
            Based on Patell's "On Decisive Strategic Advantage" signaling model.
            Adjust parameters to see how equilibrium shifts.
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex gap-4 p-4 min-h-0">
        {/* Left Sidebar - Parameters */}
        <aside className="w-80 flex-shrink-0">
          <AssumptionPanel />
        </aside>

        {/* Center - Map Placeholder */}
        <section className="flex-1 flex flex-col gap-4">
          <div className="flex-1 bg-gray-900 rounded-lg border border-gray-700 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <div className="text-6xl mb-4">🗺️</div>
              <p className="text-lg font-medium">Map Visualization</p>
              <p className="text-sm">Coming in Phase 3</p>
              <p className="text-xs mt-2 max-w-sm mx-auto">
                Will show stylized two-region map with capability bars,
                conflict indicators, and outcome animations.
              </p>
            </div>
          </div>
        </section>

        {/* Right Sidebar - Equilibrium & Simulation */}
        <aside className="w-96 flex-shrink-0 flex flex-col gap-4">
          <EquilibriumDisplay />
          <div className="flex-1 min-h-0">
            <TurnControls />
          </div>
        </aside>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 border-t border-gray-800 px-6 py-2 text-center text-xs text-gray-500">
        DSA Signaling Game Simulator | Model: K_i = w + ε_i, Attack iff K_i ≥ k*(y_j)
      </footer>
    </div>
  );
}

export default App;
