export type IssueStatus =
  | 'OPEN'
  | 'AI_ANALYZED'
  | 'COMMUNITY_VERIFIED'
  | 'PRIORITIZED'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'RESOLUTION_UPLOADED'
  | 'RESOLVED'
  | 'CLOSED'
  | 'REOPENED';

export type IssueCategory =
  | 'Pothole'
  | 'Garbage'
  | 'Water Leakage'
  | 'Streetlight'
  | 'Drainage'
  | 'Road Damage'
  | 'Public Safety'
  | 'Other';

export type SeverityLevel = 'Low' | 'Medium' | 'High' | 'Critical';

export interface AIAnalysisResult {
  category: IssueCategory;
  severity: SeverityLevel;
  riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  summary: string;
  suggestedDepartment: string;
  confidence: number;
  recommendedAction: string;
}

export interface Issue {
  id: string;
  communityId: string;
  title: string;
  description: string;
  category: IssueCategory;
  severity: SeverityLevel;
  status: IssueStatus;
  latitude: number;
  longitude: number;
  address: string;
  imageUrl: string;
  videoUrl?: string;
  reportedBy: string; // user ID
  reportedByName: string;
  aiSummary?: string;
  aiConfidence?: number;
  suggestedDepartment?: string;
  priorityScore: number;
  trustScore: number;
  verificationCount: number;
  fakeCount: number;
  supporterCount: number;
  duplicateOfIssueId?: string | null;
  assignedTo?: string; // user ID (Resolver)
  assignedToName?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  resolutionImageUrl?: string;
  resolutionNote?: string;

  // Social counters additions
  supportCount?: number;
  commentCount?: number;
  shareCount?: number;
  saveCount?: number;
  riskLevel?: 'Low' | 'Medium' | 'High' | 'Critical';
}

export interface IssueVerification {
  id: string;
  issueId: string;
  communityId: string;
  userId: string;
  userName: string;
  voteType: 'CONFIRM' | 'FAKE' | 'RESOLVED';
  comment?: string;
  createdAt: string;
}

export interface IssueUpdate {
  id: string;
  issueId: string;
  updatedBy: string;
  updatedByName: string;
  oldStatus: IssueStatus;
  newStatus: IssueStatus;
  note: string;
  imageUrl?: string;
  createdAt: string;
}
export interface Follows {
  id: string;
  followerId: string;
  followingUserId: string;
  createdAt: string;
}
