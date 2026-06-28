import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MapPin, Shield, Edit3, Save, Calendar, Flame, Award, AlertTriangle
} from 'lucide-react';
import { User, Community, Issue, Comment, UserActivity, FeedPost, UserRole } from '../../../types';
import { getLevelInfo, getUserBadges } from '../../feed/utils';
import { PRESET_COVERS, CITIES_MAPPING } from '../../../lib/constants';
import ActivityTab from './tabs/ActivityTab';
import ReportsTab from './tabs/ReportsTab';
import CommunitiesTab from './tabs/CommunitiesTab';
import SupportedTab from './tabs/SupportedTab';
import CommentsTab from './tabs/CommentsTab';
import BadgesTab from './tabs/BadgesTab';
import SavedTab from './tabs/SavedTab';
import { Badge } from '../../../components/ui/Badge';

interface ProfilePageProps {
  user: User;
  issues: Issue[];
  communities: Community[];
  comments: Comment[];
  activities: UserActivity[];
  onUpdateProfile: (updates: Partial<User>) => Promise<void>;
  onSelectIssue: (id: string) => void;
  onNavigate: (tab: string) => void;
  onLeaveCommunity: (id: string) => void;
  onToggleSupport?: (postId: string) => Promise<void>;
  onToggleSave?: (postId: string) => Promise<void>;
  feedPosts?: FeedPost[];
  supportedPostIds?: string[];
  savedPostIds?: string[];
  isOwnProfile?: boolean;
}

export default function ProfilePage({
  user,
  issues,
  communities,
  comments = [],
  activities = [],
  onUpdateProfile,
  onSelectIssue,
  onNavigate,
  onLeaveCommunity,
  onToggleSupport,
  onToggleSave,
  feedPosts = [],
  supportedPostIds = [],
  savedPostIds = [],
  isOwnProfile = true,
}: ProfilePageProps) {
  const [activeTab, setActiveTab] = useState<'activity' | 'reports' | 'communities' | 'supported' | 'comments' | 'badges' | 'saved'>('activity');
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(user.name || '');
  const [editUsername, setEditUsername] = useState(user.username || '');
  const [editBio, setEditBio] = useState(user.bio || '');
  const [editLocation, setEditLocation] = useState(user.location || '');
  const [editRole, setEditRole] = useState<UserRole>(user.role || 'Citizen');
  const [editCity, setEditCity] = useState(user.city || 'Chandrapur');
  const [showCoverPicker, setShowCoverPicker] = useState(false);
  const [saving, setSaving] = useState(false);

  React.useEffect(() => {
    if (isEditing) {
      setEditName(user.name || '');
      setEditUsername(user.username || '');
      setEditBio(user.bio || '');
      setEditLocation(user.location || '');
      setEditRole(user.role || 'Citizen');
      setEditCity(user.city || 'Chandrapur');
    }
  }, [user, isEditing]);

  const levelInfo = getLevelInfo(user.reputationScore);
  const userBadges = getUserBadges(user);

  // Filter lists for profile tabs
  const myReports = issues.filter(i => i.reportedBy === user.id);
  const myCommunities = communities.filter(c => user.joinedCommunities.includes(c.id));
  const myComments = comments.filter(c => c.userId === user.id);
  const myActivities = activities
    .filter(a => a.userId === user.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  // Determine supported issues directly from supportedPostIds (Source of Truth)
  const supportedIssueIds = new Set<string>();
  supportedPostIds.forEach(id => {
    if (id.startsWith('issue_')) {
      supportedIssueIds.add(id);
    }
    const cleaned = id.replace('post_', '');
    if (cleaned.startsWith('issue_')) {
      supportedIssueIds.add(cleaned);
    }
    const matchingPost = (feedPosts || []).find(p => p.id === id);
    if (matchingPost && matchingPost.issueId) {
      supportedIssueIds.add(matchingPost.issueId);
    }
  });

  const mySupportedIssues = issues.filter(issue => supportedIssueIds.has(issue.id));

  // Determine saved posts directly from savedPostIds (Source of Truth)
  const mySavedPosts = (feedPosts || []).filter(post => {
    return savedPostIds.includes(post.id) || (post.issueId && savedPostIds.includes(post.issueId));
  });

  // Helper to open a saved item
  const handleSavedItemClick = (post: FeedPost) => {
    const issueId = post.issueId || post.id.replace('post_', '');
    if (issues.some(i => i.id === issueId)) {
      onSelectIssue(issueId);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const cityInfo = CITIES_MAPPING.find(c => c.city === editCity) || CITIES_MAPPING[0];
      await onUpdateProfile({
        name: editName,
        username: editUsername,
        bio: editBio,
        location: editLocation,
        role: editRole,
        city: cityInfo.city,
        district: cityInfo.district,
        state: cityInfo.state,
      });
      setIsEditing(false);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleSelectCover = async (url: string) => {
    try {
      await onUpdateProfile({ coverImageUrl: url });
      setShowCoverPicker(false);
    } catch (e) {
      console.error(e);
    }
  };



  return (
    <div className="space-y-6 pb-20 animate-fade-in">
      
      {/* Profile Cover & Header Section */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800/80 shadow-sm overflow-hidden relative">
        {/* Cover image */}
        <div className="h-48 md:h-64 relative bg-slate-100 overflow-hidden">
          <img 
            src={user.coverImageUrl || PRESET_COVERS[0]} 
            alt="Profile Cover" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent" />
          
          {/* Cover editor button */}
          {isOwnProfile && (
            <button 
              onClick={() => setShowCoverPicker(!showCoverPicker)}
              className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-all cursor-pointer border border-white/10"
            >
              Change Cover
            </button>
          )}

          {/* Cover preset selection modal */}
          <AnimatePresence>
            {showCoverPicker && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-14 right-4 bg-slate-900/95 backdrop-blur-md p-3 rounded-xl shadow-xl z-20 border border-slate-800 flex gap-2"
              >
                {PRESET_COVERS.map((url, idx) => (
                  <button 
                    key={idx}
                    onClick={() => handleSelectCover(url)}
                    className="w-14 h-10 rounded-lg overflow-hidden border border-slate-700 hover:border-emerald-500 transition-all cursor-pointer"
                  >
                    <img src={url} alt={`Preset ${idx}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Profile Avatar, Name and Basic Info Overlay */}
        <div className="px-6 md:px-8 pb-6 relative flex flex-col md:flex-row md:items-end justify-between -mt-16 md:-mt-20 gap-6">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-4 text-center md:text-left">
            <div className="relative">
              <img 
                src={user.photoUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(user.id)}`} 
                alt={user.name} 
                className="w-28 h-28 md:w-36 md:h-36 rounded-xl object-cover border-4 border-white dark:border-slate-900 shadow-xl bg-slate-50 dark:bg-slate-800"
              />
              <span className="absolute -bottom-2 -right-2 bg-emerald-600 text-white font-mono text-xs w-7 h-7 rounded-full flex items-center justify-center font-bold border-2 border-white shadow-md">
                {levelInfo.level}
              </span>
            </div>

            <div className="mb-2">
              <div className="flex items-center justify-center md:justify-start gap-2 flex-wrap">
                <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-slate-100 leading-tight">
                  {user.name}
                </h1>
                <Badge variant="color" colorClass={levelInfo.color}>
                  Lvl {levelInfo.level} {levelInfo.title}
                </Badge>
              </div>
              <p className="text-xs text-emerald-600 dark:text-emerald-500 font-bold font-mono mt-0.5">
                @{user.username || user.email?.split('@')[0] || 'civic_hero'}
              </p>
              
              <div className="flex items-center justify-center md:justify-start gap-4 mt-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
                {user.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                    {user.location}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                  Joined {new Date(user.createdAt).toLocaleDateString([], { month: 'short', year: 'numeric' })}
                </span>
              </div>
            </div>
          </div>

          {/* Action button */}
          {isOwnProfile && (
            <div className="flex justify-center self-center md:self-end">
              {isEditing ? (
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-black rounded-xl transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{saving ? 'Saving...' : 'Save Profile'}</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-black rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Profile</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Editable fields pane */}
        {isEditing && (
          <div className="px-6 md:px-8 pb-6 border-t border-slate-100 dark:border-slate-800 pt-6 bg-slate-50/50 dark:bg-slate-950/20 space-y-4">
            <h3 className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider">Edit Public Info</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Full Name</label>
                <input 
                  type="text" 
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 text-xs rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Username (@)</label>
                <input 
                  type="text" 
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 text-xs rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Location</label>
                <input 
                  type="text" 
                  value={editLocation}
                  onChange={(e) => setEditLocation(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 text-xs rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Civic Jurisdiction (City)</label>
                <select
                  value={editCity}
                  onChange={(e) => {
                    const newCity = e.target.value;
                    setEditCity(newCity);
                    const cityInfo = CITIES_MAPPING.find(c => c.city === newCity);
                    if (cityInfo) {
                      setEditLocation(`${cityInfo.city}, ${cityInfo.state}`);
                    }
                  }}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 text-xs rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
                >
                  {CITIES_MAPPING.map((c) => (
                    <option key={c.city} value={c.city} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                      {c.label} ({c.state})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Civic Role</label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 text-xs rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
                >
                  {(['Citizen', 'Resolver', 'Authority'] as UserRole[]).map((rOption) => (
                    <option key={rOption} value={rOption} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                      {rOption}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Bio</label>
              <textarea 
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 text-xs rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                placeholder="Write something about yourself..."
              />
            </div>
          </div>
        )}

        {/* Static Bio block if not editing */}
        {!isEditing && user.bio && (
          <div className="px-6 md:px-8 pb-6 pt-2 border-t border-slate-100/50 dark:border-slate-800/50">
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed italic max-w-2xl bg-slate-50/50 dark:bg-slate-950/20 px-4 py-3 rounded-xl border border-slate-100 dark:border-slate-800">
              "{user.bio}"
            </p>
          </div>
        )}
      </div>

      {/* Gamification Reputation Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric Card: XP */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200/60 dark:border-slate-800/80 shadow-sm space-y-2">
          <div className="flex justify-between items-center text-slate-400 dark:text-slate-500">
            <span className="text-[10px] font-bold uppercase tracking-wider">Reputation XP</span>
            <Flame className="w-4 h-4 text-orange-500" />
          </div>
          <span className="block text-2xl font-black text-slate-900 dark:text-slate-100 font-mono">{user.reputationScore} XP</span>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div className="bg-orange-500 h-full rounded-full" style={{ width: `${Math.min(100, (user.reputationScore % 300) / 3)}%` }} />
          </div>
          <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 block font-mono">Next level at {Math.ceil((user.reputationScore + 1) / 300) * 300} XP</span>
        </div>

        {/* Metric Card: Trust Score */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200/60 dark:border-slate-800/80 shadow-sm space-y-2">
          <div className="flex justify-between items-center text-slate-400 dark:text-slate-500">
            <span className="text-[10px] font-bold uppercase tracking-wider">Trust Rating</span>
            <Shield className="w-4 h-4 text-emerald-600" />
          </div>
          <span className="block text-2xl font-black text-emerald-600 dark:text-emerald-500 font-mono">{user.trustScore || 95}%</span>
          <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 block">Calculated via valid audit logs & resolves</span>
        </div>

        {/* Metric Card: Total Reports */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200/60 dark:border-slate-800/80 shadow-sm space-y-2">
          <div className="flex justify-between items-center text-slate-400 dark:text-slate-500">
            <span className="text-[10px] font-bold uppercase tracking-wider">Reports Created</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <span className="block text-2xl font-black text-slate-900 dark:text-slate-100 font-mono">{user.reportsCreated}</span>
          <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 block">Civic hazards submitted</span>
        </div>

        {/* Metric Card: Resolves */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200/60 dark:border-slate-800/80 shadow-sm space-y-2">
          <div className="flex justify-between items-center text-slate-400 dark:text-slate-500">
            <span className="text-[10px] font-bold uppercase tracking-wider">Issues Co-Resolved</span>
            <Award className="w-4 h-4 text-purple-600" />
          </div>
          <span className="block text-2xl font-black text-slate-900 dark:text-slate-100 font-mono">{user.reportsResolved}</span>
          <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 block">Verified resolutions completed</span>
        </div>
      </div>

      {/* Tabs list navigation */}
      <div className="flex bg-slate-100 dark:bg-slate-950 p-1.5 rounded-xl overflow-x-auto whitespace-nowrap scrollbar-none">
        {((isOwnProfile 
          ? ['activity', 'reports', 'communities', 'supported', 'comments', 'badges', 'saved'] 
          : ['activity', 'reports', 'communities', 'supported', 'comments', 'badges']
        ) as ('activity' | 'reports' | 'communities' | 'supported' | 'comments' | 'badges' | 'saved')[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === tab 
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm' 
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Dynamic Tab Pane */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800 shadow-sm p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.15 }}
          >
            {/* Activity History Tab */}
            {activeTab === 'activity' && (
              <ActivityTab activities={myActivities} />
            )}

            {/* Reports Created Tab */}
            {activeTab === 'reports' && (
              <ReportsTab reports={myReports} onSelectIssue={onSelectIssue} />
            )}

            {/* Joined Communities Tab */}
            {activeTab === 'communities' && (
              <CommunitiesTab communities={myCommunities} onLeaveCommunity={onLeaveCommunity} />
            )}

            {/* Supported Issues Tab */}
            {activeTab === 'supported' && (
              <SupportedTab 
                supportedIssues={mySupportedIssues} 
                onSelectIssue={onSelectIssue} 
                onToggleSupport={onToggleSupport}
              />
            )}

            {/* Comments Made Tab */}
            {activeTab === 'comments' && (
              <CommentsTab 
                comments={myComments} 
                issues={issues} 
                communities={communities} 
                onSelectIssue={onSelectIssue} 
                onNavigate={onNavigate}
              />
            )}

            {/* Badges Drawer Tab */}
            {activeTab === 'badges' && (
              <BadgesTab userBadges={userBadges} />
            )}

            {/* Saved Posts Tab */}
            {activeTab === 'saved' && (
              <SavedTab 
                savedPosts={mySavedPosts} 
                issues={issues} 
                onSelectIssue={onSelectIssue} 
                onToggleSave={onToggleSave}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

    </div>
  );
}
