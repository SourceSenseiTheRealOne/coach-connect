import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import MarketplacePage from "./MarketplacePage";

// Mock the tRPC hooks
vi.mock("@/hooks/use-marketplace", () => ({
  useMarketplaceListings: () => ({
    data: {
      items: [
        {
          id: "1",
          title: "Private 1-on-1 Training Sessions",
          description: "Personalized coaching sessions for individual players",
          service_type: "Private Training",
          service_area: "Lisboa",
          is_remote: false,
          price_cents: 4500,
          price_type: "hourly",
          seller_id: "seller-123",
          is_active: true,
          created_at: "2024-01-15T00:00:00Z",
        },
        {
          id: "2",
          title: "Professional Video Analysis",
          description: "Detailed match analysis and tactical breakdown",
          service_type: "Video Analysis",
          service_area: "Remote",
          is_remote: true,
          price_cents: 7500,
          price_type: "match",
          seller_id: "seller-456",
          is_active: true,
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

describe("MarketplacePage", () => {
  it("renders marketplace listings", () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MarketplacePage />
      </QueryClientProvider>,
    );

    expect(screen.getByText("Marketplace")).toBeInTheDocument();
    expect(screen.getByText("Private 1-on-1 Training Sessions")).toBeInTheDocument();
    expect(screen.getByText("Professional Video Analysis")).toBeInTheDocument();
  });

  it("displays listing details", () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MarketplacePage />
      </QueryClientProvider>,
    );

    expect(screen.getByText("€45.00")).toBeInTheDocument();
    expect(screen.getByText("€75.00")).toBeInTheDocument();
    expect(screen.getByText("Remote")).toBeInTheDocument();
  });
});
