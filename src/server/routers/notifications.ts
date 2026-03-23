import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { uuidSchema } from '../../shared/validators';
import type { Notification, PaginatedResponse } from '../../shared/types';

const db = {
    getNotifications: async (userId: string, page: number, pageSize: number): Promise<Notification[]> => {
        console.log('getNotifications:', { userId, page, pageSize });
        return [];
    },
    getUnreadCount: async (userId: string): Promise<number> => {
        console.log('getUnreadCount:', { userId });
        return 0;
    },
    markAsRead: async (id: string): Promise<void> => {
        console.log('markAsRead:', { id });
    },
    markAllAsRead: async (userId: string): Promise<void> => {
        console.log('markAllAsRead:', { userId });
    },
    deleteNotification: async (id: string): Promise<void> => {
        console.log('deleteNotification:', { id });
    },
};

export const notificationsRouter = router({
    // Get user's notifications
    list: protectedProcedure
        .input(z.object({ page: z.number().min(1).default(1), pageSize: z.number().min(1).max(100).default(20) }))
        .query(async ({ ctx, input }) => {
            return db.getNotifications(ctx.user!.id, input.page, input.pageSize);
        }),

    // Get unread count
    getUnreadCount: protectedProcedure
        .query(async ({ ctx }) => {
            return db.getUnreadCount(ctx.user!.id);
        }),

    // Mark notification as read
    markAsRead: protectedProcedure
        .input(uuidSchema)
        .mutation(async ({ input }) => {
            await db.markAsRead(input);
            return { success: true };
        }),

    // Mark all as read
    markAllAsRead: protectedProcedure
        .mutation(async ({ ctx }) => {
            await db.markAllAsRead(ctx.user!.id);
            return { success: true };
        }),

    // Delete notification
    delete: protectedProcedure
        .input(uuidSchema)
        .mutation(async ({ input }) => {
            await db.deleteNotification(input);
            return { success: true };
        }),
});