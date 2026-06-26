/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shield, Building2, AlertTriangle, PlusCircle, 
  Award, Map, LogOut, User as UserIcon, Users, Compass, Flame, Zap,
  Search, Sparkles, Settings, Bell, Sun, Moon, MapPin, X, RefreshCw
} from 'lucide-react';

import AuthModal from '../features/auth/components/AuthModal';
import LandingPage from '../components/layout/LandingPage';
import { useAppState } from './useAppState';
import { UserRole, IssueStatus, Notification } from '../types';
import { Badge } from '../components/ui/Badge';
import { getCityFromArea } from '../lib/geoUtils';


// Lazy load page/tab panels
const Dashboard = React.lazy(() => import('../features/dashboard/components/Dashboard'));
const CommunitiesList = React.lazy(() => import('../features/communities/components/CommunitiesList'));
const ReportIssueForm = React.lazy(() => import('../features/issues/components/ReportIssueForm'));
const IssuesList = React.lazy(() => import('../features/issues/components/IssuesList'));
const IssueDetails = React.lazy(() => import('../features/issues/components/IssueDetails'));
const Leaderboard = React.lazy(() => import('../features/dashboard/components/Leaderboard'));
const MapExplorer = React.lazy(() => import('../features/maps/components/MapExplorer'));
const Feed = React.lazy(() => import('../features/feed/components/Feed'));
const CommunityPage = React.lazy(() => import('../features/communities/components/CommunityPage'));
const ProfilePage = React.lazy(() => import('../features/profile/components/ProfilePage'));
const SettingsPage = React.lazy(() => import('../features/profile/components/SettingsPage'));
const NotFoundPage = React.lazy(() => import('../components/layout/NotFoundPage'));

export default function App() {
  const {
    appStarted,
    activeTab,
    selectedIssueId,
    users,
    communities,
    issues,
    verifications,
    comments,
    activities,
    currentUser,
    currentRole,
    selectedCommunityId,
    activeLocationFilter,
    setActiveLocationFilter,
    notifications,
    authModalOpen,
    authModalRole,
    authLoading,
    feedPosts,
    feedLoading,
    supportedPostIds,
    savedPostIds,
    commentsCache,
    commentsLoading,
    setAuthModalOpen,
    setSelectedCommunityId,
    setAppStarted,
    loadComments,
    updateUserProfile,
    handleRoleChange,
    handleStartApp,
    handleSignOut,
    handleCreateIssue,
    handleUpdateIssue,
    handleDeleteIssue,
    handleCreateCommunity,
    handleUpdateCommunityDetails,
    handleJoinCommunity,
    handleLeaveCommunity,
    handleCastVote,
    handleToggleSupport,
    handleToggleSave,
    handleAddFeedComment,
    handleEditFeedComment,
    handleDeleteFeedComment,
    handleSupportIssue,
    handleAddComment,
    handleAdminUpdate,
    handleSelectIssue,
    handleNavigation,
    handleMarkNotificationRead,
    handleMarkAllNotificationsRead,
    handleApproveMember,
    handleRejectMember,
    handleRemoveMember,
    handleUpdateMemberRole,
    handleMarkAsDuplicate,
    handleResetDatabase,
    theme,
    toggleTheme,
    isOnline,
    syncStatus,
    viewingUserId,
    handleViewUserProfile,
    handleDeleteAccount,
    userCoords
  } = useAppState();

  const [feedSearchQuery, setFeedSearchQuery] = React.useState('');
  const [notifDrawerOpen, setNotifDrawerOpen] = React.useState(false);

  // Compute unread notifications count
  const unreadCount = React.useMemo(() => {
    return notifications.filter(n => !n.isRead).length;
  }, [notifications]);

  // Dynamic list of active cities to populate in header dropdown
  const availableCities = React.useMemo(() => {
    const cities = new Set<string>();
    if (currentUser?.city) cities.add(currentUser.city);
    communities.forEach(c => {
      if (c.city) cities.add(c.city);
      const parsed = getCityFromArea(c.areaName);
      if (parsed) cities.add(parsed);
    });
    issues.forEach(i => {
      if (i.city) cities.add(i.city);
    });
    return Array.from(cities).filter(Boolean).sort();
  }, [communities, issues, currentUser]);

  // Dynamic location filter for feed posts
  const filteredFeedPosts = React.useMemo(() => {
    if (!feedPosts) return [];
    return feedPosts.filter(post => {
      const issue = issues.find(i => i.id === post.issueId);
      const community = issue ? communities.find(c => c.id === issue.communityId) : undefined;
      const postCity = issue?.city || community?.city || getCityFromArea(community?.areaName) || currentUser?.city || 'Chandrapur';

      if (activeLocationFilter === 'My Location') {
        return postCity.toLowerCase() === currentUser?.city?.toLowerCase();
      } else if (activeLocationFilter !== 'All') {
        return postCity.toLowerCase() === activeLocationFilter.toLowerCase();
      }
      return true;
    });
  }, [feedPosts, issues, communities, activeLocationFilter, currentUser]);

  // Dynamic location filter for general issues
  const filteredIssues = React.useMemo(() => {
    return issues.filter(issue => {
      const community = communities.find(c => c.id === issue.communityId);
      const issueCity = issue.city || community?.city || getCityFromArea(community?.areaName) || currentUser?.city || 'Chandrapur';
      if (activeLocationFilter === 'My Location') {
        return issueCity.toLowerCase() === currentUser?.city?.toLowerCase();
      } else if (activeLocationFilter !== 'All') {
        return issueCity.toLowerCase() === activeLocationFilter.toLowerCase();
      }
      return true;
    });
  }, [issues, communities, activeLocationFilter, currentUser]);


  const trendingCommunities = React.useMemo(() => {
    return [...communities]
      .sort((a, b) => (b.memberIds?.length || 0) - (a.memberIds?.length || 0))
      .slice(0, 3);
  }, [communities]);

  const topHeroes = React.useMemo(() => {
    return [...users]
      .sort((a, b) => b.reputationScore - a.reputationScore)
      .slice(0, 3);
  }, [users]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center font-sans">
        <div className="flex flex-col items-center space-y-4">
          <div className="p-3 bg-emerald-100 text-emerald-700 rounded-2xl animate-bounce">
            <Shield className="w-8 h-8" />
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping" />
            <span className="text-sm font-semibold tracking-wide text-slate-600">Initializing Civic Workspace...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!appStarted || !currentUser) {
    return (
      <>
        <LandingPage onStart={handleStartApp} />
        <AuthModal 
          isOpen={authModalOpen} 
          onClose={() => setAuthModalOpen(false)} 
          defaultRole={authModalRole} 
          onAuthSuccess={() => setAppStarted(true)} 
          userCoords={userCoords}
        />
      </>
    );
  }

  const activeIssue = issues.find(i => i.id === selectedIssueId);

  return (
    <div className="min-h-screen bg-slate-100/40 dark:bg-slate-950 flex flex-col font-sans text-slate-800 dark:text-slate-100 transition-colors duration-300">

      {/* Mobile Header */}
      <header className="md:hidden bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex items-center justify-between sticky top-0 z-40 font-sans transition-colors duration-300">
        <div className="flex items-center space-x-2 cursor-pointer" onClick={() => handleNavigation('feed')}>
          <div className="p-1.5 bg-emerald-600 rounded-lg text-white">
            <Shield className="w-4 h-4" />
          </div>
          <span className="font-bold tracking-tight text-slate-900 dark:text-slate-100 text-sm">Community Hero</span>
        </div>
        <div className="flex items-center space-x-2.5">
          <button 
            onClick={() => handleNavigation('settings')}
            className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 rounded-lg bg-slate-50 dark:bg-slate-800 cursor-pointer flex items-center justify-center border border-slate-200/40 dark:border-slate-700/50"
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
          <button 
            onClick={() => handleNavigation('profile')}
            className="w-8 h-8 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700 cursor-pointer"
          >
            <img src={currentUser.photoUrl} alt="Avatar" className="w-full h-full object-cover" />
          </button>
          <button 
            onClick={handleSignOut}
            className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 rounded-lg bg-slate-50 dark:bg-slate-800 cursor-pointer border border-slate-200/40 dark:border-slate-700/50"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Core Shell */}
      <div className="flex-grow flex w-full max-w-[1300px] mx-auto pb-16 md:pb-0 px-4 md:px-6">
        
        {/* Left Sidebar */}
        <aside className="hidden md:flex w-64 bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800 flex-col justify-between flex-shrink-0 sticky top-0 h-screen px-6 py-6 transition-colors duration-300">
          <div className="font-sans">
            {/* Logo */}
            <div className="flex items-center space-x-2.5 mb-8 cursor-pointer pl-2" onClick={() => handleNavigation('feed')}>
              <div className="p-2 bg-emerald-600 rounded-xl text-white shadow-sm shadow-emerald-600/10">
                <Shield className="w-5 h-5" />
              </div>
              <span className="font-extrabold tracking-tight text-slate-900 dark:text-slate-100 text-sm">Community Hero</span>
            </div>

            {/* Sidebar navigation */}
            <nav className="space-y-1">
              <button 
                id="sidebar-nav-feed"
                onClick={() => handleNavigation('feed')}
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-[13px] font-bold transition-all cursor-pointer ${
                  activeTab === 'feed' 
                    ? 'bg-slate-100/80 dark:bg-slate-800 text-slate-900 dark:text-white' 
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Compass className="w-4 h-4 flex-shrink-0" />
                <span>Hyperlocal Feed</span>
              </button>

              <button 
                id="sidebar-nav-dashboard"
                onClick={() => handleNavigation('dashboard')}
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-[13px] font-bold transition-all cursor-pointer ${
                  activeTab === 'dashboard' 
                    ? 'bg-slate-100/80 dark:bg-slate-800 text-slate-900 dark:text-white' 
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Users className="w-4 h-4 flex-shrink-0" />
                <span>Action Hub</span>
              </button>

              <button 
                id="sidebar-nav-communities"
                onClick={() => {
                  setSelectedCommunityId('all');
                  handleNavigation('communities');
                }}
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-[13px] font-bold transition-all cursor-pointer ${
                  activeTab === 'communities' 
                    ? 'bg-slate-100/80 dark:bg-slate-800 text-slate-900 dark:text-white' 
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Building2 className="w-4 h-4 flex-shrink-0" />
                <span>Community Spaces</span>
              </button>

              <button 
                id="sidebar-nav-map"
                onClick={() => handleNavigation('map-explorer')}
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-[13px] font-bold transition-all cursor-pointer ${
                  activeTab === 'map-explorer' 
                    ? 'bg-slate-100/80 dark:bg-slate-800 text-slate-900 dark:text-white' 
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Map className="w-4 h-4 flex-shrink-0" />
                <span>Map Explorer</span>
              </button>

              <button 
                id="sidebar-nav-issues"
                onClick={() => handleNavigation('issues')}
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-[13px] font-bold transition-all cursor-pointer ${
                  activeTab === 'issues' || activeTab === 'issue-details' 
                    ? 'bg-slate-100/80 dark:bg-slate-800 text-slate-900 dark:text-white' 
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>Incidents Directory</span>
              </button>

              <button 
                id="sidebar-nav-report"
                onClick={() => handleNavigation('report')}
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-[13px] font-bold transition-all cursor-pointer ${
                  activeTab === 'report' 
                    ? 'bg-slate-100/80 dark:bg-slate-800 text-slate-900 dark:text-white' 
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <PlusCircle className="w-4 h-4 flex-shrink-0" />
                <span>Report an Issue</span>
              </button>

              <button 
                id="sidebar-nav-challenges"
                onClick={() => handleNavigation('challenges')}
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-[13px] font-bold transition-all cursor-pointer ${
                  activeTab === 'challenges' 
                    ? 'bg-slate-100/80 dark:bg-slate-800 text-slate-900 dark:text-white' 
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Flame className="w-4 h-4 flex-shrink-0 text-orange-500 animate-pulse" />
                <span>Civic Challenges</span>
              </button>

              <button 
                id="sidebar-nav-leaderboard"
                onClick={() => handleNavigation('leaderboard')}
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-[13px] font-bold transition-all cursor-pointer ${
                  activeTab === 'leaderboard' 
                    ? 'bg-slate-100/80 dark:bg-slate-800 text-slate-900 dark:text-white' 
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Award className="w-4 h-4 flex-shrink-0 text-amber-500" />
                <span>Civic Champions</span>
              </button>

              <button 
                id="sidebar-nav-profile"
                onClick={() => handleNavigation('profile')}
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-[13px] font-bold transition-all cursor-pointer ${
                  activeTab === 'profile' 
                    ? 'bg-slate-100/80 dark:bg-slate-800 text-slate-900 dark:text-white' 
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <UserIcon className="w-4 h-4 flex-shrink-0" />
                <span>My Profile</span>
              </button>

              <button 
                id="sidebar-nav-settings"
                onClick={() => handleNavigation('settings')}
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-[13px] font-bold transition-all cursor-pointer ${
                  activeTab === 'settings' 
                    ? 'bg-slate-100/80 dark:bg-slate-800 text-slate-900 dark:text-white' 
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Settings className="w-4 h-4 flex-shrink-0" />
                <span>Settings</span>
              </button>
            </nav>
          </div>

          {/* User profile capsule */}
          <div className="border-t border-slate-100 dark:border-slate-800 pt-4 font-sans">
            <div 
              className="flex items-center space-x-3 mb-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40 p-2 rounded-xl transition-all"
              onClick={() => handleNavigation('profile')}
            >
              <img 
                src={currentUser.photoUrl} 
                alt="Avatar" 
                className="w-9 h-9 rounded-full border border-slate-200 dark:border-slate-800 object-cover"
              />
              <div className="min-w-0 flex-grow">
                <span className="font-extrabold text-slate-900 dark:text-slate-200 text-[11px] block truncate leading-tight">{currentUser.name}</span>
                <span className="text-[9px] text-slate-400 dark:text-slate-500 font-medium block truncate">Rep: {currentUser.reputationScore} XP</span>
              </div>
            </div>

            <button 
              id="sidebar-sign-out"
              onClick={handleSignOut}
              className="w-full py-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-650 dark:text-slate-350 text-[10px] font-bold rounded-xl transition-all flex items-center justify-center space-x-1.5 cursor-pointer border border-slate-200/60 dark:border-slate-800/85"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </aside>

        {/* Center Panel + Right Sidebar wrapper */}
        <div className="flex-grow flex divide-x divide-slate-100 dark:divide-slate-800 min-w-0">
          <div className="flex-grow flex flex-col min-w-0">
            {/* Top unified bar */}
            <div className="bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-800/80 px-6 py-3 flex items-center justify-between sticky top-0 z-30 transition-colors">
              <h2 className="text-xs font-black text-slate-900 dark:text-slate-100 tracking-tight uppercase">
                {activeTab === 'feed' ? 'Hyperlocal Feed' : activeTab === 'map-explorer' ? 'Map Explorer' : activeTab === 'leaderboard' ? 'Civic Champions' : activeTab === 'communities' ? 'Community Spaces' : activeTab === 'issues' ? 'Incidents Directory' : activeTab === 'dashboard' ? 'Action Hub' : activeTab}
              </h2>
              
              <div className="flex items-center space-x-3">
                {/* Location Selector */}
                <div className="flex items-center gap-1.5 bg-slate-100/50 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200/40 dark:border-slate-700/50">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                  <select
                    value={activeLocationFilter}
                    onChange={(e) => setActiveLocationFilter(e.target.value)}
                    className="bg-slate-100/50 dark:bg-slate-800 text-[11px] font-bold text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer border-none"
                  >
                    <option value="All" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">All Locations</option>
                    <option value="My Location" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">My Location ({currentUser?.city || 'Chandrapur'})</option>
                    {availableCities.map(city => (
                      <option key={city} value={city} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">{city}</option>
                    ))}
                  </select>
                </div>

                {/* Notification Bell */}
                <button
                  onClick={() => setNotifDrawerOpen(true)}
                  className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 rounded-xl bg-slate-100/60 dark:bg-slate-800 border border-slate-200/40 dark:border-slate-700/50 cursor-pointer relative"
                  title="Notifications"
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] font-bold px-1 min-w-[14px] h-3.5 rounded-full flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </button>
                
                {/* Dark/Light mode toggle */}
                <button
                  onClick={toggleTheme}
                  className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 rounded-xl bg-slate-100/60 dark:bg-slate-800 border border-slate-200/40 dark:border-slate-700/50 cursor-pointer"
                  title="Toggle Theme"
                >
                  {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Dynamic Canvas Area */}
            <main className={`flex-grow p-4 md:p-6 overflow-y-auto min-w-0 ${
              activeTab === 'feed' ? 'max-w-2xl mx-auto w-full' : 'max-w-full'
            }`}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <React.Suspense fallback={
                    <div className="flex items-center justify-center min-h-[50vh] font-sans">
                      <div className="flex flex-col items-center space-y-3">
                        <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                        <span className="text-xs text-slate-500 font-medium">Loading panel...</span>
                      </div>
                    </div>
                  }>
                    {activeTab === 'feed' && (
                      <Feed
                        issues={filteredIssues}
                        communities={communities}
                        users={users}
                        currentUser={currentUser}
                        onSelectIssue={handleSelectIssue}
                        onNavigate={handleNavigation}
                        posts={filteredFeedPosts}
                        feedLoading={feedLoading}
                        supportedPostIds={supportedPostIds}
                        savedPostIds={savedPostIds}
                        commentsCache={commentsCache}
                        commentsLoading={commentsLoading}
                        loadComments={loadComments}
                        toggleSupport={handleToggleSupport}
                        toggleSave={handleToggleSave}
                        addComment={handleAddFeedComment}
                        onEditComment={handleEditFeedComment}
                        onDeleteComment={handleDeleteFeedComment}
                        searchQuery={feedSearchQuery}
                        onViewUserProfile={handleViewUserProfile}
                      />
                    )}

                    {activeTab === 'dashboard' && (
                      <Dashboard 
                        issues={issues}
                        communities={communities}
                        onSelectIssue={handleSelectIssue}
                        onNavigate={handleNavigation}
                        selectedCommunityId={selectedCommunityId}
                        setSelectedCommunityId={setSelectedCommunityId}
                        userCoords={userCoords}
                        currentUser={currentUser}
                      />
                    )}

                    {activeTab === 'communities' && (
                      selectedCommunityId !== 'all' && communities.some(c => c.id === selectedCommunityId) ? (
                        <CommunityPage
                          community={communities.find(c => c.id === selectedCommunityId)!}
                          issues={issues}
                          users={users}
                          joinedIds={currentUser.joinedCommunities}
                          verifications={verifications}
                          onBack={() => setSelectedCommunityId('all')}
                          onJoin={handleJoinCommunity}
                          onLeave={handleLeaveCommunity}
                          onSelectIssue={handleSelectIssue}
                          currentUser={currentUser}
                          onUpdateCommunityDetails={handleUpdateCommunityDetails}
                          onApproveMember={handleApproveMember}
                          onRejectMember={handleRejectMember}
                          onRemoveMember={handleRemoveMember}
                          onUpdateMemberRole={handleUpdateMemberRole}
                          onViewUserProfile={handleViewUserProfile}
                          userCoords={userCoords}
                        />
                      ) : (
                        <CommunitiesList 
                          communities={communities}
                          joinedIds={currentUser.joinedCommunities}
                          onJoin={handleJoinCommunity}
                          onLeave={handleLeaveCommunity}
                          onCreate={handleCreateCommunity}
                          selectedCommunityId={selectedCommunityId}
                          setSelectedCommunityId={setSelectedCommunityId}
                          userCoords={userCoords}
                          currentUser={currentUser}
                        />
                      )
                    )}

                    {activeTab === 'report' && (
                      <ReportIssueForm 
                        communities={communities}
                        issues={issues}
                        onSubmit={handleCreateIssue}
                        onNavigate={handleNavigation}
                        currentUser={currentUser}
                        userCoords={userCoords}
                      />
                    )}

                    {activeTab === 'map-explorer' && (
                      <MapExplorer 
                        issues={filteredIssues}
                        communities={communities}
                        onSelectIssue={handleSelectIssue}
                        userCoords={userCoords}
                      />
                    )}

                    {activeTab === 'issues' && (
                      <IssuesList 
                        issues={filteredIssues}
                        communities={communities}
                        onSelectIssue={handleSelectIssue}
                        selectedCommunityId={selectedCommunityId}
                        setSelectedCommunityId={setSelectedCommunityId}
                        userCoords={userCoords}
                        currentUser={currentUser}
                      />
                    )}

                    {activeTab === 'issue-details' && activeIssue && (
                      <IssueDetails 
                        issue={activeIssue}
                        verifications={verifications}
                        onBack={() => handleNavigation('feed')}
                        onCastVote={handleCastVote}
                        currentUserRole={currentRole}
                        onAdminUpdate={handleAdminUpdate}
                        currentUser={currentUser}
                        onMarkAsDuplicate={handleMarkAsDuplicate}
                        issues={issues}
                        communities={communities}
                        onUpdateIssue={handleUpdateIssue}
                        onDeleteIssue={handleDeleteIssue}
                        onViewUserProfile={handleViewUserProfile}
                      />
                    )}

                    {activeTab === 'leaderboard' && (
                      <Leaderboard 
                        users={users} 
                        communities={communities}
                        currentUser={currentUser}
                        onViewUserProfile={handleViewUserProfile}
                      />
                    )}

                    {activeTab === 'profile' && (
                      <ProfilePage 
                        user={viewingUserId ? (users.find(u => u.id === viewingUserId) || currentUser) : currentUser}
                        isOwnProfile={!viewingUserId || viewingUserId === currentUser?.id}
                        issues={issues}
                        communities={communities}
                        comments={comments}
                        activities={activities}
                        onUpdateProfile={updateUserProfile}
                        onSelectIssue={handleSelectIssue}
                        onNavigate={handleNavigation}
                        onLeaveCommunity={handleLeaveCommunity}
                        onToggleSupport={handleToggleSupport}
                        onToggleSave={handleToggleSave}
                        feedPosts={feedPosts}
                        supportedPostIds={supportedPostIds}
                        savedPostIds={savedPostIds}
                      />
                    )}

                    {activeTab === 'settings' && (
                      <SettingsPage 
                        user={currentUser}
                        theme={theme}
                        toggleTheme={toggleTheme}
                        onNavigate={handleNavigation}
                        onResetDatabase={handleResetDatabase}
                        onDeleteAccount={handleDeleteAccount}
                        onRoleChange={handleRoleChange}
                        onUpdateProfile={updateUserProfile}
                        communities={communities}
                        issues={issues}
                      />
                    )}

                    {activeTab === 'challenges' && (
                      <div className="space-y-6 animate-fade-in pb-16 font-sans">
                        <div>
                          <h1 className="text-lg font-extrabold text-slate-900 tracking-tight">Civic Challenges Hub</h1>
                          <p className="text-[11px] text-slate-500 mt-1">Complete neighborhood quests to earn XP badges and climb the civic honor roll.</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="bg-white p-5 rounded-xl border border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.01)] space-y-4">
                            <div className="flex items-start gap-4">
                              <div className="p-2.5 bg-orange-50 text-orange-600 rounded-xl">
                                <Flame className="w-5 h-5 animate-pulse" />
                              </div>
                              <div className="space-y-1">
                                <div className="block pb-1">
                                  <Badge variant="color" colorClass="bg-amber-50/50 text-amber-600 border-amber-200/50">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                    Weekly Quest
                                  </Badge>
                                </div>
                                <h3 className="font-bold text-slate-900 text-xs">Cleanliness Drive Audit</h3>
                                <p className="text-[11px] text-slate-500 leading-normal">Verify at least 3 garbage-piling reports in your area to earn the Cleanliness Champion badge.</p>
                              </div>
                            </div>
                            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-medium">
                              <span>Reward: 150 Reputation XP</span>
                              <span className="text-orange-600 font-bold">Ends in 3 days</span>
                            </div>
                          </div>

                          <div className="bg-white p-5 rounded-xl border border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.01)] space-y-4">
                            <div className="flex items-start gap-4">
                              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                                <Zap className="w-5 h-5 animate-pulse" />
                              </div>
                              <div className="space-y-1">
                                <div className="block pb-1">
                                  <Badge variant="color" colorClass="bg-blue-50/50 text-blue-600 border-blue-200/50">
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                    Daily Quest
                                  </Badge>
                                </div>
                                <h3 className="font-bold text-slate-900 text-xs">Hyperlocal Supporter</h3>
                                <p className="text-[11px] text-slate-500 leading-normal">Support at least 1 reported neighbor issue today to build civic cohesion.</p>
                              </div>
                            </div>
                            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-medium">
                              <span>Reward: 50 Reputation XP</span>
                              <span className="text-blue-600 font-bold">Resets in 11 hours</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTab === '404' && (
                      <NotFoundPage onBackToFeed={() => handleNavigation('feed')} />
                    )}
                  </React.Suspense>
                </motion.div>
              </AnimatePresence>
            </main>
          </div>

          {/* Social Right Sidebar */}
          {activeTab === 'feed' && (
            <aside className="hidden lg:block w-80 px-6 py-6 space-y-6 flex-shrink-0 sticky top-0 h-screen overflow-y-auto border-l border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 transition-colors">
              {/* Global Search Bar */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search Hero..."
                  value={feedSearchQuery}
                  onChange={(e) => setFeedSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border border-transparent dark:border-slate-700 text-xs rounded-xl focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-slate-200 dark:focus:border-slate-700 transition-all font-medium text-slate-800 dark:text-slate-200"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              </div>

              {/* Trending Communities */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-xl p-4 space-y-3.5 shadow-[0_1px_3px_rgba(0,0,0,0.01)] transition-colors">
                <h3 className="text-xs font-black text-slate-950 dark:text-slate-100 tracking-tight flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-emerald-600" />
                  Trending Spaces
                </h3>
                <div className="space-y-3">
                  {trendingCommunities.map(comm => (
                    <div key={comm.id} className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-450 flex items-center justify-center font-black text-[11px] flex-shrink-0">
                          {comm.name[0]}
                        </div>
                        <div className="min-w-0">
                          <span className="font-extrabold text-[11px] text-slate-800 dark:text-slate-200 block truncate hover:text-emerald-700 dark:hover:text-emerald-450 cursor-pointer" onClick={() => { setSelectedCommunityId(comm.id); handleNavigation('communities'); }}>
                            {comm.name}
                          </span>
                          <span className="text-[9px] text-slate-400 dark:text-slate-500 block font-medium">{comm.memberIds?.length || 0} members</span>
                        </div>
                      </div>
                      <button
                        onClick={() => { setSelectedCommunityId(comm.id); handleNavigation('communities'); }}
                        className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white dark:text-slate-200 rounded-lg text-[9px] font-bold transition-all cursor-pointer border-0"
                      >
                        View
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Heroes */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-xl p-4 space-y-3.5 shadow-[0_1px_3px_rgba(0,0,0,0.01)] transition-colors">
                <h3 className="text-xs font-black text-slate-950 dark:text-slate-100 tracking-tight flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-amber-500" />
                  Top Civic Heroes
                </h3>
                <div className="space-y-3">
                  {topHeroes.map((hero, index) => (
                    <div key={hero.id} className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="relative flex-shrink-0">
                          <img src={hero.photoUrl} className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-800 object-cover" />
                          <span className="absolute -bottom-1 -right-1 bg-slate-900 dark:bg-slate-800 text-white dark:text-slate-200 font-mono font-black text-[8px] w-3.5 h-3.5 rounded-full flex items-center justify-center border border-white dark:border-slate-900">
                            {index + 1}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <span className="font-extrabold text-[11px] text-slate-800 dark:text-slate-200 block truncate leading-tight">{hero.name}</span>
                          <span className="text-[9px] text-slate-400 dark:text-slate-500 block font-mono">@{hero.username || hero.name.split(' ')[0].toLowerCase()}</span>
                        </div>
                      </div>
                      <span className="text-[10px] font-black text-emerald-600 font-mono flex-shrink-0">
                        {hero.reputationScore} XP
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quest Mini-Card */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-xl p-4 space-y-3 shadow-[0_1px_3px_rgba(0,0,0,0.01)] transition-colors">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-1.5">
                    <Flame className="w-4 h-4 text-orange-500 animate-pulse" />
                    Active Quest
                  </h3>
                  <Badge variant="color" colorClass="bg-amber-50/50 text-amber-600 border-amber-200/50 font-mono">
                    3d left
                  </Badge>
                </div>
                <div className="space-y-2">
                  <h4 className="font-bold text-[11px] text-slate-800 dark:text-slate-200">Cleanliness Drive Audit</h4>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-normal line-clamp-2">Verify at least 3 garbage-piling reports in your area to earn the Cleanliness Champion badge.</p>
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[9px] font-semibold text-slate-500 dark:text-slate-400">
                    <span>Reward: 150 XP</span>
                    <button onClick={() => handleNavigation('challenges')} className="text-emerald-600 hover:text-emerald-700 font-bold cursor-pointer border-0 bg-transparent">Go to Hub →</button>
                  </div>
                </div>
              </div>
            </aside>
          )}
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-6 py-2.5 flex items-center justify-between z-40 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] dark:shadow-[0_-2px_10px_rgba(0,0,0,0.2)] font-sans transition-colors duration-300">
        <button 
          onClick={() => handleNavigation('feed')}
          className={`flex flex-col items-center space-y-1 cursor-pointer bg-transparent border-0 ${activeTab === 'feed' ? 'text-emerald-600' : 'text-slate-400'}`}
        >
          <Compass className="w-5 h-5" />
          <span className="text-[9px] font-bold">Home</span>
        </button>
        <button 
          onClick={() => handleNavigation('map-explorer')}
          className={`flex flex-col items-center space-y-1 cursor-pointer bg-transparent border-0 ${activeTab === 'map-explorer' ? 'text-emerald-600' : 'text-slate-400'}`}
        >
          <Map className="w-5 h-5" />
          <span className="text-[9px] font-bold">Map</span>
        </button>
        <button 
          onClick={() => handleNavigation('report')}
          className={`flex flex-col items-center space-y-1 cursor-pointer bg-transparent border-0 ${activeTab === 'report' ? 'text-emerald-600' : 'text-slate-400'}`}
        >
          <PlusCircle className="w-5 h-5" />
          <span className="text-[9px] font-bold">Report</span>
        </button>
        <button 
          onClick={() => {
            setSelectedCommunityId('all');
            handleNavigation('communities');
          }}
          className={`flex flex-col items-center space-y-1 cursor-pointer bg-transparent border-0 ${activeTab === 'communities' ? 'text-emerald-600' : 'text-slate-400'}`}
        >
          <Building2 className="w-5 h-5" />
          <span className="text-[9px] font-bold">Spaces</span>
        </button>
        <button 
          onClick={() => handleNavigation('profile')}
          className={`flex flex-col items-center space-y-1 cursor-pointer bg-transparent border-0 ${activeTab === 'profile' ? 'text-emerald-600' : 'text-slate-400'}`}
        >
          <UserIcon className="w-5 h-5" />
          <span className="text-[9px] font-bold">Profile</span>
        </button>
      </nav>
      <AuthModal 
        isOpen={authModalOpen} 
        onClose={() => setAuthModalOpen(false)} 
        defaultRole={authModalRole} 
        onAuthSuccess={() => setAppStarted(true)} 
        userCoords={userCoords}
      />

      {/* Notifications Drawer */}
      <AnimatePresence>
        {notifDrawerOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setNotifDrawerOpen(false)}
              className="fixed inset-0 bg-black z-50 cursor-pointer"
            />
            {/* Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-full max-w-sm bg-white dark:bg-slate-900 shadow-2xl z-55 flex flex-col border-l border-slate-200 dark:border-slate-800 transition-colors"
            >
              {/* Header */}
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">Notifications</h3>
                </div>
                <div className="flex items-center gap-3">
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllNotificationsRead}
                      className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 bg-transparent border-0 cursor-pointer"
                    >
                      Mark all read
                    </button>
                  )}
                  <button
                    onClick={() => setNotifDrawerOpen(false)}
                    className="p-1.5 text-slate-400 hover:text-slate-650 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer border-0 bg-transparent"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* List */}
              <div className="flex-grow overflow-y-auto p-4 space-y-3">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-450 dark:text-slate-500 space-y-2">
                    <Bell className="w-8 h-8 text-slate-300 dark:text-slate-700 animate-pulse" />
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-200">All caught up!</p>
                    <p className="text-[10px] text-center max-w-[200px] leading-relaxed">We'll alert you here when local incidents occur or community updates are posted.</p>
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={async () => {
                        await handleMarkNotificationRead(notif.id);
                        setNotifDrawerOpen(false);
                        // Redirect to the target issue or community
                        if (notif.type === 'NEW_ISSUE' || notif.type === 'STATUS_CHANGE') {
                          handleSelectIssue(notif.targetId);
                        } else if (notif.type === 'MEMBER_REQUEST' || notif.type === 'ROLE_PROMOTED') {
                          setSelectedCommunityId(notif.targetId);
                          handleNavigation('communities');
                        }
                      }}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer flex gap-3 text-left ${
                        notif.isRead
                          ? 'bg-slate-50/50 dark:bg-slate-800/30 border-slate-150/40 dark:border-slate-800/40'
                          : 'bg-emerald-50/30 dark:bg-emerald-950/10 border-emerald-100 dark:border-emerald-900/30 shadow-[0_1px_2px_rgba(16,185,129,0.05)]'
                      }`}
                    >
                      <div className="flex-grow space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-extrabold text-slate-900 dark:text-slate-150 leading-tight">
                            {notif.title}
                          </span>
                          {!notif.isRead && (
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0 animate-ping" />
                          )}
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
                          {notif.body}
                        </p>
                        <span className="text-[8px] text-slate-400 dark:text-slate-550 font-mono block">
                          {new Date(notif.createdAt).toLocaleDateString()} at {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Floating Sync & Offline Banner (Industry Standard) */}
      <AnimatePresence>
        {(!isOnline || syncStatus) && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-2.5 px-4 py-2.5 rounded-full border text-[11px] font-bold shadow-lg transition-all ${
              !isOnline 
                ? 'bg-amber-600 border-amber-500 text-white' 
                : 'bg-slate-900 dark:bg-slate-800 border-slate-800 dark:border-slate-700 text-white'
            }`}
          >
            {!isOnline ? (
              <>
                <AlertTriangle className="w-4 h-4 text-white animate-pulse" />
                <span>Offline Mode: Changes will sync to server when connection returns.</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
                <span>{syncStatus}</span>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
