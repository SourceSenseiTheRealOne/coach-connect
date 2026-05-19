import { useQueryClient } from "@tanstack/react-query";
import { getQueryKey } from "@trpc/react-query";
import { trpc } from "@/lib/trpc";
import { supabase } from "@/lib/supabase";
import type {
  AgeGroup,
  Difficulty,
  ExerciseCategory,
  ExerciseWithAuthor,
  PaginatedResponse,
} from "@/shared/types";
import { useCallback } from "react";

export type { ExerciseWithAuthor };

export interface ExerciseFilters {
  category: ExerciseCategory | "all";
  age_group: AgeGroup | "all";
  difficulty: Difficulty | "all";
  search: string;
  is_premium?: boolean;
}

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
  beginner: "bg-muted/60 text-muted-foreground border-border",
  intermediate: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  advanced: "bg-red-500/10 text-red-400 border-red-500/20",
};

function toExerciseListInput(filters: ExerciseFilters) {
  return {
    page: 1,
    pageSize: 50,
    ...(filters.category !== "all" ? { category: filters.category } : {}),
    ...(filters.age_group !== "all" ? { age_group: filters.age_group } : {}),
    ...(filters.difficulty !== "all" ? { difficulty: filters.difficulty } : {}),
    ...(filters.search.trim() ? { search: filters.search.trim() } : {}),
    ...(filters.is_premium !== undefined
      ? { is_premium: filters.is_premium }
      : {}),
  };
}

export function updateExerciseLikeInPage(
  page: PaginatedResponse<ExerciseWithAuthor> | undefined,
  exerciseId: string,
  isLiked: boolean,
): PaginatedResponse<ExerciseWithAuthor> | undefined {
  if (!page) return page;
  return {
    ...page,
    items: page.items.map((exercise) =>
      exercise.id === exerciseId
        ? {
            ...exercise,
            isLikedByMe: !isLiked,
            likes_count: isLiked
              ? Math.max(0, exercise.likes_count - 1)
              : exercise.likes_count + 1,
          }
        : exercise,
    ),
  };
}

export function useExercises(filters: ExerciseFilters) {
  const query = trpc.exercise.list.useQuery(toExerciseListInput(filters), {
    staleTime: 30 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
    select: (data) => data.items,
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: () => query.refetch(),
    isRefetching: query.isRefetching,
  };
}

export function useCreateExercise() {
  const utils = trpc.useUtils();
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

    utils.exercise.list.invalidate();
    return exercise;
  };

  return {
    mutateAsync,
    isPending: createMutation.isPending,
    error: createMutation.error,
    reset: createMutation.reset,
  };
}

export function useToggleExerciseLike() {
  const queryClient = useQueryClient();
  const utils = trpc.useUtils();
  const toggleMutation = trpc.exercise.toggleLike.useMutation();
  const exerciseListKey = getQueryKey(trpc.exercise.list);

  const mutate = ({
    exerciseId,
    isLiked,
  }: {
    exerciseId: string;
    isLiked: boolean;
  }) => {
    queryClient.setQueriesData<PaginatedResponse<ExerciseWithAuthor>>(
      { queryKey: exerciseListKey },
      (old) => updateExerciseLikeInPage(old, exerciseId, isLiked),
    );

    toggleMutation.mutate(exerciseId, {
      onSettled: () => {
        utils.exercise.list.invalidate();
      },
    });
  };

  return { mutate, isPending: toggleMutation.isPending };
}

export function useIncrementViews() {
  const incrementMutation = trpc.exercise.incrementViews.useMutation();
  return {
    mutateAsync: (exerciseId: string) => incrementMutation.mutateAsync(exerciseId),
  };
}

export function useDeleteExercise() {
  const utils = trpc.useUtils();
  const deleteMutation = trpc.exercise.delete.useMutation();

  return {
    mutateAsync: async (exerciseId: string) => {
      await deleteMutation.mutateAsync(exerciseId);
      utils.exercise.list.invalidate();
      return exerciseId;
    },
    isPending: deleteMutation.isPending,
  };
}

export function useExercisesRealtime() {
  const utils = trpc.useUtils();

  const setupSubscription = useCallback(() => {
    const channel = supabase
      .channel("exercises-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "exercises" },
        () => utils.exercise.list.invalidate(),
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "exercises" },
        () => utils.exercise.list.invalidate(),
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "exercises" },
        () => utils.exercise.list.invalidate(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [utils]);

  return setupSubscription;
}
