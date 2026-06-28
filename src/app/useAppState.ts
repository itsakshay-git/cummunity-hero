import { useState, useEffect, useCallback, useRef } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, getDocs, writeBatch, updateDoc, deleteDoc, query, where, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../services/firebase/firebaseClient';
import { mockUsers, mockCommunities, mockIssues, mockVerifications, mockComments, mockActivities, mockFeedPosts, mockChallenges } from '../lib/mockData';
import { User, Issue, Community, IssueVerification, UserRole, IssueStatus, Comment, UserActivity, Notification, CivicChallenge } from '../types';
import { useFeedPosts } from '../features/feed/hooks/useFeedPosts';
import { getLevelInfo } from '../features/feed/utils';
import { communitiesService } from '../features/communities/services/communitiesService';
import { getDistanceMeters } from '../lib/geoUtils';


// Helper to recursively sanitize objects for Firestore by converting/stripping undefined values

// Helper to create a status change notification for the original reporter
const createStatusChangeNotification = async (issueId: string, newStatus: IssueStatus, reporterId: string, issueTitle: string) => {
  if (!reporterId) return;
  // Avoid sending notification to the user performing the update
  if (currentUser && reporterId === currentUser.id) return;
  const notifId = `notif_${reporterId}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
  const newNotif: Notification = {
    id: notifId,
    userId: reporterId,
    title: 'Issue Status Updated',
    body: `Your issue "${issueTitle}" is now ${newStatus}.`,
    type: 'STATUS_CHANGE',
    targetId: issueId,
    isRead: false,
    createdAt: new Date().toISOString()
  };
  await setDoc(doc(db, 'notifications', notifId), cleanUndefined(newNotif));
};
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

// Helper to parse the initial route state from the window URL hash
const getInitialStateFromHash = () => {
  const hash = window.location.hash;
  if (!hash || hash === '#/') {
    return { tab: 'feed', issueId: null, communityId: 'nearby_5', viewingUserId: null };
  }
  const [path, queryString] = hash.slice(2).split('?');
  const params = new URLSearchParams(queryString || '');
  const id = params.get('id');

  if (path === 'issue-details') {
    return { tab: 'issue-details', issueId: id, communityId: 'all', viewingUserId: null };
  }
  if (path === 'communities') {
    return { tab: 'communities', issueId: null, communityId: id || 'all', viewingUserId: null };
  }
  if (path === 'profile') {
    const userId = params.get('userId') || params.get('id');
    return { tab: 'profile', issueId: null, communityId: 'all', viewingUserId: userId };
  }

  const validPaths = ['feed', 'dashboard', 'report', 'map-explorer', 'issues', 'leaderboard', 'challenges', 'settings'];
  if (validPaths.includes(path)) {
    const defaultCommunityId = (path === 'issues' || path === 'dashboard') ? 'city' : 'nearby_5';
    return { tab: path, issueId: null, communityId: defaultCommunityId, viewingUserId: null };
  }

  return { tab: '404', issueId: null, communityId: 'all', viewingUserId: null };
};

const playNotificationSound = () => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    // Tone beep 1 (pitch: 800Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(800, ctx.currentTime);
    gain1.gain.setValueAtTime(0.06, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start();
    osc1.stop(ctx.currentTime + 0.15);

    // Tone beep 2 (pitch: 1200Hz, slightly offset)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1200, ctx.currentTime + 0.08);
    gain2.gain.setValueAtTime(0.06, ctx.currentTime + 0.08);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(ctx.currentTime + 0.08);
    osc2.stop(ctx.currentTime + 0.25);
  } catch (err) {
    console.warn('Notification audio synth blocked or unsupported:', err);
  }
};

export function useAppState() {
  const [appStarted, setAppStarted] = useState(false);
  const [activeTab, setActiveTab] = useState(() => getInitialStateFromHash().tab);
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(() => getInitialStateFromHash().issueId);
  const [viewingUserId, setViewingUserId] = useState<string | null>(() => getInitialStateFromHash().viewingUserId);

  const [theme, setThemeState] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark' || saved === 'light') return saved;
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setThemeState(prev => {
      const next = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem('theme', next);
      return next;
    });
  }, []);

  // Core application states (simulated local DB collections)
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [communities, setCommunities] = useState(mockCommunities);
  const [issues, setIssues] = useState(mockIssues);
  const [verifications, setVerifications] = useState(mockVerifications);
  const [comments, setComments] = useState<Comment[]>(mockComments);
  const [activities, setActivities] = useState<UserActivity[]>(mockActivities);
  const [challenges, setChallenges] = useState<CivicChallenge[]>(mockChallenges);

  // Real Auth & Profile States
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentRole, setCurrentRole] = useState<UserRole>('Citizen');
  const [selectedCommunityId, setSelectedCommunityId] = useState<string>(() => getInitialStateFromHash().communityId);

  // Hyperlocal filter and notification states
  const [activeLocationFilter, setActiveLocationFilter] = useState<string>('My Location');
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Sound Player Effect: play chime when notifications length increases with unread items
  const prevNotifCount = useRef<number | null>(null);
  useEffect(() => {
    if (appStarted && prevNotifCount.current !== null && notifications.length > prevNotifCount.current) {
      const hasNewUnread = notifications.some(n => !n.isRead);
      if (hasNewUnread) {
        playNotificationSound();
      }
    }
    prevNotifCount.current = notifications.length;
  }, [notifications, appStarted]);

  // Auth UI Controls
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalRole, setAuthModalRole] = useState<UserRole>('Citizen');
  const [authLoading, setAuthLoading] = useState(true);

  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number } | null>(null);

  const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
    pune: { lat: 18.5204, lng: 73.8567 },
    mumbai: { lat: 19.0760, lng: 72.8777 },
    bangalore: { lat: 12.9716, lng: 77.5946 },
    delhi: { lat: 28.6139, lng: 77.2090 },
    chennai: { lat: 13.0827, lng: 80.2707 },
    chandrapur: { lat: 19.9615, lng: 79.2961 }
  };

  const gpsRequested = useRef(false);


  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setSyncStatus('Back online. Syncing changes...');
      setTimeout(() => setSyncStatus(null), 3000);
    };
    const handleOffline = () => {
      setIsOnline(false);
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

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
    addNewPost,
    updatePostLocally,
    deletePostLocally
  } = useFeedPosts(currentUser);

  // Listen and sync hash routing
  useEffect(() => {
    const handleHashChange = () => {
      const { tab, issueId, communityId, viewingUserId } = getInitialStateFromHash();
      setActiveTab(prev => (prev !== tab ? tab : prev));
      setSelectedIssueId(prev => (prev !== issueId ? issueId : prev));
      setSelectedCommunityId(prev => (prev !== communityId ? communityId : prev));
      setViewingUserId(prev => (prev !== viewingUserId ? viewingUserId : prev));
    };

    window.addEventListener('hashchange', handleHashChange);

    // Default fallback to #/feed if hash is completely empty
    if (!window.location.hash || window.location.hash === '#/') {
      window.location.hash = '#/feed';
    }

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  const saveUserUidMapping = async (email: string, uid: string) => {
    try {
      const mappingRef = doc(db, 'metadata', 'user_mappings');
      const cleanEmailKey = email.toLowerCase().replace(/\./g, '_');
      await setDoc(mappingRef, { [cleanEmailKey]: uid }, { merge: true });
    } catch (err) {
      console.warn('Failed to save user UID mapping:', err);
    }
  };

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        if (firebaseUser.email) {
          saveUserUidMapping(firebaseUser.email, firebaseUser.uid);
        }
        try {
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDocSnap = await Promise.race([
            getDoc(userDocRef),
            new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Firestore Fetch Timeout')), 1500))
          ]);
          if (userDocSnap.exists()) {
            const profile = userDocSnap.data() as User;
            setCurrentUser(profile);
            setCurrentRole(profile.role);
            setAppStarted(true);
          } else {
            // Profile fallback setup - check if there's a mock user for this email
            const matchedMockUser = mockUsers.find(
              (u) => u.email.toLowerCase() === (firebaseUser.email || '').toLowerCase()
            );

            const defaultProfile: User = matchedMockUser
              ? {
                ...matchedMockUser,
                id: firebaseUser.uid
              }
              : {
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
                city: 'Chandrapur',
                district: 'Chandrapur',
                state: 'Maharashtra',
                location: 'Chandrapur, Maharashtra',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              };
            try {
              await setDoc(userDocRef, cleanUndefined(defaultProfile));
            } catch (writeErr) {
              console.warn('Could not write user profile to Firestore (using local fallback):', writeErr);
            }
            setCurrentUser(defaultProfile);
            setCurrentRole(defaultProfile.role);
            setAppStarted(true);
          }
        } catch (e) {
          console.error('Error fetching/creating user profile from Firestore:', e);
          const matchedMockUser = mockUsers.find(
            (u) => u.email.toLowerCase() === (firebaseUser.email || '').toLowerCase()
          );

          const fallbackProfile: User = matchedMockUser
            ? {
              ...matchedMockUser,
              id: firebaseUser.uid
            }
            : {
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
              city: 'Chandrapur',
              district: 'Chandrapur',
              state: 'Maharashtra',
              location: 'Chandrapur, Maharashtra',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
          setCurrentUser(fallbackProfile);
          setCurrentRole(fallbackProfile.role);
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

  // Fetch & Seed Users from Firestore
  useEffect(() => {
    const fetchAndSeedUsers = async () => {
      if (!appStarted) return;
      try {
        const querySnapshot = await getDocs(collection(db, 'users'));
        if (querySnapshot.empty) {
          console.log('Seeding default users into Firestore...');
          const batch = writeBatch(db);
          mockUsers.forEach((u) => {
            batch.set(doc(db, 'users', u.id), u);
          });
          await batch.commit();
          setUsers(mockUsers);
        } else {
          const loaded: User[] = [];
          querySnapshot.forEach((doc) => {
            loaded.push(doc.data() as User);
          });
          setUsers(prev => {
            const merged = [...loaded];
            prev.forEach(u => {
              if (!merged.find(m => m.id === u.id)) {
                merged.push(u);
              }
            });
            return merged;
          });
        }
      } catch (err) {
        console.warn('Could not load/seed users from Firestore (using local fallback mock data):', err);
      }
    };

    fetchAndSeedUsers();
  }, [appStarted]);

  // Fetch & Seed Feed Posts from Firestore
  useEffect(() => {
    const fetchAndSeedFeedPosts = async () => {
      if (!appStarted) return;
      try {
        const querySnapshot = await getDocs(collection(db, 'feed_posts'));
        if (querySnapshot.empty) {
          console.log('Seeding default feed posts into Firestore...');
          const batch = writeBatch(db);
          mockFeedPosts.forEach((post) => {
            batch.set(doc(db, 'feed_posts', post.id), post);
          });
          await batch.commit();
        }
      } catch (err) {
        console.warn('Could not seed feed posts in Firestore:', err);
      }
    };
    fetchAndSeedFeedPosts();
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
          mockActivities.forEach((act) => {
            batch.set(doc(db, 'activities', act.id), act);
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
        console.warn('Could not load/seed activities from Firestore:', err);
        setActivities(mockActivities);
      }
    };
    fetchAndSeedActivities();
  }, [appStarted]);

  // Fetch & Seed Notifications from Firestore (Real-time snapshot listener)
  useEffect(() => {
    if (!appStarted || !currentUser) return;

    const q = query(collection(db, 'notifications'), where('userId', '==', currentUser.id));

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const loaded: Notification[] = [];
      snapshot.forEach((doc) => {
        loaded.push(doc.data() as Notification);
      });

      // Seed 3 welcome alerts for the logged-in sandbox user if none exist
      if (loaded.length === 0) {
        console.log('Seeding default notifications for current user...');
        const batch = writeBatch(db);
        const welcomeNotifs: Notification[] = [
          {
            id: `notif_${currentUser.id}_welcome`,
            userId: currentUser.id,
            title: 'Welcome to Community Hero!',
            body: 'Thank you for joining our social civic platform. Report issues, cast verifications, and cooperate with neighbors to earn reputation!',
            type: 'ROLE_PROMOTED',
            targetId: currentUser.id,
            isRead: false,
            createdAt: new Date(Date.now() - 3600000 * 24).toISOString() // 1 day ago
          },
          {
            id: `notif_${currentUser.id}_leakage`,
            userId: currentUser.id,
            title: 'Water Leakage Alert near Block C',
            body: 'A Water Leakage report in Green Park Society has been marked IN_PROGRESS by resolver Rohan Patil.',
            type: 'STATUS_CHANGE',
            targetId: 'issue_1',
            isRead: false,
            createdAt: new Date(Date.now() - 3600000 * 4).toISOString() // 4 hours ago
          },
          {
            id: `notif_${currentUser.id}_pothole`,
            userId: currentUser.id,
            title: 'Critical Pothole reported in Shivajinagar',
            body: 'A new Critical Pothole has been reported on High Street road. Drive safely!',
            type: 'NEW_ISSUE',
            targetId: 'issue_4',
            isRead: false,
            createdAt: new Date(Date.now() - 3600000 * 2).toISOString() // 2 hours ago
          }
        ];

        welcomeNotifs.forEach((n) => {
          batch.set(doc(db, 'notifications', n.id), n);
          loaded.push(n);
        });
        await batch.commit();
      }

      loaded.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      setNotifications(loaded);
    }, (err) => {
      console.warn('Firestore notifications subscription error:', err);
    });

    return () => unsubscribe();
  }, [appStarted, currentUser]);

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

  // Fetch & Seed Challenges from Firestore
  useEffect(() => {
    const fetchAndSeedChallenges = async () => {
      if (!appStarted) return;
      try {
        const querySnapshot = await getDocs(collection(db, 'challenges'));
        if (querySnapshot.empty) {
          console.log('Seeding default challenges into Firestore...');
          const batch = writeBatch(db);
          mockChallenges.forEach((c) => {
            batch.set(doc(db, 'challenges', c.id), c);
          });
          await batch.commit();
          setChallenges(mockChallenges);
        } else {
          const loaded: CivicChallenge[] = [];
          querySnapshot.forEach((doc) => {
            loaded.push(doc.data() as CivicChallenge);
          });
          setChallenges(loaded);
        }
      } catch (err) {
        console.warn('Could not load challenges from Firestore (using local fallback mock data):', err);
        setChallenges(mockChallenges);
      }
    };

    fetchAndSeedChallenges();
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

  useEffect(() => {
    if (!gpsRequested.current) {
      gpsRequested.current = true;
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const coords = {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            };
            setGpsCoords(coords);
            setUserCoords(coords);
          },
          (error) => {
            console.warn("Geolocation permission denied or failed:", error);
          }
        );
      }
    }
  }, []);

  // Sync userCoords and profile city
  useEffect(() => {
    if (gpsCoords) {
      setUserCoords(gpsCoords);

      if (currentUser) {
        let closestCity = 'Chandrapur';
        let minDistance = Infinity;

        const cityCoords: Record<string, { lat: number; lng: number }> = {
          'Chandrapur': { lat: 19.9615, lng: 79.2961 },
          'Pune': { lat: 18.5204, lng: 73.8567 },
          'Mumbai': { lat: 19.0760, lng: 72.8777 },
          'Bangalore': { lat: 12.9716, lng: 77.5946 },
          'Delhi': { lat: 28.6139, lng: 77.2090 },
          'Chennai': { lat: 13.0827, lng: 80.2707 }
        };

        Object.entries(cityCoords).forEach(([cityName, cCoords]) => {
          const dist = getDistanceMeters(gpsCoords.lat, gpsCoords.lng, cCoords.lat, cCoords.lng);
          if (dist < minDistance) {
            minDistance = dist;
            closestCity = cityName;
          }
        });

        if (currentUser.city.toLowerCase() !== closestCity.toLowerCase()) {
          const formattedCityName = closestCity.charAt(0).toUpperCase() + closestCity.slice(1);
          updateUserProfile({
            city: formattedCityName,
            location: `${formattedCityName}, Maharashtra`
          });
        }
      }
    } else {
      const userCity = (currentUser?.city || 'Chandrapur').toLowerCase();
      const fallback = CITY_COORDS[userCity] || CITY_COORDS['chandrapur'];
      setUserCoords(fallback);
    }
  }, [currentUser, gpsCoords, updateUserProfile]);

  const handleRoleChange = useCallback(async (newRole: UserRole) => {
    setCurrentRole(newRole);
    if (currentUser) {
      await updateUserProfile({ role: newRole });
    }
  }, [currentUser, updateUserProfile]);

  const handleDeleteAccount = useCallback(async () => {
    if (!currentUser) return { success: false, reason: 'NO_USER' };

    // 1. Guardrail Check: Unresolved Reports
    const pendingIssues = issues.filter(i => i.reportedBy === currentUser.id && i.status !== 'RESOLVED');
    if (pendingIssues.length > 0) {
      return {
        success: false,
        reason: 'PENDING_ISSUES',
        details: pendingIssues.map(i => i.title)
      };
    }

    // 2. Guardrail Check: Community Admin Ownership
    const adminComms = communities.filter(c => c.adminIds.includes(currentUser.id));
    if (adminComms.length > 0) {
      const hasOtherMembers = adminComms.some(c => c.memberIds.length > 1);
      if (hasOtherMembers) {
        return {
          success: false,
          reason: 'ADMIN_COMMUNITIES',
          details: adminComms.filter(c => c.memberIds.length > 1).map(c => c.name)
        };
      } else {
        return {
          success: false,
          reason: 'ONLY_ADMIN',
          details: adminComms.filter(c => c.memberIds <= 1).map(c => c.name)
        };
      }
    }

    try {
      const batch = writeBatch(db);

      // Remove from all joined communities' member lists
      const joinedComms = communities.filter(c => currentUser.joinedCommunities.includes(c.id));
      joinedComms.forEach(c => {
        const updatedMembers = c.memberIds.filter(mId => mId !== currentUser.id);
        const updatedAdmins = c.adminIds.filter(aId => aId !== currentUser.id);
        batch.update(doc(db, 'communities', c.id), {
          memberIds: updatedMembers,
          adminIds: updatedAdmins
        });
      });

      // Delete user document in Firestore
      batch.delete(doc(db, 'users', currentUser.id));
      await batch.commit();

      // Clear local states
      setCurrentUser(null);
      setCurrentRole('Citizen');

      const fbUser = auth.currentUser;
      if (fbUser) {
        try {
          await fbUser.delete();
        } catch (authErr) {
          console.warn("Could not delete Auth user directly (requires recent login), signing out instead:", authErr);
          await signOut(auth);
        }
      } else {
        await signOut(auth);
      }

      return { success: true };
    } catch (e: any) {
      console.error("Error deleting account:", e);
      return { success: false, reason: 'ERROR', details: e.message || e.toString() };
    }
  }, [currentUser, issues, communities]);

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
      city: currentUser.city || 'Chandrapur',
      state: currentUser.state || 'Maharashtra',
      ...newIssueData
    };

    console.log('[handleCreateIssue] New Issue:', newIssue);
    console.log('[handleCreateIssue] Current User City:', currentUser.city);

    setIssues(prev => [newIssue, ...prev]);

    try {
      if (!navigator.onLine) {
        setSyncStatus('Saved locally. Will sync to database when online...');
        setTimeout(() => setSyncStatus(null), 4000);
      } else {
        setSyncStatus('Publishing report to Firestore...');
      }

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
        updatedAt: newIssue.updatedAt,
        mediaAttachments: newIssue.mediaAttachments
      };
      console.log('[handleCreateIssue] New Feed Post:', newFeedPost);
      await setDoc(doc(db, 'feed_posts', feedPostId), cleanUndefined(newFeedPost));
      addNewPost(newFeedPost);
      console.log('[handleCreateIssue] Local feed post added.');

      // Notify matching users in the vicinity
      const vicinityUsers = users.filter(u => u.city === newIssue.city && u.id !== currentUser.id);
      console.log('[handleCreateIssue] Vicinity users to notify:', vicinityUsers.length);
      const notifPromises = vicinityUsers.map(async (u) => {
        const notifId = `notif_${u.id}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        const newNotif: Notification = {
          id: notifId,
          userId: u.id,
          title: 'New Incident Reported Nearby',
          body: `A new ${newIssue.category} issue "${newIssue.title}" has been reported in ${newIssue.city}.`,
          type: 'NEW_ISSUE',
          targetId: newId,
          isRead: false,
          createdAt: new Date().toISOString()
        };
        await setDoc(doc(db, 'notifications', notifId), cleanUndefined(newNotif));
      });
      await Promise.all(notifPromises);
      console.log('[handleCreateIssue] Notifications sent.');

      if (navigator.onLine) {
        setSyncStatus('Report successfully published!');
        setTimeout(() => setSyncStatus(null), 2500);
      }
    } catch (e: any) {
      setSyncStatus(null);
      console.error('[handleCreateIssue] Error saving issue/feed post/notifications to Firestore:', e);
      alert(`Failed to save report to Firestore: ${e.message || e.toString()}\n\nMake sure your Firebase security rules allow writing to 'issues', 'feed_posts', and 'notifications', and that you have clicked "Bypass Cache & Clear Queue" in Settings if your write queue is exhausted.`);
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
  }, [currentUser, addNewPost, updateUserProfile, users]);

  const handleUpdateIssue = useCallback(async (issueId: string, updatedFields: Partial<Issue>) => {
    setIssues(prev => prev.map(i => i.id === issueId ? { ...i, ...updatedFields, updatedAt: new Date().toISOString() } : i));

    try {
      if (!navigator.onLine) {
        setSyncStatus('Changes saved locally. Will sync to database when online...');
        setTimeout(() => setSyncStatus(null), 4000);
      } else {
        setSyncStatus('Publishing updates to Firestore...');
      }

      const issueRef = doc(db, 'issues', issueId);
      await updateDoc(issueRef, cleanUndefined({ ...updatedFields, updatedAt: new Date().toISOString() }));

      const feedPostId = `post_${issueId}`;
      const feedPostRef = doc(db, 'feed_posts', feedPostId);
      const postSnap = await getDoc(feedPostRef);
      if (postSnap.exists()) {
        const postUpdates: any = {
          updatedAt: new Date().toISOString(),
        };
        if (updatedFields.title !== undefined) postUpdates.title = updatedFields.title;
        if (updatedFields.description !== undefined) postUpdates.body = updatedFields.description;
        if (updatedFields.mediaAttachments !== undefined) postUpdates.mediaAttachments = updatedFields.mediaAttachments;
        if (updatedFields.imageUrl !== undefined) postUpdates.imageUrl = updatedFields.imageUrl;
        await updateDoc(feedPostRef, cleanUndefined(postUpdates));
        updatePostLocally(feedPostId, postUpdates);
      }

      if (navigator.onLine) {
        setSyncStatus('Report updated successfully!');
        setTimeout(() => setSyncStatus(null), 2500);
      }
    } catch (err: any) {
      setSyncStatus(null);
      console.error('Error updating issue in Firestore:', err);
      alert(`Failed to update report in Firestore: ${err.message || err.toString()}`);
    }
  }, [updatePostLocally]);

  const handleDeleteIssue = useCallback(async (issueId: string) => {
    const targetIssue = issues.find(i => i.id === issueId);
    if (!targetIssue) return;

    setIssues(prev => prev.filter(i => i.id !== issueId));

    try {
      if (!navigator.onLine) {
        setSyncStatus('Report deleted locally. Will sync when online...');
        setTimeout(() => setSyncStatus(null), 4000);
      } else {
        setSyncStatus('Deleting report from Firestore...');
      }

      await deleteDoc(doc(db, 'issues', issueId));

      const feedPostId = `post_${issueId}`;
      await deleteDoc(doc(db, 'feed_posts', feedPostId));
      deletePostLocally(feedPostId);

      const commentsQuery = await getDocs(collection(db, 'comments'));
      const commentsBatch = writeBatch(db);
      let deletedCommentsCount = 0;
      commentsQuery.forEach(docSnap => {
        const commentData = docSnap.data();
        if (commentData.issueId === issueId || commentData.postId === feedPostId) {
          commentsBatch.delete(docSnap.ref);
          deletedCommentsCount++;
        }
      });
      if (deletedCommentsCount > 0) {
        await commentsBatch.commit();
        setComments(prev => prev.filter(c => c.issueId !== issueId && c.postId !== feedPostId));
      }

      const verificationsQuery = await getDocs(collection(db, 'verifications'));
      const verificationsBatch = writeBatch(db);
      let deletedVerificationsCount = 0;
      verificationsQuery.forEach(docSnap => {
        const verData = docSnap.data();
        if (verData.issueId === issueId) {
          verificationsBatch.delete(docSnap.ref);
          deletedVerificationsCount++;
        }
      });
      if (deletedVerificationsCount > 0) {
        await verificationsBatch.commit();
        setVerifications(prev => prev.filter(v => v.issueId !== issueId));
      }

      if (targetIssue.communityId && targetIssue.communityId !== 'general') {
        setCommunities(prevComms => prevComms.map(c => {
          if (c.id === targetIssue.communityId) {
            const updatedTotal = Math.max(0, c.totalIssues - 1);
            const updatedResolved = targetIssue.status === 'RESOLVED' ? Math.max(0, c.resolvedIssues - 1) : c.resolvedIssues;
            updateDoc(doc(db, 'communities', c.id), {
              totalIssues: updatedTotal,
              resolvedIssues: updatedResolved
            }).catch(e => console.warn('Could not update total issues in Firestore:', e));
            return {
              ...c,
              totalIssues: updatedTotal,
              resolvedIssues: updatedResolved
            };
          }
          return c;
        }));
      }

      if (currentUser && targetIssue.reportedBy === currentUser.id) {
        updateUserProfile({
          reportsCreated: Math.max(0, currentUser.reportsCreated - 1),
          reportsResolved: targetIssue.status === 'RESOLVED' ? Math.max(0, currentUser.reportsResolved - 1) : currentUser.reportsResolved
        });
      }

      if (navigator.onLine) {
        setSyncStatus('Report deleted successfully!');
        setTimeout(() => setSyncStatus(null), 2500);
      }
    } catch (e: any) {
      setSyncStatus(null);
      console.error('Error deleting issue/feed post/comments/verifications from Firestore:', e);
      alert(`Failed to delete report in Firestore: ${e.message || e.toString()}`);
    }
  }, [issues, currentUser, deletePostLocally, updateUserProfile]);

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
      await communitiesService.createCommunity(newComm);
    } catch (e) {
      console.error('Error saving community to Firestore:', e);
    }
  }, [currentUser]);

  const handleCreateChallenge = useCallback(async (newChallengeData: Omit<CivicChallenge, 'id'>) => {
    const newId = `ch_${Date.now()}`;
    const newChallenge: CivicChallenge = {
      id: newId,
      ...newChallengeData
    };

    setChallenges(prev => [...prev, newChallenge]);

    try {
      await setDoc(doc(db, 'challenges', newId), cleanUndefined(newChallenge));
    } catch (e) {
      console.error('Error saving challenge to Firestore:', e);
    }
  }, []);

  const handleUpdateCommunityDetails = useCallback(async (communityId: string, updates: Partial<Community>) => {
    setCommunities(prev => prev.map(c => c.id === communityId ? { ...c, ...updates } : c));
    try {
      await communitiesService.updateCommunityDetails(communityId, updates);
    } catch (e) {
      console.error('Error updating community details in Firestore:', e);
    }
  }, []);

  const handleJoinCommunity = useCallback(async (id: string) => {
    if (!currentUser) return;
    const targetComm = communities.find(c => c.id === id);
    if (!targetComm) return;

    const isPrivate = targetComm.privacy === 'PRIVATE';

    if (isPrivate) {
      // Create request: add user to pendingMemberRequests
      const updatedPending = targetComm.pendingMemberRequests?.includes(currentUser.id)
        ? targetComm.pendingMemberRequests
        : [...(targetComm.pendingMemberRequests || []), currentUser.id];

      setCommunities(prev => prev.map(c => c.id === id ? { ...c, pendingMemberRequests: updatedPending } : c));

      try {
        await updateDoc(doc(db, 'communities', id), {
          pendingMemberRequests: updatedPending,
          updatedAt: new Date().toISOString()
        });

        // Add a notification for the community owner/admins
        const adminIds = targetComm.adminIds || [targetComm.createdBy];
        const adminNotifPromises = adminIds.map(async (adminId) => {
          const notifId = `notif_${adminId}_${Date.now()}`;
          const newNotif: Notification = {
            id: notifId,
            userId: adminId,
            title: 'New Community Join Request',
            body: `${currentUser.name} requested to join your private community "${targetComm.name}".`,
            type: 'MEMBER_REQUEST',
            targetId: id,
            isRead: false,
            createdAt: new Date().toISOString()
          };
          await setDoc(doc(db, 'notifications', notifId), cleanUndefined(newNotif));
        });
        await Promise.all(adminNotifPromises);
      } catch (err) {
        console.warn('Error requesting private community join:', err);
      }
    } else {
      // Public community: join immediately
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

          communitiesService.updateCommunityMembers(id, updatedMembers)
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
        targetTitle: targetComm.name,
        createdAt: new Date().toISOString(),
        pointsEarned: 0
      };
      setActivities(prev => [newAct, ...prev]);
      setDoc(doc(db, 'activities', actId), cleanUndefined(newAct))
        .catch(e => console.warn('Could not update join activity in Firestore:', e));
    }
  }, [currentUser, communities, updateUserProfile]);

  const handleApproveMember = useCallback(async (communityId: string, memberId: string) => {
    setCommunities(prev => prev.map(c => {
      if (c.id === communityId) {
        const updatedMembers = c.memberIds.includes(memberId) ? c.memberIds : [...c.memberIds, memberId];
        const updatedPending = (c.pendingMemberRequests || []).filter(uid => uid !== memberId);

        updateDoc(doc(db, 'communities', communityId), {
          memberIds: updatedMembers,
          pendingMemberRequests: updatedPending,
          updatedAt: new Date().toISOString()
        }).catch(err => console.warn('Firestore error approving member:', err));

        // Update the approved user's document if it exists in the user list
        const approvedUser = users.find(u => u.id === memberId);
        if (approvedUser) {
          const updatedJoined = approvedUser.joinedCommunities.includes(communityId)
            ? approvedUser.joinedCommunities
            : [...approvedUser.joinedCommunities, communityId];

          updateDoc(doc(db, 'users', memberId), {
            joinedCommunities: updatedJoined
          }).catch(err => console.warn('Firestore error updating approved user communities:', err));

          setUsers(prev => prev.map(u => {
            if (u.id === memberId) {
              return { ...u, joinedCommunities: updatedJoined };
            }
            return u;
          }));
        }

        if (currentUser && currentUser.id === memberId) {
          const updatedJoined = currentUser.joinedCommunities.includes(communityId)
            ? currentUser.joinedCommunities
            : [...currentUser.joinedCommunities, communityId];
          setCurrentUser(prev => prev ? { ...prev, joinedCommunities: updatedJoined } : null);
        }

        // Notify approved user
        const notifId = `notif_${memberId}_${Date.now()}`;
        const newNotif: Notification = {
          id: notifId,
          userId: memberId,
          title: 'Community Access Approved',
          body: `Your request to join "${c.name}" has been approved!`,
          type: 'STATUS_CHANGE',
          targetId: communityId,
          isRead: false,
          createdAt: new Date().toISOString()
        };
        setDoc(doc(db, 'notifications', notifId), cleanUndefined(newNotif))
          .catch(err => console.warn('Firestore error writing join approval notification:', err));

        return {
          ...c,
          memberIds: updatedMembers,
          pendingMemberRequests: updatedPending
        };
      }
      return c;
    }));
  }, [users, currentUser]);

  const handleRejectMember = useCallback(async (communityId: string, memberId: string) => {
    setCommunities(prev => prev.map(c => {
      if (c.id === communityId) {
        const updatedPending = (c.pendingMemberRequests || []).filter(uid => uid !== memberId);

        updateDoc(doc(db, 'communities', communityId), {
          pendingMemberRequests: updatedPending,
          updatedAt: new Date().toISOString()
        }).catch(err => console.warn('Firestore error rejecting member:', err));

        return {
          ...c,
          pendingMemberRequests: updatedPending
        };
      }
      return c;
    }));
  }, []);

  const handleRemoveMember = useCallback(async (communityId: string, memberId: string) => {
    setCommunities(prev => prev.map(c => {
      if (c.id === communityId) {
        const updatedMembers = c.memberIds.filter(uid => uid !== memberId);
        const updatedAdmins = (c.adminIds || []).filter(uid => uid !== memberId);

        updateDoc(doc(db, 'communities', communityId), {
          memberIds: updatedMembers,
          adminIds: updatedAdmins,
          updatedAt: new Date().toISOString()
        }).catch(err => console.warn('Firestore error removing member:', err));

        // Update target user's joined communities in Firestore
        const newJoined = users.find(u => u.id === memberId)?.joinedCommunities.filter(cid => cid !== communityId) || [];
        updateDoc(doc(db, 'users', memberId), {
          joinedCommunities: newJoined
        }).catch(err => console.warn('Firestore error removing community from user profile:', err));

        setUsers(prev => prev.map(u => {
          if (u.id === memberId) {
            return { ...u, joinedCommunities: newJoined };
          }
          return u;
        }));

        if (currentUser && currentUser.id === memberId) {
          const selfJoined = currentUser.joinedCommunities.filter(cid => cid !== communityId);
          setCurrentUser(prev => prev ? { ...prev, joinedCommunities: selfJoined } : null);
        }

        return {
          ...c,
          memberIds: updatedMembers,
          adminIds: updatedAdmins
        };
      }
      return c;
    }));
  }, [users, currentUser]);

  const handleUpdateMemberRole = useCallback(async (communityId: string, memberId: string, roleType: 'ADMIN' | 'MEMBER') => {
    setCommunities(prev => prev.map(c => {
      if (c.id === communityId) {
        let updatedAdmins = c.adminIds || [];
        if (roleType === 'ADMIN') {
          updatedAdmins = updatedAdmins.includes(memberId) ? updatedAdmins : [...updatedAdmins, memberId];
        } else {
          updatedAdmins = updatedAdmins.filter(uid => uid !== memberId);
        }

        updateDoc(doc(db, 'communities', communityId), {
          adminIds: updatedAdmins,
          updatedAt: new Date().toISOString()
        }).catch(err => console.warn('Firestore error updating admin role:', err));

        // Notify member
        const notifId = `notif_${memberId}_${Date.now()}`;
        const newNotif: Notification = {
          id: notifId,
          userId: memberId,
          title: 'Role Promoted',
          body: `You have been promoted to ${roleType} in community "${c.name}".`,
          type: 'ROLE_PROMOTED',
          targetId: communityId,
          isRead: false,
          createdAt: new Date().toISOString()
        };
        setDoc(doc(db, 'notifications', notifId), cleanUndefined(newNotif))
          .catch(err => console.warn('Firestore error writing role update notification:', err));

        return {
          ...c,
          adminIds: updatedAdmins
        };
      }
      return c;
    }));
  }, []);

  const handleMarkAsDuplicate = useCallback(async (issueId: string, duplicateOfId: string | null) => {
    setIssues(prev => prev.map(i => {
      if (i.id === issueId) {
        const updated = {
          ...i,
          duplicateOfIssueId: duplicateOfId,
          updatedAt: new Date().toISOString()
        };
        updateDoc(doc(db, 'issues', issueId), {
          duplicateOfIssueId: duplicateOfId,
          updatedAt: updated.updatedAt
        }).catch(err => console.warn('Error marking duplicate in Firestore:', err));
        return updated;
      }
      return i;
    }));
  }, []);

  const handleMarkNotificationRead = useCallback(async (notificationId: string) => {
    setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n));
    try {
      await updateDoc(doc(db, 'notifications', notificationId), { isRead: true });
    } catch (e) {
      console.error('Error marking notification as read in Firestore:', e);
    }
  }, []);

  const handleMarkAllNotificationsRead = useCallback(async () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    try {
      const batch = writeBatch(db);
      notifications.forEach(n => {
        if (!n.isRead) {
          batch.update(doc(db, 'notifications', n.id), { isRead: true });
        }
      });
      await batch.commit();
    } catch (e) {
      console.error('Error marking all notifications as read in Firestore:', e);
    }
  }, [notifications]);

  const handleLeaveCommunity = useCallback(async (id: string) => {
    if (!currentUser) return;
    const updatedJoined = currentUser.joinedCommunities.filter(cid => cid !== id);
    updateUserProfile({
      joinedCommunities: updatedJoined
    });

    setCommunities(prevComms => prevComms.map(c => {
      if (c.id === id) {
        const updatedMembers = c.memberIds.filter(uid => uid !== currentUser.id);

        communitiesService.updateCommunityMembers(id, updatedMembers)
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
        let newStatus = i.status;
        const roleUpper = (currentUser.role || '').toUpperCase();
        const isUserAuthoritative = roleUpper === 'COMMUNITY ADMIN' || roleUpper === 'ADMIN' || roleUpper === 'RESOLVER' || roleUpper === 'AUTHORITY';

        if (voteType === 'CONFIRM') {
          vCount += 1;
          trustDiff = 5;
          pScoreDiff = 2;

          if (i.status === 'OPEN' || i.status === 'AI_ANALYZED') {
            if (isUserAuthoritative || vCount >= 3) {
              newStatus = 'COMMUNITY_VERIFIED';
            }
          }
        } else if (voteType === 'FAKE') {
          fCount += 1;
          trustDiff = -15;
          pScoreDiff = -5;

          if (isUserAuthoritative || fCount >= 3) {
            newStatus = 'CLOSED';
          }
        } else if (voteType === 'RESOLVED') {
          trustDiff = 10;

          const pastResolvedVotes = verifications.filter(v => v.issueId === issueId && v.voteType === 'RESOLVED').length;
          const totalResolvedVotes = pastResolvedVotes + 1;
          if (isUserAuthoritative || totalResolvedVotes >= 3) {
            newStatus = 'RESOLVED';
          }
        }

        const updatedIssue = {
          ...i,
          verificationCount: vCount,
          fakeCount: fCount,
          status: newStatus,
          trustScore: Math.min(100, Math.max(0, i.trustScore + trustDiff)),
          priorityScore: Math.min(100, Math.max(0, i.priorityScore + pScoreDiff)),
          resolvedAt: newStatus === 'RESOLVED' && i.status !== 'RESOLVED' ? new Date().toISOString() : i.resolvedAt,
          updatedAt: new Date().toISOString()
        };

        setDoc(doc(db, 'issues', i.id), cleanUndefined(updatedIssue))
          .then(async () => {
            // If status changed, notify the reporter
            if (newStatus !== i.status && i.reportedBy && i.reportedBy !== currentUser?.id) {
              await createStatusChangeNotification(i.id, newStatus, i.reportedBy, i.title);
            }
            if (newStatus !== i.status) {
              const feedPostId = `post_${i.id}`;
              const feedPostRef = doc(db, 'feed_posts', feedPostId);
              const postUpdates = {
                status: newStatus,
                type: newStatus === 'RESOLVED' ? ('ISSUE_RESOLVED' as const) : ('ISSUE_REPORTED' as const),
                updatedAt: new Date().toISOString()
              };
              updateDoc(feedPostRef, cleanUndefined(postUpdates))
                .then(() => {
                  updatePostLocally(feedPostId, postUpdates);
                })
                .catch(err => console.warn('Could not update feed post:', err));
            }
          })
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
  }, [currentUser, issues, verifications, updateUserProfile, updatePostLocally]);

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
          .then(async () => {
            // Notify the original reporter about status change
            if (i.reportedBy && i.reportedBy !== currentUser?.id) {
              await createStatusChangeNotification(i.id, status, i.reportedBy, i.title);
            }
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

            communitiesService.updateCommunityDetails(c.id, {
              resolvedIssues: updatedResolved,
              reputationScore: updatedScore
            })
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
    window.location.hash = `#/issue-details?id=${id}`;
  }, []);

  const handleNavigation = useCallback((tab: string) => {
    window.location.hash = `#/${tab}`;
  }, []);

  const handleViewUserProfile = useCallback((userId: string) => {
    window.location.hash = `#/profile?id=${userId}`;
  }, []);

  const handleSetSelectedCommunityId = useCallback((id: string, options?: { navigate?: boolean }) => {
    setSelectedCommunityId(id);
    if (options?.navigate === false) return;

    if (id === 'all') {
      window.location.hash = '#/communities';
    } else {
      window.location.hash = `#/communities?id=${id}`;
    }
  }, []);

  const handleResetDatabase = useCallback(async () => {
    try {
      console.log('Resetting and seeding sandbox database...');

      // Collections to clear
      const collectionsToClear = [
        'users',
        'communities',
        'issues',
        'verifications',
        'comments',
        'activities',
        'notifications',
        'feed_posts',
        'post_reactions',
        'challenges'
      ];

      for (const colName of collectionsToClear) {
        const snap = await getDocs(collection(db, colName));
        const batch = writeBatch(db);
        snap.forEach((d) => {
          batch.delete(doc(db, colName, d.id));
        });
        await batch.commit();
      }

      // Fetch mappings first
      let mappings: Record<string, string> = {};
      try {
        const mappingSnap = await getDoc(doc(db, 'metadata', 'user_mappings'));
        if (mappingSnap.exists()) {
          mappings = mappingSnap.data() as Record<string, string>;
        }
      } catch (err) {
        console.warn('Could not read user mappings during reset:', err);
      }

      const idMap: Record<string, string> = {};
      const emailToMockId: Record<string, string> = {
        'admin_communityhero_net': 'user_1',
        'citizen_communityhero_net': 'user_2',
        'resolver_communityhero_net': 'user_3',
        'authority_communityhero_net': 'user_4'
      };

      Object.entries(mappings).forEach(([cleanEmail, uid]) => {
        const mockId = emailToMockId[cleanEmail];
        if (mockId) {
          idMap[mockId] = uid;
        }
      });

      const mapId = (id: string): string => idMap[id] || id;
      const mapIdArray = (ids: string[]): string[] => (ids || []).map(mapId);

      // Re-seed all mock data with dynamic mapping substitutions
      const batch = writeBatch(db);

      mockUsers.forEach((u) => {
        const newId = mapId(u.id);
        const mappedUser = { ...u, id: newId };
        batch.set(doc(db, 'users', newId), cleanUndefined(mappedUser));
      });
      mockCommunities.forEach((c) => {
        const mappedComm = {
          ...c,
          adminIds: mapIdArray(c.adminIds),
          memberIds: mapIdArray(c.memberIds)
        };
        batch.set(doc(db, 'communities', c.id), cleanUndefined(mappedComm));
      });
      mockIssues.forEach((i) => {
        const mappedIssue = {
          ...i,
          reportedBy: mapId(i.reportedBy),
          assignedTo: i.assignedTo ? mapId(i.assignedTo) : undefined,
          verifiedUserIds: mapIdArray(i.verifiedUserIds),
          spamUserIds: mapIdArray(i.spamUserIds),
          resolvedUserIds: mapIdArray(i.resolvedUserIds)
        };
        batch.set(doc(db, 'issues', i.id), cleanUndefined(mappedIssue));
      });
      mockVerifications.forEach((v) => {
        const mappedVer = {
          ...v,
          userId: mapId(v.userId)
        };
        batch.set(doc(db, 'verifications', v.id), cleanUndefined(mappedVer));
      });
      mockComments.forEach((c) => {
        const mappedComment = {
          ...c,
          userId: mapId(c.userId)
        };
        batch.set(doc(db, 'comments', c.id), cleanUndefined(mappedComment));
      });
      mockActivities.forEach((a) => {
        const mappedActivity = {
          ...a,
          userId: mapId(a.userId),
          targetId: mapId(a.targetId)
        };
        batch.set(doc(db, 'activities', a.id), cleanUndefined(mappedActivity));
      });
      mockFeedPosts.forEach((f) => {
        const mappedFeedPost = {
          ...f,
          authorId: mapId(f.authorId)
        };
        batch.set(doc(db, 'feed_posts', f.id), cleanUndefined(mappedFeedPost));
      });

      mockChallenges.forEach((c) => {
        batch.set(doc(db, 'challenges', c.id), cleanUndefined(c));
      });

      // Add notifications for active user if present
      if (currentUser) {
        const welcomeNotifs: Notification[] = [
          {
            id: `notif_${currentUser.id}_welcome`,
            userId: currentUser.id,
            title: 'Welcome to Community Hero!',
            body: 'Thank you for joining our social civic platform. Report issues, cast verifications, and cooperate with neighbors to earn reputation!',
            type: 'ROLE_PROMOTED',
            targetId: currentUser.id,
            isRead: false,
            createdAt: new Date(Date.now() - 3600000 * 24).toISOString()
          },
          {
            id: `notif_${currentUser.id}_leakage`,
            userId: currentUser.id,
            title: 'Water Leakage Alert near Block C',
            body: 'A Water Leakage report in Green Park Society has been marked IN_PROGRESS by resolver Rohan Patil.',
            type: 'STATUS_CHANGE',
            targetId: 'issue_1',
            isRead: false,
            createdAt: new Date(Date.now() - 3600000 * 4).toISOString()
          },
          {
            id: `notif_${currentUser.id}_pothole`,
            userId: currentUser.id,
            title: 'Critical Pothole reported in Shivajinagar',
            body: 'A new Critical Pothole has been reported on High Street road. Drive safely!',
            type: 'NEW_ISSUE',
            targetId: 'issue_4',
            isRead: false,
            createdAt: new Date(Date.now() - 3600000 * 2).toISOString()
          }
        ];
        welcomeNotifs.forEach((n) => {
          batch.set(doc(db, 'notifications', n.id), n);
        });
      }

      await batch.commit();
      window.location.reload();
    } catch (e) {
      console.error('Failed to reset and re-seed database:', e);
      alert('Error resetting database. Check console logs for details.');
    }
  }, [currentUser]);

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
    challenges,
    currentUser,
    currentRole,
    selectedCommunityId,
    activeLocationFilter,
    setActiveLocationFilter,
    notifications,
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
    setSelectedCommunityId: handleSetSelectedCommunityId,
    setAppStarted,
    loadComments,
    updateUserProfile,
    handleRoleChange,
    handleStartApp,
    handleSignOut,
    handleCreateIssue,
    handleUpdateIssue,
    handleDeleteIssue,
    handleCreateCommunity,
    handleCreateChallenge,
    handleUpdateCommunityDetails,
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
    handleNavigation,
    handleMarkNotificationRead,
    handleMarkAllNotificationsRead,
    handleApproveMember,
    handleRejectMember,
    handleRemoveMember,
    handleUpdateMemberRole,
    handleMarkAsDuplicate,
    handleResetDatabase,
    theme,
    toggleTheme,
    isOnline,
    syncStatus,
    viewingUserId,
    handleViewUserProfile,
    handleDeleteAccount,
    userCoords
  };
}
