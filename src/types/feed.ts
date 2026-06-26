import { IssueCategory, SeverityLevel, IssueStatus } from './issue';

export interface FeedPost {
  id: string; // postId
  type: 'ISSUE_REPORTED' | 'ISSUE_RESOLVED' | 'COMMUNITY_UPDATE' | 'BADGE_EARNED' | 'CHALLENGE_UPDATE';
  issueId?: string;
  communityId: string;
  userId: string;
  title: string;
  body: string;
  imageUrl?: string;
  status?: IssueStatus;
  category?: IssueCategory;
  severity?: SeverityLevel;
  visibility: 'PUBLIC' | 'COMMUNITY' | 'PRIVATE';
  supportCount: number;
  commentCount: number;
  shareCount: number;
  saveCount: number;
  createdAt: string;
  updatedAt: string;
  mediaAttachments?: { type: 'image' | 'video'; url: string }[];
}

export interface PostReaction {
  id: string; // reactionId
  postId: string;
  userId: string;
  reactionType: 'SUPPORT' | 'LIKE' | 'INSPIRED' | 'URGENT';
  createdAt: string;
}

export interface Comment {
  id: string; // commentId
  postId?: string; // Optional if referencing feed post
  issueId?: string; // Optional if referencing direct issue
  communityId?: string;
  userId: string;
  userName: string;
  userPhotoUrl?: string;
  parentCommentId?: string | null;
  body: string;
  likeCount?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface SavedPost {
  id: string; // saveId
  postId: string;
  userId: string;
  createdAt: string;
}
