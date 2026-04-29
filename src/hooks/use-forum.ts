import { trpc } from "@/lib/trpc";

// ============================================================
// QUERY KEYS
// ============================================================

export const forumKeys = {
    all: ["forum"] as const,
    categories: () => [...forumKeys.all, "categories"] as const,
    threads: () => [...forumKeys.all, "threads"] as const,
    thread: (id: string) => [...forumKeys.all, "thread", id] as const,
    replies: (threadId: string) => [...forumKeys.all, "replies", threadId] as const,
};

// ============================================================
// HOOKS
// ============================================================

/**
 * Hook to fetch all forum categories
 */
export function useForumCategories() {
    return trpc.forum.getCategories.useQuery(undefined, {
        staleTime: 60 * 1000, // Categories change rarely
    });
}

/**
 * Hook to fetch all forum threads
 */
export function useForumThreads(categoryId?: string | null) {
    return trpc.forum.listThreads.useQuery(
        categoryId ? { category_id: categoryId } : undefined,
        {
            staleTime: 30 * 1000,
        }
    );
}

/**
 * Hook to fetch a single thread by ID
 */
export function useForumThread(id: string | null) {
    return trpc.forum.getThreadById.useQuery(id || "", {
        enabled: !!id,
        staleTime: 30 * 1000,
    });
}

/**
 * Hook to fetch replies for a thread
 */
export function useThreadReplies(threadId: string | null) {
    return trpc.forum.getReplies.useQuery(threadId || "", {
        enabled: !!threadId,
        staleTime: 30 * 1000,
    });
}

/**
 * Hook to create a new thread
 */
export function useCreateThread() {
    const utils = trpc.useUtils();

    return trpc.forum.createThread.useMutation({
        onSuccess: () => {
            utils.forum.listThreads.invalidate();
        },
    });
}

/**
 * Hook to update a thread
 */
export function useUpdateThread() {
    const utils = trpc.useUtils();

    return trpc.forum.updateThread.useMutation({
        onSuccess: (data) => {
            utils.forum.listThreads.invalidate();
            utils.forum.getThreadById.invalidate(data.id);
        },
    });
}

/**
 * Hook to moderate a thread (pin, lock, etc.)
 */
export function useModerateThread() {
    const utils = trpc.useUtils();

    return trpc.forum.moderateThread.useMutation({
        onSuccess: (data) => {
            utils.forum.listThreads.invalidate();
            utils.forum.getThreadById.invalidate(data.id);
        },
    });
}

/**
 * Hook to create a reply
 */
export function useCreateReply() {
    const utils = trpc.useUtils();

    return trpc.forum.createReply.useMutation({
        onSuccess: (_data, variables) => {
            if (variables && typeof variables === 'object' && 'thread_id' in variables) {
                utils.forum.getReplies.invalidate(variables.thread_id);
            }
            utils.forum.listThreads.invalidate();
        },
    });
}

