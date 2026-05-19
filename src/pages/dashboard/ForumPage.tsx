import { FormEvent, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Clock,
  Eye,
  Loader2,
  Lock,
  MessageSquare,
  Pin,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  useCreateForumCategory,
  useCreateReply,
  useCreateThread,
  useForumCategories,
  useForumThreads,
  useThreadReplies,
} from "@/hooks/use-forum";
import { useMySubscription } from "@/hooks/use-subscription";
import { useAuth } from "@/lib/auth-context";
import type { ForumThread, SubscriptionTier } from "@/shared/types";

const paidTiers: SubscriptionTier[] = [
  "premium_coach",
  "pro_service",
  "club_license",
];

const emptyCategoryForm = {
  name: "",
  slug: "",
  description: "",
};

const emptyThreadForm = {
  category_id: "",
  title: "",
  content: "",
};

function slugFromName(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export default function ForumPage() {
  const { user, profile } = useAuth();
  const { data: subscription } = useMySubscription();
  const { data: categories, isLoading: categoriesLoading } =
    useForumCategories();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const { data: threadsData, isLoading: threadsLoading } =
    useForumThreads(selectedCategory);
  const createCategory = useCreateForumCategory();
  const createThread = useCreateThread();
  const createReply = useCreateReply();

  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [threadDialogOpen, setThreadDialogOpen] = useState(false);
  const [selectedThread, setSelectedThread] = useState<ForumThread | null>(
    null,
  );
  const [categoryForm, setCategoryForm] = useState(emptyCategoryForm);
  const [threadForm, setThreadForm] = useState(emptyThreadForm);
  const [replyContent, setReplyContent] = useState("");

  const { data: replies = [], isLoading: repliesLoading } = useThreadReplies(
    selectedThread?.id || null,
  );

  const activeTier = (subscription?.subscription_tier ||
    profile?.subscription_tier ||
    "free") as SubscriptionTier;
  const canCreateForumContent = paidTiers.includes(activeTier);
  const threads = threadsData?.items || [];
  const categoryById = useMemo(
    () => new Map((categories || []).map((cat) => [cat.id, cat])),
    [categories],
  );

  async function handleCreateCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canCreateForumContent) return;

    try {
      await createCategory.mutateAsync({
        name: categoryForm.name.trim(),
        slug: categoryForm.slug.trim() || slugFromName(categoryForm.name),
        description: categoryForm.description.trim() || null,
      });
      setCategoryDialogOpen(false);
      setCategoryForm(emptyCategoryForm);
    } catch (error) {
      console.error("Failed to create forum category:", error);
    }
  }

  async function handleCreateThread(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canCreateForumContent) return;

    const categoryId =
      threadForm.category_id || selectedCategory || categories?.[0]?.id;
    if (!categoryId) return;

    try {
      await createThread.mutateAsync({
        category_id: categoryId,
        title: threadForm.title.trim(),
        content: threadForm.content.trim(),
      });
      setThreadDialogOpen(false);
      setThreadForm(emptyThreadForm);
    } catch (error) {
      console.error("Failed to create forum thread:", error);
    }
  }

  async function handleCreateReply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedThread || !replyContent.trim()) return;

    try {
      await createReply.mutateAsync({
        thread_id: selectedThread.id,
        content: replyContent.trim(),
      });
      setReplyContent("");
    } catch (error) {
      console.error("Failed to create forum reply:", error);
    }
  }

  if (categoriesLoading || threadsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <motion.div
        className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            Forum
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Community categories, posts, and replies.
          </p>
        </div>
        {canCreateForumContent ? (
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              variant="secondary"
              onClick={() => setCategoryDialogOpen(true)}
            >
              <Plus size={16} /> New Category
            </Button>
            <Button onClick={() => setThreadDialogOpen(true)}>
              <Plus size={16} /> New Post
            </Button>
          </div>
        ) : (
          <Button asChild variant="outline" className="w-full sm:w-auto">
            <Link to="/pricing">
              <Lock size={16} /> Upgrade to post
            </Link>
          </Button>
        )}
      </motion.div>

      <motion.div
        className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        {categories?.map((cat) => (
          <button
            key={cat.id}
            onClick={() =>
              setSelectedCategory((current) =>
                current === cat.id ? null : cat.id,
              )
            }
            className={`glass-card-hover p-4 cursor-pointer flex items-center gap-3 text-left ${
              selectedCategory === cat.id ? "ring-2 ring-primary" : ""
            }`}
          >
            <MessageSquare size={18} className="text-primary" />
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                {cat.name}
              </h3>
              <p className="text-xs text-muted-foreground">{cat.slug}</p>
            </div>
          </button>
        ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-semibold text-foreground">
            Recent Posts
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
              No posts found
            </div>
          ) : (
            threads.map((thread) => (
              <button
                key={thread.id}
                className="glass-card-hover p-4 cursor-pointer w-full text-left"
                onClick={() => setSelectedThread(thread)}
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
                  <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground shrink-0">
                    {categoryById.get(thread.category_id)?.name || "General"}
                  </span>
                </div>
              </button>
            ))
          )}
        </div>
      </motion.div>

      <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Category</DialogTitle>
            <DialogDescription>
              Paid members can add forum categories.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateCategory} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="category-name">Name</Label>
              <Input
                id="category-name"
                value={categoryForm.name}
                onChange={(event) =>
                  setCategoryForm((current) => ({
                    ...current,
                    name: event.target.value,
                    slug: current.slug || slugFromName(event.target.value),
                  }))
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category-slug">Slug</Label>
              <Input
                id="category-slug"
                value={categoryForm.slug}
                onChange={(event) =>
                  setCategoryForm((current) => ({
                    ...current,
                    slug: slugFromName(event.target.value),
                  }))
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category-description">Description</Label>
              <Textarea
                id="category-description"
                value={categoryForm.description}
                onChange={(event) =>
                  setCategoryForm((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setCategoryDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createCategory.isPending}>
                {createCategory.isPending && (
                  <Loader2 size={16} className="animate-spin" />
                )}
                Create Category
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={threadDialogOpen} onOpenChange={setThreadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Post</DialogTitle>
            <DialogDescription>
              Start a topic in one forum category.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateThread} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="thread-category">Category</Label>
              <select
                id="thread-category"
                value={threadForm.category_id || selectedCategory || ""}
                onChange={(event) =>
                  setThreadForm((current) => ({
                    ...current,
                    category_id: event.target.value,
                  }))
                }
                className="w-full rounded-md border border-border bg-muted/40 px-3 py-2 text-sm text-foreground"
                required
              >
                <option value="" disabled>
                  Select category
                </option>
                {categories?.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="thread-title">Title</Label>
              <Input
                id="thread-title"
                value={threadForm.title}
                onChange={(event) =>
                  setThreadForm((current) => ({
                    ...current,
                    title: event.target.value,
                  }))
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="thread-content">Post</Label>
              <Textarea
                id="thread-content"
                value={threadForm.content}
                onChange={(event) =>
                  setThreadForm((current) => ({
                    ...current,
                    content: event.target.value,
                  }))
                }
                className="min-h-32"
                required
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setThreadDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createThread.isPending}>
                {createThread.isPending && (
                  <Loader2 size={16} className="animate-spin" />
                )}
                Create Post
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!selectedThread}
        onOpenChange={(open) => !open && setSelectedThread(null)}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedThread && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedThread.title}</DialogTitle>
                <DialogDescription>
                  {categoryById.get(selectedThread.category_id)?.name ||
                    "Forum"}{" "}
                  · {new Date(selectedThread.created_at).toLocaleDateString()}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-5">
                <p className="whitespace-pre-wrap text-sm text-foreground">
                  {selectedThread.content || "No post content available."}
                </p>
                <div className="space-y-3 border-t border-border pt-4">
                  <h3 className="text-sm font-semibold text-foreground">
                    Replies
                  </h3>
                  {repliesLoading ? (
                    <p className="text-sm text-muted-foreground">
                      Loading replies...
                    </p>
                  ) : replies.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No replies yet.
                    </p>
                  ) : (
                    replies.map((reply) => (
                      <div
                        key={reply.id}
                        className="rounded-md border border-border bg-muted/30 p-3"
                      >
                        <p className="text-sm text-foreground whitespace-pre-wrap">
                          {reply.content}
                        </p>
                        <p className="mt-2 text-xs text-muted-foreground">
                          {reply.author_id.slice(0, 8)} ·{" "}
                          {new Date(reply.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    ))
                  )}
                </div>
                {user && !selectedThread.is_locked && (
                  <form onSubmit={handleCreateReply} className="space-y-3">
                    <Label htmlFor="reply-content">Reply</Label>
                    <Textarea
                      id="reply-content"
                      value={replyContent}
                      onChange={(event) => setReplyContent(event.target.value)}
                      className="min-h-24"
                      required
                    />
                    <Button type="submit" disabled={createReply.isPending}>
                      {createReply.isPending && (
                        <Loader2 size={16} className="animate-spin" />
                      )}
                      Post Reply
                    </Button>
                  </form>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
