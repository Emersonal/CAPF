/**
 * AssumptionPanel - Container for all parameter sliders
 * Left sidebar showing all adjustable model parameters
 *
 * Layout:
 * - Game Structure: T, V, θ, c_m (global parameters)
 * - State Capabilities: w, σ (splittable by state)
 */

import { ParameterSlider } from './ParameterSlider';
import { SplittableSlider } from './SplittableSlider';
import { PARAMETER_CONTROLS, SPLITTABLE_PARAMETERS } from '../../models/types';
import { useParameters, useUpdateParameter, useReset } from '../../store/gameStore';

export function AssumptionPanel() {
  const parameters = useParameters();
  const updateParameter = useUpdateParameter();
  const reset = useReset();

  return (
    <div className="bg-gray-900 p-4 rounded-lg border border-gray-700 h-full overflow-y-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-white">Model Parameters</h2>
        <button
          onClick={reset}
          className="px-3 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-gray-200 rounded transition-colors"
        >
          Reset
        </button>
      </div>

      <p className="text-xs text-gray-400 mb-4">
        Adjust parameters to see how equilibrium predictions change.
        Based on Patell's DSA signaling model.
      </p>

      {/* Game Structure Parameters (always global) */}
      <div className="mb-4">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Game Structure
        </h3>
        <div className="space-y-2">
          {PARAMETER_CONTROLS.map((config) => (
            <ParameterSlider
              key={config.id}
              config={config}
              value={parameters[config.id] as number}
              onChange={(value) => updateParameter(config.id, value)}
            />
          ))}
        </div>
      </div>

      {/* State Capabilities (splittable) */}
      <div>
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          State Capabilities
        </h3>
        <div className="space-y-2">
          {SPLITTABLE_PARAMETERS.map((config) => (
            <SplittableSlider
              key={config.id1}
              config={config}
              value1={parameters[config.id1] as number}
              value2={parameters[config.id2] as number}
              linked={parameters[config.linkedId] as boolean}
              onValue1Change={(value) => updateParameter(config.id1, value)}
              onValue2Change={(value) => updateParameter(config.id2, value)}
              onLinkedChange={(linked) => updateParameter(config.linkedId, linked)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
