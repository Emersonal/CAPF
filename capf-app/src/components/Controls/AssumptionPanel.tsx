/**
 * AssumptionPanel - Container for all parameter sliders
 * Left sidebar showing all adjustable model parameters
 */

import { ParameterSlider } from './ParameterSlider';
import { PARAMETER_CONTROLS } from '../../models/types';
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

      <div className="space-y-2">
        {PARAMETER_CONTROLS.map((config) => (
          <ParameterSlider
            key={config.id}
            config={config}
            value={parameters[config.id]}
            onChange={(value) => updateParameter(config.id, value)}
          />
        ))}
      </div>
    </div>
  );
}
