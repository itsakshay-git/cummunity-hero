import React, { useState } from 'react';
import { 
  Award, Users, Trophy, Star, ShieldAlert, Sparkles, Zap, Flame, 
  ThumbsUp, CheckCircle, Search, TrendingUp, History, ShieldCheck, Heart 
} from 'lucide-react';
import { User, Community } from '../../../types';
import { getLevelInfo } from '../../feed/utils';

interface LeaderboardProps {
  users: User[];
  communities: Community[];
  currentUser?: User | null;
}

export default function Leaderboard({ users, communities, currentUser }: LeaderboardProps) {
  const [activeLeaderboardTab, setActiveLeaderboardTab] = useState<'citizens' | 'neighborhoods'>('citizens');
  const [citizenFilter, setCitizenFilter] = useState<'all' | 'resolver' | 'citizen'>('all');

  // Sort users by points/reputation descending
  const sortedUsers = [...users].sort((a, b) => b.reputationScore - a.reputationScore);
  
  // Sort communities by health reputation score descending
  const sortedCommunities = [...communities].sort((a, b) => b.reputationScore - a.reputationScore);

  // Find current user's rank
  const currentUserRank = currentUser 
    ? sortedUsers.findIndex(u => u.id === currentUser.id) + 1 
    : 0;

  // Filtered citizens
  const filteredUsers = sortedUsers.filter(u => {
    if (citizenFilter === 'resolver') return u.role === 'Resolver' || u.role === 'Authority';
    if (citizenFilter === 'citizen') return u.role === 'Citizen' || u.role === 'Community Admin';
    return true;
  });

  // Recent simulated activity log to make the app feel extremely interactive and real
  const recentPointsActivities = [
    { id: 1, name: "Priya Sharma", action: "Verified pothole near Aundh High Street", points: 25, time: "4 mins ago", icon: ShieldCheck, color: "text-emerald-600 bg-emerald-50" },
    { id: 2, name: "Akshay Dhongade", action: "Resolved Water Leakage at Block C", points: 150, time: "2 hours ago", icon: Trophy, color: "text-amber-600 bg-amber-50" },
    { id: 3, name: "Rohan Patil", action: "Assigned as Resolver for Garbage Piles", points: 50, time: "5 hours ago", icon: Zap, color: "text-blue-600 bg-blue-50" },
    { id: 4, name: "Suresh Mehta", action: "Validated emergency drainage block", points: 30, time: "1 day ago", icon: Heart, color: "text-rose-600 bg-rose-50" },
  ];

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Hero Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-950 tracking-tight font-sans">
            Civic Honor Roll
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Celebrating high-reputation citizens and leading communities co-auditing our public services.
          </p>
        </div>

        {/* Global Stats Overview */}
        <div className="flex items-center space-x-6 bg-white px-5 py-3 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="text-center">
            <span className="block text-lg font-black text-slate-950 font-mono">
              {users.reduce((acc, u) => acc + u.reputationScore, 0)}
            </span>
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider font-sans">Total District Points</span>
          </div>
          <div className="w-px h-8 bg-slate-200"></div>
          <div className="text-center">
            <span className="block text-lg font-black text-emerald-600 font-mono">
              {communities.length}
            </span>
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider font-sans">Leagues Active</span>
          </div>
        </div>
      </div>

      {/* Current User Standing - Only displays if user has an active profile */}
      {currentUser && (
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200/80 rounded-3xl p-6 relative overflow-hidden shadow-inner flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-100/30 rounded-bl-full pointer-events-none" />
          
          <div className="flex items-center space-x-4 relative z-10">
            <div className="relative">
              <img 
                src={currentUser.photoUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(currentUser.id)}`} 
                alt={currentUser.name} 
                className="w-14 h-14 rounded-2xl object-cover border-2 border-emerald-600 shadow-md bg-white"
                referrerPolicy="no-referrer"
              />
              <span className="absolute -bottom-1 -right-1 bg-emerald-600 text-white font-mono text-[9px] w-5 h-5 rounded-full flex items-center justify-center font-bold border-2 border-white">
                {getLevelInfo(currentUser.reputationScore).level}
              </span>
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-slate-950 text-base">{currentUser.name}</h3>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${getLevelInfo(currentUser.reputationScore).color}`}>
                  {getLevelInfo(currentUser.reputationScore).title}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium flex items-center gap-1">
                <Award className="w-3.5 h-3.5 text-emerald-600" />
                <span>Ranked #{currentUserRank} out of {users.length} active civic auditors in district</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 md:gap-8 relative z-10 bg-white/60 backdrop-blur-sm p-4 rounded-2xl border border-emerald-100/50">
            <div className="text-center px-2">
              <span className="block text-lg font-black text-slate-950 font-mono">{currentUser.reputationScore}</span>
              <span className="text-[8px] text-slate-400 font-extrabold uppercase tracking-widest font-sans">Reputation</span>
            </div>
            <div className="w-px bg-emerald-200/50 hidden sm:block"></div>
            <div className="text-center px-2">
              <span className="block text-lg font-black text-slate-950 font-mono">{currentUser.reportsCreated}</span>
              <span className="text-[8px] text-slate-400 font-extrabold uppercase tracking-widest font-sans">Created</span>
            </div>
            <div className="w-px bg-emerald-200/50 hidden sm:block"></div>
            <div className="text-center px-2">
              <span className="block text-lg font-black text-slate-950 font-mono">{currentUser.reportsVerified}</span>
              <span className="text-[8px] text-slate-400 font-extrabold uppercase tracking-widest font-sans">Verified</span>
            </div>
            <div className="w-px bg-emerald-200/50 hidden sm:block"></div>
            <div className="text-center px-2">
              <span className="block text-lg font-black text-slate-950 font-mono">{currentUser.reportsResolved}</span>
              <span className="text-[8px] text-slate-400 font-extrabold uppercase tracking-widest font-sans">Resolved</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Leaderboard & Feed Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Columns: Main Leaderboard Leagues */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
          {/* Leagues Tabs */}
          <div className="flex border-b border-slate-200/80 bg-slate-50 p-2 gap-1">
            <button
              onClick={() => setActiveLeaderboardTab('citizens')}
              className={`flex-1 py-3 px-4 rounded-2xl text-xs font-black transition-all cursor-pointer flex items-center justify-center space-x-2 ${
                activeLeaderboardTab === 'citizens' 
                  ? 'bg-white text-slate-950 shadow-sm border border-slate-200/40' 
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/60'
              }`}
            >
              <Trophy className={`w-4 h-4 ${activeLeaderboardTab === 'citizens' ? 'text-amber-500 animate-bounce' : 'text-slate-400'}`} />
              <span>Citizen Champion League</span>
            </button>
            <button
              onClick={() => setActiveLeaderboardTab('neighborhoods')}
              className={`flex-1 py-3 px-4 rounded-2xl text-xs font-black transition-all cursor-pointer flex items-center justify-center space-x-2 ${
                activeLeaderboardTab === 'neighborhoods' 
                  ? 'bg-white text-slate-950 shadow-sm border border-slate-200/40' 
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/60'
              }`}
            >
              <Users className={`w-4 h-4 ${activeLeaderboardTab === 'neighborhoods' ? 'text-emerald-500' : 'text-slate-400'}`} />
              <span>Neighborhood Scoreboard</span>
            </button>
          </div>

          <div className="p-6 space-y-6">
            
            {/* Citizen filters */}
            {activeLeaderboardTab === 'citizens' && (
              <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200/60">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">Focus Segment:</span>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => setCitizenFilter('all')}
                    className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all cursor-pointer ${
                      citizenFilter === 'all' ? 'bg-slate-900 text-white shadow' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    All Heroes
                  </button>
                  <button
                    onClick={() => setCitizenFilter('citizen')}
                    className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all cursor-pointer ${
                      citizenFilter === 'citizen' ? 'bg-slate-900 text-white shadow' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Citizens & Admins
                  </button>
                  <button
                    onClick={() => setCitizenFilter('resolver')}
                    className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all cursor-pointer ${
                      citizenFilter === 'resolver' ? 'bg-slate-900 text-white shadow' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Resolvers & City Staff
                  </button>
                </div>
              </div>
            )}

            {/* List */}
            <div className="space-y-3.5">
              {activeLeaderboardTab === 'citizens' ? (
                filteredUsers.map((user, index) => {
                  const levelInfo = getLevelInfo(user.reputationScore);
                  const isLoggedUser = currentUser && user.id === currentUser.id;
                  
                  return (
                    <div 
                      key={user.id} 
                      className={`flex items-center justify-between p-4 rounded-2xl transition-all border ${
                        isLoggedUser 
                          ? 'bg-emerald-50/50 border-emerald-200/60 ring-1 ring-emerald-100' 
                          : 'bg-white hover:bg-slate-50 border-slate-150'
                      }`}
                    >
                      <div className="flex items-center space-x-3.5">
                        {/* Custom rank tag */}
                        <div className="relative">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-mono text-xs font-black shadow-sm ${
                            index === 0 ? 'bg-gradient-to-br from-amber-300 to-yellow-500 text-white' :
                            index === 1 ? 'bg-slate-300 text-slate-900' :
                            index === 2 ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-500'
                          }`}>
                            {index + 1}
                          </div>
                        </div>

                        {/* Profile Image */}
                        <img 
                          src={user.photoUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(user.id)}`} 
                          alt={user.name} 
                          className="w-10 h-10 rounded-xl object-cover border border-slate-200"
                          referrerPolicy="no-referrer"
                        />

                        {/* Name and role info */}
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-extrabold text-slate-900 text-sm">{user.name}</span>
                            {isLoggedUser && (
                              <span className="text-[8px] bg-emerald-600 text-white font-black uppercase px-1.5 py-0.5 rounded">You</span>
                            )}
                          </div>
                          <div className="flex items-center space-x-2 mt-0.5">
                            <span className="text-[9px] text-slate-400 font-mono font-bold tracking-wider uppercase">{user.role}</span>
                            <span className="text-slate-300 text-xs">•</span>
                            <span className="text-[9px] text-emerald-600 font-semibold">{levelInfo.title}</span>
                          </div>
                        </div>
                      </div>

                      {/* Points / Reputation Display */}
                      <div className="text-right flex items-center gap-4">
                        <div className="hidden sm:block text-right">
                          <span className="block text-[10px] font-bold text-slate-700">Level {levelInfo.level}</span>
                          <span className="text-[9px] text-slate-400">{user.reportsVerified + user.reportsCreated} actions completed</span>
                        </div>
                        <div className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100/50 text-center min-w-[70px]">
                          <span className="block text-xs font-black font-mono leading-none">{user.reputationScore}</span>
                          <span className="text-[8px] font-mono text-emerald-600 font-bold tracking-widest block mt-0.5">REPUTATION</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                sortedCommunities.map((community, index) => {
                  const resRate = community.totalIssues > 0 
                    ? Math.round((community.resolvedIssues / community.totalIssues) * 100) 
                    : 100;
                    
                  return (
                    <div 
                      key={community.id} 
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white hover:bg-slate-50 border border-slate-150 rounded-2xl transition-all gap-4"
                    >
                      <div className="flex items-center space-x-3.5">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-mono text-xs font-black shadow-sm ${
                          index === 0 ? 'bg-emerald-600 text-white' :
                          index === 1 ? 'bg-slate-300 text-slate-900' :
                          index === 2 ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {index + 1}
                        </div>

                        <div>
                          <span className="font-extrabold text-slate-950 text-sm block leading-tight">{community.name}</span>
                          <span className="text-[10px] text-slate-400 mt-1 block">
                            {community.areaName} • <span className="font-semibold text-slate-500">{community.type}</span>
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-6 border-t sm:border-t-0 pt-2.5 sm:pt-0">
                        <div className="text-left sm:text-right space-y-0.5">
                          <span className="block text-[10px] font-bold text-slate-700">Resolution Efficiency</span>
                          <div className="flex items-center gap-1.5">
                            <div className="w-16 bg-slate-150 h-1 rounded-full overflow-hidden">
                              <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${resRate}%` }} />
                            </div>
                            <span className="text-[10px] font-mono font-bold text-slate-500">{resRate}%</span>
                          </div>
                        </div>

                        <div className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100/50 text-center min-w-[70px]">
                          <span className="block text-xs font-black font-mono leading-none">{community.reputationScore}%</span>
                          <span className="text-[8px] font-mono text-emerald-600 font-bold tracking-widest block mt-0.5">HEALTH INDEX</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

          </div>
        </div>

        {/* Right 1 Column: Immersive Points Stream Activity Feed */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
              <History className="w-4 h-4 text-emerald-600" />
              <h3 className="font-extrabold text-slate-950 text-sm">Points Audit Stream</h3>
            </div>

            <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
              Live feedback log of reputation awards distributed to neighborhood auditors.
            </p>

            <div className="space-y-4">
              {recentPointsActivities.map(act => {
                const ActIcon = act.icon;
                return (
                  <div key={act.id} className="flex items-start space-x-3 text-xs leading-normal">
                    <div className={`p-2 rounded-xl mt-0.5 ${act.color}`}>
                      <ActIcon className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-grow space-y-0.5">
                      <p className="text-slate-800 font-semibold">{act.name}</p>
                      <p className="text-slate-500 text-[10px]">{act.action}</p>
                      <span className="text-[9px] text-slate-400 font-mono block">{act.time}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-emerald-600 font-black font-mono">+{act.points}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Gamified Rank Milestone Cards */}
          <div className="bg-gradient-to-br from-slate-900 to-emerald-950 text-white p-5 rounded-3xl border border-slate-800/80 shadow relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/10 rounded-bl-full" />
            <h4 className="text-xs font-black text-emerald-400 font-mono tracking-widest uppercase mb-1">Civic Levels</h4>
            <h3 className="font-bold text-sm text-white mb-3">Earn Points & Help Local Areas</h3>
            <ul className="space-y-2 text-[10px] text-slate-300 font-medium leading-relaxed">
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></span>
                <span><strong>+50 Rep Points</strong>: Create a new incident report</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></span>
                <span><strong>+15 Rep Points</strong>: Cast a verification vote</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></span>
                <span><strong>+150 Rep Points</strong>: Mark public issue resolved</span>
              </li>
            </ul>
          </div>
        </div>

      </div>
    </div>
  );
}
