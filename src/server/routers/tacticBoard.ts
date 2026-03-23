import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { uuidSchema } from '../../shared/validators';
import { TRPCError } from '@trpc/server';
import type { TacticBoard } from '../../shared/types';

// Local type for version
interface TacticBoardVersion {
    id: string;
    board_id: string;
    name?: string;
    data: any;
    created_at: string;
}

// Placeholder database functions
const db = {
    getBoards: async (ownerId: string): Promise<TacticBoard[]> => {
        console.log('getBoards:', { ownerId });
        return [];
    },
    getBoardById: async (id: string): Promise<TacticBoard | null> => {
        console.log('getBoardById:', { id });
        return null;
    },
    createBoard: async (data: Partial<TacticBoard>): Promise<TacticBoard> => {
        console.log('createBoard:', { data });
        return { ...data, id: 'mock-id' } as TacticBoard;
    },
    updateBoard: async (id: string, data: Partial<TacticBoard>): Promise<TacticBoard> => {
        console.log('updateBoard:', { id, data });
        return { ...data, id } as TacticBoard;
    },
    deleteBoard: async (id: string): Promise<void> => {
        console.log('deleteBoard:', { id });
    },
    duplicateBoard: async (id: string, ownerId: string): Promise<TacticBoard> => {
        console.log('duplicateBoard:', { id, ownerId });
        return { id: 'mock-id', owner_id: ownerId } as TacticBoard;
    },
    getVersions: async (boardId: string): Promise<TacticBoardVersion[]> => {
        console.log('getVersions:', { boardId });
        return [];
    },
    createVersion: async (data: Partial<TacticBoardVersion>): Promise<TacticBoardVersion> => {
        console.log('createVersion:', { data });
        return { ...data, id: 'mock-id' } as TacticBoardVersion;
    },
};

const createBoardSchema = z.object({
    title: z.string().min(1).max(255),
    board_data: z.record(z.unknown()).optional(),
    animation_data: z.record(z.unknown()).optional(),
});

const updateBoardSchema = z.object({
    title: z.string().min(1).max(255).optional(),
    board_data: z.record(z.unknown()).optional(),
    animation_data: z.record(z.unknown()).optional(),
});

export const tacticBoardRouter = router({
    // List user's tactic boards
    list: protectedProcedure
        .query(async ({ ctx }) => {
            return db.getBoards(ctx.user!.id);
        }),

    // Get board by ID
    getById: protectedProcedure
        .input(uuidSchema)
        .query(async ({ ctx, input }) => {
            const board = await db.getBoardById(input);
            if (!board) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Board not found' });
            }
            if (board.owner_id !== ctx.user!.id) {
                throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
            }
            return board;
        }),

    // Create board
    create: protectedProcedure
        .input(createBoardSchema)
        .mutation(async ({ ctx, input }) => {
            return db.createBoard({ ...input, owner_id: ctx.user!.id });
        }),

    // Update board
    update: protectedProcedure
        .input(z.object({ id: uuidSchema, data: updateBoardSchema }))
        .mutation(async ({ ctx, input }) => {
            const board = await db.getBoardById(input.id);
            if (!board || board.owner_id !== ctx.user!.id) {
                throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
            }
            return db.updateBoard(input.id, input.data);
        }),

    // Delete board
    delete: protectedProcedure
        .input(uuidSchema)
        .mutation(async ({ ctx, input }) => {
            const board = await db.getBoardById(input);
            if (!board || board.owner_id !== ctx.user!.id) {
                throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
            }
            await db.deleteBoard(input);
            return { success: true };
        }),

    // Duplicate board
    duplicate: protectedProcedure
        .input(uuidSchema)
        .mutation(async ({ ctx, input }) => {
            const board = await db.getBoardById(input);
            if (!board) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Board not found' });
            }
            return db.duplicateBoard(input, ctx.user!.id);
        }),

    // Get board versions
    getVersions: protectedProcedure
        .input(uuidSchema)
        .query(async ({ ctx, input }) => {
            const board = await db.getBoardById(input);
            if (!board || board.owner_id !== ctx.user!.id) {
                throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
            }
            return db.getVersions(input);
        }),

    // Create board version (snapshot)
    createVersion: protectedProcedure
        .input(z.object({ board_id: uuidSchema, name: z.string().optional() }))
        .mutation(async ({ ctx, input }) => {
            const board = await db.getBoardById(input.board_id);
            if (!board || board.owner_id !== ctx.user!.id) {
                throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
            }
            return db.createVersion({ ...input, board_id: input.board_id, data: board.board_data });
        }),
});