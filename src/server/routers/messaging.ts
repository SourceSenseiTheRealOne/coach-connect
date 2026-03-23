import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { uuidSchema } from '../../shared/validators';
import { TRPCError } from '@trpc/server';
import type { Conversation, ConversationParticipant, Message } from '../../shared/types';

const db = {
    getConversations: async (userId: string): Promise<(Conversation & { participants: ConversationParticipant[] })[]> => {
        console.log('getConversations:', { userId });
        return [];
    },
    getConversation: async (id: string): Promise<Conversation | null> => {
        console.log('getConversation:', { id });
        return null;
    },
    createConversation: async (participantIds: string[]): Promise<Conversation> => {
        console.log('createConversation:', { participantIds });
        return { id: 'mock-id', created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
    },
    getMessages: async (conversationId: string, page: number, pageSize: number): Promise<Message[]> => {
        console.log('getMessages:', { conversationId, page, pageSize });
        return [];
    },
    sendMessage: async (data: Partial<Message>): Promise<Message> => {
        console.log('sendMessage:', { data });
        return { ...data, id: 'mock-id', is_read: false, created_at: new Date().toISOString() } as Message;
    },
    markAsRead: async (conversationId: string, userId: string): Promise<void> => {
        console.log('markAsRead:', { conversationId, userId });
    },
    getUnreadCount: async (userId: string): Promise<number> => {
        console.log('getUnreadCount:', { userId });
        return 0;
    },
    isParticipant: async (conversationId: string, userId: string): Promise<boolean> => {
        console.log('isParticipant:', { conversationId, userId });
        return true;
    },
};

export const messagingRouter = router({
    // Get user's conversations
    list: protectedProcedure
        .query(async ({ ctx }) => {
            return db.getConversations(ctx.user!.id);
        }),

    // Get conversation by ID
    getById: protectedProcedure
        .input(uuidSchema)
        .query(async ({ ctx, input }) => {
            if (!await db.isParticipant(input, ctx.user!.id)) {
                throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
            }
            const conversation = await db.getConversation(input);
            if (!conversation) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Conversation not found' });
            }
            return conversation;
        }),

    // Create new conversation
    create: protectedProcedure
        .input(z.object({ participantIds: z.array(uuidSchema).min(1) }))
        .mutation(async ({ ctx, input }) => {
            const allParticipantIds = [...new Set([...input.participantIds, ctx.user!.id])];
            return db.createConversation(allParticipantIds);
        }),

    // Get messages for conversation
    getMessages: protectedProcedure
        .input(z.object({ conversationId: uuidSchema, page: z.number().min(1).default(1), pageSize: z.number().min(1).max(100).default(50) }))
        .query(async ({ ctx, input }) => {
            if (!await db.isParticipant(input.conversationId, ctx.user!.id)) {
                throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
            }
            return db.getMessages(input.conversationId, input.page, input.pageSize);
        }),

    // Send message
    send: protectedProcedure
        .input(z.object({ conversationId: uuidSchema, content: z.string().min(1).max(5000), media_url: z.string().optional() }))
        .mutation(async ({ ctx, input }) => {
            if (!await db.isParticipant(input.conversationId, ctx.user!.id)) {
                throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
            }
            return db.sendMessage({
                conversation_id: input.conversationId,
                sender_id: ctx.user!.id,
                content: input.content,
                media_url: input.media_url || null,
            });
        }),

    // Mark messages as read
    markAsRead: protectedProcedure
        .input(uuidSchema)
        .mutation(async ({ ctx, input }) => {
            if (!await db.isParticipant(input, ctx.user!.id)) {
                throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
            }
            await db.markAsRead(input, ctx.user!.id);
            return { success: true };
        }),

    // Get unread message count
    getUnreadCount: protectedProcedure
        .query(async ({ ctx }) => {
            return db.getUnreadCount(ctx.user!.id);
        }),
});