import React from 'react';
import { ArrowRight, MapPin } from 'lucide-react';
import { Issue } from '../../../../types';
import { getDistanceMeters } from '../../../../lib/geoUtils';

interface UrgentIssuesProps {
  urgentIssues: Issue[];
  totalIssuesCount: number;
  onSelectIssue: (id: string) => void;
  onNavigate: (tab: string) => void;
  userCoords?: { lat: number; lng: number } | null;
}

export const UrgentIssues: React.FC<UrgentIssuesProps> = ({
  urgentIssues,
  totalIssuesCount,
  onSelectIssue,
  onNavigate,
  userCoords
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-black text-slate-950 dark:text-slate-100 font-sans tracking-tight">Immediate Action Required</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Unresolved issues marked as High or Critical severity.</p>
        </div>
        <button 
          id="view-all-issues-btn"
          onClick={() => onNavigate('issues')}
          className="text-xs font-bold text-emerald-600 dark:text-emerald-500 hover:text-emerald-500 hover:underline flex items-center space-x-1 cursor-pointer"
        >
          <span>View All Issues ({totalIssuesCount})</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {urgentIssues.length === 0 ? (
          <div className="col-span-3 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-8 rounded-2xl text-center text-slate-500 dark:text-slate-400 text-sm">
            No urgent safety hazards in this community scope. Awesome!
          </div>
        ) : (
          urgentIssues.map(issue => (
            <div 
              key={issue.id} 
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between overflow-hidden cursor-pointer"
              onClick={() => onSelectIssue(issue.id)}
            >
              {/* Image & Severity tag */}
              <div className="relative h-40 bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <img 
                  src={issue.imageUrl} 
                  alt={issue.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-3 left-3 flex space-x-1.5">
                  <span className="bg-red-600 text-white font-mono text-[9px] font-extrabold uppercase px-2.5 py-1 rounded-full shadow-sm">
                    {issue.severity}
                  </span>
                  <span className="bg-slate-900/80 backdrop-blur text-white font-mono text-[9px] px-2 py-1 rounded-full">
                    {issue.category}
                  </span>
                </div>
                {userCoords && (
                  <div className="absolute top-3 right-3 bg-emerald-600/90 backdrop-blur text-white font-mono text-[9px] px-2 py-1 rounded-full shadow-md flex items-center space-x-1">
                    <MapPin className="w-2.5 h-2.5" />
                    <span>
                      {(() => {
                        const dist = getDistanceMeters(userCoords.lat, userCoords.lng, issue.latitude, issue.longitude);
                        return dist < 1000 
                          ? `${Math.round(dist)}m away` 
                          : `${(dist / 1000).toFixed(1)}km away`;
                      })()}
                    </span>
                  </div>
                )}
                <div className="absolute bottom-3 right-3 bg-emerald-950 text-emerald-300 text-[10px] px-2 py-1 rounded font-semibold flex items-center space-x-1 shadow-md">
                  <span>Priority Score: {issue.priorityScore}</span>
                </div>
              </div>

              <div className="p-5 flex-grow flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm line-clamp-1 mb-1.5 hover:text-emerald-600 transition-colors">
                    {issue.title}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-350 line-clamp-2 mb-4 leading-relaxed">
                    {issue.description}
                  </p>
                </div>

                <div className="border-t border-slate-100 dark:border-slate-800 pt-3 flex items-center justify-between text-slate-500 dark:text-slate-400 text-[10px] font-medium">
                  <div className="flex items-center space-x-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                    <span className="truncate max-w-[130px]">{issue.address}</span>
                  </div>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-500 font-mono">
                    {issue.status}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default UrgentIssues;
