import { useState } from "react";
import { motion } from "framer-motion";
import { MessageSquare, Eye, Pin, Clock, Loader2 } from "lucide-react";
import { useForumCategories, useForumThreads } from "@/hooks/use-forum";

export default function ForumPage() {
  const { data: categories, isLoading: categoriesLoading } =
    useForumCategories();
  const { data: threadsData, isLoading: threadsLoading } = useForumThreads();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  if (categoriesLoading || threadsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const threads = threadsData?.items || [];

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
        {categories?.map((cat) => (
          <div
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`glass-card-hover p-4 cursor-pointer flex items-center gap-3 ${selectedCategory === cat.id ? "ring-2 ring-primary" : ""}`}
          >
            <span className="text-2xl">📋</span>
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                {cat.name}
              </h3>
              <p className="text-xs text-muted-foreground">{cat.slug}</p>
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
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-semibold text-foreground">
            Recent Threads
          </h2>
          {selectedCategory && (
            <button
              onClick={() => setSelectedCategory(null)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Clear filter
            </button>
          )}
        </div>
        <div className="space-y-2">
          {threads.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No threads found
            </div>
          ) : (
            threads.map((thread) => (
              <div
                key={thread.id}
                className="glass-card-hover p-4 cursor-pointer"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {thread.is_pinned && (
                        <Pin size={12} className="text-primary" />
                      )}
                      <h3 className="text-sm font-medium text-foreground truncate">
                        {thread.title}
                      </h3>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>
                        {thread.author_id?.slice(0, 8) || "Anonymous"}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare size={10} /> {thread.replies_count || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye size={10} /> {thread.views_count || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={10} />{" "}
                        {new Date(thread.created_at || "").toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-secondary text-muted-foreground shrink-0">
                    {thread.category_id?.slice(0, 8) || "General"}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
}
