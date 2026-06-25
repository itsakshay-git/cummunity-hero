import React from 'react';
import { UserActivity } from '../../../../types';

interface ActivityTabProps {
  activities: UserActivity[];
}

export const ActivityTab: React.FC<ActivityTabProps> = ({ activities }) => {
  const formatActivityText = (act: UserActivity) => {
    switch (act.type) {
      case 'report':
        return `Reported a new civic issue: "${act.targetTitle}"`;
      case 'support':
        return `Supported the community issue: "${act.targetTitle}"`;
      case 'comment':
        return `Commented on the issue: "${act.targetTitle}"`;
      case 'verify':
        return `Verified details for the incident: "${act.targetTitle}"`;
      case 'resolve':
        return `Successfully resolved issue: "${act.targetTitle}"`;
      case 'join_community':
        return `Joined the community space: "${act.targetTitle}"`;
      default:
        return `Interacted with: "${act.targetTitle}"`;
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-black text-slate-900">Activity Ledger</h3>
      <div className="relative border-l border-slate-100 pl-4 space-y-6">
        {activities.map(act => (
          <div key={act.id} className="relative">
            {/* Timeline dot */}
            <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-white" />
            <div className="space-y-0.5">
              <p className="text-xs text-slate-800 font-bold leading-normal">
                {formatActivityText(act)}
              </p>
              <div className="flex items-center gap-3 text-[10px] font-mono text-slate-400">
                <span>{new Date(act.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                {act.pointsEarned > 0 && (
                  <span className="text-emerald-600 font-bold">+{act.pointsEarned} XP earned</span>
                )}
              </div>
            </div>
          </div>
        ))}
        {activities.length === 0 && (
          <p className="text-xs text-slate-500 italic">No activities logged yet.</p>
        )}
      </div>
    </div>
  );
};

export default ActivityTab;
