import { describe, expect, it } from "vitest";
import {
  incrementPostCommentsInPage,
  prependPostToPage,
  removePostFromPage,
  updatePostLikeInPage,
} from "@/hooks/use-feed";
import type { PaginatedResponse, PostWithAuthor } from "@/shared/types";

const basePost: PostWithAuthor = {
  id: "post-1",
  author_id: "user-1",
  content: "Training note",
  post_type: "general",
  media_urls: [],
  exercise_id: null,
  likes_count: 2,
  comments_count: 1,
  shares_count: 0,
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

function pageWith(items: PostWithAuthor[]): PaginatedResponse<PostWithAuthor> {
  return {
    items,
    total: items.length,
    page: 1,
    pageSize: 20,
    totalPages: 1,
  };
}

describe("feed cache state helpers", () => {
  it("prepends a created post and updates totals", () => {
    const post = { ...basePost, id: "post-2" };
    const result = prependPostToPage(pageWith([basePost]), post);

    expect(result?.items.map((item) => item.id)).toEqual(["post-2", "post-1"]);
    expect(result?.total).toBe(2);
    expect(result?.totalPages).toBe(1);
  });

  it("optimistically toggles a post like", () => {
    const result = updatePostLikeInPage(pageWith([basePost]), "post-1", false);

    expect(result?.items[0].isLikedByMe).toBe(true);
    expect(result?.items[0].likes_count).toBe(3);
  });

  it("uses the server like count when settling", () => {
    const likedPost = { ...basePost, isLikedByMe: true, likes_count: 3 };
    const result = updatePostLikeInPage(
      pageWith([likedPost]),
      "post-1",
      true,
      { likes_count: 7 },
    );

    expect(result?.items[0].isLikedByMe).toBe(false);
    expect(result?.items[0].likes_count).toBe(7);
  });

  it("increments comments without changing unrelated posts", () => {
    const otherPost = { ...basePost, id: "post-2", comments_count: 4 };
    const result = incrementPostCommentsInPage(
      pageWith([basePost, otherPost]),
      "post-1",
    );

    expect(result?.items[0].comments_count).toBe(2);
    expect(result?.items[1].comments_count).toBe(4);
  });

  it("removes a deleted post and updates totals", () => {
    const result = removePostFromPage(pageWith([basePost]), "post-1");

    expect(result?.items).toHaveLength(0);
    expect(result?.total).toBe(0);
    expect(result?.totalPages).toBe(0);
  });
});
