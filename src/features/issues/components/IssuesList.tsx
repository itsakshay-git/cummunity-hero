import React, { useState } from 'react';
import { Search, Filter, MapPin, Calendar, AlertTriangle, CheckCircle2, Award } from 'lucide-react';
import { Issue, Community, IssueCategory, IssueStatus, SeverityLevel } from '../../../types';

interface IssuesListProps {
  issues: Issue[];
  communities: Community[];
  onSelectIssue: (id: string) => void;
  selectedCommunityId: string;
  setSelectedCommunityId: (id: string) => void;
}

export default function IssuesList({
  issues,
  communities,
  onSelectIssue,
  selectedCommunityId,
  setSelectedCommunityId
}: IssuesListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Filter issues based on criteria
  const filtered = issues.filter(issue => {
    const matchesSearch = 
      issue.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      issue.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      issue.address.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCommunity = selectedCommunityId === 'all' || issue.communityId === selectedCommunityId;
    const matchesCategory = selectedCategory === 'all' || issue.category === selectedCategory;
    const matchesSeverity = selectedSeverity === 'all' || issue.severity === selectedSeverity;
    const matchesStatus = selectedStatus === 'all' || issue.status === selectedStatus;

    return matchesSearch && matchesCommunity && matchesCategory && matchesSeverity && matchesStatus;
  });

  // Get status color coding helper
  const getStatusStyle = (status: IssueStatus) => {
    switch (status) {
      case 'RESOLVED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'IN_PROGRESS':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'COMMUNITY_VERIFIED':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'OPEN':
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-slate-950 font-sans tracking-tight">Incidents Directory</h1>
        <p className="text-sm text-slate-500">Filter and browse all registered local anomalies, progress states, and voter endorsements.</p>
      </div>

      {/* Advanced Filter Console */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
          <input 
            id="directory-search-input"
            type="text" 
            placeholder="Search reports by description, keyword, address, or reporter name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
          />
        </div>

        {/* Category Filters row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Community Space</label>
            <select 
              id="filter-select-community"
              value={selectedCommunityId} 
              onChange={(e) => setSelectedCommunityId(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            >
              <option value="all">All Communities</option>
              {communities.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Category</label>
            <select 
              id="filter-select-category"
              value={selectedCategory} 
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            >
              <option value="all">All Categories</option>
              <option value="Pothole">Pothole</option>
              <option value="Garbage">Garbage</option>
              <option value="Water Leakage">Water Leakage</option>
              <option value="Streetlight">Streetlight</option>
              <option value="Drainage">Drainage</option>
              <option value="Road Damage">Road Damage</option>
              <option value="Public Safety">Public Safety</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Severity</label>
            <select 
              id="filter-select-severity"
              value={selectedSeverity} 
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            >
              <option value="all">All Severities</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Status</label>
            <select 
              id="filter-select-status"
              value={selectedStatus} 
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            >
              <option value="all">All Statuses</option>
              <option value="OPEN">OPEN (Submitted)</option>
              <option value="COMMUNITY_VERIFIED">COMMUNITY_VERIFIED</option>
              <option value="IN_PROGRESS">IN_PROGRESS</option>
              <option value="RESOLVED">RESOLVED</option>
            </select>
          </div>
        </div>
      </div>

      {/* Directory Grid output */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.length === 0 ? (
          <div className="col-span-full bg-white border border-slate-200 p-12 text-center rounded-2xl text-slate-500 text-sm">
            No issues found matching the selected search and filter combinations.
          </div>
        ) : (
          filtered.map(issue => (
            <div 
              key={issue.id} 
              className="bg-white rounded-2xl border border-slate-200/80 hover:border-slate-300 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden cursor-pointer"
              onClick={() => onSelectIssue(issue.id)}
            >
              <div className="relative h-48 bg-slate-100 overflow-hidden">
                <img 
                  src={issue.imageUrl} 
                  alt={issue.title} 
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 left-3 flex space-x-2">
                  <span className={`font-mono text-[9px] font-extrabold uppercase px-2.5 py-1 rounded-full shadow-sm ${
                    issue.severity === 'Critical' ? 'bg-rose-600 text-white' :
                    issue.severity === 'High' ? 'bg-amber-600 text-white' :
                    issue.severity === 'Medium' ? 'bg-blue-600 text-white' : 'bg-slate-600 text-white'
                  }`}>
                    {issue.severity}
                  </span>
                  <span className="bg-slate-900/80 backdrop-blur text-white font-mono text-[9px] px-2 py-1 rounded-full">
                    {issue.category}
                  </span>
                </div>
                <div className="absolute bottom-3 right-3 bg-emerald-950 text-emerald-300 text-[10px] px-2.5 py-1 rounded font-semibold flex items-center space-x-1 shadow-md border border-emerald-800">
                  <span>Priority: {issue.priorityScore}</span>
                </div>
              </div>

              <div className="p-6 flex-grow flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm line-clamp-1 mb-1.5 hover:text-emerald-600 transition-colors">
                    {issue.title}
                  </h3>
                  <p className="text-xs text-slate-600 line-clamp-2 mb-4 leading-relaxed">
                    {issue.description}
                  </p>
                </div>

                <div className="space-y-3.5 border-t border-slate-100 pt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-slate-400">STATUS</span>
                    <span className={`text-[10px] font-mono font-extrabold px-2 py-0.5 rounded-full border ${getStatusStyle(issue.status)}`}>
                      {issue.status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-500 text-[10px] font-medium pt-1">
                    <div className="flex items-center space-x-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span className="truncate max-w-[130px]">{issue.address}</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span>{new Date(issue.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
