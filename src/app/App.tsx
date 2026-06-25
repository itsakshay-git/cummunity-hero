/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shield, Building2, AlertTriangle, PlusCircle, 
  Award, Map, LogOut, User as UserIcon, Users, Compass, Flame, Zap
} from 'lucide-react';

import AuthModal from '../features/auth/components/AuthModal';
import LandingPage from '../components/layout/LandingPage';
import { useAppState } from './useAppState';
import { UserRole, IssueStatus } from '../types';

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
    handleCreateCommunity,
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
    handleNavigation
  } = useAppState();

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
        />
      </>
    );
  }

  const activeIssue = issues.find(i => i.id === selectedIssueId);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">

      {/* Mobile Header */}
      <header className="md:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-40 font-sans">
        <div className="flex items-center space-x-2 cursor-pointer" onClick={() => handleNavigation('feed')}>
          <div className="p-1.5 bg-emerald-600 rounded-lg text-white">
            <Shield className="w-4 h-4" />
          </div>
          <span className="font-bold tracking-tight text-slate-900 text-sm">Community Hero</span>
        </div>
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => handleNavigation('profile')}
            className="w-8 h-8 rounded-full overflow-hidden border border-slate-200 cursor-pointer"
          >
            <img src={currentUser.photoUrl} alt="Avatar" className="w-full h-full object-cover" />
          </button>
          <button 
            onClick={handleSignOut}
            className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg bg-slate-50 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Core Shell */}
      <div className="flex-grow flex flex-col md:flex-row pb-16 md:pb-0">
        
        {/* Sidebar */}
        <aside className="hidden md:flex w-64 bg-white border-r border-slate-200 flex-col justify-between flex-shrink-0">
          <div className="p-6 font-sans">
            {/* Logo */}
            <div className="flex items-center space-x-3 mb-8 cursor-pointer" onClick={() => handleNavigation('feed')}>
              <div className="p-2 bg-emerald-600 rounded-xl text-white">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold tracking-tight text-slate-900 block leading-tight">Community Hero</span>
                <span className="text-[9px] font-mono font-medium tracking-wider text-slate-400 uppercase">AI Civic Console</span>
              </div>
            </div>

            {/* Sidebar navigation */}
            <nav className="space-y-1.5">
              <button 
                id="sidebar-nav-feed"
                onClick={() => handleNavigation('feed')}
                className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                  activeTab === 'feed' ? 'bg-slate-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-50/50 hover:text-slate-900'
                }`}
              >
                <Compass className="w-4 h-4 flex-shrink-0" />
                <span>Hyperlocal Feed</span>
              </button>

              <button 
                id="sidebar-nav-dashboard"
                onClick={() => handleNavigation('dashboard')}
                className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                  activeTab === 'dashboard' ? 'bg-slate-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-50/50 hover:text-slate-900'
                }`}
              >
                <Users className="w-4 h-4 flex-shrink-0" />
                <span>Bento Dashboard</span>
              </button>

              <button 
                id="sidebar-nav-communities"
                onClick={() => {
                  setSelectedCommunityId('all');
                  handleNavigation('communities');
                }}
                className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                  activeTab === 'communities' ? 'bg-slate-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-50/50 hover:text-slate-900'
                }`}
              >
                <Building2 className="w-4 h-4 flex-shrink-0" />
                <span>Community Spaces</span>
              </button>

              <button 
                id="sidebar-nav-map"
                onClick={() => handleNavigation('map-explorer')}
                className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                  activeTab === 'map-explorer' ? 'bg-slate-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-50/50 hover:text-slate-900'
                }`}
              >
                <Map className="w-4 h-4 flex-shrink-0" />
                <span>Map Explorer</span>
              </button>

              <button 
                id="sidebar-nav-issues"
                onClick={() => handleNavigation('issues')}
                className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                  activeTab === 'issues' || activeTab === 'issue-details' ? 'bg-slate-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-50/50 hover:text-slate-900'
                }`}
              >
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>Incidents Directory</span>
              </button>

              <button 
                id="sidebar-nav-report"
                onClick={() => handleNavigation('report')}
                className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                  activeTab === 'report' ? 'bg-slate-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-50/50 hover:text-slate-900'
                }`}
              >
                <PlusCircle className="w-4 h-4 flex-shrink-0" />
                <span>Report an Issue</span>
              </button>

              <button 
                id="sidebar-nav-challenges"
                onClick={() => handleNavigation('challenges')}
                className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                  activeTab === 'challenges' ? 'bg-slate-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-50/50 hover:text-slate-900'
                }`}
              >
                <Flame className="w-4 h-4 flex-shrink-0 text-orange-500 animate-pulse" />
                <span>Civic Challenges</span>
              </button>

              <button 
                id="sidebar-nav-leaderboard"
                onClick={() => handleNavigation('leaderboard')}
                className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                  activeTab === 'leaderboard' ? 'bg-slate-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-50/50 hover:text-slate-900'
                }`}
              >
                <Award className="w-4 h-4 flex-shrink-0 text-amber-500" />
                <span>Civic Champions</span>
              </button>

              <button 
                id="sidebar-nav-profile"
                onClick={() => handleNavigation('profile')}
                className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                  activeTab === 'profile' ? 'bg-slate-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-50/50 hover:text-slate-900'
                }`}
              >
                <UserIcon className="w-4 h-4 flex-shrink-0" />
                <span>My Profile</span>
              </button>
            </nav>
          </div>

          {/* User profile capsule */}
          <div className="p-6 border-t border-slate-100 font-sans">
            <div 
              className="flex items-center space-x-3 mb-4 cursor-pointer hover:bg-slate-50 p-2 rounded-xl transition-all"
              onClick={() => handleNavigation('profile')}
            >
              <img 
                src={currentUser.photoUrl} 
                alt="Avatar" 
                className="w-10 h-10 rounded-full border border-slate-200 object-cover"
              />
              <div className="min-w-0">
                <span className="font-bold text-slate-900 text-xs block truncate leading-tight">{currentUser.name}</span>
                <span className="text-[10px] text-slate-400 font-medium block truncate">Rep: {currentUser.reputationScore} points</span>
              </div>
            </div>

            <button 
              id="sidebar-sign-out"
              onClick={handleSignOut}
              className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-semibold rounded-lg transition-all flex items-center justify-center space-x-1.5 cursor-pointer border border-slate-200"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </aside>

        {/* Dynamic Canvas Area */}
        <main className="flex-grow p-6 md:p-10 max-w-7xl mx-auto w-full overflow-y-auto">
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
                  issues={issues}
                  communities={communities}
                  users={users}
                  currentUser={currentUser}
                  onSelectIssue={handleSelectIssue}
                  onNavigate={handleNavigation}
                  posts={feedPosts}
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
                  />
                )
              )}

              {activeTab === 'report' && (
                <ReportIssueForm 
                  communities={communities}
                  onSubmit={handleCreateIssue}
                  onNavigate={handleNavigation}
                />
              )}

              {activeTab === 'map-explorer' && (
                <MapExplorer 
                  issues={issues}
                  onSelectIssue={handleSelectIssue}
                />
              )}

              {activeTab === 'issues' && (
                <IssuesList 
                  issues={issues}
                  communities={communities}
                  onSelectIssue={handleSelectIssue}
                  selectedCommunityId={selectedCommunityId}
                  setSelectedCommunityId={setSelectedCommunityId}
                />
              )}

              {activeTab === 'issue-details' && activeIssue && (
                <IssueDetails 
                  issue={activeIssue}
                  verifications={verifications}
                  onBack={() => handleNavigation('issues')}
                  onCastVote={handleCastVote}
                  currentUserRole={currentRole}
                  onAdminUpdate={handleAdminUpdate}
                />
              )}

              {activeTab === 'leaderboard' && (
                <Leaderboard 
                  users={users}
                  communities={communities}
                  currentUser={currentUser}
                />
              )}

              {activeTab === 'profile' && (
                <ProfilePage
                  user={currentUser}
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

              {activeTab === 'challenges' && (
                <div className="space-y-6 animate-fade-in pb-16 font-sans">
                  <div>
                    <h1 className="text-xl md:text-2xl font-black text-slate-950 tracking-tight">Civic Challenges Hub</h1>
                    <p className="text-xs text-slate-500 mt-1">Complete neighborhood quests to earn XP badges and climb the civic honor roll.</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-orange-100 text-orange-600 rounded-2xl">
                          <Flame className="w-6 h-6 animate-pulse" />
                        </div>
                        <div className="space-y-1">
                          <span className="text-[9px] font-bold text-orange-600 font-mono uppercase bg-orange-50 px-2.5 py-0.5 rounded-full">Weekly Quest</span>
                          <h3 className="font-extrabold text-slate-900 text-sm">Cleanliness Drive Audit</h3>
                          <p className="text-xs text-slate-500 leading-normal">Verify at least 3 garbage-piling reports in your area to earn the Cleanliness Champion badge.</p>
                        </div>
                      </div>
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
                        <span>Reward: 150 Reputation XP</span>
                        <span className="text-orange-600 font-bold">Ends in 3 days</span>
                      </div>
                    </div>

                    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-blue-100 text-blue-600 rounded-2xl">
                          <Zap className="w-6 h-6 animate-pulse" />
                        </div>
                        <div className="space-y-1">
                          <span className="text-[9px] font-bold text-blue-600 font-mono uppercase bg-blue-50 px-2 py-0.5 rounded-full">Daily Quest</span>
                          <h3 className="font-extrabold text-slate-900 text-sm">Hyperlocal Supporter</h3>
                          <p className="text-xs text-slate-500 leading-normal">Support at least 1 reported neighbor issue today to build civic cohesion.</p>
                        </div>
                      </div>
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
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

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-6 py-2.5 flex items-center justify-between z-40 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] font-sans">
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
      />
    </div>
  );
}
