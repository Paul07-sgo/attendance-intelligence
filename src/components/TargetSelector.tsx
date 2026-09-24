import React from 'react';
import { Target, Check } from 'lucide-react';

interface TargetSelectorProps {
  target: number;
  setTarget: (val: number) => void;
}

export const TargetSelector: React.FC<TargetSelectorProps> = ({ target, setTarget }) => {
  const presetTargets = [75, 80, 85, 87, 90, 95];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (!isNaN(val)) {
      setTarget(Math.min(100, Math.max(0, val)));
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 lg:p-8 border border-slate-200 dark:border-slate-800 shadow-sm transition-all space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Left info label */}
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-100 dark:border-indigo-900/50 shrink-0">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base lg:text-lg font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
              OVERALL ATTENDANCE TARGET
            </h3>
            <p className="text-xs lg:text-sm text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
              Primary target for pooled aggregate attendance (Total Attended / Total Conducted). Does not overwrite subject targets.
            </p>
          </div>
        </div>

        {/* Target display & numeric input */}
        <div className="flex items-center space-x-3">
          <div className="relative">
            <input
              type="number"
              min={50}
              max={100}
              step={0.1}
              value={target}
              onChange={handleInputChange}
              className="w-28 px-4 py-2.5 text-right font-black text-2xl lg:text-3xl text-indigo-600 dark:text-indigo-400 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
            <span className="absolute right-4 top-3 text-base font-extrabold text-slate-400 pointer-events-none">
              %
            </span>
          </div>
        </div>
      </div>

      {/* Slider & Presets */}
      <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 space-y-4">
        <div className="flex items-center space-x-4">
          <span className="text-xs lg:text-sm font-bold text-slate-400">50%</span>
          <input
            type="range"
            min={50}
            max={100}
            step={0.5}
            value={target}
            onChange={(e) => setTarget(parseFloat(e.target.value))}
            className="w-full h-2.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
          />
          <span className="text-xs lg:text-sm font-bold text-slate-400">100%</span>
        </div>

        {/* Quick presets */}
        <div className="flex flex-wrap items-center gap-2.5 pt-1">
          <span className="text-xs lg:text-sm font-semibold text-slate-500 dark:text-slate-400 mr-2">
            Quick presets:
          </span>
          {presetTargets.map((preset) => {
            const isSelected = Math.abs(target - preset) < 0.01;
            return (
              <button
                key={preset}
                onClick={() => setTarget(preset)}
                className={`px-4 py-2 text-xs lg:text-sm font-bold rounded-xl border transition-all flex items-center space-x-1.5 ${
                  isSelected
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700/60'
                }`}
              >
                {isSelected && <Check className="w-4 h-4" />}
                <span>{preset}%</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
