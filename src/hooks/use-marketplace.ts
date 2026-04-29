import { trpc } from "@/lib/trpc";

// ============================================================
// QUERY KEYS
// ============================================================

export const marketplaceKeys = {
    all: ["marketplace"] as const,
    listings: () => [...marketplaceKeys.all, "listings"] as const,
    listing: (id: string) => [...marketplaceKeys.all, "listing", id] as const,
    reviews: (listingId: string) => [...marketplaceKeys.all, "reviews", listingId] as const,
};

// ============================================================
// HOOKS
// ============================================================

/**
 * Hook to fetch all marketplace listings
 */
export function useMarketplaceListings() {
    return trpc.marketplace.list.useQuery(undefined, {
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
 * Hook to create a new listing
 */
export function useCreateListing() {
    const utils = trpc.useUtils();

    return trpc.marketplace.create.useMutation({
        onSuccess: () => {
            utils.marketplace.list.invalidate();
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
        onSuccess: () => {
            utils.marketplace.list.invalidate();
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
            }
            utils.marketplace.list.invalidate();
        },
    });
}
