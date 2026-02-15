/**
 * TurnControls - Controls for running simulation rounds
 * Includes run button, auto-play toggle, and history log
 */

import { useEffect } from 'react';
import {
  useRound,
  useHistory,
  useIsPlaying,
  useRunRound,
  useTogglePlay,
  useReset,
} from '../../store/gameStore';
import type { RoundOutcome } from '../../models/types';

const OUTCOME_COLORS: Record<RoundOutcome['outcome'], string> = {
  peace: 'bg-green-500',
  dsa_victory_1: 'bg-blue-500',
  dsa_victory_2: 'bg-orange-500',
  catastrophe: 'bg-red-500',
};

const OUTCOME_LABELS: Record<RoundOutcome['outcome'], string> = {
  peace: 'Peace',
  dsa_victory_1: 'State 1 DSA',
  dsa_victory_2: 'State 2 DSA',
  catastrophe: 'Catastrophe',
};

interface RoundSummaryProps {
  outcome: RoundOutcome;
}

function RoundSummary({ outcome }: RoundSummaryProps) {
  const { round, outcome: result, payoffs, reasoning, minorConflictOccurred } = outcome;

  return (
    <div className="p-3 bg-gray-800 rounded-lg mb-2">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-sm font-medium text-gray-300">Round {round}</span>
        <span className={`px-2 py-0.5 text-xs rounded ${OUTCOME_COLORS[result]} text-white`}>
          {OUTCOME_LABELS[result]}
        </span>
        {minorConflictOccurred && (
          <span className="px-2 py-0.5 text-xs rounded bg-yellow-600 text-white">
            Signaling
          </span>
        )}
      </div>
      <div className="text-xs text-gray-400 space-y-1">
        <p>{reasoning.state1Analysis}</p>
        <p>{reasoning.state2Analysis}</p>
        <p className="text-gray-500 italic">{reasoning.equilibriumNote}</p>
      </div>
      <div className="flex gap-4 mt-2 text-xs">
        <span className="text-blue-400">State 1: {payoffs[0].toFixed(1)}</span>
        <span className="text-orange-400">State 2: {payoffs[1].toFixed(1)}</span>
      </div>
    </div>
  );
}

export function TurnControls() {
  const round = useRound();
  const history = useHistory();
  const isPlaying = useIsPlaying();
  const runRound = useRunRound();
  const togglePlay = useTogglePlay();
  const reset = useReset();

  // Auto-play interval
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      runRound();
    }, 1500);

    return () => clearInterval(interval);
  }, [isPlaying, runRound]);

  // Calculate outcome statistics
  const stats = history.reduce(
    (acc, h) => {
      acc[h.outcome]++;
      return acc;
    },
    { peace: 0, dsa_victory_1: 0, dsa_victory_2: 0, catastrophe: 0 }
  );

  return (
    <div className="bg-gray-900 p-4 rounded-lg border border-gray-700 flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">Simulation</h2>
        <span className="text-sm text-gray-400">Round {round}</span>
      </div>

      <div className="flex gap-2 mb-4">
        <button
          onClick={runRound}
          disabled={isPlaying}
          className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded font-medium transition-colors"
        >
          Run Round
        </button>
        <button
          onClick={togglePlay}
          className={`px-4 py-2 rounded font-medium transition-colors ${
            isPlaying
              ? 'bg-red-600 hover:bg-red-500 text-white'
              : 'bg-green-600 hover:bg-green-500 text-white'
          }`}
        >
          {isPlaying ? 'Stop' : 'Auto'}
        </button>
        <button
          onClick={reset}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded font-medium transition-colors"
        >
          Reset
        </button>
      </div>

      {history.length > 0 && (
        <div className="grid grid-cols-4 gap-2 mb-4 text-center text-xs">
          <div className="bg-green-900/30 p-2 rounded">
            <div className="text-green-400 font-medium">{stats.peace}</div>
            <div className="text-gray-500">Peace</div>
          </div>
          <div className="bg-blue-900/30 p-2 rounded">
            <div className="text-blue-400 font-medium">{stats.dsa_victory_1}</div>
            <div className="text-gray-500">S1 Wins</div>
          </div>
          <div className="bg-orange-900/30 p-2 rounded">
            <div className="text-orange-400 font-medium">{stats.dsa_victory_2}</div>
            <div className="text-gray-500">S2 Wins</div>
          </div>
          <div className="bg-red-900/30 p-2 rounded">
            <div className="text-red-400 font-medium">{stats.catastrophe}</div>
            <div className="text-gray-500">Catastrophe</div>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto min-h-0">
        {history.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p className="text-sm">No rounds simulated yet.</p>
            <p className="text-xs mt-1">Click "Run Round" to start.</p>
          </div>
        ) : (
          <>
            {history
              .slice()
              .reverse()
              .map((outcome) => (
                <RoundSummary key={outcome.round} outcome={outcome} />
              ))}
          </>
        )}
      </div>
    </div>
  );
}
