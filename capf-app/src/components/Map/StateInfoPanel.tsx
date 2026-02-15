/**
 * StateInfoPanel - Floating info panel that appears when clicking on US or China
 * Shows capability bar, decision status, and stats
 */

import type { ActorState } from '../../models/types';
import { CapabilityBar } from './CapabilityBar';

interface StateInfoPanelProps {
  actor: ActorState;
  equilibriumSignalingCutoff: number;
  latestPayoff?: number;
  isState1: boolean;
  onClose: () => void;
}

export function StateInfoPanel({
  actor,
  equilibriumSignalingCutoff,
  latestPayoff,
  isState1,
  onClose,
}: StateInfoPanelProps) {
  const accentColor = isState1 ? 'bg-blue-500' : 'bg-orange-500';
  const accentTextColor = isState1 ? 'text-blue-400' : 'text-orange-400';
  const accentBorderColor = isState1 ? 'border-blue-500' : 'border-orange-500';

  // Determine decision status
  const getDecisionStatus = () => {
    if (actor.majorAttackChoice) {
      return { text: 'ATTACKING', color: 'text-red-400 bg-red-500/20' };
    }
    if (actor.minorConflictChoice > 0) {
      return { text: `Signaled (y=${actor.minorConflictChoice.toFixed(1)})`, color: 'text-yellow-400 bg-yellow-500/20' };
    }
    if (actor.privateCapability >= actor.attackCutoff) {
      return { text: 'Will Attack', color: 'text-red-400 bg-red-500/20' };
    }
    return { text: 'Holding', color: 'text-green-400 bg-green-500/20' };
  };

  const status = getDecisionStatus();

  return (
    <div
      className={`absolute top-4 ${isState1 ? 'left-4' : 'right-4'} w-72 bg-gray-800 rounded-lg border-2 ${accentBorderColor} shadow-xl z-20`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${accentColor}`} />
          <h3 className={`font-semibold ${accentTextColor}`}>{actor.name}</h3>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white transition-colors p-1"
          aria-label="Close panel"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Status Badge */}
      <div className="px-3 pt-3">
        <span className={`px-2 py-1 rounded text-xs font-medium ${status.color}`}>
          {status.text}
        </span>
      </div>

      {/* Capability Bar */}
      <div className="p-3">
        <div className="text-xs text-gray-400 mb-2">Capability</div>
        <CapabilityBar
          capability={actor.privateCapability}
          attackCutoff={actor.attackCutoff}
          signalingCutoff={equilibriumSignalingCutoff}
          revealedBound={actor.revealedLowerBound}
          isAttacking={actor.majorAttackChoice}
          accentColor={accentColor}
        />
      </div>

      {/* Stats Grid */}
      <div className="px-3 pb-3">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-gray-900/50 p-2 rounded">
            <div className="text-gray-500">Private K</div>
            <div className="font-mono text-gray-200">{actor.privateCapability.toFixed(2)}</div>
          </div>
          <div className="bg-gray-900/50 p-2 rounded">
            <div className="text-gray-500">Attack Cutoff k*</div>
            <div className="font-mono text-gray-200">{actor.attackCutoff.toFixed(2)}</div>
          </div>
          <div className="bg-gray-900/50 p-2 rounded">
            <div className="text-gray-500">Revealed</div>
            <div className="font-mono text-gray-200">
              {actor.revealedLowerBound > 0 ? actor.revealedLowerBound.toFixed(2) : '-'}
            </div>
          </div>
          <div className="bg-gray-900/50 p-2 rounded">
            <div className="text-gray-500">Payoff</div>
            <div className={`font-mono ${latestPayoff !== undefined && latestPayoff >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {latestPayoff !== undefined ? (latestPayoff >= 0 ? '+' : '') + latestPayoff.toFixed(1) : '-'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
