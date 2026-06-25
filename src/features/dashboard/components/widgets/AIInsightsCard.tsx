import React from 'react';
import { Sparkles, Flame, ShieldAlert } from 'lucide-react';

interface AIInsightsCardProps {
  insights: {
    title: string;
    content: string;
    health: string;
    alert: string;
    badge: string;
  };
}

export const AIInsightsCard: React.FC<AIInsightsCardProps> = ({ insights }) => {
  return (
    <div className="lg:col-span-2 bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 text-white p-6 md:p-8 rounded-3xl relative overflow-hidden shadow-md border border-slate-800">
      <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 bg-emerald-500/15 rounded-xl border border-emerald-500/30">
            <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
          </div>
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400">Gemini AI Synthesis</span>
        </div>
        <span className="bg-slate-800 border border-slate-700 text-slate-300 font-mono text-[9px] px-2.5 py-1 rounded-full">
          {insights.badge}
        </span>
      </div>

      <h2 className="text-lg md:text-xl font-extrabold tracking-tight mb-3 font-sans text-white leading-snug">
        {insights.title}
      </h2>
      <p className="text-xs md:text-sm text-slate-300 leading-relaxed mb-6 font-medium">
        {insights.content}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-800/80 pt-6">
        <div className="flex items-start space-x-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
          <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg mt-0.5">
            <Flame className="w-4 h-4" />
          </div>
          <div>
            <span className="block text-[8px] text-slate-400 font-mono uppercase tracking-wider font-extrabold">Neighborhood Index</span>
            <span className="text-sm font-black text-white">{insights.health} Score</span>
          </div>
        </div>

        <div className="flex items-start space-x-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
          <div className="p-2 bg-red-950/40 border border-red-500/20 rounded-lg text-rose-400 mt-0.5">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <span className="block text-[8px] text-rose-400 font-mono uppercase tracking-wider font-extrabold">Safety Action Block</span>
            <span className="text-xs text-rose-100 font-bold leading-tight block truncate max-w-[200px]">{insights.alert}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIInsightsCard;
