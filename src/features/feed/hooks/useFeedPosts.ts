import { useState, useEffect, useCallback } from 'react';
import { feedService } from '../services/feedService';
import { FeedPost, Comment, User } from '../../../types';

export function useFeedPosts(currentUser: User | null) {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Track supported and saved post IDs for the current user
  const [supportedPostIds, setSupportedPostIds] = useState<string[]>([]);
  const [savedPostIds, setSavedPostIds] = useState<string[]>([]);

  // Cache comments by postId to avoid duplicate fetches
  const [commentsCache, setCommentsCache] = useState<{ [postId: string]: Comment[] }>({});
  const [commentsLoading, setCommentsLoading] = useState<{ [postId: string]: boolean }>({});

  const fetchFeedData = useCallback(async () => {
    if (!currentUser) return;
    setLoading(true);
    setError(null);
    try {
      const [allPosts, userSupports, userSaves] = await Promise.all([
        feedService.getFeedPosts(),
        feedService.getUserReactions(currentUser.id),
        feedService.getUserSavedPosts(currentUser.id)
      ]);
      setPosts(allPosts);
      setSupportedPostIds(userSupports);
      setSavedPostIds(userSaves);
    } catch (err: any) {
      console.error("Failed to load feed data:", err);
      setError(err.message || "Failed to load feed");
    } finally {
      setLoading(false);
    }
  }, [currentUser?.id]);

  // Load feed on mount or user change
  useEffect(() => {
    if (currentUser?.id) {
      fetchFeedData();
    }
  }, [currentUser?.id, fetchFeedData]);

  // Load comments for a specific post
  const loadComments = useCallback(async (postId: string) => {
    if (commentsCache[postId] || commentsLoading[postId]) return;
    
    setCommentsLoading(prev => ({ ...prev, [postId]: true }));
    try {
      const comments = await feedService.getPostComments(postId);
      setCommentsCache(prev => ({ ...prev, [postId]: comments }));
    } catch (err) {
      console.error(`Failed to load comments for post ${postId}:`, err);
    } finally {
      setCommentsLoading(prev => ({ ...prev, [postId]: false }));
    }
  }, [commentsCache, commentsLoading]);

  // Toggle Support / Like
  const toggleSupport = useCallback(async (postId: string) => {
    if (!currentUser) return;
    const isSupported = supportedPostIds.includes(postId);

    // Optimistic UI updates
    setSupportedPostIds(prev => 
      isSupported ? prev.filter(id => id !== postId) : [...prev, postId]
    );
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        return {
          ...p,
          supportCount: Math.max(0, p.supportCount + (isSupported ? -1 : 1))
        };
      }
      return p;
    }));

    try {
      if (isSupported) {
        await feedService.unsupportPost(postId, currentUser.id);
      } else {
        await feedService.supportPost(postId, currentUser.id);
      }
    } catch (err) {
      console.error("Failed to toggle support:", err);
      // Rollback on error
      setSupportedPostIds(prev => 
        isSupported ? [...prev, postId] : prev.filter(id => id !== postId)
      );
      setPosts(prev => prev.map(p => {
        if (p.id === postId) {
          return {
            ...p,
            supportCount: Math.max(0, p.supportCount + (isSupported ? 1 : -1))
          };
        }
        return p;
      }));
    }
  }, [currentUser, supportedPostIds]);

  // Toggle Save / Bookmark
  const toggleSave = useCallback(async (postId: string) => {
    if (!currentUser) return;
    const isSaved = savedPostIds.includes(postId);

    // Optimistic UI updates
    setSavedPostIds(prev => 
      isSaved ? prev.filter(id => id !== postId) : [...prev, postId]
    );
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        return {
          ...p,
          saveCount: Math.max(0, p.saveCount + (isSaved ? -1 : 1))
        };
      }
      return p;
    }));

    try {
      if (isSaved) {
        await feedService.unsavePost(postId, currentUser.id);
      } else {
        await feedService.savePost(postId, currentUser.id);
      }
    } catch (err) {
      console.error("Failed to toggle save:", err);
      // Rollback on error
      setSavedPostIds(prev => 
        isSaved ? [...prev, postId] : prev.filter(id => id !== postId)
      );
      setPosts(prev => prev.map(p => {
        if (p.id === postId) {
          return {
            ...p,
            saveCount: Math.max(0, p.saveCount + (isSaved ? 1 : -1))
          };
        }
        return p;
      }));
    }
  }, [currentUser, savedPostIds]);

  // Add a comment to a post
  const addComment = useCallback(async (postId: string, body: string, issueId?: string, communityId?: string) => {
    if (!currentUser || !body.trim()) return;

    try {
      const newComment = await feedService.commentOnPost({
        postId,
        issueId,
        communityId,
        userId: currentUser.id,
        userName: currentUser.name,
        userPhotoUrl: currentUser.photoUrl,
        body: body.trim()
      });

      // Update comments cache
      setCommentsCache(prev => ({
        ...prev,
        [postId]: [...(prev[postId] || []), newComment]
      }));

      // Increment commentCount in local posts state
      setPosts(prev => prev.map(p => {
        if (p.id === postId) {
          return { ...p, commentCount: p.commentCount + 1 };
        }
        return p;
      }));

      return newComment;
    } catch (err) {
      console.error("Failed to add comment:", err);
      throw err;
    }
  }, [currentUser]);

  // Edit a comment on a feed post
  const editComment = useCallback(async (commentId: string, newBody: string, postId: string) => {
    try {
      await feedService.editComment(commentId, newBody);
      setCommentsCache(prev => {
        const cached = prev[postId] || [];
        return {
          ...prev,
          [postId]: cached.map(c => c.id === commentId ? { ...c, body: newBody, updatedAt: new Date().toISOString() } : c)
        };
      });
    } catch (err) {
      console.error("Failed to edit comment:", err);
      throw err;
    }
  }, []);

  // Delete a comment on a feed post
  const deleteComment = useCallback(async (commentId: string, postId: string) => {
    try {
      await feedService.deleteComment(commentId, postId);
      setCommentsCache(prev => {
        const cached = prev[postId] || [];
        return {
          ...prev,
          [postId]: cached.filter(c => c.id !== commentId)
        };
      });
      // Decrement commentCount in posts state
      setPosts(prev => prev.map(p => {
        if (p.id === postId) {
          return { ...p, commentCount: Math.max(0, p.commentCount - 1) };
        }
        return p;
      }));
    } catch (err) {
      console.error("Failed to delete comment:", err);
      throw err;
    }
  }, []);

  // Add a new post locally (when a new issue is submitted)
  const addNewPost = useCallback((newPost: FeedPost) => {
    setPosts(prev => [newPost, ...prev]);
  }, []);

  // Update a post locally (when an issue is updated)
  const updatePostLocally = useCallback((postId: string, updates: Partial<FeedPost>) => {
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, ...updates } : p));
  }, []);

  // Delete a post locally (when an issue is deleted)
  const deletePostLocally = useCallback((postId: string) => {
    setPosts(prev => prev.filter(p => p.id !== postId));
  }, []);

  return {
    posts,
    loading,
    error,
    supportedPostIds,
    savedPostIds,
    commentsCache,
    commentsLoading,
    refreshFeed: fetchFeedData,
    loadComments,
    toggleSupport,
    toggleSave,
    addComment,
    editComment,
    deleteComment,
    addNewPost,
    updatePostLocally,
    deletePostLocally
  };
}
