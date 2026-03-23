import { router, publicProcedure, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { matches } from '../db';
import { uuidSchema, listMatchesSchema, createMatchSchema, updateMatchSchema } from '../../shared/validators';

export const matchesRouter = router({
    // List matches
    list: publicProcedure
        .input(listMatchesSchema)
        .query(async ({ input }) => {
            return matches.list({
                ...input,
                page: input.page ?? 1,
                pageSize: input.pageSize ?? 20,
                is_public: input.is_public ?? true,
            });
        }),

    // Get by ID
    getById: publicProcedure
        .input(uuidSchema)
        .query(async ({ input }) => {
            const match = await matches.getById(input);
            if (!match) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Match not found' });
            }
            return match;
        }),

    // Create
    create: protectedProcedure
        .input(createMatchSchema)
        .mutation(async ({ ctx, input }) => {
            const match = await matches.create({
                ...input,
                created_by: ctx.user!.id,
                status: 'scheduled',
                home_score: null,
                away_score: null,
            });
            if (!match) {
                throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to create match' });
            }
            return match;
        }),

    // Update
    update: protectedProcedure
        .input(updateMatchSchema.extend({ id: uuidSchema }))
        .mutation(async ({ input }) => {
            const { id, ...updates } = input;
            const match = await matches.update(id, updates);
            if (!match) {
                throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to update match' });
            }
            return match;
        }),

    // Delete
    delete: protectedProcedure
        .input(uuidSchema)
        .mutation(async ({ ctx, input }) => {
            const existing = await matches.getById(input);
            if (!existing) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Match not found' });
            }
            if (existing.created_by !== ctx.user!.id) {
                throw new TRPCError({ code: 'FORBIDDEN', message: 'You can only delete matches you created' });
            }

            const success = await matches.delete(input);
            if (!success) {
                throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to delete match' });
            }
            return { success: true };
        }),
});