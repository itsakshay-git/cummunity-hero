import React from 'react';
import { Comment, Issue, Community } from '../../../../types';

interface CommentsTabProps {
  comments: Comment[];
  issues: Issue[];
  communities: Community[];
  onSelectIssue: (id: string) => void;
  onNavigate: (tab: string) => void;
}

export const CommentsTab: React.FC<CommentsTabProps> = ({
  comments,
  issues,
  communities,
  onSelectIssue,
  onNavigate
}) => {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-black text-slate-900">Comments Posted ({comments.length})</h3>
      <div className="space-y-3">
        {comments.map(comment => {
          const resolvedIssueId = comment.issueId || (comment.postId?.startsWith('post_') ? comment.postId.replace('post_', '') : comment.postId);
          const linkedIssue = issues.find(i => i.id === resolvedIssueId);
          const linkedCommunity = communities.find(c => c.id === comment.communityId);

          return (
            <div key={comment.id} className="p-4 bg-slate-50/50 border border-slate-200 rounded-2xl space-y-2">
              {linkedIssue ? (
                <div 
                  onClick={() => onSelectIssue(linkedIssue.id)}
                  className="text-[10px] text-emerald-600 font-bold hover:underline cursor-pointer flex items-center gap-1 w-fit"
                >
                  <span>On incident: {linkedIssue.title}</span>
                </div>
              ) : linkedCommunity ? (
                <div 
                  onClick={() => onNavigate('communities')}
                  className="text-[10px] text-indigo-600 font-bold hover:underline cursor-pointer flex items-center gap-1 w-fit"
                >
                  <span>On community space: {linkedCommunity.name}</span>
                </div>
              ) : null}
              <p className="text-xs text-slate-800 leading-normal font-medium bg-white px-3.5 py-2.5 rounded-xl border border-slate-100 shadow-sm">
                {comment.body}
              </p>
              <span className="block text-[9px] font-mono text-slate-400">
                {new Date(comment.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
              </span>
            </div>
          );
        })}
        {comments.length === 0 && (
          <p className="text-xs text-slate-500 italic">You haven't posted any comments yet.</p>
        )}
      </div>
    </div>
  );
};

export default CommentsTab;
