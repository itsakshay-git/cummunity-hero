import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Flame, Award, ShieldAlert, Sparkles, Zap, MessageSquare, 
  Share2, Bookmark, CheckCircle2, Heart, Megaphone, Users, 
  Send, Compass, HelpCircle, MapPin, Search, ArrowRight, UserCheck, BrainCircuit, Loader2
} from 'lucide-react';
import { Issue, Community, User, Comment, FeedPost } from '../../../types';
import CustomModal from '../../../components/Modal';
import FeedPostCard from './FeedPostCard';
import { getLevelInfo, getUserBadges } from '../utils';

interface FeedProps {
  issues: Issue[];
  communities: Community[];
  users: User[];
  currentUser: User | null;
  onSelectIssue: (id: string) => void;
  onNavigate: (tab: string) => void;
  posts: FeedPost[];
  feedLoading: boolean;
  supportedPostIds: string[];
  savedPostIds: string[];
  commentsCache: { [postId: string]: Comment[] };
  commentsLoading: { [postId: string]: boolean };
  loadComments: (postId: string) => Promise<void>;
  toggleSupport: (postId: string) => Promise<void>;
  toggleSave: (postId: string) => Promise<void>;
  addComment: (postId: string, body: string, issueId?: string, communityId?: string) => Promise<void>;
  onEditComment?: (commentId: string, newBody: string, postId: string) => Promise<void>;
  onDeleteComment?: (commentId: string, postId: string) => Promise<void>;
}

export default function Feed({
  issues,
  communities,
  users,
  currentUser,
  onSelectIssue,
  onNavigate,
  posts,
  feedLoading,
  supportedPostIds,
  savedPostIds,
  commentsCache,
  commentsLoading,
  loadComments,
  toggleSupport,
  toggleSave,
  addComment,
  onEditComment,
  onDeleteComment
}: FeedProps) {
  const [feedFilter, setFeedFilter] = useState<'all' | 'my-spaces' | 'resolved'>('all');
  const [shareToast, setShareToast] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState<{ commentId: string, postId: string } | null>(null);

  // Filter feed posts based on active filter segment
  const filteredPosts = posts.filter(post => {
    if (feedFilter === 'resolved') {
      return post.status === 'RESOLVED' || post.status === 'CLOSED' || post.type === 'ISSUE_RESOLVED';
    }
    if (feedFilter === 'my-spaces' && currentUser) {
      return currentUser.joinedCommunities.includes(post.communityId);
    }
    return true;
  });

  const handleShareClick = (title: string) => {
    setShareToast(`Link copied for: "${title}"`);
    setTimeout(() => setShareToast(null), 3000);
  };

  const handleDeleteClick = (commentId: string, postId: string) => {
    setCommentToDelete({ commentId, postId });
    setDeleteModalOpen(true);
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Search Header Banner */}
      <div className="bg-slate-900 text-white p-6 md:p-8 rounded-3xl relative overflow-hidden shadow-sm">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(16,185,129,0.2),rgba(255,255,255,0))]" />
        <div className="relative z-10 space-y-4">
          <div className="flex items-center space-x-2">
            <span className="bg-emerald-500/20 text-emerald-400 text-[10px] uppercase font-mono font-bold tracking-widest px-2.5 py-1 rounded-full border border-emerald-500/30">
              Community Hub
            </span>
            <span className="text-[10px] text-slate-400 font-mono">Real-Time Hub</span>
          </div>
          <div className="max-w-2xl space-y-2">
            <h1 className="text-xl md:text-3xl font-black font-sans tracking-tight text-white leading-tight">
              Hyperlocal Civic Feed
            </h1>
            <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
              Your neighborhood social network. Support reported issues, join collaborative discussions, track resolved actions, and compare health standings.
            </p>
          </div>

          {/* Quick Stats banner */}
          <div className="grid grid-cols-3 gap-4 pt-4 max-w-lg border-t border-slate-800/80">
            <div>
              <span className="block text-lg font-black text-white font-mono">{issues.length}</span>
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider font-sans">Active Reports</span>
            </div>
            <div>
              <span className="block text-lg font-black text-emerald-400 font-mono">
                {issues.filter(i => i.status === 'RESOLVED' || i.status === 'CLOSED').length}
              </span>
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider font-sans">Resolved</span>
            </div>
            <div>
              <span className="block text-lg font-black text-indigo-400 font-mono">{communities.length}</span>
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider font-sans">Spaces</span>
            </div>
          </div>
        </div>
      </div>

      {/* Share Toast Notification */}
      <AnimatePresence>
        {shareToast && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-6 right-6 z-[100] bg-slate-950 text-emerald-400 px-4 py-3 rounded-xl shadow-xl text-xs font-bold border border-emerald-500/20 flex items-center space-x-2"
          >
            <Zap className="w-4 h-4 text-emerald-400 animate-bounce" />
            <span>{shareToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filter Tabs & Quick Action */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-2">
        <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-2xl w-full sm:w-auto overflow-x-auto whitespace-nowrap">
          <button
            onClick={() => setFeedFilter('all')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center space-x-2 ${
              feedFilter === 'all' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Discover Feed</span>
          </button>
          <button
            onClick={() => setFeedFilter('my-spaces')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center space-x-2 ${
              feedFilter === 'my-spaces' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>My Spaces</span>
          </button>
          <button
            onClick={() => setFeedFilter('resolved')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center space-x-2 ${
              feedFilter === 'resolved' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Closed Actions</span>
          </button>
        </div>

        <button
          onClick={() => onNavigate('report')}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl shadow-sm transition-all flex items-center space-x-2 self-stretch sm:self-auto cursor-pointer"
        >
          <Zap className="w-3.5 h-3.5" />
          <span>Report Live Issue (+50 XP)</span>
        </button>
      </div>

      {/* Main Stream Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Columns: Feed stream */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Featured announcement / weekly challenge alert */}
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200/60 rounded-3xl p-5 relative overflow-hidden shadow-inner flex items-start gap-4">
            <div className="p-3 bg-emerald-600 text-white rounded-2xl">
              <Flame className="w-5 h-5 animate-pulse" />
            </div>
            <div className="space-y-1.5 flex-grow">
              <span className="text-[8px] font-mono font-bold uppercase text-emerald-700 tracking-wider">Weekly Challenge Active</span>
              <h3 className="font-extrabold text-slate-950 text-sm">Active Challenge: "Cleanliness Drive"</h3>
              <p className="text-xs text-slate-600 leading-relaxed max-w-xl">
                Verify at least 3 garbage-piling reports in your area to unlock the <strong>Road Guardian Badge</strong> and contribute 100 points to your Community Health Score!
              </p>
              <div className="flex items-center gap-4 pt-1.5 text-[10px] text-slate-500">
                <span className="font-semibold text-emerald-700">Ends in 3 days</span>
                <span>•</span>
                <span>Reward: 150 Reputation XP</span>
              </div>
            </div>
          </div>

          {/* Social Feed stream */}
          <div className="space-y-6">
            {feedLoading ? (
              <div className="flex flex-col items-center justify-center p-12 text-slate-400 space-y-3">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
                <span className="text-xs font-semibold">Loading real-time social timeline...</span>
              </div>
            ) : filteredPosts.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-500 space-y-2">
                <Compass className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-sm font-bold">No posts in this feed segment.</p>
                <p className="text-xs text-slate-400">Be the first to submit a report in your community area!</p>
              </div>
            ) : (
              filteredPosts.map(post => {
                const isSupported = supportedPostIds.includes(post.id);
                const isSaved = savedPostIds.includes(post.id);
                const postComments = commentsCache[post.id] || [];
                const isCommentsLoading = commentsLoading[post.id];

                return (
                  <FeedPostCard
                    key={post.id}
                    post={post}
                    currentUser={currentUser}
                    communities={communities}
                    users={users}
                    onSelectIssue={onSelectIssue}
                    onNavigate={onNavigate}
                    isSupported={isSupported}
                    isSaved={isSaved}
                    postComments={postComments}
                    isCommentsLoading={isCommentsLoading}
                    loadComments={loadComments}
                    toggleSupport={toggleSupport}
                    toggleSave={toggleSave}
                    addComment={addComment}
                    onEditComment={onEditComment}
                    onDeleteClick={handleDeleteClick}
                    onShareClick={handleShareClick}
                  />
                );
              })
            )}
          </div>

        </div>

        {/* Right 1 Column: Mini Leaderboard / Challenge widget panel */}
        <div className="space-y-6">
          
          {/* Reputation Info Box */}
          {currentUser && (
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-xs font-black text-slate-900">Your Civic Level</span>
                <span className="text-[10px] font-mono text-emerald-600 font-bold">Live Status</span>
              </div>

              <div className="flex items-center space-x-3.5">
                <div className="relative">
                  <img 
                    src={currentUser.photoUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(currentUser.id)}`} 
                    alt="Avatar" 
                    className="w-12 h-12 rounded-xl border border-slate-200 object-cover bg-slate-50"
                  />
                  <span className="absolute -bottom-1 -right-1 bg-emerald-600 text-white font-mono text-[9px] w-5 h-5 rounded-full flex items-center justify-center font-bold border-2 border-white">
                    {getLevelInfo(currentUser.reputationScore).level}
                  </span>
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-950 text-sm">{currentUser.name}</h4>
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${getLevelInfo(currentUser.reputationScore).color}`}>
                    {getLevelInfo(currentUser.reputationScore).title}
                  </span>
                </div>
              </div>

              {/* Progress bar to next level */}
              <div className="space-y-1 pt-2">
                <div className="flex justify-between text-[10px] font-bold text-slate-600">
                  <span>Reputation XP: {currentUser.reputationScore}</span>
                  <span>Goal: 1500 XP</span>
                </div>
                <div className="w-full bg-slate-150 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                    style={{ width: `${Math.min(100, (currentUser.reputationScore / 1500) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Badges Drawer */}
              <div className="pt-3 border-t border-slate-150 space-y-2">
                <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Unlocked Achievements ({getUserBadges(currentUser).length})</span>
                <div className="flex flex-wrap gap-1.5">
                  {getUserBadges(currentUser).map(badge => {
                    const BadgeIcon = badge.icon;
                    return (
                      <div 
                        key={badge.id}
                        title={badge.desc}
                        className="px-2 py-1 bg-slate-50 border border-slate-150 rounded-lg text-[9px] font-bold text-slate-700 flex items-center space-x-1 cursor-help hover:bg-slate-100 transition-colors"
                      >
                        <BadgeIcon className="w-3 h-3 text-emerald-600" />
                        <span>{badge.name}</span>
                      </div>
                    );
                  })}
                  {getUserBadges(currentUser).length === 0 && (
                    <span className="text-[10px] text-slate-400 italic font-medium">Verify or log a live hazard to earn your first badge!</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Top contributor mini-list */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-amber-500" />
                District Superheroes
              </span>
              <button 
                onClick={() => onNavigate('leaderboard')} 
                className="text-[10px] text-emerald-600 hover:underline font-bold"
              >
                Full List →
              </button>
            </div>

            <div className="space-y-3">
              {users.slice(0, 3).map((u, i) => {
                const lvl = getLevelInfo(u.reputationScore);
                return (
                  <div key={u.id} className="flex items-center justify-between text-xs font-medium">
                    <div className="flex items-center space-x-2.5">
                      <span className="text-slate-400 font-mono font-bold text-[10px]">#{i + 1}</span>
                      <img 
                        src={u.photoUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(u.id)}`} 
                        alt={u.name} 
                        className="w-8 h-8 rounded-lg object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div>
                        <span className="font-black text-slate-950 block leading-tight">{u.name}</span>
                        <span className="text-[9px] text-slate-400 font-semibold">{lvl.title}</span>
                      </div>
                    </div>
                    <span className="font-mono font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded text-[10px]">{u.reputationScore} XP</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Active Challenges */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-orange-500 animate-pulse" />
                Active Challenges
              </span>
              <button 
                onClick={() => onNavigate('challenges')} 
                className="text-[10px] text-emerald-600 hover:underline font-bold"
              >
                View All
              </button>
            </div>
            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl space-y-1">
                <span className="text-[8px] font-bold text-orange-600 font-mono">150 XP • Weekly</span>
                <h4 className="font-extrabold text-slate-950 text-xs">Cleanliness Drive Audit</h4>
                <p className="text-[10px] text-slate-500 leading-normal">Verify at least 3 garbage-piling reports in your joined communities.</p>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl space-y-1">
                <span className="text-[8px] font-bold text-blue-600 font-mono">100 XP • Daily</span>
                <h4 className="font-extrabold text-slate-950 text-xs">First Support Contribution</h4>
                <p className="text-[10px] text-slate-500 leading-normal">Review and support at least 1 community reported hazard today.</p>
              </div>
            </div>
          </div>

          {/* AI Insights Card */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                <BrainCircuit className="w-4 h-4 text-emerald-600" />
                AI Civic Insights
              </span>
            </div>
            <div className="space-y-2.5 text-xs">
              <p className="text-slate-600 leading-relaxed text-[11px]">
                "Water leakage issues have the highest priority scores in Green Park. Resolving them saves an estimated 2,400 liters of drinking water daily."
              </p>
              <div className="p-2.5 bg-emerald-50/50 rounded-xl border border-emerald-100 text-[10px] text-emerald-700 font-medium leading-normal">
                💡 <strong>Tip:</strong> Submitting reports with high-quality photos helps Gemini estimate severity with 94%+ accuracy.
              </div>
            </div>
          </div>

          {/* Interactive Community League ranking */}
          <div className="bg-slate-900 text-white p-6 rounded-3xl relative overflow-hidden shadow">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-bl-full pointer-events-none" />
            <h3 className="font-black text-xs text-emerald-400 font-mono tracking-widest uppercase mb-1.5">Weekly League</h3>
            <h4 className="font-extrabold text-sm mb-3">Top Leagues Active</h4>
            <div className="space-y-2 text-[11px] font-semibold text-slate-200">
              {communities.slice(0, 3).map((c, i) => (
                <div key={c.id} className="flex justify-between items-center bg-slate-800/50 p-2 rounded-xl">
                  <span>{i+1}. {c.name}</span>
                  <span className="text-emerald-400 font-mono text-[10px]">{c.reputationScore}% Rating</span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      <CustomModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setCommentToDelete(null);
        }}
        onConfirm={async () => {
          if (commentToDelete && onDeleteComment) {
            await onDeleteComment(commentToDelete.commentId, commentToDelete.postId);
          }
          setDeleteModalOpen(false);
          setCommentToDelete(null);
        }}
        title="Delete Comment"
        message="Are you sure you want to delete this comment? This action cannot be undone."
        type="confirm"
        confirmText="Delete"
        danger={true}
      />
    </div>
  );
}
