import React from 'react';
import { Issue } from '../../../../types';
import Badge from '../../../../components/ui/Badge';

interface ReportsTabProps {
  reports: Issue[];
  onSelectIssue: (id: string) => void;
}

export const ReportsTab: React.FC<ReportsTabProps> = ({ reports, onSelectIssue }) => {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-black text-slate-900">Reports Submitted ({reports.length})</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reports.map(issue => (
          <div 
            key={issue.id} 
            onClick={() => onSelectIssue(issue.id)}
            className="p-4 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 rounded-2xl flex gap-3 cursor-pointer transition-colors"
          >
            {issue.imageUrl && (
              <img 
                src={issue.imageUrl} 
                alt={issue.title} 
                className="w-16 h-16 rounded-xl object-cover border border-slate-200 flex-shrink-0"
              />
            )}
            <div className="min-w-0 flex-grow">
              <Badge variant="severity" value={issue.severity}>
                {issue.severity}
              </Badge>
              <h4 className="font-extrabold text-slate-900 text-xs block truncate mt-1.5">{issue.title}</h4>
              <p className="text-[10px] text-slate-400 truncate font-mono mt-0.5">{issue.address}</p>
              <Badge variant="status" value={issue.status} className="mt-2">
                {issue.status}
              </Badge>
            </div>
          </div>
        ))}
        {reports.length === 0 && (
          <p className="text-xs text-slate-500 italic col-span-2">You haven't reported any issues yet.</p>
        )}
      </div>
    </div>
  );
};

export default ReportsTab;
