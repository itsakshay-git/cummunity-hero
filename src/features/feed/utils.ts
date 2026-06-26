import { User } from '../../types';
import { getLevelInfo as serviceGetLevelInfo, evaluateBadges } from '../../services/gamification/gamificationService';

// User Level helper based on reputationScore (XP)
export const getLevelInfo = (score: number) => {
  return serviceGetLevelInfo(score);
};

// Badges list helper based on stats
export const getUserBadges = (user: User) => {
  return evaluateBadges(user);
};

