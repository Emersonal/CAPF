/**
 * EquilibriumDisplay - Shows current equilibrium predictions
 * Displays tau, cutoffs, and probabilities from the Patell model
 */

import { useEquilibrium } from '../../store/gameStore';

interface StatRowProps {
  label: string;
  value: string | number;
  description?: string;
  highlight?: boolean;
}

function StatRow({ label, value, description, highlight }: StatRowProps) {
  return (
    <div className={`py-2 ${highlight ? 'bg-blue-900/30 -mx-2 px-2 rounded' : ''}`}>
      <div className="flex justify-between items-baseline">
        <span className="text-sm text-gray-300">{label}</span>
        <span className={`font-mono text-sm ${highlight ? 'text-blue-400' : 'text-white'}`}>
          {typeof value === 'number' ? value.toFixed(3) : value}
        </span>
      </div>
      {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
    </div>
  );
}

interface ProbabilityBarProps {
  label: string;
  probability: number;
  color: string;
}

function ProbabilityBar({ label, probability, color }: ProbabilityBarProps) {
  const percentage = Math.round(probability * 100);

  return (
    <div className="mb-3">
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-300">{label}</span>
        <span className="text-gray-400">{percentage}%</span>
      </div>
      <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${percentage}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

export function EquilibriumDisplay() {
  const equilibrium = useEquilibrium();

  return (
    <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
      <h2 className="text-lg font-semibold text-white mb-4">Equilibrium Prediction</h2>

      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-400 mb-2 uppercase tracking-wide">
          Key Thresholds
        </h3>
        <div className="divide-y divide-gray-800">
          <StatRow
            label="Attack Threshold (τ)"
            value={equilibrium.tau}
            description="Probability needed to prefer war over peace"
            highlight
          />
          <StatRow
            label="Attack Cutoff k*(0)"
            value={equilibrium.attackCutoffNoSignal}
            description="Capability needed to attack with no signal"
          />
          <StatRow
            label="Signaling Cutoff (K̂)"
            value={equilibrium.signalingCutoff}
            description="Min capability to engage in proxy conflict"
          />
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium text-gray-400 mb-3 uppercase tracking-wide">
          Outcome Probabilities
        </h3>
        <ProbabilityBar
          label="Peace"
          probability={equilibrium.peaceProbability}
          color="#22c55e"
        />
        <ProbabilityBar
          label="Minor Conflict (Signaling)"
          probability={equilibrium.minorConflictProbability}
          color="#eab308"
        />
        <ProbabilityBar
          label="Major War"
          probability={equilibrium.attackProbability}
          color="#ef4444"
        />
        <ProbabilityBar
          label="Catastrophe"
          probability={equilibrium.catastropheProbability}
          color="#7c3aed"
        />
      </div>

      <div className="mt-4 p-3 bg-gray-800 rounded text-xs text-gray-400">
        <p className="font-medium text-gray-300 mb-1">Interpretation</p>
        <p>
          A state attacks iff its capability K ≥ k*(y_j). Higher τ means states need
          stronger signals before attacking. The signaling region [K̂, k*) shows where
          proxy conflicts occur.
        </p>
      </div>
    </div>
  );
}
