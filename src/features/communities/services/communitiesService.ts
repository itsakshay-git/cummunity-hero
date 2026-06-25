import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../../services/firebase/firebaseClient';
import { Community } from '../../../types';

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

export const communitiesService = {
  // Save a new community to Firestore
  async createCommunity(community: Community): Promise<void> {
    try {
      const commRef = doc(db, 'communities', community.id);
      await setDoc(commRef, cleanUndefined(community));
    } catch (err) {
      console.error("Error creating community in Firestore:", err);
      throw err;
    }
  },

  // Update community memberIds list in Firestore
  async updateCommunityMembers(communityId: string, memberIds: string[]): Promise<void> {
    try {
      const commRef = doc(db, 'communities', communityId);
      await updateDoc(commRef, {
        memberIds: memberIds,
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      console.error("Error updating community members in Firestore:", err);
      throw err;
    }
  },

  // Update general community fields (e.g. reputation score or issue counts)
  async updateCommunityDetails(communityId: string, data: Partial<Community>): Promise<void> {
    try {
      const commRef = doc(db, 'communities', communityId);
      await updateDoc(commRef, cleanUndefined({
        ...data,
        updatedAt: new Date().toISOString()
      }));
    } catch (err) {
      console.error("Error updating community details in Firestore:", err);
      throw err;
    }
  }
};
