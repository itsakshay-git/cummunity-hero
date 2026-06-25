export interface Community {
  id: string;
  name: string;
  type: 'Apartment' | 'Housing Society' | 'Street' | 'Ward' | 'Village' | 'Campus' | 'Market' | 'Other';
  description: string;
  areaName: string;
  latitude: number;
  longitude: number;
  createdBy: string;
  adminIds: string[];
  memberIds: string[];
  reputationScore: number;
  totalIssues: number;
  resolvedIssues: number;
  createdAt: string;
  updatedAt: string;

  // Social schema additions
  slug?: string;
  coverImageUrl?: string;
  logoUrl?: string;
  memberCount?: number;
  healthScore?: number;
  level?: number;
  activeIssues?: number;
}

export interface CommunityMember {
  id: string; // memberId
  communityId: string;
  userId: string;
  role: 'MEMBER' | 'ADMIN' | 'RESOLVER' | 'AUTHORITY';
  status: 'PENDING' | 'APPROVED' | 'BLOCKED';
  contributionScore: number;
  joinedAt: string;
}
