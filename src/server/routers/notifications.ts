import { router, protectedProcedure } from '../trpc';
import { notifications } from '../db';
import { listNotificationsSchema, markNotificationReadSchema } from '../../shared/validators';

export const notificationsRouter = router({
    // List notifications
    list: protectedProcedure
        .input(listNotificationsSchema.optional())
        .query(async ({ ctx, input }) => {
            return notifications.getByUser(
                ctx.user!.id,
                input?.unread_only ?? false
            );
        }),

    // Get unread count
    unreadCount: protectedProcedure
        .query(async ({ ctx }) => {
            return notifications.getUnreadCount(ctx.user!.id);
        }),

    // Mark as read
    markAsRead: protectedProcedure
        .input(markNotificationReadSchema)
        .mutation(async ({ input }) => {
            const success = await notifications.markAsRead(input.notification_id);
            return { success };
        }),

    // Mark all as read
    markAllAsRead: protectedProcedure
        .mutation(async ({ ctx }) => {
            const success = await notifications.markAllAsRead(ctx.user!.id);
            return { success };
        }),
});