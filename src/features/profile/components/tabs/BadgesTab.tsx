import React from 'react';
import { Check } from 'lucide-react';
import { ALL_BADGES } from '../../../../lib/constants';

interface BadgesTabProps {
  userBadges: any[];
}

export const BadgesTab: React.FC<BadgesTabProps> = ({ userBadges }) => {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">Achievement Badges Showcase</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {ALL_BADGES.map(badge => {
          const BadgeIcon = badge.icon;
          const isUnlocked = userBadges.some(b => b.id === badge.id);
          return (
            <div 
              key={badge.id}
              className={`p-4 rounded-xl border flex items-start gap-3 transition-all ${
                isUnlocked 
                  ? 'bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-900/60 border-slate-200/60 dark:border-slate-800/80 shadow-sm' 
                  : 'bg-slate-50/50 dark:bg-slate-950/10 border-slate-200 dark:border-slate-800 opacity-60'
              }`}
            >
              <div className={`p-2.5 rounded-xl ${isUnlocked ? badge.color : 'bg-slate-205 dark:bg-slate-800 text-slate-400 dark:text-slate-505'}`}>
                <BadgeIcon className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1">
                  <h4 className="font-extrabold text-slate-900 dark:text-slate-100 text-xs truncate">{badge.name}</h4>
                  {isUnlocked && <Check className="w-3 h-3 text-emerald-600" />}
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-snug mt-1">{badge.desc}</p>
                <span className={`text-[8px] font-black uppercase font-mono tracking-wider block mt-2 ${
                  isUnlocked ? 'text-emerald-600 font-bold' : 'text-slate-400 dark:text-slate-500 font-medium'
                }`}>
                  {isUnlocked ? 'Unlocked' : 'Locked'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BadgesTab;
