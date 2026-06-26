import React, { useState } from 'react';
import { 
  Building2, Users, Award, Shield, CheckCircle2, ChevronLeft, 
  MapPin, Sparkles, Activity, Globe, BookOpen, Settings, Lock
} from 'lucide-react';
import { Community, Issue, User, IssueVerification } from '../../../types';
import { getLevelInfo } from '../../feed/utils';
import { generateCommunityInsights } from '../../../services/ai/geminiService';
import Badge from '../../../components/ui/Badge';
import { getDistanceMeters } from '../../../lib/geoUtils';

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
  onUpdateCommunityDetails?: (communityId: string, updates: Partial<Community>) => Promise<void>;
  onApproveMember?: (communityId: string, memberId: string) => Promise<void>;
  onRejectMember?: (communityId: string, memberId: string) => Promise<void>;
  onRemoveMember?: (communityId: string, memberId: string) => Promise<void>;
  onUpdateMemberRole?: (communityId: string, memberId: string, role: 'ADMIN' | 'MEMBER') => Promise<void>;
  onViewUserProfile: (userId: string) => void;
  userCoords?: { lat: number; lng: number } | null;
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
  currentUser,
  onUpdateCommunityDetails,
  onApproveMember,
  onRejectMember,
  onRemoveMember,
  onUpdateMemberRole,
  onViewUserProfile,
  userCoords
}: CommunityPageProps) {
  const [activeSection, setActiveSection] = useState<'feed' | 'members' | 'leaderboard' | 'challenges' | 'insights' | 'moderation'>('feed');
  const isJoined = joinedIds.includes(community.id);

  const [loadingInsights, setLoadingInsights] = useState(false);
  const [insights, setInsights] = useState<{
    summary: string;
    frequentCategory: string;
    responsiveness: string;
  } | null>(null);

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
    if (score >= 90) return { label: "Excellent Standing", color: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/30", desc: "Superb civic participation and speedy resolutions." };
    if (score >= 75) return { label: "Good Standing", color: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/30", desc: "Healthy volunteer involvement with consistent issue tracking." };
    if (score >= 50) return { label: "Average Standing", color: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/30", desc: "Moderate response times. Needs higher involvement." };
    return { label: "Needs Attention", color: "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/30", desc: "High ratio of open complaints. Cooperation advised." };
  };

  const health = getHealthLabel(community.reputationScore);

  React.useEffect(() => {
    if (activeSection === 'insights') {
      if (community.aiInsights) {
        try {
          const parsed = JSON.parse(community.aiInsights);
          setInsights(parsed);
        } catch (e) {
          setInsights({
            summary: community.aiInsights,
            frequentCategory: communityIssues.length > 0 ? communityIssues[0].category : 'Other',
            responsiveness: resolutionRate > 50 ? 'Excellent (~12 hours)' : 'Average (~24 hours)'
          });
        }
      } else {
        const fetchInsights = async () => {
          setLoadingInsights(true);
          try {
            const result = await generateCommunityInsights(community.name, communityIssues);
            setInsights(result);
            if (onUpdateCommunityDetails) {
              await onUpdateCommunityDetails(community.id, {
                aiInsights: JSON.stringify(result)
              });
            }
          } catch (err) {
            console.error("Failed to generate community AI insights:", err);
          } finally {
            setLoadingInsights(false);
          }
        };
        fetchInsights();
      }
    }
  }, [activeSection, community.aiInsights, community.id]);

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
        className="flex items-center space-x-1.5 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-450 transition-colors cursor-pointer border-0 bg-transparent"
      >
        <ChevronLeft className="w-4 h-4" />
        <span>Return to Community Directory</span>
      </button>

      {/* Community Cover & Header */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {/* Cover Graphic */}
        <div className="h-44 md:h-64 relative bg-slate-100 dark:bg-slate-950 overflow-hidden">
          <img 
            src={community.coverImageUrl || getCoverImage(community.type)} 
            alt={community.name} 
            className="w-full h-full object-cover opacity-90"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />
        </div>

        {/* Profile/Community Details Overlay */}
        <div className="px-6 md:px-8 pb-6 relative flex flex-col md:flex-row md:items-end justify-between -mt-16 md:-mt-20 gap-6 z-10">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-4 text-center md:text-left">
            <div className="relative">
              <img 
                src={community.logoUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(community.name)}`} 
                alt={community.name} 
                className="w-24 h-24 md:w-32 md:h-32 rounded-2xl object-cover border-4 border-white dark:border-slate-900 shadow-xl bg-slate-50 dark:bg-slate-800"
                referrerPolicy="no-referrer"
              />
            </div>

            <div className="mb-2 space-y-1.5">
              <div className="flex items-center justify-center md:justify-start gap-2 flex-wrap">
                <span className="inline-block bg-emerald-600 text-white text-[9px] font-mono uppercase px-2.5 py-0.5 rounded-full font-bold">
                  {community.type}
                </span>
                <span className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-350 text-[9px] font-mono uppercase px-2.5 py-0.5 rounded-full font-bold">
                  {community.privacy === 'PRIVATE' ? <Lock className="w-2.5 h-2.5" /> : <Globe className="w-2.5 h-2.5" />}
                  {community.privacy || 'PUBLIC'}
                </span>
              </div>
              
              <h1 className="text-xl md:text-3xl font-black font-sans tracking-tight leading-none text-slate-900 dark:text-slate-100">
                {community.name}
              </h1>

              <div className="flex items-center justify-center md:justify-start gap-2.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
                <div className="flex items-center space-x-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{community.areaName}</span>
                </div>
                <span>•</span>
                <span>{memberCount} Active Members</span>
                
                {(() => {
                  if (!userCoords) return null;
                  const distanceMeters = getDistanceMeters(
                    userCoords.lat,
                    userCoords.lng,
                    community.latitude,
                    community.longitude
                  );
                  const distanceStr = distanceMeters > 1000 
                    ? `${(distanceMeters / 1000).toFixed(1)} km away` 
                    : `${Math.round(distanceMeters)}m away`;
                  return (
                    <>
                      <span>•</span>
                      <span className="text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1">
                        📍 {distanceStr}
                      </span>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* Toggle Membership */}
          <div className="mb-2">
            {isJoined ? (
              <button
                onClick={() => onLeave(community.id)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-rose-600 hover:text-white dark:hover:bg-rose-650 hover:border-rose-600 transition-all border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs cursor-pointer shadow-sm"
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

      {/* Community Section Content (Feed / Members / Leaderboard / Challenges / Insights) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Left/Center Column (2/3 size): Selected Tab View */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tab Selection Row */}
          <div className="flex items-center space-x-1.5 bg-slate-100 dark:bg-slate-950 p-1 rounded-2xl overflow-x-auto whitespace-nowrap">
            {([...(['feed', 'members', 'leaderboard', 'challenges', 'insights'] as const), ...(isAdmin ? ['moderation'] : [])] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveSection(tab as any)}
                className={`px-5 py-2.5 rounded-xl text-xs font-black capitalize transition-all cursor-pointer border-0 ${
                  activeSection === tab ? 'bg-white dark:bg-slate-900 text-slate-950 dark:text-slate-50 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 bg-transparent'
                }`}
              >
                {tab === 'feed' ? 'Incident Feed' : tab === 'moderation' ? 'Moderation Console' : tab}
              </button>
            ))}
          </div>

          {/* Tab Render: Feed */}
          {activeSection === 'feed' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <span className="text-xs font-black text-slate-900 dark:text-slate-100">Incident Feed ({communityIssues.length})</span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono font-bold uppercase tracking-wider">Community posts</span>
              </div>

              {communityIssues.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-12 text-center text-slate-500 space-y-3 shadow-sm">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto animate-bounce" />
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">No active incidents!</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">This community workspace has clean streets, functional utilities, and zero active hazards.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {communityIssues.map(issue => (
                    <div 
                      key={issue.id} 
                      onClick={() => onSelectIssue(issue.id)}
                      className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800/80 p-4 hover:border-emerald-500 dark:hover:border-emerald-500 hover:shadow-md dark:shadow-none transition-all cursor-pointer shadow-sm flex flex-col md:flex-row gap-4 items-start"
                    >
                      {issue.imageUrl && (
                        <img 
                          src={issue.imageUrl} 
                          alt="" 
                          className="w-full md:w-24 h-24 object-cover rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex-shrink-0"
                          referrerPolicy="no-referrer"
                        />
                      )}
                      <div className="space-y-2 flex-grow min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="severity">{issue.severity}</Badge>
                          <Badge variant="category">{issue.category}</Badge>
                          <Badge variant="status">{issue.status}</Badge>
                        </div>
                        <h4 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm truncate leading-tight hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                          {issue.title}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                          {issue.description}
                        </p>
                        <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500 pt-1.5 border-t border-slate-100 dark:border-slate-800 font-semibold">
                          <span>Reported by {issue.reportedByName}</span>
                          <span className="font-mono text-emerald-600 dark:text-emerald-400">{issue.trustScore}% Credibility</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}          {/* Tab Render: Members */}
          {activeSection === 'members' && (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
              <div>
                <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-base">Active Space Contributors ({memberCount})</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Every community member who has verified, supported, or logged issues in this space.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                {communityMembers.map(member => {
                  const level = getLevelInfo(member.reputationScore);
                  return (
                    <div key={member.id} className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/60 rounded-2xl flex items-center justify-between shadow-inner dark:shadow-none">
                      <div className="flex items-center space-x-3">
                        <img 
                          src={member.photoUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(member.id)}`} 
                          alt={member.name} 
                          className="w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 cursor-pointer hover:opacity-85 transition-opacity"
                          referrerPolicy="no-referrer"
                          onClick={() => onViewUserProfile(member.id)}
                        />
                        <div>
                          <span 
                            className="font-extrabold text-slate-900 dark:text-slate-100 text-xs block leading-tight hover:underline cursor-pointer"
                            onClick={() => onViewUserProfile(member.id)}
                          >
                            {member.name}
                          </span>
                          <span className={`text-[8px] font-mono font-black px-1.5 py-0.5 rounded mt-1.5 inline-block ${level.color}`}>
                            Lvl {level.level} {level.title}
                          </span>
                        </div>
                      </div>
                      <span className="font-mono text-xs text-slate-400 dark:text-slate-500 font-bold">{member.reputationScore} XP</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tab Render: Leaderboard */}
          {activeSection === 'leaderboard' && (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
              <div>
                <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-base">Community Contributor Board</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Neighbors ranked by reputation XP earned purely within {community.name}.</p>
              </div>

              <div className="space-y-2.5 pt-2">
                {communityMembers
                  .sort((a,b) => b.reputationScore - a.reputationScore)
                  .map((member, i) => {
                    const level = getLevelInfo(member.reputationScore);
                    return (
                      <div key={member.id} className="p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/60 rounded-2xl flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <span className="text-slate-400 dark:text-slate-500 font-mono font-bold text-xs">#{i+1}</span>
                          <img 
                            src={member.photoUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(member.id)}`} 
                            alt={member.name} 
                            className="w-8 h-8 rounded-lg object-cover cursor-pointer hover:opacity-85 transition-opacity"
                            referrerPolicy="no-referrer"
                            onClick={() => onViewUserProfile(member.id)}
                          />
                          <div>
                            <span 
                              className="font-black text-slate-900 dark:text-slate-100 text-xs block leading-none hover:underline cursor-pointer"
                              onClick={() => onViewUserProfile(member.id)}
                            >
                              {member.name}
                            </span>
                            <span className="text-[9px] text-slate-400 dark:text-slate-500 font-semibold">{level.title}</span>
                          </div>
                        </div>
                        <span className="font-mono text-xs font-extrabold text-emerald-600 dark:text-emerald-450 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded">
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
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-5 shadow-sm">
              <div>
                <h3 className="font-extrabold text-slate-950 dark:text-slate-100 text-base">Active Community Challenges</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Coordinate and pool efforts to satisfy the community level goals.</p>
              </div>

              <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/10 dark:to-teal-950/10 border border-emerald-200 dark:border-emerald-900/40 rounded-2xl space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-black text-slate-950 dark:text-slate-100 block">Monsoon Drain Audit</span>
                  <span className="text-[9px] font-mono bg-emerald-600 text-white px-2 py-0.5 rounded font-bold">Active</span>
                </div>
                <p className="text-xs text-slate-655 dark:text-slate-300 leading-relaxed">
                  Log at least 3 drainage blockage complaints prior to monsoons. This guarantees priority allocation from Municipal Engineering division.
                </p>
                <div className="space-y-1.5 pt-2">
                  <div className="flex justify-between text-[10px] font-bold text-slate-500 dark:text-slate-400">
                    <span>Community Progress: 2/3 Logged</span>
                    <span>66%</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-600 h-full rounded-full" style={{ width: '66%' }} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab Render: Insights */}
          {activeSection === 'insights' && (
            <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-6 shadow-sm">
              <div>
                <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-base flex items-center gap-1.5">
                  <Sparkles className="w-5 h-5 text-emerald-600 dark:text-emerald-450 animate-pulse" />
                  AI Standing & Locality Insights
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Smart analysis of complaints and solutions logged in {community.name}.</p>
              </div>

              {loadingInsights ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-3">
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 rounded-2xl animate-bounce">
                    <Sparkles className="w-6 h-6 animate-pulse" />
                  </div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold animate-pulse">Gemini AI is auditing neighborhood reports...</span>
                </div>
              ) : insights ? (
                <div className="space-y-4 animate-fade-in">
                  <div className="p-5 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 rounded-2xl space-y-3">
                    <span className="text-xs font-black text-emerald-900 dark:text-emerald-400 block flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      Locality Summary Insights
                    </span>
                    <p className="text-xs text-slate-700 dark:text-slate-350 leading-relaxed font-sans">
                      "{insights.summary}"
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-1.5">
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Frequent Category</span>
                      <span className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">{insights.frequentCategory}</span>
                    </div>
                    <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-1.5">
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Authority Responsiveness</span>
                      <span className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">{insights.responsiveness}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-slate-500 dark:text-slate-400 text-xs font-semibold">
                  No insights generated yet.
                </div>
              )}
            </div>
          )}

          {/* Tab Render: Moderation */}
          {activeSection === 'moderation' && isAdmin && (
            <div className="space-y-6">
              {/* Join Requests Queue */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-sm">
                <h3 className="text-xs font-black text-slate-950 dark:text-slate-100 tracking-tight uppercase flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <Users className="w-4 h-4 text-emerald-600" />
                  Join Request Queue ({(community.pendingMemberRequests || []).length})
                </h3>
                
                {(community.pendingMemberRequests || []).length === 0 ? (
                  <p className="text-xs text-slate-450 dark:text-slate-505 italic font-medium">No pending member requests for this community space.</p>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {(community.pendingMemberRequests || []).map(reqUserId => {
                      const reqUser = users.find(u => u.id === reqUserId);
                      if (!reqUser) return null;
                      return (
                        <div key={reqUserId} className="flex items-center justify-between py-3 gap-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <img 
                              src={reqUser.photoUrl} 
                              className="w-8 h-8 rounded-full object-cover bg-slate-100 cursor-pointer hover:opacity-85 transition-opacity" 
                              onClick={() => onViewUserProfile(reqUser.id)}
                            />
                            <div className="min-w-0">
                              <span 
                                className="font-extrabold text-[11px] text-slate-900 dark:text-slate-250 block truncate leading-tight hover:underline cursor-pointer"
                                onClick={() => onViewUserProfile(reqUser.id)}
                              >
                                {reqUser.name}
                              </span>
                              <span className="text-[9px] text-slate-400 dark:text-slate-550 block font-mono">@{reqUser.email.split('@')[0]}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <button
                              onClick={() => onApproveMember && onApproveMember(community.id, reqUserId)}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-bold transition-all border-0 cursor-pointer"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => onRejectMember && onRejectMember(community.id, reqUserId)}
                              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-805 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-350 rounded-lg text-[10px] font-bold transition-all border-0 cursor-pointer"
                            >
                              Reject
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Members List Console */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-sm">
                <h3 className="text-xs font-black text-slate-950 dark:text-slate-100 tracking-tight uppercase flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <Shield className="w-4 h-4 text-emerald-600" />
                  Manage Members ({communityMembers.length})
                </h3>

                <div className="divide-y divide-slate-100 dark:divide-slate-800/60 max-h-96 overflow-y-auto pr-1">
                  {communityMembers.map(member => {
                    const isMemberAdmin = community.adminIds?.includes(member.id);
                    const isCreator = community.createdBy === member.id;
                    const canModify = !isCreator && member.id !== currentUser?.id;

                    return (
                      <div key={member.id} className="flex items-center justify-between py-3 gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img 
                            src={member.photoUrl} 
                            className="w-8 h-8 rounded-full object-cover bg-slate-100 cursor-pointer hover:opacity-85 transition-opacity" 
                            onClick={() => onViewUserProfile(member.id)}
                          />
                          <div className="min-w-0">
                            <span 
                              className="font-extrabold text-[11px] text-slate-900 dark:text-slate-250 block truncate leading-tight hover:underline cursor-pointer"
                              onClick={() => onViewUserProfile(member.id)}
                            >
                              {member.name} 
                              {isCreator && <span className="ml-1.5 text-[8px] bg-amber-55 dark:bg-amber-955/35 text-amber-700 dark:text-amber-400 border border-amber-200/50 px-1 rounded font-bold">Owner</span>}
                              {!isCreator && isMemberAdmin && <span className="ml-1.5 text-[8px] bg-blue-50 dark:bg-blue-955/35 text-blue-700 dark:text-blue-400 border border-blue-200/50 px-1 rounded font-bold">Admin</span>}
                            </span>
                            <span className="text-[9px] text-slate-400 dark:text-slate-550 block font-mono">@{member.email.split('@')[0]}</span>
                          </div>
                        </div>

                        {canModify && (
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {isMemberAdmin ? (
                              <button
                                onClick={() => onUpdateMemberRole && onUpdateMemberRole(community.id, member.id, 'MEMBER')}
                                className="px-2.5 py-1 bg-slate-150 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-650 dark:text-slate-350 rounded-lg text-[9px] font-bold border-0 cursor-pointer"
                              >
                                Revoke Admin
                              </button>
                            ) : (
                              <button
                                onClick={() => onUpdateMemberRole && onUpdateMemberRole(community.id, member.id, 'ADMIN')}
                                className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:hover:bg-emerald-950/60 text-emerald-700 dark:text-emerald-455 rounded-lg text-[9px] font-bold border-0 cursor-pointer"
                              >
                                Make Admin
                              </button>
                            )}
                            <button
                              onClick={() => onRemoveMember && onRemoveMember(community.id, member.id)}
                              className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-950/60 text-rose-700 dark:text-rose-455 rounded-lg text-[9px] font-bold border-0 cursor-pointer"
                            >
                              Remove
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar (1/3 size): Persistent Community Metadata */}
        <div className="space-y-6 lg:sticky lg:top-20">

          {/* About this space */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-slate-500" />
              About Group
            </h4>
            <p className="text-xs text-slate-655 dark:text-slate-300 leading-relaxed font-sans">
              {community.description}
            </p>
          </div>

          {/* Civic Standing / Health Gauge */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-slate-500" />
              Civic Health Status
            </h4>
            
            <div className="space-y-3.5">
              <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-100/50 dark:border-slate-800/80 flex flex-col gap-1">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-extrabold text-slate-900 dark:text-slate-100">Health Score</span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${health.color}`}>
                    {health.label}
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">{health.desc}</span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-center text-xs">
                <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl">
                  <span className="block text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase">Resolution</span>
                  <span className="font-extrabold text-slate-800 dark:text-slate-100 text-sm font-mono">{resolutionRate}%</span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl">
                  <span className="block text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase">Speed</span>
                  <span className="font-extrabold text-slate-800 dark:text-slate-100 text-sm font-mono">18.5h</span>
                </div>
              </div>
            </div>
          </div>

          {/* Achievements Show */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-slate-500" />
              Unlocked Achievements
            </h4>
            
            <div className="space-y-3">
              <div className="flex items-start gap-2.5 bg-slate-50/50 dark:bg-slate-950 p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl text-[11px]">
                <Award className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-bold text-slate-800 dark:text-slate-200 block">Rapid Resolution</span>
                  <span className="text-[9px] text-slate-500 dark:text-slate-400 block leading-tight mt-0.5">Fixed hazards under 24 hours.</span>
                </div>
              </div>
              <div className="flex items-start gap-2.5 bg-slate-50/50 dark:bg-slate-950 p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl text-[11px]">
                <Shield className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-bold text-slate-800 dark:text-slate-200 block">Safety First Standing</span>
                  <span className="text-[9px] text-slate-500 dark:text-slate-400 block leading-tight mt-0.5">Audited all lighting complaints.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Community Rules */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-slate-500" />
              Community Rules
            </h4>
            
            <div className="space-y-3 text-xs leading-normal">
              {groupRules.map((r, i) => (
                <div key={i} className="flex gap-2">
                  <span className="font-black text-emerald-600 dark:text-emerald-450 font-mono text-xs">{i+1}.</span>
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200 block">{r.title}</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 block leading-tight">{r.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Admin Moderation Console */}
          {isAdmin && (
            <div className="bg-slate-950 text-white p-6 rounded-3xl border border-slate-800 shadow-xl space-y-4">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-teal-400 flex items-center gap-1.5">
                <Settings className="w-4 h-4 text-teal-500 animate-spin" />
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
