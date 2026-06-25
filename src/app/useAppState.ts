import { useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, getDocs, writeBatch, updateDoc, deleteDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase/firebaseClient';
import { mockUsers, mockCommunities, mockIssues, mockVerifications, mockComments, mockActivities } from '../lib/mockData';
import { User, Issue, Community, IssueVerification, UserRole, IssueStatus, Comment, UserActivity } from '../types';
import { useFeedPosts } from '../features/feed/hooks/useFeedPosts';
import { getLevelInfo } from '../features/feed/utils';

// Helper to recursively sanitize objects for Firestore by converting/stripping undefined values
const cleanUndefined = (obj: any): any => {
  if (obj === undefined) return null;
  if (obj === null) return null;
  if (Array.isArray(obj)) {
    return obj.map(cleanUndefined);
  }
  if (typeof obj === 'object') {
    const res: any = {};
    for (const key in obj) {
      if (obj[key] !== undefined) {
        res[key] = cleanUndefined(obj[key]);
      }
    }
    return res;
  }
  return obj;
};

export function useAppState() {
  const [appStarted, setAppStarted] = useState(false);
  const [activeTab, setActiveTab] = useState('feed');
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);

  // Core application states (simulated local DB collections)
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [communities, setCommunities] = useState(mockCommunities);
  const [issues, setIssues] = useState(mockIssues);
  const [verifications, setVerifications] = useState(mockVerifications);
  const [comments, setComments] = useState<Comment[]>(mockComments);
  const [activities, setActivities] = useState<UserActivity[]>(mockActivities);

  // Real Auth & Profile States
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentRole, setCurrentRole] = useState<UserRole>('Citizen');
  const [selectedCommunityId, setSelectedCommunityId] = useState<string>('all');
  
  // Auth UI Controls
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalRole, setAuthModalRole] = useState<UserRole>('Citizen');
  const [authLoading, setAuthLoading] = useState(true);

  // Lifted feed posts hook
  const {
    posts: feedPosts,
    loading: feedLoading,
    supportedPostIds,
    savedPostIds,
    commentsCache,
    commentsLoading,
    loadComments,
    toggleSupport,
    toggleSave,
    addComment,
    editComment,
    deleteComment,
    addNewPost
  } = useFeedPosts(currentUser);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            const profile = userDocSnap.data() as User;
            setCurrentUser(profile);
            setCurrentRole(profile.role);
            setAppStarted(true);
          } else {
            // Profile fallback setup
            const defaultProfile: User = {
              id: firebaseUser.uid,
              name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Civic Hero',
              email: firebaseUser.email || 'sandbox@communityhero.net',
              photoUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(firebaseUser.uid)}`,
              role: 'Citizen',
              joinedCommunities: ['comm_1'],
              reputationScore: 100,
              points: 100,
              reportsCreated: 0,
              reportsVerified: 0,
              reportsResolved: 0,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            try {
              await setDoc(userDocRef, cleanUndefined(defaultProfile));
            } catch (writeErr) {
              console.warn('Could not write user profile to Firestore (using local fallback):', writeErr);
            }
            setCurrentUser(defaultProfile);
            setCurrentRole('Citizen');
            setAppStarted(true);
          }
        } catch (e) {
          console.error('Error fetching/creating user profile from Firestore:', e);
          const fallbackProfile: User = {
            id: firebaseUser.uid,
            name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Civic Hero',
            email: firebaseUser.email || 'sandbox@communityhero.net',
            photoUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(firebaseUser.uid)}`,
            role: 'Citizen',
            joinedCommunities: ['comm_1'],
            reputationScore: 100,
            points: 100,
            reportsCreated: 0,
            reportsVerified: 0,
            reportsResolved: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          setCurrentUser(fallbackProfile);
          setCurrentRole('Citizen');
          setAppStarted(true);
        }
      } else {
        setCurrentUser(null);
        setAppStarted(false);
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Sync current user into the users collection for list components
  useEffect(() => {
    if (currentUser) {
      setUsers(prev => {
        const filtered = prev.filter(u => u.id !== currentUser.id);
        return [currentUser, ...filtered];
      });
    }
  }, [currentUser]);

  // Fetch & Seed Communities from Firestore
  useEffect(() => {
    const fetchAndSeedCommunities = async () => {
      if (!appStarted) return;
      try {
        const querySnapshot = await getDocs(collection(db, 'communities'));
        if (querySnapshot.empty) {
          console.log('Seeding default communities into Firestore...');
          const batch = writeBatch(db);
          mockCommunities.forEach((comm) => {
            const docRef = doc(db, 'communities', comm.id);
            batch.set(docRef, comm);
          });
          await batch.commit();
          setCommunities(mockCommunities);
        } else {
          const loaded: Community[] = [];
          querySnapshot.forEach((doc) => {
            loaded.push(doc.data() as Community);
          });
          loaded.sort((a, b) => a.id.localeCompare(b.id));
          setCommunities(loaded);
        }
      } catch (err) {
        console.warn('Could not load communities from Firestore (using local fallback mock data):', err);
        setCommunities(mockCommunities);
      }
    };

    fetchAndSeedCommunities();
  }, [appStarted]);

  // Fetch & Seed Issues from Firestore
  useEffect(() => {
    const fetchAndSeedIssues = async () => {
      if (!appStarted) return;
      try {
        const querySnapshot = await getDocs(collection(db, 'issues'));
        if (querySnapshot.empty) {
          console.log('Seeding default issues into Firestore...');
          const batch = writeBatch(db);
          mockIssues.forEach((issue) => {
            const docRef = doc(db, 'issues', issue.id);
            batch.set(docRef, issue);
          });
          await batch.commit();
          setIssues(mockIssues);
        } else {
          const loaded: Issue[] = [];
          querySnapshot.forEach((doc) => {
            loaded.push(doc.data() as Issue);
          });
          loaded.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
          setIssues(loaded);
        }
      } catch (err) {
        console.warn('Could not load issues from Firestore (using local fallback mock data):', err);
        setIssues(mockIssues);
      }
    };

    fetchAndSeedIssues();
  }, [appStarted]);

  // Fetch & Seed Verifications from Firestore
  useEffect(() => {
    const fetchAndSeedVerifications = async () => {
      if (!appStarted) return;
      try {
        const querySnapshot = await getDocs(collection(db, 'verifications'));
        if (querySnapshot.empty) {
          console.log('Seeding default verifications into Firestore...');
          const batch = writeBatch(db);
          mockVerifications.forEach((verification) => {
            const docRef = doc(db, 'verifications', verification.id);
            batch.set(docRef, verification);
          });
          await batch.commit();
          setVerifications(mockVerifications);
        } else {
          const loaded: IssueVerification[] = [];
          querySnapshot.forEach((doc) => {
            loaded.push(doc.data() as IssueVerification);
          });
          loaded.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
          setVerifications(loaded);
        }
      } catch (err) {
        console.warn('Could not load verifications from Firestore (using local fallback mock data):', err);
        setVerifications(mockVerifications);
      }
    };

    fetchAndSeedVerifications();
  }, [appStarted]);

  // Fetch & Seed Comments from Firestore
  useEffect(() => {
    const fetchAndSeedComments = async () => {
      if (!appStarted) return;
      try {
        const querySnapshot = await getDocs(collection(db, 'comments'));
        if (querySnapshot.empty) {
          console.log('Seeding default comments into Firestore...');
          const batch = writeBatch(db);
          mockComments.forEach((c) => {
            const docRef = doc(db, 'comments', c.id);
            batch.set(docRef, c);
          });
          await batch.commit();
          setComments(mockComments);
        } else {
          const loaded: Comment[] = [];
          querySnapshot.forEach((doc) => {
            loaded.push(doc.data() as Comment);
          });
          loaded.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
          setComments(loaded);
        }
      } catch (err) {
        console.warn('Could not load comments from Firestore (using local fallback mock data):', err);
        setComments(mockComments);
      }
    };

    fetchAndSeedComments();
  }, [appStarted]);

  // Fetch & Seed Activities from Firestore
  useEffect(() => {
    const fetchAndSeedActivities = async () => {
      if (!appStarted) return;
      try {
        const querySnapshot = await getDocs(collection(db, 'activities'));
        if (querySnapshot.empty) {
          console.log('Seeding default activities into Firestore...');
          const batch = writeBatch(db);
          mockActivities.forEach((a) => {
            const docRef = doc(db, 'activities', a.id);
            batch.set(docRef, a);
          });
          await batch.commit();
          setActivities(mockActivities);
        } else {
          const loaded: UserActivity[] = [];
          querySnapshot.forEach((doc) => {
            loaded.push(doc.data() as UserActivity);
          });
          loaded.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
          setActivities(loaded);
        }
      } catch (err) {
        console.warn('Could not load activities from Firestore (using local fallback):', err);
        setActivities(mockActivities);
      }
    };

    fetchAndSeedActivities();
  }, [appStarted]);

  const updateUserProfile = useCallback(async (updates: Partial<User>) => {
    if (!currentUser) return;
    const newRep = updates.reputationScore !== undefined ? updates.reputationScore : (currentUser.reputationScore || 0);
    const computedLevel = getLevelInfo(newRep).level;
    const updatedProfile = {
      ...currentUser,
      ...updates,
      xp: newRep,
      level: computedLevel,
      updatedAt: new Date().toISOString(),
    };
    setCurrentUser(updatedProfile);

    try {
      const userDocRef = doc(db, 'users', currentUser.id);
      await setDoc(userDocRef, cleanUndefined(updatedProfile), { merge: true });
    } catch (e) {
      console.error('Error updating profile in Firestore:', e);
    }
  }, [currentUser]);

  const handleRoleChange = useCallback(async (newRole: UserRole) => {
    setCurrentRole(newRole);
    if (currentUser) {
      await updateUserProfile({ role: newRole });
    }
  }, [currentUser, updateUserProfile]);

  const handleStartApp = useCallback((initialRole?: string) => {
    if (initialRole) {
      setAuthModalRole(initialRole as UserRole);
    }
    setAuthModalOpen(true);
  }, []);

  const handleSignOut = useCallback(async () => {
    try {
      await signOut(auth);
      setAppStarted(false);
    } catch (e) {
      console.error('Error during sign out:', e);
    }
  }, []);

  const handleCreateIssue = useCallback(async (newIssueData: any) => {
    if (!currentUser) return;
    const newId = `issue_${Date.now()}`;
    const newIssue: Issue = {
      id: newId,
      reportedBy: currentUser.id,
      reportedByName: currentUser.name,
      trustScore: 70,
      verificationCount: 0,
      fakeCount: 0,
      supporterCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...newIssueData
    };

    setIssues(prev => [newIssue, ...prev]);

    try {
      await setDoc(doc(db, 'issues', newId), cleanUndefined(newIssue));
      
      const feedPostId = `post_${newId}`;
      const newFeedPost = {
        id: feedPostId,
        type: 'ISSUE_REPORTED' as const,
        issueId: newId,
        communityId: newIssue.communityId,
        userId: currentUser.id,
        title: newIssue.title,
        body: newIssue.description,
        imageUrl: newIssue.imageUrl,
        status: newIssue.status,
        category: newIssue.category,
        severity: newIssue.severity,
        visibility: 'PUBLIC' as const,
        supportCount: 0,
        commentCount: 0,
        shareCount: 0,
        saveCount: 0,
        createdAt: newIssue.createdAt,
        updatedAt: newIssue.updatedAt
      };
      await setDoc(doc(db, 'feed_posts', feedPostId), cleanUndefined(newFeedPost));
      addNewPost(newFeedPost);
    } catch (e) {
      console.error('Error saving issue/feed post to Firestore:', e);
    }
    
    setCommunities(prevComms => prevComms.map(c => {
      if (c.id === newIssueData.communityId) {
        const updatedTotal = c.totalIssues + 1;
        setDoc(doc(db, 'communities', c.id), { totalIssues: updatedTotal }, { merge: true })
          .catch(e => console.warn('Could not update total issues in Firestore:', e));
        return {
          ...c,
          totalIssues: updatedTotal
        };
      }
      return c;
    }));

    updateUserProfile({
      reputationScore: currentUser.reputationScore + 100,
      points: currentUser.points + 100,
      reportsCreated: currentUser.reportsCreated + 1
    });

    const activityId = `act_${Date.now()}`;
    const newActivity: UserActivity = {
      id: activityId,
      userId: currentUser.id,
      type: 'report',
      targetId: newId,
      targetTitle: newIssue.title,
      createdAt: new Date().toISOString(),
      pointsEarned: 100
    };
    setActivities(prev => [newActivity, ...prev]);
    setDoc(doc(db, 'activities', activityId), cleanUndefined(newActivity))
      .catch(err => console.warn('Could not save activity to Firestore:', err));
  }, [currentUser, addNewPost, updateUserProfile]);

  const handleCreateCommunity = useCallback(async (newCommData: any) => {
    if (!currentUser) return;
    const newId = `comm_${Date.now()}`;
    const newComm: Community = {
      id: newId,
      createdBy: currentUser.id,
      adminIds: [currentUser.id],
      memberIds: [currentUser.id],
      reputationScore: 80,
      totalIssues: 0,
      resolvedIssues: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...newCommData
    };

    setCommunities(prev => [...prev, newComm]);

    try {
      await setDoc(doc(db, 'communities', newId), cleanUndefined(newComm));
    } catch (e) {
      console.error('Error saving community to Firestore:', e);
    }
  }, [currentUser]);

  const handleJoinCommunity = useCallback(async (id: string) => {
    if (!currentUser) return;
    const updatedJoined = currentUser.joinedCommunities.includes(id)
      ? currentUser.joinedCommunities
      : [...currentUser.joinedCommunities, id];
    
    updateUserProfile({
      joinedCommunities: updatedJoined
    });

    setCommunities(prevComms => prevComms.map(c => {
      if (c.id === id) {
        const updatedMembers = c.memberIds.includes(currentUser.id)
          ? c.memberIds
          : [...c.memberIds, currentUser.id];
        
        setDoc(doc(db, 'communities', id), { memberIds: updatedMembers }, { merge: true })
          .catch(e => console.warn('Could not update community members in Firestore:', e));

        return {
          ...c,
          memberIds: updatedMembers
        };
      }
      return c;
    }));

    const actId = `act_${Date.now()}`;
    const newAct: UserActivity = {
      id: actId,
      userId: currentUser.id,
      type: 'join_community',
      targetId: id,
      targetTitle: communities.find(c => c.id === id)?.name || 'Community Space',
      createdAt: new Date().toISOString(),
      pointsEarned: 0
    };
    setActivities(prev => [newAct, ...prev]);
    setDoc(doc(db, 'activities', actId), cleanUndefined(newAct))
      .catch(e => console.warn('Could not update join activity in Firestore:', e));
  }, [currentUser, communities, updateUserProfile]);

  const handleLeaveCommunity = useCallback(async (id: string) => {
    if (!currentUser) return;
    const updatedJoined = currentUser.joinedCommunities.filter(cid => cid !== id);
    updateUserProfile({
      joinedCommunities: updatedJoined
    });

    setCommunities(prevComms => prevComms.map(c => {
      if (c.id === id) {
        const updatedMembers = c.memberIds.filter(uid => uid !== currentUser.id);

        setDoc(doc(db, 'communities', id), { memberIds: updatedMembers }, { merge: true })
          .catch(e => console.warn('Could not update community members in Firestore:', e));

        return {
          ...c,
          memberIds: updatedMembers
        };
      }
      return c;
    }));
  }, [currentUser, updateUserProfile]);

  const handleCastVoteWithId = useCallback(async (issueId: string, voteType: 'CONFIRM' | 'FAKE' | 'RESOLVED', comment: string) => {
    if (!issueId || !currentUser) return;

    const newVote: IssueVerification = {
      id: `v_${Date.now()}`,
      issueId: issueId,
      communityId: issues.find(i => i.id === issueId)?.communityId || '',
      userId: currentUser.id,
      userName: currentUser.name,
      voteType,
      comment,
      createdAt: new Date().toISOString()
    };

    setVerifications(prev => [...prev, newVote]);

    try {
      await setDoc(doc(db, 'verifications', newVote.id), cleanUndefined(newVote));
    } catch (e) {
      console.error('Error saving verification vote to Firestore:', e);
    }

    setIssues(prevIssues => prevIssues.map(i => {
      if (i.id === issueId) {
        let trustDiff = 0;
        let pScoreDiff = 0;
        let vCount = i.verificationCount;
        let fCount = i.fakeCount;

        if (voteType === 'CONFIRM') {
          vCount += 1;
          trustDiff = 5;
          pScoreDiff = 2;
        } else if (voteType === 'FAKE') {
          fCount += 1;
          trustDiff = -15;
          pScoreDiff = -5;
        } else if (voteType === 'RESOLVED') {
          trustDiff = 10;
        }

        const updatedIssue = {
          ...i,
          verificationCount: vCount,
          fakeCount: fCount,
          trustScore: Math.min(100, Math.max(0, i.trustScore + trustDiff)),
          priorityScore: Math.min(100, Math.max(0, i.priorityScore + pScoreDiff))
        };

        setDoc(doc(db, 'issues', i.id), cleanUndefined(updatedIssue))
          .catch(e => console.error('Error updating issue stats in Firestore:', e));

        return updatedIssue;
      }
      return i;
    }));

    updateUserProfile({
      reputationScore: currentUser.reputationScore + 15,
      points: currentUser.points + 15,
      reportsVerified: currentUser.reportsVerified + 1
    });

    const actId = `act_${Date.now()}`;
    const newAct: UserActivity = {
      id: actId,
      userId: currentUser.id,
      type: 'verify',
      targetId: issueId,
      targetTitle: issues.find(i => i.id === issueId)?.title || 'Civic Issue',
      createdAt: new Date().toISOString(),
      pointsEarned: 15
    };
    setActivities(prev => [newAct, ...prev]);
    setDoc(doc(db, 'activities', actId), cleanUndefined(newAct))
      .catch(e => console.warn('Could not save activity in Firestore:', e));
  }, [currentUser, issues, updateUserProfile]);

  const handleCastVote = useCallback(async (voteType: 'CONFIRM' | 'FAKE' | 'RESOLVED', comment: string) => {
    if (!selectedIssueId) return;
    await handleCastVoteWithId(selectedIssueId, voteType, comment);
  }, [selectedIssueId, handleCastVoteWithId]);

  const handleToggleSupport = useCallback(async (postId: string) => {
    if (!currentUser) return;
    const isSupporting = !supportedPostIds.includes(postId);
    const issueId = postId.startsWith('post_') ? postId.replace('post_', '') : postId;
    const postTitle = (feedPosts || []).find(p => p.id === postId)?.title;
    const issueTitle = issues.find(i => i.id === issueId)?.title;
    const targetTitle = postTitle || issueTitle || 'Civic Issue';

    try {
      await toggleSupport(postId);

      if (isSupporting) {
        updateUserProfile({
          reputationScore: (currentUser.reputationScore || 0) + 10,
          points: (currentUser.points || 0) + 10
        });

        const actId = `act_${Date.now()}`;
        const newAct: UserActivity = {
          id: actId,
          userId: currentUser.id,
          type: 'support',
          targetId: issueId,
          targetTitle,
          createdAt: new Date().toISOString(),
          pointsEarned: 10
        };
        setActivities(prev => [newAct, ...prev]);
        await setDoc(doc(db, 'activities', actId), cleanUndefined(newAct));

        setIssues(prev => prev.map(i => {
          if (i.id === issueId) {
            return {
              ...i,
              supporterCount: (i.supporterCount || 0) + 1,
              supportCount: (i.supporterCount || 0) + 1,
              priorityScore: Math.min(100, (i.priorityScore || 0) + 5)
            };
          }
          return i;
        }));
      } else {
        updateUserProfile({
          reputationScore: Math.max(0, (currentUser.reputationScore || 0) - 10),
          points: Math.max(0, (currentUser.points || 0) - 10)
        });

        const actToRemove = activities.find(a => a.userId === currentUser.id && a.type === 'support' && a.targetId === issueId);
        if (actToRemove) {
          setActivities(prev => prev.filter(a => a.id !== actToRemove.id));
          await deleteDoc(doc(db, 'activities', actToRemove.id));
        }

        setIssues(prev => prev.map(i => {
          if (i.id === issueId) {
            return {
              ...i,
              supporterCount: Math.max(0, (i.supporterCount || 0) - 1),
              supportCount: Math.max(0, (i.supporterCount || 0) - 1),
              priorityScore: Math.max(0, (i.priorityScore || 0) - 5)
            };
          }
          return i;
        }));
      }
    } catch (err) {
      console.error("Error toggling support in App:", err);
    }
  }, [currentUser, supportedPostIds, feedPosts, issues, toggleSupport, updateUserProfile, activities]);

  const handleToggleSave = useCallback(async (postId: string) => {
    if (!currentUser) return;
    const isSaving = !savedPostIds.includes(postId);
    const postTitle = (feedPosts || []).find(p => p.id === postId)?.title || 'Saved Post';

    try {
      await toggleSave(postId);

      if (isSaving) {
        const actId = `act_${Date.now()}`;
        const newAct: UserActivity = {
          id: actId,
          userId: currentUser.id,
          type: 'save',
          targetId: postId,
          targetTitle: postTitle,
          createdAt: new Date().toISOString(),
          pointsEarned: 0
        };
        setActivities(prev => [newAct, ...prev]);
        await setDoc(doc(db, 'activities', actId), cleanUndefined(newAct));
      } else {
        const actToRemove = activities.find(a => a.userId === currentUser.id && a.type === 'save' && a.targetId === postId);
        if (actToRemove) {
          setActivities(prev => prev.filter(a => a.id !== actToRemove.id));
          await deleteDoc(doc(db, 'activities', actToRemove.id));
        }
      }
    } catch (err) {
      console.error("Error toggling save in App:", err);
    }
  }, [currentUser, savedPostIds, feedPosts, toggleSave, activities]);

  const handleAddFeedComment = useCallback(async (postId: string, body: string, issueId?: string, communityId?: string) => {
    if (!currentUser) return;
    try {
      const comment = await addComment(postId, body, issueId, communityId);
      if (comment) {
        setComments(prev => [...prev, comment]);

        updateUserProfile({
          reputationScore: (currentUser.reputationScore || 0) + 15,
          points: (currentUser.points || 0) + 15
        });

        const actId = `act_${Date.now()}`;
        const targetId = issueId || postId.replace('post_', '');
        const targetTitle = (feedPosts || []).find(p => p.id === postId)?.title || issues.find(i => i.id === targetId)?.title || 'Civic Issue';
        
        const newAct: UserActivity = {
          id: actId,
          userId: currentUser.id,
          type: 'comment',
          targetId,
          targetTitle,
          createdAt: new Date().toISOString(),
          pointsEarned: 15
        };
        setActivities(prev => [newAct, ...prev]);
        await setDoc(doc(db, 'activities', actId), cleanUndefined(newAct));
      }
    } catch (err) {
      console.error("Error adding feed comment in App:", err);
    }
  }, [currentUser, addComment, feedPosts, issues, updateUserProfile]);

  const handleEditFeedComment = useCallback(async (commentId: string, newBody: string, postId: string) => {
    try {
      await editComment(commentId, newBody, postId);
      setComments(prev => prev.map(c => c.id === commentId ? { ...c, body: newBody, updatedAt: new Date().toISOString() } : c));
    } catch (err) {
      console.error("Error editing comment from App:", err);
    }
  }, [editComment]);

  const handleDeleteFeedComment = useCallback(async (commentId: string, postId: string) => {
    try {
      await deleteComment(commentId, postId);
      setComments(prev => prev.filter(c => c.id !== commentId));
    } catch (err) {
      console.error("Error deleting comment from App:", err);
    }
  }, [deleteComment]);

  const handleSupportIssue = useCallback(async (issueId: string) => {
    if (!currentUser) return;

    setIssues(prevIssues => prevIssues.map(i => {
      if (i.id === issueId) {
        const updatedIssue = {
          ...i,
          supporterCount: (i.supporterCount || 0) + 1,
          supportCount: (i.supporterCount || 0) + 1,
          priorityScore: Math.min(100, i.priorityScore + 5)
        };

        setDoc(doc(db, 'issues', i.id), cleanUndefined(updatedIssue))
          .catch(e => console.error('Error saving supported count in Firestore:', e));

        return updatedIssue;
      }
      return i;
    }));

    updateUserProfile({
      reputationScore: currentUser.reputationScore + 10,
      points: currentUser.points + 10
    });

    const actId = `act_${Date.now()}`;
    const newAct: UserActivity = {
      id: actId,
      userId: currentUser.id,
      type: 'support',
      targetId: issueId,
      targetTitle: issues.find(i => i.id === issueId)?.title || 'Civic Issue',
      createdAt: new Date().toISOString(),
      pointsEarned: 10
    };
    setActivities(prev => [newAct, ...prev]);
    setDoc(doc(db, 'activities', actId), cleanUndefined(newAct))
      .catch(e => console.warn('Could not save support activity to Firestore:', e));
  }, [currentUser, issues, updateUserProfile]);

  const handleAddComment = useCallback(async (issueId: string, body: string) => {
    if (!currentUser) return;
    const newCommentId = `comment_${Date.now()}`;
    const newComment: Comment = {
      id: newCommentId,
      issueId,
      userId: currentUser.id,
      userName: currentUser.name,
      userPhotoUrl: currentUser.photoUrl,
      body,
      createdAt: new Date().toISOString()
    };
    setComments(prev => [...prev, newComment]);

    try {
      await setDoc(doc(db, 'comments', newCommentId), cleanUndefined(newComment));
    } catch (e) {
      console.error('Error saving comment in Firestore:', e);
    }

    updateUserProfile({
      reputationScore: currentUser.reputationScore + 15,
      points: currentUser.points + 15
    });

    const actId = `act_${Date.now()}`;
    const newAct: UserActivity = {
      id: actId,
      userId: currentUser.id,
      type: 'comment',
      targetId: issueId,
      targetTitle: issues.find(i => i.id === issueId)?.title || 'Civic Issue',
      createdAt: new Date().toISOString(),
      pointsEarned: 15
    };
    setActivities(prev => [newAct, ...prev]);
    try {
      await setDoc(doc(db, 'activities', actId), cleanUndefined(newAct));
    } catch (e) {
      console.warn(e);
    }
  }, [currentUser, issues, updateUserProfile]);

  const handleAdminUpdate = useCallback((status: IssueStatus, note: string, resolutionImg?: string) => {
    if (!selectedIssueId || !currentUser) return;

    setIssues(prevIssues => prevIssues.map(i => {
      if (i.id === selectedIssueId) {
        const isResolved = status === 'RESOLVED';
        const updatedIssue = {
          ...i,
          status,
          resolutionNote: note,
          resolutionImageUrl: resolutionImg,
          resolvedAt: isResolved ? new Date().toISOString() : undefined,
          updatedAt: new Date().toISOString()
        };

        setDoc(doc(db, 'issues', i.id), cleanUndefined(updatedIssue))
          .then(() => {
            const feedPostId = `post_${i.id}`;
            const feedPostRef = doc(db, 'feed_posts', feedPostId);
            getDoc(feedPostRef).then(snap => {
              if (snap.exists()) {
                updateDoc(feedPostRef, {
                  status,
                  type: status === 'RESOLVED' ? ('ISSUE_RESOLVED' as const) : ('ISSUE_REPORTED' as const),
                  updatedAt: new Date().toISOString()
                }).catch(err => console.warn('Could not update feed post:', err));
              }
            }).catch(err => console.warn('Could not find feed post to update status:', err));
          })
          .catch(e => console.error('Error saving updated issue status in Firestore:', e));

        return updatedIssue;
      }
      return i;
    }));

    if (status === 'RESOLVED') {
      const activeIssue = issues.find(i => i.id === selectedIssueId);
      if (activeIssue) {
        setCommunities(prevComms => prevComms.map(c => {
          if (c.id === activeIssue.communityId) {
            const updatedResolved = c.resolvedIssues + 1;
            const updatedScore = Math.min(100, c.reputationScore + 4);

            setDoc(doc(db, 'communities', c.id), { 
              resolvedIssues: updatedResolved,
              reputationScore: updatedScore
            }, { merge: true })
              .catch(e => console.warn('Could not update community resolution stats in Firestore:', e));

            return {
              ...c,
              resolvedIssues: updatedResolved,
              reputationScore: updatedScore
            };
          }
          return c;
        }));

        updateUserProfile({
          reputationScore: currentUser.reputationScore + 150,
          points: currentUser.points + 150,
          reportsResolved: currentUser.reportsResolved + 1
        });

        const actId = `act_${Date.now()}`;
        const newAct: UserActivity = {
          id: actId,
          userId: currentUser.id,
          type: 'resolve',
          targetId: activeIssue.id,
          targetTitle: activeIssue.title,
          createdAt: new Date().toISOString(),
          pointsEarned: 150
        };
        setActivities(prev => [newAct, ...prev]);
        setDoc(doc(db, 'activities', actId), cleanUndefined(newAct))
          .catch(e => console.warn('Could not save resolve activity to Firestore:', e));
      }
    }
  }, [selectedIssueId, currentUser, issues, updateUserProfile]);

  const handleSelectIssue = useCallback((id: string) => {
    setSelectedIssueId(id);
    setActiveTab('issue-details');
  }, []);

  const handleNavigation = useCallback((tab: string) => {
    setActiveTab(tab);
    setSelectedIssueId(null);
  }, []);

  return {
    appStarted,
    activeTab,
    selectedIssueId,
    users,
    communities,
    issues,
    verifications,
    comments,
    activities,
    currentUser,
    currentRole,
    selectedCommunityId,
    authModalOpen,
    authModalRole,
    authLoading,
    feedPosts,
    feedLoading,
    supportedPostIds,
    savedPostIds,
    commentsCache,
    commentsLoading,
    setAuthModalOpen,
    setSelectedCommunityId,
    setAppStarted,
    loadComments,
    updateUserProfile,
    handleRoleChange,
    handleStartApp,
    handleSignOut,
    handleCreateIssue,
    handleCreateCommunity,
    handleJoinCommunity,
    handleLeaveCommunity,
    handleCastVote,
    handleToggleSupport,
    handleToggleSave,
    handleAddFeedComment,
    handleEditFeedComment,
    handleDeleteFeedComment,
    handleSupportIssue,
    handleAddComment,
    handleAdminUpdate,
    handleSelectIssue,
    handleNavigation
  };
}
