import { describe, it, expect, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import MarketplacePage from "./MarketplacePage";

const mocks = vi.hoisted(() => ({
  list: vi.fn(),
  auth: vi.fn(),
  subscription: vi.fn(),
  toast: vi.fn(),
  createListing: vi.fn(),
  updateListing: vi.fn(),
  deleteListing: vi.fn(),
  createReview: vi.fn(),
  contactSeller: vi.fn(),
  payoutProfile: vi.fn(),
  upsertPayoutProfile: vi.fn(),
  createCheckout: vi.fn(),
  purchases: vi.fn(),
  sales: vi.fn(),
  adminOrders: vi.fn(),
  adminPayoutProfiles: vi.fn(),
  adminBalance: vi.fn(),
  adminUpdatePayout: vi.fn(),
}));

vi.mock("@/hooks/use-marketplace", () => ({
  useMarketplaceListings: mocks.list,
  useMarketplaceReviews: () => ({
    data: [],
    isLoading: false,
  }),
  useCreateListing: () => ({
    mutateAsync: mocks.createListing,
    isPending: false,
  }),
  useUpdateListing: () => ({
    mutateAsync: mocks.updateListing,
    isPending: false,
  }),
  useDeleteListing: () => ({
    mutateAsync: mocks.deleteListing,
    isPending: false,
  }),
  useCreateReview: () => ({
    mutateAsync: mocks.createReview,
    isPending: false,
  }),
  useContactMarketplaceSeller: () => ({
    mutateAsync: mocks.contactSeller,
    isPending: false,
  }),
  useMyPayoutProfile: mocks.payoutProfile,
  useUpsertPayoutProfile: () => ({
    mutateAsync: mocks.upsertPayoutProfile,
    isPending: false,
  }),
  useCreateMarketplaceCheckout: () => ({
    mutateAsync: mocks.createCheckout,
    isPending: false,
  }),
  useMyMarketplacePurchases: mocks.purchases,
  useMyMarketplaceSales: mocks.sales,
  useAdminMarketplaceOrders: mocks.adminOrders,
  useAdminPayoutProfiles: mocks.adminPayoutProfiles,
  useAdminMarketplaceBalance: mocks.adminBalance,
  useAdminUpdateMarketplacePayout: () => ({
    mutateAsync: mocks.adminUpdatePayout,
    isPending: false,
  }),
}));

vi.mock("@/hooks/use-subscription", () => ({
  useMySubscription: mocks.subscription,
}));

vi.mock("@/lib/auth-context", () => ({
  useAuth: mocks.auth,
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: mocks.toast }),
}));

const listings = [
  {
    id: "1",
    title: "Private 1-on-1 Training Sessions",
    description: "Personalized coaching sessions for individual players",
    service_type: "private_training",
    service_area: "Lisboa",
    is_remote: false,
    price_cents: 4500,
    price_type: "hourly",
    currency: "EUR",
    seller_id: "user-123",
    is_active: true,
    is_featured: false,
    views_count: 0,
    stripe_price_id: null,
    images: [],
    created_at: "2024-01-15T00:00:00Z",
    updated_at: "2024-01-15T00:00:00Z",
  },
  {
    id: "2",
    title: "Professional Video Analysis",
    description: "Detailed match analysis and tactical breakdown",
    service_type: "video_analysis",
    service_area: "Remote",
    is_remote: true,
    price_cents: 7500,
    price_type: "fixed",
    currency: "EUR",
    seller_id: "seller-456",
    is_active: true,
    is_featured: false,
    views_count: 0,
    stripe_price_id: null,
    images: [],
    created_at: "2024-01-10T00:00:00Z",
    updated_at: "2024-01-10T00:00:00Z",
  },
];

function renderPage() {
  return render(
    <MemoryRouter>
      <MarketplacePage />
    </MemoryRouter>,
  );
}

describe("MarketplacePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.list.mockReturnValue({
      data: {
        items: listings,
        total: listings.length,
        page: 1,
        pageSize: 50,
        totalPages: 1,
      },
      isLoading: false,
      error: null,
    });
    mocks.auth.mockReturnValue({
      user: { id: "user-123" },
      profile: { id: "user-123", subscription_tier: "free" },
    });
    mocks.subscription.mockReturnValue({ data: null });
    mocks.payoutProfile.mockReturnValue({ data: null });
    mocks.purchases.mockReturnValue({ data: [] });
    mocks.sales.mockReturnValue({ data: [] });
    mocks.adminOrders.mockReturnValue({ data: [] });
    mocks.adminPayoutProfiles.mockReturnValue({ data: [] });
    mocks.adminBalance.mockReturnValue({ data: null });
  });

  it("renders live marketplace listings", () => {
    renderPage();

    expect(screen.getByText("Marketplace")).toBeInTheDocument();
    expect(screen.getByText("Private 1-on-1 Training Sessions")).toBeInTheDocument();
    expect(screen.getByText("Professional Video Analysis")).toBeInTheDocument();
    expect(screen.getByText("2 live listings")).toBeInTheDocument();
  });

  it("displays listing details", () => {
    renderPage();

    expect(screen.getByText("EUR 45.00/hr")).toBeInTheDocument();
    expect(screen.getByText("EUR 75.00")).toBeInTheDocument();
    expect(screen.getAllByText("Remote").length).toBeGreaterThan(0);
  });

  it("locks listing creation for free users", () => {
    renderPage();

    expect(
      screen.getByRole("link", { name: /upgrade to list services/i }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /new listing/i })).not.toBeInTheDocument();
  });

  it("enables listing creation for pro service users", () => {
    mocks.subscription.mockReturnValue({
      data: { subscription_tier: "pro_service", status: "active" },
    });

    renderPage();

    expect(screen.getByRole("button", { name: /new listing/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /add payout details/i })).toBeInTheDocument();
  });

  it("sends search filters to marketplace query", async () => {
    renderPage();

    fireEvent.change(screen.getByPlaceholderText(/search services/i), {
      target: { value: "video" },
    });

    await waitFor(() => {
      expect(mocks.list).toHaveBeenLastCalledWith({
        search: "video",
        service_type: undefined,
        is_remote: undefined,
      });
    });
  });

  it("shows owner actions only for current user's listing", () => {
    renderPage();

    expect(
      screen.getByRole("button", { name: /edit private 1-on-1 training sessions/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /edit professional video analysis/i }),
    ).not.toBeInTheDocument();
  });

  it("shows contact seller for non-owner listings", () => {
    renderPage();

    fireEvent.click(screen.getByText("Professional Video Analysis"));

    expect(screen.getByRole("button", { name: /contact seller/i })).toBeInTheDocument();
  });
});
