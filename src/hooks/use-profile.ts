import { trpc } from "@/lib/trpc";

// ============================================================
// QUERY KEYS
// ============================================================

export const profileKeys = {
    all: ["profile"] as const,
    me: () => [...profileKeys.all, "me"] as const,
    byId: (id: string) => [...profileKeys.all, "id", id] as const,
    byUsername: (username: string) => [...profileKeys.all, "username", username] as const,
    search: (query: string) => [...profileKeys.all, "search", query] as const,
    following: () => [...profileKeys.all, "following"] as const,
    followers: () => [...profileKeys.all, "followers"] as const,
};

// ============================================================
// HOOKS
// ============================================================

/**
 * Hook to fetch current user's profile
 */
export function useMyProfile() {
    return trpc.profile.me.useQuery(undefined, {
        staleTime: 60 * 1000,
    });
}

/**
 * Hook to fetch a profile by ID
 */
export function useProfile(id: string | null) {
    return trpc.profile.getById.useQuery(id || "", {
        enabled: !!id,
        staleTime: 60 * 1000,
    });
}

/**
 * Hook to fetch a profile by username
 */
export function useProfileByUsername(username: string | null) {
    return trpc.profile.getByUsername.useQuery(username || "", {
        enabled: !!username,
        staleTime: 60 * 1000,
    });
}

/**
 * Hook to search profiles
 */
export function useSearchProfiles(query: string) {
    return trpc.profile.search.useQuery({ query }, {
        enabled: query.length > 0,
        staleTime: 30 * 1000,
    });
}

/**
 * Hook to update current user's profile
 */
export function useUpdateProfile() {
    const utils = trpc.useUtils();

    return trpc.profile.update.useMutation({
        onSuccess: () => {
            utils.profile.me.invalidate();
        },
    });
}

/**
 * Hook to check if current user follows another user
 */
export function useFollowStatus(targetUserId: string | null) {
    return trpc.profile.isFollowing.useQuery(targetUserId || "", {
        enabled: !!targetUserId,
        staleTime: 30 * 1000,
    });
}

/**
 * Hook to get exercise count for a user
 */
export function useUserExerciseCount(userId: string | null) {
    return trpc.exercise.getByAuthor.useQuery(userId || "", {
        enabled: !!userId,
        select: (data) => data.length,
    });
}

/**
 * Hook to get recent exercises by the current user
 */
export function useMyRecentExercises(limit: number = 5) {
    const { data: profile } = useMyProfile();
    return trpc.exercise.getByAuthor.useQuery(profile?.id || "", {
        enabled: !!profile?.id,
        select: (data) => data.slice(0, limit),
    });
}

/**
 * Hook to get follow counts for a profile
 */
export function useFollowCounts(userId: string | null) {
    return trpc.profile.getFollowCounts.useQuery(userId || "", {
        enabled: !!userId,
        staleTime: 30 * 1000,
    });
}
