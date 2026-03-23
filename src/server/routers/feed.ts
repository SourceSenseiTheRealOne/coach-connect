import { router, publicProcedure, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { posts } from '../db';
import {
    uuidSchema,
    listPostsSchema,
    createPostSchema,
    updatePostSchema,
    createCommentSchema,
} from '../../shared/validators';

export const feedRouter = router({
    // List posts
    list: publicProcedure
        .input(listPostsSchema)
        .query(async ({ input }) => {
            return posts.list({
                ...input,
                page: input.page ?? 1,
                pageSize: input.pageSize ?? 20,
            });
        }),

    // Get post by ID
    getById: publicProcedure
        .input(uuidSchema)
        .query(async ({ input }) => {
            const post = await posts.getById(input);
            if (!post) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Post not found' });
            }
            return post;
        }),

    // Create post
    create: protectedProcedure
        .input(createPostSchema)
        .mutation(async ({ ctx, input }) => {
            const post = await posts.create({
                ...input,
                author_id: ctx.user!.id,
                likes_count: 0,
                comments_count: 0,
                shares_count: 0,
                media_urls: (input.media_urls ?? []) as Array<{ url: string; type: string; caption?: string }>,
            });
            if (!post) {
                throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to create post' });
            }
            return post;
        }),

    // Update post
    update: protectedProcedure
        .input(updatePostSchema.extend({ id: uuidSchema }))
        .mutation(async ({ ctx, input }) => {
            const { id, ...updates } = input;

            const existing = await posts.getById(id);
            if (!existing) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Post not found' });
            }
            if (existing.author_id !== ctx.user!.id) {
                throw new TRPCError({ code: 'FORBIDDEN', message: 'You can only edit your own posts' });
            }

            const post = await posts.update(id, {
                ...updates,
                media_urls: updates.media_urls as Array<{ url: string; type: string; caption?: string }> | undefined,
            });
            if (!post) {
                throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to update post' });
            }
            return post;
        }),

    // Delete post
    delete: protectedProcedure
        .input(uuidSchema)
        .mutation(async ({ ctx, input }) => {
            const existing = await posts.getById(input);
            if (!existing) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Post not found' });
            }
            if (existing.author_id !== ctx.user!.id) {
                throw new TRPCError({ code: 'FORBIDDEN', message: 'You can only delete your own posts' });
            }

            const success = await posts.delete(input);
            if (!success) {
                throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to delete post' });
            }
            return { success: true };
        }),

    // Get comments
    getComments: publicProcedure
        .input(uuidSchema)
        .query(async ({ input }) => {
            return posts.getComments(input);
        }),

    // Create comment
    createComment: protectedProcedure
        .input(createCommentSchema)
        .mutation(async ({ ctx, input }) => {
            const comment = await posts.createComment({
                ...input,
                author_id: ctx.user!.id,
            });
            if (!comment) {
                throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to create comment' });
            }
            return comment;
        }),

    // Check if liked
    isLiked: protectedProcedure
        .input(uuidSchema)
        .query(async ({ ctx, input }) => {
            return posts.isLiked(ctx.user!.id, input);
        }),

    // Toggle like
    toggleLike: protectedProcedure
        .input(uuidSchema)
        .mutation(async ({ ctx, input }) => {
            const isLiked = await posts.isLiked(ctx.user!.id, input);
            if (isLiked) {
                await posts.unlike(ctx.user!.id, input);
            } else {
                await posts.like(ctx.user!.id, input);
            }
            return { liked: !isLiked };
        }),
});