import { z } from 'zod';
import { router, publicProcedure, protectedProcedure } from '../trpc';
import { uuidSchema } from '../../shared/validators';
import { TRPCError } from '@trpc/server';
import type { ForumCategory, ForumThread, ForumReply, PaginatedResponse } from '../../shared/types';

const db = {
    getCategories: async (): Promise<ForumCategory[]> => {
        console.log('getCategories');
        return [];
    },
    getThreads: async (categoryId: string, page: number, pageSize: number): Promise<ForumThread[]> => {
        console.log('getThreads:', { categoryId, page, pageSize });
        return [];
    },
    getThreadById: async (id: string): Promise<ForumThread | null> => {
        console.log('getThreadById:', { id });
        return null;
    },
    createThread: async (data: Partial<ForumThread>): Promise<ForumThread> => {
        console.log('createThread:', { data });
        return { ...data, id: 'mock-id' } as ForumThread;
    },
    updateThread: async (id: string, data: Partial<ForumThread>): Promise<ForumThread> => {
        console.log('updateThread:', { id, data });
        return { ...data, id } as ForumThread;
    },
    deleteThread: async (id: string): Promise<void> => {
        console.log('deleteThread:', { id });
    },
    getReplies: async (threadId: string, page: number, pageSize: number): Promise<ForumReply[]> => {
        console.log('getReplies:', { threadId, page, pageSize });
        return [];
    },
    createReply: async (data: Partial<ForumReply>): Promise<ForumReply> => {
        console.log('createReply:', { data });
        return { ...data, id: 'mock-id' } as ForumReply;
    },
    deleteReply: async (id: string): Promise<void> => {
        console.log('deleteReply:', { id });
    },
    incrementThreadViews: async (id: string): Promise<void> => {
        console.log('incrementThreadViews:', { id });
    },
};

export const forumRouter = router({
    // Get all categories
    getCategories: publicProcedure
        .query(async () => {
            return db.getCategories();
        }),

    // Get threads by category
    getThreads: publicProcedure
        .input(z.object({ categoryId: uuidSchema, page: z.number().min(1).default(1), pageSize: z.number().min(1).max(100).default(20) }))
        .query(async ({ input }) => {
            return db.getThreads(input.categoryId, input.page, input.pageSize);
        }),

    // Get thread by ID
    getThread: publicProcedure
        .input(uuidSchema)
        .query(async ({ input }) => {
            const thread = await db.getThreadById(input);
            if (!thread) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Thread not found' });
            }
            await db.incrementThreadViews(input);
            return thread;
        }),

    // Create thread
    createThread: protectedProcedure
        .input(z.object({
            category_id: uuidSchema,
            title: z.string().min(1).max(255),
            content: z.string().min(1),
        }))
        .mutation(async ({ ctx, input }) => {
            return db.createThread({
                ...input,
                author_id: ctx.user!.id,
                is_pinned: false,
                is_locked: false,
                views_count: 0,
                replies_count: 0,
            });
        }),

    // Update thread
    updateThread: protectedProcedure
        .input(z.object({ id: uuidSchema, title: z.string().min(1).max(255).optional(), content: z.string().min(1).optional() }))
        .mutation(async ({ ctx, input }) => {
            const thread = await db.getThreadById(input.id);
            if (!thread || thread.author_id !== ctx.user!.id) {
                throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
            }
            const { id, ...data } = input;
            return db.updateThread(id, data);
        }),

    // Delete thread
    deleteThread: protectedProcedure
        .input(uuidSchema)
        .mutation(async ({ ctx, input }) => {
            const thread = await db.getThreadById(input);
            if (!thread || thread.author_id !== ctx.user!.id) {
                throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
            }
            await db.deleteThread(input);
            return { success: true };
        }),

    // Get replies
    getReplies: publicProcedure
        .input(z.object({ threadId: uuidSchema, page: z.number().min(1).default(1), pageSize: z.number().min(1).max(100).default(20) }))
        .query(async ({ input }) => {
            return db.getReplies(input.threadId, input.page, input.pageSize);
        }),

    // Create reply
    createReply: protectedProcedure
        .input(z.object({ thread_id: uuidSchema, content: z.string().min(1) }))
        .mutation(async ({ ctx, input }) => {
            return db.createReply({
                ...input,
                author_id: ctx.user!.id,
            });
        }),

    // Delete reply
    deleteReply: protectedProcedure
        .input(uuidSchema)
        .mutation(async ({ ctx, input }) => {
            // Would verify ownership in real implementation
            await db.deleteReply(input);
            return { success: true };
        }),
});