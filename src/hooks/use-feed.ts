import { useQuery, useQueryClient } from "@tanstack/react-query";
import { trpc } from "@/lib/trpc";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { getInitials } from "@/lib/utils";
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

export { getInitials };

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
// FETCH POSTS WITH AUTHORS (via tRPC + direct fetch for profiles)
// ============================================================

async function fetchAuthors(authorIds: string[]): Promise<Record<string, Profile>> {
    if (!authorIds.length) return {};

    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('id,username,full_name,avatar_url,user_type,uefa_license,is_verified,city')
            .in('id', authorIds);

        if (error) {
            console.error("[Feed] Error fetching authors:", error);
            return {};
        }

        const authors: Record<string, Profile> = {};
        for (const a of data || []) {
            authors[a.id] = a as Profile;
        }
        return authors;
    } catch (err) {
        console.error("[Feed] Error fetching authors:", err);
        return {};
    }
}

// ============================================================
// HOOKS (using tRPC)
// ============================================================

/**
 * Hook to fetch feed posts with author info (via tRPC + direct fetch for authors)
 */
export function useFeedPosts() {
    const { user } = useAuth();

    // Fetch posts via tRPC
    const { data: postsData, isLoading: postsLoading, error: postsError } = trpc.feed.list.useQuery(
        { page: 1, pageSize: 20 },
        {
            staleTime: 30 * 1000,
            retry: 2,
            refetchOnWindowFocus: false,
        }
    );

    if (postsError) {
        console.error("[useFeedPosts] tRPC error:", postsError);
    }

    // Use React Query to fetch and combine with authors
    const combinedQuery = useQuery({
        queryKey: [...feedKeys.posts(), "with-authors", user?.id],
        queryFn: async (): Promise<PostWithAuthor[]> => {
            const posts = postsData?.items || [];
            if (!posts.length) return [];

            // Fetch author profiles
            const authorIds = [...new Set(posts.map((p) => p.author_id).filter(Boolean))];
            const authors = await fetchAuthors(authorIds);

            // Fetch like status for all posts if user is logged in
            let likeStatuses: Record<string, boolean> = {};
            if (user) {
                try {
                    const { data: likes, error } = await supabase
                        .from('post_likes')
                        .select('post_id')
                        .eq('user_id', user.id)
                        .in('post_id', posts.map(p => p.id));

                    if (!error && likes) {
                        likeStatuses = Object.fromEntries(likes.map((l: { post_id: string }) => [l.post_id, true]));
                    }
                } catch (err) {
                    console.error("[useFeedPosts] Error fetching like statuses:", err);
                }
            }

            // Combine posts with authors and like status
            return posts.map((post) => ({
                ...post,
                author: post.author_id ? authors[post.author_id] || null : null,
                isLikedByMe: likeStatuses[post.id] || false,
            })) as PostWithAuthor[];
        },
        enabled: !!postsData?.items && !postsLoading,
        staleTime: 30 * 1000,
    });

    return combinedQuery;
}

/**
 * Hook to fetch comments for a specific post (via tRPC)
 */
export function usePostComments(postId: string, enabled: boolean) {
    const commentsQuery = trpc.feed.getComments.useQuery(postId, { enabled, staleTime: 30 * 1000 });

    // Combine with authors
    return useQuery({
        queryKey: [...feedKeys.comments(postId), "with-authors"],
        queryFn: async (): Promise<CommentWithAuthor[]> => {
            if (!commentsQuery.data) return [];
            const comments = commentsQuery.data;

            // Fetch authors for comments
            const authorIds = [...new Set(comments.map((c) => c.author_id).filter(Boolean))];
            const authors = await fetchAuthors(authorIds);

            return comments.map((comment) => ({
                ...comment,
                author: comment.author_id ? authors[comment.author_id] || null : null,
            })) as CommentWithAuthor[];
        },
        enabled: enabled && !!commentsQuery.data && !commentsQuery.isLoading,
        staleTime: 30 * 1000,
    });
}

/**
 * Hook to create a new post (via tRPC)
 */
export function useCreatePost() {
    const queryClient = useQueryClient();
    const { profile } = useAuth();
    const createMutation = trpc.feed.create.useMutation();

    const mutateAsync = async (content: string) => {
        const post = await createMutation.mutateAsync({
            content,
            post_type: "general",
            exercise_id: null,
            media_urls: [],
        });

        const postWithAuthor = { ...post, author: profile, isLikedByMe: false } as PostWithAuthor;

        queryClient.setQueryData<PostWithAuthor[]>(feedKeys.posts(), (old = []) => {
            return [postWithAuthor, ...old];
        });

        return postWithAuthor;
    };

    return {
        mutateAsync,
        isPending: createMutation.isPending,
        error: createMutation.error,
        reset: createMutation.reset,
    };
}

/**
 * Hook to toggle like on a post (via tRPC)
 */
export function useToggleLike() {
    const queryClient = useQueryClient();
    const { user } = useAuth();
    const toggleMutation = trpc.feed.toggleLike.useMutation();

    const mutateAsync = async ({ postId, isLiked }: { postId: string; isLiked: boolean }) => {
        // Optimistic update
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

        try {
            const updatedPost = await toggleMutation.mutateAsync(postId);
            // Update the cache with the actual server response
            if (updatedPost) {
                queryClient.setQueryData<PostWithAuthor[]>(feedKeys.posts(), (old = []) =>
                    old.map((p) =>
                        p.id === postId
                            ? {
                                ...p,
                                likes_count: updatedPost.likes_count,
                                isLikedByMe: !isLiked,
                            }
                            : p
                    )
                );

                // Invalidate the posts query to refetch like statuses if needed
                if (user) {
                    queryClient.invalidateQueries({ queryKey: [...feedKeys.posts(), "with-authors", user.id] });
                }
            }
            return updatedPost;
        } catch (err) {
            // Rollback on error
            if (previousPosts) {
                queryClient.setQueryData(feedKeys.posts(), previousPosts);
            }
            throw err;
        }
    };

    return {
        mutateAsync,
        isPending: toggleMutation.isPending,
        error: toggleMutation.error,
        reset: toggleMutation.reset,
    };
}

/**
 * Hook to create a comment (via tRPC)
 */
export function useCreateComment() {
    const queryClient = useQueryClient();
    const { profile } = useAuth();
    const createCommentMutation = trpc.feed.createComment.useMutation();

    const mutateAsync = async ({ postId, content }: { postId: string; content: string }) => {
        // Optimistic update for comments count
        await queryClient.cancelQueries({ queryKey: feedKeys.posts() });
        const previousPosts = queryClient.getQueryData<PostWithAuthor[]>(feedKeys.posts());

        queryClient.setQueryData<PostWithAuthor[]>(feedKeys.posts(), (old = []) =>
            old.map((p) =>
                p.id === postId
                    ? { ...p, comments_count: p.comments_count + 1 }
                    : p
            )
        );

        try {
            const comment = await createCommentMutation.mutateAsync({
                post_id: postId,
                content,
            });

            const commentWithAuthor = { ...comment, author: profile } as CommentWithAuthor;

            // Invalidate comments query to fetch new comment
            queryClient.invalidateQueries({ queryKey: feedKeys.comments(postId) });

            return commentWithAuthor;
        } catch (err) {
            // Rollback on error
            if (previousPosts) {
                queryClient.setQueryData(feedKeys.posts(), previousPosts);
            }
            throw err;
        }
    };

    return {
        mutateAsync,
        isPending: createCommentMutation.isPending,
        error: createCommentMutation.error,
        reset: createCommentMutation.reset,
    };
}

/**
 * Hook to delete a post (via tRPC)
 */
export function useDeletePost() {
    const queryClient = useQueryClient();
    const deleteMutation = trpc.feed.delete.useMutation();

    const mutateAsync = async (postId: string) => {
        await deleteMutation.mutateAsync(postId);
        queryClient.setQueryData<PostWithAuthor[]>(feedKeys.posts(), (old = []) =>
            old.filter((p) => p.id !== postId)
        );
    };

    return {
        mutateAsync,
        isPending: deleteMutation.isPending,
        error: deleteMutation.error,
        reset: deleteMutation.reset,
    };
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