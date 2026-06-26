import React, { useState, useEffect } from 'react';
import { Search, Filter, MapPin, Calendar, AlertTriangle, CheckCircle2, Award } from 'lucide-react';
import { Issue, Community, IssueCategory, IssueStatus, SeverityLevel, User } from '../../../types';
import Badge from '../../../components/ui/Badge';
import { useInfiniteScroll } from '../../../hooks/useInfiniteScroll';
import { getDistanceMeters, getCityFromArea } from '../../../lib/geoUtils';

interface IssuesListProps {
  issues: Issue[];
  communities: Community[];
  onSelectIssue: (id: string) => void;
  selectedCommunityId: string;
  setSelectedCommunityId: (id: string) => void;
  userCoords?: { lat: number; lng: number } | null;
  currentUser?: User | null;
}

export default function IssuesList({
  issues,
  communities,
  onSelectIssue,
  selectedCommunityId,
  setSelectedCommunityId,
  userCoords,
  currentUser
}: IssuesListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  
  const [visibleCount, setVisibleCount] = useState(6);

  // Sort communities by distance to userCoords if userCoords is available
  const sortedCommunities = React.useMemo(() => {
    if (!userCoords) return communities;
    return [...communities].sort((a, b) => {
      const distA = getDistanceMeters(userCoords.lat, userCoords.lng, a.latitude, a.longitude);
      const distB = getDistanceMeters(userCoords.lat, userCoords.lng, b.latitude, b.longitude);
      return distA - distB;
    });
  }, [communities, userCoords]);

  useEffect(() => {
    setVisibleCount(6);
  }, [searchTerm, selectedCategory, selectedSeverity, selectedStatus, selectedCommunityId]);

  // Filter issues based on criteria
  const filtered = issues.filter(issue => {
    const matchesSearch = 
      issue.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      issue.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      issue.address.toLowerCase().includes(searchTerm.toLowerCase());

    let matchesCommunity = false;
    if (selectedCommunityId === 'all') {
      matchesCommunity = true;
    } else if (selectedCommunityId === 'nearby_5') {
      if (!userCoords) {
        matchesCommunity = true;
      } else {
        const dist = getDistanceMeters(userCoords.lat, userCoords.lng, issue.latitude, issue.longitude);
        matchesCommunity = dist <= 5000;
      }
    } else if (selectedCommunityId === 'nearby_15') {
      if (!userCoords) {
        matchesCommunity = true;
      } else {
        const dist = getDistanceMeters(userCoords.lat, userCoords.lng, issue.latitude, issue.longitude);
        matchesCommunity = dist <= 15000;
      }
    } else if (selectedCommunityId === 'city') {
      const userCity = currentUser?.city || 'Chandrapur';
      const community = communities.find(c => c.id === issue.communityId);
      const issueCity = issue.city || community?.city || getCityFromArea(community?.areaName) || getCityFromArea(issue.address) || 'Chandrapur';
      matchesCommunity = issueCity.toLowerCase() === userCity.toLowerCase();
    } else {
      matchesCommunity = issue.communityId === selectedCommunityId;
    }

    const matchesCategory = selectedCategory === 'all' || issue.category === selectedCategory;
    const matchesSeverity = selectedSeverity === 'all' || issue.severity === selectedSeverity;
    const matchesStatus = selectedStatus === 'all' || issue.status === selectedStatus;

    return matchesSearch && matchesCommunity && matchesCategory && matchesSeverity && matchesStatus;
  });

  const lastElementRef = useInfiniteScroll({
    onLoadMore: () => setVisibleCount(prev => prev + 6),
    hasMore: visibleCount < filtered.length,
    isLoading: false
  });

  // Get status color coding helper
  const getStatusStyle = (status: IssueStatus) => {
    switch (status) {
      case 'RESOLVED':
        return 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-450 border-emerald-200 dark:border-emerald-900/30';
      case 'IN_PROGRESS':
        return 'bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-450 border-blue-200 dark:border-blue-900/30';
      case 'COMMUNITY_VERIFIED':
        return 'bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-450 border-amber-200 dark:border-amber-900/30';
      case 'OPEN':
      default:
        return 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 font-sans tracking-tight">Incidents Directory</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Filter and browse all registered local anomalies, progress states, and voter endorsements.</p>
      </div>

      {/* Advanced Filter Console */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 dark:text-slate-500" />
          <input 
            id="directory-search-input"
            type="text" 
            placeholder="Search reports by description, keyword, address, or reporter name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:bg-white dark:focus:bg-slate-900"
          />
        </div>

        {/* Category Filters row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">Community Space</label>
            <select 
              id="filter-select-community"
              value={selectedCommunityId} 
              onChange={(e) => setSelectedCommunityId(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-850 dark:text-slate-105 text-xs rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer"
            >
              <optgroup label="Hyperlocal Proximity" className="bg-white dark:bg-slate-900 text-slate-400 text-[10px]">
                <option value="nearby_5" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Within 5 km</option>
                <option value="nearby_15" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Within 15 km</option>
                <option value="city" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">My Location</option>
              </optgroup>
              <optgroup label="Specific Community Spaces" className="bg-white dark:bg-slate-900 text-slate-400 text-[10px]">
                {sortedCommunities.map(c => (
                  <option key={c.id} value={c.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">{c.name}</option>
                ))}
              </optgroup>
              <optgroup label="Global Scope" className="bg-white dark:bg-slate-900 text-slate-400 text-[10px]">
                <option value="all" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Global (All Districts)</option>
              </optgroup>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">Category</label>
            <select 
              id="filter-select-category"
              value={selectedCategory} 
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-105 text-xs rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer"
            >
              <option value="all" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">All Categories</option>
              <option value="Pothole" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Pothole</option>
              <option value="Garbage" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Garbage</option>
              <option value="Water Leakage" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Water Leakage</option>
              <option value="Streetlight" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Streetlight</option>
              <option value="Drainage" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Drainage</option>
              <option value="Road Damage" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Road Damage</option>
              <option value="Public Safety" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Public Safety</option>
              <option value="Other" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-505 uppercase tracking-wider mb-1.5">Severity</label>
            <select 
              id="filter-select-severity"
              value={selectedSeverity} 
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-105 text-xs rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer"
            >
              <option value="all" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">All Severities</option>
              <option value="Low" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Low</option>
              <option value="Medium" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Medium</option>
              <option value="High" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">High</option>
              <option value="Critical" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Critical</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-505 uppercase tracking-wider mb-1.5">Status</label>
            <select 
              id="filter-select-status"
              value={selectedStatus} 
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-105 text-xs rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer"
            >
              <option value="all" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">All Statuses</option>
              <option value="OPEN" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">OPEN (Submitted)</option>
              <option value="COMMUNITY_VERIFIED" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">COMMUNITY_VERIFIED</option>
              <option value="IN_PROGRESS" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">IN_PROGRESS</option>
              <option value="RESOLVED" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">RESOLVED</option>
            </select>
          </div>
        </div>
      </div>

      {(() => {
        const displayed = filtered.slice(0, visibleCount);

        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.length === 0 ? (
              <div className="col-span-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-12 text-center rounded-2xl text-slate-500 dark:text-slate-400 text-sm">
                No issues found matching the selected search and filter combinations.
              </div>
            ) : (
              displayed.map((issue, idx) => {
                const isLast = idx === displayed.length - 1;
                return (
                  <div 
                    key={issue.id} 
                    ref={isLast ? lastElementRef : undefined}
                    className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm hover:shadow-md dark:shadow-none transition-all flex flex-col justify-between overflow-hidden cursor-pointer"
                    onClick={() => onSelectIssue(issue.id)}
                  >
                    <div className="relative h-48 bg-slate-100 dark:bg-slate-950 overflow-hidden">
                      <img 
                        src={issue.imageUrl} 
                        alt={issue.title} 
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-3 left-3 flex space-x-2">
                        <Badge variant="severity">{issue.severity}</Badge>
                        <Badge variant="category">#{issue.category}</Badge>
                      </div>
                      <div className="absolute bottom-3 right-3 bg-slate-900/80 backdrop-blur border border-white/10 text-white text-[8px] font-mono px-2 py-0.5 rounded-md font-semibold flex items-center space-x-1 shadow">
                        <span>PRIORITY: {issue.priorityScore}</span>
                      </div>
                    </div>

                    <div className="p-6 flex-grow flex flex-col justify-between">
                      <div>
                        <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm line-clamp-1 mb-1.5 hover:text-emerald-600 dark:hover:text-emerald-450 transition-colors">
                          {issue.title}
                        </h3>
                        <p className="text-xs text-slate-650 dark:text-slate-400 line-clamp-2 mb-4 leading-relaxed">
                          {issue.description}
                        </p>
                      </div>

                      <div className="space-y-3.5 border-t border-slate-100 dark:border-slate-800/80 pt-4">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">STATUS</span>
                          <span className={`text-[10px] font-mono font-extrabold px-2 py-0.5 rounded-full border ${getStatusStyle(issue.status)}`}>
                            {issue.status}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-slate-550 dark:text-slate-400 text-[10px] font-medium pt-1">
                          <div className="flex items-center space-x-1.5">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 flex-shrink-0" />
                            <span className="truncate max-w-[130px]">{issue.address}</span>
                          </div>
                          <div className="flex items-center space-x-1.5">
                            <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 flex-shrink-0" />
                            <span>{new Date(issue.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        );
      })()}
    </div>
  );
}
