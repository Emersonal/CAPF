/**
 * ScenarioChips - Preset scenario buttons that load parameter configurations
 * Each scenario demonstrates a key insight from the literature
 */

import type { ModelParameters } from '../../models/types';
import { useGameStore } from '../../store/gameStore';

interface Scenario {
  id: string;
  name: string;
  tagline: string;
  description: string;
  color: string;
  bgColor: string;
  borderColor: string;
  params: ModelParameters;
}

const SCENARIOS: Scenario[] = [
  {
    id: 'stable-deterrence',
    name: 'Stable Deterrence',
    tagline: 'MAIM works as advertised',
    description:
      'High catastrophe cost and a tough DSA threshold keep everyone cautious. ' +
      'Peace dominates. This is the world Hendrycks, Schmidt & Wang envision.',
    color: 'text-green-300',
    bgColor: 'bg-green-900/20',
    borderColor: 'border-green-800/50',
    params: { w1: 5, w2: 5, wLinked: true, sigma1: 1, sigma2: 1, sigmaLinked: true, T: 3.5, c_m: 1, V: 40, theta: 180 },
  },
  {
    id: 'preemptive-strike',
    name: 'Preemptive Strike',
    tagline: 'Winner takes all',
    description:
      'DSA is easy to achieve, the prize is enormous, and catastrophe isn\'t that scary. ' +
      'States attack constantly. The Aschenbrenner scenario: "mere months of lead give ' +
      'an utterly decisive advantage."',
    color: 'text-red-300',
    bgColor: 'bg-red-900/20',
    borderColor: 'border-red-800/50',
    params: { w1: 5, w2: 5, wLinked: true, sigma1: 1.5, sigma2: 1.5, sigmaLinked: true, T: 0.5, c_m: 1, V: 100, theta: 20 },
  },
  {
    id: 'rand-nightmare',
    name: 'Hair-Trigger Terror',
    tagline: 'The RAND critique comes true',
    description:
      'Signaling is too expensive, so states skip proxy wars and make attack decisions ' +
      'under heavy uncertainty. Misperception abounds. More wars, more catastrophes.',
    color: 'text-orange-300',
    bgColor: 'bg-orange-900/20',
    borderColor: 'border-orange-800/50',
    params: { w1: 5, w2: 5, wLinked: true, sigma1: 1.5, sigma2: 1.5, sigmaLinked: true, T: 2, c_m: 4.5, V: 70, theta: 80 },
  },
  {
    id: 'cheap-talk',
    name: 'Cheap Talk Saves Lives',
    tagline: 'Transparency as stabilizer',
    description:
      'Minor conflict costs are nearly zero — think benchmarks, capability exercises, ' +
      'transparency agreements. Information flows freely, uncertainty drops, and major ' +
      'war becomes rare.',
    color: 'text-cyan-300',
    bgColor: 'bg-cyan-900/20',
    borderColor: 'border-cyan-800/50',
    params: { w1: 5, w2: 5, wLinked: true, sigma1: 1, sigma2: 1, sigmaLinked: true, T: 2, c_m: 0.1, V: 50, theta: 100 },
  },
  {
    id: 'high-stakes',
    name: 'Civilization Stakes',
    tagline: 'When winning means everything',
    description:
      'The prize is maximal — controlling the trajectory of civilization. Even cautious ' +
      'states become aggressive when the stakes are existential. Both signaling and war spike.',
    color: 'text-purple-300',
    bgColor: 'bg-purple-900/20',
    borderColor: 'border-purple-800/50',
    params: { w1: 5, w2: 5, wLinked: true, sigma1: 1, sigma2: 1, sigmaLinked: true, T: 2, c_m: 1, V: 100, theta: 100 },
  },
  {
    id: 'fog-of-war',
    name: 'Fog of War',
    tagline: 'Maximum uncertainty',
    description:
      'Capability draws are wildly unpredictable. Neither side knows where they stand. ' +
      'Outcomes swing from peace to catastrophe round by round. The world we might actually live in.',
    color: 'text-gray-300',
    bgColor: 'bg-gray-800/50',
    borderColor: 'border-gray-600/50',
    params: { w1: 5, w2: 5, wLinked: true, sigma1: 3, sigma2: 3, sigmaLinked: true, T: 2, c_m: 1, V: 50, theta: 100 },
  },
];

export function ScenarioChips() {
  const loadParameters = useGameStore((s) => s.loadParameters);
  const currentParams = useGameStore((s) => s.parameters);

  const loadScenario = (scenario: Scenario) => {
    loadParameters(scenario.params);
  };

  // Detect which scenario is active (if any)
  const activeScenario = SCENARIOS.find((s) =>
    Object.entries(s.params).every(([key, value]) => {
      const currentValue = currentParams[key as keyof ModelParameters];
      // Handle boolean fields (wLinked, sigmaLinked)
      if (typeof value === 'boolean') {
        return currentValue === value;
      }
      // Handle numeric fields
      return Math.abs((currentValue as number) - (value as number)) < 0.01;
    })
  );

  return (
    <div className="h-full flex flex-col">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-white">Scenarios</h2>
        <p className="text-xs text-gray-400 mt-1">
          Each scenario loads parameters that demonstrate a key insight from the
          literature. Click one, then hit Run Round or Auto on the right.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 flex-1 content-start">
        {SCENARIOS.map((scenario) => {
          const isActive = activeScenario?.id === scenario.id;
          return (
            <button
              key={scenario.id}
              onClick={() => loadScenario(scenario)}
              className={`text-left p-4 rounded-lg border transition-all duration-200 hover:scale-[1.02] ${
                isActive
                  ? `${scenario.bgColor} ${scenario.borderColor} border-2 ring-1 ring-white/10`
                  : `bg-gray-800/50 border-gray-700 hover:${scenario.bgColor} hover:${scenario.borderColor}`
              }`}
            >
              <div className="flex items-start justify-between">
                <h3 className={`text-sm font-bold ${scenario.color}`}>{scenario.name}</h3>
                {isActive && (
                  <span className="text-[10px] px-1.5 py-0.5 bg-white/10 rounded text-gray-300">
                    ACTIVE
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-0.5 italic">{scenario.tagline}</p>
              <p className="text-xs text-gray-500 mt-2 leading-relaxed">{scenario.description}</p>
            </button>
          );
        })}
      </div>

      {activeScenario && (
        <div className="mt-4 p-3 bg-gray-800 rounded-lg border border-gray-700">
          <p className="text-xs text-gray-400">
            <span className={`font-medium ${activeScenario.color}`}>{activeScenario.name}</span>
            {' '}loaded. Adjust any slider to explore variations, or hit{' '}
            <span className="text-blue-300">Run Round</span> to simulate.
          </p>
        </div>
      )}
    </div>
  );
}
