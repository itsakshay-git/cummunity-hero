import React, { useState, useEffect } from 'react';
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
import { useInfiniteScroll } from '../../../hooks/useInfiniteScroll';

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
  searchQuery?: string;
  onViewUserProfile: (userId: string) => void;
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
  onDeleteComment,
  searchQuery = '',
  onViewUserProfile
}: FeedProps) {
  const [feedFilter, setFeedFilter] = useState<'all' | 'my-spaces' | 'resolved'>('all');
  const [shareToast, setShareToast] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState<{ commentId: string, postId: string } | null>(null);
  
  const [visibleCount, setVisibleCount] = useState(5);

  useEffect(() => {
    setVisibleCount(5);
  }, [feedFilter, searchQuery]);

  // Filter feed posts based on active filter segment & search query
  const filteredPosts = posts.filter(post => {
    // 1. Filter by feed filter tab
    if (feedFilter === 'resolved') {
      if (post.status !== 'RESOLVED' && post.status !== 'CLOSED' && post.type !== 'ISSUE_RESOLVED') {
        return false;
      }
    } else if (feedFilter === 'my-spaces' && currentUser) {
      if (!currentUser.joinedCommunities.includes(post.communityId)) {
        return false;
      }
    }

    // 2. Filter by search query if provided
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchesTitle = post.title?.toLowerCase().includes(q);
      const matchesBody = post.body?.toLowerCase().includes(q);
      const matchesCategory = post.category?.toLowerCase().includes(q);
      
      const commName = communities.find(c => c.id === post.communityId)?.name?.toLowerCase() || '';
      const matchesCommunity = commName.includes(q);

      const authorName = users.find(u => u.id === post.userId)?.name?.toLowerCase() || '';
      const matchesAuthor = authorName.includes(q);

      if (!matchesTitle && !matchesBody && !matchesCategory && !matchesCommunity && !matchesAuthor) {
        return false;
      }
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
    <div className="space-y-6 animate-fade-in pb-12 font-sans">
      {/* Top Navigation Switcher Header */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 w-full mb-4 transition-colors">
        <button
          onClick={() => setFeedFilter('all')}
          className={`flex-1 text-center py-3 text-xs font-bold transition-all relative cursor-pointer bg-transparent border-none ${
            feedFilter === 'all' ? 'text-slate-900 dark:text-slate-100 font-black' : 'text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-300'
          }`}
        >
          Discover
          {feedFilter === 'all' && (
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-[3px] bg-emerald-600 rounded-full" />
          )}
        </button>
        <button
          onClick={() => setFeedFilter('my-spaces')}
          className={`flex-1 text-center py-3 text-xs font-bold transition-all relative cursor-pointer bg-transparent border-none ${
            feedFilter === 'my-spaces' ? 'text-slate-900 dark:text-slate-100 font-black' : 'text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-300'
          }`}
        >
          My Spaces
          {feedFilter === 'my-spaces' && (
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-[3px] bg-emerald-600 rounded-full" />
          )}
        </button>
        <button
          onClick={() => setFeedFilter('resolved')}
          className={`flex-1 text-center py-3 text-xs font-bold transition-all relative cursor-pointer bg-transparent border-none ${
            feedFilter === 'resolved' ? 'text-slate-900 dark:text-slate-100 font-black' : 'text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-300'
          }`}
        >
          Resolved Audits
          {feedFilter === 'resolved' && (
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-[3px] bg-emerald-600 rounded-full" />
          )}
        </button>
      </div>

      {/* Social Quick Composer */}
      {currentUser && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex gap-3 shadow-[0_1px_3px_rgba(0,0,0,0.01)] transition-colors">
          <img src={currentUser.photoUrl} className="w-9 h-9 rounded-full object-cover border border-slate-100 dark:border-slate-800 flex-shrink-0 bg-slate-100 animate-fade-in" />
          <div className="flex-grow space-y-3">
            <button
              onClick={() => onNavigate('report')}
              className="w-full text-left py-2.5 px-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-xl text-slate-450 dark:text-slate-400 text-xs hover:bg-slate-100/60 dark:hover:bg-slate-800 transition-colors cursor-pointer font-medium"
            >
              What civic issue needs attention today, {currentUser.name.split(' ')[0]}?
            </button>
            <div className="flex justify-between items-center text-[10px] text-slate-400 dark:text-slate-500 font-semibold px-1">
              <span className="flex items-center gap-1.5 cursor-pointer hover:text-slate-800 dark:hover:text-slate-300" onClick={() => onNavigate('report')}>
                <Compass className="w-3.5 h-3.5 text-emerald-500" /> Share Incident (+100 XP)
              </span>
              <span className="flex items-center gap-1.5 cursor-pointer hover:text-slate-800 dark:hover:text-slate-300" onClick={() => onNavigate('map-explorer')}>
                <MapPin className="w-3.5 h-3.5 text-blue-500" /> View Map Coordinates
              </span>
            </div>
          </div>
        </div>
      )}

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

      {/* Feed stream */}
      {(() => {
        const lastElementRef = useInfiniteScroll({
          onLoadMore: () => setVisibleCount(prev => prev + 5),
          hasMore: visibleCount < filteredPosts.length,
          isLoading: feedLoading
        });
        const displayedPosts = filteredPosts.slice(0, visibleCount);

        return (
          <div className="space-y-5">
            {feedLoading ? (
              <div className="flex flex-col items-center justify-center p-12 text-slate-400 space-y-3">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
                <span className="text-xs font-semibold">Loading real-time social timeline...</span>
              </div>
            ) : filteredPosts.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center text-slate-500 dark:text-slate-400 space-y-2 shadow-[0_1px_3px_rgba(0,0,0,0.01)]">
                <Compass className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">No posts in this feed segment.</p>
                <p className="text-xs text-slate-400 dark:text-slate-500">Be the first to submit a report in your community area!</p>
              </div>
            ) : (
              displayedPosts.map((post, idx) => {
                const isSupported = supportedPostIds.includes(post.id);
                const isSaved = savedPostIds.includes(post.id);
                const postComments = commentsCache[post.id] || [];
                const isCommentsLoading = commentsLoading[post.id];
                const isLast = idx === displayedPosts.length - 1;

                return (
                  <div key={post.id} ref={isLast ? lastElementRef : undefined}>
                    <FeedPostCard
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
                      onViewUserProfile={onViewUserProfile}
                    />
                  </div>
                );
              })
            )}
          </div>
        );
      })()}

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
