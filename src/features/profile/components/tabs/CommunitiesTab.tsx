import React from 'react';
import { Community } from '../../../../types';
import Badge from '../../../../components/ui/Badge';

interface CommunitiesTabProps {
  communities: Community[];
  onLeaveCommunity: (id: string) => void;
}

export const CommunitiesTab: React.FC<CommunitiesTabProps> = ({ communities, onLeaveCommunity }) => {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-black text-slate-900">Joined Spaces ({communities.length})</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {communities.map(comm => (
          <div 
            key={comm.id} 
            className="p-4 bg-slate-50/50 border border-slate-200 rounded-2xl flex justify-between items-center gap-4"
          >
            <div className="min-w-0 flex-grow">
              <Badge variant="color" colorClass="bg-emerald-50 text-emerald-700 border-emerald-100">
                {comm.type}
              </Badge>
              <h4 className="font-extrabold text-slate-900 text-xs mt-1.5">{comm.name}</h4>
              <p className="text-[10px] text-slate-500 truncate mt-0.5">{comm.areaName}</p>
            </div>

            <button
              onClick={() => onLeaveCommunity(comm.id)}
              className="px-3 py-1.5 border border-red-200 hover:bg-red-50 text-red-600 text-[10px] font-bold rounded-xl transition-all cursor-pointer flex-shrink-0"
            >
              Leave
            </button>
          </div>
        ))}
        {communities.length === 0 && (
          <p className="text-xs text-slate-500 italic col-span-2">You haven't joined any community spaces yet.</p>
        )}
      </div>
    </div>
  );
};

export default CommunitiesTab;
