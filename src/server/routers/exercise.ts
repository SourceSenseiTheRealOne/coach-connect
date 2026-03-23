import { router, publicProcedure, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { exercises, profiles } from '../db';
import {
    uuidSchema,
    listExercisesSchema,
    createExerciseSchema,
    updateExerciseSchema,
    createExerciseReviewSchema,
} from '../../shared/validators';

export const exerciseRouter = router({
    // List exercises with filters
    list: publicProcedure
        .input(listExercisesSchema)
        .query(async ({ input }) => {
            return exercises.list({
                ...input,
                page: input.page ?? 1,
                pageSize: input.pageSize ?? 20,
            });
        }),

    // Get exercise by ID
    getById: publicProcedure
        .input(uuidSchema)
        .query(async ({ input }) => {
            const exercise = await exercises.getById(input);
            if (!exercise) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Exercise not found' });
            }
            return exercise;
        }),

    // Create exercise
    create: protectedProcedure
        .input(createExerciseSchema)
        .mutation(async ({ ctx, input }) => {
            const exercise = await exercises.create({
                ...input,
                author_id: ctx.user!.id,
                is_approved: false, // Requires admin approval
                status: 'pending',
                views_count: 0,
                likes_count: 0,
            });
            if (!exercise) {
                throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to create exercise' });
            }
            return exercise;
        }),

    // Update exercise
    update: protectedProcedure
        .input(updateExerciseSchema.extend({ id: uuidSchema }))
        .mutation(async ({ ctx, input }) => {
            const { id, ...updates } = input;

            // Check ownership
            const existing = await exercises.getById(id);
            if (!existing) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Exercise not found' });
            }
            if (existing.author_id !== ctx.user!.id) {
                throw new TRPCError({ code: 'FORBIDDEN', message: 'You can only edit your own exercises' });
            }

            const exercise = await exercises.update(id, updates);
            if (!exercise) {
                throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to update exercise' });
            }
            return exercise;
        }),

    // Delete exercise
    delete: protectedProcedure
        .input(uuidSchema)
        .mutation(async ({ ctx, input }) => {
            const existing = await exercises.getById(input);
            if (!existing) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Exercise not found' });
            }
            if (existing.author_id !== ctx.user!.id) {
                throw new TRPCError({ code: 'FORBIDDEN', message: 'You can only delete your own exercises' });
            }

            const success = await exercises.delete(input);
            if (!success) {
                throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to delete exercise' });
            }
            return { success: true };
        }),

    // Increment views
    incrementViews: publicProcedure
        .input(uuidSchema)
        .mutation(async ({ input }) => {
            await exercises.incrementViews(input);
            return { success: true };
        }),

    // Check if liked
    isLiked: protectedProcedure
        .input(uuidSchema)
        .query(async ({ ctx, input }) => {
            return exercises.isLiked(ctx.user!.id, input);
        }),

    // Toggle like
    toggleLike: protectedProcedure
        .input(uuidSchema)
        .mutation(async ({ ctx, input }) => {
            const isLiked = await exercises.isLiked(ctx.user!.id, input);
            if (isLiked) {
                await exercises.unlike(ctx.user!.id, input);
            } else {
                await exercises.like(ctx.user!.id, input);
            }
            return { liked: !isLiked };
        }),

    // Get reviews
    getReviews: publicProcedure
        .input(uuidSchema)
        .query(async ({ input }) => {
            return exercises.getReviews(input);
        }),

    // Create review
    createReview: protectedProcedure
        .input(createExerciseReviewSchema)
        .mutation(async ({ ctx, input }) => {
            // Check if exercise exists
            const exercise = await exercises.getById(input.exercise_id);
            if (!exercise) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Exercise not found' });
            }

            const review = await exercises.createReview({
                ...input,
                author_id: ctx.user!.id,
            });
            if (!review) {
                throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to create review' });
            }
            return review;
        }),

    // Get exercises by author
    getByAuthor: publicProcedure
        .input(uuidSchema)
        .query(async ({ input }) => {
            return exercises.getByAuthor(input);
        }),

    // Check premium access
    checkPremiumAccess: protectedProcedure
        .input(uuidSchema)
        .query(async ({ ctx, input }) => {
            const exercise = await exercises.getById(input);
            if (!exercise) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Exercise not found' });
            }

            // If not premium, allow access
            if (!exercise.is_premium) {
                return { hasAccess: true };
            }

            // Check if user is the author
            if (exercise.author_id === ctx.user!.id) {
                return { hasAccess: true };
            }

            // Check user's subscription
            const profile = await profiles.getById(ctx.user!.id);
            if (!profile) {
                return { hasAccess: false };
            }

            const hasPremium =
                profile.subscription_tier === 'premium_coach' ||
                profile.subscription_tier === 'pro_service' ||
                profile.subscription_tier === 'club_license';

            return { hasAccess: hasPremium };
        }),
});