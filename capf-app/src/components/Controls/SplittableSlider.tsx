/**
 * SplittableSlider - Slider that can show single value or split into two
 * Used for state-specific parameters (w, sigma) that can be symmetric or asymmetric
 */

import type { SplittableParameterConfig } from '../../models/types';

interface SplittableSliderProps {
  config: SplittableParameterConfig;
  value1: number;
  value2: number;
  linked: boolean;
  onValue1Change: (value: number) => void;
  onValue2Change: (value: number) => void;
  onLinkedChange: (linked: boolean) => void;
}

/**
 * Single slider component (reused for both linked and split modes)
 */
function SingleSlider({
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

  return (
    <div className={compact ? 'mb-1' : 'mb-2'}>
      <div className="flex justify-between items-baseline mb-1">
        <label htmlFor={id} className={`font-medium text-gray-300 ${compact ? 'text-xs' : 'text-sm'}`}>
          {label}
        </label>
        <span className={`font-mono text-blue-400 ${compact ? 'text-xs' : 'text-sm'}`}>
          {value.toFixed(1)}
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
          background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${percentage}%, #374151 ${percentage}%, #374151 100%)`,
        }}
      />
    </div>
  );
}

export function SplittableSlider({
  config,
  value1,
  value2,
  linked,
  onValue1Change,
  onValue2Change,
  onLinkedChange,
}: SplittableSliderProps) {
  const {
    label,
    description,
    linkedLabel,
    state1Label,
    state2Label,
    id1,
    min,
    max,
    step,
    comparativeStatic,
  } = config;

  // When linked, both values move together
  const handleLinkedChange = (value: number) => {
    onValue1Change(value);
    onValue2Change(value);
  };

  // Toggle linked/split mode
  const handleToggle = () => {
    if (!linked) {
      // When linking, sync value2 to value1
      onValue2Change(value1);
    }
    onLinkedChange(!linked);
  };

  return (
    <div className="mb-4 p-3 bg-gray-800/50 rounded-lg border border-gray-700">
      {/* Header with toggle */}
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-gray-200">{label}</span>
        <label className="flex items-center gap-1.5 cursor-pointer group">
          <input
            type="checkbox"
            checked={!linked}
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
      {linked ? (
        // Single slider when linked
        <SingleSlider
          id={id1}
          label={linkedLabel}
          value={value1}
          min={min}
          max={max}
          step={step}
          onChange={handleLinkedChange}
        />
      ) : (
        // Two sliders when split
        <div className="space-y-1 pl-2 border-l-2 border-gray-600">
          <SingleSlider
            id={`${id1}-split`}
            label={state1Label}
            value={value1}
            min={min}
            max={max}
            step={step}
            onChange={onValue1Change}
            compact
          />
          <SingleSlider
            id={`${config.id2}-split`}
            label={state2Label}
            value={value2}
            min={min}
            max={max}
            step={step}
            onChange={onValue2Change}
            compact
          />
        </div>
      )}

      {/* Description and comparative static */}
      <p className="text-xs text-gray-400 mt-2">{description}</p>
      <p className="text-xs text-blue-300 mt-0.5 italic">{comparativeStatic}</p>
    </div>
  );
}
