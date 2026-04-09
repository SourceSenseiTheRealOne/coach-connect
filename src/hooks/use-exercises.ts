import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import type { ExerciseCategory, AgeGroup, Difficulty } from "@/shared/types";
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
// FETCH EXERCISES WITH AUTHORS
// ============================================================

async function fetchExercisesWithAuthors(filters: ExerciseFilters): Promise<ExerciseWithAuthor[]> {
    let query = supabase
        .from("exercises")
        .select("*, author:profiles(*)")
        .eq("status", "approved")
        .order("likes_count", { ascending: false });

    // Apply filters
    if (filters.category && filters.category !== "all") {
        query = query.eq("category", filters.category);
    }
    if (filters.age_group && filters.age_group !== "all") {
        query = query.eq("age_group", filters.age_group);
    }
    if (filters.difficulty && filters.difficulty !== "all") {
        query = query.eq("difficulty", filters.difficulty);
    }
    if (filters.is_premium !== undefined) {
        query = query.eq("is_premium", filters.is_premium);
    }
    if (filters.search && filters.search.trim()) {
        query = query.or(`title.ilike.%${filters.search.trim()}%,description.ilike.%${filters.search.trim()}%`);
    }

    const { data, error } = await query.limit(100);

    if (error) {
        console.error("Error fetching exercises:", error);
        return [];
    }

    return (data || []) as unknown as ExerciseWithAuthor[];
}

// ============================================================
// FETCH MY LIKES FOR EXERCISES
// ============================================================

async function fetchMyExerciseLikes(userId: string, exerciseIds: string[]): Promise<Set<string>> {
    if (!exerciseIds.length) return new Set();

    const { data, error } = await supabase
        .from("exercise_likes")
        .select("exercise_id")
        .eq("user_id", userId)
        .in("exercise_id", exerciseIds);

    if (error) {
        console.error("Error fetching exercise likes:", error);
        return new Set();
    }

    return new Set((data || []).map((d) => d.exercise_id));
}

// ============================================================
// HOOKS
// ============================================================

/**
 * Hook to fetch exercises with filters
 */
export function useExercises(filters: ExerciseFilters) {
    const { user } = useAuth();

    return useQuery({
        queryKey: exerciseKeys.list(filters),
        queryFn: async () => {
            const exercises = await fetchExercisesWithAuthors(filters);

            // Fetch like status for current user
            if (user && exercises.length > 0) {
                const exerciseIds = exercises.map((e) => e.id);
                const likedIds = await fetchMyExerciseLikes(user.id, exerciseIds);
                return exercises.map((e) => ({
                    ...e,
                    isLikedByMe: likedIds.has(e.id),
                }));
            }

            return exercises;
        },
        staleTime: 30 * 1000,
    });
}

/**
 * Hook to create a new exercise
 */
export function useCreateExercise() {
    const queryClient = useQueryClient();
    const { user } = useAuth();

    return useMutation({
        mutationFn: async (exercise: {
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
            if (!user) throw new Error("Must be logged in");

            const { data, error } = await supabase
                .from("exercises")
                .insert({
                    ...exercise,
                    author_id: user.id,
                    status: "approved",
                    is_approved: true,
                    likes_count: 0,
                    views_count: 0,
                })
                .select("*, author:profiles(*)")
                .single();

            if (error) throw error;
            return data as unknown as ExerciseWithAuthor;
        },
        onSuccess: () => {
            // Invalidate all exercise list queries
            queryClient.invalidateQueries({ queryKey: exerciseKeys.all });
        },
    });
}

/**
 * Hook to toggle like on an exercise
 */
export function useToggleExerciseLike() {
    const queryClient = useQueryClient();
    const { user } = useAuth();

    return useMutation({
        mutationFn: async ({ exerciseId, isLiked }: { exerciseId: string; isLiked: boolean }) => {
            if (!user) throw new Error("Must be logged in");

            if (isLiked) {
                const { error: deleteError } = await supabase
                    .from("exercise_likes")
                    .delete()
                    .eq("user_id", user.id)
                    .eq("exercise_id", exerciseId);
                if (deleteError) throw deleteError;

                const { error: rpcError } = await supabase.rpc("decrement_exercise_likes", {
                    exercise_id: exerciseId,
                });
                if (rpcError) {
                    // Manual fallback
                    const { data: ex } = await supabase
                        .from("exercises")
                        .select("likes_count")
                        .eq("id", exerciseId)
                        .single();
                    if (ex) {
                        await supabase
                            .from("exercises")
                            .update({ likes_count: Math.max(0, (ex.likes_count || 0) - 1) })
                            .eq("id", exerciseId);
                    }
                }
            } else {
                const { error: insertError } = await supabase
                    .from("exercise_likes")
                    .insert({ user_id: user.id, exercise_id: exerciseId });
                if (insertError) throw insertError;

                const { error: rpcError } = await supabase.rpc("increment_exercise_likes", {
                    exercise_id: exerciseId,
                });
                if (rpcError) {
                    const { data: ex } = await supabase
                        .from("exercises")
                        .select("likes_count")
                        .eq("id", exerciseId)
                        .single();
                    if (ex) {
                        await supabase
                            .from("exercises")
                            .update({ likes_count: (ex.likes_count || 0) + 1 })
                            .eq("id", exerciseId);
                    }
                }
            }

            return { liked: !isLiked };
        },
        // Optimistic update
        onMutate: async ({ exerciseId, isLiked }) => {
            await queryClient.cancelQueries({ queryKey: exerciseKeys.all });
            const previousQueries = queryClient.getQueriesData({ queryKey: exerciseKeys.all });

            queryClient.setQueriesData<ExerciseWithAuthor[]>({ queryKey: exerciseKeys.all }, (old = []) =>
                old.map((e) =>
                    e.id === exerciseId
                        ? {
                            ...e,
                            isLikedByMe: !isLiked,
                            likes_count: isLiked ? e.likes_count - 1 : e.likes_count + 1,
                        }
                        : e
                )
            );

            return { previousQueries };
        },
        onError: (_err, _variables, context) => {
            if (context?.previousQueries) {
                context.previousQueries.forEach(([key, data]) => {
                    queryClient.setQueryData(key, data);
                });
            }
        },
    });
}

/**
 * Hook to increment exercise views
 */
export function useIncrementViews() {
    return useMutation({
        mutationFn: async (exerciseId: string) => {
            const { error } = await supabase.rpc("increment_exercise_views", {
                exercise_id: exerciseId,
            });
            if (error) {
                // Fallback: try manual update
                const { data: ex } = await supabase
                    .from("exercises")
                    .select("views_count")
                    .eq("id", exerciseId)
                    .single();
                if (ex) {
                    await supabase
                        .from("exercises")
                        .update({ views_count: (ex.views_count || 0) + 1 })
                        .eq("id", exerciseId);
                }
            }
        },
    });
}

/**
 * Hook to delete an exercise
 */
export function useDeleteExercise() {
    const queryClient = useQueryClient();
    const { user } = useAuth();

    return useMutation({
        mutationFn: async (exerciseId: string) => {
            if (!user) throw new Error("Must be logged in");

            const { error } = await supabase.from("exercises").delete().eq("id", exerciseId);
            if (error) throw error;
            return exerciseId;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: exerciseKeys.all });
        },
    });
}

/**
 * Real-time subscription for exercises
 */
export function useExercisesRealtime() {
    const queryClient = useQueryClient();

    const setupSubscription = useCallback(() => {
        const channel = supabase
            .channel("exercises-realtime")
            .on(
                "postgres_changes",
                { event: "INSERT", schema: "public", table: "exercises" },
                () => {
                    queryClient.invalidateQueries({ queryKey: exerciseKeys.all });
                }
            )
            .on(
                "postgres_changes",
                { event: "UPDATE", schema: "public", table: "exercises" },
                () => {
                    queryClient.invalidateQueries({ queryKey: exerciseKeys.all });
                }
            )
            .on(
                "postgres_changes",
                { event: "DELETE", schema: "public", table: "exercises" },
                () => {
                    queryClient.invalidateQueries({ queryKey: exerciseKeys.all });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [queryClient]);

    return setupSubscription;
}