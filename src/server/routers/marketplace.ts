import { router, publicProcedure, protectedProcedure, proServiceProcedure, adminProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { marketplace, marketplaceOrders, messaging, sellerPayoutProfiles } from '../db';
import { stripeService } from '../services/stripe';
import { env } from '../config/env';
import {
    uuidSchema,
    listMarketplaceSchema,
    createMarketplaceListingSchema,
    updateMarketplaceListingSchema,
    createMarketplaceReviewSchema,
    upsertSellerPayoutProfileSchema,
    createMarketplaceCheckoutSchema,
    adminUpdateMarketplacePayoutSchema,
} from '../../shared/validators';
import type { SellerPayoutProfile } from '../../shared/types';

const PLATFORM_FEE_BASIS_POINTS = 100;

function calculatePlatformFee(amountCents: number): number {
    return Math.round((amountCents * PLATFORM_FEE_BASIS_POINTS) / 10000);
}

function maskBankReference(profile: SellerPayoutProfile) {
    return {
        user_id: profile.user_id,
        account_holder_name: profile.account_holder_name,
        payout_method: profile.payout_method,
        country: profile.country,
        currency: profile.currency,
        bank_reference_last4: profile.bank_reference_last4,
        masked_bank_reference: `****${profile.bank_reference_last4}`,
        created_at: profile.created_at,
        updated_at: profile.updated_at,
    };
}

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

    contactSeller: protectedProcedure
        .input(uuidSchema)
        .mutation(async ({ ctx, input }) => {
            const listing = await marketplace.getById(input);
            if (!listing || !listing.is_active) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Listing not found' });
            }
            if (listing.seller_id === ctx.user!.id) {
                throw new TRPCError({ code: 'FORBIDDEN', message: 'You cannot message yourself' });
            }

            const conversation = await messaging.getOrCreateDirectConversation(ctx.user!.id, listing.seller_id);
            if (!conversation) {
                throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to start conversation' });
            }
            return conversation;
        }),

    // Create
    create: proServiceProcedure
        .input(createMarketplaceListingSchema)
        .mutation(async ({ ctx, input }) => {
            const isPaidListing = input.price_type !== 'contact' && (input.price_cents ?? 0) > 0;
            if (isPaidListing) {
                const payoutProfile = await sellerPayoutProfiles.getByUser(ctx.user!.id);
                if (!payoutProfile) {
                    throw new TRPCError({
                        code: 'FORBIDDEN',
                        message: 'Add payout bank details before creating paid marketplace listings',
                    });
                }
            }

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

            const effectivePriceType = updates.price_type ?? existing.price_type;
            const effectivePriceCents = updates.price_cents ?? existing.price_cents ?? 0;
            const isPaidListing = effectivePriceType !== 'contact' && effectivePriceCents > 0;
            if (isPaidListing) {
                const payoutProfile = await sellerPayoutProfiles.getByUser(ctx.user!.id);
                if (!payoutProfile) {
                    throw new TRPCError({
                        code: 'FORBIDDEN',
                        message: 'Add payout bank details before publishing paid marketplace listings',
                    });
                }
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
            const listing = await marketplace.getById(input.listing_id);
            if (!listing) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Listing not found' });
            }
            if (listing.seller_id === ctx.user!.id) {
                throw new TRPCError({ code: 'FORBIDDEN', message: 'You cannot review your own listing' });
            }

            const existingReview = await marketplace.getReviewByReviewer(input.listing_id, ctx.user!.id);
            if (existingReview) {
                throw new TRPCError({ code: 'CONFLICT', message: 'You have already reviewed this listing' });
            }

            const review = await marketplace.createReview({
                ...input,
                reviewer_id: ctx.user!.id,
            });
            if (!review) {
                throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to create review' });
            }
            return review;
        }),

    getMyPayoutProfile: protectedProcedure
        .query(async ({ ctx }) => {
            const profile = await sellerPayoutProfiles.getByUser(ctx.user!.id);
            return profile ? maskBankReference(profile) : null;
        }),

    upsertPayoutProfile: proServiceProcedure
        .input(upsertSellerPayoutProfileSchema)
        .mutation(async ({ ctx, input }) => {
            const profile = await sellerPayoutProfiles.upsert(ctx.user!.id, input);
            if (!profile) {
                throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to save payout profile' });
            }
            return maskBankReference(profile);
        }),

    createCheckoutSession: protectedProcedure
        .input(createMarketplaceCheckoutSchema)
        .mutation(async ({ ctx, input }) => {
            const listing = await marketplace.getById(input.listing_id);
            if (!listing || !listing.is_active) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Listing not found' });
            }
            if (listing.seller_id === ctx.user!.id) {
                throw new TRPCError({ code: 'FORBIDDEN', message: 'You cannot buy your own listing' });
            }
            if (listing.price_type === 'contact' || !listing.price_cents || listing.price_cents <= 0) {
                throw new TRPCError({ code: 'BAD_REQUEST', message: 'This listing is contact-only and cannot be purchased online' });
            }

            const sellerPayoutProfile = await sellerPayoutProfiles.getByUser(listing.seller_id);
            if (!sellerPayoutProfile) {
                throw new TRPCError({ code: 'BAD_REQUEST', message: 'Seller payout details are not ready yet' });
            }

            const platformFee = calculatePlatformFee(listing.price_cents);
            const order = await marketplaceOrders.create({
                listing_id: listing.id,
                buyer_id: ctx.user!.id,
                seller_id: listing.seller_id,
                gross_amount_cents: listing.price_cents,
                platform_fee_cents: platformFee,
                seller_net_cents: listing.price_cents - platformFee,
                currency: listing.currency || 'EUR',
            });
            if (!order) {
                throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to create marketplace order' });
            }

            const session = await stripeService.createMarketplaceCheckoutSession({
                orderId: order.id,
                listingId: listing.id,
                buyerId: ctx.user!.id,
                sellerId: listing.seller_id,
                buyerEmail: ctx.user!.email,
                listingTitle: listing.title,
                amountCents: listing.price_cents,
                currency: listing.currency || 'EUR',
                successUrl: `${env.FRONTEND_URL}/marketplace/success?session_id={CHECKOUT_SESSION_ID}`,
                cancelUrl: `${env.FRONTEND_URL}/dashboard/marketplace`,
            });

            await marketplaceOrders.update(order.id, {
                stripe_checkout_session_id: session.id,
            });

            return { orderId: order.id, url: session.url };
        }),

    getMyPurchases: protectedProcedure
        .query(async ({ ctx }) => {
            return marketplaceOrders.getByBuyer(ctx.user!.id);
        }),

    getMySales: protectedProcedure
        .query(async ({ ctx }) => {
            return marketplaceOrders.getBySeller(ctx.user!.id);
        }),

    adminListOrders: adminProcedure
        .query(async () => {
            return marketplaceOrders.listForAdmin();
        }),

    adminListPayoutProfiles: adminProcedure
        .query(async () => {
            return sellerPayoutProfiles.listForAdmin();
        }),

    adminGetPlatformBalance: adminProcedure
        .query(async () => {
            return stripeService.getBalance();
        }),

    adminUpdatePayout: adminProcedure
        .input(adminUpdateMarketplacePayoutSchema)
        .mutation(async ({ input }) => {
            const updates = {
                payout_status: input.payout_status,
                payout_reference: input.payout_reference ?? null,
                admin_note: input.admin_note ?? null,
                payout_processed_at: input.payout_status === 'paid' ? new Date().toISOString() : null,
            };

            const order = await marketplaceOrders.update(input.order_id, updates);
            if (!order) {
                throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to update payout status' });
            }
            return order;
        }),
});
