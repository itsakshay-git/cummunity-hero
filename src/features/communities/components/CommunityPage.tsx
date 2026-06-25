import React, { useState } from 'react';
import { 
  Building2, Users, Award, Shield, CheckCircle2, ChevronLeft, 
  MapPin, Sparkles, Activity, Globe, BookOpen, Settings
} from 'lucide-react';
import { Community, Issue, User, IssueVerification } from '../../../types';
import { getLevelInfo } from '../../feed/utils';

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
  currentUser: User | null;
}

export default function CommunityPage({
  community,
  issues,
  users,
  joinedIds,
  onBack,
  onJoin,
  onLeave,
  onSelectIssue,
  currentUser
}: CommunityPageProps) {
  const [activeSection, setActiveSection] = useState<'feed' | 'members' | 'leaderboard' | 'challenges' | 'insights'>('feed');
  const isJoined = joinedIds.includes(community.id);

  // Filter issues belonging to this community
  const communityIssues = issues.filter(i => i.communityId === community.id);
  const resolvedIssuesCount = communityIssues.filter(i => i.status === 'RESOLVED' || i.status === 'CLOSED').length;
  const resolutionRate = communityIssues.length > 0 
    ? Math.round((resolvedIssuesCount / communityIssues.length) * 100) 
    : 100;

  // Filter users belonging to this community
  const communityMembers = users.filter(u => u.joinedCommunities.includes(community.id));
  const memberCount = communityMembers.length + (isJoined && !communityMembers.some(m => m.id === currentUser?.id) ? 1 : 0);

  // Health qualitative label
  const getHealthLabel = (score: number) => {
    if (score >= 90) return { label: "Excellent Standing", color: "text-emerald-600 bg-emerald-50 border-emerald-200", desc: "Superb civic participation and speedy resolutions." };
    if (score >= 75) return { label: "Good Standing", color: "text-blue-600 bg-blue-50 border-blue-200", desc: "Healthy volunteer involvement with consistent issue tracking." };
    if (score >= 50) return { label: "Average Standing", color: "text-amber-600 bg-amber-50 border-amber-200", desc: "Moderate response times. Needs higher involvement." };
    return { label: "Needs Attention", color: "text-rose-600 bg-rose-50 border-rose-200", desc: "High ratio of open complaints. Cooperation advised." };
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

  // Check if current user is admin/creator of this community
  const isAdmin = currentUser ? (community.adminIds?.includes(currentUser.id) || community.createdBy === currentUser.id) : false;

  // Render static rules checklist
  const groupRules = [
    { title: "Report Real Incidents", desc: "Always upload clear photos and write accurate descriptions of active hazards." },
    { title: "Check for Duplicates", desc: "Before logging a report, check the feed to see if neighbors have already posted it." },
    { title: "Stay Cooperative", desc: "Support and comment constructively on local reports to help resolvers coordinate repairs." },
    { title: "Verify Honestly", desc: "Only verify or flag reports if you have physically audited the spot." }
  ];

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      
      {/* Return header bar */}
      <button 
        onClick={onBack}
        className="flex items-center space-x-1.5 text-xs font-bold text-slate-600 hover:text-emerald-600 transition-colors cursor-pointer border-0 bg-transparent"
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
                <span>{memberCount} Active Members</span>
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
                  className="px-5 py-2.5 bg-emerald-600 text-white font-black rounded-xl text-xs hover:bg-emerald-500 transition-all cursor-pointer shadow border-0"
                >
                  Join Community Space
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Community Section Content (Feed / Members / Leaderboard / Challenges / Insights) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Left/Center Column (2/3 size): Selected Tab View */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tab Selection Row */}
          <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-2xl overflow-x-auto whitespace-nowrap">
            {(['feed', 'members', 'leaderboard', 'challenges', 'insights'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveSection(tab)}
                className={`px-5 py-2.5 rounded-xl text-xs font-black capitalize transition-all cursor-pointer border-0 ${
                  activeSection === tab ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-900 bg-transparent'
                }`}
              >
                {tab === 'feed' ? 'Incident Feed' : tab}
              </button>
            ))}
          </div>

          {/* Tab Render: Feed */}
          {activeSection === 'feed' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-xs font-black text-slate-900">Incident Feed ({communityIssues.length})</span>
                <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider">Community posts</span>
              </div>

              {communityIssues.length === 0 ? (
                <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-500 space-y-3 shadow-sm">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto animate-bounce" />
                  <h4 className="text-sm font-bold text-slate-900">No active incidents!</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">This community workspace has clean streets, functional utilities, and zero active hazards.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {communityIssues.map(issue => (
                    <div 
                      key={issue.id} 
                      onClick={() => onSelectIssue(issue.id)}
                      className="bg-white rounded-3xl border border-slate-200 p-6 hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer shadow-sm flex flex-col md:flex-row gap-5 items-start"
                    >
                      {issue.imageUrl && (
                        <img 
                          src={issue.imageUrl} 
                          alt="" 
                          className="w-full md:w-28 h-28 object-cover rounded-2xl border border-slate-100 bg-slate-50 flex-shrink-0"
                          referrerPolicy="no-referrer"
                        />
                      )}
                      <div className="space-y-2 flex-grow min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-[8px] font-mono font-bold uppercase px-2 py-0.5 rounded ${
                            issue.severity === 'Critical' ? 'bg-red-50 text-red-600 border border-red-150' :
                            issue.severity === 'High' ? 'bg-amber-50 text-amber-600 border border-amber-150' : 'bg-blue-50 text-blue-600 border border-blue-150'
                          }`}>
                            {issue.severity} Severity
                          </span>
                          <span className="bg-slate-100 text-slate-600 text-[8px] font-mono font-bold px-2 py-0.5 rounded border border-slate-200/50">
                            {issue.category}
                          </span>
                          <span className={`text-[8px] font-mono font-bold uppercase px-2 py-0.5 rounded ${
                            issue.status === 'RESOLVED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-150' :
                            issue.status === 'OPEN' ? 'bg-slate-50 text-slate-600 border border-slate-150' : 'bg-blue-50 text-blue-600 border border-blue-150'
                          }`}>
                            {issue.status}
                          </span>
                        </div>
                        <h4 className="font-extrabold text-slate-900 text-sm truncate leading-tight hover:text-emerald-600 transition-colors">
                          {issue.title}
                        </h4>
                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                          {issue.description}
                        </p>
                        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1.5 border-t border-slate-55 font-semibold">
                          <span>Reported by {issue.reportedByName}</span>
                          <span className="font-mono text-emerald-600">{issue.trustScore}% Credibility</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab Render: Members */}
          {activeSection === 'members' && (
            <div className="bg-white p-6 rounded-3xl border border-slate-200 space-y-4 shadow-sm">
              <div>
                <h3 className="font-extrabold text-slate-950 text-base">Active Space Contributors ({memberCount})</h3>
                <p className="text-xs text-slate-500">Every community member who has verified, supported, or logged issues in this space.</p>
              </div>

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
                          <span className="font-extrabold text-slate-955 text-xs block leading-tight">{member.name}</span>
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

          {/* Tab Render: Leaderboard */}
          {activeSection === 'leaderboard' && (
            <div className="bg-white p-6 rounded-3xl border border-slate-200 space-y-4 shadow-sm">
              <div>
                <h3 className="font-extrabold text-slate-955 text-base">Community Contributor Board</h3>
                <p className="text-xs text-slate-500">Neighbors ranked by reputation XP earned purely within {community.name}.</p>
              </div>

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

          {/* Tab Render: Challenges */}
          {activeSection === 'challenges' && (
            <div className="bg-white p-6 rounded-3xl border border-slate-200 space-y-5 shadow-sm">
              <div>
                <h3 className="font-extrabold text-slate-950 text-base">Active Community Challenges</h3>
                <p className="text-xs text-slate-500">Coordinate and pool efforts to satisfy the community level goals.</p>
              </div>

              <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-black text-slate-950 block">Monsoon Drain Audit</span>
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
            </div>
          )}

          {/* Tab Render: Insights */}
          {activeSection === 'insights' && (
            <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 space-y-6 shadow-sm">
              <div>
                <h3 className="font-extrabold text-slate-950 text-base">AI Standing & Locality Insights</h3>
                <p className="text-xs text-slate-500">Smart analysis of complaints and solutions logged in {community.name}.</p>
              </div>

              <div className="space-y-4">
                <div className="p-5 bg-emerald-50/50 border border-emerald-100 rounded-2xl space-y-3">
                  <span className="text-xs font-black text-emerald-900 block flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    Locality Summary Insights
                  </span>
                  <p className="text-xs text-slate-700 leading-relaxed font-sans">
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

        {/* Right Sidebar (1/3 size): Persistent Community Metadata */}
        <div className="space-y-6 lg:sticky lg:top-20">
          
          {/* About this space */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-slate-500" />
              About Group
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed font-sans">
              {community.description}
            </p>
          </div>

          {/* Civic Standing / Health Gauge */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-slate-500" />
              Civic Health Status
            </h4>
            
            <div className="space-y-3.5">
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100/50 flex flex-col gap-1">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-extrabold text-slate-900">Health Score</span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${health.color}`}>
                    {health.label}
                  </span>
                </div>
                <span className="text-[10px] text-slate-500">{health.desc}</span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-center text-xs">
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                  <span className="block text-[8px] font-bold text-slate-400 uppercase">Resolution</span>
                  <span className="font-extrabold text-slate-800 text-sm font-mono">{resolutionRate}%</span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                  <span className="block text-[8px] font-bold text-slate-400 uppercase">Speed</span>
                  <span className="font-extrabold text-slate-800 text-sm font-mono">18.5h</span>
                </div>
              </div>
            </div>
          </div>

          {/* Achievements Show */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-slate-500" />
              Unlocked Achievements
            </h4>
            
            <div className="space-y-3">
              <div className="flex items-start gap-2.5 bg-slate-50/50 p-2.5 border border-slate-150 rounded-xl text-[11px]">
                <Award className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-bold text-slate-800 block">Rapid Resolution</span>
                  <span className="text-[9px] text-slate-500 block leading-tight mt-0.5">Fixed hazards under 24 hours.</span>
                </div>
              </div>
              <div className="flex items-start gap-2.5 bg-slate-50/50 p-2.5 border border-slate-150 rounded-xl text-[11px]">
                <Shield className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-bold text-slate-800 block">Safety First Standing</span>
                  <span className="text-[9px] text-slate-500 block leading-tight mt-0.5">Audited all lighting complaints.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Community Rules */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-slate-500" />
              Community Rules
            </h4>
            
            <div className="space-y-3 text-xs leading-normal">
              {groupRules.map((r, i) => (
                <div key={i} className="flex gap-2">
                  <span className="font-black text-emerald-600 font-mono text-xs">{i+1}.</span>
                  <div>
                    <span className="font-bold text-slate-800 block">{r.title}</span>
                    <span className="text-[10px] text-slate-500 mt-0.5 block leading-tight">{r.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Admin Moderation Console */}
          {isAdmin && (
            <div className="bg-slate-950 text-white p-6 rounded-3xl border border-slate-800 shadow-xl space-y-4">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-teal-400 flex items-center gap-1.5">
                <Settings className="w-4 h-4 text-teal-555 animate-spin" />
                Moderation Console
              </h4>
              
              <div className="space-y-3 text-[11px]">
                <div className="bg-white/5 p-3 rounded-xl border border-white/10 flex items-center justify-between">
                  <div>
                    <span className="font-bold block text-slate-200">Pending Approvals</span>
                    <span className="text-[9px] text-slate-400">0 requests to review</span>
                  </div>
                  <span className="font-mono text-xs text-slate-400 bg-white/10 px-2 py-0.5 rounded font-bold">0</span>
                </div>

                <div className="space-y-2 pt-1.5">
                  <button 
                    type="button"
                    onClick={() => alert('Broadcasting civic alert message to group roster...')}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold rounded-lg transition-colors cursor-pointer border-0"
                  >
                    Broadcast Group Alert
                  </button>
                  <button 
                    type="button"
                    onClick={() => alert('Exporting incidents timeline audits data...')}
                    className="w-full py-2 bg-white/10 hover:bg-white/20 text-slate-200 text-[10px] font-bold rounded-lg transition-colors cursor-pointer border-0"
                  >
                    Export Audits Timeline
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
