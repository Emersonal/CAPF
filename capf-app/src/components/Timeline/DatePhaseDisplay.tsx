/**
 * DatePhaseDisplay - Shows the current phase of step-by-step round visualization
 * Displays Date 0 (investment), Date 1 (capability draw), Date 2 (signaling),
 * Date 3 (attack decisions), Outcome
 */

import type { RoundPhase, RoundOutcome } from '../../models/types';
import { useParameters } from '../../store/gameStore';
import { investmentToW, investmentToSigma } from '../../simulation/investment';

interface DatePhaseDisplayProps {
  phase: RoundPhase;
  pendingOutcome: RoundOutcome | null;
}

const PHASE_INFO: Record<RoundPhase, { title: string; description: string; color: string }> = {
  idle: {
    title: 'Ready',
    description: 'Click "Start Round" to begin',
    color: 'text-gray-400',
  },
  date0: {
    title: 'Date 0: Investment',
    description: 'States allocate R&D budgets, determining capabilities and uncertainty',
    color: 'text-emerald-400',
  },
  date1: {
    title: 'Date 1: Capability Draw',
    description: 'Nature draws private capabilities K = w + \u03B5',
    color: 'text-cyan-400',
  },
  date2: {
    title: 'Date 2: Signaling Phase',
    description: 'States decide whether to reveal capabilities through proxy conflicts',
    color: 'text-yellow-400',
  },
  date3: {
    title: 'Date 3: Attack Decision',
    description: 'States decide whether to launch major conflict based on updated beliefs',
    color: 'text-orange-400',
  },
  outcome: {
    title: 'Outcome',
    description: 'Resolution of the round',
    color: 'text-purple-400',
  },
};

export function DatePhaseDisplay({ phase, pendingOutcome }: DatePhaseDisplayProps) {
  const params = useParameters();
  const info = PHASE_INFO[phase];
  const investmentMode = params.investmentMode;

  if (phase === 'idle') {
    return null;
  }

  // Build phase dots list based on investment mode
  const phases: RoundPhase[] = investmentMode
    ? ['date0', 'date1', 'date2', 'date3', 'outcome']
    : ['date1', 'date2', 'date3', 'outcome'];

  const phaseLabels: Record<RoundPhase, string> = {
    idle: '',
    date0: 'Invest',
    date1: 'Draw',
    date2: 'Signal',
    date3: 'Attack',
    outcome: 'Result',
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4 mb-4 border border-gray-700">
      {/* Phase indicator dots */}
      <div className="flex justify-between mb-3">
        {phases.map((p, i) => {
          const isActive = phase === p;
          const isPast = phases.indexOf(phase) > i;
          return (
            <div key={p} className="flex flex-col items-center flex-1">
              <div
                className={`w-4 h-4 rounded-full transition-all ${
                  isActive
                    ? 'bg-white ring-2 ring-white/50 ring-offset-2 ring-offset-gray-800'
                    : isPast
                      ? 'bg-green-500'
                      : 'bg-gray-600'
                }`}
              />
              <span className={`text-[10px] mt-1 ${isActive ? 'text-white font-medium' : 'text-gray-500'}`}>
                {phaseLabels[p]}
              </span>
            </div>
          );
        })}
      </div>

      {/* Current phase info */}
      <div className="text-center">
        <h3 className={`font-semibold ${info.color}`}>{info.title}</h3>
        <p className="text-xs text-gray-400 mt-1">{info.description}</p>
      </div>

      {/* Phase-specific details */}
      {phase === 'date0' && (
        <div className="mt-4 pt-3 border-t border-gray-700">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="text-center">
              <div className="text-blue-400 font-medium">US Investment</div>
              <div className="text-2xl font-bold text-white">{params.I1}</div>
              <div className="text-xs text-gray-500 mt-1">
                w = {investmentToW(params.I1).toFixed(2)}, σ = {investmentToSigma(params.I1).toFixed(2)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-orange-400 font-medium">China Investment</div>
              <div className="text-2xl font-bold text-white">{params.I2}</div>
              <div className="text-xs text-gray-500 mt-1">
                w = {investmentToW(params.I2).toFixed(2)}, σ = {investmentToSigma(params.I2).toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      )}

      {pendingOutcome && (
        <div className="mt-4 pt-3 border-t border-gray-700">
          {phase === 'date1' && (
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="text-center">
                <div className="text-blue-400 font-medium">US Capability</div>
                <div className="text-2xl font-bold text-white">
                  {pendingOutcome.capabilityDraws[0].toFixed(2)}
                </div>
              </div>
              <div className="text-center">
                <div className="text-orange-400 font-medium">China Capability</div>
                <div className="text-2xl font-bold text-white">
                  {pendingOutcome.capabilityDraws[1].toFixed(2)}
                </div>
              </div>
            </div>
          )}

          {phase === 'date2' && (
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="text-center">
                <div className="text-blue-400 font-medium">US Signal</div>
                <div className="text-lg font-bold text-white">
                  {pendingOutcome.signalsSent[0] > 0 ? (
                    <span className="text-yellow-400">
                      Revealed: {pendingOutcome.signalsSent[0].toFixed(2)}
                    </span>
                  ) : (
                    <span className="text-gray-500">Silent</span>
                  )}
                </div>
              </div>
              <div className="text-center">
                <div className="text-orange-400 font-medium">China Signal</div>
                <div className="text-lg font-bold text-white">
                  {pendingOutcome.signalsSent[1] > 0 ? (
                    <span className="text-yellow-400">
                      Revealed: {pendingOutcome.signalsSent[1].toFixed(2)}
                    </span>
                  ) : (
                    <span className="text-gray-500">Silent</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {phase === 'date3' && (
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="text-center">
                <div className="text-blue-400 font-medium">US Decision</div>
                <div className={`text-lg font-bold ${pendingOutcome.majorWarOccurred && pendingOutcome.capabilityDraws[0] >= pendingOutcome.capabilityDraws[1] ? 'text-red-400' : 'text-green-400'}`}>
                  {pendingOutcome.reasoning.state1Analysis.includes('attacked') ? 'ATTACK' : 'HOLD'}
                </div>
              </div>
              <div className="text-center">
                <div className="text-orange-400 font-medium">China Decision</div>
                <div className={`text-lg font-bold ${pendingOutcome.majorWarOccurred && pendingOutcome.capabilityDraws[1] >= pendingOutcome.capabilityDraws[0] ? 'text-red-400' : 'text-green-400'}`}>
                  {pendingOutcome.reasoning.state2Analysis.includes('attacked') ? 'ATTACK' : 'HOLD'}
                </div>
              </div>
            </div>
          )}

          {phase === 'outcome' && (
            <div className="text-center">
              <div className={`text-xl font-bold ${
                pendingOutcome.outcome === 'peace' ? 'text-green-400' :
                pendingOutcome.outcome === 'catastrophe' ? 'text-red-400' :
                pendingOutcome.outcome === 'dsa_victory_1' ? 'text-blue-400' : 'text-orange-400'
              }`}>
                {pendingOutcome.outcome === 'peace' ? 'PEACE' :
                 pendingOutcome.outcome === 'catastrophe' ? 'CATASTROPHE' :
                 pendingOutcome.outcome === 'dsa_victory_1' ? 'US DSA VICTORY' : 'CHINA DSA VICTORY'}
              </div>
              <div className="text-xs text-gray-400 mt-2 italic">
                {pendingOutcome.reasoning.equilibriumNote}
              </div>
              <div className="flex justify-center gap-6 mt-3 text-sm">
                <span className="text-blue-400">US: {pendingOutcome.payoffs[0].toFixed(1)}</span>
                <span className="text-orange-400">China: {pendingOutcome.payoffs[1].toFixed(1)}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
