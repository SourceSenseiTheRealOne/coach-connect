import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  MessageCircle,
  Share2,
  MoreHorizontal,
  Send,
  Trash2,
  Loader2,
  RefreshCw,
  Image,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  useFeedPosts,
  useCreatePost,
  useToggleLike,
  useCreateComment,
  usePostComments,
  useDeletePost,
  useFeedRealtime,
  timeAgo,
  getInitials,
  type PostWithAuthor,
  type CommentWithAuthor,
} from "@/hooks/use-feed";
import { useAuth } from "@/lib/auth-context";
import { toast } from "@/hooks/use-toast";

// ============================================================
// POST TYPE BADGE COLORS
// ============================================================

const postTypeConfig: Record<string, { label: string; color: string }> = {
  general: { label: "General", color: "bg-muted text-muted-foreground" },
  tactical_insight: {
    label: "Tactical Insight",
    color: "bg-blue-500/20 text-blue-400",
  },
  drill_share: {
    label: "Drill Share",
    color: "bg-green-500/20 text-green-400",
  },
  match_report: {
    label: "Match Report",
    color: "bg-orange-500/20 text-orange-400",
  },
  job_share: { label: "Job Share", color: "bg-purple-500/20 text-purple-400" },
};

// ============================================================
// COMPOSE BOX COMPONENT
// ============================================================

function ComposeBox() {
  const [content, setContent] = useState("");
  const createPost = useCreatePost();
  const { profile } = useAuth();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const initials = profile?.full_name ? getInitials(profile.full_name) : "U";

  const handleSubmit = async () => {
    const trimmed = content.trim();
    if (!trimmed || createPost.isPending) return;

    try {
      await createPost.mutateAsync(trimmed);
      setContent("");
      toast({ title: "Post published!" });
    } catch (error) {
      console.error("Error creating post:", error);
      toast({
        title: "Failed to create post",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <motion.div
      className="glass-card p-4"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <div className="flex gap-3">
        <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0">
          <span className="text-primary text-sm font-semibold">{initials}</span>
        </div>
        <div className="flex-1">
          <Textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Share a tactical insight, drill, or update..."
            className="bg-secondary border-border text-foreground placeholder:text-muted-foreground resize-none min-h-[80px]"
            disabled={createPost.isPending}
          />
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-2">
              <button className="text-muted-foreground hover:text-primary transition-colors">
                <Image size={20} />
              </button>
              {content.length > 0 && (
                <span className="text-xs text-muted-foreground">
                  {content.length}/5000
                </span>
              )}
            </div>
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={!content.trim() || createPost.isPending}
              className="bg-primary text-primary-foreground hover:bg-primary/90 gap-1"
            >
              {createPost.isPending ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Send size={14} />
              )}
              Post
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================
// COMMENT SECTION COMPONENT
// ============================================================

function CommentSection({
  postId,
  isOpen,
}: {
  postId: string;
  isOpen: boolean;
}) {
  const [commentText, setCommentText] = useState("");
  const { data: comments, isLoading } = usePostComments(postId, isOpen);
  const createComment = useCreateComment();
  const { profile } = useAuth();

  const handleSubmitComment = async () => {
    const trimmed = commentText.trim();
    if (!trimmed || createComment.isPending) return;

    try {
      await createComment.mutateAsync({ postId, content: trimmed });
      setCommentText("");
    } catch (error) {
      console.error("Error creating comment:", error);
      toast({
        title: "Failed to post comment",
        variant: "destructive",
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmitComment();
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="mt-3 pt-3 border-t border-border"
    >
      {/* Existing comments */}
      {isLoading ? (
        <div className="flex items-center justify-center py-3">
          <Loader2 size={16} className="animate-spin text-muted-foreground" />
        </div>
      ) : comments && comments.length > 0 ? (
        <div className="space-y-3 mb-3">
          {comments.map((comment: CommentWithAuthor) => (
            <div key={comment.id} className="flex gap-2.5">
              <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0">
                <span className="text-primary text-[10px] font-semibold">
                  {comment.author?.full_name
                    ? getInitials(comment.author.full_name)
                    : "U"}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground text-xs">
                    {comment.author?.full_name || "Unknown User"}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {timeAgo(comment.created_at)}
                  </span>
                </div>
                <p className="text-foreground text-xs leading-relaxed mt-0.5">
                  {comment.content}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {/* Comment input */}
      <div className="flex gap-2.5">
        <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0">
          <span className="text-primary text-[10px] font-semibold">
            {profile?.full_name ? getInitials(profile.full_name) : "U"}
          </span>
        </div>
        <div className="flex-1 flex gap-2">
          <input
            type="text"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Write a comment..."
            className="flex-1 bg-secondary border border-border rounded-md px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            disabled={createComment.isPending}
          />
          <Button
            size="sm"
            variant="ghost"
            onClick={handleSubmitComment}
            disabled={!commentText.trim() || createComment.isPending}
            className="text-primary hover:text-primary h-8 w-8 p-0"
          >
            {createComment.isPending ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Send size={14} />
            )}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================
// POST CARD COMPONENT
// ============================================================

function PostCard({ post, index }: { post: PostWithAuthor; index: number }) {
  const [showComments, setShowComments] = useState(false);
  const toggleLike = useToggleLike();
  const deletePost = useDeletePost();
  const { user } = useAuth();

  const isOwner = user?.id === post.author_id;
  const typeConfig = postTypeConfig[post.post_type] || postTypeConfig.general;

  const handleLike = () => {
    if (!user) {
      toast({ title: "Please log in to like posts", variant: "destructive" });
      return;
    }
    toggleLike.mutateAsync({
      postId: post.id,
      isLiked: !!post.isLikedByMe,
    });
  };

  const handleDelete = async () => {
    try {
      await deletePost.mutateAsync(post.id);
      toast({ title: "Post deleted" });
    } catch (error) {
      console.error("Error deleting post:", error);
      toast({
        title: "Failed to delete post",
        variant: "destructive",
      });
    }
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast({ title: "Link copied to clipboard!" });
    } catch {
      toast({ title: "Could not copy link", variant: "destructive" });
    }
  };

  const authorName = post.author?.full_name || "Unknown User";
  const authorInitials = post.author?.full_name
    ? getInitials(post.author.full_name)
    : "U";
  const authorRole = post.author
    ? `${post.author.user_type.charAt(0).toUpperCase() + post.author.user_type.slice(1)}${post.author.uefa_license ? ` · UEFA ${post.author.uefa_license}` : ""}${post.author.city ? ` · ${post.author.city}` : ""}`
    : "";

  return (
    <motion.div
      className="glass-card p-5"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 + index * 0.05 }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
            <span className="text-primary text-sm font-semibold">
              {authorInitials}
            </span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-foreground text-sm">
                {authorName}
              </span>
              {post.author?.is_verified && (
                <span className="w-4 h-4 rounded-full bg-primary flex items-center justify-center text-[8px] text-primary-foreground font-bold">
                  ✓
                </span>
              )}
            </div>
            <div className="text-xs text-muted-foreground">
              {authorRole} · {timeAgo(post.created_at)}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full ${typeConfig.color}`}
          >
            {typeConfig.label}
          </span>
          {isOwner && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="text-muted-foreground hover:text-foreground p-1">
                  <MoreHorizontal size={16} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={handleDelete}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 size={14} className="mr-2" />
                  Delete Post
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Content */}
      <p className="text-foreground text-sm leading-relaxed mb-4 whitespace-pre-wrap">
        {post.content}
      </p>

      {/* Actions */}
      <div className="flex items-center gap-6 pt-3 border-t border-border">
        <button
          onClick={handleLike}
          className={`flex items-center gap-1.5 transition-colors text-sm ${
            post.isLikedByMe
              ? "text-red-500"
              : "text-muted-foreground hover:text-red-500"
          }`}
        >
          <Heart size={16} className={post.isLikedByMe ? "fill-current" : ""} />
          <span>{post.likes_count || 0}</span>
        </button>
        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors text-sm"
        >
          <MessageCircle size={16} />
          <span>{post.comments_count || 0}</span>
        </button>
        <button
          onClick={handleShare}
          className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors text-sm"
        >
          <Share2 size={16} /> Share
        </button>
      </div>

      {/* Comments Section */}
      <AnimatePresence>
        <CommentSection postId={post.id} isOpen={showComments} />
      </AnimatePresence>
    </motion.div>
  );
}

// ============================================================
// MAIN FEED PAGE
// ============================================================

export default function FeedPage() {
  const {
    data: posts,
    isLoading,
    error,
    refetch,
    isRefetching,
    isSuccess,
    status,
  } = useFeedPosts();
  const setupRealtime = useFeedRealtime();

  // Debug logging
  useEffect(() => {
    console.log("[FeedPage] React Query state:", {
      status,
      isLoading,
      isSuccess,
      postsCount: posts?.length,
      error: error?.message,
    });
  }, [status, isLoading, isSuccess, posts, error]);

  // Setup real-time subscription
  useEffect(() => {
    const cleanup = setupRealtime();
    return cleanup;
  }, [setupRealtime]);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <h1 className="font-display text-2xl font-bold text-foreground">
          Feed
        </h1>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => refetch()}
          disabled={isRefetching}
          className="text-muted-foreground hover:text-foreground"
        >
          <RefreshCw size={16} className={isRefetching ? "animate-spin" : ""} />
        </Button>
      </motion.div>

      {/* Compose Box */}
      <ComposeBox />

      {/* Loading State */}
      {isLoading && (
        <div className="glass-card p-8 flex flex-col items-center justify-center gap-3">
          <Loader2 className="animate-spin text-primary" size={24} />
          <p className="text-sm text-muted-foreground">Loading feed...</p>
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="glass-card p-8 flex flex-col items-center justify-center gap-3">
          <p className="text-sm text-destructive font-medium">
            Failed to load feed
          </p>
          <p className="text-xs text-muted-foreground text-center max-w-sm">
            {error instanceof Error ? error.message : "Unknown error occurred"}
          </p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw size={14} className="mr-2" />
            Retry
          </Button>
        </div>
      )}

      {/* Posts */}
      {posts && posts.length > 0
        ? posts.map((post, i) => (
            <PostCard key={post.id} post={post} index={i} />
          ))
        : isSuccess &&
          !error &&
          (!posts || posts.length === 0) && (
            <motion.div
              className="glass-card p-8 flex flex-col items-center justify-center gap-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <p className="text-muted-foreground text-sm">
                No posts yet. Be the first to share something!
              </p>
            </motion.div>
          )}
    </div>
  );
}
