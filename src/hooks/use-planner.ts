import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import type { SeasonPlan, TrainingSession, Exercise } from "@/shared/types";
import { useCallback } from "react";

// ============================================================
// TYPES
// ============================================================

export interface SessionWithExercises extends TrainingSession {
    exercises: (Exercise & { session_exercise_id: string; duration_minutes: number | null; notes: string | null })[];
}

// ============================================================
// QUERY KEYS
// ============================================================

const plannerKeys = {
    all: ["planner"] as const,
    plans: () => [...plannerKeys.all, "plans"] as const,
    plan: (id: string) => [...plannerKeys.all, "plan", id] as const,
    sessions: (planId: string) => [...plannerKeys.all, "sessions", planId] as const,
    sessionExercises: (sessionId: string) => [...plannerKeys.all, "session-exercises", sessionId] as const,
};

// ============================================================
// DATE UTILITIES
// ============================================================

export function getWeekDates(offset: number = 0): Date[] {
    const now = new Date();
    const currentDay = now.getDay();
    // Get Monday of current week
    const monday = new Date(now);
    const diff = currentDay === 0 ? -6 : 1 - currentDay;
    monday.setDate(now.getDate() + diff + offset * 7);
    monday.setHours(0, 0, 0, 0);

    const dates: Date[] = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        dates.push(d);
    }
    return dates;
}

export function formatDate(date: Date): string {
    return date.toISOString().split("T")[0];
}

export function formatDisplayDate(date: Date): string {
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function formatWeekRange(dates: Date[]): string {
    if (!dates.length) return "";
    const start = dates[0];
    const end = dates[6];
    const startStr = start.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const endStr = end.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    return `${startStr} - ${endStr}`;
}

export function getWeekNumber(dates: Date[]): number {
    if (!dates.length) return 1;
    const start = dates[0];
    const startOfYear = new Date(start.getFullYear(), 0, 1);
    const diff = start.getTime() - startOfYear.getTime();
    const oneWeek = 7 * 24 * 60 * 60 * 1000;
    return Math.ceil(diff / oneWeek) + 1;
}

export function calculateDuration(startTime: string | null, endTime: string | null): string {
    if (!startTime || !endTime) return "";
    const [sh, sm] = startTime.split(":").map(Number);
    const [eh, em] = endTime.split(":").map(Number);
    const diffMinutes = (eh * 60 + em) - (sh * 60 + sm);
    if (diffMinutes <= 0) return "";
    return `${diffMinutes}min`;
}

// ============================================================
// HOOKS
// ============================================================

/**
 * Hook to fetch all season plans for the current user
 */
export function useSeasonPlans() {
    const { user } = useAuth();

    return useQuery({
        queryKey: plannerKeys.plans(),
        queryFn: async (): Promise<SeasonPlan[]> => {
            if (!user) return [];

            const { data, error } = await supabase
                .from("season_plans")
                .select("*")
                .eq("owner_id", user.id)
                .order("created_at", { ascending: false });

            if (error) {
                console.error("Error fetching season plans:", error);
                return [];
            }
            return (data || []) as SeasonPlan[];
        },
        enabled: !!user,
        staleTime: 30 * 1000,
    });
}

/**
 * Hook to fetch training sessions for a specific plan
 */
export function useTrainingSessions(planId: string | null) {
    const { user } = useAuth();

    return useQuery({
        queryKey: plannerKeys.sessions(planId || ""),
        queryFn: async (): Promise<TrainingSession[]> => {
            if (!user || !planId) return [];

            const { data, error } = await supabase
                .from("training_sessions")
                .select("*")
                .eq("plan_id", planId)
                .order("scheduled_date", { ascending: true });

            if (error) {
                console.error("Error fetching training sessions:", error);
                return [];
            }
            return (data || []) as TrainingSession[];
        },
        enabled: !!user && !!planId,
        staleTime: 30 * 1000,
    });
}

/**
 * Hook to fetch exercises for a specific training session
 */
export function useSessionExercises(sessionId: string | null, enabled: boolean = true) {
    return useQuery({
        queryKey: plannerKeys.sessionExercises(sessionId || ""),
        queryFn: async () => {
            if (!sessionId) return [];

            const { data, error } = await supabase
                .from("session_exercises")
                .select("*, exercise:exercises(*)")
                .eq("session_id", sessionId)
                .order("sort_order", { ascending: true });

            if (error) {
                console.error("Error fetching session exercises:", error);
                return [];
            }
            return (data || []).map((d: Record<string, unknown>) => ({
                ...d.exercise,
                session_exercise_id: d.id,
                duration_minutes: d.duration_minutes,
                notes: d.notes,
            }));
        },
        enabled: !!sessionId && enabled,
        staleTime: 30 * 1000,
    });
}

/**
 * Hook to create a new season plan
 */
export function useCreateSeasonPlan() {
    const queryClient = useQueryClient();
    const { user } = useAuth();

    return useMutation({
        mutationFn: async (input: {
            title: string;
            age_group: string;
            season_start: string;
            season_end: string;
            plan_type: string;
        }) => {
            if (!user) throw new Error("Must be logged in");

            const { data, error } = await supabase
                .from("season_plans")
                .insert({
                    ...input,
                    owner_id: user.id,
                })
                .select()
                .single();

            if (error) throw error;
            return data as SeasonPlan;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: plannerKeys.plans() });
        },
    });
}

/**
 * Hook to update a season plan
 */
export function useUpdateSeasonPlan() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (input: { id: string } & Partial<SeasonPlan>) => {
            const { id, ...updates } = input;
            const { data, error } = await supabase
                .from("season_plans")
                .update({ ...updates, updated_at: new Date().toISOString() })
                .eq("id", id)
                .select()
                .single();

            if (error) throw error;
            return data as SeasonPlan;
        },
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: plannerKeys.plans() });
            queryClient.invalidateQueries({ queryKey: plannerKeys.plan(variables.id) });
        },
    });
}

/**
 * Hook to delete a season plan
 */
export function useDeleteSeasonPlan() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (planId: string) => {
            const { error } = await supabase
                .from("season_plans")
                .delete()
                .eq("id", planId);

            if (error) throw error;
            return planId;
        },
        onSuccess: (planId) => {
            queryClient.invalidateQueries({ queryKey: plannerKeys.plans() });
            queryClient.invalidateQueries({ queryKey: plannerKeys.sessions(planId) });
        },
    });
}

/**
 * Hook to create a training session
 */
export function useCreateTrainingSession() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (input: {
            plan_id: string;
            title: string | null;
            scheduled_date: string;
            start_time: string | null;
            end_time: string | null;
            notes: string | null;
        }) => {
            const { data, error } = await supabase
                .from("training_sessions")
                .insert(input)
                .select()
                .single();

            if (error) throw error;
            return data as TrainingSession;
        },
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: plannerKeys.sessions(variables.plan_id) });
        },
    });
}

/**
 * Hook to update a training session
 */
export function useUpdateTrainingSession() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, plan_id, ...updates }: { id: string; plan_id: string } & Partial<TrainingSession>) => {
            const { data, error } = await supabase
                .from("training_sessions")
                .update(updates)
                .eq("id", id)
                .select()
                .single();

            if (error) throw error;
            return data as TrainingSession;
        },
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: plannerKeys.sessions(variables.plan_id) });
        },
    });
}

/**
 * Hook to delete a training session
 */
export function useDeleteTrainingSession() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ sessionId, planId }: { sessionId: string; planId: string }) => {
            const { error } = await supabase
                .from("training_sessions")
                .delete()
                .eq("id", sessionId);

            if (error) throw error;
            return { sessionId, planId };
        },
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: plannerKeys.sessions(variables.planId) });
        },
    });
}

/**
 * Hook to add an exercise to a training session
 */
export function useAddExerciseToSession() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (input: {
            session_id: string;
            exercise_id: string;
            sort_order?: number;
            duration_minutes?: number | null;
            notes?: string | null;
        }) => {
            const { data, error } = await supabase
                .from("session_exercises")
                .insert(input)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: plannerKeys.sessionExercises(variables.session_id) });
        },
    });
}

/**
 * Hook to remove an exercise from a training session
 */
export function useRemoveExerciseFromSession() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ sessionExerciseId, sessionId }: { sessionExerciseId: string; sessionId: string }) => {
            const { error } = await supabase
                .from("session_exercises")
                .delete()
                .eq("id", sessionExerciseId);

            if (error) throw error;
            return { sessionExerciseId, sessionId };
        },
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: plannerKeys.sessionExercises(variables.sessionId) });
        },
    });
}

/**
 * Real-time subscription for planner changes
 */
export function usePlannerRealtime() {
    const queryClient = useQueryClient();

    const setupSubscription = useCallback(() => {
        const channel = supabase
            .channel("planner-realtime")
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "season_plans" },
                () => {
                    queryClient.invalidateQueries({ queryKey: plannerKeys.plans() });
                }
            )
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "training_sessions" },
                () => {
                    queryClient.invalidateQueries({ queryKey: plannerKeys.all });
                }
            )
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "session_exercises" },
                () => {
                    queryClient.invalidateQueries({ queryKey: plannerKeys.all });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [queryClient]);

    return setupSubscription;
}