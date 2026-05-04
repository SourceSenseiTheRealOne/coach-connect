import { motion } from "framer-motion";
import { Search, Send, Plus, ArrowLeft, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState, useRef, useEffect, useMemo } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  useConversations,
  useMessages,
  useSendMessage,
  useCreateConversation,
  useMarkAsRead,
  formatMessageTime,
  formatConversationTime,
  getInitials,
} from "@/hooks/use-messaging";
import type { Profile } from "@/shared/types";

// ============================================================
// NEW CONVERSATION DIALOG
// ============================================================

function NewConversationDialog({
  open,
  onClose,
  userId,
}: {
  open: boolean;
  onClose: (participantId?: string) => void;
  userId: string;
}) {
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [searching, setSearching] = useState(false);
  const createConversation = useCreateConversation();

  // Search for users
  useEffect(() => {
    if (!search.trim()) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const { supabase } = await import("@/lib/supabase");
        const { data, error } = await supabase
          .from("profiles")
          .select(
            "id, username, full_name, avatar_url, user_type, city, country",
          )
          .neq("id", userId)
          .or(`username.ilike.%${search}%,full_name.ilike.%${search}%`)
          .limit(10);

        if (!error && data) {
          setSearchResults(data as Profile[]);
        }
      } catch {
        // Ignore search errors
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [search, userId]);

  const handleStartConversation = async (participantId: string) => {
    try {
      await createConversation.mutateAsync({
        participant_ids: [participantId],
      });
      onClose(participantId);
    } catch {
      // Error handled by mutation
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <motion.div
        className="glass-card w-full max-w-md mx-4 p-0 overflow-hidden"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
      >
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">
            New Conversation
          </h3>
          <button
            onClick={() => onClose()}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            ✕
          </button>
        </div>
        <div className="p-4">
          <div className="relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              placeholder="Search for coaches..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-muted/40 border-border text-foreground placeholder:text-muted-foreground"
              autoFocus
            />
          </div>
          <div className="mt-3 max-h-64 overflow-y-auto space-y-1">
            {searching && (
              <div className="flex items-center justify-center py-4">
                <Loader2
                  size={20}
                  className="animate-spin text-muted-foreground"
                />
              </div>
            )}
            {!searching && search && searchResults.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No users found
              </p>
            )}
            {searchResults.map((user) => (
              <button
                key={user.id}
                onClick={() => handleStartConversation(user.id)}
                disabled={createConversation.isPending}
                className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/60 transition-colors text-left"
              >
                <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0">
                  <span className="text-primary text-xs font-semibold">
                    {user.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        alt=""
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      getInitials(user.full_name || user.username)
                    )}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {user.full_name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    @{user.username}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ============================================================
// MAIN MESSAGES PAGE
// ============================================================

export default function MessagesPage() {
  const { user } = useAuth();
  const [selectedConversationId, setSelectedConversationId] = useState<
    string | null
  >(null);
  const [messageInput, setMessageInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showNewConversation, setShowNewConversation] = useState(false);
  const [showMobileChat, setShowMobileChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // tRPC queries and mutations
  const conversationsQuery = useConversations();
  const messagesQuery = useMessages(selectedConversationId);
  const sendMessageMutation = useSendMessage();
  const markAsReadMutation = useMarkAsRead();

  const conversations = useMemo(
    () => conversationsQuery.data ?? [],
    [conversationsQuery.data],
  );
  const messages = useMemo(
    () => messagesQuery.data ?? [],
    [messagesQuery.data],
  );

  // Filter conversations by search
  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const q = searchQuery.toLowerCase();
    return conversations.filter(
      (conv: {
        participants: Profile[];
        last_message?: { content: string };
      }) => {
        const participantMatch = conv.participants.some(
          (p: Profile) =>
            p.full_name.toLowerCase().includes(q) ||
            p.username.toLowerCase().includes(q),
        );
        const messageMatch = conv.last_message?.content
          ?.toLowerCase()
          .includes(q);
        return participantMatch || messageMatch;
      },
    );
  }, [conversations, searchQuery]);

  // Get the other participant in a conversation (not the current user)
  const getOtherParticipant = (conv: {
    participants?: unknown;
  }): Profile | null => {
    const participants = (conv.participants ?? []) as Profile[];
    if (!user) return participants[0] || null;
    return (
      participants.find((p: Profile) => p.id !== user.id) ||
      participants[0] ||
      null
    );
  };

  // Get the currently selected conversation object
  const selectedConversation = conversations.find(
    (conv: { id: string }) => conv.id === selectedConversationId,
  );
  const otherParticipant = selectedConversation
    ? getOtherParticipant(selectedConversation)
    : null;

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Mark as read when selecting a conversation
  useEffect(() => {
    if (selectedConversationId) {
      markAsReadMutation.mutate({ conversation_id: selectedConversationId });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedConversationId]);

  // Handle sending a message
  const handleSend = () => {
    if (!messageInput.trim() || !selectedConversationId) return;

    sendMessageMutation.mutate({
      conversation_id: selectedConversationId,
      content: messageInput.trim(),
      media_url: null,
    });
    setMessageInput("");
  };

  // Handle key press (Enter to send)
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Handle conversation selection
  const handleSelectConversation = (convId: string) => {
    setSelectedConversationId(convId);
    setShowMobileChat(true);
  };

  // Handle back button on mobile
  const handleBack = () => {
    setShowMobileChat(false);
  };

  return (
    <div className="h-[calc(100vh-8rem)]">
      <motion.h1
        className="font-display text-2xl font-bold text-foreground mb-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        Messages
      </motion.h1>

      <motion.div
        className="glass-card h-[calc(100%-3rem)] flex overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        {/* Conversation list */}
        <div
          className={`w-80 border-r border-border flex flex-col shrink-0 ${
            showMobileChat ? "hidden sm:flex" : "flex"
          }`}
        >
          <div className="p-3 border-b border-border flex items-center gap-2">
            <div className="relative flex-1">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                placeholder="Search messages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 bg-muted/40 border-border text-foreground text-sm placeholder:text-muted-foreground"
              />
            </div>
            <button
              onClick={() => setShowNewConversation(true)}
              className="p-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors shrink-0"
              title="New conversation"
            >
              <Plus size={18} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {conversationsQuery.isLoading && (
              <div className="flex items-center justify-center py-8">
                <Loader2
                  size={24}
                  className="animate-spin text-muted-foreground"
                />
              </div>
            )}
            {conversationsQuery.isSuccess &&
              filteredConversations.length === 0 && (
                <div className="text-center py-8 px-4">
                  <p className="text-sm text-muted-foreground">
                    {searchQuery
                      ? "No conversations found"
                      : "No conversations yet"}
                  </p>
                  {!searchQuery && (
                    <button
                      onClick={() => setShowNewConversation(true)}
                      className="mt-2 text-sm text-primary hover:underline"
                    >
                      Start a new conversation
                    </button>
                  )}
                </div>
              )}
            {filteredConversations.map(
              (conv: {
                id: string;
                updated_at: string;
                participants: Profile[];
                last_message?: {
                  content: string;
                  created_at: string;
                  sender_id: string;
                };
              }) => {
                const other = getOtherParticipant(conv);
                const isSelected = selectedConversationId === conv.id;

                return (
                  <button
                    key={conv.id}
                    onClick={() => handleSelectConversation(conv.id)}
                    className={`w-full flex items-center gap-3 p-3 text-left transition-colors ${
                      isSelected ? "bg-secondary" : "hover:bg-muted/60"
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0">
                      <span className="text-primary text-xs font-semibold">
                        {other?.avatar_url ? (
                          <img
                            src={other.avatar_url}
                            alt=""
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          getInitials(
                            other?.full_name || other?.username || "??",
                          )
                        )}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-foreground truncate">
                          {other?.full_name || other?.username || "Unknown"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {conv.last_message
                            ? formatConversationTime(
                                conv.last_message.created_at,
                              )
                            : formatConversationTime(conv.updated_at)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {conv.last_message?.content || "No messages yet"}
                      </p>
                    </div>
                  </button>
                );
              },
            )}
          </div>
        </div>

        {/* Chat area */}
        <div
          className={`flex-1 flex flex-col ${
            showMobileChat ? "flex" : "hidden sm:flex"
          }`}
        >
          {selectedConversation && otherParticipant ? (
            <>
              {/* Chat header */}
              <div className="p-4 border-b border-border flex items-center gap-3">
                <button
                  onClick={handleBack}
                  className="sm:hidden p-1 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeft size={20} />
                </button>
                <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
                  <span className="text-primary text-xs font-semibold">
                    {otherParticipant.avatar_url ? (
                      <img
                        src={otherParticipant.avatar_url}
                        alt=""
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      getInitials(
                        otherParticipant.full_name || otherParticipant.username,
                      )
                    )}
                  </span>
                </div>
                <div>
                  <span className="text-sm font-medium text-foreground">
                    {otherParticipant.full_name || otherParticipant.username}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="glow-dot !w-1.5 !h-1.5" />
                    <span className="text-xs text-muted-foreground">
                      Online
                    </span>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messagesQuery.isLoading && (
                  <div className="flex items-center justify-center py-8">
                    <Loader2
                      size={24}
                      className="animate-spin text-muted-foreground"
                    />
                  </div>
                )}
                {messages.length === 0 && messagesQuery.isSuccess && (
                  <div className="text-center py-8">
                    <p className="text-sm text-muted-foreground">
                      No messages yet. Say hello!
                    </p>
                  </div>
                )}
                {messages.map(
                  (msg: {
                    id: string;
                    sender_id: string;
                    content: string;
                    created_at: string;
                  }) => {
                    const isMe = msg.sender_id === user?.id;
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm ${
                            isMe
                              ? "bg-primary text-primary-foreground rounded-br-md"
                              : "bg-muted/70 text-foreground rounded-bl-md"
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words">
                            {msg.content}
                          </p>
                          <span
                            className={`text-[10px] mt-1 block ${
                              isMe
                                ? "text-primary-foreground/60"
                                : "text-muted-foreground"
                            }`}
                          >
                            {formatMessageTime(msg.created_at)}
                          </span>
                        </div>
                      </div>
                    );
                  },
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message input */}
              <div className="p-3 border-t border-border flex gap-2">
                <Input
                  placeholder="Type a message..."
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyDown={handleKeyPress}
                  className="bg-muted/40 border-border text-foreground placeholder:text-muted-foreground"
                  disabled={sendMessageMutation.isPending}
                />
                <button
                  onClick={handleSend}
                  disabled={
                    !messageInput.trim() || sendMessageMutation.isPending
                  }
                  className="p-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sendMessageMutation.isPending ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Send size={16} />
                  )}
                </button>
              </div>
            </>
          ) : (
            /* Empty state - no conversation selected */
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center px-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Send size={24} className="text-primary" />
                </div>
                <h3 className="text-lg font-medium text-foreground mb-1">
                  Your Messages
                </h3>
                <p className="text-sm text-muted-foreground max-w-xs">
                  Select a conversation or start a new one to begin messaging
                </p>
                <button
                  onClick={() => setShowNewConversation(true)}
                  className="mt-4 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium sm:hidden"
                >
                  New Conversation
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* New conversation dialog */}
      <NewConversationDialog
        open={showNewConversation}
        onClose={() => setShowNewConversation(false)}
        userId={user?.id || ""}
      />
    </div>
  );
}
