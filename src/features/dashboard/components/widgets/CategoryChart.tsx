import React, { useState } from 'react';
import { BarChart3 } from 'lucide-react';
import { motion } from 'motion/react';

interface CategoryChartProps {
  categoryData: { name: string; count: number }[];
  totalReported: number;
}

export const CategoryChart: React.FC<CategoryChartProps> = ({ categoryData, totalReported }) => {
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-extrabold text-slate-950 text-sm flex items-center gap-1.5">
            <BarChart3 className="w-4 h-4 text-emerald-600" />
            Audits by Category
          </h3>
          <p className="text-[10px] text-slate-400">Distribution of crowd-sourced incidents in active scope</p>
        </div>
        {hoveredCategory && (
          <span className="text-[9px] font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-bold">
            {hoveredCategory}
          </span>
        )}
      </div>

      <div className="space-y-2.5">
        {categoryData.slice(0, 5).map(({ name, count }) => {
          const maxCount = Math.max(...categoryData.map(c => c.count)) || 1;
          const widthPct = (count / maxCount) * 100;
          const globalPct = totalReported > 0 ? Math.round((count / totalReported) * 100) : 0;
          
          const barColor = 
            name === 'Pothole' ? 'bg-amber-500' :
            name === 'Garbage' ? 'bg-orange-500' :
            name === 'Water Leakage' ? 'bg-sky-500' :
            name === 'Streetlight' ? 'bg-yellow-400' : 'bg-emerald-500';

          return (
            <div 
              key={name}
              className="space-y-1 group"
              onMouseEnter={() => setHoveredCategory(`${name}: ${count} reports`)}
              onMouseLeave={() => setHoveredCategory(null)}
            >
              <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
                <span className="group-hover:text-emerald-600 transition-colors font-sans">{name}</span>
                <span className="font-mono text-slate-500 text-[10px]">{count} ({globalPct}%)</span>
              </div>
              <div className="w-full bg-slate-100 h-3 rounded-lg overflow-hidden flex items-center p-0.5 border border-slate-200/40">
                <motion.div 
                  className={`${barColor} h-full rounded-md shadow-sm`}
                  initial={{ width: 0 }}
                  animate={{ width: `${widthPct}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="pt-2 text-center text-[10px] text-slate-400 font-medium">
        <span>Hover on rows to inspect exact count breakdowns.</span>
      </div>
    </div>
  );
};

export default CategoryChart;
