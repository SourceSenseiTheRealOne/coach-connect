import { z } from 'zod';
import { router, publicProcedure, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { profiles, connections } from '../db';
import { uuidSchema, updateProfileSchema, updateClubProfileSchema } from '../../shared/validators';

export const profileRouter = router({
    // Get profile by ID
    getById: publicProcedure
        .input(uuidSchema)
        .query(async ({ input }) => {
            const profile = await profiles.getById(input);
            if (!profile) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Profile not found' });
            }
            return profile;
        }),

    // Get profile by username
    getByUsername: publicProcedure
        .input(z.string().min(1))
        .query(async ({ input }) => {
            const profile = await profiles.getByUsername(input);
            if (!profile) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Profile not found' });
            }
            return profile;
        }),

    // Update own profile
    update: protectedProcedure
        .input(updateProfileSchema)
        .mutation(async ({ ctx, input }) => {
            const profile = await profiles.update(ctx.user!.id, input);
            if (!profile) {
                throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to update profile' });
            }
            return profile;
        }),

    // Update club profile
    updateClubProfile: protectedProcedure
        .input(updateClubProfileSchema)
        .mutation(async ({ ctx, input }) => {
            // Check if user is a club
            const currentProfile = await profiles.getById(ctx.user!.id);
            if (!currentProfile || currentProfile.user_type !== 'club') {
                throw new TRPCError({ code: 'FORBIDDEN', message: 'Only club accounts can update club profiles' });
            }

            const profile = await profiles.update(ctx.user!.id, input as Partial<import('../../shared/types').Profile>);
            if (!profile) {
                throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to update club profile' });
            }
            return profile;
        }),

    // Search profiles
    search: publicProcedure
        .input(z.object({ query: z.string().min(1), limit: z.number().min(1).max(50).optional() }))
        .query(async ({ input }) => {
            return profiles.search(input.query, input.limit || 20);
        }),

    // Get current user's profile
    me: protectedProcedure
        .query(async ({ ctx }) => {
            const profile = await profiles.getById(ctx.user!.id);
            if (!profile) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Profile not found' });
            }
            return profile;
        }),

    // Get follow counts
    getFollowCounts: publicProcedure
        .input(uuidSchema)
        .query(async ({ input }) => {
            return connections.getFollowCounts(input);
        }),

    // Check if following
    isFollowing: protectedProcedure
        .input(uuidSchema)
        .query(async ({ ctx, input }) => {
            return connections.isFollowing(ctx.user!.id, input);
        }),
});