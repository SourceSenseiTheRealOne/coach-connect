import { router, protectedProcedure } from '../trpc';
import { connections } from '../db';
import { toggleFollowSchema, listConnectionsSchema } from '../../shared/validators';

export const connectionRouter = router({
    // Toggle follow
    toggleFollow: protectedProcedure
        .input(toggleFollowSchema)
        .mutation(async ({ ctx, input }) => {
            const { target_user_id } = input;
            const userId = ctx.user!.id;

            const isFollowing = await connections.isFollowing(userId, target_user_id);

            if (isFollowing) {
                await connections.unfollow(userId, target_user_id);
                return { following: false };
            } else {
                await connections.follow(userId, target_user_id);
                return { following: true };
            }
        }),

    // Get followers
    getFollowers: protectedProcedure
        .input(listConnectionsSchema)
        .query(async ({ input }) => {
            return connections.getFollowers(input.user_id);
        }),

    // Get following
    getFollowing: protectedProcedure
        .input(listConnectionsSchema)
        .query(async ({ input }) => {
            return connections.getFollowing(input.user_id);
        }),

    // Check if following
    isFollowing: protectedProcedure
        .input(toggleFollowSchema)
        .query(async ({ ctx, input }) => {
            return connections.isFollowing(ctx.user!.id, input.target_user_id);
        }),
});