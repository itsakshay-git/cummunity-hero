import React, { useState, useEffect } from 'react';
import { Map as GMap, AdvancedMarker, InfoWindow, Pin, useMap } from '@vis.gl/react-google-maps';
import { Map as MapIcon, Filter, AlertTriangle, Shield, CheckCircle, Search, Target, ChevronRight, Sparkles, Compass } from 'lucide-react';
import { Issue, IssueCategory, IssueStatus, Community } from '../../../types';
import { GoogleMapSection, hasValidKey } from './GoogleMapSection';
import OpenStreetMapSection, { OSMZone } from './OpenStreetMapSection';
import { getDistanceMeters } from '../../../lib/geoUtils';
import { Badge } from '../../../components/ui/Badge';

interface MapExplorerProps {
  issues: Issue[];
  communities: Community[];
  onSelectIssue: (issueId: string) => void;
  userCoords?: { lat: number; lng: number } | null;
}

const CATEGORIES: (IssueCategory | 'All')[] = [
  'All',
  'Pothole',
  'Garbage',
  'Water Leakage',
  'Streetlight',
  'Drainage',
  'Road Damage',
  'Public Safety',
  'Other'
];

const STATUSES: (IssueStatus | 'All')[] = [
  'All',
  'OPEN',
  'COMMUNITY_VERIFIED',
  'IN_PROGRESS',
  'RESOLUTION_UPLOADED',
  'RESOLVED'
];

const CATEGORY_COLORS: Record<IssueCategory, string> = {
  'Pothole': '#E11D48', // rose-600
  'Garbage': '#D97706', // amber-600
  'Water Leakage': '#2563EB', // blue-600
  'Streetlight': '#CA8A04', // yellow-600
  'Drainage': '#7C3AED', // violet-600
  'Road Damage': '#4B5563', // gray-600
  'Public Safety': '#DC2626', // red-600
  'Other': '#0D9488' // teal-600
};

export default function MapExplorer({ issues, communities, onSelectIssue, userCoords }: MapExplorerProps) {
  const [selectedCategory, setSelectedCategory] = useState<IssueCategory | 'All'>('All');
  const [selectedStatus, setSelectedStatus] = useState<IssueStatus | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeMarkerIssue, setActiveMarkerIssue] = useState<Issue | null>(null);
  const [mapProvider, setMapProvider] = useState<'google' | 'osm'>(() => {
    return (localStorage.getItem('default_map_provider') as 'google' | 'osm') || 'osm';
  });
  
  // Center coordinates (Chandrapur default)
  const defaultCenter = userCoords || { lat: 19.9615, lng: 79.2961 };
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [mapZoom, setMapZoom] = useState(13);

  // Tabs / tracking / bottom sheet states
  const [sidebarTab, setSidebarTab] = useState<'incidents' | 'zones'>('incidents');
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [showZonesOverlay, setShowZonesOverlay] = useState(true);
  const [mobileDrawerExpanded, setMobileDrawerExpanded] = useState(false);

  useEffect(() => {
    if (userCoords) {
      setMapCenter(userCoords);
    }
  }, [userCoords]);

  // Dynamic zones based on communities and active issues
  const formattedZones: OSMZone[] = React.useMemo(() => {
    return communities.map(comm => {
      const activeIssuesInComm = issues.filter(i => 
        i.communityId === comm.id && 
        i.status !== 'RESOLVED' && 
        i.status !== 'CLOSED'
      );
      
      const activeCount = activeIssuesInComm.length;
      const calculatedHealth = Math.max(0, 100 - activeCount * 15);
      
      return {
        id: comm.id,
        name: comm.name,
        areaName: comm.areaName,
        latitude: comm.latitude || 19.9615,
        longitude: comm.longitude || 79.2961,
        activeIssuesCount: activeCount,
        healthScore: comm.healthScore || calculatedHealth
      };
    }).sort((a, b) => b.activeIssuesCount - a.activeIssuesCount);
  }, [communities, issues]);

  // Greedy Haversine clustering for hotspots
  const hotspots = React.useMemo(() => {
    const activeIssues = issues.filter(i => i.status !== 'RESOLVED' && i.status !== 'CLOSED');
    const clusters: { latitude: number; longitude: number; weight: number; radius: number }[] = [];
    const visited = new Set<string>();

    for (const issue of activeIssues) {
      if (visited.has(issue.id)) continue;

      const neighbors = activeIssues.filter(other => {
        if (visited.has(other.id)) return false;
        const distance = getDistanceMeters(
          issue.latitude,
          issue.longitude,
          other.latitude,
          other.longitude
        );
        return distance <= 250;
      });

      if (neighbors.length >= 2) {
        let sumLat = 0;
        let sumLng = 0;
        neighbors.forEach(n => {
          sumLat += n.latitude;
          sumLng += n.longitude;
          visited.add(n.id);
        });
        
        clusters.push({
          latitude: sumLat / neighbors.length,
          longitude: sumLng / neighbors.length,
          weight: neighbors.length,
          radius: 250
        });
      }
    }
    return clusters;
  }, [issues]);

  // Auto-switch to OpenStreetMap if Google Maps auth/billing fails
  useEffect(() => {
    const handleAuthFailure = () => {
      console.warn("Switching Map Explorer to OpenStreetMap due to API auth/billing failure.");
      setMapProvider('osm');
    };
    window.addEventListener('gmp-auth-failure', handleAuthFailure);
    return () => {
      window.removeEventListener('gmp-auth-failure', handleAuthFailure);
    };
  }, []);

  // Filter issues based on search, category and status selection
  const filteredIssues = issues.filter(issue => {
    const matchesCategory = selectedCategory === 'All' || issue.category === selectedCategory;
    const matchesStatus = selectedStatus === 'All' || issue.status === selectedStatus;
    const matchesSearch = searchQuery === '' || 
      issue.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      issue.address.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesStatus && matchesSearch;
  });

  const handleFocusIssue = (issue: Issue) => {
    setMapCenter({ lat: issue.latitude, lng: issue.longitude });
    setMapZoom(16);
    setActiveMarkerIssue(issue);
    setSelectedZoneId(null);
  };

  const handleLocateUser = () => {
    if (userCoords) {
      setMapCenter(userCoords);
      setMapZoom(16);
      setActiveMarkerIssue(null);
      setSelectedZoneId(null);
    } else if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setMapCenter(coords);
          setMapZoom(16);
          setActiveMarkerIssue(null);
          setSelectedZoneId(null);
        },
        (err) => {
          console.warn("Geolocation tracking failed:", err);
          alert("Unable to detect GPS coordinates. Please check your browser location permissions.");
        }
      );
    }
  };

  return (
    <div className="space-y-4 md:space-y-6 animate-fade-in font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 shadow-sm">
        <div>
          <h1 className="text-base font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center space-x-2">
            <div className="p-1 bg-emerald-50 dark:bg-emerald-950/20 rounded text-emerald-600 dark:text-emerald-450">
              <MapIcon className="w-4 h-4" />
            </div>
            <span>Hyperlocal Incident Map</span>
          </h1>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
            Audit and track neighborhood risk zones and safety status live.
          </p>
        </div>

        {/* Map Provider Selector */}
        <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200/60 dark:border-slate-800/80 self-start sm:self-auto">
          <button
            onClick={() => setMapProvider('google')}
            disabled={!hasValidKey}
            className={`px-2.5 py-1.5 rounded-lg text-[9px] font-bold transition-all flex items-center gap-1 cursor-pointer border-0 ${
              mapProvider === 'google'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
                : 'text-slate-500 dark:text-slate-450 hover:text-slate-855 dark:hover:text-slate-200 bg-transparent disabled:opacity-50'
            }`}
          >
            Google Maps
          </button>
          <button
            onClick={() => setMapProvider('osm')}
            className={`px-2.5 py-1.5 rounded-lg text-[9px] font-bold transition-all flex items-center gap-1 cursor-pointer border-0 ${
              mapProvider === 'osm'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-450 hover:text-slate-855 dark:hover:text-slate-200 bg-transparent'
            }`}
          >
            OpenStreetMap (Free)
          </button>
        </div>
      </div>

      {/* Control Filters Bar - Hidden on Mobile Map View, shown on desktop */}
      <div className="hidden lg:flex bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 shadow-sm gap-4 items-center justify-between">
        <div className="relative w-72">
          <input
            id="map-search-input"
            type="text"
            placeholder="Search address or title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-850 dark:text-slate-200 text-xs rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:bg-white dark:focus:bg-slate-900 transition-all"
          />
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center space-x-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-2 py-1.5 rounded-xl text-slate-700 dark:text-slate-300">
            <Filter className="w-3 h-3 text-slate-400" />
            <select
              id="map-category-select"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as any)}
              className="bg-slate-50 dark:bg-slate-950 border-none text-[10px] font-bold focus:outline-none cursor-pointer text-slate-700 dark:text-slate-200"
            >
              <option value="All" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">All Categories</option>
              {CATEGORIES.filter(c => c !== 'All').map(cat => (
                <option key={cat} value={cat} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">{cat}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-2 py-1.5 rounded-xl text-slate-700 dark:text-slate-300">
            <Target className="w-3 h-3 text-slate-400" />
            <select
              id="map-status-select"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as any)}
              className="bg-slate-50 dark:bg-slate-950 border-none text-[10px] font-bold focus:outline-none cursor-pointer text-slate-700 dark:text-slate-200"
            >
              <option value="All" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">All Statuses</option>
              {STATUSES.filter(s => s !== 'All').map(stat => (
                <option key={stat} value={stat} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">{stat.replace('_', ' ')}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Map + List Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6 h-[500px] md:h-[600px] relative">
        
        {/* Desktop Sidebar Panel */}
        <div className="hidden lg:flex lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl p-4 shadow-sm flex-col h-full overflow-hidden">
          {/* Tab Selector */}
          <div className="flex space-x-1 p-1 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-850/80 mb-3.5">
            <button
              type="button"
              onClick={() => setSidebarTab('incidents')}
              className={`flex-1 py-1.5 rounded-lg text-[10px] font-black transition-all border-0 cursor-pointer ${
                sidebarTab === 'incidents'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-450 shadow-sm'
                  : 'text-slate-500 dark:text-slate-455 hover:text-slate-850 dark:hover:text-slate-200 bg-transparent'
              }`}
            >
              Incidents List ({filteredIssues.length})
            </button>
            <button
              type="button"
              onClick={() => setSidebarTab('zones')}
              className={`flex-1 py-1.5 rounded-lg text-[10px] font-black transition-all border-0 cursor-pointer ${
                sidebarTab === 'zones'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-450 shadow-sm'
                  : 'text-slate-500 dark:text-slate-455 hover:text-slate-850 dark:hover:text-slate-200 bg-transparent'
              }`}
            >
              Civic Zones ({formattedZones.length})
            </button>
          </div>

          {/* List contents scroll container */}
          <div className="flex-grow overflow-y-auto pr-1 space-y-2.5 scrollbar-thin">
            {sidebarTab === 'incidents' ? (
              filteredIssues.length === 0 ? (
                <div className="text-center py-12 text-slate-400 space-y-2">
                  <p className="text-xs">No incidents match search filters.</p>
                </div>
              ) : (
                filteredIssues.map((issue) => (
                  <IncidentCardRow
                    key={issue.id}
                    issue={issue}
                    onClick={() => handleFocusIssue(issue)}
                    isActive={activeMarkerIssue?.id === issue.id}
                  />
                ))
              )
            ) : (
              formattedZones.map((zone) => (
                <ZoneCardRow
                  key={zone.id}
                  zone={zone}
                  onClick={() => {
                    setSelectedZoneId(zone.id);
                    setMapCenter({ lat: zone.latitude, lng: zone.longitude });
                    setMapZoom(15);
                  }}
                  isActive={selectedZoneId === zone.id}
                />
              ))
            )}
          </div>
        </div>

        {/* Map Canvas and overlays */}
        <div className="col-span-1 lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl overflow-hidden shadow-sm h-full relative">
          {/* Locate Me Centering floating button */}
          <div className="absolute top-3 left-3 z-[400] flex flex-col gap-2">
            <button
              type="button"
              onClick={handleLocateUser}
              title="Track My Location"
              className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-805 dark:text-slate-100 p-2.5 rounded-xl shadow-md border border-slate-200/80 dark:border-slate-800/80 transition-all cursor-pointer flex items-center justify-center focus:outline-none"
            >
              <Target className="w-4 h-4 text-emerald-600 dark:text-emerald-450 animate-pulse" />
            </button>
            <button
              type="button"
              onClick={() => setShowZonesOverlay(!showZonesOverlay)}
              title={showZonesOverlay ? "Hide Safety Zones" : "Show Safety Zones"}
              className={`bg-white/95 dark:bg-slate-900/95 backdrop-blur-md hover:bg-slate-100 dark:hover:bg-slate-800 p-2.5 rounded-xl shadow-md border border-slate-200/80 dark:border-slate-800/80 transition-all cursor-pointer flex items-center justify-center focus:outline-none ${
                showZonesOverlay ? 'text-emerald-600 dark:text-emerald-400 ring-2 ring-emerald-500/10' : 'text-slate-400'
              }`}
            >
              <Shield className="w-4 h-4" />
            </button>
          </div>

          {/* Map canvas loading */}
          {mapProvider === 'osm' ? (
            <OpenStreetMapSection
              height="100%"
              center={mapCenter}
              zoom={mapZoom}
              markers={filteredIssues}
              hotspots={hotspots}
              onSelectIssue={onSelectIssue}
              userCoords={userCoords}
              zones={formattedZones}
              selectedZoneId={selectedZoneId}
              showZonesOverlay={showZonesOverlay}
            />
          ) : (
            <GoogleMapSection height="100%" fallbackMessage="To unlock the interactive incident map, connect your key. You will see markers mapped live and can trigger neighborhood coordinates directly.">
              <MapLoader 
                issues={filteredIssues}
                center={mapCenter}
                zoom={mapZoom}
                activeIssue={activeMarkerIssue}
                onSelectIssue={onSelectIssue}
                onMarkerClick={(issue) => setActiveMarkerIssue(issue)}
                onCloseInfoWindow={() => setActiveMarkerIssue(null)}
                categoryColors={CATEGORY_COLORS}
                userCoords={userCoords}
              />
            </GoogleMapSection>
          )}

          {/* Mobile Bottom Sheet Drawer overlay */}
          <div 
            className="lg:hidden absolute bottom-0 left-0 right-0 z-[400] bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 rounded-t-2xl shadow-[0_-4px_15px_rgba(0,0,0,0.15)] flex flex-col transition-all duration-300 ease-in-out overflow-hidden"
            style={{ height: mobileDrawerExpanded ? '75%' : '60px' }}
          >
            {/* Drawer Swipe Handle */}
            <div 
              className="w-full py-3.5 flex flex-col items-center justify-center cursor-pointer select-none bg-slate-50/50 dark:bg-slate-950/20 border-b border-slate-100 dark:border-slate-850/50"
              onClick={() => setMobileDrawerExpanded(!mobileDrawerExpanded)}
            >
              <div className="w-10 h-1 bg-slate-300 dark:bg-slate-700 rounded-full" />
              <span className="text-[9px] font-black text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-wider flex items-center gap-1">
                <span>🔍</span>
                {mobileDrawerExpanded ? 'Hide Wards & Issues' : `Incidents & Risk Zones (${filteredIssues.length})`}
              </span>
            </div>

            {/* Expanded Content */}
            {mobileDrawerExpanded && (
              <div className="flex-grow overflow-hidden flex flex-col p-4 space-y-3.5">
                {/* Filters */}
                <div className="flex gap-2">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value as any)}
                    className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-2 py-1.5 text-[9px] font-bold dark:text-slate-300 focus:outline-none"
                  >
                    <option value="All" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">All Categories</option>
                    {CATEGORIES.filter(c => c !== 'All').map(cat => (
                      <option key={cat} value={cat} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">{cat}</option>
                    ))}
                  </select>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value as any)}
                    className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-2 py-1.5 text-[9px] font-bold dark:text-slate-300 focus:outline-none"
                  >
                    <option value="All" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">All Statuses</option>
                    {STATUSES.filter(s => s !== 'All').map(stat => (
                      <option key={stat} value={stat} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">{stat.replace('_', ' ')}</option>
                    ))}
                  </select>
                </div>

                {/* Mobile Drawer Tabs */}
                <div className="flex space-x-1 p-0.5 bg-slate-100 dark:bg-slate-950 rounded-xl border border-slate-200/50 dark:border-slate-855/80">
                  <button
                    type="button"
                    onClick={() => setSidebarTab('incidents')}
                    className={`flex-1 py-1 rounded-lg text-[9px] font-black border-0 cursor-pointer ${
                      sidebarTab === 'incidents'
                        ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-450 shadow-sm'
                        : 'text-slate-500 dark:text-slate-455 bg-transparent'
                    }`}
                  >
                    Incidents ({filteredIssues.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setSidebarTab('zones')}
                    className={`flex-1 py-1 rounded-lg text-[9px] font-black border-0 cursor-pointer ${
                      sidebarTab === 'zones'
                        ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-450 shadow-sm'
                        : 'text-slate-500 dark:text-slate-455 bg-transparent'
                    }`}
                  >
                    Risk Zones ({formattedZones.length})
                  </button>
                </div>

                {/* Scrollable list */}
                <div className="flex-grow overflow-y-auto space-y-2">
                  {sidebarTab === 'incidents' ? (
                    filteredIssues.length === 0 ? (
                      <p className="text-center py-8 text-slate-400 text-[10px]">No active incidents.</p>
                    ) : (
                      filteredIssues.map((issue) => (
                        <IncidentCardRow
                          key={issue.id}
                          issue={issue}
                          onClick={() => {
                            handleFocusIssue(issue);
                            setMobileDrawerExpanded(false);
                          }}
                          isActive={activeMarkerIssue?.id === issue.id}
                        />
                      ))
                    )
                  ) : (
                    formattedZones.map((zone) => (
                      <ZoneCardRow
                        key={zone.id}
                        zone={zone}
                        onClick={() => {
                          setSelectedZoneId(zone.id);
                          setMapCenter({ lat: zone.latitude, lng: zone.longitude });
                          setMapZoom(15);
                          setMobileDrawerExpanded(false);
                        }}
                        isActive={selectedZoneId === zone.id}
                      />
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

/* Sidebar and Drawer Components Helper Card Rows */
interface IncidentCardRowProps {
  issue: Issue;
  onClick: () => void;
  isActive: boolean;
}

function IncidentCardRow({ issue, onClick, isActive }: IncidentCardRowProps) {
  const categoryEmojis: Record<string, string> = {
    'Pothole': '🕳️',
    'Garbage': '🗑️',
    'Water Leakage': '💧',
    'Streetlight': '💡',
    'Drainage': '🌊',
    'Road Damage': '🚧',
    'Public Safety': '⚠️',
    'Other': '📁'
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left p-3 rounded-2xl border bg-white dark:bg-slate-900 transition-all duration-200 cursor-pointer flex items-start gap-3 hover:-translate-y-0.5 hover:shadow-md relative group ${
        isActive 
          ? 'border-emerald-500 dark:border-emerald-500 ring-2 ring-emerald-500/10 shadow-[0_4px_20px_rgba(16,185,129,0.06)]' 
          : 'border-slate-100 dark:border-slate-800/80 hover:border-slate-350 dark:hover:border-slate-700 bg-white dark:bg-slate-900/50'
      }`}
    >
      {/* Left Column: Image Thumbnail or Emoji Icon */}
      <div className="flex-shrink-0">
        {issue.imageUrl ? (
          <img 
            src={issue.imageUrl} 
            alt={issue.title} 
            className="w-14 h-14 object-cover rounded-xl border border-slate-100 dark:border-slate-800 shadow-[0_1px_3px_rgba(0,0,0,0.02)]"
          />
        ) : (
          <div className="w-14 h-14 rounded-xl flex items-center justify-center text-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/50 dark:border-slate-800 shadow-[0_1px_2px_rgba(0,0,0,0.01)]">
            {categoryEmojis[issue.category] || '📁'}
          </div>
        )}
      </div>

      {/* Right Column: Title and details */}
      <div className="flex-grow min-w-0 space-y-1.5 pl-0.5">
        <div className="flex items-center justify-between gap-2.5">
          <span className="text-[9px] font-mono font-bold tracking-wider uppercase text-slate-400 dark:text-slate-400 truncate">
            {issue.category}
          </span>
          <Badge variant="severity" value={issue.severity}>
            {issue.severity}
          </Badge>
        </div>

        <h4 className="font-extrabold text-[12px] text-slate-900 dark:text-slate-100 leading-tight line-clamp-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
          {issue.title}
        </h4>

        <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1">
          📍 {issue.address}
        </p>

        <div className="flex items-center justify-between pt-1.5 border-t border-slate-100/50 dark:border-slate-850/50 text-[10px] text-slate-500 dark:text-slate-400">
          <div className="flex items-center space-x-2.5 font-semibold">
            <span>Score: <strong className="text-slate-800 dark:text-slate-200 font-bold">{issue.priorityScore}</strong></span>
            {issue.supporterCount !== undefined && (
              <span className="flex items-center gap-0.5 text-slate-400 dark:text-slate-500">
                ❤️ <span className="text-slate-600 dark:text-slate-400">{issue.supporterCount}</span>
              </span>
            )}
            {issue.verificationCount !== undefined && (
              <span className="flex items-center gap-0.5 text-slate-400 dark:text-slate-500">
                ✓ <span className="text-slate-600 dark:text-slate-400">{issue.verificationCount}</span>
              </span>
            )}
          </div>
          <Badge variant="status" value={issue.status}>
            {issue.status.replace('_', ' ')}
          </Badge>
        </div>
      </div>
    </button>
  );
}

interface ZoneCardRowProps {
  zone: OSMZone;
  onClick: () => void;
  isActive: boolean;
}

function ZoneCardRow({ zone, onClick, isActive }: ZoneCardRowProps) {
  const count = zone.activeIssuesCount;
  const isCritical = count >= 5;
  const isWarning = count >= 2 && count < 5;
  const riskLabel = isCritical ? 'High Risk' : isWarning ? 'Moderate' : 'Safe Zone';
  const colorClass = isCritical ? 'text-rose-600 bg-rose-50 dark:bg-rose-905/20 border-rose-200 dark:border-rose-900/30' :
                     isWarning ? 'text-amber-600 bg-amber-50 dark:bg-amber-905/20 border-amber-200 dark:border-amber-900/30' :
                     'text-emerald-600 bg-emerald-50 dark:bg-emerald-905/20 border-emerald-200 dark:border-emerald-900/30';
  
  const barColor = isCritical ? 'bg-red-500' : isWarning ? 'bg-amber-500' : 'bg-emerald-500';

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left p-3.5 rounded-2xl border bg-white dark:bg-slate-900 transition-all duration-200 cursor-pointer flex flex-col gap-2.5 hover:-translate-y-0.5 hover:shadow-md relative group ${
        isActive 
          ? 'border-emerald-500 dark:border-emerald-500 ring-2 ring-emerald-500/10 shadow-[0_4px_20px_rgba(16,185,129,0.06)]' 
          : 'border-slate-100 dark:border-slate-800/80 hover:border-slate-350 dark:hover:border-slate-700 bg-white dark:bg-slate-900/50'
      }`}
    >
      <div className="flex items-start justify-between gap-3 w-full">
        <div className="min-w-0">
          <h4 className="font-extrabold text-[12px] text-slate-900 dark:text-slate-100 line-clamp-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
            🏢 {zone.name}
          </h4>
          <p className="text-[10px] text-slate-400 dark:text-slate-400">{zone.areaName}</p>
        </div>
        <span className={`text-[8px] font-black px-1.5 py-0.5 rounded border tracking-wide uppercase ${colorClass}`}>
          {riskLabel}
        </span>
      </div>

      <div className="space-y-1.5 w-full pt-1.5 border-t border-slate-100/50 dark:border-slate-850/50">
        <div className="flex items-center justify-between text-[9px]">
          <span className="text-slate-500 dark:text-slate-400">Health Index: <strong className="text-slate-800 dark:text-slate-200 font-bold">{zone.healthScore}%</strong></span>
          <span className="text-slate-500 dark:text-slate-400">Incidents: <strong className="text-slate-800 dark:text-slate-200 font-bold">{count}</strong></span>
        </div>
        <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner">
          <div className={`h-full ${barColor} transition-all rounded-full`} style={{ width: `${zone.healthScore}%` }} />
        </div>
      </div>
    </button>
  );
}

// Sub-component that actually loads when Google Maps is validated successfully
interface MapLoaderProps {
  issues: Issue[];
  center: { lat: number; lng: number };
  zoom: number;
  activeIssue: Issue | null;
  onSelectIssue: (issueId: string) => void;
  onMarkerClick: (issue: Issue) => void;
  onCloseInfoWindow: () => void;
  categoryColors: Record<IssueCategory, string>;
  userCoords?: { lat: number; lng: number } | null;
}

function MapLoader({
  issues,
  center,
  zoom,
  activeIssue,
  onSelectIssue,
  onMarkerClick,
  onCloseInfoWindow,
  categoryColors,
  userCoords
}: MapLoaderProps) {
  const map = useMap();

  useEffect(() => {
    if (map && center) {
      map.panTo(center);
    }
  }, [map, center]);

  return (
    <GMap
      defaultCenter={center}
      defaultZoom={zoom}
      mapId="DEMO_MAP_ID"
      internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
      style={{ width: '100%', height: '100%' }}
      gestureHandling="cooperative"
      disableDefaultUI={false}
    >
      {issues.map((issue) => {
        const color = categoryColors[issue.category] || '#10B981';
        return (
          <AdvancedMarker
            key={issue.id}
            position={{ lat: issue.latitude, lng: issue.longitude }}
            title={issue.title}
            onClick={() => onMarkerClick(issue)}
          >
            <Pin 
              background={color} 
              borderColor="#FFFFFF" 
              glyphColor="#FFFFFF"
              scale={activeIssue?.id === issue.id ? 1.2 : 1.0}
            />
          </AdvancedMarker>
        );
      })}

      {userCoords && (
        <AdvancedMarker
          position={{ lat: userCoords.lat, lng: userCoords.lng }}
          title="You Are Here"
        >
          <div className="relative flex items-center justify-center pointer-events-none">
            <div className="absolute w-8 h-8 rounded-full bg-blue-500/30 animate-user-pulse"></div>
            <div className="relative w-4 h-4 rounded-full bg-blue-600 border-2 border-white shadow-md"></div>
          </div>
        </AdvancedMarker>
      )}

      {activeIssue && (
        <InfoWindow
          position={{ lat: activeIssue.latitude, lng: activeIssue.longitude }}
          onCloseClick={onCloseInfoWindow}
          headerDisabled={true}
        >
          <div className="p-2 max-w-[220px] space-y-2 text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900 rounded-lg">
            {activeIssue.imageUrl && (
              <div className="h-24 w-full rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800">
                <img 
                  src={activeIssue.imageUrl} 
                  alt={activeIssue.title} 
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[9px] font-mono">
                <span className="font-extrabold uppercase text-emerald-700 dark:text-emerald-455 bg-emerald-50 dark:bg-emerald-950/40 px-1 py-0.2 rounded">
                  {activeIssue.category}
                </span>
                <span className="font-bold text-rose-600 dark:text-rose-400">
                  Priority: {activeIssue.priorityScore}
                </span>
              </div>

              <h4 className="font-extrabold text-xs text-slate-900 dark:text-slate-100 leading-tight">
                {activeIssue.title}
              </h4>
              
              <p className="text-[10px] text-slate-550 dark:text-slate-400 line-clamp-1 leading-snug">
                {activeIssue.address}
              </p>
            </div>

            <button
              onClick={() => onSelectIssue(activeIssue.id)}
              className="w-full py-1.5 bg-slate-900 dark:bg-slate-800 text-white dark:text-slate-100 rounded-lg text-[10px] font-bold hover:bg-slate-800 dark:hover:bg-slate-700 transition-all flex items-center justify-center gap-1 cursor-pointer border-0"
            >
              <span>View Full Incident</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </InfoWindow>
      )}
    </GMap>
  );
}
