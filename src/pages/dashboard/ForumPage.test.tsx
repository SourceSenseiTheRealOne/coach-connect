import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ForumPage from "./ForumPage";

// Mock the tRPC hooks
vi.mock("@/hooks/use-forum", () => ({
  useForumCategories: () => ({
    data: [
      {
        id: "1",
        name: "Tactical Discussions",
        slug: "tactical",
        description: "Discuss tactical formations and strategies",
        sort_order: 1,
      },
      {
        id: "2",
        name: "Training Methods",
        slug: "training",
        description: "Share training drills and exercises",
        sort_order: 2,
      },
    ],
    isLoading: false,
  }),
  useForumThreads: () => ({
    data: {
      items: [
        {
          id: "1",
          title: "Best pressing systems for U14s?",
          author_id: "user-123",
          category_id: "cat-1",
          is_pinned: true,
          is_locked: false,
          views_count: 567,
          replies_count: 34,
          created_at: "2024-01-15T00:00:00Z",
        },
        {
          id: "2",
          title: "How to handle parents who interfere",
          author_id: "user-456",
          category_id: "cat-2",
          is_pinned: false,
          is_locked: false,
          views_count: 1234,
          replies_count: 89,
          created_at: "2024-01-10T00:00:00Z",
        },
      ],
    },
    isLoading: false,
  }),
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

describe("ForumPage", () => {
  it("renders forum categories", () => {
    render(
      <QueryClientProvider client={queryClient}>
        <ForumPage />
      </QueryClientProvider>,
    );

    expect(screen.getByText("Forum")).toBeInTheDocument();
    expect(screen.getByText("Tactical Discussions")).toBeInTheDocument();
    expect(screen.getByText("Training Methods")).toBeInTheDocument();
  });

  it("renders recent threads", () => {
    render(
      <QueryClientProvider client={queryClient}>
        <ForumPage />
      </QueryClientProvider>,
    );

    expect(screen.getByText("Best pressing systems for U14s?")).toBeInTheDocument();
    expect(screen.getByText("How to handle parents who interfere")).toBeInTheDocument();
    expect(screen.getByText("34")).toBeInTheDocument(); // replies count
    expect(screen.getByText("567")).toBeInTheDocument(); // views count
  });
});
