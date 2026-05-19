import { router, publicProcedure, protectedProcedure, createTierProtectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { forum } from '../db';
import {
    uuidSchema,
    listThreadsSchema,
    createForumCategorySchema,
    createForumThreadSchema,
    createForumReplySchema,
    moderateThreadSchema,
} from '../../shared/validators';

// Only paid tiers can create categories or new threads.
// Free users can still view threads and post replies.
const paidTierForumProcedure = createTierProtectedProcedure([
    'premium_coach',
    'pro_service',
    'club_license',
]);

export const forumRouter = router({
    // Categories
    getCategories: publicProcedure
        .query(async () => {
            return forum.getCategories();
        }),

    createCategory: paidTierForumProcedure
        .input(createForumCategorySchema)
        .mutation(async ({ input }) => {
            const existing = await forum.getCategories();
            if (existing.some((c) => c.slug === input.slug)) {
                throw new TRPCError({ code: 'CONFLICT', message: 'A category with this slug already exists' });
            }
            const category = await forum.createCategory({
                name: input.name,
                slug: input.slug,
                description: input.description ?? null,
                sort_order: input.sort_order ?? existing.length,
            });
            if (!category) {
                throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to create category' });
            }
            return category;
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

    createThread: paidTierForumProcedure
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