import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import type { Post, PostComment, Profile } from "@/shared/types";
import { useCallback } from "react";

// ============================================================
// TYPES
// ============================================================

export interface PostWithAuthor extends Post {
    author: Profile | null;
    isLikedByMe?: boolean;
}

export interface CommentWithAuthor extends PostComment {
    author: Profile | null;
}

// ============================================================
// TIME AGO UTILITY
// ============================================================

export function timeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return "just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    const weeks = Math.floor(days / 7);
    if (weeks < 4) return `${weeks}w ago`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months}mo ago`;
    const years = Math.floor(days / 365);
    return `${years}y ago`;
}

// ============================================================
// GET INITIALS
// ============================================================

export function getInitials(name: string): string {
    return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
}

// ============================================================
// QUERY KEYS
// ============================================================

const feedKeys = {
    all: ["feed"] as const,
    posts: () => [...feedKeys.all, "posts"] as const,
    comments: (postId: string) => [...feedKeys.all, "comments", postId] as const,
    likes: (postId: string) => [...feedKeys.all, "likes", postId] as const,
};

// ============================================================
// FETCH POSTS WITH AUTHORS
// ============================================================

async function fetchPostsWithAuthors(page = 1, pageSize = 20): Promise<PostWithAuthor[]> {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error } = await supabase
        .from("posts")
        .select("*, author:profiles(*)")
        .order("created_at", { ascending: false })
        .range(from, to);

    if (error) {
        console.error("Error fetching posts:", error);
        return [];
    }

    return (data || []) as unknown as PostWithAuthor[];
}

// ============================================================
// FETCH LIKES STATUS
// ============================================================

async function fetchMyLikes(userId: string, postIds: string[]): Promise<Set<string>> {
    if (!postIds.length) return new Set();

    const { data, error } = await supabase
        .from("post_likes")
        .select("post_id")
        .eq("user_id", userId)
        .in("post_id", postIds);

    if (error) {
        console.error("Error fetching likes:", error);
        return new Set();
    }

    return new Set((data || []).map((d) => d.post_id));
}

// ============================================================
// FETCH COMMENTS WITH AUTHORS
// ============================================================

async function fetchCommentsWithAuthors(postId: string): Promise<CommentWithAuthor[]> {
    const { data, error } = await supabase
        .from("post_comments")
        .select("*, author:profiles(*)")
        .eq("post_id", postId)
        .order("created_at", { ascending: true });

    if (error) {
        console.error("Error fetching comments:", error);
        return [];
    }

    return (data || []) as unknown as CommentWithAuthor[];
}

// ============================================================
// HOOKS
// ============================================================

/**
 * Hook to fetch feed posts with author info and like status
 */
export function useFeedPosts() {
    const { user } = useAuth();

    return useQuery({
        queryKey: feedKeys.posts(),
        queryFn: async () => {
            const posts = await fetchPostsWithAuthors();

            // Fetch like status for current user
            if (user && posts.length > 0) {
                const postIds = posts.map((p) => p.id);
                const likedPostIds = await fetchMyLikes(user.id, postIds);
                return posts.map((p) => ({
                    ...p,
                    isLikedByMe: likedPostIds.has(p.id),
                }));
            }

            return posts;
        },
        staleTime: 30 * 1000, // 30 seconds
    });
}

/**
 * Hook to fetch comments for a specific post
 */
export function usePostComments(postId: string, enabled: boolean) {
    return useQuery({
        queryKey: feedKeys.comments(postId),
        queryFn: () => fetchCommentsWithAuthors(postId),
        enabled,
        staleTime: 30 * 1000,
    });
}

/**
 * Hook to create a new post
 */
export function useCreatePost() {
    const queryClient = useQueryClient();
    const { user, profile } = useAuth();

    return useMutation({
        mutationFn: async (content: string) => {
            if (!user) throw new Error("Must be logged in");

            const { data, error } = await supabase
                .from("posts")
                .insert({
                    author_id: user.id,
                    content,
                    post_type: "general",
                    likes_count: 0,
                    comments_count: 0,
                    shares_count: 0,
                    media_urls: [],
                })
                .select("*, author:profiles(*)")
                .single();

            if (error) throw error;
            return data as unknown as PostWithAuthor;
        },
        onSuccess: (newPost) => {
            // Optimistically add the new post with author to the cache
            queryClient.setQueryData<PostWithAuthor[]>(feedKeys.posts(), (old = []) => {
                const postWithAuthor = {
                    ...newPost,
                    isLikedByMe: false,
                    author: profile,
                };
                return [postWithAuthor, ...old];
            });
        },
    });
}

/**
 * Hook to toggle like on a post
 */
export function useToggleLike() {
    const queryClient = useQueryClient();
    const { user } = useAuth();

    return useMutation({
        mutationFn: async ({ postId, isLiked }: { postId: string; isLiked: boolean }) => {
            if (!user) throw new Error("Must be logged in");

            if (isLiked) {
                // Unlike
                const { error: deleteError } = await supabase
                    .from("post_likes")
                    .delete()
                    .eq("user_id", user.id)
                    .eq("post_id", postId);
                if (deleteError) throw deleteError;

                // Decrement likes count
                const { error: updateError } = await supabase.rpc("decrement_post_likes", {
                    post_id: postId,
                });
                // If RPC doesn't exist, manually update
                if (updateError) {
                    const { data: post } = await supabase
                        .from("posts")
                        .select("likes_count")
                        .eq("id", postId)
                        .single();
                    if (post) {
                        await supabase
                            .from("posts")
                            .update({ likes_count: Math.max(0, (post.likes_count || 0) - 1) })
                            .eq("id", postId);
                    }
                }
            } else {
                // Like
                const { error: insertError } = await supabase
                    .from("post_likes")
                    .insert({ user_id: user.id, post_id: postId });
                if (insertError) throw insertError;

                // Increment likes count
                const { error: updateError } = await supabase.rpc("increment_post_likes", {
                    post_id: postId,
                });
                // If RPC doesn't exist, manually update
                if (updateError) {
                    const { data: post } = await supabase
                        .from("posts")
                        .select("likes_count")
                        .eq("id", postId)
                        .single();
                    if (post) {
                        await supabase
                            .from("posts")
                            .update({ likes_count: (post.likes_count || 0) + 1 })
                            .eq("id", postId);
                    }
                }
            }

            return { liked: !isLiked };
        },
        // Optimistic update
        onMutate: async ({ postId, isLiked }) => {
            await queryClient.cancelQueries({ queryKey: feedKeys.posts() });
            const previousPosts = queryClient.getQueryData<PostWithAuthor[]>(feedKeys.posts());

            queryClient.setQueryData<PostWithAuthor[]>(feedKeys.posts(), (old = []) =>
                old.map((p) =>
                    p.id === postId
                        ? {
                            ...p,
                            isLikedByMe: !isLiked,
                            likes_count: isLiked ? p.likes_count - 1 : p.likes_count + 1,
                        }
                        : p
                )
            );

            return { previousPosts };
        },
        onError: (_err, _variables, context) => {
            if (context?.previousPosts) {
                queryClient.setQueryData(feedKeys.posts(), context.previousPosts);
            }
        },
    });
}

/**
 * Hook to create a comment
 */
export function useCreateComment() {
    const queryClient = useQueryClient();
    const { user, profile } = useAuth();

    return useMutation({
        mutationFn: async ({ postId, content }: { postId: string; content: string }) => {
            if (!user) throw new Error("Must be logged in");

            const { data, error } = await supabase
                .from("post_comments")
                .insert({
                    post_id: postId,
                    author_id: user.id,
                    content,
                    parent_comment_id: null,
                })
                .select("*, author:profiles(*)")
                .single();

            if (error) throw error;

            // Increment comments count on the post
            const { error: rpcError } = await supabase.rpc("increment_post_comments", {
                post_id: postId,
            });
            if (rpcError) {
                // Manual fallback
                const { data: post } = await supabase
                    .from("posts")
                    .select("comments_count")
                    .eq("id", postId)
                    .single();
                if (post) {
                    await supabase
                        .from("posts")
                        .update({ comments_count: (post.comments_count || 0) + 1 })
                        .eq("id", postId);
                }
            }

            return data as unknown as CommentWithAuthor;
        },
        onSuccess: (_data, variables) => {
            // Invalidate comments for this post
            queryClient.invalidateQueries({ queryKey: feedKeys.comments(variables.postId) });
            // Update the post's comment count in the feed
            queryClient.setQueryData<PostWithAuthor[]>(feedKeys.posts(), (old = []) =>
                old.map((p) =>
                    p.id === variables.postId
                        ? { ...p, comments_count: p.comments_count + 1 }
                        : p
                )
            );
        },
    });
}

/**
 * Hook to delete a post
 */
export function useDeletePost() {
    const queryClient = useQueryClient();
    const { user } = useAuth();

    return useMutation({
        mutationFn: async (postId: string) => {
            if (!user) throw new Error("Must be logged in");

            // Delete the post directly - CASCADE on foreign keys will handle likes & comments
            const { error } = await supabase.from("posts").delete().eq("id", postId);
            if (error) {
                // If CASCADE isn't set up, try manual cleanup with service role fallback
                console.warn("Direct delete failed, attempting manual cleanup:", error.message);
                // Try deleting own likes/comments first, then the post
                await supabase.from("post_likes").delete().eq("user_id", user.id).eq("post_id", postId);
                await supabase.from("post_comments").delete().eq("author_id", user.id).eq("post_id", postId);
                const { error: retryError } = await supabase.from("posts").delete().eq("id", postId);
                if (retryError) throw retryError;
            }
            return postId;
        },
        onSuccess: (postId) => {
            queryClient.setQueryData<PostWithAuthor[]>(feedKeys.posts(), (old = []) =>
                old.filter((p) => p.id !== postId)
            );
        },
    });
}

/**
 * Real-time subscription for new posts
 */
export function useFeedRealtime() {
    const queryClient = useQueryClient();

    const setupSubscription = useCallback(() => {
        const channel = supabase
            .channel("feed-realtime")
            .on(
                "postgres_changes",
                { event: "INSERT", schema: "public", table: "posts" },
                () => {
                    queryClient.invalidateQueries({ queryKey: feedKeys.posts() });
                }
            )
            .on(
                "postgres_changes",
                { event: "DELETE", schema: "public", table: "posts" },
                () => {
                    queryClient.invalidateQueries({ queryKey: feedKeys.posts() });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [queryClient]);

    return setupSubscription;
}