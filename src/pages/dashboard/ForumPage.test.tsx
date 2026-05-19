import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import ForumPage from "./ForumPage";

const mocks = vi.hoisted(() => ({
  subscription: vi.fn(),
  auth: vi.fn(),
  createCategory: vi.fn(),
  createThread: vi.fn(),
  createReply: vi.fn(),
}));

vi.mock("@/hooks/use-forum", () => ({
  useForumCategories: () => ({
    data: [
      {
        id: "cat-1",
        name: "Tactical Discussions",
        slug: "tactical",
        description: "Discuss tactical formations and strategies",
        sort_order: 1,
      },
      {
        id: "cat-2",
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
          id: "thread-1",
          title: "Best pressing systems for U14s?",
          content: "How do you coach pressing triggers?",
          author_id: "user-123",
          category_id: "cat-1",
          is_pinned: true,
          is_locked: false,
          views_count: 567,
          replies_count: 34,
          created_at: "2024-01-15T00:00:00Z",
        },
        {
          id: "thread-2",
          title: "How to handle parents who interfere",
          content: "Looking for practical advice.",
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
  useThreadReplies: () => ({ data: [], isLoading: false }),
  useCreateForumCategory: () => ({
    mutateAsync: mocks.createCategory,
    isPending: false,
  }),
  useCreateThread: () => ({
    mutateAsync: mocks.createThread,
    isPending: false,
  }),
  useCreateReply: () => ({
    mutateAsync: mocks.createReply,
    isPending: false,
  }),
}));

vi.mock("@/hooks/use-subscription", () => ({
  useMySubscription: mocks.subscription,
}));

vi.mock("@/lib/auth-context", () => ({
  useAuth: mocks.auth,
}));

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <MemoryRouter>
      <QueryClientProvider client={queryClient}>
        <ForumPage />
      </QueryClientProvider>
    </MemoryRouter>,
  );
}

describe("ForumPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.auth.mockReturnValue({
      user: { id: "user-123" },
      profile: { id: "user-123", subscription_tier: "free" },
    });
    mocks.subscription.mockReturnValue({ data: null });
  });

  it("renders forum categories and posts", () => {
    renderPage();

    expect(screen.getByText("Forum")).toBeInTheDocument();
    expect(screen.getAllByText("Tactical Discussions").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Training Methods").length).toBeGreaterThan(0);
    expect(screen.getByText("Best pressing systems for U14s?")).toBeInTheDocument();
    expect(screen.getByText("How to handle parents who interfere")).toBeInTheDocument();
  });

  it("shows upgrade CTA for free users", () => {
    renderPage();

    expect(screen.getByRole("link", { name: /upgrade to post/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /new post/i })).not.toBeInTheDocument();
  });

  it("shows create controls for paid users", () => {
    mocks.subscription.mockReturnValue({
      data: { subscription_tier: "premium_coach", status: "active" },
    });

    renderPage();

    expect(screen.getByRole("button", { name: /new category/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /new post/i })).toBeInTheDocument();
  });
});
