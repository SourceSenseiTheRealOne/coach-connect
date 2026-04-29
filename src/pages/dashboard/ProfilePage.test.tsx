import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ProfilePage from "./ProfilePage";

// Mock the tRPC hooks
vi.mock("@/hooks/use-profile", () => ({
  useMyProfile: () => ({
    data: {
      id: "user-123",
      full_name: "José Mourinho",
      username: "josemourinho",
      user_type: "Head Coach",
      uefa_license: "UEFA PRO",
      bio: "Experienced football coach with 15+ years in Portuguese football.",
      city: "Lisboa",
      district: "Lisboa",
      avatar_url: null,
      cover_image_url: null,
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-15T00:00:00Z",
    },
    isLoading: false,
    error: null,
  }),
  useFollowCounts: () => ({
    data: {
      followers: 1234,
      following: 567,
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

describe("ProfilePage", () => {
  it("renders profile information", () => {
    render(
      <QueryClientProvider client={queryClient}>
        <ProfilePage />
      </QueryClientProvider>,
    );

    expect(screen.getByText("José Mourinho")).toBeInTheDocument();
    expect(screen.getByText("Head Coach · UEFA PRO")).toBeInTheDocument();
  });

  it("displays profile stats", () => {
    render(
      <QueryClientProvider client={queryClient}>
        <ProfilePage />
      </QueryClientProvider>,
    );

    expect(screen.getByText("1234")).toBeInTheDocument(); // followers
    expect(screen.getByText("567")).toBeInTheDocument(); // following
    expect(screen.getByText("Followers")).toBeInTheDocument();
    expect(screen.getByText("Following")).toBeInTheDocument();
  });

  it("displays about section", () => {
    render(
      <QueryClientProvider client={queryClient}>
        <ProfilePage />
      </QueryClientProvider>,
    );

    expect(screen.getByText("About")).toBeInTheDocument();
    expect(screen.getByText("Experienced football coach with 15+ years in Portuguese football.")).toBeInTheDocument();
    expect(screen.getByText("Lisboa, Lisboa")).toBeInTheDocument();
  });
});
