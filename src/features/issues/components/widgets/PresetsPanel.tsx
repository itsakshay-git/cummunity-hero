import React, { useState } from 'react';
import { Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { PRESETS } from '../../../../lib/constants';

interface PresetsPanelProps {
  onSelectPreset: (preset: typeof PRESETS[0]) => void;
}

export const PresetsPanel: React.FC<PresetsPanelProps> = ({ onSelectPreset }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-4 transition-all shadow-[0_1px_3px_rgba(0,0,0,0.01)]">
      <div className="flex items-center justify-between cursor-pointer select-none" onClick={() => setIsOpen(!isOpen)}>
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 rounded-lg">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 dark:text-slate-200 text-xs">Sandbox Simulation Shelf</h3>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">Fast-track testing: Select a preset to automatically pre-fill details & location</p>
          </div>
        </div>
        <button type="button" className="text-slate-400 hover:text-slate-650 dark:hover:text-slate-350 bg-transparent border-0 cursor-pointer p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors">
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {isOpen && (
        <div className="flex items-center space-x-3 overflow-x-auto pt-3 pb-1 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
          {PRESETS.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              id={`preset-btn-${idx}`}
              onClick={() => onSelectPreset(preset)}
              className="flex items-center space-x-2.5 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500/80 hover:shadow-sm transition-all text-left cursor-pointer min-w-[200px] flex-shrink-0 group"
            >
              <img 
                src={preset.imageUrl} 
                alt={preset.title} 
                className="w-10 h-10 object-cover rounded-lg border border-slate-100 dark:border-slate-800 flex-shrink-0"
              />
              <div className="min-w-0 flex-grow">
                <span className="block font-bold text-slate-850 dark:text-slate-200 text-[11px] truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  {preset.title}
                </span>
                <span className="text-[9px] text-slate-400 dark:text-slate-500 font-mono block truncate">
                  {preset.category} • <span className={
                    preset.severity === 'Critical' ? 'text-red-500 font-bold' :
                    preset.severity === 'High' ? 'text-amber-500 font-bold' :
                    preset.severity === 'Medium' ? 'text-emerald-500 font-bold' : 'text-blue-500 font-bold'
                  }>{preset.severity}</span>
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default PresetsPanel;
