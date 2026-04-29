import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { trpc } from "@/lib/trpc";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import type { Exercise, Profile, ExerciseCategory, AgeGroup, Difficulty } from "@/shared/types";
import { useCallback } from "react";

// ============================================================
// TYPES
// ============================================================

export interface ExerciseWithAuthor extends Exercise {
    author: Profile | null;
    isLikedByMe?: boolean;
}

export interface ExerciseFilters {
    category: ExerciseCategory | "all";
    age_group: AgeGroup | "all";
    difficulty: Difficulty | "all";
    search: string;
    is_premium?: boolean;
}

// ============================================================
// CATEGORY DISPLAY HELPERS
// ============================================================

export const categoryConfig: Record<string, { label: string; icon: string }> = {
    all: { label: "All", icon: "🏋️" },
    warmup: { label: "Warmup", icon: "🔥" },
    passing: { label: "Passing", icon: "⚽" },
    shooting: { label: "Shooting", icon: "🎯" },
    dribbling: { label: "Dribbling", icon: "💨" },
    defending: { label: "Defending", icon: "🛡️" },
    goalkeeping: { label: "Goalkeeping", icon: "🧤" },
    tactical: { label: "Tactical", icon: "📋" },
    physical: { label: "Physical", icon: "💪" },
    cooldown: { label: "Cooldown", icon: "🧊" },
    rondo: { label: "Rondo", icon: "⭕" },
    small_sided_game: { label: "Small Sided", icon: "🏟️" },
    set_piece: { label: "Set Piece", icon: "🚩" },
};

export const difficultyColors: Record<string, string> = {
    beginner: "bg-green-500/10 text-green-400 border-green-500/20",
    intermediate: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    advanced: "bg-red-500/10 text-red-400 border-red-500/20",
};

// ============================================================
// QUERY KEYS
// ============================================================

const exerciseKeys = {
    all: ["exercises"] as const,
    lists: () => [...exerciseKeys.all, "list"] as const,
    list: (filters: ExerciseFilters) => [...exerciseKeys.lists(), filters] as const,
    detail: (id: string) => [...exerciseKeys.all, "detail", id] as const,
};

// ============================================================
// AUTHOR ENRICHMENT (direct REST so we batch in one request)
// ============================================================

async function fetchAuthors(authorIds: string[]): Promise<Record<string, Profile>> {
    if (!authorIds.length) return {};
    try {
        const response = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/profiles?select=id,username,full_name,avatar_url,user_type,uefa_license,is_verified,city&id=in.(${authorIds.join(",")})`,
            {
                headers: {
                    apikey: import.meta.env.VITE_SUPABASE_ANON_KEY || "",
                    Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY || ""}`,
                },
            },
        );
        if (!response.ok) return {};
        const list = await response.json();
        return Object.fromEntries(list.map((p: Profile) => [p.id, p]));
    } catch {
        return {};
    }
}

async function fetchMyLikedExerciseIds(userId: string, exerciseIds: string[]): Promise<Set<string>> {
    if (!exerciseIds.length) return new Set();
    const { data, error } = await supabase
        .from("exercise_likes")
        .select("exercise_id")
        .eq("user_id", userId)
        .in("exercise_id", exerciseIds);
    if (error) return new Set();
    return new Set((data || []).map((d) => d.exercise_id));
}

// ============================================================
// HOOKS
// ============================================================

/**
 * Fetch exercises with filters (via tRPC) and enrich with author + like info.
 * Returns shape compatible with `useQuery` consumers: { data, isLoading, error, refetch, isRefetching }.
 */
export function useExercises(filters: ExerciseFilters) {
    const { user } = useAuth();

    // Strip "all" sentinels and empty search; the server validator rejects them
    const trpcInput = {
        page: 1,
        pageSize: 100,
        ...(filters.category !== "all" ? { category: filters.category } : {}),
        ...(filters.age_group !== "all" ? { age_group: filters.age_group } : {}),
        ...(filters.difficulty !== "all" ? { difficulty: filters.difficulty } : {}),
        ...(filters.search.trim() ? { search: filters.search.trim() } : {}),
        ...(filters.is_premium !== undefined ? { is_premium: filters.is_premium } : {}),
    };

    const listQuery = trpc.exercise.list.useQuery(trpcInput, {
        staleTime: 30 * 1000,
        retry: 2,
        refetchOnWindowFocus: false,
    });

    const enrichQuery = useQuery({
        queryKey: [...exerciseKeys.list(filters), "with-authors", user?.id],
        queryFn: async (): Promise<ExerciseWithAuthor[]> => {
            const items = listQuery.data?.items ?? [];
            if (!items.length) return [];

            const authorIds = [...new Set(items.map((e) => e.author_id).filter(Boolean))];
            const exerciseIds = items.map((e) => e.id);

            const [authors, likedIds] = await Promise.all([
                fetchAuthors(authorIds),
                user ? fetchMyLikedExerciseIds(user.id, exerciseIds) : Promise.resolve(new Set<string>()),
            ]);

            return items.map((e) => ({
                ...e,
                author: authors[e.author_id] ?? null,
                isLikedByMe: likedIds.has(e.id),
            }));
        },
        enabled: !!listQuery.data && !listQuery.isLoading,
        staleTime: 30 * 1000,
    });

    // Merge the two-stage query state so consumers see a single loading/error model
    return {
        data: enrichQuery.data,
        isLoading: listQuery.isLoading || (!!listQuery.data && enrichQuery.isLoading),
        error: listQuery.error || enrichQuery.error,
        refetch: async () => {
            await listQuery.refetch();
            return enrichQuery.refetch();
        },
        isRefetching: listQuery.isRefetching || enrichQuery.isRefetching,
    };
}

/**
 * Create a new exercise (via tRPC).
 * Note: server sets is_approved=false / status=pending, so created exercises
 * won't appear in the public list until approved. The page surfaces a toast.
 */
export function useCreateExercise() {
    const queryClient = useQueryClient();
    const createMutation = trpc.exercise.create.useMutation();

    const mutateAsync = async (input: {
        title: string;
        description: string;
        category: ExerciseCategory;
        age_group: AgeGroup;
        difficulty: Difficulty;
        duration_minutes: number;
        min_players: number;
        max_players: number;
        equipment: string[];
        is_premium: boolean;
    }) => {
        const exercise = await createMutation.mutateAsync({
            title: input.title,
            description: input.description || null,
            category: input.category,
            age_group: input.age_group,
            difficulty: input.difficulty,
            image_url: null,
            animation_url: null,
            video_url: null,
            diagram_data: null,
            min_players: input.min_players,
            max_players: input.max_players,
            duration_minutes: input.duration_minutes,
            equipment: input.equipment,
            is_premium: input.is_premium,
        });

        queryClient.invalidateQueries({ queryKey: exerciseKeys.all });
        return exercise;
    };

    return {
        mutateAsync,
        isPending: createMutation.isPending,
        error: createMutation.error,
        reset: createMutation.reset,
    };
}

/**
 * Toggle like on an exercise (via tRPC), with optimistic update.
 */
export function useToggleExerciseLike() {
    const queryClient = useQueryClient();
    const toggleMutation = trpc.exercise.toggleLike.useMutation();

    const mutate = ({ exerciseId, isLiked }: { exerciseId: string; isLiked: boolean }) => {
        // Optimistic update across all enriched lists
        const previousQueries = queryClient.getQueriesData<ExerciseWithAuthor[]>({ queryKey: exerciseKeys.all });
        queryClient.setQueriesData<ExerciseWithAuthor[]>(
            { queryKey: exerciseKeys.all },
            (old = []) =>
                old.map((e) =>
                    e.id === exerciseId
                        ? {
                              ...e,
                              isLikedByMe: !isLiked,
                              likes_count: isLiked ? Math.max(0, e.likes_count - 1) : e.likes_count + 1,
                          }
                        : e,
                ),
        );

        toggleMutation.mutate(exerciseId, {
            onError: () => {
                previousQueries.forEach(([key, data]) => queryClient.setQueryData(key, data));
            },
        });
    };

    return { mutate, isPending: toggleMutation.isPending };
}

/**
 * Increment view count (via tRPC).
 */
export function useIncrementViews() {
    const incrementMutation = trpc.exercise.incrementViews.useMutation();
    return {
        mutateAsync: (exerciseId: string) => incrementMutation.mutateAsync(exerciseId),
    };
}

/**
 * Delete an exercise (via tRPC).
 */
export function useDeleteExercise() {
    const queryClient = useQueryClient();
    const deleteMutation = trpc.exercise.delete.useMutation();

    return {
        mutateAsync: async (exerciseId: string) => {
            await deleteMutation.mutateAsync(exerciseId);
            queryClient.invalidateQueries({ queryKey: exerciseKeys.all });
            return exerciseId;
        },
        isPending: deleteMutation.isPending,
    };
}

/**
 * Real-time subscription for exercises.
 * Uses supabase WebSocket channel — separate from the REST auth path that had the deadlock issue.
 */
export function useExercisesRealtime() {
    const queryClient = useQueryClient();

    const setupSubscription = useCallback(() => {
        const channel = supabase
            .channel("exercises-realtime")
            .on(
                "postgres_changes",
                { event: "INSERT", schema: "public", table: "exercises" },
                () => queryClient.invalidateQueries({ queryKey: exerciseKeys.all }),
            )
            .on(
                "postgres_changes",
                { event: "UPDATE", schema: "public", table: "exercises" },
                () => queryClient.invalidateQueries({ queryKey: exerciseKeys.all }),
            )
            .on(
                "postgres_changes",
                { event: "DELETE", schema: "public", table: "exercises" },
                () => queryClient.invalidateQueries({ queryKey: exerciseKeys.all }),
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [queryClient]);

    return setupSubscription;
}
