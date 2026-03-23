import { motion } from "framer-motion";
import { MessageSquare, Eye, Pin, Clock } from "lucide-react";

const categories = [
  { name: "Tactical Discussions", slug: "tactical", threads: 234, icon: "⚽" },
  { name: "Training Methods", slug: "training", threads: 189, icon: "📋" },
  { name: "Youth Development", slug: "youth", threads: 156, icon: "🌱" },
  { name: "Career & Industry", slug: "career", threads: 98, icon: "💼" },
  { name: "Technology in Football", slug: "tech", threads: 67, icon: "💻" },
  { name: "Off-Topic", slug: "general", threads: 312, icon: "💬" },
];

const recentThreads = [
  { title: "Best pressing systems for U14s?", author: "Miguel S.", replies: 34, views: 567, pinned: true, time: "2h ago", category: "Tactical" },
  { title: "How to handle parents who interfere with coaching", author: "Ana R.", replies: 89, views: 1234, pinned: false, time: "5h ago", category: "Youth" },
  { title: "UEFA C License study group — anyone interested?", author: "Pedro A.", replies: 23, views: 345, pinned: false, time: "1d ago", category: "Career" },
  { title: "Konva.js vs Fabric.js for tactic boards", author: "Carlos M.", replies: 15, views: 234, pinned: false, time: "2d ago", category: "Tech" },
];

export default function ForumPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <motion.h1
        className="font-display text-2xl font-bold text-foreground"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        Forum
      </motion.h1>

      {/* Categories */}
      <motion.div
        className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        {categories.map((cat) => (
          <div key={cat.slug} className="glass-card-hover p-4 cursor-pointer flex items-center gap-3">
            <span className="text-2xl">{cat.icon}</span>
            <div>
              <h3 className="text-sm font-semibold text-foreground">{cat.name}</h3>
              <p className="text-xs text-muted-foreground">{cat.threads} threads</p>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Recent Threads */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h2 className="font-display font-semibold text-foreground mb-4">Recent Threads</h2>
        <div className="space-y-2">
          {recentThreads.map((thread) => (
            <div key={thread.title} className="glass-card-hover p-4 cursor-pointer">
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {thread.pinned && <Pin size={12} className="text-primary" />}
                    <h3 className="text-sm font-medium text-foreground truncate">{thread.title}</h3>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{thread.author}</span>
                    <span className="flex items-center gap-1"><MessageSquare size={10} /> {thread.replies}</span>
                    <span className="flex items-center gap-1"><Eye size={10} /> {thread.views}</span>
                    <span className="flex items-center gap-1"><Clock size={10} /> {thread.time}</span>
                  </div>
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-secondary text-muted-foreground shrink-0">{thread.category}</span>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
