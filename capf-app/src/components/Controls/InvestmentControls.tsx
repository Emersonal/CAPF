/**
 * InvestmentControls - Controls for investment mode
 * Shows investment slider, derived w/σ values, and GTO solver button
 */

import { INVESTMENT_PARAMETER } from '../../models/types';
import {
  useParameters,
  useUpdateParameter,
  useGTOResult,
  useGTOSolving,
  useRunGTOSolver,
} from '../../store/gameStore';
import { investmentToW, investmentToSigma } from '../../simulation/investment';

function InvestmentSlider({
  id,
  label,
  value,
  min,
  max,
  step,
  onChange,
  compact = false,
}: {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  compact?: boolean;
}) {
  const percentage = ((value - min) / (max - min)) * 100;
  const w = investmentToW(value);
  const sigma = investmentToSigma(value);

  return (
    <div className={compact ? 'mb-1' : 'mb-2'}>
      <div className="flex justify-between items-baseline mb-1">
        <label htmlFor={id} className={`font-medium text-gray-300 ${compact ? 'text-xs' : 'text-sm'}`}>
          {label}
        </label>
        <span className={`font-mono text-blue-400 ${compact ? 'text-xs' : 'text-sm'}`}>
          {value}
        </span>
      </div>
      <input
        type="range"
        id={id}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className={`w-full rounded-lg appearance-none cursor-pointer ${compact ? 'h-1.5' : 'h-2'}`}
        style={{
          background: `linear-gradient(to right, #10b981 0%, #10b981 ${percentage}%, #374151 ${percentage}%, #374151 100%)`,
        }}
      />
      <div className="flex gap-3 mt-1 text-[10px] text-gray-500">
        <span>w = {w.toFixed(2)}</span>
        <span>σ = {sigma.toFixed(2)}</span>
      </div>
    </div>
  );
}

export function InvestmentControls() {
  const params = useParameters();
  const updateParameter = useUpdateParameter();
  const gtoResult = useGTOResult();
  const gtoSolving = useGTOSolving();
  const runGTOSolver = useRunGTOSolver();

  const config = INVESTMENT_PARAMETER;

  const handleLinkedChange = (value: number) => {
    updateParameter('I1', value);
    updateParameter('I2', value);
  };

  const handleToggle = () => {
    if (!params.investmentLinked) {
      updateParameter('I2', params.I1);
    }
    updateParameter('investmentLinked', !params.investmentLinked);
  };

  return (
    <div className="p-3 bg-gray-800/50 rounded-lg border border-gray-700">
      {/* Header with split toggle */}
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-gray-200">{config.label}</span>
        <label className="flex items-center gap-1.5 cursor-pointer group">
          <input
            type="checkbox"
            checked={!params.investmentLinked}
            onChange={handleToggle}
            className="w-3.5 h-3.5 rounded border-gray-600 bg-gray-700 text-blue-500
                       focus:ring-blue-500 focus:ring-offset-gray-900 cursor-pointer"
          />
          <span className="text-xs text-gray-400 group-hover:text-gray-300 transition-colors">
            Split by state
          </span>
        </label>
      </div>

      {/* Slider(s) */}
      {params.investmentLinked ? (
        <InvestmentSlider
          id="investment-linked"
          label={config.linkedLabel}
          value={params.I1}
          min={config.min}
          max={config.max}
          step={config.step}
          onChange={handleLinkedChange}
        />
      ) : (
        <div className="space-y-1 pl-2 border-l-2 border-gray-600">
          <InvestmentSlider
            id="investment-us"
            label={config.state1Label}
            value={params.I1}
            min={config.min}
            max={config.max}
            step={config.step}
            onChange={(v) => updateParameter('I1', v)}
            compact
          />
          <InvestmentSlider
            id="investment-cn"
            label={config.state2Label}
            value={params.I2}
            min={config.min}
            max={config.max}
            step={config.step}
            onChange={(v) => updateParameter('I2', v)}
            compact
          />
        </div>
      )}

      <p className="text-xs text-gray-400 mt-2">{config.description}</p>
      <p className="text-xs text-emerald-300 mt-0.5 italic">{config.comparativeStatic}</p>

      {/* GTO Solver Button */}
      <button
        onClick={runGTOSolver}
        disabled={gtoSolving}
        className="w-full mt-3 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 disabled:from-gray-700 disabled:to-gray-700 disabled:text-gray-500 text-white text-sm font-medium rounded-lg transition-all"
      >
        {gtoSolving ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Solving...
          </span>
        ) : (
          'Find Nash Equilibrium'
        )}
      </button>

      {/* GTO Result */}
      {gtoResult && (
        <div className="mt-3 p-2 bg-gray-900/50 rounded border border-gray-700 text-xs">
          <div className="font-medium text-gray-300 mb-1">
            Nash Equilibrium {gtoResult.converged ? '' : '(did not converge)'}
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-gray-400">
            <span>I_US = {gtoResult.I1}</span>
            <span>I_CN = {gtoResult.I2}</span>
            <span>w_US = {gtoResult.w1.toFixed(2)}</span>
            <span>w_CN = {gtoResult.w2.toFixed(2)}</span>
            <span>σ_US = {gtoResult.sigma1.toFixed(2)}</span>
            <span>σ_CN = {gtoResult.sigma2.toFixed(2)}</span>
          </div>
          <div className="mt-1 pt-1 border-t border-gray-700 grid grid-cols-2 gap-x-4 text-gray-400">
            <span>EU_US = {gtoResult.eu1.toFixed(1)}</span>
            <span>EU_CN = {gtoResult.eu2.toFixed(1)}</span>
          </div>
          <div className="mt-1 text-gray-500">
            {gtoResult.iterations} iteration{gtoResult.iterations !== 1 ? 's' : ''}
          </div>
        </div>
      )}
    </div>
  );
}
