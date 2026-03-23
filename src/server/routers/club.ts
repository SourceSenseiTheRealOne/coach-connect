import { router, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { clubs } from '../db';
import { z } from 'zod';
import { uuidSchema, createClubProfileSchema, updateClubProfileSchema, addClubMemberSchema } from '../../shared/validators';

export const clubRouter = router({
    // Get club by ID
    getById: protectedProcedure
        .input(uuidSchema)
        .query(async ({ input }) => {
            const club = await clubs.getById(input);
            if (!club) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Club not found' });
            }
            return club;
        }),

    // Create club
    create: protectedProcedure
        .input(createClubProfileSchema)
        .mutation(async ({ ctx, input }) => {
            const club = await clubs.create({
                ...input,
                max_sub_accounts: 10,
            });
            if (!club) {
                throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to create club' });
            }

            // Add creator as admin
            await clubs.addMember(club.id, ctx.user!.id, 'admin');

            return club;
        }),

    // Update club
    update: protectedProcedure
        .input(updateClubProfileSchema.extend({ id: uuidSchema }))
        .mutation(async ({ ctx, input }) => {
            const { id, ...updates } = input;

            const members = await clubs.getMembers(id);
            const userMember = members.find(m => m.user_id === ctx.user!.id && m.role === 'admin');

            if (!userMember) {
                throw new TRPCError({ code: 'FORBIDDEN', message: 'Only club admins can update the club' });
            }

            const club = await clubs.update(id, updates);
            if (!club) {
                throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to update club' });
            }
            return club;
        }),

    // Get members
    getMembers: protectedProcedure
        .input(uuidSchema)
        .query(async ({ input }) => {
            return clubs.getMembers(input);
        }),

    // Add member
    addMember: protectedProcedure
        .input(addClubMemberSchema.extend({ club_id: uuidSchema }))
        .mutation(async ({ ctx, input }) => {
            const members = await clubs.getMembers(input.club_id);
            const userMember = members.find(m => m.user_id === ctx.user!.id && m.role === 'admin');

            if (!userMember) {
                throw new TRPCError({ code: 'FORBIDDEN', message: 'Only club admins can add members' });
            }

            const member = await clubs.addMember(input.club_id, input.user_id, input.role);
            if (!member) {
                throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to add member' });
            }
            return member;
        }),

    // Remove member
    removeMember: protectedProcedure
        .input(z.object({ id: uuidSchema, user_id: uuidSchema }))
        .mutation(async ({ ctx, input }) => {
            const members = await clubs.getMembers(input.id);
            const userMember = members.find(m => m.user_id === ctx.user!.id && m.role === 'admin');

            if (!userMember) {
                throw new TRPCError({ code: 'FORBIDDEN', message: 'Only club admins can remove members' });
            }

            const success = await clubs.removeMember(input.id, input.user_id);
            if (!success) {
                throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to remove member' });
            }
            return { success: true };
        }),
});