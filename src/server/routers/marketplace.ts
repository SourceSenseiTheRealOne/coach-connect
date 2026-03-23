import { router, publicProcedure, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { marketplace } from '../db';
import {
    uuidSchema,
    listMarketplaceSchema,
    createMarketplaceListingSchema,
    updateMarketplaceListingSchema,
    createMarketplaceReviewSchema,
} from '../../shared/validators';

export const marketplaceRouter = router({
    // List listings
    list: publicProcedure
        .input(listMarketplaceSchema)
        .query(async ({ input }) => {
            return marketplace.list({
                ...input,
                page: input.page ?? 1,
                pageSize: input.pageSize ?? 20,
            });
        }),

    // Get by ID
    getById: publicProcedure
        .input(uuidSchema)
        .query(async ({ input }) => {
            const listing = await marketplace.getById(input);
            if (!listing) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Listing not found' });
            }
            return listing;
        }),

    // Get by seller
    getBySeller: publicProcedure
        .input(uuidSchema)
        .query(async ({ input }) => {
            return marketplace.getBySeller(input);
        }),

    // Create
    create: protectedProcedure
        .input(createMarketplaceListingSchema)
        .mutation(async ({ ctx, input }) => {
            const listing = await marketplace.create({
                ...input,
                seller_id: ctx.user!.id,
                is_active: true,
                is_featured: false,
                views_count: 0,
                images: input.images ?? [],
            });
            if (!listing) {
                throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to create listing' });
            }
            return listing;
        }),

    // Update
    update: protectedProcedure
        .input(updateMarketplaceListingSchema.extend({ id: uuidSchema }))
        .mutation(async ({ ctx, input }) => {
            const { id, ...updates } = input;

            const existing = await marketplace.getById(id);
            if (!existing) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Listing not found' });
            }
            if (existing.seller_id !== ctx.user!.id) {
                throw new TRPCError({ code: 'FORBIDDEN', message: 'You can only edit your own listings' });
            }

            const listing = await marketplace.update(id, updates);
            if (!listing) {
                throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to update listing' });
            }
            return listing;
        }),

    // Delete
    delete: protectedProcedure
        .input(uuidSchema)
        .mutation(async ({ ctx, input }) => {
            const existing = await marketplace.getById(input);
            if (!existing) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Listing not found' });
            }
            if (existing.seller_id !== ctx.user!.id) {
                throw new TRPCError({ code: 'FORBIDDEN', message: 'You can only delete your own listings' });
            }

            const success = await marketplace.delete(input);
            if (!success) {
                throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to delete listing' });
            }
            return { success: true };
        }),

    // Reviews
    getReviews: publicProcedure
        .input(uuidSchema)
        .query(async ({ input }) => {
            return marketplace.getReviews(input);
        }),

    createReview: protectedProcedure
        .input(createMarketplaceReviewSchema)
        .mutation(async ({ ctx, input }) => {
            const review = await marketplace.createReview({
                ...input,
                reviewer_id: ctx.user!.id,
            });
            if (!review) {
                throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to create review' });
            }
            return review;
        }),
});