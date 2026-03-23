import { router, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { messaging } from '../db';
import {
    createConversationSchema,
    sendMessageSchema,
    listMessagesSchema,
    markAsReadSchema,
} from '../../shared/validators';

export const messagingRouter = router({
    // Get all conversations for current user
    getConversations: protectedProcedure
        .query(async ({ ctx }) => {
            return messaging.getConversations(ctx.user!.id);
        }),

    // Create a new conversation
    createConversation: protectedProcedure
        .input(createConversationSchema)
        .mutation(async ({ ctx, input }) => {
            // Include current user in participants if not already
            const participants = input.participant_ids.includes(ctx.user!.id)
                ? input.participant_ids
                : [...input.participant_ids, ctx.user!.id];

            const conversation = await messaging.createConversation(participants);
            if (!conversation) {
                throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to create conversation' });
            }
            return conversation;
        }),

    // Get messages for a conversation
    getMessages: protectedProcedure
        .input(listMessagesSchema)
        .query(async ({ input }) => {
            return messaging.getMessages(
                input.conversation_id,
                input.page ?? 1,
                input.pageSize ?? 50
            );
        }),

    // Send a message
    sendMessage: protectedProcedure
        .input(sendMessageSchema)
        .mutation(async ({ ctx, input }) => {
            const message = await messaging.sendMessage(
                input.conversation_id,
                ctx.user!.id,
                input.content,
                input.media_url ?? undefined
            );
            if (!message) {
                throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to send message' });
            }
            return message;
        }),

    // Mark conversation as read
    markAsRead: protectedProcedure
        .input(markAsReadSchema)
        .mutation(async ({ ctx, input }) => {
            const success = await messaging.markAsRead(input.conversation_id, ctx.user!.id);
            if (!success) {
                throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to mark as read' });
            }
            return { success: true };
        }),
});