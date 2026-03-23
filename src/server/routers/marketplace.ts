import { z } from 'zod';
import { router, publicProcedure, protectedProcedure } from '../trpc';
import { uuidSchema } from '../../shared/validators';
import { TRPCError } from '@trpc/server';
import type { MarketplaceListing, MarketplaceReview, PaginatedResponse } from '../../shared/types';

const db = {
    listListings: async (params: { page?: number; pageSize?: number; service_type?: string }): Promise<PaginatedResponse<MarketplaceListing>> => {
        console.log('listListings:', params);
        return { items: [], total: 0, page: 1, pageSize: 20, totalPages: 0 };
    },
    getListingById: async (id: string): Promise<MarketplaceListing | null> => {
        console.log('getListingById:', { id });
        return null;
    },
    createListing: async (data: Partial<MarketplaceListing>): Promise<MarketplaceListing> => {
        console.log('createListing:', { data });
        return { ...data, id: 'mock-id' } as MarketplaceListing;
    },
    updateListing: async (id: string, data: Partial<MarketplaceListing>): Promise<MarketplaceListing> => {
        console.log('updateListing:', { id, data });
        return { ...data, id } as MarketplaceListing;
    },
    deleteListing: async (id: string): Promise<void> => {
        console.log('deleteListing:', { id });
    },
    getReviews: async (listingId: string): Promise<MarketplaceReview[]> => {
        console.log('getReviews:', { listingId });
        return [];
    },
    createReview: async (data: Partial<MarketplaceReview>): Promise<MarketplaceReview> => {
        console.log('createReview:', { data });
        return { ...data, id: 'mock-id' } as MarketplaceReview;
    },
    getMyListings: async (sellerId: string): Promise<MarketplaceListing[]> => {
        console.log('getMyListings:', { sellerId });
        return [];
    },
};

const createListingSchema = z.object({
    title: z.string().min(1).max(255),
    description: z.string().min(1),
    service_type: z.enum(['private_training', 'video_analysis', 'consulting', 'scouting', 'event_organizing', 'equipment', 'other']),
    price_cents: z.number().min(0).optional(),
    price_type: z.enum(['fixed', 'hourly', 'per_session', 'contact']).optional(),
    currency: z.string().default('EUR'),
    images: z.array(z.string()).optional(),
    service_area: z.string().optional(),
    is_remote: z.boolean().default(false),
});

export const marketplaceRouter = router({
    // List marketplace listings
    list: publicProcedure
        .input(z.object({ page: z.number().min(1).default(1), pageSize: z.number().min(1).max(100).default(20), service_type: z.string().optional() }))
        .query(async ({ input }) => {
            return db.listListings(input);
        }),

    // Get listing by ID
    getById: publicProcedure
        .input(uuidSchema)
        .query(async ({ input }) => {
            const listing = await db.getListingById(input);
            if (!listing) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Listing not found' });
            }
            return listing;
        }),

    // Create listing
    create: protectedProcedure
        .input(createListingSchema)
        .mutation(async ({ ctx, input }) => {
            return db.createListing({
                ...input,
                seller_id: ctx.user!.id,
                is_active: true,
                is_featured: false,
                views_count: 0,
            } as Partial<MarketplaceListing>);
        }),

    // Update listing
    update: protectedProcedure
        .input(z.object({ id: uuidSchema, data: createListingSchema.partial() }))
        .mutation(async ({ ctx, input }) => {
            const listing = await db.getListingById(input.id);
            if (!listing) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Listing not found' });
            }
            if (listing.seller_id !== ctx.user!.id) {
                throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
            }
            return db.updateListing(input.id, input.data as Partial<MarketplaceListing>);
        }),

    // Delete listing
    delete: protectedProcedure
        .input(uuidSchema)
        .mutation(async ({ ctx, input }) => {
            const listing = await db.getListingById(input);
            if (!listing) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Listing not found' });
            }
            if (listing.seller_id !== ctx.user!.id) {
                throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
            }
            await db.deleteListing(input);
            return { success: true };
        }),

    // Get reviews for listing
    getReviews: publicProcedure
        .input(uuidSchema)
        .query(async ({ input }) => {
            return db.getReviews(input);
        }),

    // Add review
    addReview: protectedProcedure
        .input(z.object({ listing_id: uuidSchema, rating: z.number().min(1).max(5), comment: z.string().optional() }))
        .mutation(async ({ ctx, input }) => {
            return db.createReview({
                ...input,
                reviewer_id: ctx.user!.id,
            });
        }),

    // Get my listings
    getMyListings: protectedProcedure
        .query(async ({ ctx }) => {
            return db.getMyListings(ctx.user!.id);
        }),
});