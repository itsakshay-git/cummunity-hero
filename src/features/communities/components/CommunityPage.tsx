import React, { useState } from 'react';
import { 
  Building2, Users, Award, Shield, CheckCircle2, ChevronLeft, 
  MapPin, Heart, Plus, Sparkles, MessageSquare, AlertTriangle, 
  Check, ArrowRight, TrendingUp, Info, HelpCircle, Activity
} from 'lucide-react';
import { Community, Issue, User, IssueVerification } from '../../../types';
import { getLevelInfo, getUserBadges } from '../../feed/utils';

interface CommunityPageProps {
  community: Community;
  issues: Issue[];
  users: User[];
  joinedIds: string[];
  verifications: IssueVerification[];
  onBack: () => void;
  onJoin: (id: string) => void;
  onLeave: (id: string) => void;
  onSelectIssue: (id: string) => void;
}

export default function CommunityPage({
  community,
  issues,
  users,
  joinedIds,
  verifications,
  onBack,
  onJoin,
  onLeave,
  onSelectIssue
}: CommunityPageProps) {
  const [activeSection, setActiveSection] = useState<'overview' | 'issues' | 'members' | 'achievements' | 'leaderboard' | 'challenges' | 'insights'>('overview');
  const isJoined = joinedIds.includes(community.id);

  // Filter issues belonging to this community
  const communityIssues = issues.filter(i => i.communityId === community.id);
  const resolvedIssuesCount = communityIssues.filter(i => i.status === 'RESOLVED' || i.status === 'CLOSED').length;
  const resolutionRate = communityIssues.length > 0 
    ? Math.round((resolvedIssuesCount / communityIssues.length) * 100) 
    : 100;

  // Filter users belonging to this community (joined list)
  const communityMembers = users.filter(u => u.joinedCommunities.includes(community.id));

  // Determine qualitative label for community health score
  const getHealthLabel = (score: number) => {
    if (score >= 90) return { label: "Excellent Standing", color: "text-emerald-600 bg-emerald-50 border-emerald-200", desc: "Superb civic participation, instant verifications, and speedy resolutions." };
    if (score >= 75) return { label: "Good Standing", color: "text-blue-600 bg-blue-50 border-blue-200", desc: "Healthy volunteer involvement with consistent issue tracking and resolution." };
    if (score >= 50) return { label: "Average Standing", color: "text-amber-600 bg-amber-50 border-amber-200", desc: "Moderate response times. Needs higher verification involvement." };
    return { label: "Needs Attention", color: "text-rose-600 bg-rose-50 border-rose-200", desc: "High ratio of open or stale complaints. Local authority coordination advised." };
  };

  const health = getHealthLabel(community.reputationScore);

  // Cover image illustration select based on community type
  const getCoverImage = (type: string) => {
    switch (type) {
      case 'Housing Society':
        return 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80';
      case 'Campus':
        return 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=1200&q=80';
      case 'Ward':
        return 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=1200&q=80';
      default:
        return 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=1200&q=80';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      
      {/* Return header bar */}
      <button 
        onClick={onBack}
        className="flex items-center space-x-1.5 text-xs font-bold text-slate-600 hover:text-emerald-600 transition-colors cursor-pointer"
      >
        <ChevronLeft className="w-4 h-4" />
        <span>Return to Community Directory</span>
      </button>

      {/* Community Cover & Header */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Cover Graphic */}
        <div className="h-44 md:h-64 relative bg-slate-100 overflow-hidden">
          <img 
            src={getCoverImage(community.type)} 
            alt={community.name} 
            className="w-full h-full object-cover opacity-90"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />
          
          <div className="absolute bottom-6 left-6 md:left-8 flex flex-col md:flex-row md:items-end justify-between right-6 gap-4">
            <div className="space-y-1.5 text-white">
              <span className="inline-block bg-emerald-600 text-white text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full font-bold">
                {community.type}
              </span>
              <h1 className="text-xl md:text-3xl font-black font-sans tracking-tight leading-none text-white">
                {community.name}
              </h1>
              <div className="flex items-center gap-3 text-xs text-slate-200 font-medium">
                <div className="flex items-center space-x-1">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{community.areaName}</span>
                </div>
                <span>•</span>
                <span>{communityMembers.length + (isJoined && !communityMembers.some(m => m.id === 'user_1') ? 1 : 0)} Active Members</span>
              </div>
            </div>

            {/* Toggle Membership */}
            <div>
              {isJoined ? (
                <button
                  onClick={() => onLeave(community.id)}
                  className="px-4 py-2 bg-slate-900/40 backdrop-blur border border-white/20 text-white font-bold rounded-xl text-xs hover:bg-rose-600 hover:border-rose-600 transition-all cursor-pointer shadow"
                >
                  Joined Space (Leave)
                </button>
              ) : (
                <button
                  onClick={() => onJoin(community.id)}
                  className="px-5 py-2.5 bg-emerald-600 text-white font-black rounded-xl text-xs hover:bg-emerald-500 transition-all cursor-pointer shadow"
                >
                  Join Community Space
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Community Vital Stats cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 border-t border-slate-100 text-slate-600 text-xs">
          <div className="p-5 border-r border-b md:border-b-0 border-slate-150 space-y-1.5 bg-slate-50/50">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-sans block">Community Health</span>
            <div className="flex items-baseline space-x-2">
              <span className="text-xl md:text-2xl font-black text-slate-900 font-mono">{community.reputationScore}%</span>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${health.color}`}>{health.label}</span>
            </div>
          </div>

          <div className="p-5 border-r border-b md:border-b-0 border-slate-150 space-y-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-sans block">Resolution Speed</span>
            <div className="flex items-baseline space-x-2">
              <span className="text-xl md:text-2xl font-black text-slate-900 font-mono">18.5 hrs</span>
              <span className="text-[10px] text-emerald-600 font-bold">Excellent Response</span>
            </div>
          </div>

          <div className="p-5 border-r border-b md:border-b-0 border-slate-150 space-y-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-sans block">Resolution Rate</span>
            <div className="flex items-baseline space-x-2">
              <span className="text-xl md:text-2xl font-black text-slate-900 font-mono">{resolutionRate}%</span>
              <span className="text-[10px] text-slate-400">({resolvedIssuesCount}/{communityIssues.length} solved)</span>
            </div>
          </div>

          <div className="p-5 space-y-1.5 bg-emerald-50/20">
            <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider font-sans block">Active Standing</span>
            <div className="flex items-baseline space-x-2">
              <span className="text-xl md:text-2xl font-black text-emerald-700 font-mono">Level {community.reputationScore >= 85 ? 4 : 3}</span>
              <span className="text-[10px] text-emerald-800 font-semibold">Civic Leadership</span>
            </div>
          </div>
        </div>
      </div>

      {/* Community Sections Tabs */}
      <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-2xl overflow-x-auto whitespace-nowrap">
        {(['overview', 'issues', 'members', 'achievements', 'leaderboard', 'challenges', 'insights'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveSection(tab)}
            className={`px-4 py-2.5 rounded-xl text-xs font-black capitalize transition-all cursor-pointer ${
              activeSection === tab ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Conditional Section Contents */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Side Canvas Details (2/3 size) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Section: Overview */}
          {activeSection === 'overview' && (
            <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 space-y-6 shadow-sm">
              <div className="space-y-2">
                <h3 className="font-extrabold text-slate-950 text-base">About this Space</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {community.description}
                </p>
              </div>

              <div className="border-t border-slate-100 pt-6 space-y-4">
                <h4 className="font-extrabold text-slate-950 text-xs uppercase tracking-wider text-slate-400">Health Breakdown Explanation</h4>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-start gap-3">
                  <Activity className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-slate-600 leading-relaxed">
                    This space has a health status score of <strong>{community.reputationScore}%</strong>. {health.desc} Citizens have been extremely proactive in reporting incidents and verifying resolution certificates.
                  </p>
                </div>
              </div>

              {/* Action items summary */}
              <div className="border-t border-slate-100 pt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 border border-slate-150 rounded-2xl space-y-2">
                  <span className="block text-xs font-black text-slate-900">Active Incidents ({communityIssues.length - resolvedIssuesCount})</span>
                  <span className="text-[11px] text-slate-500 block leading-relaxed">Unresolved plumbing, road structural, waste mismanagement or streetlight black spots in this area.</span>
                </div>
                <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl space-y-2">
                  <span className="block text-xs font-black text-emerald-800">Community Leaderboard Summary</span>
                  <span className="text-[11px] text-emerald-700 block leading-relaxed">Compare contributions and standings of fellow neighbors within {community.name} space.</span>
                </div>
              </div>
            </div>
          )}

          {/* Section: Issues */}
          {activeSection === 'issues' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200">
                <span className="text-xs font-black text-slate-900">Incident Stream ({communityIssues.length})</span>
                <span className="text-[11px] text-slate-400 font-mono">Real-time reports</span>
              </div>

              {communityIssues.length === 0 ? (
                <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-500 space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-sm font-bold">No issues logged yet!</p>
                  <p className="text-xs text-slate-400">This community space has clean, functional streets.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {communityIssues.map(issue => (
                    <div 
                      key={issue.id} 
                      onClick={() => onSelectIssue(issue.id)}
                      className="bg-white rounded-2xl border border-slate-200 p-5 hover:border-emerald-600 transition-all cursor-pointer shadow-sm flex flex-col md:flex-row gap-4 items-start"
                    >
                      {issue.imageUrl && (
                        <img 
                          src={issue.imageUrl} 
                          alt="" 
                          className="w-full md:w-24 h-24 object-cover rounded-xl border border-slate-100 bg-slate-50 flex-shrink-0"
                          referrerPolicy="no-referrer"
                        />
                      )}
                      <div className="space-y-2 flex-grow min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-[8px] font-mono font-bold uppercase px-2 py-0.5 rounded ${
                            issue.severity === 'Critical' ? 'bg-red-50 text-red-600' :
                            issue.severity === 'High' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'
                          }`}>
                            {issue.severity} Severity
                          </span>
                          <span className="bg-slate-100 text-slate-600 text-[8px] font-mono font-bold px-2 py-0.5 rounded">
                            {issue.category}
                          </span>
                        </div>
                        <h4 className="font-extrabold text-slate-900 text-sm truncate leading-tight hover:text-emerald-600 transition-colors">
                          {issue.title}
                        </h4>
                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                          {issue.description}
                        </p>
                        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 font-semibold">
                          <span>Reported by {issue.reportedByName}</span>
                          <span className="font-mono text-emerald-600">{issue.trustScore}% Trust Score</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Section: Members */}
          {activeSection === 'members' && (
            <div className="bg-white p-6 rounded-3xl border border-slate-200 space-y-4 shadow-sm">
              <h3 className="font-extrabold text-slate-950 text-base">Active Space Contributors ({communityMembers.length})</h3>
              <p className="text-xs text-slate-500">Every community member who has verified, supported, or logged issues in this space.</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                {communityMembers.map(member => {
                  const level = getLevelInfo(member.reputationScore);
                  return (
                    <div key={member.id} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between shadow-inner">
                      <div className="flex items-center space-x-3">
                        <img 
                          src={member.photoUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(member.id)}`} 
                          alt={member.name} 
                          className="w-9 h-9 rounded-xl border border-slate-200 bg-white"
                          referrerPolicy="no-referrer"
                        />
                        <div>
                          <span className="font-extrabold text-slate-950 text-xs block leading-tight">{member.name}</span>
                          <span className={`text-[8px] font-mono font-black px-1.5 py-0.5 rounded mt-1.5 inline-block ${level.color}`}>
                            Lvl {level.level} {level.title}
                          </span>
                        </div>
                      </div>
                      <span className="font-mono text-xs text-slate-400 font-bold">{member.reputationScore} XP</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Section: Achievements */}
          {activeSection === 'achievements' && (
            <div className="bg-white p-6 rounded-3xl border border-slate-200 space-y-6 shadow-sm">
              <div className="space-y-1">
                <h3 className="font-extrabold text-slate-950 text-base">Community Achievements & Milestones</h3>
                <p className="text-xs text-slate-500">Earn recognition badge milestones for high cooperative participation.</p>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-emerald-50/50 border border-emerald-200/60 rounded-2xl flex items-start gap-3.5">
                  <div className="p-2.5 bg-emerald-600 text-white rounded-xl">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="block text-xs font-black text-slate-900">Rapid Resolution Badge (Unlocked)</span>
                    <span className="text-[11px] text-slate-600 block leading-relaxed mt-0.5">Resolved water leakage and pothole hazards with an average speed under 24 hours. Unlocked June 2026.</span>
                  </div>
                </div>

                <div className="p-4 bg-indigo-50/50 border border-indigo-200/60 rounded-2xl flex items-start gap-3.5">
                  <div className="p-2.5 bg-indigo-600 text-white rounded-xl">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="block text-xs font-black text-slate-900">Safety First Status (Unlocked)</span>
                    <span className="text-[11px] text-slate-600 block leading-relaxed mt-0.5">Successfully audited and closed all streetlight malfunction complaints during safety weeks. Unlocked May 2026.</span>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-start gap-3.5 opacity-60">
                  <div className="p-2.5 bg-slate-400 text-white rounded-xl">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="block text-xs font-black text-slate-900">Carbon Neutral Pioneers (Locked)</span>
                    <span className="text-[11px] text-slate-600 block leading-relaxed mt-0.5">Reach 100 resolved garbage mismanagement reports in cooperation with Municipal Waste authorities to unlock. Progress: 38/100.</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Section: Leaderboard */}
          {activeSection === 'leaderboard' && (
            <div className="bg-white p-6 rounded-3xl border border-slate-200 space-y-4 shadow-sm">
              <h3 className="font-extrabold text-slate-950 text-base">Community Contributor Board</h3>
              <p className="text-xs text-slate-500">Neighbors ranked by reputation XP earned purely within {community.name}.</p>

              <div className="space-y-2.5 pt-2">
                {communityMembers
                  .sort((a,b) => b.reputationScore - a.reputationScore)
                  .map((member, i) => {
                    const level = getLevelInfo(member.reputationScore);
                    return (
                      <div key={member.id} className="p-3.5 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <span className="text-slate-400 font-mono font-bold text-xs">#{i+1}</span>
                          <img 
                            src={member.photoUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(member.id)}`} 
                            alt={member.name} 
                            className="w-8 h-8 rounded-lg object-cover"
                            referrerPolicy="no-referrer"
                          />
                          <div>
                            <span className="font-black text-slate-900 text-xs block leading-none">{member.name}</span>
                            <span className="text-[9px] text-slate-400 font-semibold">{level.title}</span>
                          </div>
                        </div>
                        <span className="font-mono text-xs font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                          {member.reputationScore} XP
                        </span>
                      </div>
                    );
                })}
              </div>
            </div>
          )}

          {/* Section: Challenges */}
          {activeSection === 'challenges' && (
            <div className="bg-white p-6 rounded-3xl border border-slate-200 space-y-5 shadow-sm">
              <div className="space-y-1">
                <h3 className="font-extrabold text-slate-950 text-base">Active Community Challenges</h3>
                <p className="text-xs text-slate-500">Coordinate and pool efforts to satisfy the community level goals.</p>
              </div>

              <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-black text-slate-950 block">Auditing Monsoon Drains</span>
                  <span className="text-[9px] font-mono bg-emerald-600 text-white px-2 py-0.5 rounded font-bold">Active</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Log at least 3 drainage blockage complaints prior to monsoons. This guarantees priority allocation from Municipal Engineering division.
                </p>
                <div className="space-y-1.5 pt-2">
                  <div className="flex justify-between text-[10px] font-bold text-slate-500">
                    <span>Community Progress: 2/3 Logged</span>
                    <span>66%</span>
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-600 h-full rounded-full" style={{ width: '66%' }} />
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-black text-slate-950 block">Streetlight Safety Audits</span>
                  <span className="text-[9px] font-mono bg-slate-400 text-slate-700 px-2 py-0.5 rounded font-bold">Completed</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Submit night safety logs. Streetlight complaints audit completely satisfied. Earned +200 Community XP!
                </p>
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-slate-400 h-full rounded-full" style={{ width: '100%' }} />
                </div>
              </div>
            </div>
          )}

          {/* Section: Insights */}
          {activeSection === 'insights' && (
            <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 space-y-6 shadow-sm">
              <div className="space-y-1">
                <h3 className="font-extrabold text-slate-950 text-base">AI Community Standings & Insights</h3>
                <p className="text-xs text-slate-500">Smart analysis of complaints and solutions logged in {community.name}.</p>
              </div>

              <div className="space-y-4">
                <div className="p-5 bg-emerald-50/50 border border-emerald-100 rounded-2xl space-y-3">
                  <span className="text-xs font-black text-emerald-900 block flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    Locality Summary Insights
                  </span>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    "This community is performing in the <strong>top 10%</strong> across the district. There is incredible citizen verification responsiveness, which helps prevent authority response fatigue. However, there is a minor spike in plumbing complaints near Block B which suggests aging regional water connections."
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 border border-slate-150 rounded-2xl space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Frequent Category</span>
                    <span className="font-extrabold text-slate-900 text-sm">Water Leakages</span>
                  </div>
                  <div className="p-4 bg-slate-50 border border-slate-150 rounded-2xl space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Authority Responsiveness</span>
                    <span className="font-extrabold text-slate-900 text-sm">Excellent (~12 hours)</span>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Right Side Panel Widgets (1/3 size) */}
        <div className="space-y-6">
          
          {/* Quick Metrics */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-black text-slate-950 text-xs uppercase tracking-wider text-slate-400">Locality Standing</h3>
            
            <div className="space-y-3 text-xs font-medium text-slate-600">
              <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl">
                <span>District Rank</span>
                <span className="font-bold text-slate-900">#2 across Pune</span>
              </div>
              <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl">
                <span>Total Actions</span>
                <span className="font-bold text-slate-900">{communityIssues.length} filed</span>
              </div>
              <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl">
                <span>Verification Rate</span>
                <span className="font-bold text-emerald-600">94.8% responsive</span>
              </div>
            </div>
          </div>

          {/* Founder info */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-black text-slate-950 text-xs uppercase tracking-wider text-slate-400">Founder & Admins</h3>
            
            <div className="flex items-center space-x-3.5">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 font-bold border border-slate-200">
                <Building2 className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <span className="font-bold text-slate-900 text-xs block leading-tight">Admin Console</span>
                <span className="text-[10px] text-slate-400 font-mono">Governed by founder</span>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
