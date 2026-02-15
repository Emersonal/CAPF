/**
 * CapabilityBar - Visualizes a state's capability level with threshold markers
 * Shows K_i (actual capability), k* (attack cutoff), and K̂ (signaling cutoff)
 */

interface CapabilityBarProps {
  capability: number;        // K_i - actual capability
  attackCutoff: number;      // k*(y_j) - attack threshold
  signalingCutoff: number;   // K̂ - signaling threshold
  revealedBound: number;     // y_i - what opponent knows
  isAttacking: boolean;      // Whether K >= k*
  accentColor: string;       // State's color (blue/orange)
  maxValue?: number;         // Scale max (default: 10)
}

export function CapabilityBar({
  capability,
  attackCutoff,
  signalingCutoff,
  revealedBound,
  isAttacking,
  accentColor,
  maxValue = 10,
}: CapabilityBarProps) {
  // Convert values to percentages
  const toPercent = (val: number) => Math.min(100, Math.max(0, (val / maxValue) * 100));

  const capabilityPercent = toPercent(capability);
  const attackCutoffPercent = toPercent(attackCutoff);
  const signalingCutoffPercent = toPercent(signalingCutoff);
  const revealedPercent = toPercent(revealedBound);

  // Determine bar color based on state
  const barColor = isAttacking
    ? 'bg-red-500'
    : capability >= signalingCutoff
      ? 'bg-yellow-500'
      : accentColor;

  return (
    <div className="w-full">
      {/* Bar container */}
      <div className="relative h-8 bg-gray-700 rounded overflow-hidden">
        {/* Capability fill */}
        <div
          className={`absolute inset-y-0 left-0 ${barColor} transition-all duration-500`}
          style={{ width: `${capabilityPercent}%` }}
        />

        {/* Revealed portion (darker overlay showing what opponent knows) */}
        {revealedBound > 0 && (
          <div
            className="absolute inset-y-0 left-0 bg-white/20 border-r-2 border-white/50"
            style={{ width: `${revealedPercent}%` }}
          />
        )}

        {/* Signaling cutoff marker (K̂) */}
        <div
          className="absolute inset-y-0 w-0.5 bg-yellow-400"
          style={{ left: `${signalingCutoffPercent}%` }}
          title={`K̂ = ${signalingCutoff.toFixed(2)}`}
        >
          <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] text-yellow-400 whitespace-nowrap">
            K̂
          </div>
        </div>

        {/* Attack cutoff marker (k*) */}
        <div
          className="absolute inset-y-0 w-0.5 bg-red-400"
          style={{ left: `${attackCutoffPercent}%` }}
          title={`k* = ${attackCutoff.toFixed(2)}`}
        >
          <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] text-red-400 whitespace-nowrap">
            k*
          </div>
        </div>

        {/* Capability value label */}
        <div className="absolute inset-0 flex items-center justify-end pr-2">
          <span className="text-xs font-mono text-white/90 drop-shadow">
            K = {capability.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Scale labels */}
      <div className="flex justify-between text-[10px] text-gray-500 mt-1">
        <span>0</span>
        <span>{maxValue}</span>
      </div>
    </div>
  );
}
