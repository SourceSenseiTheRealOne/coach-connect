import { router, publicProcedure, protectedProcedure, createTierProtectedProcedure } from '../trpc';
import {
    listExercisesSchema,
    createExerciseSchema,
    updateExerciseSchema,
    createExerciseReviewSchema,
    uuidSchema,
} from '../../shared/validators';
import { TRPCError } from '@trpc/server';
import type { Exercise, ExerciseReview, PaginatedResponse } from '../../shared/types';

// Premium exercise access procedure
const premiumExerciseProcedure = createTierProtectedProcedure(['premium_coach', 'pro_service', 'club_license']);

// Placeholder database functions
const db = {
    listExercises: async (params: {
        page: number;
        pageSize: number;
        category?: string;
        age_group?: string;
        difficulty?: string;
        search?: string;
        author_id?: string;
        is_premium?: boolean;
        userId?: string;
    }): Promise<PaginatedResponse<Exercise>> => {
        console.log('listExercises:', params);
        return { items: [], total: 0, page: 1, pageSize: 20, totalPages: 0 };
    },
    getExerciseById: async (id: string): Promise<Exercise | null> => {
        console.log('getExerciseById:', { id });
        return null;
    },
    createExercise: async (data: Partial<Exercise>): Promise<Exercise> => {
        console.log('createExercise:', { data });
        return { ...data, id: 'mock-id' } as Exercise;
    },
    updateExercise: async (id: string, data: Partial<Exercise>): Promise<Exercise> => {
        console.log('updateExercise:', { id, data });
        return { ...data, id } as Exercise;
    },
    deleteExercise: async (id: string): Promise<void> => {
        console.log('deleteExercise:', { id });
    },
    likeExercise: async (userId: string, exerciseId: string): Promise<boolean> => {
        console.log('likeExercise:', { userId, exerciseId });
        return true;
    },
    unlikeExercise: async (userId: string, exerciseId: string): Promise<void> => {
        console.log('unlikeExercise:', { userId, exerciseId });
    },
    isExerciseLiked: async (userId: string, exerciseId: string): Promise<boolean> => {
        console.log('isExerciseLiked:', { userId, exerciseId });
        return false;
    },
    createReview: async (data: Partial<ExerciseReview>): Promise<ExerciseReview> => {
        console.log('createReview:', { data });
        return { ...data, id: 'mock-id' } as ExerciseReview;
    },
    getReviews: async (exerciseId: string): Promise<ExerciseReview[]> => {
        console.log('getReviews:', { exerciseId });
        return [];
    },
    getExercisesByAuthor: async (authorId: string): Promise<Exercise[]> => {
        console.log('getExercisesByAuthor:', { authorId });
        return [];
    },
};

export const exerciseRouter = router({
    // List exercises with filters
    list: publicProcedure
        .input(listExercisesSchema)
        .query(async ({ input, ctx }) => {
            const { page, pageSize, category, age_group, difficulty, search, author_id, is_premium } = input;

            // Free tier users can only see non-premium exercises
            const userTier = ctx.profile?.subscription_tier || 'free';
            const premiumFilter = userTier === 'free' ? false : is_premium;

            return db.listExercises({
                page,
                pageSize,
                category,
                age_group,
                difficulty,
                search,
                author_id,
                is_premium: premiumFilter,
                userId: ctx.user?.id,
            });
        }),

    // Get exercise by ID
    getById: publicProcedure
        .input(uuidSchema)
        .query(async ({ input, ctx }) => {
            const exercise = await db.getExerciseById(input);

            if (!exercise) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Exercise not found',
                });
            }

            // Check premium access
            if (exercise.is_premium) {
                const userTier = ctx.profile?.subscription_tier || 'free';
                if (userTier === 'free') {
                    throw new TRPCError({
                        code: 'FORBIDDEN',
                        message: 'This exercise requires a premium subscription',
                    });
                }
            }

            // Check if liked by current user
            let isLiked = false;
            if (ctx.user) {
                isLiked = await db.isExerciseLiked(ctx.user.id, input);
            }

            return { ...exercise, isLiked };
        }),

    // Create new exercise
    create: protectedProcedure
        .input(createExerciseSchema)
        .mutation(async ({ ctx, input }) => {
            // Check submission limits for free tier
            const userTier = ctx.profile?.subscription_tier || 'free';
            if (userTier === 'free') {
                // Free tier: 1 submission per year (would check count in real implementation)
                console.log('Free tier submission limit check');
            }

            const exercise = await db.createExercise({
                ...input,
                author_id: ctx.user!.id,
                status: 'pending',
                is_approved: false,
                likes_count: 0,
                views_count: 0,
            });

            return exercise;
        }),

    // Update exercise
    update: protectedProcedure
        .input(updateExerciseSchema.extend({ id: uuidSchema }))
        .mutation(async ({ ctx, input }) => {
            const { id, ...data } = input;

            const existing = await db.getExerciseById(id);
            if (!existing) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Exercise not found',
                });
            }

            if (existing.author_id !== ctx.user!.id) {
                throw new TRPCError({
                    code: 'FORBIDDEN',
                    message: 'You can only update your own exercises',
                });
            }

            const exercise = await db.updateExercise(id, data);
            return exercise;
        }),

    // Delete exercise
    delete: protectedProcedure
        .input(uuidSchema)
        .mutation(async ({ ctx, input }) => {
            const existing = await db.getExerciseById(input);
            if (!existing) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Exercise not found',
                });
            }

            if (existing.author_id !== ctx.user!.id) {
                throw new TRPCError({
                    code: 'FORBIDDEN',
                    message: 'You can only delete your own exercises',
                });
            }

            await db.deleteExercise(input);
            return { success: true };
        }),

    // Like/unlike exercise
    like: protectedProcedure
        .input(uuidSchema)
        .mutation(async ({ ctx, input }) => {
            const isLiked = await db.isExerciseLiked(ctx.user!.id, input);

            if (isLiked) {
                await db.unlikeExercise(ctx.user!.id, input);
                return { liked: false };
            } else {
                await db.likeExercise(ctx.user!.id, input);
                return { liked: true };
            }
        }),

    // Add review
    addReview: protectedProcedure
        .input(createExerciseReviewSchema)
        .mutation(async ({ ctx, input }) => {
            const review = await db.createReview({
                ...input,
                author_id: ctx.user!.id,
            });
            return review;
        }),

    // Get reviews for exercise
    getReviews: publicProcedure
        .input(uuidSchema)
        .query(async ({ input }) => {
            const reviews = await db.getReviews(input);
            return reviews;
        }),

    // Get current user's exercises
    getMyExercises: protectedProcedure
        .query(async ({ ctx }) => {
            const exercises = await db.getExercisesByAuthor(ctx.user!.id);
            return exercises;
        }),
});