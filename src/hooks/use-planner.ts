import { trpc } from "@/lib/trpc";
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

    return trpc.planner.getSeasonPlans.useQuery(undefined, {
        enabled: !!user,
        staleTime: 30 * 1000,
    });
}

/**
 * Hook to fetch training sessions for a specific plan
 */
export function useTrainingSessions(planId: string | null) {
    const { user } = useAuth();

    return trpc.planner.getTrainingSessions.useQuery(planId || "", {
        enabled: !!user && !!planId,
        staleTime: 30 * 1000,
    });
}

/**
 * Hook to fetch exercises for a specific training session
 */
export function useSessionExercises(sessionId: string | null, enabled: boolean = true) {
    return trpc.planner.getSessionExercises.useQuery(sessionId || "", {
        enabled: !!sessionId && enabled,
        staleTime: 30 * 1000,
    });
}

/**
 * Hook to create a new season plan
 */
export function useCreateSeasonPlan() {
    const utils = trpc.useUtils();

    return trpc.planner.createSeasonPlan.useMutation({
        onSuccess: () => {
            utils.planner.getSeasonPlans.invalidate();
        },
    });
}

/**
 * Hook to update a season plan
 */
export function useUpdateSeasonPlan() {
    const utils = trpc.useUtils();

    return trpc.planner.updateSeasonPlan.useMutation({
        onSuccess: () => {
            utils.planner.getSeasonPlans.invalidate();
        },
    });
}

/**
 * Hook to delete a season plan
 */
export function useDeleteSeasonPlan() {
    const utils = trpc.useUtils();

    return trpc.planner.deleteSeasonPlan.useMutation({
        onSuccess: (_data, planId) => {
            utils.planner.getSeasonPlans.invalidate();
            if (planId) {
                utils.planner.getTrainingSessions.invalidate(planId);
            }
        },
    });
}

/**
 * Hook to create a training session
 */
export function useCreateTrainingSession() {
    const utils = trpc.useUtils();

    return trpc.planner.createTrainingSession.useMutation({
        onSuccess: (data) => {
            utils.planner.getTrainingSessions.invalidate(data.plan_id);
        },
    });
}

/**
 * Hook to update a training session
 */
export function useUpdateTrainingSession() {
    const utils = trpc.useUtils();

    return trpc.planner.updateTrainingSession.useMutation({
        onSuccess: (data) => {
            utils.planner.getTrainingSessions.invalidate(data.plan_id);
        },
    });
}

/**
 * Hook to delete a training session
 */
export function useDeleteTrainingSession() {
    const utils = trpc.useUtils();

    return trpc.planner.deleteTrainingSession.useMutation({
        onSuccess: () => {
            utils.planner.invalidate();
        },
    });
}

/**
 * Hook to add an exercise to a training session
 */
export function useAddExerciseToSession() {
    const utils = trpc.useUtils();

    return trpc.planner.addExerciseToSession.useMutation({
        onSuccess: (data) => {
            utils.planner.getSessionExercises.invalidate(data.session_id);
        },
    });
}

/**
 * Hook to remove an exercise from a training session
 */
export function useRemoveExerciseFromSession() {
    const utils = trpc.useUtils();

    return trpc.planner.removeExerciseFromSession.useMutation({
        onSuccess: () => {
            utils.planner.invalidate();
        },
    });
}

/**
 * Real-time subscription for planner changes
 */
export function usePlannerRealtime() {
    const utils = trpc.useUtils();

    const setupSubscription = useCallback(() => {
        const channel = supabase
            .channel("planner-realtime")
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "season_plans" },
                () => {
                    utils.planner.getSeasonPlans.invalidate();
                }
            )
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "training_sessions" },
                () => {
                    utils.planner.invalidate();
                }
            )
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "session_exercises" },
                () => {
                    utils.planner.invalidate();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [utils]);

    return setupSubscription;
}
