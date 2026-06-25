import { 
  collection, doc, getDocs, getDoc, setDoc, updateDoc, 
  query, where, orderBy, deleteDoc, writeBatch 
} from 'firebase/firestore';
import { db } from '../../../services/firebase/firebaseClient';
import { FeedPost, Comment, PostReaction, SavedPost, Issue } from '../../../types';

// Helper to sanitize objects for Firestore
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

export const feedService = {
  // Fetch all feed posts sorted by creation date descending
  async getFeedPosts(): Promise<FeedPost[]> {
    try {
      const q = query(collection(db, 'feed_posts'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const posts: FeedPost[] = [];
      querySnapshot.forEach((doc) => {
        posts.push({ id: doc.id, ...doc.data() } as FeedPost);
      });
      return posts;
    } catch (err) {
      console.error("Error fetching feed posts:", err);
      throw err;
    }
  },

  // Create a new feed post document
  async createFeedPost(data: Omit<FeedPost, 'id'>): Promise<FeedPost> {
    try {
      const newPostRef = doc(collection(db, 'feed_posts'));
      const newPost: FeedPost = {
        id: newPostRef.id,
        ...data,
      };
      await setDoc(newPostRef, cleanUndefined(newPost));
      return newPost;
    } catch (err) {
      console.error("Error creating feed post:", err);
      throw err;
    }
  },

  // Support/Like a feed post
  async supportPost(postId: string, userId: string): Promise<void> {
    try {
      const reactionId = `${postId}_${userId}`;
      const reactionRef = doc(db, 'post_reactions', reactionId);
      
      const reaction: PostReaction = {
        id: reactionId,
        postId,
        userId,
        reactionType: 'SUPPORT',
        createdAt: new Date().toISOString()
      };
      await setDoc(reactionRef, cleanUndefined(reaction));

      // Increment supportCount on feed post
      const postRef = doc(db, 'feed_posts', postId);
      const postSnap = await getDoc(postRef);
      if (postSnap.exists()) {
        const postData = postSnap.data();
        await updateDoc(postRef, {
          supportCount: (postData.supportCount || 0) + 1
        });
      }
    } catch (err) {
      console.error("Error supporting post:", err);
      throw err;
    }
  },

  // Unsupport/Unlike a feed post
  async unsupportPost(postId: string, userId: string): Promise<void> {
    try {
      const reactionId = `${postId}_${userId}`;
      const reactionRef = doc(db, 'post_reactions', reactionId);
      await deleteDoc(reactionRef);

      // Decrement supportCount on feed post
      const postRef = doc(db, 'feed_posts', postId);
      const postSnap = await getDoc(postRef);
      if (postSnap.exists()) {
        const postData = postSnap.data();
        await updateDoc(postRef, {
          supportCount: Math.max(0, (postData.supportCount || 0) - 1)
        });
      }
    } catch (err) {
      console.error("Error unsupporting post:", err);
      throw err;
    }
  },

  // Save/Bookmark a post
  async savePost(postId: string, userId: string): Promise<void> {
    try {
      const saveId = `${postId}_${userId}`;
      const saveRef = doc(db, 'saved_posts', saveId);
      const saved: SavedPost = {
        id: saveId,
        postId,
        userId,
        createdAt: new Date().toISOString()
      };
      await setDoc(saveRef, cleanUndefined(saved));

      // Increment saveCount on feed post
      const postRef = doc(db, 'feed_posts', postId);
      const postSnap = await getDoc(postRef);
      if (postSnap.exists()) {
        const postData = postSnap.data();
        await updateDoc(postRef, {
          saveCount: (postData.saveCount || 0) + 1
        });
      }
    } catch (err) {
      console.error("Error saving post:", err);
      throw err;
    }
  },

  // Unsave/Remove bookmark
  async unsavePost(postId: string, userId: string): Promise<void> {
    try {
      const saveId = `${postId}_${userId}`;
      const saveRef = doc(db, 'saved_posts', saveId);
      await deleteDoc(saveRef);

      // Decrement saveCount on feed post
      const postRef = doc(db, 'feed_posts', postId);
      const postSnap = await getDoc(postRef);
      if (postSnap.exists()) {
        const postData = postSnap.data();
        await updateDoc(postRef, {
          saveCount: Math.max(0, (postData.saveCount || 0) - 1)
        });
      }
    } catch (err) {
      console.error("Error unsaving post:", err);
      throw err;
    }
  },

  // Comment on a feed post
  async commentOnPost(params: {
    postId: string;
    issueId?: string;
    communityId?: string;
    userId: string;
    userName: string;
    userPhotoUrl?: string;
    body: string;
  }): Promise<Comment> {
    const { postId, issueId, communityId, userId, userName, userPhotoUrl, body } = params;
    try {
      const commentRef = doc(collection(db, 'comments'));
      const comment: Comment = {
        id: commentRef.id,
        postId,
        issueId,
        communityId,
        userId,
        userName,
        userPhotoUrl,
        body,
        likeCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await setDoc(commentRef, cleanUndefined(comment));

      // Increment commentCount on feed post
      const postRef = doc(db, 'feed_posts', postId);
      const postSnap = await getDoc(postRef);
      if (postSnap.exists()) {
        const postData = postSnap.data();
        await updateDoc(postRef, {
          commentCount: (postData.commentCount || 0) + 1
        });
      }
      
      return comment;
    } catch (err) {
      console.error("Error commenting on post:", err);
      throw err;
    }
  },

  // Fetch comments for a specific post sorted in memory (bypasses missing composite index)
  async getPostComments(postId: string): Promise<Comment[]> {
    try {
      const q = query(
        collection(db, 'comments'), 
        where('postId', '==', postId)
      );
      const querySnapshot = await getDocs(q);
      const comments: Comment[] = [];
      querySnapshot.forEach((doc) => {
        comments.push({ id: doc.id, ...doc.data() } as Comment);
      });
      // Sort in memory by creation date ascending
      comments.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
      return comments;
    } catch (err) {
      console.error("Error fetching comments for post:", err);
      throw err;
    }
  },

  // Delete a comment
  async deleteComment(commentId: string, postId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'comments', commentId));

      // Decrement commentCount on feed post
      const postRef = doc(db, 'feed_posts', postId);
      const postSnap = await getDoc(postRef);
      if (postSnap.exists()) {
        const postData = postSnap.data();
        await updateDoc(postRef, {
          commentCount: Math.max(0, (postData.commentCount || 0) - 1)
        });
      }
    } catch (err) {
      console.error("Error deleting comment:", err);
      throw err;
    }
  },

  // Edit/Update comment text
  async editComment(commentId: string, newBody: string): Promise<void> {
    try {
      const commentRef = doc(db, 'comments', commentId);
      await updateDoc(commentRef, {
        body: newBody,
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      console.error("Error editing comment:", err);
      throw err;
    }
  },

  // Fetch user reactions to check which posts are supported
  async getUserReactions(userId: string): Promise<string[]> {
    try {
      const q = query(collection(db, 'post_reactions'), where('userId', '==', userId));
      const querySnapshot = await getDocs(q);
      const postIds: string[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data() as PostReaction;
        if (data.reactionType === 'SUPPORT') {
          postIds.push(data.postId);
        }
      });
      return postIds;
    } catch (err) {
      console.error("Error fetching user reactions:", err);
      return [];
    }
  },

  // Fetch user bookmarks
  async getUserSavedPosts(userId: string): Promise<string[]> {
    try {
      const q = query(collection(db, 'saved_posts'), where('userId', '==', userId));
      const querySnapshot = await getDocs(q);
      const postIds: string[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data() as SavedPost;
        postIds.push(data.postId);
      });
      return postIds;
    } catch (err) {
      console.error("Error fetching user bookmarks:", err);
      return [];
    }
  }
};
