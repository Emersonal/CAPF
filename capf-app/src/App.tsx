/**
 * DSA Simulator - Decisive Strategic Advantage Signaling Game
 * Interactive visualization of the Patell DSA signaling model
 */

import { useState } from 'react';
import { AssumptionPanel } from './components/Controls';
import { EquilibriumDisplay } from './components/GameTheory';
import { WorldMap } from './components/Map';
import { TurnControls } from './components/Timeline';
import { OnboardingOverlay } from './components/Onboarding';
import './App.css';

function App() {
  const [showOnboarding, setShowOnboarding] = useState(() => {
    // Show onboarding if user hasn't dismissed it before
    const dismissed = localStorage.getItem('dsa-sim-onboarding-dismissed');
    return !dismissed;
  });

  const handleCloseOnboarding = () => {
    setShowOnboarding(false);
    localStorage.setItem('dsa-sim-onboarding-dismissed', 'true');
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* Onboarding Overlay */}
      {showOnboarding && <OnboardingOverlay onClose={handleCloseOnboarding} />}

      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">DSA Simulator</h1>
            <p className="text-sm text-gray-400">
              Decisive Strategic Advantage Signaling Game
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowOnboarding(true)}
              className="px-3 py-1.5 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg border border-gray-700 transition-colors"
            >
              How to Play
            </button>
            <p className="text-xs text-gray-500 max-w-md text-right">
              Based on Patell's "On Decisive Strategic Advantage" signaling model.
              Adjust parameters to see how equilibrium shifts.
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex gap-4 p-4 min-h-0">
        {/* Left Sidebar - Parameters */}
        <aside className="w-80 flex-shrink-0">
          <AssumptionPanel />
        </aside>

        {/* Center - Strategic Landscape Map */}
        <section className="flex-1 flex flex-col gap-4 min-w-0 min-h-0">
          <WorldMap />
        </section>

        {/* Right Sidebar - Equilibrium & Simulation */}
        <aside className="w-96 flex-shrink-0 flex flex-col gap-4 overflow-hidden">
          <EquilibriumDisplay />
          <div className="flex-1 min-h-0">
            <TurnControls />
          </div>
        </aside>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 border-t border-gray-800 px-6 py-2 text-center text-xs text-gray-500">
        DSA Signaling Game Simulator | Model: K_i = w + ε_i, Attack iff K_i ≥ k*(y_j) | Based on Hendrycks et al. (MAIM), Patell (DSA), RAND critique
      </footer>
    </div>
  );
}

export default App;
