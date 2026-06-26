import React from 'react';
import { Heart } from 'lucide-react';
import { Issue } from '../../../../types';
import Badge from '../../../../components/ui/Badge';

interface SupportedTabProps {
  supportedIssues: Issue[];
  onSelectIssue: (id: string) => void;
  onToggleSupport?: (postId: string) => Promise<void>;
}

export const SupportedTab: React.FC<SupportedTabProps> = ({
  supportedIssues,
  onSelectIssue,
  onToggleSupport
}) => {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">Supported Incidents ({supportedIssues.length})</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {supportedIssues.map(issue => (
          <div 
            key={issue.id} 
            onClick={() => onSelectIssue(issue.id)}
            className="p-4 bg-slate-50/50 dark:bg-slate-950/20 hover:bg-slate-50 dark:hover:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 rounded-xl flex gap-3 cursor-pointer transition-colors"
          >
            {issue.imageUrl && (
              <img 
                src={issue.imageUrl} 
                alt={issue.title} 
                className="w-16 h-16 rounded-lg object-cover border border-slate-200/60 dark:border-slate-800 flex-shrink-0"
              />
            )}
            <div className="min-w-0 flex-grow">
              <Badge variant="category">
                {issue.category}
              </Badge>
              <h4 className="font-extrabold text-slate-900 dark:text-slate-100 text-xs block truncate mt-1.5">{issue.title}</h4>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5 font-mono">Reported by {issue.reportedByName}</p>
              <div className="flex items-center justify-between mt-2">
                <Badge variant="status" value={issue.status}>
                  {issue.status.replace(/_/g, ' ')}
                </Badge>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onToggleSupport) {
                      onToggleSupport(`post_${issue.id}`);
                    }
                  }}
                  className="text-[9px] font-bold text-rose-500 hover:text-rose-600 flex items-center gap-1 bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-900/40 px-2 py-1 rounded-lg transition-all border border-rose-100 dark:border-rose-900/40 cursor-pointer"
                >
                  <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
                  Supported
                </button>
              </div>
            </div>
          </div>
        ))}
        {supportedIssues.length === 0 && (
          <p className="text-xs text-slate-500 dark:text-slate-450 italic col-span-2">You haven't supported any neighborhood issues yet.</p>
        )}
      </div>
    </div>
  );
};

export default SupportedTab;
