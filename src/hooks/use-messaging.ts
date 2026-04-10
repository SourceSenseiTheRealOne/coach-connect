import { trpc } from "@/lib/trpc";
import { useCallback, useEffect, useRef } from "react";
import type { Profile, Message } from "@/shared/types";

// ============================================================
// TYPES
// ============================================================

export interface ConversationWithParticipants {
    id: string;
    created_at: string;
    updated_at: string;
    participants: Profile[];
    last_message?: Message;
}

// ============================================================
// QUERY KEYS (for manual invalidation)
// ============================================================

export const messagingKeys = {
    all: ["messaging"] as const,
    conversations: () => [...messagingKeys.all, "conversations"] as const,
    messages: (conversationId: string) =>
        [...messagingKeys.all, "messages", conversationId] as const,
};

// ============================================================
// TIME FORMATTING UTILITIES
// ============================================================

export function formatMessageTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function formatConversationTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMinutes < 1) return "now";
    if (diffMinutes < 60) return `${diffMinutes}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

export function getInitials(name: string): string {
    return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
}

// ============================================================
// HOOKS
// ============================================================

/**
 * Hook to fetch all conversations for the current user
 */
export function useConversations() {
    return trpc.messaging.getConversations.useQuery(undefined, {
        staleTime: 10 * 1000,
        refetchInterval: 15 * 1000, // Poll every 15s for new messages
    });
}

/**
 * Hook to fetch messages for a specific conversation
 */
export function useMessages(conversationId: string | null) {
    return trpc.messaging.getMessages.useQuery(
        { conversation_id: conversationId!, page: 1, pageSize: 100 },
        {
            enabled: !!conversationId,
            staleTime: 5 * 1000,
            refetchInterval: conversationId ? 10 * 1000 : false,
        },
    );
}

/**
 * Hook to send a message
 */
export function useSendMessage() {
    const utils = trpc.useUtils();

    return trpc.messaging.sendMessage.useMutation({
        onSuccess: async (_data, variables) => {
            // Type guard: variables may be void from tRPC inference
            if (!variables || typeof variables !== "object") return;
            const convId = (variables as { conversation_id: string }).conversation_id;
            // Invalidate messages for this conversation
            await utils.messaging.getMessages.invalidate({
                conversation_id: convId,
            });
            // Invalidate conversations list to update last message
            await utils.messaging.getConversations.invalidate();
        },
    });
}

/**
 * Hook to create a new conversation
 */
export function useCreateConversation() {
    const utils = trpc.useUtils();

    return trpc.messaging.createConversation.useMutation({
        onSuccess: () => {
            utils.messaging.getConversations.invalidate();
        },
    });
}

/**
 * Hook to mark a conversation as read
 */
export function useMarkAsRead() {
    return trpc.messaging.markAsRead.useMutation();
}

/**
 * Hook for real-time messaging via Supabase subscriptions
 * Falls back gracefully if realtime is not available
 */
export function useMessagingRealtime(conversationId: string | null) {
    const utils = trpc.useUtils();
    const channelRef = useRef<ReturnType<typeof import("@supabase/supabase-js").SupabaseClient.prototype.channel> | null>(null);

    const setup = useCallback(() => {
        // Dynamically import supabase to avoid circular deps
        import("@/lib/supabase").then(({ supabase }) => {
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
            }

            const channel = supabase
                .channel(`messages-${conversationId ?? "all"}`)
                .on(
                    "postgres_changes",
                    {
                        event: "INSERT",
                        schema: "public",
                        table: "messages",
                        ...(conversationId ? { filter: `conversation_id=eq.${conversationId}` } : {}),
                    },
                    () => {
                        if (conversationId) {
                            utils.messaging.getMessages.invalidate({
                                conversation_id: conversationId,
                            });
                        }
                        utils.messaging.getConversations.invalidate();
                    },
                )
                .subscribe();

            channelRef.current = channel;
        });

        return () => {
            import("@/lib/supabase").then(({ supabase }) => {
                if (channelRef.current) {
                    supabase.removeChannel(channelRef.current);
                    channelRef.current = null;
                }
            });
        };
    }, [conversationId, utils]);

    useEffect(() => {
        const cleanup = setup();
        return () => {
            cleanup();
        };
    }, [setup]);
}