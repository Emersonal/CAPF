/**
 * OutcomeOverlay - Displays the outcome of a round with visual styling
 */

import type { RoundOutcome } from '../../models/types';

interface OutcomeOverlayProps {
  outcome: RoundOutcome | undefined;
}

const OUTCOME_CONFIG = {
  peace: {
    icon: '✓',
    label: 'Peace',
    description: 'Both states chose not to attack',
    bgColor: 'bg-green-500/20',
    borderColor: 'border-green-500',
    textColor: 'text-green-400',
    iconBg: 'bg-green-500',
  },
  dsa_victory_1: {
    icon: '⚔',
    label: 'State 1 Victory',
    description: 'State 1 achieved Decisive Strategic Advantage',
    bgColor: 'bg-blue-500/20',
    borderColor: 'border-blue-500',
    textColor: 'text-blue-400',
    iconBg: 'bg-blue-500',
  },
  dsa_victory_2: {
    icon: '⚔',
    label: 'State 2 Victory',
    description: 'State 2 achieved Decisive Strategic Advantage',
    bgColor: 'bg-orange-500/20',
    borderColor: 'border-orange-500',
    textColor: 'text-orange-400',
    iconBg: 'bg-orange-500',
  },
  catastrophe: {
    icon: '💥',
    label: 'Catastrophe',
    description: 'War without DSA - mutual destruction',
    bgColor: 'bg-red-500/20',
    borderColor: 'border-red-500',
    textColor: 'text-red-400',
    iconBg: 'bg-red-500',
  },
};

export function OutcomeOverlay({ outcome }: OutcomeOverlayProps) {
  if (!outcome) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500">
        <div className="text-4xl mb-2">⚖</div>
        <p className="text-sm">Run a simulation to see outcomes</p>
      </div>
    );
  }

  const config = OUTCOME_CONFIG[outcome.outcome];

  return (
    <div
      className={`flex flex-col items-center justify-center h-full p-4 rounded-lg border-2 ${config.bgColor} ${config.borderColor} transition-all duration-500`}
    >
      {/* Icon */}
      <div
        className={`w-16 h-16 rounded-full ${config.iconBg} flex items-center justify-center text-3xl text-white mb-3 shadow-lg`}
      >
        {config.icon}
      </div>

      {/* Label */}
      <h3 className={`text-xl font-bold ${config.textColor} mb-1`}>
        {config.label}
      </h3>

      {/* Description */}
      <p className="text-sm text-gray-400 text-center mb-3">
        {config.description}
      </p>

      {/* Round info */}
      <div className="text-xs text-gray-500">
        Round {outcome.round}
      </div>

      {/* Minor conflict indicator */}
      {outcome.minorConflictOccurred && (
        <div className="mt-2 px-2 py-1 bg-yellow-500/20 border border-yellow-500/50 rounded text-xs text-yellow-400">
          Minor conflict occurred (signaling)
        </div>
      )}

      {/* Payoffs */}
      <div className="flex gap-4 mt-3 text-sm">
        <div className="text-center">
          <div className="text-gray-500 text-xs">State 1</div>
          <div className={outcome.payoffs[0] >= 0 ? 'text-green-400' : 'text-red-400'}>
            {outcome.payoffs[0] >= 0 ? '+' : ''}{outcome.payoffs[0].toFixed(1)}
          </div>
        </div>
        <div className="text-center">
          <div className="text-gray-500 text-xs">State 2</div>
          <div className={outcome.payoffs[1] >= 0 ? 'text-green-400' : 'text-red-400'}>
            {outcome.payoffs[1] >= 0 ? '+' : ''}{outcome.payoffs[1].toFixed(1)}
          </div>
        </div>
      </div>
    </div>
  );
}
