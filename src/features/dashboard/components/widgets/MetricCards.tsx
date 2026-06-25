import React from 'react';
import { TrendingUp, Clock, AlertTriangle, CheckCircle2, Zap, Users, ShieldCheck } from 'lucide-react';

interface MetricCardsProps {
  totalReported: number;
  pendingVerification: number;
  inProgress: number;
  resolved: number;
  resolutionRate: number;
}

export const MetricCards: React.FC<MetricCardsProps> = ({
  totalReported,
  pendingVerification,
  inProgress,
  resolved,
  resolutionRate
}) => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
      {/* Metric 1 */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:border-slate-300 hover:shadow transition-all flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500 font-sans uppercase tracking-wide">Total Audited</span>
          <div className="p-2 bg-slate-50 text-slate-700 rounded-xl border border-slate-100">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-4">
          <span className="text-3xl font-black text-slate-950 tracking-tight">{totalReported}</span>
          <div className="flex items-center gap-1.5 text-[10px] text-emerald-600 mt-1 font-semibold">
            <Zap className="w-3.5 h-3.5" />
            <span>100% Crowd-Sourced</span>
          </div>
        </div>
      </div>

      {/* Metric 2 */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:border-slate-300 hover:shadow transition-all flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500 font-sans uppercase tracking-wide">Pending Verify</span>
          <div className="p-2 bg-amber-50 text-amber-700 rounded-xl border border-amber-100">
            <Clock className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-4">
          <span className="text-3xl font-black text-slate-950 tracking-tight">{pendingVerification}</span>
          <div className="flex items-center gap-1 text-[10px] text-amber-600 mt-1 font-medium">
            <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-ping"></span>
            <span>Awaiting Civic Audit</span>
          </div>
        </div>
      </div>

      {/* Metric 3 */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:border-slate-300 hover:shadow transition-all flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500 font-sans uppercase tracking-wide">Under Action</span>
          <div className="p-2 bg-blue-50 text-blue-700 rounded-xl border border-blue-100">
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-4">
          <span className="text-3xl font-black text-slate-950 tracking-tight">{inProgress}</span>
          <div className="flex items-center gap-1.5 text-[10px] text-blue-600 mt-1 font-semibold">
            <Users className="w-3.5 h-3.5" />
            <span>Assigned to Resolvers</span>
          </div>
        </div>
      </div>

      {/* Metric 4 */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:border-slate-300 hover:shadow transition-all flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500 font-sans uppercase tracking-wide">Closed & Solved</span>
          <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-4">
          <span className="text-3xl font-black text-slate-950 tracking-tight">{resolved}</span>
          <div className="flex items-center gap-1.5 text-[10px] text-emerald-600 mt-1 font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{resolutionRate}% Resolution Rate</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MetricCards;
