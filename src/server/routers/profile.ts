import { z } from 'zod';
import { router, publicProcedure, protectedProcedure, clubProcedure } from '../trpc';
import {
    updateProfileSchema,
    createClubProfileSchema,
    updateClubProfileSchema,
    addClubMemberSchema,
    uuidSchema,
} from '../../shared/validators';
import { TRPCError } from '@trpc/server';
import type { Profile, ClubProfile, ClubMember } from '../../shared/types';

// Placeholder database functions (to be implemented with Supabase)
const db = {
    getProfileById: async (id: string): Promise<Profile | null> => {
        console.log('getProfileById:', { id });
        return null;
    },
    getProfileByUsername: async (username: string): Promise<Profile | null> => {
        console.log('getProfileByUsername:', { username });
        return null;
    },
    updateProfile: async (id: string, data: Partial<Profile>): Promise<Profile> => {
        console.log('updateProfile:', { id, data });
        return { ...data, id } as Profile;
    },
    incrementProfileViews: async (id: string): Promise<void> => {
        console.log('incrementProfileViews:', { id });
    },
    getClubProfile: async (id: string): Promise<ClubProfile | null> => {
        console.log('getClubProfile:', { id });
        return null;
    },
    createClubProfile: async (data: Partial<ClubProfile>): Promise<ClubProfile> => {
        console.log('createClubProfile:', { data });
        return { ...data, id: 'mock-id' } as ClubProfile;
    },
    updateClubProfile: async (id: string, data: Partial<ClubProfile>): Promise<ClubProfile> => {
        console.log('updateClubProfile:', { id, data });
        return { ...data, id } as ClubProfile;
    },
    getClubMembers: async (clubId: string): Promise<(ClubMember & { profile: Profile })[]> => {
        console.log('getClubMembers:', { clubId });
        return [];
    },
    addClubMember: async (data: Partial<ClubMember>): Promise<ClubMember> => {
        console.log('addClubMember:', { data });
        return { ...data, id: 'mock-id' } as ClubMember;
    },
    removeClubMember: async (clubId: string, userId: string): Promise<void> => {
        console.log('removeClubMember:', { clubId, userId });
    },
};

export const profileRouter = router({
    // Get profile by ID
    getById: publicProcedure
        .input(uuidSchema)
        .query(async ({ input }) => {
            const profile = await db.getProfileById(input);

            if (!profile) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Profile not found',
                });
            }

            // Increment view count
            await db.incrementProfileViews(input);

            return profile;
        }),

    // Get profile by username
    getByUsername: publicProcedure
        .input(z.string())
        .query(async ({ input }) => {
            const profile = await db.getProfileByUsername(input);

            if (!profile) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Profile not found',
                });
            }

            return profile;
        }),

    // Get own profile
    getMe: protectedProcedure
        .query(async ({ ctx }) => {
            return ctx.profile;
        }),

    // Update own profile
    update: protectedProcedure
        .input(updateProfileSchema)
        .mutation(async ({ ctx, input }) => {
            if (!ctx.profile) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Profile not found',
                });
            }

            const updatedProfile = await db.updateProfile(ctx.profile.id, input);
            return updatedProfile;
        }),

    // Increment profile views
    incrementViews: publicProcedure
        .input(uuidSchema)
        .mutation(async ({ input }) => {
            await db.incrementProfileViews(input);
            return { success: true };
        }),

    // Get club profile
    getClubProfile: publicProcedure
        .input(uuidSchema)
        .query(async ({ input }) => {
            const clubProfile = await db.getClubProfile(input);

            if (!clubProfile) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Club profile not found',
                });
            }

            return clubProfile;
        }),

    // Create club profile
    createClubProfile: protectedProcedure
        .input(createClubProfileSchema)
        .mutation(async ({ ctx, input }) => {
            if (ctx.profile?.user_type !== 'club') {
                throw new TRPCError({
                    code: 'FORBIDDEN',
                    message: 'Only club accounts can create club profiles',
                });
            }

            const clubProfile = await db.createClubProfile({
                ...input,
                id: ctx.profile.id,
            });

            return clubProfile;
        }),

    // Update club profile
    updateClubProfile: clubProcedure
        .input(updateClubProfileSchema)
        .mutation(async ({ ctx, input }) => {
            if (!ctx.profile) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Profile not found',
                });
            }

            const clubProfile = await db.updateClubProfile(ctx.profile.id, input);
            return clubProfile;
        }),

    // Get club members
    getClubMembers: publicProcedure
        .input(uuidSchema)
        .query(async ({ input }) => {
            const members = await db.getClubMembers(input);
            return members;
        }),

    // Add club member
    addClubMember: clubProcedure
        .input(addClubMemberSchema)
        .mutation(async ({ ctx, input }) => {
            if (!ctx.profile) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Profile not found',
                });
            }

            const member = await db.addClubMember({
                ...input,
                club_id: ctx.profile.id,
            });

            return member;
        }),

    // Remove club member
    removeClubMember: clubProcedure
        .input(addClubMemberSchema.pick({ user_id: true }))
        .mutation(async ({ ctx, input }) => {
            if (!ctx.profile) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Profile not found',
                });
            }

            await db.removeClubMember(ctx.profile.id, input.user_id);
            return { success: true };
        }),
});