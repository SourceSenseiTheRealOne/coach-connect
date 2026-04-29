import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import JobsPage from "./JobsPage";

// Mock the tRPC hooks
vi.mock("@/hooks/use-jobs", () => ({
  useJobs: () => ({
    data: {
      items: [
        {
          id: "1",
          title: "Head Coach — U17 Team",
          job_type: "head_coach",
          age_group: "U17",
          location: "Lisboa",
          salary_range: "€2,500-3,500/mo",
          applications_count: 23,
          created_at: "2024-01-15T00:00:00Z",
        },
        {
          id: "2",
          title: "Assistant Coach — Senior Team",
          job_type: "assistant_coach",
          age_group: "Senior",
          location: "Braga",
          salary_range: "€1,800-2,500/mo",
          applications_count: 45,
          created_at: "2024-01-10T00:00:00Z",
        },
      ],
    },
    isLoading: false,
    error: null,
  }),
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

describe("JobsPage", () => {
  it("renders job listings", () => {
    render(
      <QueryClientProvider client={queryClient}>
        <JobsPage />
      </QueryClientProvider>,
    );

    expect(screen.getByText("Job Board")).toBeInTheDocument();
    expect(screen.getByText("Head Coach — U17 Team")).toBeInTheDocument();
    expect(screen.getByText("Assistant Coach — Senior Team")).toBeInTheDocument();
  });

  it("displays job details", () => {
    render(
      <QueryClientProvider client={queryClient}>
        <JobsPage />
      </QueryClientProvider>,
    );

    expect(screen.getByText("Lisboa")).toBeInTheDocument();
    expect(screen.getByText("U17")).toBeInTheDocument();
    expect(screen.getByText("23 applicants")).toBeInTheDocument();
  });
});
