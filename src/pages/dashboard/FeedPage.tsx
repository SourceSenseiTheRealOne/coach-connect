import { motion } from "framer-motion";
import { Heart, MessageCircle, Share2, MoreHorizontal, Image, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const posts = [
  {
    id: 1,
    author: "Miguel Santos",
    role: "Head Coach · SL Benfica U17",
    avatar: "MS",
    verified: true,
    time: "2h ago",
    content: "Just finished implementing a new 4-3-3 pressing structure with our U17s. The high press triggered from the striker's position was incredibly effective — forced 12 turnovers in the final third during today's session. Key: the two 8s need to be aggressive in cutting passing lanes. 🔥",
    type: "tactical_insight",
    likes: 47,
    comments: 12,
  },
  {
    id: 2,
    author: "Ana Rodrigues",
    role: "Assistant Coach · FC Porto Academy",
    avatar: "AR",
    verified: false,
    time: "5h ago",
    content: "Sharing our latest rondo variation: 6v2 in a hexagonal grid. Players must receive and pass within 2 touches, with the constraint that you can't pass to the player who passed to you. Incredible improvement in decision-making speed after just 3 sessions!",
    type: "drill_share",
    likes: 89,
    comments: 23,
  },
  {
    id: 3,
    author: "Pedro Almeida",
    role: "Scout · Sporting CP",
    avatar: "PA",
    verified: true,
    time: "8h ago",
    content: "Great weekend of scouting at the U15 district tournament in Porto. Identified 3 standout talents — exceptional ball-carrying ability and composure under pressure. The level of youth football in Portugal continues to impress. Full report coming to the platform soon.",
    type: "general",
    likes: 34,
    comments: 8,
  },
];

export default function FeedPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-2xl font-bold text-foreground mb-6">Feed</h1>
      </motion.div>

      {/* Compose */}
      <motion.div
        className="glass-card p-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0">
            <span className="text-primary text-sm font-semibold">JM</span>
          </div>
          <div className="flex-1">
            <Textarea
              placeholder="Share a tactical insight, drill, or update..."
              className="bg-secondary border-border text-foreground placeholder:text-muted-foreground resize-none min-h-[80px]"
            />
            <div className="flex items-center justify-between mt-3">
              <button className="text-muted-foreground hover:text-primary transition-colors">
                <Image size={20} />
              </button>
              <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 gap-1">
                <Send size={14} /> Post
              </Button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Posts */}
      {posts.map((post, i) => (
        <motion.div
          key={post.id}
          className="glass-card p-5"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 + i * 0.1 }}
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
                <span className="text-primary text-sm font-semibold">{post.avatar}</span>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-foreground text-sm">{post.author}</span>
                  {post.verified && (
                    <span className="w-4 h-4 rounded-full bg-primary flex items-center justify-center text-[8px] text-primary-foreground font-bold">✓</span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">{post.role} · {post.time}</div>
              </div>
            </div>
            <button className="text-muted-foreground hover:text-foreground">
              <MoreHorizontal size={18} />
            </button>
          </div>

          <p className="text-foreground text-sm leading-relaxed mb-4">{post.content}</p>

          <div className="flex items-center gap-6 pt-3 border-t border-border">
            <button className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors text-sm">
              <Heart size={16} /> {post.likes}
            </button>
            <button className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors text-sm">
              <MessageCircle size={16} /> {post.comments}
            </button>
            <button className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors text-sm">
              <Share2 size={16} /> Share
            </button>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
