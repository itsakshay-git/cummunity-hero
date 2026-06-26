import { User, Badge } from '../../types';
import { ALL_BADGES } from '../../lib/constants';

// Centralized XP values for different civic activities
export const XP_VALUATION = {
  REPORT: 100,
  SUPPORT: 10,
  COMMENT: 15,
  VERIFY: 15, // Evaluates to 15 XP as per useAppState.ts cast vote logic
  RESOLVE: 150,
  DAILY_ACTIVITY: 20
};

export interface LevelDetails {
  title: string;
  level: number;
  color: string;
  badgeColor: string;
}

/**
 * Returns level information based on reputation score (XP).
 * Levels: Citizen, Reporter, Community Helper, Civic Hero, Community Champion, Guardian, Community Legend
 */
export function getLevelInfo(score: number): LevelDetails {
  if (score >= 1500) return { title: "Community Legend", level: 8, color: "text-rose-600 bg-rose-50 border-rose-200", badgeColor: "bg-rose-500" };
  if (score >= 1200) return { title: "Guardian", level: 7, color: "text-purple-600 bg-purple-50 border-purple-200", badgeColor: "bg-purple-500" };
  if (score >= 900) return { title: "Community Champion", level: 6, color: "text-indigo-600 bg-indigo-50 border-indigo-200", badgeColor: "bg-indigo-500" };
  if (score >= 600) return { title: "Civic Hero", level: 5, color: "text-amber-600 bg-amber-50 border-amber-200", badgeColor: "bg-amber-500" };
  if (score >= 400) return { title: "Civic Contributor", level: 4, color: "text-blue-600 bg-blue-50 border-blue-200", badgeColor: "bg-blue-500" };
  if (score >= 200) return { title: "Community Helper", level: 3, color: "text-emerald-600 bg-emerald-50 border-emerald-200", badgeColor: "bg-emerald-500" };
  if (score >= 100) return { title: "Reporter", level: 2, color: "text-teal-600 bg-teal-50 border-teal-200", badgeColor: "bg-teal-500" };
  return { title: "Citizen", level: 1, color: "text-slate-600 bg-slate-50 border-slate-200", badgeColor: "bg-slate-400" };
}

/**
 * Evaluates the list of badge objects a user qualifies for based on their stats.
 */
export function evaluateBadges(user: User): any[] {
  const badges: any[] = [];
  
  const firstRep = ALL_BADGES.find(b => b.id === 'first_rep');
  if (firstRep && user.reportsCreated && user.reportsCreated >= 1) {
    badges.push(firstRep);
  }
  
  const topVerifier = ALL_BADGES.find(b => b.id === 'top_verifier');
  // Support either reportsVerified or totalVerifications
  const verificationsCount = user.reportsVerified || user.totalVerifications || 0;
  if (topVerifier && verificationsCount >= 10) {
    badges.push(topVerifier);
  }
  
  const roadGuard = ALL_BADGES.find(b => b.id === 'road_guard');
  if (roadGuard && user.reportsCreated && user.reportsCreated >= 3) {
    badges.push(roadGuard);
  }
  
  const commBuilder = ALL_BADGES.find(b => b.id === 'comm_builder');
  if (commBuilder && user.joinedCommunities && user.joinedCommunities.length > 1) {
    badges.push(commBuilder);
  }
  
  const probSolver = ALL_BADGES.find(b => b.id === 'prob_solver');
  const resolvedCount = user.reportsResolved || 0;
  if (probSolver && resolvedCount >= 1) {
    badges.push(probSolver);
  }
  
  const civicHero = ALL_BADGES.find(b => b.id === 'civic_hero');
  const currentXP = user.reputationScore || user.xp || 0;
  if (civicHero && currentXP >= 600) {
    badges.push(civicHero);
  }
  
  return badges;
}
