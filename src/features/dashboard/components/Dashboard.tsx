import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  TrendingUp, Users, AlertTriangle, CheckCircle2, Clock, ShieldAlert, Sparkles, 
  ArrowRight, Flame, MapPin, Activity, Award, ShieldCheck, Zap, RefreshCw, BarChart3, HelpCircle
} from 'lucide-react';
import { Issue, Community, IssueCategory } from '../../../types';

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
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [activeScoreTab, setActiveScoreTab] = useState<'infrastructure' | 'participation' | 'resolution'>('infrastructure');

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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {/* Metric 1 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:border-slate-300 hover:shadow transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 font-sans uppercase tracking-wide">Total Audited</span>
            <div className="p-2 bg-slate-50 text-slate-700 rounded-xl border border-slate-100">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-black text-slate-950 tracking-tight">{totalReported}</span>
            <div className="flex items-center gap-1.5 text-[10px] text-emerald-600 mt-1 font-semibold">
              <Zap className="w-3.5 h-3.5" />
              <span>100% Crowd-Sourced</span>
            </div>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:border-slate-300 hover:shadow transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 font-sans uppercase tracking-wide">Pending Verify</span>
            <div className="p-2 bg-amber-50 text-amber-700 rounded-xl border border-amber-100">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-black text-slate-950 tracking-tight">{pendingVerification}</span>
            <div className="flex items-center gap-1 text-[10px] text-amber-600 mt-1 font-medium">
              <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-ping"></span>
              <span>Awaiting Civic Audit</span>
            </div>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:border-slate-300 hover:shadow transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 font-sans uppercase tracking-wide">Under Action</span>
            <div className="p-2 bg-blue-50 text-blue-700 rounded-xl border border-blue-100">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-black text-slate-950 tracking-tight">{inProgress}</span>
            <div className="flex items-center gap-1.5 text-[10px] text-blue-600 mt-1 font-semibold">
              <Users className="w-3.5 h-3.5" />
              <span>Assigned to Resolvers</span>
            </div>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:border-slate-300 hover:shadow transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 font-sans uppercase tracking-wide">Closed & Solved</span>
            <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-black text-slate-950 tracking-tight">{resolved}</span>
            <div className="flex items-center gap-1.5 text-[10px] text-emerald-600 mt-1 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{resolutionRate}% Resolution Rate</span>
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic AI Insights and Interactive Community Score Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Gemini AI Locality Insights Card */}
        <div className="lg:col-span-2 bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 text-white p-6 md:p-8 rounded-3xl relative overflow-hidden shadow-md border border-slate-800">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 bg-emerald-500/15 rounded-xl border border-emerald-500/30">
                <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
              </div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400">Gemini AI Synthesis</span>
            </div>
            <span className="bg-slate-800 border border-slate-700 text-slate-300 font-mono text-[9px] px-2.5 py-1 rounded-full">
              {insights.badge}
            </span>
          </div>

          <h2 className="text-lg md:text-xl font-extrabold tracking-tight mb-3 font-sans text-white leading-snug">
            {insights.title}
          </h2>
          <p className="text-xs md:text-sm text-slate-300 leading-relaxed mb-6 font-medium">
            {insights.content}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-800/80 pt-6">
            <div className="flex items-start space-x-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
              <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg mt-0.5">
                <Flame className="w-4 h-4" />
              </div>
              <div>
                <span className="block text-[8px] text-slate-400 font-mono uppercase tracking-wider font-extrabold">Neighborhood Index</span>
                <span className="text-sm font-black text-white">{insights.health} Score</span>
              </div>
            </div>

            <div className="flex items-start space-x-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
              <div className="p-2 bg-red-950/40 border border-red-500/20 rounded-lg text-rose-400 mt-0.5">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div>
                <span className="block text-[8px] text-rose-400 font-mono uppercase tracking-wider font-extrabold">Safety Action Block</span>
                <span className="text-xs text-rose-100 font-bold leading-tight block truncate max-w-[200px]">{insights.alert}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Neighborhood Health Index circular Gauge */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-extrabold text-slate-950 text-sm">Community Health Score</h3>
                <p className="text-[10px] text-slate-400 font-medium">Composite local utility integrity index</p>
              </div>
              <span className="bg-emerald-50 text-emerald-700 text-[10px] px-2 py-0.5 rounded-full font-bold">
                {healthData.status}
              </span>
            </div>

            {/* Custom Interactive SVG Circular Progress Gauge */}
            <div className="relative flex items-center justify-center my-4">
              <svg className="w-36 h-36 transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="#E2E8F0"
                  strokeWidth="8"
                  fill="transparent"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="#10B981"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={`${2 * Math.PI * 40}`}
                  strokeDashoffset={`${2 * Math.PI * 40 * (1 - healthData.overall / 100)}`}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute text-center">
                <span className="text-3xl font-black text-slate-950 tracking-tighter">{healthData.overall}%</span>
                <span className="block text-[8px] font-mono font-bold text-slate-400 uppercase tracking-widest mt-0.5">Health Score</span>
              </div>
            </div>

            {/* Sub-Score Interactive Tabs */}
            <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl mb-4 text-center">
              <button
                onClick={() => setActiveScoreTab('infrastructure')}
                className={`text-[9px] font-bold py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeScoreTab === 'infrastructure' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Utility
              </button>
              <button
                onClick={() => setActiveScoreTab('participation')}
                className={`text-[9px] font-bold py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeScoreTab === 'participation' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Civic Rate
              </button>
              <button
                onClick={() => setActiveScoreTab('resolution')}
                className={`text-[9px] font-bold py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeScoreTab === 'resolution' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Efficiency
              </button>
            </div>

            {/* Sub-Score description and mini progress indicators */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
              {activeScoreTab === 'infrastructure' && (
                <div>
                  <div className="flex justify-between text-[10px] font-bold text-slate-700 mb-1">
                    <span>Infrastructure & Utility Index</span>
                    <span>{healthData.infrastructure}/100</span>
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${healthData.infrastructure}%` }}></div>
                  </div>
                  <p className="text-[9px] text-slate-400 mt-1.5 font-medium leading-normal">
                    Derived from public streetlight functionality, road safety levels, and water leakage control indexes.
                  </p>
                </div>
              )}

              {activeScoreTab === 'participation' && (
                <div>
                  <div className="flex justify-between text-[10px] font-bold text-slate-700 mb-1">
                    <span>Citizen Co-Auditing Rate</span>
                    <span>{healthData.participation}/100</span>
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-indigo-500 h-full rounded-full transition-all duration-500" style={{ width: `${healthData.participation}%` }}></div>
                  </div>
                  <p className="text-[9px] text-slate-400 mt-1.5 font-medium leading-normal">
                    Calculated based on active member population and the percentage of local reports validated by local residents.
                  </p>
                </div>
              )}

              {activeScoreTab === 'resolution' && (
                <div>
                  <div className="flex justify-between text-[10px] font-bold text-slate-700 mb-1">
                    <span>Resolution Index</span>
                    <span>{healthData.resolution}/100</span>
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-blue-500 h-full rounded-full transition-all duration-500" style={{ width: `${healthData.resolution}%` }}></div>
                  </div>
                  <p className="text-[9px] text-slate-400 mt-1.5 font-medium leading-normal">
                    Rating of {healthData.efficiencyLabel}. Indicates the ratio of closed or successfully resolved public reports.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[10px]">
            <span className="text-slate-400 font-semibold font-sans">Active Communities: {communities.length}</span>
            <button 
              onClick={() => onNavigate('leaderboard')} 
              className="text-emerald-600 hover:text-emerald-500 font-bold flex items-center gap-0.5"
            >
              Leaderboard League →
            </button>
          </div>
        </div>

      </div>

      {/* Visual Analytics Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Category Distribution Chart */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-slate-950 text-sm flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4 text-emerald-600" />
                Audits by Category
              </h3>
              <p className="text-[10px] text-slate-400">Distribution of crowd-sourced incidents in active scope</p>
            </div>
            {hoveredCategory && (
              <span className="text-[9px] font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-bold">
                {hoveredCategory}
              </span>
            )}
          </div>

          <div className="space-y-2.5">
            {categoryData.slice(0, 5).map(({ name, count }) => {
              const maxCount = Math.max(...categoryData.map(c => c.count)) || 1;
              const widthPct = (count / maxCount) * 100;
              const globalPct = totalReported > 0 ? Math.round((count / totalReported) * 100) : 0;
              
              // Custom colors per category type
              const barColor = 
                name === 'Pothole' ? 'bg-amber-500' :
                name === 'Garbage' ? 'bg-orange-500' :
                name === 'Water Leakage' ? 'bg-sky-500' :
                name === 'Streetlight' ? 'bg-yellow-400' : 'bg-emerald-500';

              return (
                <div 
                  key={name}
                  className="space-y-1 group"
                  onMouseEnter={() => setHoveredCategory(`${name}: ${count} reports`)}
                  onMouseLeave={() => setHoveredCategory(null)}
                >
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
                    <span className="group-hover:text-emerald-600 transition-colors font-sans">{name}</span>
                    <span className="font-mono text-slate-500 text-[10px]">{count} ({globalPct}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 h-3 rounded-lg overflow-hidden flex items-center p-0.5 border border-slate-200/40">
                    <motion.div 
                      className={`${barColor} h-full rounded-md shadow-sm`}
                      initial={{ width: 0 }}
                      animate={{ width: `${widthPct}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="pt-2 text-center text-[10px] text-slate-400 font-medium">
            <span>Hover on rows to inspect exact count breakdowns.</span>
          </div>
        </div>

        {/* Resolution Timeline Area Graph (Bespoke SVG-based responsive line chart) */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
          <div>
            <h3 className="font-extrabold text-slate-950 text-sm">Resolution Timeline</h3>
            <p className="text-[10px] text-slate-400">Comparison of newly logged incidents vs. resolutions resolved</p>
          </div>

          <div className="relative h-44 w-full">
            {/* SVG Plotting Frame */}
            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              {/* Grid Lines */}
              <line x1="0" y1="25" x2="100" y2="25" stroke="#F1F5F9" strokeWidth="0.5" />
              <line x1="0" y1="50" x2="100" y2="50" stroke="#F1F5F9" strokeWidth="0.5" />
              <line x1="0" y1="75" x2="100" y2="75" stroke="#F1F5F9" strokeWidth="0.5" />
              
              {/* Reported Area path (Emerald) */}
              <path
                d={`
                  M 0 100
                  L 0 ${100 - (timelineData[0].reported / 35) * 80}
                  L 20 ${100 - (timelineData[1].reported / 35) * 80}
                  L 40 ${100 - (timelineData[2].reported / 35) * 80}
                  L 60 ${100 - (timelineData[3].reported / 35) * 80}
                  L 80 ${100 - (timelineData[4].reported / 35) * 80}
                  L 100 ${100 - (timelineData[5].reported / 35) * 80}
                  L 100 100 Z
                `}
                fill="url(#emerald-gradient)"
                opacity="0.15"
              />

              {/* Resolved Area path (Indigo) */}
              <path
                d={`
                  M 0 100
                  L 0 ${100 - (timelineData[0].resolved / 35) * 80}
                  L 20 ${100 - (timelineData[1].resolved / 35) * 80}
                  L 40 ${100 - (timelineData[2].resolved / 35) * 80}
                  L 60 ${100 - (timelineData[3].resolved / 35) * 80}
                  L 80 ${100 - (timelineData[4].resolved / 35) * 80}
                  L 100 ${100 - (timelineData[5].resolved / 35) * 80}
                  L 100 100 Z
                `}
                fill="url(#indigo-gradient)"
                opacity="0.1"
              />

              {/* Reported Line */}
              <polyline
                fill="none"
                stroke="#10B981"
                strokeWidth="2"
                points={`
                  0,${100 - (timelineData[0].reported / 35) * 80}
                  20,${100 - (timelineData[1].reported / 35) * 80}
                  40,${100 - (timelineData[2].reported / 35) * 80}
                  60,${100 - (timelineData[3].reported / 35) * 80}
                  80,${100 - (timelineData[4].reported / 35) * 80}
                  100,${100 - (timelineData[5].reported / 35) * 80}
                `}
              />

              {/* Resolved Line */}
              <polyline
                fill="none"
                stroke="#6366F1"
                strokeWidth="2"
                strokeDasharray="2,2"
                points={`
                  0,${100 - (timelineData[0].resolved / 35) * 80}
                  20,${100 - (timelineData[1].resolved / 35) * 80}
                  40,${100 - (timelineData[2].resolved / 35) * 80}
                  60,${100 - (timelineData[3].resolved / 35) * 80}
                  80,${100 - (timelineData[4].resolved / 35) * 80}
                  100,${100 - (timelineData[5].resolved / 35) * 80}
                `}
              />

              {/* Definition of Gradients */}
              <defs>
                <linearGradient id="emerald-gradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10B981" />
                  <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="indigo-gradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366F1" />
                  <stop offset="100%" stopColor="#6366F1" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>

            {/* Floating Markers/Data labels on Timeline */}
            <div className="absolute inset-0 flex justify-between pointer-events-none text-[8px] font-mono text-slate-400 pt-36">
              {timelineData.map((d, i) => (
                <div key={i} className="flex flex-col items-center w-8 text-center">
                  <span className="font-bold text-slate-700">{d.month}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Chart Legends */}
          <div className="flex items-center justify-center space-x-6 text-xs pt-1">
            <div className="flex items-center space-x-1.5 font-semibold text-slate-700">
              <span className="w-3 h-3 bg-emerald-500 rounded-full inline-block"></span>
              <span>Reported Incidents</span>
            </div>
            <div className="flex items-center space-x-1.5 font-semibold text-slate-700">
              <span className="w-3 h-1.5 border-t-2 border-dashed border-indigo-500 inline-block"></span>
              <span>Resolved Audits</span>
            </div>
          </div>
        </div>

      </div>

      {/* Urgent Issues Row */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-black text-slate-950 font-sans tracking-tight">Immediate Action Required</h2>
            <p className="text-xs text-slate-500">Unresolved issues marked as High or Critical severity.</p>
          </div>
          <button 
            id="view-all-issues-btn"
            onClick={() => onNavigate('issues')}
            className="text-xs font-bold text-emerald-600 hover:text-emerald-500 hover:underline flex items-center space-x-1 cursor-pointer"
          >
            <span>View All Issues ({issues.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {urgentIssues.length === 0 ? (
            <div className="col-span-3 bg-white border border-slate-200/80 p-8 rounded-2xl text-center text-slate-500 text-sm">
              No urgent safety hazards in this community scope. Awesome!
            </div>
          ) : (
            urgentIssues.map(issue => (
              <div 
                key={issue.id} 
                className="bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between overflow-hidden cursor-pointer"
                onClick={() => onSelectIssue(issue.id)}
              >
                {/* Image & Severity tag */}
                <div className="relative h-40 bg-slate-100 overflow-hidden">
                  <img 
                    src={issue.imageUrl} 
                    alt={issue.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-3 left-3 flex space-x-1.5">
                    <span className="bg-red-600 text-white font-mono text-[9px] font-extrabold uppercase px-2.5 py-1 rounded-full shadow-sm">
                      {issue.severity}
                    </span>
                    <span className="bg-slate-900/80 backdrop-blur text-white font-mono text-[9px] px-2 py-1 rounded-full">
                      {issue.category}
                    </span>
                  </div>
                  <div className="absolute bottom-3 right-3 bg-emerald-950 text-emerald-300 text-[10px] px-2 py-1 rounded font-semibold flex items-center space-x-1 shadow-md">
                    <span>Priority Score: {issue.priorityScore}</span>
                  </div>
                </div>

                <div className="p-5 flex-grow flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm line-clamp-1 mb-1.5 hover:text-emerald-600 transition-colors">
                      {issue.title}
                    </h3>
                    <p className="text-xs text-slate-600 line-clamp-2 mb-4 leading-relaxed">
                      {issue.description}
                    </p>
                  </div>

                  <div className="border-t border-slate-100 pt-3 flex items-center justify-between text-slate-500 text-[10px] font-medium">
                    <div className="flex items-center space-x-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span className="truncate max-w-[130px]">{issue.address}</span>
                    </div>
                    <span className="font-semibold text-emerald-600 font-mono">
                      {issue.status}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
