import React from 'react';
import { Camera } from 'lucide-react';
import { PRESETS } from '../../../../lib/constants';

interface PresetsPanelProps {
  onSelectPreset: (preset: typeof PRESETS[0]) => void;
}

export const PresetsPanel: React.FC<PresetsPanelProps> = ({ onSelectPreset }) => {
  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="font-bold text-slate-900 text-sm mb-3">Fast-Track Simulation</h3>
        <p className="text-xs text-slate-500 mb-4">Click any sample incident below to pre-populate the form and test Gemini AI scanning.</p>
        
        <div className="space-y-3">
          {PRESETS.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              id={`preset-btn-${idx}`}
              onClick={() => onSelectPreset(preset)}
              className="w-full text-left p-3 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/20 transition-all flex items-center space-x-3 group cursor-pointer"
            >
              <img 
                src={preset.imageUrl} 
                alt={preset.title} 
                className="w-12 h-12 object-cover rounded-lg border border-slate-100 flex-shrink-0"
              />
              <div className="min-w-0">
                <span className="block font-bold text-slate-900 text-xs group-hover:text-emerald-700 transition-colors">{preset.title}</span>
                <span className="text-[10px] text-slate-400 font-mono block">{preset.category} • {preset.severity}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-center">
        <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
          <Camera className="w-5 h-5" />
        </div>
        <h4 className="font-bold text-slate-900 text-sm mb-1">Upload Real Image</h4>
        <p className="text-xs text-slate-500 mb-4">You can paste any direct web image URL in the form field to simulate customized reports.</p>
      </div>
    </div>
  );
};

export default PresetsPanel;
