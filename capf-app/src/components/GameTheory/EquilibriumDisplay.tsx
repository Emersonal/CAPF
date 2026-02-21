/**
 * EquilibriumDisplay - Shows current equilibrium predictions
 * Displays tau, cutoffs, probabilities, DSA victory probs, and expected payoffs
 */

import { useEquilibrium, useParameters } from '../../store/gameStore';

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
  const params = useParameters();

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
            label="Attack Cutoff k*₁(0)"
            value={equilibrium.attackCutoff1NoSignal}
            description="US capability needed to attack with no signal"
          />
          <StatRow
            label="Attack Cutoff k*₂(0)"
            value={equilibrium.attackCutoff2NoSignal}
            description="China capability needed to attack with no signal"
          />
          <StatRow
            label="Signaling Cutoff K̂₁"
            value={equilibrium.signalingCutoff1}
            description="US min capability to engage in proxy conflict"
          />
          <StatRow
            label="Signaling Cutoff K̂₂"
            value={equilibrium.signalingCutoff2}
            description="China min capability to engage in proxy conflict"
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

      {/* DSA Victory Probabilities */}
      <div className="mt-4">
        <h3 className="text-sm font-medium text-gray-400 mb-3 uppercase tracking-wide">
          DSA Victory Breakdown
        </h3>
        <ProbabilityBar
          label="US DSA Victory"
          probability={equilibrium.dsaVictory1Probability}
          color="#3b82f6"
        />
        <ProbabilityBar
          label="China DSA Victory"
          probability={equilibrium.dsaVictory2Probability}
          color="#f97316"
        />
      </div>

      {/* Expected Payoffs */}
      <div className="mt-4">
        <h3 className="text-sm font-medium text-gray-400 mb-2 uppercase tracking-wide">
          Expected Payoffs
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-800 rounded-lg p-3 text-center">
            <div className="text-xs text-gray-400 mb-1">US (E[U₁])</div>
            <div className={`text-lg font-bold font-mono ${equilibrium.expectedPayoff1 >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
              {equilibrium.expectedPayoff1.toFixed(1)}
            </div>
          </div>
          <div className="bg-gray-800 rounded-lg p-3 text-center">
            <div className="text-xs text-gray-400 mb-1">China (E[U₂])</div>
            <div className={`text-lg font-bold font-mono ${equilibrium.expectedPayoff2 >= 0 ? 'text-orange-400' : 'text-red-400'}`}>
              {equilibrium.expectedPayoff2.toFixed(1)}
            </div>
          </div>
        </div>
        {params.investmentMode && (
          <p className="text-[10px] text-gray-500 mt-1 text-center">
            Includes investment cost (I_US={params.I1}, I_CN={params.I2})
          </p>
        )}
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
