import { router, protectedProcedure, publicProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { tacticBoards } from '../db';
import { uuidSchema, createTacticBoardSchema, updateTacticBoardSchema } from '../../shared/validators';

export const tacticBoardRouter = router({
    // Get all tactic boards for current user
    list: protectedProcedure
        .query(async ({ ctx }) => {
            return tacticBoards.getByOwner(ctx.user!.id);
        }),

    // Get by ID
    getById: publicProcedure
        .input(uuidSchema)
        .query(async ({ input }) => {
            const board = await tacticBoards.getById(input);
            if (!board) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Tactic board not found' });
            }
            return board;
        }),

    // Create
    create: protectedProcedure
        .input(createTacticBoardSchema)
        .mutation(async ({ ctx, input }) => {
            const board = await tacticBoards.create({
                ...input,
                owner_id: ctx.user!.id,
            });
            if (!board) {
                throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to create tactic board' });
            }
            return board;
        }),

    // Update
    update: protectedProcedure
        .input(updateTacticBoardSchema.extend({ id: uuidSchema }))
        .mutation(async ({ ctx, input }) => {
            const { id, ...updates } = input;

            const existing = await tacticBoards.getById(id);
            if (!existing) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Tactic board not found' });
            }
            if (existing.owner_id !== ctx.user!.id) {
                throw new TRPCError({ code: 'FORBIDDEN', message: 'You can only edit your own tactic boards' });
            }

            const board = await tacticBoards.update(id, updates);
            if (!board) {
                throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to update tactic board' });
            }
            return board;
        }),

    // Delete
    delete: protectedProcedure
        .input(uuidSchema)
        .mutation(async ({ ctx, input }) => {
            const existing = await tacticBoards.getById(input);
            if (!existing) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Tactic board not found' });
            }
            if (existing.owner_id !== ctx.user!.id) {
                throw new TRPCError({ code: 'FORBIDDEN', message: 'You can only delete your own tactic boards' });
            }

            const success = await tacticBoards.delete(input);
            if (!success) {
                throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to delete tactic board' });
            }
            return { success: true };
        }),

    // Duplicate
    duplicate: protectedProcedure
        .input(uuidSchema)
        .mutation(async ({ ctx, input }) => {
            const existing = await tacticBoards.getById(input);
            if (!existing) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Tactic board not found' });
            }
            if (existing.owner_id !== ctx.user!.id) {
                throw new TRPCError({ code: 'FORBIDDEN', message: 'You can only duplicate your own tactic boards' });
            }

            const board = await tacticBoards.duplicate(input, ctx.user!.id);
            if (!board) {
                throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to duplicate tactic board' });
            }
            return board;
        }),
});