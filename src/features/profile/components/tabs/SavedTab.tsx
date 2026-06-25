import React from 'react';
import { Bookmark } from 'lucide-react';
import { FeedPost, Issue } from '../../../../types';
import Badge from '../../../../components/ui/Badge';

interface SavedTabProps {
  savedPosts: FeedPost[];
  issues: Issue[];
  onSelectIssue: (id: string) => void;
  onToggleSave?: (postId: string) => Promise<void>;
}

export const SavedTab: React.FC<SavedTabProps> = ({
  savedPosts,
  issues,
  onSelectIssue,
  onToggleSave
}) => {
  const handleSavedItemClick = (post: FeedPost) => {
    const issueId = post.issueId || post.id.replace('post_', '');
    if (issues.some(i => i.id === issueId)) {
      onSelectIssue(issueId);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-black text-slate-900">Saved Items ({savedPosts.length})</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {savedPosts.map(post => (
          <div 
            key={post.id} 
            onClick={() => handleSavedItemClick(post)}
            className="p-4 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 rounded-2xl flex gap-3 cursor-pointer transition-colors relative"
          >
            {post.imageUrl && (
              <img 
                src={post.imageUrl} 
                alt={post.title} 
                className="w-16 h-16 rounded-xl object-cover border border-slate-200 flex-shrink-0"
              />
            )}
            <div className="min-w-0 flex-grow">
              <div className="flex justify-between items-start gap-2">
                <Badge variant="category">
                  {post.category || 'Announcement'}
                </Badge>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onToggleSave) onToggleSave(post.id);
                  }}
                  className="text-slate-400 hover:text-amber-500 transition-colors p-1 rounded-lg bg-white shadow-sm border border-slate-100 cursor-pointer"
                >
                  <Bookmark className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                </button>
              </div>
              <h4 className="font-extrabold text-slate-900 text-xs block truncate mt-1.5">{post.title}</h4>
              <p className="text-[10px] text-slate-500 line-clamp-2 mt-0.5 font-medium leading-normal">
                {post.body}
              </p>
              <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100">
                <Badge variant="status" value={post.status || 'Active'}>
                  {post.status || 'Active'}
                </Badge>
                <span className="text-[8px] font-mono text-slate-400">
                  Saved on {new Date(post.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        ))}
        {savedPosts.length === 0 && (
          <p className="text-xs text-slate-500 italic col-span-2">You haven't saved any posts yet.</p>
        )}
      </div>
    </div>
  );
};

export default SavedTab;
