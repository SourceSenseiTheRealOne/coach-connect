import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import JobsPage from "./JobsPage";

const mocks = vi.hoisted(() => ({
  subscription: vi.fn(),
  auth: vi.fn(),
  createJob: vi.fn(),
  applyForJob: vi.fn(),
  contactCreator: vi.fn(),
}));

vi.mock("@/hooks/use-jobs", () => ({
  useJobs: () => ({
    data: {
      items: [
        {
          id: "job-1",
          title: "Head Coach - U17 Team",
          description: "Lead sessions and matches.",
          job_type: "head_coach",
          age_group: "U17",
          location: "Lisboa",
          salary_range: "EUR 2,500-3,500/mo",
          applications_count: 23,
          created_by_id: "creator-1",
          is_paid: true,
          created_at: "2024-01-15T00:00:00Z",
        },
        {
          id: "job-2",
          title: "Assistant Coach - Senior Team",
          description: "Support senior team staff.",
          job_type: "assistant_coach",
          age_group: "senior",
          location: "Braga",
          salary_range: "EUR 1,800-2,500/mo",
          applications_count: 45,
          created_by_id: "creator-2",
          is_paid: true,
          created_at: "2024-01-10T00:00:00Z",
        },
      ],
    },
    isLoading: false,
    error: null,
  }),
  useJob: () => ({ data: null }),
  useCreateJob: () => ({
    mutateAsync: mocks.createJob,
    isPending: false,
  }),
  useApplyForJob: () => ({
    mutateAsync: mocks.applyForJob,
    isPending: false,
  }),
  useContactJobCreator: () => ({
    mutateAsync: mocks.contactCreator,
    isPending: false,
  }),
  useMyApplication: () => ({ data: null }),
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
        <JobsPage />
      </QueryClientProvider>
    </MemoryRouter>,
  );
}

describe("JobsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.auth.mockReturnValue({
      user: { id: "user-123" },
      profile: { id: "user-123", subscription_tier: "free" },
    });
    mocks.subscription.mockReturnValue({ data: null });
  });

  it("renders job listings", () => {
    renderPage();

    expect(screen.getByText("Job Board")).toBeInTheDocument();
    expect(screen.getByText("Head Coach - U17 Team")).toBeInTheDocument();
    expect(screen.getByText("Assistant Coach - Senior Team")).toBeInTheDocument();
  });

  it("displays job details", () => {
    renderPage();

    expect(screen.getByText("Lisboa")).toBeInTheDocument();
    expect(screen.getByText("U17")).toBeInTheDocument();
    expect(screen.getByText("23 applicants")).toBeInTheDocument();
  });

  it("shows upgrade CTA for free users", () => {
    renderPage();

    expect(screen.getByRole("link", { name: /upgrade to post jobs/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /create job/i })).not.toBeInTheDocument();
  });

  it("shows create job for paid users", () => {
    mocks.subscription.mockReturnValue({
      data: { subscription_tier: "premium_coach", status: "active" },
    });

    renderPage();

    expect(screen.getByRole("button", { name: /create job/i })).toBeInTheDocument();
  });
});
