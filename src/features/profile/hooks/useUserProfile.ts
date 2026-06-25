import { useState, useEffect, useCallback } from 'react';
import { profileService } from '../services/profileService';
import { User, UserActivity, Issue, Comment } from '../../../types';

export function useUserProfile(userId: string | undefined) {
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [reports, setReports] = useState<Issue[]>([]);
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);

  const fetchProfileData = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const [userProfile, userReports, userAct, userComm] = await Promise.all([
        profileService.getUserProfile(userId),
        profileService.getUserReports(userId),
        profileService.getUserActivity(userId),
        profileService.getUserComments(userId)
      ]);
      setProfile(userProfile);
      setReports(userReports);
      setActivities(userAct);
      setComments(userComm);
    } catch (err: any) {
      console.error("Failed to load user profile data:", err);
      setError(err.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchProfileData();
  }, [fetchProfileData]);

  const updateProfile = useCallback(async (data: Partial<User>) => {
    if (!userId || !profile) return;
    
    // Optimistic UI update
    const updated = { ...profile, ...data };
    setProfile(updated);

    try {
      await profileService.updateUserProfile(userId, data);
    } catch (err) {
      console.error("Failed to update user profile:", err);
      // Rollback
      setProfile(profile);
      throw err;
    }
  }, [userId, profile]);

  return {
    profile,
    loading,
    error,
    reports,
    activities,
    comments,
    refreshProfile: fetchProfileData,
    updateProfile
  };
}
