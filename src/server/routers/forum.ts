import { router, publicProcedure, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { forum } from '../db';
import {
    uuidSchema,
    listThreadsSchema,
    createForumThreadSchema,
    createForumReplySchema,
    moderateThreadSchema,
} from '../../shared/validators';

export const forumRouter = router({
    // Categories
    getCategories: publicProcedure
        .query(async () => {
            return forum.getCategories();
        }),

    // Threads
    listThreads: publicProcedure
        .input(listThreadsSchema)
        .query(async ({ input }) => {
            return forum.getThreads({
                ...input,
                page: input.page ?? 1,
                pageSize: input.pageSize ?? 20,
            });
        }),

    getThreadById: publicProcedure
        .input(uuidSchema)
        .query(async ({ input }) => {
            const thread = await forum.getThreadById(input);
            if (!thread) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Thread not found' });
            }
            return thread;
        }),

    createThread: protectedProcedure
        .input(createForumThreadSchema)
        .mutation(async ({ ctx, input }) => {
            const thread = await forum.createThread({
                ...input,
                author_id: ctx.user!.id,
                is_pinned: false,
                is_locked: false,
                views_count: 0,
                replies_count: 0,
            });
            if (!thread) {
                throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to create thread' });
            }
            return thread;
        }),

    updateThread: protectedProcedure
        .input(createForumThreadSchema.extend({ id: uuidSchema }))
        .mutation(async ({ ctx, input }) => {
            const { id, ...updates } = input;

            const existing = await forum.getThreadById(id);
            if (!existing) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Thread not found' });
            }
            if (existing.author_id !== ctx.user!.id) {
                throw new TRPCError({ code: 'FORBIDDEN', message: 'You can only edit your own threads' });
            }

            const thread = await forum.updateThread(id, updates);
            if (!thread) {
                throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to update thread' });
            }
            return thread;
        }),

    moderateThread: protectedProcedure
        .input(moderateThreadSchema)
        .mutation(async ({ input }) => {
            const { thread_id, ...updates } = input;
            const thread = await forum.updateThread(thread_id, updates);
            if (!thread) {
                throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to moderate thread' });
            }
            return thread;
        }),

    // Replies
    getReplies: publicProcedure
        .input(uuidSchema)
        .query(async ({ input }) => {
            return forum.getReplies(input);
        }),

    createReply: protectedProcedure
        .input(createForumReplySchema)
        .mutation(async ({ ctx, input }) => {
            const reply = await forum.createReply({
                ...input,
                author_id: ctx.user!.id,
            });
            if (!reply) {
                throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to create reply' });
            }
            return reply;
        }),
});