/**
 * RegionCard - Visualizes a single state/region with its capability and status
 */

import type { ActorState } from '../../models/types';
import { CapabilityBar } from './CapabilityBar';

interface RegionCardProps {
  actor: ActorState;
  equilibriumSignalingCutoff: number;
  latestPayoff?: number;
  isState1: boolean;
}

export function RegionCard({
  actor,
  equilibriumSignalingCutoff,
  latestPayoff,
  isState1,
}: RegionCardProps) {
  const accentColor = isState1 ? 'bg-blue-500' : 'bg-orange-500';
  const accentTextColor = isState1 ? 'text-blue-400' : 'text-orange-400';
  const accentBorderColor = isState1 ? 'border-blue-500/50' : 'border-orange-500/50';

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
    <div className={`bg-gray-800 rounded-lg p-4 border ${accentBorderColor}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${accentColor}`} />
          <h3 className={`font-semibold ${accentTextColor}`}>{actor.name}</h3>
        </div>
        <span className={`px-2 py-1 rounded text-xs font-medium ${status.color}`}>
          {status.text}
        </span>
      </div>

      {/* Capability Bar */}
      <div className="mb-4">
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
            {actor.revealedLowerBound > 0 ? actor.revealedLowerBound.toFixed(2) : '—'}
          </div>
        </div>
        <div className="bg-gray-900/50 p-2 rounded">
          <div className="text-gray-500">Payoff</div>
          <div className={`font-mono ${latestPayoff !== undefined && latestPayoff >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {latestPayoff !== undefined ? (latestPayoff >= 0 ? '+' : '') + latestPayoff.toFixed(1) : '—'}
          </div>
        </div>
      </div>
    </div>
  );
}
