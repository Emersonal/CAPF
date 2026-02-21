/**
 * AssumptionPanel - Container for all parameter sliders
 * Left sidebar showing all adjustable model parameters
 *
 * Layout:
 * - Game Structure: T, V, θ, c_m (global parameters)
 * - State Capabilities: Manual (w, σ) or Investment mode (I → w, σ)
 */

import { ParameterSlider } from './ParameterSlider';
import { SplittableSlider } from './SplittableSlider';
import { InvestmentControls } from './InvestmentControls';
import { PARAMETER_CONTROLS, SPLITTABLE_PARAMETERS, WEALTH_PARAMETER } from '../../models/types';
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

      {/* State Endowments (always visible) */}
      <div className="mb-4">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          State Endowments
        </h3>
        <SplittableSlider
          config={WEALTH_PARAMETER}
          value1={parameters.W1}
          value2={parameters.W2}
          linked={parameters.wealthLinked}
          onValue1Change={(value) => updateParameter('W1', value)}
          onValue2Change={(value) => updateParameter('W2', value)}
          onLinkedChange={(linked) => updateParameter('wealthLinked', linked)}
        />
      </div>

      {/* State Capabilities - Mode toggle + controls */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            State Capabilities
          </h3>
          {/* Mode toggle: Manual / Investment */}
          <div className="flex bg-gray-800 rounded-lg p-0.5 border border-gray-700">
            <button
              onClick={() => updateParameter('investmentMode', false)}
              className={`px-2.5 py-1 text-[10px] font-medium rounded-md transition-all ${
                !parameters.investmentMode
                  ? 'bg-gray-600 text-white'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              Manual
            </button>
            <button
              onClick={() => updateParameter('investmentMode', true)}
              className={`px-2.5 py-1 text-[10px] font-medium rounded-md transition-all ${
                parameters.investmentMode
                  ? 'bg-emerald-700 text-white'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              Investment
            </button>
          </div>
        </div>

        {parameters.investmentMode ? (
          <InvestmentControls />
        ) : (
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
        )}
      </div>
    </div>
  );
}
