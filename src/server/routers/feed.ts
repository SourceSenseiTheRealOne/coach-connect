import { z } from 'zod';
import { router, publicProcedure, protectedProcedure } from '../trpc';
import { uuidSchema } from '../../shared/validators';
import { TRPCError } from '@trpc/server';
import type { Post, PostComment, PaginatedResponse } from '../../shared/types';

// Placeholder database functions
const db = {
    getFeed: async (params: { page?: number; pageSize?: number; userId?: string }): Promise<PaginatedResponse<Post>> => {
        console.log('getFeed:', params);
        return { items: [], total: 0, page: 1, pageSize: 20, totalPages: 0 };
    },
    getPostById: async (id: string): Promise<Post | null> => {
        console.log('getPostById:', { id });
        return null;
    },
    createPost: async (data: Partial<Post>): Promise<Post> => {
        console.log('createPost:', { data });
        return { ...data, id: 'mock-id' } as Post;
    },
    updatePost: async (id: string, data: Partial<Post>): Promise<Post> => {
        console.log('updatePost:', { id, data });
        return { ...data, id } as Post;
    },
    deletePost: async (id: string): Promise<void> => {
        console.log('deletePost:', { id });
    },
    likePost: async (userId: string, postId: string): Promise<void> => {
        console.log('likePost:', { userId, postId });
    },
    unlikePost: async (userId: string, postId: string): Promise<void> => {
        console.log('unlikePost:', { userId, postId });
    },
    isPostLiked: async (userId: string, postId: string): Promise<boolean> => {
        console.log('isPostLiked:', { userId, postId });
        return false;
    },
    getComments: async (postId: string): Promise<PostComment[]> => {
        console.log('getComments:', { postId });
        return [];
    },
    createComment: async (data: Partial<PostComment>): Promise<PostComment> => {
        console.log('createComment:', { data });
        return { ...data, id: 'mock-id' } as PostComment;
    },
    deleteComment: async (id: string, authorId: string): Promise<void> => {
        console.log('deleteComment:', { id, authorId });
    },
};

const mediaUrlSchema = z.object({ url: z.string(), type: z.string(), caption: z.string().optional() });

const createPostSchema = z.object({
    content: z.string().min(1).max(5000),
    post_type: z.enum(['general', 'match_report', 'tactical_insight', 'drill_share', 'job_share']).default('general'),
    media_urls: z.array(mediaUrlSchema).optional(),
    exercise_id: uuidSchema.optional(),
});

export const feedRouter = router({
    // Get feed
    list: publicProcedure
        .input(z.object({ page: z.number().min(1).default(1), pageSize: z.number().min(1).max(100).default(20) }))
        .query(async ({ input, ctx }) => {
            return db.getFeed({ ...input, userId: ctx.user?.id });
        }),

    // Get post by ID
    getById: publicProcedure
        .input(uuidSchema)
        .query(async ({ input }) => {
            const post = await db.getPostById(input);
            if (!post) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Post not found' });
            }
            return post;
        }),

    // Create post
    create: protectedProcedure
        .input(createPostSchema)
        .mutation(async ({ ctx, input }) => {
            return db.createPost({
                ...input,
                author_id: ctx.user!.id,
                likes_count: 0,
                comments_count: 0,
                shares_count: 0,
            } as Partial<Post>);
        }),

    // Update post
    update: protectedProcedure
        .input(z.object({ id: uuidSchema, data: createPostSchema.partial() }))
        .mutation(async ({ ctx, input }) => {
            const post = await db.getPostById(input.id);
            if (!post || post.author_id !== ctx.user!.id) {
                throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
            }
            return db.updatePost(input.id, input.data as Partial<Post>);
        }),

    // Delete post
    delete: protectedProcedure
        .input(uuidSchema)
        .mutation(async ({ ctx, input }) => {
            const post = await db.getPostById(input);
            if (!post || post.author_id !== ctx.user!.id) {
                throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
            }
            await db.deletePost(input);
            return { success: true };
        }),

    // Like/unlike post
    like: protectedProcedure
        .input(uuidSchema)
        .mutation(async ({ ctx, input }) => {
            const isLiked = await db.isPostLiked(ctx.user!.id, input);
            if (isLiked) {
                await db.unlikePost(ctx.user!.id, input);
                return { liked: false };
            } else {
                await db.likePost(ctx.user!.id, input);
                return { liked: true };
            }
        }),

    // Get comments
    getComments: publicProcedure
        .input(uuidSchema)
        .query(async ({ input }) => {
            return db.getComments(input);
        }),

    // Add comment
    addComment: protectedProcedure
        .input(z.object({ post_id: uuidSchema, content: z.string().min(1).max(2000), parent_comment_id: uuidSchema.optional() }))
        .mutation(async ({ ctx, input }) => {
            return db.createComment({
                ...input,
                author_id: ctx.user!.id,
            });
        }),

    // Delete comment
    deleteComment: protectedProcedure
        .input(uuidSchema)
        .mutation(async ({ ctx, input }) => {
            await db.deleteComment(input, ctx.user!.id);
            return { success: true };
        }),
});