import React, { useState, useEffect, useRef } from 'react';
import { Map as GMap, AdvancedMarker, InfoWindow, Pin, useMap } from '@vis.gl/react-google-maps';
import { Map as MapIcon, Filter, AlertTriangle, Shield, CheckCircle, Search, Target, ChevronRight, Sparkles, Compass } from 'lucide-react';
import { Issue, IssueCategory, IssueStatus } from '../../../types';
import { GoogleMapSection, hasValidKey } from './GoogleMapSection';
import OpenStreetMapSection from './OpenStreetMapSection';

interface MapExplorerProps {
  issues: Issue[];
  onSelectIssue: (issueId: string) => void;
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

// Custom color mappings for issue categories on the map
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

export default function MapExplorer({ issues, onSelectIssue }: MapExplorerProps) {
  const [selectedCategory, setSelectedCategory] = useState<IssueCategory | 'All'>('All');
  const [selectedStatus, setSelectedStatus] = useState<IssueStatus | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeMarkerIssue, setActiveMarkerIssue] = useState<Issue | null>(null);
  const [mapProvider, setMapProvider] = useState<'google' | 'osm'>('osm');
  
  // Center coordinates (Pune default, based on mock data coordinate ranges)
  const defaultCenter = { lat: 18.545, lng: 73.815 };
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [mapZoom, setMapZoom] = useState(13);

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

  // Center map on a specific issue and open its info window
  const handleFocusIssue = (issue: Issue) => {
    setMapCenter({ lat: issue.latitude, lng: issue.longitude });
    setMapZoom(15);
    setActiveMarkerIssue(issue);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-950 font-sans tracking-tight flex items-center space-x-2">
            <div className="p-1.5 bg-emerald-50 rounded-lg text-emerald-600">
              <MapIcon className="w-5 h-5" />
            </div>
            <span>Hyperlocal Incident Map</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Browse and coordinate civic audits across your local spaces visually.
          </p>
        </div>

        {/* Map Provider Selector */}
        <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl border border-slate-200/60 self-start sm:self-auto">
          <button
            onClick={() => setMapProvider('google')}
            disabled={!hasValidKey}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
              mapProvider === 'google'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 disabled:opacity-50'
            }`}
          >
            Google Maps
          </button>
          <button
            onClick={() => setMapProvider('osm')}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
              mapProvider === 'osm'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            OpenStreetMap (Free)
          </button>
        </div>
      </div>

      {/* Control Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-72">
          <input
            id="map-search-input"
            type="text"
            placeholder="Search address or title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/15 focus:border-emerald-500"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto md:justify-end">
          <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-150 px-2.5 py-1.5 rounded-xl text-slate-700">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              id="map-category-select"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as any)}
              className="bg-transparent border-none text-[11px] font-semibold focus:outline-none cursor-pointer"
            >
              <option value="All">All Categories</option>
              {CATEGORIES.filter(c => c !== 'All').map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-150 px-2.5 py-1.5 rounded-xl text-slate-700">
            <Target className="w-3.5 h-3.5 text-slate-400" />
            <select
              id="map-status-select"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as any)}
              className="bg-transparent border-none text-[11px] font-semibold focus:outline-none cursor-pointer"
            >
              <option value="All">All Statuses</option>
              {STATUSES.filter(s => s !== 'All').map(stat => (
                <option key={stat} value={stat}>{stat.replace('_', ' ')}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Map + List Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left Side: Interactive Sidebar of Filtered Incidents */}
        <div className="lg:col-span-1 bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col h-[500px]">
          <h3 className="font-bold text-slate-900 text-xs mb-3 flex items-center justify-between">
            <span>Incidents List</span>
            <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-[9px] font-mono">
              {filteredIssues.length} matches
            </span>
          </h3>

          <div className="flex-grow overflow-y-auto pr-1 space-y-2 scrollbar-thin">
            {filteredIssues.length === 0 ? (
              <div className="text-center py-12 text-slate-400 space-y-2">
                <p className="text-xs">No incidents match your current search/filters.</p>
              </div>
            ) : (
              filteredIssues.map((issue) => {
                const color = CATEGORY_COLORS[issue.category] || '#10B981';
                return (
                  <button
                    key={issue.id}
                    onClick={() => handleFocusIssue(issue)}
                    className={`w-full text-left p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer flex gap-3 group relative ${
                      activeMarkerIssue?.id === issue.id ? 'ring-2 ring-emerald-500/20 border-emerald-500 bg-slate-50' : ''
                    }`}
                  >
                    {/* Tiny category accent line */}
                    <div className="absolute left-0 top-3 bottom-3 w-1 rounded-r-lg" style={{ backgroundColor: color }} />

                    <div className="flex-grow pl-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-slate-400">
                          {issue.category}
                        </span>
                        <span className={`text-[8px] px-1.5 py-0.5 rounded font-bold font-mono tracking-wider ${
                          issue.severity === 'Critical' ? 'bg-red-50 text-red-700 border border-red-100' :
                          issue.severity === 'High' ? 'bg-amber-50 text-amber-700 border border-amber-100' : 'bg-blue-50 text-blue-700 border border-blue-100'
                        }`}>
                          {issue.severity}
                        </span>
                      </div>

                      <h4 className="font-bold text-xs text-slate-900 line-clamp-1 group-hover:text-emerald-700 transition-colors">
                        {issue.title}
                      </h4>

                      <p className="text-[10px] text-slate-400 line-clamp-1">
                        {issue.address}
                      </p>

                      <div className="flex items-center justify-between pt-1 text-[10px] text-slate-500">
                        <span>Score: <strong className="text-slate-800">{issue.priorityScore}</strong></span>
                        <span className="font-mono text-[9px] text-emerald-600 bg-emerald-50 px-1 py-0.2 rounded font-bold uppercase">
                          {issue.status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Map Canvas */}
        <div className="lg:col-span-3 bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm h-[500px] relative">
          {mapProvider === 'osm' ? (
            <OpenStreetMapSection
              height="100%"
              center={mapCenter}
              zoom={mapZoom}
              markers={filteredIssues}
              onSelectIssue={onSelectIssue}
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
              />
            </GoogleMapSection>
          )}
        </div>

      </div>
    </div>
  );
}

// Sub-component that actually loads when the API key is validated successfully
interface MapLoaderProps {
  issues: Issue[];
  center: { lat: number; lng: number };
  zoom: number;
  activeIssue: Issue | null;
  onSelectIssue: (issueId: string) => void;
  onMarkerClick: (issue: Issue) => void;
  onCloseInfoWindow: () => void;
  categoryColors: Record<IssueCategory, string>;
}

function MapLoader({
  issues,
  center,
  zoom,
  activeIssue,
  onSelectIssue,
  onMarkerClick,
  onCloseInfoWindow,
  categoryColors
}: MapLoaderProps) {
  const map = useMap();

  // Handle map centering when center coordinates prop changes
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

      {activeIssue && (
        <InfoWindow
          position={{ lat: activeIssue.latitude, lng: activeIssue.longitude }}
          onCloseClick={onCloseInfoWindow}
          headerDisabled={true}
        >
          <div className="p-2 max-w-[220px] space-y-2 text-slate-800">
            {activeIssue.imageUrl && (
              <div className="h-24 w-full rounded-lg overflow-hidden bg-slate-100">
                <img 
                  src={activeIssue.imageUrl} 
                  alt={activeIssue.title} 
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[9px] font-mono">
                <span className="font-extrabold uppercase text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded">
                  {activeIssue.category}
                </span>
                <span className="font-bold text-rose-600">
                  Priority: {activeIssue.priorityScore}
                </span>
              </div>

              <h4 className="font-extrabold text-xs text-slate-900 leading-tight">
                {activeIssue.title}
              </h4>
              
              <p className="text-[10px] text-slate-500 line-clamp-1 leading-snug">
                {activeIssue.address}
              </p>
            </div>

            <button
              onClick={() => onSelectIssue(activeIssue.id)}
              className="w-full py-1.5 bg-slate-900 text-white rounded-lg text-[10px] font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-1 cursor-pointer"
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
