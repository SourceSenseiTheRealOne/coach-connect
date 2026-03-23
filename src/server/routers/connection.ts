import { z } from 'zod';
import { router, publicProcedure, protectedProcedure } from '../trpc';
import { uuidSchema } from '../../shared/validators';
import { TRPCError } from '@trpc/server';
import type { Connection, Profile, PaginatedResponse } from '../../shared/types';

const db = {
    getFollowers: async (userId: string): Promise<(Connection & { follower: Profile })[]> => {
        console.log('getFollowers:', { userId });
        return [];
    },
    getFollowing: async (userId: string): Promise<(Connection & { following: Profile })[]> => {
        console.log('getFollowing:', { userId });
        return [];
    },
    createConnection: async (followerId: string, followingId: string): Promise<Connection> => {
        console.log('createConnection:', { followerId, followingId });
        return { id: 'mock-id', follower_id: followerId, following_id: followingId, status: 'following', created_at: new Date().toISOString() };
    },
    removeConnection: async (followerId: string, followingId: string): Promise<void> => {
        console.log('removeConnection:', { followerId, followingId });
    },
    isFollowing: async (followerId: string, followingId: string): Promise<boolean> => {
        console.log('isFollowing:', { followerId, followingId });
        return false;
    },
    getMutualConnections: async (userId: string): Promise<Profile[]> => {
        console.log('getMutualConnections:', { userId });
        return [];
    },
    searchUsers: async (query: string, page: number, pageSize: number): Promise<PaginatedResponse<Profile>> => {
        console.log('searchUsers:', { query, page, pageSize });
        return { items: [], total: 0, page: 1, pageSize: 20, totalPages: 0 };
    },
};

export const connectionRouter = router({
    // Get user's followers
    getFollowers: publicProcedure
        .input(uuidSchema)
        .query(async ({ input }) => {
            return db.getFollowers(input);
        }),

    // Get users that a user follows
    getFollowing: publicProcedure
        .input(uuidSchema)
        .query(async ({ input }) => {
            return db.getFollowing(input);
        }),

    // Follow a user
    follow: protectedProcedure
        .input(uuidSchema)
        .mutation(async ({ ctx, input }) => {
            if (input === ctx.user!.id) {
                throw new TRPCError({ code: 'BAD_REQUEST', message: 'Cannot follow yourself' });
            }
            return db.createConnection(ctx.user!.id, input);
        }),

    // Unfollow a user
    unfollow: protectedProcedure
        .input(uuidSchema)
        .mutation(async ({ ctx, input }) => {
            await db.removeConnection(ctx.user!.id, input);
            return { success: true };
        }),

    // Check if following
    isFollowing: protectedProcedure
        .input(uuidSchema)
        .query(async ({ ctx, input }) => {
            return db.isFollowing(ctx.user!.id, input);
        }),

    // Get mutual connections
    getMutual: protectedProcedure
        .input(uuidSchema)
        .query(async ({ ctx, input }) => {
            return db.getMutualConnections(input);
        }),

    // Search users
    search: publicProcedure
        .input(z.object({ query: z.string().min(1), page: z.number().min(1).default(1), pageSize: z.number().min(1).max(100).default(20) }))
        .query(async ({ input }) => {
            return db.searchUsers(input.query, input.page, input.pageSize);
        }),
});