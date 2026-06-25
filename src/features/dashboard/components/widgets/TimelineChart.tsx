import React from 'react';

interface TimelineChartProps {
  timelineData: { month: string; reported: number; resolved: number }[];
}

export const TimelineChart: React.FC<TimelineChartProps> = ({ timelineData }) => {
  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
      <div>
        <h3 className="font-extrabold text-slate-950 text-sm">Resolution Timeline</h3>
        <p className="text-[10px] text-slate-400">Comparison of newly logged incidents vs. resolutions resolved</p>
      </div>

      <div className="relative h-44 w-full">
        {/* SVG Plotting Frame */}
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          {/* Grid Lines */}
          <line x1="0" y1="25" x2="100" y2="25" stroke="#F1F5F9" strokeWidth="0.5" />
          <line x1="0" y1="50" x2="100" y2="50" stroke="#F1F5F9" strokeWidth="0.5" />
          <line x1="0" y1="75" x2="100" y2="75" stroke="#F1F5F9" strokeWidth="0.5" />
          
          {/* Reported Area path (Emerald) */}
          <path
            d={`
              M 0 100
              L 0 ${100 - (timelineData[0].reported / 35) * 80}
              L 20 ${100 - (timelineData[1].reported / 35) * 80}
              L 40 ${100 - (timelineData[2].reported / 35) * 80}
              L 60 ${100 - (timelineData[3].reported / 35) * 80}
              L 80 ${100 - (timelineData[4].reported / 35) * 80}
              L 100 ${100 - (timelineData[5].reported / 35) * 80}
              L 100 100 Z
            `}
            fill="url(#emerald-gradient)"
            opacity="0.15"
          />

          {/* Resolved Area path (Indigo) */}
          <path
            d={`
              M 0 100
              L 0 ${100 - (timelineData[0].resolved / 35) * 80}
              L 20 ${100 - (timelineData[1].resolved / 35) * 80}
              L 40 ${100 - (timelineData[2].resolved / 35) * 80}
              L 60 ${100 - (timelineData[3].resolved / 35) * 80}
              L 80 ${100 - (timelineData[4].resolved / 35) * 80}
              L 100 ${100 - (timelineData[5].resolved / 35) * 80}
              L 100 100 Z
            `}
            fill="url(#indigo-gradient)"
            opacity="0.1"
          />

          {/* Reported Line */}
          <polyline
            fill="none"
            stroke="#10B981"
            strokeWidth="2"
            points={`
              0,${100 - (timelineData[0].reported / 35) * 80}
              20,${100 - (timelineData[1].reported / 35) * 80}
              40,${100 - (timelineData[2].reported / 35) * 80}
              60,${100 - (timelineData[3].reported / 35) * 80}
              80,${100 - (timelineData[4].reported / 35) * 80}
              100,${100 - (timelineData[5].reported / 35) * 80}
            `}
          />

          {/* Resolved Line */}
          <polyline
            fill="none"
            stroke="#6366F1"
            strokeWidth="2"
            strokeDasharray="2,2"
            points={`
              0,${100 - (timelineData[0].resolved / 35) * 80}
              20,${100 - (timelineData[1].resolved / 35) * 80}
              40,${100 - (timelineData[2].resolved / 35) * 80}
              60,${100 - (timelineData[3].resolved / 35) * 80}
              80,${100 - (timelineData[4].resolved / 35) * 80}
              100,${100 - (timelineData[5].resolved / 35) * 80}
            `}
          />

          {/* Definition of Gradients */}
          <defs>
            <linearGradient id="emerald-gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10B981" />
              <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="indigo-gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366F1" />
              <stop offset="100%" stopColor="#6366F1" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>

        {/* Floating Markers/Data labels on Timeline */}
        <div className="absolute inset-0 flex justify-between pointer-events-none text-[8px] font-mono text-slate-400 pt-36">
          {timelineData.map((d, i) => (
            <div key={i} className="flex flex-col items-center w-8 text-center">
              <span className="font-bold text-slate-700">{d.month}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Chart Legends */}
      <div className="flex items-center justify-center space-x-6 text-xs pt-1">
        <div className="flex items-center space-x-1.5 font-semibold text-slate-700">
          <span className="w-3 h-3 bg-emerald-500 rounded-full inline-block"></span>
          <span>Reported Incidents</span>
        </div>
        <div className="flex items-center space-x-1.5 font-semibold text-slate-700">
          <span className="w-3 h-1.5 border-t-2 border-dashed border-indigo-500 inline-block"></span>
          <span>Resolved Audits</span>
        </div>
      </div>
    </div>
  );
};

export default TimelineChart;
