export type UserRole = 'Citizen' | 'Community Admin' | 'Resolver' | 'Authority';

export interface User {
  id: string;
  name: string;
  email: string;
  photoUrl?: string;
  role: UserRole;
  joinedCommunities: string[];
  reputationScore: number;
  points: number;
  reportsCreated: number;
  reportsVerified: number;
  reportsResolved: number;
  createdAt: string;
  updatedAt: string;
  
  // Social & Gamification additions
  xp?: number;
  level?: number;
  trustScore?: number;
  contributionScore?: number;
  bio?: string;
  coverImageUrl?: string;
  totalReports?: number;
  totalSupports?: number;
  totalComments?: number;
  badges?: string[];
  location?: string;
  username?: string;
  currentStreak?: number;
  longestStreak?: number;
  totalVerifications?: number;
  totalCommunities?: number;
  city?: string;
  district?: string;
  state?: string;
  completedChallenges?: string[];
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: 'NEW_ISSUE' | 'STATUS_CHANGE' | 'MEMBER_REQUEST' | 'ROLE_PROMOTED';
  targetId: string;
  isRead: boolean;
  createdAt: string;
}

export interface UserActivity {
  id: string;
  userId: string;
  type: 'report' | 'support' | 'comment' | 'verify' | 'resolve' | 'join_community' | 'REPORT_CREATED' | 'POST_SUPPORTED' | 'COMMENT_CREATED' | 'COMMUNITY_JOINED' | 'ISSUE_VERIFIED' | 'BADGE_EARNED' | 'ISSUE_RESOLVED' | 'save';
  targetId: string;
  targetType?: 'ISSUE' | 'POST' | 'COMMUNITY' | 'COMMENT' | 'BADGE';
  targetTitle: string;
  communityId?: string;
  metadata?: any;
  createdAt: string;
  pointsEarned: number;
}

export interface RewardRecord {
  id: string;
  userId: string;
  communityId: string;
  issueId?: string;
  actionType: string;
  points: number;
  createdAt: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: any; // Can be React Lucide component or name string
  category?: string;
  xpReward?: number;
  criteria?: string;
  createdAt?: string;
}

export interface UserBadge {
  id: string;
  userId: string;
  badgeId: string;
  earnedAt: string;
  sourceActivityId?: string;
}

export interface CivicChallenge {
  id: string;
  title: string;
  description: string;
  type: 'DAILY' | 'WEEKLY' | 'COMMUNITY';
  xpReward: number;
  badgeReward?: string;
  targetCount: number;
  communityId?: string;
  category?: string;
}
