import { describe, it, expect, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import ProfilePage from "./ProfilePage";

const mocks = vi.hoisted(() => ({
  mutateAsync: vi.fn(),
  refreshProfile: vi.fn(),
  toast: vi.fn(),
  navigate: vi.fn(),
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: mocks.toast }),
}));

vi.mock("@/lib/auth-context", () => ({
  useAuth: () => ({ refreshProfile: mocks.refreshProfile }),
}));

vi.mock("@/hooks/use-profile", () => ({
  useMyProfile: () => ({
    data: {
      id: "user-123",
      full_name: "Jose Mourinho",
      username: "josemourinho",
      user_type: "coach",
      uefa_license: "PRO",
      bio: "Experienced football coach with 15+ years in Portuguese football.",
      city: "Lisboa",
      district: "Lisboa",
      country: "Portugal",
      avatar_url: "https://example.com/avatar.jpg",
      cover_image_url: "https://example.com/cover.jpg",
      is_verified: false,
      subscription_tier: "free",
      stripe_customer_id: null,
      subscription_expires_at: null,
      profile_views: 42,
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
  useUserExerciseCount: () => ({ data: 3, isLoading: false }),
  useMyRecentExercises: () => ({
    data: [
      {
        id: "exercise-1",
        title: "Pressing rondo",
        category: "rondo",
        difficulty: "advanced",
        created_at: "2024-02-01T00:00:00Z",
      },
    ],
    isLoading: false,
  }),
  useUpdateProfile: () => ({
    mutateAsync: mocks.mutateAsync,
    isPending: false,
  }),
}));

vi.mock("react-router-dom", async () => {
  const actual =
    await vi.importActual<typeof import("react-router-dom")>(
      "react-router-dom",
    );
  return {
    ...actual,
    useNavigate: () => mocks.navigate,
  };
});

function renderProfilePage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <MemoryRouter>
      <QueryClientProvider client={queryClient}>
        <ProfilePage />
      </QueryClientProvider>
    </MemoryRouter>,
  );
}

describe("ProfilePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.mutateAsync.mockResolvedValue({});
    mocks.refreshProfile.mockResolvedValue(undefined);
  });

  it("renders real profile information and media fields", () => {
    const { container } = renderProfilePage();

    expect(screen.getByText("Jose Mourinho")).toBeInTheDocument();
    expect(screen.getAllByText("coach").length).toBeGreaterThan(0);
    expect(screen.getAllByText("PRO").length).toBeGreaterThan(0);
    expect(
      container.querySelector('img[src="https://example.com/cover.jpg"]'),
    ).toBeInTheDocument();
  });

  it("displays profile stats and recent exercises", () => {
    renderProfilePage();

    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("1234")).toBeInTheDocument();
    expect(screen.getByText("567")).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();
    expect(screen.getByText("Pressing rondo")).toBeInTheDocument();
  });

  it("displays about section", () => {
    renderProfilePage();

    expect(screen.getByText("About")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Experienced football coach with 15+ years in Portuguese football.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("Lisboa, Lisboa")).toBeInTheDocument();
  });

  it("saves edited profile through mutation and refreshes auth profile", async () => {
    renderProfilePage();

    fireEvent.click(screen.getByRole("button", { name: /edit profile/i }));
    fireEvent.change(screen.getByLabelText(/full name/i), {
      target: { value: "Jose M." },
    });
    fireEvent.change(screen.getByLabelText(/bio/i), {
      target: { value: "Updated bio" },
    });
    fireEvent.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => {
      expect(mocks.mutateAsync).toHaveBeenCalledWith({
        full_name: "Jose M.",
        bio: "Updated bio",
        city: "Lisboa",
        district: "Lisboa",
        uefa_license: "PRO",
      });
    });

    expect(mocks.refreshProfile).toHaveBeenCalled();
    expect(mocks.toast).toHaveBeenCalledWith({ title: "Profile updated" });
  });

  it("navigates to exercises from View All", () => {
    renderProfilePage();

    fireEvent.click(screen.getByRole("button", { name: /view all/i }));

    expect(mocks.navigate).toHaveBeenCalledWith("/dashboard/exercises");
  });
});
