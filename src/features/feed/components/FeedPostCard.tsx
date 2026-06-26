import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Heart, MessageSquare, Share2, Bookmark, Send, Loader2, Sparkles, Zap
} from 'lucide-react';
import { FeedPost, Community, User, Comment } from '../../../types';
import { getLevelInfo } from '../utils';
import Badge from '../../../components/ui/Badge';
import MediaCarousel from '../../../components/ui/MediaCarousel';

interface FeedPostCardProps {
  post: FeedPost;
  currentUser: User | null;
  communities: Community[];
  users: User[];
  onSelectIssue: (id: string) => void;
  onNavigate: (tab: string) => void;
  isSupported: boolean;
  isSaved: boolean;
  postComments: Comment[];
  isCommentsLoading: boolean;
  loadComments: (postId: string) => Promise<void>;
  toggleSupport: (postId: string) => Promise<void>;
  toggleSave: (postId: string) => Promise<void>;
  addComment: (postId: string, body: string, issueId?: string, communityId?: string) => Promise<void>;
  onEditComment?: (commentId: string, newBody: string, postId: string) => Promise<void>;
  onDeleteClick: (commentId: string, postId: string) => void;
  onShareClick: (title: string) => void;
  onViewUserProfile: (userId: string) => void;
}

const FeedPostCard: React.FC<FeedPostCardProps> = ({
  post,
  currentUser,
  communities,
  users,
  onSelectIssue,
  onNavigate,
  isSupported,
  isSaved,
  postComments,
  isCommentsLoading,
  loadComments,
  toggleSupport,
  toggleSave,
  addComment,
  onEditComment,
  onDeleteClick,
  onShareClick,
  onViewUserProfile,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [commentInput, setCommentInput] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  const activeComm = communities.find(c => c.id === post.communityId);
  const authorUser = users.find(u => u.id === post.userId);
  const authorLevel = authorUser ? getLevelInfo(authorUser.reputationScore) : null;
  const baseAffectedCount = 12 + (post.supportCount * 4);

  const handleSupportClick = async () => {
    await toggleSupport(post.id);
  };

  const handleSaveClick = async () => {
    await toggleSave(post.id);
  };

  const handleExpandDiscuss = async () => {
    if (expanded) {
      setExpanded(false);
    } else {
      setExpanded(true);
      await loadComments(post.id);
    }
  };

  const submitFeedComment = async (e: React.FormEvent) => {
    e.preventDefault();
    const txt = commentInput.trim();
    if (!txt) return;

    try {
      await addComment(post.id, txt, post.issueId || undefined, post.communityId);
      setCommentInput('');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden hover:shadow-md transition-all">
      <div className="p-4 pb-2.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-3.5">
          <img 
            src={authorUser?.photoUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(post.userId)}`} 
            alt={authorUser?.name || 'Civic Hero'} 
            className="w-10 h-10 rounded-xl object-cover border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 cursor-pointer hover:opacity-85 transition-opacity"
            referrerPolicy="no-referrer"
            onClick={() => onViewUserProfile(post.userId)}
          />
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span 
                className="font-black text-slate-900 dark:text-slate-100 text-xs leading-tight hover:underline cursor-pointer"
                onClick={() => onViewUserProfile(post.userId)}
              >
                {authorUser?.name || 'Civic Hero'}
              </span>
              {authorLevel && (
                <span className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded ${authorLevel.color}`}>
                  Lvl {authorLevel.level} {authorLevel.title}
                </span>
              )}
            </div>
            <div className="flex items-center space-x-1.5 mt-0.5 text-[10px] text-slate-400 font-medium">
              <span className="hover:underline cursor-pointer text-emerald-600 font-semibold" onClick={() => onNavigate('communities')}>
                {activeComm?.name || 'Local Space'}
              </span>
              <span>•</span>
              <span>{new Date(post.createdAt).toLocaleDateString()}</span>
              {post.type === 'ISSUE_REPORTED' && (
                <>
                  <span>•</span>
                  <div className="flex items-center space-x-1">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full inline-block"></span>
                    <span className="font-mono text-emerald-600 font-bold">Verified Issue</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Post type / Severity indicator */}
        {post.type === 'ISSUE_REPORTED' && post.severity && (
          <Badge variant="severity">{post.severity}</Badge>
        )}

        {post.type === 'ISSUE_RESOLVED' && (
          <Badge variant="status">RESOLVED</Badge>
        )}

        {post.type === 'COMMUNITY_UPDATE' && (
          <Badge variant="status" colorClass="bg-indigo-50/50 text-indigo-700 border-indigo-200/50">
            ANNOUNCEMENT
          </Badge>
        )}
      </div>

      {/* Post Body */}
      <div className="p-4 space-y-3">
        <div className="space-y-1">
          <h3 
            onClick={() => post.issueId && onSelectIssue(post.issueId)}
            className={`text-xs md:text-sm font-black text-slate-950 dark:text-slate-100 transition-colors leading-snug ${post.issueId ? 'hover:text-emerald-600 cursor-pointer' : ''}`}
          >
            {post.title}
          </h3>
          <p className="text-[11px] text-slate-650 dark:text-slate-350 leading-relaxed line-clamp-3">
            {post.body}
          </p>
        </div>

        {/* Category and Distance Tags */}
        {post.category && (
          <div className="flex flex-wrap gap-2">
            <Badge variant="category">#{post.category}</Badge>
            <Badge variant="status">{post.status || 'ACTIVE'}</Badge>
          </div>
        )}

        {/* Media Attachments Carousel / Single Image */}
        {((post.mediaAttachments && post.mediaAttachments.length > 0) || post.imageUrl) ? (
          <div 
            onClick={() => post.issueId && onSelectIssue(post.issueId)}
            className={post.issueId ? 'cursor-pointer' : ''}
          >
            <MediaCarousel 
              attachments={post.mediaAttachments}
              fallbackUrl={post.imageUrl}
              aspectRatioClassName="aspect-video"
            />
          </div>
        ) : null}
      </div>

      {/* Post Engagement count */}
      <div className="px-4 pb-2 text-[10px] text-slate-450 dark:text-slate-500 font-semibold flex justify-between border-b border-slate-100/50 dark:border-slate-805/50">
        <span>{baseAffectedCount} citizens affected</span>
        <button 
          onClick={handleExpandDiscuss}
          className="hover:underline text-emerald-600 font-bold"
        >
          {post.commentCount || 0} discussion replies
        </button>
      </div>

      {/* Social Actions bar */}
      <div className="px-4 py-2 bg-slate-50/50 dark:bg-slate-900/60 flex items-center justify-between">
        <button 
          id={`btn-support-${post.id}`}
          onClick={handleSupportClick}
          className={`flex items-center space-x-1 text-xs font-black px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
            isSupported 
              ? 'bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 font-black' 
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Heart className={`w-3.5 h-3.5 ${isSupported ? 'fill-rose-500 text-rose-500 animate-pulse' : ''}`} />
          <span>{isSupported ? `Supported (${post.supportCount})` : `Support (${post.supportCount})`}</span>
        </button>

        <button 
          id={`btn-expand-comments-${post.id}`}
          onClick={handleExpandDiscuss}
          className={`flex items-center space-x-1 text-xs font-black px-2.5 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer text-slate-650 dark:text-slate-400 ${
            expanded ? 'bg-slate-100 dark:bg-slate-800 text-emerald-650 dark:text-emerald-400 font-bold' : ''
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Discuss ({post.commentCount})</span>
        </button>

        <button 
          onClick={() => onShareClick(post.title)}
          className="flex items-center space-x-1 text-xs font-black px-2.5 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer text-slate-650 dark:text-slate-400"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Share</span>
        </button>

        <button 
          onClick={handleSaveClick}
          className="flex items-center space-x-1 text-xs font-black px-2.5 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer text-slate-650 dark:text-slate-400"
        >
          <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-emerald-605 text-emerald-500' : ''}`} />
          <span className="hidden sm:inline">{isSaved ? 'Saved' : 'Save'}</span>
        </button>
      </div>

      {/* Expanded discussion pane */}
      <AnimatePresence>
        {expanded && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-slate-50 dark:bg-slate-950/40 border-t border-slate-100 dark:border-slate-800/80 overflow-hidden"
          >
            <div className="p-4 space-y-3">
              <h4 className="font-extrabold text-slate-900 dark:text-slate-200 text-xs">Community Discussion</h4>
              
              {/* Inner Comment list */}
              <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                {isCommentsLoading ? (
                  <div className="flex items-center justify-center p-4">
                    <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
                  </div>
                ) : postComments.length === 0 ? (
                  <p className="text-[11px] text-slate-500 italic">No comments yet. Start the conversation below!</p>
                ) : (
                  postComments.map((comment: Comment) => {
                    const isEditing = editingCommentId === comment.id;
                    return (
                      <div key={comment.id} className="p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-xl space-y-1 shadow-sm flex items-start gap-2.5">
                        <img 
                          src={comment.userPhotoUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(comment.userId)}`}
                          alt={comment.userName}
                          className="w-7 h-7 rounded-lg object-cover flex-shrink-0 cursor-pointer hover:opacity-85 transition-opacity"
                          onClick={() => onViewUserProfile(comment.userId)}
                        />
                        <div className="flex-grow space-y-0.5">
                          <div className="flex items-center justify-between text-[10px]">
                            <span 
                              className="font-black text-slate-905 dark:text-slate-200 hover:underline cursor-pointer"
                              onClick={() => onViewUserProfile(comment.userId)}
                            >
                              {comment.userName}
                            </span>
                            <div className="flex items-center space-x-2">
                              <span className="text-slate-400">
                                {new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              {currentUser && comment.userId === currentUser.id && !isEditing && (
                                <div className="flex items-center space-x-1.5 ml-2 border-l border-slate-200 dark:border-slate-700 pl-2">
                                  <button
                                    onClick={() => {
                                      setEditingCommentId(comment.id);
                                      setEditingText(comment.body);
                                    }}
                                    className="text-slate-400 hover:text-emerald-600 transition-colors text-[9px] font-bold cursor-pointer"
                                  >
                                    Edit
                                  </button>
                                  <span className="text-slate-300">|</span>
                                  <button
                                    onClick={() => onDeleteClick(comment.id, post.id)}
                                    className="text-slate-400 hover:text-red-600 transition-colors text-[9px] font-bold cursor-pointer"
                                  >
                                    Delete
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {isEditing ? (
                            <div className="flex gap-2 items-center mt-1.5">
                              <input
                                type="text"
                                value={editingText}
                                onChange={(e) => setEditingText(e.target.value)}
                                className="flex-grow px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-xs rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                              />
                              <button
                                onClick={async () => {
                                  if (editingText.trim() && onEditComment) {
                                    await onEditComment(comment.id, editingText.trim(), post.id);
                                  }
                                  setEditingCommentId(null);
                                }}
                                className="px-2.5 py-1 bg-emerald-650 bg-emerald-600 text-white rounded-lg text-[10px] font-bold cursor-pointer hover:bg-emerald-500 transition-colors"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingCommentId(null)}
                                className="px-2.5 py-1 bg-slate-200 text-slate-600 rounded-lg text-[10px] font-bold cursor-pointer hover:bg-slate-300 transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <p className="text-xs text-slate-700 dark:text-slate-300 leading-normal">
                              {comment.body}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Comment Form */}
              {currentUser && (
                <form 
                  onSubmit={submitFeedComment} 
                  className="flex gap-2 pt-3 border-t border-slate-100 dark:border-slate-800"
                >
                  <input 
                    type="text" 
                    placeholder="Add an update comment, verify details or coordinate repairs..."
                    value={commentInput}
                    onChange={(e) => setCommentInput(e.target.value)}
                    className="flex-grow px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 text-xs rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    required
                  />
                  <button 
                    type="submit"
                    className="px-3 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all flex items-center space-x-1 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default React.memo(FeedPostCard);
