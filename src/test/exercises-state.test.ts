import { describe, expect, it } from "vitest";
import { updateExerciseLikeInPage } from "@/hooks/use-exercises";
import type { ExerciseWithAuthor, PaginatedResponse } from "@/shared/types";

const baseExercise: ExerciseWithAuthor = {
  id: "exercise-1",
  author_id: "user-1",
  title: "Rondo",
  description: "Short passing drill",
  category: "rondo",
  age_group: "U12",
  difficulty: "beginner",
  image_url: null,
  animation_url: null,
  video_url: null,
  diagram_data: null,
  min_players: 5,
  max_players: 8,
  duration_minutes: 15,
  equipment: ["balls", "cones"],
  is_premium: false,
  is_approved: true,
  status: "approved",
  likes_count: 1,
  views_count: 10,
  created_at: "2026-05-14T10:00:00.000Z",
  updated_at: "2026-05-14T10:00:00.000Z",
  author: {
    id: "user-1",
    username: "coach",
    full_name: "Coach User",
    avatar_url: null,
    user_type: "coach",
    uefa_license: "B",
    is_verified: true,
    city: "Lisbon",
  },
  isLikedByMe: false,
};

function pageWith(
  items: ExerciseWithAuthor[],
): PaginatedResponse<ExerciseWithAuthor> {
  return {
    items,
    total: items.length,
    page: 1,
    pageSize: 50,
    totalPages: 1,
  };
}

describe("exercise cache state helpers", () => {
  it("optimistically likes an exercise", () => {
    const result = updateExerciseLikeInPage(
      pageWith([baseExercise]),
      "exercise-1",
      false,
    );

    expect(result?.items[0].isLikedByMe).toBe(true);
    expect(result?.items[0].likes_count).toBe(2);
  });

  it("optimistically unlikes an exercise", () => {
    const likedExercise = {
      ...baseExercise,
      isLikedByMe: true,
      likes_count: 3,
    };
    const result = updateExerciseLikeInPage(
      pageWith([likedExercise]),
      "exercise-1",
      true,
    );

    expect(result?.items[0].isLikedByMe).toBe(false);
    expect(result?.items[0].likes_count).toBe(2);
  });

  it("does not decrement likes below zero", () => {
    const likedExercise = {
      ...baseExercise,
      isLikedByMe: true,
      likes_count: 0,
    };
    const result = updateExerciseLikeInPage(
      pageWith([likedExercise]),
      "exercise-1",
      true,
    );

    expect(result?.items[0].likes_count).toBe(0);
  });

  it("leaves unrelated exercises unchanged", () => {
    const otherExercise = {
      ...baseExercise,
      id: "exercise-2",
      likes_count: 4,
    };
    const result = updateExerciseLikeInPage(
      pageWith([baseExercise, otherExercise]),
      "exercise-1",
      false,
    );

    expect(result?.items[0].likes_count).toBe(2);
    expect(result?.items[1].likes_count).toBe(4);
  });
});
