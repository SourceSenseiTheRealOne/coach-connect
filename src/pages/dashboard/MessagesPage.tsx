import { motion } from "framer-motion";
import { Search, Send } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";

const conversations = [
  { id: 1, name: "Miguel Santos", avatar: "MS", lastMessage: "Great drill! Can you share the full session plan?", time: "2m", unread: 2 },
  { id: 2, name: "Ana Rodrigues", avatar: "AR", lastMessage: "I'll send you the video analysis tomorrow.", time: "1h", unread: 0 },
  { id: 3, name: "Sporting CP Academy", avatar: "SC", lastMessage: "We'd love to discuss the coaching position.", time: "3h", unread: 1 },
  { id: 4, name: "Pedro Almeida", avatar: "PA", lastMessage: "Thanks for the recommendation!", time: "1d", unread: 0 },
  { id: 5, name: "Carlos Mendes", avatar: "CM", lastMessage: "See you at the conference next week.", time: "2d", unread: 0 },
];

const chatMessages = [
  { id: 1, sender: "them", text: "Hi José! I saw your new pressing drill on the feed. Really impressive results.", time: "10:30" },
  { id: 2, sender: "me", text: "Thanks Miguel! It took a few sessions to get it right but the players really bought into it.", time: "10:32" },
  { id: 3, sender: "them", text: "Would you mind sharing the full session plan? I'd love to adapt it for my U15 group.", time: "10:33" },
  { id: 4, sender: "them", text: "Great drill! Can you share the full session plan?", time: "10:34" },
];

export default function MessagesPage() {
  const [selected, setSelected] = useState(0);

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
        <div className="w-80 border-r border-border flex flex-col shrink-0 hidden sm:flex">
          <div className="p-3 border-b border-border">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search messages..."
                className="pl-9 h-9 bg-secondary border-border text-foreground text-sm placeholder:text-muted-foreground"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {conversations.map((conv, i) => (
              <button
                key={conv.id}
                onClick={() => setSelected(i)}
                className={`w-full flex items-center gap-3 p-3 text-left transition-colors ${
                  selected === i ? "bg-secondary" : "hover:bg-secondary/50"
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0">
                  <span className="text-primary text-xs font-semibold">{conv.avatar}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground truncate">{conv.name}</span>
                    <span className="text-xs text-muted-foreground">{conv.time}</span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{conv.lastMessage}</p>
                </div>
                {conv.unread > 0 && (
                  <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-bold shrink-0">
                    {conv.unread}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Chat area */}
        <div className="flex-1 flex flex-col">
          <div className="p-4 border-b border-border flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
              <span className="text-primary text-xs font-semibold">{conversations[selected].avatar}</span>
            </div>
            <div>
              <span className="text-sm font-medium text-foreground">{conversations[selected].name}</span>
              <div className="flex items-center gap-1.5">
                <span className="glow-dot !w-1.5 !h-1.5" />
                <span className="text-xs text-muted-foreground">Online</span>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {chatMessages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.sender === "me" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm ${
                    msg.sender === "me"
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-secondary text-foreground rounded-bl-md"
                  }`}
                >
                  <p>{msg.text}</p>
                  <span className={`text-[10px] mt-1 block ${msg.sender === "me" ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                    {msg.time}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 border-t border-border flex gap-2">
            <Input
              placeholder="Type a message..."
              className="bg-secondary border-border text-foreground placeholder:text-muted-foreground"
            />
            <button className="p-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
              <Send size={16} />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
