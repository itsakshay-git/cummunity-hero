import { 
  collection, doc, getDoc, getDocs, setDoc, updateDoc, 
  query, where, orderBy 
} from 'firebase/firestore';
import { db } from '../../../services/firebase/firebaseClient';
import { User, UserActivity, Comment, Issue, Community } from '../../../types';

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

export const profileService = {
  // Fetch user profile from Firestore
  async getUserProfile(userId: string): Promise<User | null> {
    try {
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        return { id: userSnap.id, ...userSnap.data() } as User;
      }
      return null;
    } catch (err) {
      console.error("Error fetching user profile:", err);
      throw err;
    }
  },

  // Update user profile details
  async updateUserProfile(userId: string, data: Partial<User>): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, cleanUndefined({
        ...data,
        updatedAt: new Date().toISOString()
      }));
    } catch (err) {
      console.error("Error updating user profile:", err);
      throw err;
    }
  },

  // Fetch all issues created by a user
  async getUserReports(userId: string): Promise<Issue[]> {
    try {
      const q = query(
        collection(db, 'issues'),
        where('reportedBy', '==', userId),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const reports: Issue[] = [];
      querySnapshot.forEach((doc) => {
        reports.push({ id: doc.id, ...doc.data() } as Issue);
      });
      return reports;
    } catch (err) {
      console.error("Error fetching user reports:", err);
      return [];
    }
  },

  // Fetch activity log for a user
  async getUserActivity(userId: string): Promise<UserActivity[]> {
    try {
      const q = query(
        collection(db, 'activities'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const activities: UserActivity[] = [];
      querySnapshot.forEach((doc) => {
        activities.push({ id: doc.id, ...doc.data() } as UserActivity);
      });
      return activities;
    } catch (err) {
      console.error("Error fetching user activity:", err);
      return [];
    }
  },

  // Fetch comments created by a user
  async getUserComments(userId: string): Promise<Comment[]> {
    try {
      const q = query(
        collection(db, 'comments'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const comments: Comment[] = [];
      querySnapshot.forEach((doc) => {
        comments.push({ id: doc.id, ...doc.data() } as Comment);
      });
      return comments;
    } catch (err) {
      console.error("Error fetching user comments:", err);
      return [];
    }
  },

  // Log user activity into Firestore
  async logUserActivity(activity: Omit<UserActivity, 'id'>): Promise<void> {
    try {
      const actId = `act_${Date.now()}`;
      const docRef = doc(db, 'activities', actId);
      const newAct: UserActivity = {
        id: actId,
        ...activity
      };
      await setDoc(docRef, cleanUndefined(newAct));
    } catch (err) {
      console.error("Error logging user activity:", err);
    }
  }
};
