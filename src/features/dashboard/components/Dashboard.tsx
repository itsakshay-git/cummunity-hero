import React from 'react';
import { Activity, MapPin } from 'lucide-react';
import { Issue, Community, IssueCategory } from '../../../types';
import MetricCards from './widgets/MetricCards';
import AIInsightsCard from './widgets/AIInsightsCard';
import HealthGauge from './widgets/HealthGauge';
import CategoryChart from './widgets/CategoryChart';
import TimelineChart from './widgets/TimelineChart';
import UrgentIssues from './widgets/UrgentIssues';

interface DashboardProps {
  issues: Issue[];
  communities: Community[];
  onSelectIssue: (id: string) => void;
  onNavigate: (tab: string) => void;
  selectedCommunityId: string;
  setSelectedCommunityId: (id: string) => void;
}

export default function Dashboard({ 
  issues, 
  communities, 
  onSelectIssue, 
  onNavigate,
  selectedCommunityId,
  setSelectedCommunityId
}: DashboardProps) {

  // Filter issues based on community selection
  const filteredIssues = selectedCommunityId === 'all' 
    ? issues 
    : issues.filter(i => i.communityId === selectedCommunityId);

  // Compute metrics
  const totalReported = filteredIssues.length;
  const pendingVerification = filteredIssues.filter(i => i.status === 'OPEN' || i.status === 'AI_ANALYZED').length;
  const inProgress = filteredIssues.filter(i => i.status === 'IN_PROGRESS' || i.status === 'COMMUNITY_VERIFIED' || i.status === 'PRIORITIZED' || i.status === 'ASSIGNED').length;
  const resolved = filteredIssues.filter(i => i.status === 'RESOLVED' || i.status === 'CLOSED').length;
  
  const resolutionRate = totalReported > 0 ? Math.round((resolved / totalReported) * 100) : 0;

  // Active community details
  const activeCommunity = communities.find(c => c.id === selectedCommunityId);

  // Urgent list (high or critical and not resolved)
  const urgentIssues = filteredIssues
    .filter(i => (i.severity === 'Critical' || i.severity === 'High') && i.status !== 'RESOLVED' && i.status !== 'CLOSED')
    .slice(0, 3);

  // Category counts
  const categories: IssueCategory[] = ['Pothole', 'Garbage', 'Water Leakage', 'Streetlight', 'Drainage', 'Road Damage', 'Public Safety', 'Other'];
  const categoryData = categories.map(cat => {
    const count = filteredIssues.filter(i => i.category === cat).length;
    return { name: cat, count };
  }).sort((a, b) => b.count - a.count);

  // Dynamic Community Health Calculations for detailed breakdown
  const getCommunityHealthBreakdown = () => {
    if (selectedCommunityId === 'all') {
      const avgReputation = Math.round(communities.reduce((acc, c) => acc + c.reputationScore, 0) / communities.length);
      return {
        overall: avgReputation,
        infrastructure: 82,
        participation: 76,
        resolution: resolutionRate,
        efficiencyLabel: "Optimal",
        status: "Good District Standing",
        description: "Across all communities, local audits indicate healthy citizen engagement. Minor waste coordination backlogs exist."
      };
    }

    const currentComm = activeCommunity || communities[0];
    const total = currentComm.totalIssues || 0;
    const solved = currentComm.resolvedIssues || 0;
    const resRate = total > 0 ? Math.round((solved / total) * 100) : 100;
    
    // Simulate other dimensions based on reputation score
    const infraScore = Math.min(100, Math.max(40, currentComm.reputationScore + 5));
    const partScore = Math.min(100, Math.max(50, currentComm.memberIds.length * 15 + 30));

    return {
      overall: currentComm.reputationScore,
      infrastructure: infraScore,
      participation: partScore,
      resolution: resRate,
      efficiencyLabel: resRate > 80 ? "Superior" : resRate > 60 ? "Moderate" : "Needs Improvement",
      status: currentComm.reputationScore > 85 ? "Model Area" : currentComm.reputationScore > 70 ? "Active Area" : "Needs Attention",
      description: currentComm.description
    };
  };

  const healthData = getCommunityHealthBreakdown();

  // Dynamic Gemini Locality Insights computed on actual live stats
  const getAIInsights = () => {
    const topCat = categoryData[0]?.count > 0 ? categoryData[0].name : "General Audits";
    const criticalCount = filteredIssues.filter(i => i.severity === 'Critical' && i.status !== 'RESOLVED').length;

    if (selectedCommunityId === 'all') {
      return {
        title: "Consolidated District Insights",
        content: `Civic resolution currently stands at ${resolutionRate}%. Analysis shows "${topCat}" is the primary active issue category. A ${criticalCount > 0 ? `high concentration of ${criticalCount} critical hazard(s)` : 'minimal rate of safety hazards'} is noted near key junctions. Multi-community drives are recommended to clear backlogs.`,
        health: `${healthData.overall}/100`,
        alert: criticalCount > 0 
          ? `${criticalCount} high-severity public hazards require immediate mobilization.` 
          : "District is clear of critical public safety emergency blocks. Keep reporting!",
        badge: "District Master"
      };
    }

    const communityName = activeCommunity?.name || "Local Area";
    return {
      title: `${communityName} Health Assessment`,
      content: `In ${communityName}, citizen co-auditing has recorded ${totalReported} total incidents, achieving a ${resolutionRate}% resolution index. ${topCat} remains the most frequent concern. Average response time on street hazards is currently estimated at 42 hours, leading adjacent zones.`,
      health: `${healthData.overall}/100`,
      alert: urgentIssues.length > 0 
        ? `"${urgentIssues[0].title}" requires local authority allocation.` 
        : "Excellent neighborhood safety index recorded. No critical alerts.",
      badge: healthData.overall > 85 ? "Pristine Status" : "Active Progress"
    };
  };

  const insights = getAIInsights();

  // Custom historical values for rendering the area-like timeline chart
  const timelineData = [
    { month: 'Jan', reported: 12, resolved: 8 },
    { month: 'Feb', reported: 18, resolved: 14 },
    { month: 'Mar', reported: 15, resolved: 13 },
    { month: 'Apr', reported: 22, resolved: 17 },
    { month: 'May', reported: 29, resolved: 22 },
    { month: 'Jun', reported: totalReported, resolved: resolved },
  ];

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Title & Filter Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 text-white p-6 rounded-3xl shadow-sm relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(16,185,129,0.15),rgba(255,255,255,0))]" />
        <div className="relative z-10 space-y-1">
          <div className="flex items-center space-x-2">
            <span className="bg-emerald-500/20 text-emerald-400 text-[10px] uppercase font-bold tracking-widest px-2.5 py-1 rounded-full border border-emerald-500/30">
              Active Phase 9
            </span>
            <span className="text-[10px] text-slate-400 font-mono">Live Sync</span>
          </div>
          <h1 className="text-xl md:text-2xl font-black font-sans tracking-tight text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-400" />
            Civic Command Center
          </h1>
          <p className="text-xs text-slate-400">
            Real-time hyperlocal incident auditing, community performance scores, and neighborhood health indices.
          </p>
        </div>
        
        {/* Scope Selector */}
        <div className="relative z-10 flex items-center space-x-2 bg-slate-800/80 backdrop-blur border border-slate-700 p-2.5 rounded-2xl self-start sm:self-auto">
          <MapPin className="w-4 h-4 text-emerald-400" />
          <div className="flex flex-col">
            <span className="text-[8px] font-mono text-slate-400 uppercase tracking-widest font-extrabold">Selected Scope</span>
            <select 
              id="dashboard-community-select"
              value={selectedCommunityId} 
              onChange={(e) => setSelectedCommunityId(e.target.value)}
              className="text-xs font-bold text-slate-100 bg-transparent border-none outline-none cursor-pointer focus:ring-0 pr-6 pt-0.5"
            >
              <option value="all" className="bg-slate-900 text-white">Global (All Communities)</option>
              {communities.map(c => (
                <option key={c.id} value={c.id} className="bg-slate-900 text-white">{c.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Metric Cards Grid */}
      <MetricCards
        totalReported={totalReported}
        pendingVerification={pendingVerification}
        inProgress={inProgress}
        resolved={resolved}
        resolutionRate={resolutionRate}
      />

      {/* Dynamic AI Insights and Interactive Community Score Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <AIInsightsCard insights={insights} />
        
        <HealthGauge
          overallHealth={healthData.overall}
          infrastructureScore={healthData.infrastructure}
          participationScore={healthData.participation}
          resolutionScore={healthData.resolution}
          statusLabel={healthData.status}
          efficiencyLabel={healthData.efficiencyLabel}
          description={healthData.description}
          totalCommunities={communities.length}
          onNavigate={onNavigate}
        />
      </div>

      {/* Visual Analytics Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CategoryChart categoryData={categoryData} totalReported={totalReported} />
        <TimelineChart timelineData={timelineData} />
      </div>

      {/* Urgent Issues Row */}
      <UrgentIssues
        urgentIssues={urgentIssues}
        totalIssuesCount={issues.length}
        onSelectIssue={onSelectIssue}
        onNavigate={onNavigate}
      />
    </div>
  );
}
