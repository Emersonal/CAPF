/**
 * ParameterSlider - Slider control for model parameters
 * Shows label, current value, and comparative static hint
 */

import type { ParameterControlConfig } from '../../models/types';

interface ParameterSliderProps {
  config: ParameterControlConfig;
  value: number;
  onChange: (value: number) => void;
}

export function ParameterSlider({ config, value, onChange }: ParameterSliderProps) {
  const { id, label, description, min, max, step, comparativeStatic } = config;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(parseFloat(e.target.value));
  };

  // Calculate percentage for gradient background
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className="mb-4">
      <div className="flex justify-between items-baseline mb-1">
        <label htmlFor={id} className="text-sm font-medium text-gray-200">
          {label}
        </label>
        <span className="text-sm font-mono text-blue-400">{value.toFixed(1)}</span>
      </div>

      <input
        type="range"
        id={id}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={handleChange}
        className="w-full h-2 rounded-lg appearance-none cursor-pointer"
        style={{
          background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${percentage}%, #374151 ${percentage}%, #374151 100%)`,
        }}
      />

      <p className="text-xs text-gray-400 mt-1">{description}</p>
      <p className="text-xs text-blue-300 mt-0.5 italic">{comparativeStatic}</p>
    </div>
  );
}
