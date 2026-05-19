import { useQueryClient } from "@tanstack/react-query";
import { getQueryKey } from "@trpc/react-query";
import { trpc } from "@/lib/trpc";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { getInitials } from "@/lib/utils";
import type {
  CommentWithAuthor,
  PaginatedResponse,
  Post,
  PostWithAuthor,
} from "@/shared/types";
import { useCallback } from "react";

export type { CommentWithAuthor, PostWithAuthor };

const FEED_LIST_INPUT = { page: 1, pageSize: 20 } as const;

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

export { getInitials };

export function prependPostToPage(
  page: PaginatedResponse<PostWithAuthor> | undefined,
  post: PostWithAuthor,
): PaginatedResponse<PostWithAuthor> | undefined {
  if (!page) return page;
  return {
    ...page,
    items: [post, ...page.items].slice(0, page.pageSize),
    total: page.total + 1,
    totalPages: Math.ceil((page.total + 1) / page.pageSize),
  };
}

export function updatePostLikeInPage(
  page: PaginatedResponse<PostWithAuthor> | undefined,
  postId: string,
  isLiked: boolean,
  serverPost?: Pick<Post, "likes_count"> | null,
): PaginatedResponse<PostWithAuthor> | undefined {
  if (!page) return page;
  return {
    ...page,
    items: page.items.map((post) =>
      post.id === postId
        ? {
            ...post,
            isLikedByMe: !isLiked,
            likes_count:
              serverPost?.likes_count ??
              (isLiked
                ? Math.max(0, post.likes_count - 1)
                : post.likes_count + 1),
          }
        : post,
    ),
  };
}

export function incrementPostCommentsInPage(
  page: PaginatedResponse<PostWithAuthor> | undefined,
  postId: string,
): PaginatedResponse<PostWithAuthor> | undefined {
  if (!page) return page;
  return {
    ...page,
    items: page.items.map((post) =>
      post.id === postId
        ? { ...post, comments_count: post.comments_count + 1 }
        : post,
    ),
  };
}

export function removePostFromPage(
  page: PaginatedResponse<PostWithAuthor> | undefined,
  postId: string,
): PaginatedResponse<PostWithAuthor> | undefined {
  if (!page) return page;
  const items = page.items.filter((post) => post.id !== postId);
  const total = Math.max(0, page.total - (items.length === page.items.length ? 0 : 1));
  return {
    ...page,
    items,
    total,
    totalPages: Math.ceil(total / page.pageSize),
  };
}

export function useFeedPosts() {
  return trpc.feed.list.useQuery(FEED_LIST_INPUT, {
    staleTime: 30 * 1000,
    retry: 2,
    refetchOnWindowFocus: false,
    select: (data) => data.items,
  });
}

export function usePostComments(postId: string, enabled: boolean) {
  return trpc.feed.getComments.useQuery(postId, {
    enabled,
    staleTime: 30 * 1000,
  });
}

export function useCreatePost() {
  const utils = trpc.useUtils();
  const { profile } = useAuth();
  const createMutation = trpc.feed.create.useMutation();

  const mutateAsync = async (content: string) => {
    const post = await createMutation.mutateAsync({
      content,
      post_type: "general",
      exercise_id: null,
      media_urls: [],
    });

    const postWithAuthor = {
      ...post,
      author: profile,
      isLikedByMe: false,
    } as PostWithAuthor;

    utils.feed.list.setData(FEED_LIST_INPUT, (old) =>
      prependPostToPage(old, postWithAuthor),
    );

    return postWithAuthor;
  };

  return {
    mutateAsync,
    isPending: createMutation.isPending,
    error: createMutation.error,
    reset: createMutation.reset,
  };
}

export function useToggleLike() {
  const queryClient = useQueryClient();
  const toggleMutation = trpc.feed.toggleLike.useMutation();
  const feedListKey = getQueryKey(trpc.feed.list, FEED_LIST_INPUT);

  const mutateAsync = async ({
    postId,
    isLiked,
  }: {
    postId: string;
    isLiked: boolean;
  }) => {
    await queryClient.cancelQueries({ queryKey: feedListKey });
    const previousPage =
      queryClient.getQueryData<PaginatedResponse<PostWithAuthor>>(feedListKey);

    queryClient.setQueryData<PaginatedResponse<PostWithAuthor>>(
      feedListKey,
      (old) => updatePostLikeInPage(old, postId, isLiked),
    );

    try {
      const updatedPost = await toggleMutation.mutateAsync(postId);
      queryClient.setQueryData<PaginatedResponse<PostWithAuthor>>(
        feedListKey,
        (old) => updatePostLikeInPage(old, postId, isLiked, updatedPost),
      );
      return updatedPost;
    } catch (err) {
      queryClient.setQueryData(feedListKey, previousPage);
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

export function useCreateComment() {
  const queryClient = useQueryClient();
  const utils = trpc.useUtils();
  const { profile } = useAuth();
  const createCommentMutation = trpc.feed.createComment.useMutation();
  const feedListKey = getQueryKey(trpc.feed.list, FEED_LIST_INPUT);

  const mutateAsync = async ({
    postId,
    content,
  }: {
    postId: string;
    content: string;
  }) => {
    await queryClient.cancelQueries({ queryKey: feedListKey });
    const previousPage =
      queryClient.getQueryData<PaginatedResponse<PostWithAuthor>>(feedListKey);

    queryClient.setQueryData<PaginatedResponse<PostWithAuthor>>(
      feedListKey,
      (old) => incrementPostCommentsInPage(old, postId),
    );

    try {
      const comment = await createCommentMutation.mutateAsync({
        post_id: postId,
        content,
      });

      await utils.feed.getComments.invalidate(postId);
      return { ...comment, author: profile } as CommentWithAuthor;
    } catch (err) {
      queryClient.setQueryData(feedListKey, previousPage);
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

export function useDeletePost() {
  const utils = trpc.useUtils();
  const deleteMutation = trpc.feed.delete.useMutation();

  const mutateAsync = async (postId: string) => {
    await deleteMutation.mutateAsync(postId);
    utils.feed.list.setData(FEED_LIST_INPUT, (old) =>
      removePostFromPage(old, postId),
    );
  };

  return {
    mutateAsync,
    isPending: deleteMutation.isPending,
    error: deleteMutation.error,
    reset: deleteMutation.reset,
  };
}

export function useFeedRealtime() {
  const utils = trpc.useUtils();

  const setupSubscription = useCallback(() => {
    const channel = supabase
      .channel("feed-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "posts" },
        () => {
          utils.feed.list.invalidate();
        },
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "posts" },
        () => {
          utils.feed.list.invalidate();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [utils]);

  return setupSubscription;
}
