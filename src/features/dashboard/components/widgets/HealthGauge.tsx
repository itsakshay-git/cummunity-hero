import React, { useState } from 'react';

interface HealthGaugeProps {
  overallHealth: number;
  infrastructureScore: number;
  participationScore: number;
  resolutionScore: number;
  statusLabel: string;
  efficiencyLabel: string;
  description: string;
  totalCommunities: number;
  onNavigate: (tab: string) => void;
}

export const HealthGauge: React.FC<HealthGaugeProps> = ({
  overallHealth,
  infrastructureScore,
  participationScore,
  resolutionScore,
  statusLabel,
  efficiencyLabel,
  totalCommunities,
  onNavigate
}) => {
  const [activeScoreTab, setActiveScoreTab] = useState<'infrastructure' | 'participation' | 'resolution'>('infrastructure');

  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-extrabold text-slate-950 text-sm">Community Health Score</h3>
            <p className="text-[10px] text-slate-400 font-medium">Composite local utility integrity index</p>
          </div>
          <span className="bg-emerald-50 text-emerald-700 text-[10px] px-2 py-0.5 rounded-full font-bold">
            {statusLabel}
          </span>
        </div>

        {/* Circular SVG Gauge */}
        <div className="relative flex items-center justify-center my-4">
          <svg className="w-36 h-36 transform -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="40"
              stroke="#E2E8F0"
              strokeWidth="8"
              fill="transparent"
            />
            <circle
              cx="50"
              cy="50"
              r="40"
              stroke="#10B981"
              strokeWidth="8"
              fill="transparent"
              strokeDasharray={`${2 * Math.PI * 40}`}
              strokeDashoffset={`${2 * Math.PI * 40 * (1 - overallHealth / 100)}`}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute text-center">
            <span className="text-3xl font-black text-slate-950 tracking-tighter">{overallHealth}%</span>
            <span className="block text-[8px] font-mono font-bold text-slate-400 uppercase tracking-widest mt-0.5">Health Score</span>
          </div>
        </div>

        {/* Sub-Score Tab selectors */}
        <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl mb-4 text-center">
          <button
            onClick={() => setActiveScoreTab('infrastructure')}
            className={`text-[9px] font-bold py-1.5 rounded-lg transition-all cursor-pointer ${
              activeScoreTab === 'infrastructure' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Utility
          </button>
          <button
            onClick={() => setActiveScoreTab('participation')}
            className={`text-[9px] font-bold py-1.5 rounded-lg transition-all cursor-pointer ${
              activeScoreTab === 'participation' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Civic Rate
          </button>
          <button
            onClick={() => setActiveScoreTab('resolution')}
            className={`text-[9px] font-bold py-1.5 rounded-lg transition-all cursor-pointer ${
              activeScoreTab === 'resolution' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Efficiency
          </button>
        </div>

        {/* Selected pane description */}
        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
          {activeScoreTab === 'infrastructure' && (
            <div>
              <div className="flex justify-between text-[10px] font-bold text-slate-700 mb-1">
                <span>Infrastructure & Utility Index</span>
                <span>{infrastructureScore}/100</span>
              </div>
              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${infrastructureScore}%` }}></div>
              </div>
              <p className="text-[9px] text-slate-400 mt-1.5 font-medium leading-normal">
                Derived from public streetlight functionality, road safety levels, and water leakage control indexes.
              </p>
            </div>
          )}

          {activeScoreTab === 'participation' && (
            <div>
              <div className="flex justify-between text-[10px] font-bold text-slate-700 mb-1">
                <span>Citizen Co-Auditing Rate</span>
                <span>{participationScore}/100</span>
              </div>
              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                <div className="bg-indigo-500 h-full rounded-full transition-all duration-500" style={{ width: `${participationScore}%` }}></div>
              </div>
              <p className="text-[9px] text-slate-400 mt-1.5 font-medium leading-normal">
                Calculated based on active member population and the percentage of local reports validated by local residents.
              </p>
            </div>
          )}

          {activeScoreTab === 'resolution' && (
            <div>
              <div className="flex justify-between text-[10px] font-bold text-slate-700 mb-1">
                <span>Resolution Index</span>
                <span>{resolutionScore}/100</span>
              </div>
              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                <div className="bg-blue-500 h-full rounded-full transition-all duration-500" style={{ width: `${resolutionScore}%` }}></div>
              </div>
              <p className="text-[9px] text-slate-400 mt-1.5 font-medium leading-normal">
                Rating of {efficiencyLabel}. Indicates the ratio of closed or successfully resolved public reports.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[10px]">
        <span className="text-slate-400 font-semibold font-sans">Active Communities: {totalCommunities}</span>
        <button 
          onClick={() => onNavigate('leaderboard')} 
          className="text-emerald-600 hover:text-emerald-500 font-bold flex items-center gap-0.5 cursor-pointer"
        >
          Leaderboard League →
        </button>
      </div>
    </div>
  );
};

export default HealthGauge;
