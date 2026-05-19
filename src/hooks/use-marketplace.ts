import { trpc } from "@/lib/trpc";
import type { ServiceType } from "@/shared/types";

// ============================================================
// QUERY KEYS
// ============================================================

export const marketplaceKeys = {
    all: ["marketplace"] as const,
    listings: () => [...marketplaceKeys.all, "listings"] as const,
    listing: (id: string) => [...marketplaceKeys.all, "listing", id] as const,
    reviews: (listingId: string) => [...marketplaceKeys.all, "reviews", listingId] as const,
    payoutProfile: () => [...marketplaceKeys.all, "payout-profile"] as const,
    purchases: () => [...marketplaceKeys.all, "purchases"] as const,
    sales: () => [...marketplaceKeys.all, "sales"] as const,
    adminOrders: () => [...marketplaceKeys.all, "admin-orders"] as const,
    adminPayoutProfiles: () => [...marketplaceKeys.all, "admin-payout-profiles"] as const,
    adminBalance: () => [...marketplaceKeys.all, "admin-balance"] as const,
};

export interface MarketplaceFilters {
    service_type?: ServiceType;
    service_area?: string;
    is_remote?: boolean;
    search?: string;
}

// ============================================================
// HOOKS
// ============================================================

/**
 * Hook to fetch all marketplace listings
 */
export function useMarketplaceListings(filters: MarketplaceFilters = {}) {
    return trpc.marketplace.list.useQuery({
        page: 1,
        pageSize: 50,
        ...filters,
    }, {
        staleTime: 30 * 1000,
    });
}

/**
 * Hook to fetch a single listing by ID
 */
export function useMarketplaceListing(id: string | null) {
    return trpc.marketplace.getById.useQuery(id || "", {
        enabled: !!id,
        staleTime: 30 * 1000,
    });
}

/**
 * Hook to fetch listings by seller
 */
export function useSellerListings(sellerId: string | null) {
    return trpc.marketplace.getBySeller.useQuery(sellerId || "", {
        enabled: !!sellerId,
        staleTime: 30 * 1000,
    });
}

/**
 * Hook to fetch reviews for a listing
 */
export function useMarketplaceReviews(listingId: string | null) {
    return trpc.marketplace.getReviews.useQuery(listingId || "", {
        enabled: !!listingId,
        staleTime: 30 * 1000,
    });
}

/**
 * Hook to fetch current seller payout profile
 */
export function useMyPayoutProfile() {
    return trpc.marketplace.getMyPayoutProfile.useQuery(undefined, {
        staleTime: 30 * 1000,
    });
}

/**
 * Hook to save current seller payout profile
 */
export function useUpsertPayoutProfile() {
    const utils = trpc.useUtils();

    return trpc.marketplace.upsertPayoutProfile.useMutation({
        onSuccess: (profile) => {
            utils.marketplace.getMyPayoutProfile.setData(undefined, profile);
            utils.marketplace.getMyPayoutProfile.invalidate();
        },
    });
}

/**
 * Hook to start marketplace checkout
 */
export function useCreateMarketplaceCheckout() {
    const utils = trpc.useUtils();

    return trpc.marketplace.createCheckoutSession.useMutation({
        onSuccess: () => {
            utils.marketplace.getMyPurchases.invalidate();
        },
    });
}

/**
 * Hook to start a conversation with a marketplace seller
 */
export function useContactMarketplaceSeller() {
    const utils = trpc.useUtils();

    return trpc.marketplace.contactSeller.useMutation({
        onSuccess: () => {
            utils.messaging.getConversations.invalidate();
        },
    });
}

/**
 * Hook to fetch current user's purchases
 */
export function useMyMarketplacePurchases() {
    return trpc.marketplace.getMyPurchases.useQuery(undefined, {
        staleTime: 30 * 1000,
    });
}

/**
 * Hook to fetch current user's sales
 */
export function useMyMarketplaceSales() {
    return trpc.marketplace.getMySales.useQuery(undefined, {
        staleTime: 30 * 1000,
    });
}

/**
 * Hook to fetch admin marketplace orders
 */
export function useAdminMarketplaceOrders(enabled: boolean) {
    return trpc.marketplace.adminListOrders.useQuery(undefined, {
        enabled,
        staleTime: 30 * 1000,
    });
}

/**
 * Hook to fetch admin payout profiles
 */
export function useAdminPayoutProfiles(enabled: boolean) {
    return trpc.marketplace.adminListPayoutProfiles.useQuery(undefined, {
        enabled,
        staleTime: 30 * 1000,
    });
}

/**
 * Hook to fetch Stripe platform balance for admins
 */
export function useAdminMarketplaceBalance(enabled: boolean) {
    return trpc.marketplace.adminGetPlatformBalance.useQuery(undefined, {
        enabled,
        staleTime: 30 * 1000,
    });
}

/**
 * Hook to update manual payout status
 */
export function useAdminUpdateMarketplacePayout() {
    const utils = trpc.useUtils();

    return trpc.marketplace.adminUpdatePayout.useMutation({
        onSuccess: () => {
            utils.marketplace.adminListOrders.invalidate();
        },
    });
}

/**
 * Hook to create a new listing
 */
export function useCreateListing() {
    const utils = trpc.useUtils();

    return trpc.marketplace.create.useMutation({
        onSuccess: (data) => {
            utils.marketplace.list.invalidate();
            utils.marketplace.getBySeller.invalidate(data.seller_id);
        },
    });
}

/**
 * Hook to update a listing
 */
export function useUpdateListing() {
    const utils = trpc.useUtils();

    return trpc.marketplace.update.useMutation({
        onSuccess: (data) => {
            utils.marketplace.list.invalidate();
            utils.marketplace.getBySeller.invalidate(data.seller_id);
            utils.marketplace.getById.invalidate(data.id);
        },
    });
}

/**
 * Hook to delete a listing
 */
export function useDeleteListing() {
    const utils = trpc.useUtils();

    return trpc.marketplace.delete.useMutation({
        onSuccess: (_data, id) => {
            utils.marketplace.list.invalidate();
            utils.marketplace.getById.invalidate(id);
        },
    });
}

/**
 * Hook to create a review for a listing
 */
export function useCreateReview() {
    const utils = trpc.useUtils();

    return trpc.marketplace.createReview.useMutation({
        onSuccess: (_data, variables) => {
            if (variables && typeof variables === 'object' && 'listing_id' in variables) {
                utils.marketplace.getById.invalidate(variables.listing_id);
                utils.marketplace.getReviews.invalidate(variables.listing_id);
            }
            utils.marketplace.list.invalidate();
        },
    });
}
