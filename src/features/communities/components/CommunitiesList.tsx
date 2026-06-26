import React, { useState, useEffect } from 'react';
import { Search, Plus, MapPin, Users, Award, Building2, Eye, Lock, Globe, Sparkles } from 'lucide-react';
import { Community, User } from '../../../types';
import CustomModal from '../../../components/Modal';
import { useInfiniteScroll } from '../../../hooks/useInfiniteScroll';
import { getDistanceMeters } from '../../../lib/geoUtils';
import { COMMUNITY_PRESET_COVERS, COMMUNITY_PRESET_LOGOS } from '../../../lib/constants';

interface CommunitiesListProps {
  communities: Community[];
  joinedIds: string[];
  onJoin: (id: string) => void;
  onLeave: (id: string) => void;
  onCreate: (community: Omit<Community, 'id' | 'memberIds' | 'reputationScore' | 'totalIssues' | 'resolvedIssues' | 'createdAt' | 'updatedAt' | 'coverImageUrl' | 'logoUrl'> & { coverImageUrl?: string; logoUrl?: string }) => void;
  selectedCommunityId: string;
  setSelectedCommunityId: (id: string) => void;
  userCoords?: { lat: number; lng: number } | null;
  currentUser: User | null;
}

export default function CommunitiesList({
  communities,
  joinedIds,
  onJoin,
  onLeave,
  onCreate,
  selectedCommunityId,
  setSelectedCommunityId,
  userCoords,
  currentUser
}: CommunitiesListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'joined'>('all');
  const [locationFilter, setLocationFilter] = useState<'all' | 'nearby_5' | 'nearby_15' | 'city'>('all');
  const [visibleCount, setVisibleCount] = useState(6);

  useEffect(() => {
    setVisibleCount(6);
  }, [searchTerm, filterTab, locationFilter]);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [alertModalOpen, setAlertModalOpen] = useState(false);
  const [alertModalMessage, setAlertModalMessage] = useState('');
  const [alertModalTitle, setAlertModalTitle] = useState('Validation Error');
  const [alertModalType, setAlertModalType] = useState<'error' | 'success' | 'info'>('error');
  const [newComm, setNewComm] = useState({
    name: '',
    type: 'Housing Society' as Community['type'],
    description: '',
    areaName: '',
    latitude: userCoords?.lat || 19.9615,
    longitude: userCoords?.lng || 79.2961,
    createdBy: currentUser?.id || 'user_1',
    adminIds: currentUser ? [currentUser.id] : ['user_1'],
    privacy: 'PUBLIC' as 'PUBLIC' | 'PRIVATE',
    coverImageUrl: COMMUNITY_PRESET_COVERS[0],
    logoUrl: COMMUNITY_PRESET_LOGOS[0]
  });

  useEffect(() => {
    const cityCoords: Record<string, { lat: number; lng: number }> = {
      pune: { lat: 18.5204, lng: 73.8567 },
      mumbai: { lat: 19.0760, lng: 72.8777 },
      bangalore: { lat: 12.9716, lng: 77.5946 },
      delhi: { lat: 28.6139, lng: 77.2090 },
      chennai: { lat: 13.0827, lng: 80.2707 },
      chandrapur: { lat: 19.9615, lng: 79.2961 }
    };
    const userCity = (currentUser?.city || 'Chandrapur').toLowerCase();
    const fallbackCoords = cityCoords[userCity] || cityCoords['chandrapur'];

    setNewComm(prev => ({
      ...prev,
      latitude: userCoords?.lat || fallbackCoords.lat,
      longitude: userCoords?.lng || fallbackCoords.lng,
      createdBy: currentUser?.id || 'user_1',
      adminIds: currentUser ? [currentUser.id] : ['user_1']
    }));
  }, [userCoords, currentUser]);

  const handleTypeChange = (type: Community['type']) => {
    let cover = COMMUNITY_PRESET_COVERS[0];
    let logo = COMMUNITY_PRESET_LOGOS[0];
    if (type === 'Campus') {
      cover = COMMUNITY_PRESET_COVERS[1];
      logo = COMMUNITY_PRESET_LOGOS[2];
    } else if (type === 'Ward' || type === 'Village') {
      cover = COMMUNITY_PRESET_COVERS[2];
      logo = COMMUNITY_PRESET_LOGOS[1];
    } else if (type === 'Street') {
      cover = COMMUNITY_PRESET_COVERS[3];
      logo = COMMUNITY_PRESET_LOGOS[3];
    } else if (type === 'Apartment') {
      cover = COMMUNITY_PRESET_COVERS[0];
      logo = COMMUNITY_PRESET_LOGOS[0];
    } else if (type === 'Market') {
      cover = COMMUNITY_PRESET_COVERS[5];
      logo = COMMUNITY_PRESET_LOGOS[4];
    } else if (type === 'Other') {
      cover = COMMUNITY_PRESET_COVERS[4];
      logo = COMMUNITY_PRESET_LOGOS[5];
    }
    setNewComm(prev => ({
      ...prev,
      type,
      coverImageUrl: cover,
      logoUrl: logo
    }));
  };

  // Filter list
  const filtered = communities.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      c.areaName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.type.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;
    
    if (filterTab === 'joined' && !joinedIds.includes(c.id)) {
      return false;
    }

    const userCity = currentUser?.city || currentUser?.district || 'Chandrapur';
    if (locationFilter === 'nearby_5') {
      if (!userCoords) return false;
      const dist = getDistanceMeters(userCoords.lat, userCoords.lng, c.latitude, c.longitude);
      if (dist > 5000) return false;
    } else if (locationFilter === 'nearby_15') {
      if (!userCoords) return false;
      const dist = getDistanceMeters(userCoords.lat, userCoords.lng, c.latitude, c.longitude);
      if (dist > 15000) return false;
    } else if (locationFilter === 'city') {
      const isMatch = c.areaName.toLowerCase().includes(userCity.toLowerCase()) || 
        (c.city && c.city.toLowerCase() === userCity.toLowerCase());
      if (!isMatch) return false;
    }

    return true;
  });

  const lastElementRef = useInfiniteScroll({
    onLoadMore: () => setVisibleCount(prev => prev + 6),
    hasMore: visibleCount < filtered.length,
    isLoading: false
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComm.name.trim() || !newComm.areaName.trim() || !newComm.description.trim()) {
      setAlertModalMessage('Please fill out all fields of the community space.');
      setAlertModalOpen(true);
      return;
    }
    onCreate(newComm);
    setShowCreateModal(false);
    const cityCoords: Record<string, { lat: number; lng: number }> = {
      pune: { lat: 18.5204, lng: 73.8567 },
      mumbai: { lat: 19.0760, lng: 72.8777 },
      bangalore: { lat: 12.9716, lng: 77.5946 },
      delhi: { lat: 28.6139, lng: 77.2090 },
      chennai: { lat: 13.0827, lng: 80.2707 },
      chandrapur: { lat: 19.9615, lng: 79.2961 }
    };
    const userCity = (currentUser?.city || 'Chandrapur').toLowerCase();
    const fallbackCoords = cityCoords[userCity] || cityCoords['chandrapur'];

    setNewComm({
      name: '',
      type: 'Housing Society',
      description: '',
      areaName: '',
      latitude: userCoords?.lat || fallbackCoords.lat,
      longitude: userCoords?.lng || fallbackCoords.lng,
      createdBy: currentUser?.id || 'user_1',
      adminIds: currentUser ? [currentUser.id] : ['user_1'],
      privacy: 'PUBLIC',
      coverImageUrl: COMMUNITY_PRESET_COVERS[0],
      logoUrl: COMMUNITY_PRESET_LOGOS[0]
    });
  };

  const handleJoinClick = (comm: Community) => {
    onJoin(comm.id);
    if (comm.privacy === 'PRIVATE') {
      setAlertModalTitle('Join Request Submitted');
      setAlertModalMessage(`Your request to join "${comm.name}" has been sent to the space administrators. You will be notified once they review it.`);
      setAlertModalType('info');
      setAlertModalOpen(true);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Title & Action banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 font-sans tracking-tight">Community Spaces</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Create, explore, or join neighborhood workspaces and cooperative zones.</p>
        </div>
        <button 
          id="btn-trigger-create-comm"
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2.5 bg-emerald-600 text-white font-semibold rounded-xl text-sm shadow hover:bg-emerald-500 transition-all flex items-center justify-center space-x-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Community Space</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
          <input 
            id="search-communities-input"
            type="text" 
            placeholder="Search spaces by name, category, or locality..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-850 dark:text-slate-200 text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto overflow-x-auto whitespace-nowrap py-0.5">
          {/* Location Filter Selector */}
          <div className="flex items-center space-x-1.5 bg-slate-50 dark:bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-350">
            <MapPin className="w-3.5 h-3.5 text-emerald-500" />
            <select
              id="comm-location-select"
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value as any)}
              className="bg-slate-50 dark:bg-slate-950 border-none outline-none cursor-pointer text-slate-750 dark:text-slate-200 font-bold focus:ring-0 pr-5"
            >
              <option value="all" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">All Locations</option>
              {userCoords && (
                <>
                  <option value="nearby_5" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Within 5 km</option>
                  <option value="nearby_15" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Within 15 km</option>
                </>
              )}
              <option value="city" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">My City ({currentUser?.city || currentUser?.district || 'Chandrapur'})</option>
            </select>
          </div>

          <button 
            id="filter-comm-all"
            onClick={() => setFilterTab('all')} 
            className={`px-4 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer border shadow-sm ${
              filterTab === 'all' 
                ? 'bg-emerald-600 border-emerald-650 text-white' 
                : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-655 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900'
            }`}
          >
            All Spaces ({communities.length})
          </button>
          <button 
            id="filter-comm-joined"
            onClick={() => setFilterTab('joined')} 
            className={`px-4 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer border shadow-sm ${
              filterTab === 'joined' 
                ? 'bg-emerald-600 border-emerald-655 text-white' 
                : 'bg-slate-50 dark:bg-slate-955 border-slate-200 dark:border-slate-800 text-slate-655 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900'
            }`}
          >
            Joined ({joinedIds.length})
          </button>
        </div>
      </div>

      {/* Grid of Communities */}
      {(() => {
        if (filtered.length === 0) {
          return (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center max-w-md mx-auto shadow-sm animate-scale-up">
              <div className="w-12 h-12 rounded-full bg-slate-105 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4 text-slate-400">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1">No spaces found</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {filterTab === 'joined' 
                  ? "You haven't joined any community spaces yet. Try browsing All Spaces!"
                  : "No spaces match your search criteria. Try using different keywords."}
              </p>
            </div>
          );
        }

        const displayed = filtered.slice(0, visibleCount);

        return (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {displayed.map((community, idx) => {
              const isJoined = joinedIds.includes(community.id);
              const isActive = selectedCommunityId === community.id;
              const isLast = idx === displayed.length - 1;

              return (
                <div 
                  key={community.id} 
                  ref={isLast ? lastElementRef : undefined}
                  className={`bg-white dark:bg-slate-900 rounded-2xl border transition-all flex flex-col justify-between overflow-hidden shadow-sm hover:shadow dark:shadow-none ${
                    isActive ? 'border-emerald-600 ring-2 ring-emerald-500/10' : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex flex-col flex-grow">
                    {/* Cover Banner */}
                    <div className="h-26 relative bg-slate-100 dark:bg-slate-950 overflow-hidden">
                      <img 
                        src={community.coverImageUrl || COMMUNITY_PRESET_COVERS[0]} 
                        alt={community.name} 
                        className="w-full h-full object-cover" 
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-slate-900/10 to-transparent" />
                      
                      {/* Top Badges */}
                      <div className="absolute top-2.5 left-2.5 flex gap-1 z-10">
                        <span className="bg-emerald-600/95 backdrop-blur-sm text-white text-[8px] font-bold font-mono px-1.5 py-0.5 rounded uppercase shadow-sm">
                          {community.type}
                        </span>
                        <span className="bg-slate-900/80 backdrop-blur-sm text-slate-200 text-[8px] font-bold font-mono px-1.5 py-0.5 rounded uppercase flex items-center gap-0.5 shadow-sm">
                          {community.privacy === 'PRIVATE' ? <Lock className="w-2 h-2" /> : <Globe className="w-2 h-2" />}
                          {community.privacy || 'PUBLIC'}
                        </span>
                      </div>

                      {/* Distance Badge */}
                      {(() => {
                        if (!userCoords) return null;
                        const distanceMeters = getDistanceMeters(
                          userCoords.lat,
                          userCoords.lng,
                          community.latitude,
                          community.longitude
                        );
                        const distanceStr = distanceMeters > 1000 
                          ? `${(distanceMeters / 1000).toFixed(1)} km` 
                          : `${Math.round(distanceMeters)}m`;
                        return (
                          <span className="absolute top-2.5 right-2.5 bg-white/95 dark:bg-slate-900/95 text-slate-800 dark:text-slate-200 text-[8px] font-bold px-1.5 py-0.5 rounded shadow-sm flex items-center gap-0.5">
                            <MapPin className="w-2.5 h-2.5 text-rose-500" />
                            {distanceStr}
                          </span>
                        );
                      })()}
                    </div>

                    {/* Overlapping Avatar and Reputation Info */}
                    <div className="relative px-4 pt-8 pb-1.5">
                      <div className="absolute -top-6 left-4">
                        <img 
                          src={community.logoUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(community.name)}`}
                          alt={`${community.name} logo`}
                          className="w-12 h-12 rounded-xl object-cover border-2 border-white dark:border-slate-900 shadow bg-slate-50 dark:bg-slate-800"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="flex justify-end">
                        <div className="text-right">
                          <span className="block text-sm font-extrabold text-emerald-600 leading-none">{community.reputationScore}%</span>
                          <span className="text-[8px] text-slate-400 dark:text-slate-500 font-mono tracking-wider uppercase">Health Rating</span>
                        </div>
                      </div>
                    </div>

                    {/* Content Section */}
                    <div className="px-4 pb-4 flex-grow flex flex-col justify-between">
                      <div>
                        <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm mb-1.5 hover:text-emerald-600 dark:hover:text-emerald-450 cursor-pointer line-clamp-1" onClick={() => setSelectedCommunityId(community.id)}>
                          {community.name}
                        </h3>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mb-3.5 leading-relaxed">
                          {community.description}
                        </p>
                      </div>

                      <div className="space-y-1.5 border-t border-slate-100 dark:border-slate-800/80 pt-3 text-slate-400 dark:text-slate-500 text-[11px] font-medium">
                        <div className="flex items-center space-x-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-350 dark:text-slate-600 flex-shrink-0" />
                          <span className="truncate">{community.areaName}</span>
                        </div>
                        <div className="flex items-center space-x-1.5">
                          <Users className="w-3.5 h-3.5 text-slate-350 dark:text-slate-600 flex-shrink-0" />
                          <span>{community.memberIds.length + (isJoined && !community.memberIds.includes('user_1') ? 1 : 0)} Active Contributors</span>
                        </div>
                        <div className="flex items-center space-x-1.5">
                          <Award className="w-3.5 h-3.5 text-slate-350 dark:text-slate-600 flex-shrink-0" />
                          <span>{community.resolvedIssues}/{community.totalIssues} Resolved Issues</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Bar */}
                  <div className="bg-slate-50 dark:bg-slate-900/60 px-4 py-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <button 
                      id={`btn-toggle-active-${community.id}`}
                      onClick={() => setSelectedCommunityId(community.id)}
                      className={`text-[11px] font-bold flex items-center space-x-1 transition-colors ${
                        isActive ? 'text-emerald-600' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                      }`}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>{isActive ? 'Active Space' : 'View Space'}</span>
                    </button>

                    {isJoined ? (
                      <button 
                        id={`btn-leave-${community.id}`}
                        onClick={() => onLeave(community.id)}
                        className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 transition-colors cursor-pointer"
                      >
                        Leave Space
                      </button>
                    ) : community.pendingMemberRequests?.includes(currentUser?.id || '') ? (
                      <button 
                        id={`btn-pending-${community.id}`}
                        disabled
                        className="px-2.5 py-1 bg-amber-50/60 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 text-[11px] font-bold rounded-lg cursor-not-allowed border border-amber-200/50 dark:border-amber-900/30"
                      >
                        Pending Approval
                      </button>
                    ) : (
                      <button 
                        id={`btn-join-${community.id}`}
                        onClick={() => handleJoinClick(community)}
                        className="px-2.5 py-1.5 bg-emerald-600 text-white text-[11px] font-bold rounded-lg hover:bg-emerald-500 transition-all shadow-sm cursor-pointer"
                      >
                        {community.privacy === 'PRIVATE' ? 'Request Join' : 'Join Space'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })()}

      {/* New Community Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl w-full max-w-lg overflow-hidden animate-scale-up">
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-950/60 border-b border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 dark:text-slate-100">Establish New Community Space</h3>
              <button 
                id="btn-close-create-modal"
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 dark:text-slate-500 hover:text-slate-655 dark:hover:text-slate-400 text-sm font-bold font-mono"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-655 dark:text-slate-400 uppercase tracking-wider mb-1.5">Space Name</label>
                <input 
                  id="modal-comm-name"
                  type="text" 
                  placeholder="e.g. Green Park Society, Ward 12"
                  value={newComm.name}
                  onChange={(e) => setNewComm({ ...newComm, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 placeholder:text-slate-450 dark:placeholder:text-slate-600"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-655 dark:text-slate-400 uppercase tracking-wider mb-1.5">Space Type</label>
                  <select 
                    id="modal-comm-type"
                    value={newComm.type}
                    onChange={(e) => handleTypeChange(e.target.value as Community['type'])}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="Apartment" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Apartment</option>
                    <option value="Housing Society" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Housing Society</option>
                    <option value="Street" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Street</option>
                    <option value="Ward" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Ward</option>
                    <option value="Village" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Village</option>
                    <option value="Campus" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Campus</option>
                    <option value="Market" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Market</option>
                    <option value="Other" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-655 dark:text-slate-400 uppercase tracking-wider mb-1.5">Privacy Type</label>
                  <select 
                    id="modal-comm-privacy"
                    value={newComm.privacy}
                    onChange={(e) => setNewComm({ ...newComm, privacy: e.target.value as 'PUBLIC' | 'PRIVATE' })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="PUBLIC" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Public (Anyone can join)</option>
                    <option value="PRIVATE" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Private (Requires Approval)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-655 dark:text-slate-400 uppercase tracking-wider mb-1.5 font-sans">Locality / Area Name</label>
                <input 
                  id="modal-comm-area"
                  type="text" 
                  placeholder="e.g. Ward 3, Chandrapur"
                  value={newComm.areaName}
                  onChange={(e) => setNewComm({ ...newComm, areaName: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 placeholder:text-slate-450 dark:placeholder:text-slate-600"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-655 dark:text-slate-400 uppercase tracking-wider mb-1.5">Customize Cover Banner</label>
                  <div className="flex gap-1.5 overflow-x-auto py-1 max-w-full">
                    {COMMUNITY_PRESET_COVERS.map((url, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setNewComm({ ...newComm, coverImageUrl: url })}
                        className={`w-14 h-9 rounded overflow-hidden border-2 flex-shrink-0 transition-all ${
                          newComm.coverImageUrl === url ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        <img src={url} alt={`Cover ${idx}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-655 dark:text-slate-400 uppercase tracking-wider mb-1.5">Customize Logo Avatar</label>
                  <div className="flex gap-1.5 overflow-x-auto py-1 max-w-full">
                    {COMMUNITY_PRESET_LOGOS.map((url, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setNewComm({ ...newComm, logoUrl: url })}
                        className={`w-9 h-9 rounded-lg overflow-hidden border-2 flex-shrink-0 transition-all ${
                          newComm.logoUrl === url ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        <img src={url} alt={`Logo ${idx}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-655 dark:text-slate-400 uppercase tracking-wider mb-1.5">Workspace Description</label>
                <textarea 
                  id="modal-comm-desc"
                  rows={3}
                  placeholder="Describe the workspace boundary, members, and purpose of this civic space..."
                  value={newComm.description}
                  onChange={(e) => setNewComm({ ...newComm, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none placeholder:text-slate-400 dark:placeholder:text-slate-600"
                  required
                />
              </div>

              <div className="bg-emerald-50/50 dark:bg-emerald-950/20 p-3 rounded-lg border border-emerald-100 dark:border-emerald-900/40 text-[11px] text-emerald-800 dark:text-emerald-300 flex items-start space-x-2">
                <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                <span>Creating a space registers you as the founder and primary administrator. You can approve members, update progress logs, and coordinate resolutions.</span>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button 
                  id="modal-cancel-btn"
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-655 dark:text-slate-300 font-semibold rounded-lg text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  id="modal-create-btn"
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 text-white font-semibold rounded-lg text-xs hover:bg-emerald-500 transition-colors cursor-pointer"
                >
                  Create Space
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <CustomModal
        isOpen={alertModalOpen}
        onClose={() => {
          setAlertModalOpen(false);
          setAlertModalMessage('');
        }}
        title={alertModalTitle}
        message={alertModalMessage}
        type={alertModalType}
      />
    </div>
  );
}
