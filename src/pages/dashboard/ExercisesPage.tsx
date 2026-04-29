import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Eye,
  Lock,
  Plus,
  Loader2,
  RefreshCw,
  Heart,
  Trash2,
  MoreHorizontal,
  Clock,
  Users,
  Send,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useExercises,
  useCreateExercise,
  useToggleExerciseLike,
  useDeleteExercise,
  useExercisesRealtime,
  categoryConfig,
  difficultyColors,
  type ExerciseWithAuthor,
} from "@/hooks/use-exercises";
import { useAuth } from "@/lib/auth-context";
import { toast } from "@/hooks/use-toast";
import type { ExerciseCategory, AgeGroup, Difficulty } from "@/shared/types";

// ============================================================
// CONSTANTS
// ============================================================

const categoryKeys = Object.keys(categoryConfig) as Array<
  keyof typeof categoryConfig
>;

const ageGroups: { value: AgeGroup | "all"; label: string }[] = [
  { value: "all", label: "All Ages" },
  { value: "U7", label: "U7" },
  { value: "U8", label: "U8" },
  { value: "U9", label: "U9" },
  { value: "U10", label: "U10" },
  { value: "U11", label: "U11" },
  { value: "U12", label: "U12" },
  { value: "U13", label: "U13" },
  { value: "U14", label: "U14" },
  { value: "U15", label: "U15" },
  { value: "U16", label: "U16" },
  { value: "U17", label: "U17" },
  { value: "U18", label: "U18" },
  { value: "U19", label: "U19" },
  { value: "senior", label: "Senior" },
];

const difficulties: { value: Difficulty | "all"; label: string }[] = [
  { value: "all", label: "All Levels" },
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
];

const equipmentOptions = [
  "balls",
  "cones",
  "bibs",
  "goals",
  "mannequins",
  "ladders",
  "hurdles",
  "bands",
  "mats",
  "foam rollers",
  "boxes",
];

// ============================================================
// EXERCISE DETAIL MODAL
// ============================================================

function ExerciseDetailModal({
  exercise,
  isOpen,
  onClose,
}: {
  exercise: ExerciseWithAuthor | null;
  isOpen: boolean;
  onClose: () => void;
}) {
  const toggleLike = useToggleExerciseLike();
  const { user } = useAuth();

  if (!exercise) return null;

  const authorName = exercise.author?.full_name || "Unknown";
  const authorRole = exercise.author
    ? `${exercise.author.user_type.charAt(0).toUpperCase() + exercise.author.user_type.slice(1)}${exercise.author.uefa_license ? ` · UEFA ${exercise.author.uefa_license}` : ""}`
    : "";

  const handleLike = () => {
    if (!user) {
      toast({
        title: "Please log in to like exercises",
        variant: "destructive",
      });
      return;
    }
    toggleLike.mutate({
      exerciseId: exercise.id,
      isLiked: !!exercise.isLikedByMe,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="glass-card border-border w-[calc(100vw-2rem)] max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-foreground text-lg">
            {exercise.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Author info */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
              <span className="text-primary text-sm font-semibold">
                {authorName
                  .split(" ")
                  .map((n: string) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2)}
              </span>
            </div>
            <div>
              <p className="font-semibold text-foreground text-sm">
                {authorName}
              </p>
              <p className="text-xs text-muted-foreground">{authorRole}</p>
            </div>
          </div>

          {/* Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge
              variant="outline"
              className="text-xs border-border text-muted-foreground"
            >
              {categoryConfig[exercise.category]?.label || exercise.category}
            </Badge>
            <Badge
              variant="outline"
              className="text-xs border-border text-muted-foreground"
            >
              {exercise.age_group}
            </Badge>
            {exercise.difficulty && (
              <span
                className={`text-xs px-2 py-0.5 rounded-full border ${difficultyColors[exercise.difficulty] || ""}`}
              >
                {exercise.difficulty}
              </span>
            )}
            {exercise.is_premium && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-xs">
                <Lock size={10} /> Premium
              </span>
            )}
          </div>

          {/* Description */}
          {exercise.description && (
            <p className="text-foreground text-sm leading-relaxed">
              {exercise.description}
            </p>
          )}

          {/* Details grid */}
          <div className="grid grid-cols-2 gap-3">
            {exercise.duration_minutes && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock size={14} />
                <span>{exercise.duration_minutes} min</span>
              </div>
            )}
            {exercise.min_players && exercise.max_players && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users size={14} />
                <span>
                  {exercise.min_players === exercise.max_players
                    ? `${exercise.min_players} players`
                    : `${exercise.min_players}-${exercise.max_players} players`}
                </span>
              </div>
            )}
          </div>

          {/* Equipment */}
          {exercise.equipment && exercise.equipment.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-1.5">Equipment</p>
              <div className="flex flex-wrap gap-1.5">
                {exercise.equipment.map((eq) => (
                  <Badge key={eq} variant="secondary" className="text-xs">
                    {eq}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-4 pt-3 border-t border-border">
            <button
              onClick={handleLike}
              className={`flex items-center gap-1.5 transition-colors text-sm ${
                exercise.isLikedByMe
                  ? "text-red-500"
                  : "text-muted-foreground hover:text-red-500"
              }`}
            >
              <Heart
                size={16}
                className={exercise.isLikedByMe ? "fill-current" : ""}
              />
              <span>{exercise.likes_count || 0}</span>
            </button>
            <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
              <Eye size={16} />
              <span>{exercise.views_count || 0}</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// CREATE EXERCISE DIALOG
// ============================================================

function CreateExerciseDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const createExercise = useCreateExercise();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<ExerciseCategory>("passing");
  const [ageGroup, setAgeGroup] = useState<AgeGroup>("U14");
  const [difficulty, setDifficulty] = useState<Difficulty>("intermediate");
  const [duration, setDuration] = useState("15");
  const [minPlayers, setMinPlayers] = useState("4");
  const [maxPlayers, setMaxPlayers] = useState("12");
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);
  const [isPremium, setIsPremium] = useState(false);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setCategory("passing");
    setAgeGroup("U14");
    setDifficulty("intermediate");
    setDuration("15");
    setMinPlayers("4");
    setMaxPlayers("12");
    setSelectedEquipment([]);
    setIsPremium(false);
  };

  const toggleEquipment = (eq: string) => {
    setSelectedEquipment((prev) =>
      prev.includes(eq) ? prev.filter((e) => e !== eq) : [...prev, eq],
    );
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast({ title: "Title is required", variant: "destructive" });
      return;
    }

    try {
      await createExercise.mutateAsync({
        title: title.trim(),
        description: description.trim(),
        category,
        age_group: ageGroup,
        difficulty,
        duration_minutes: parseInt(duration) || 15,
        min_players: parseInt(minPlayers) || 4,
        max_players: parseInt(maxPlayers) || 12,
        equipment: selectedEquipment,
        is_premium: isPremium,
      });
      toast({ title: "Exercise created successfully!" });
      resetForm();
      onOpenChange(false);
    } catch (error) {
      console.error("Error creating exercise:", error);
      toast({ title: "Failed to create exercise", variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card border-border w-[calc(100vw-2rem)] max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-foreground">Create Exercise</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Title */}
          <div className="space-y-1.5">
            <Label className="text-foreground text-sm">Title *</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Diamond Passing Drill"
              className="bg-secondary border-border text-foreground placeholder:text-muted-foreground"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label className="text-foreground text-sm">Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the exercise, setup, and coaching points..."
              className="bg-secondary border-border text-foreground placeholder:text-muted-foreground resize-none min-h-[80px]"
            />
          </div>

          {/* Category & Difficulty */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-foreground text-sm">Category</Label>
              <Select
                value={category}
                onValueChange={(v) => setCategory(v as ExerciseCategory)}
              >
                <SelectTrigger className="bg-secondary border-border text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(categoryConfig)
                    .filter(([key]) => key !== "all")
                    .map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        {config.icon} {config.label}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-foreground text-sm">Difficulty</Label>
              <Select
                value={difficulty}
                onValueChange={(v) => setDifficulty(v as Difficulty)}
              >
                <SelectTrigger className="bg-secondary border-border text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Age Group & Duration */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-foreground text-sm">Age Group</Label>
              <Select
                value={ageGroup}
                onValueChange={(v) => setAgeGroup(v as AgeGroup)}
              >
                <SelectTrigger className="bg-secondary border-border text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ageGroups
                    .filter((a) => a.value !== "all")
                    .map((ag) => (
                      <SelectItem key={ag.value} value={ag.value}>
                        {ag.label}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-foreground text-sm">Duration (min)</Label>
              <Input
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="bg-secondary border-border text-foreground"
                min={1}
                max={120}
              />
            </div>
          </div>

          {/* Players */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-foreground text-sm">Min Players</Label>
              <Input
                type="number"
                value={minPlayers}
                onChange={(e) => setMinPlayers(e.target.value)}
                className="bg-secondary border-border text-foreground"
                min={1}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-foreground text-sm">Max Players</Label>
              <Input
                type="number"
                value={maxPlayers}
                onChange={(e) => setMaxPlayers(e.target.value)}
                className="bg-secondary border-border text-foreground"
                min={1}
              />
            </div>
          </div>

          {/* Equipment */}
          <div className="space-y-1.5">
            <Label className="text-foreground text-sm">Equipment</Label>
            <div className="flex flex-wrap gap-1.5">
              {equipmentOptions.map((eq) => (
                <button
                  key={eq}
                  type="button"
                  onClick={() => toggleEquipment(eq)}
                  className={`px-2.5 py-1 rounded-full text-xs transition-colors ${
                    selectedEquipment.includes(eq)
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground hover:text-foreground border border-border"
                  }`}
                >
                  {eq}
                </button>
              ))}
            </div>
          </div>

          {/* Premium toggle */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsPremium(!isPremium)}
              className={`relative w-10 h-5 rounded-full transition-colors ${
                isPremium ? "bg-primary" : "bg-secondary border border-border"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full transition-transform bg-foreground ${
                  isPremium ? "translate-x-5" : ""
                }`}
              />
            </button>
            <Label className="text-muted-foreground text-sm">
              Premium content
            </Label>
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-border text-muted-foreground"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!title.trim() || createExercise.isPending}
              className="bg-primary text-primary-foreground hover:bg-primary/90 gap-1"
            >
              {createExercise.isPending ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Send size={14} />
              )}
              Create Exercise
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// EXERCISE CARD
// ============================================================

function ExerciseCard({
  exercise,
  index,
  onOpenDetail,
}: {
  exercise: ExerciseWithAuthor;
  index: number;
  onOpenDetail: (exercise: ExerciseWithAuthor) => void;
}) {
  const toggleLike = useToggleExerciseLike();
  const deleteExercise = useDeleteExercise();
  const { user } = useAuth();

  const isOwner = user?.id === exercise.author_id;
  const authorName = exercise.author?.full_name || "Unknown";

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      toast({
        title: "Please log in to like exercises",
        variant: "destructive",
      });
      return;
    }
    toggleLike.mutate({
      exerciseId: exercise.id,
      isLiked: !!exercise.isLikedByMe,
    });
  };

  const handleDelete = async () => {
    try {
      await deleteExercise.mutateAsync(exercise.id);
      toast({ title: "Exercise deleted" });
    } catch (error) {
      console.error("Error deleting exercise:", error);
      toast({ title: "Failed to delete exercise", variant: "destructive" });
    }
  };

  return (
    <motion.div
      className="glass-card-hover overflow-hidden group cursor-pointer"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 + index * 0.03 }}
      onClick={() => onOpenDetail(exercise)}
    >
      {/* Placeholder diagram */}
      <div className="aspect-[4/3] bg-gradient-to-br from-primary/5 to-accent/5 relative flex items-center justify-center">
        <div className="text-center">
          <span className="text-2xl">
            {categoryConfig[exercise.category]?.icon || "⚽"}
          </span>
          <p className="text-xs text-muted-foreground mt-1">
            {categoryConfig[exercise.category]?.label || exercise.category}
          </p>
        </div>
        <div className="absolute top-2 right-2 flex gap-1">
          {exercise.is_premium && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-xs">
              <Lock size={10} /> Premium
            </span>
          )}
        </div>
        {isOwner && (
          <div
            className="absolute top-2 left-2"
            onClick={(e) => e.stopPropagation()}
          >
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="text-muted-foreground hover:text-foreground p-1 rounded bg-background/50">
                  <MoreHorizontal size={14} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem
                  onClick={handleDelete}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 size={14} className="mr-2" />
                  Delete Exercise
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-foreground text-sm mb-2 group-hover:text-primary transition-colors line-clamp-1">
          {exercise.title}
        </h3>
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <Badge
            variant="outline"
            className="text-xs border-border text-muted-foreground"
          >
            {categoryConfig[exercise.category]?.label || exercise.category}
          </Badge>
          <Badge
            variant="outline"
            className="text-xs border-border text-muted-foreground"
          >
            {exercise.age_group}
          </Badge>
          {exercise.difficulty && (
            <span
              className={`text-xs px-2 py-0.5 rounded-full border ${difficultyColors[exercise.difficulty] || ""}`}
            >
              {exercise.difficulty}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="truncate max-w-[100px]">{authorName}</span>
          <div className="flex items-center gap-3">
            <button
              onClick={handleLike}
              className={`flex items-center gap-1 transition-colors ${
                exercise.isLikedByMe
                  ? "text-red-500"
                  : "text-muted-foreground hover:text-red-500"
              }`}
            >
              <Heart
                size={12}
                className={exercise.isLikedByMe ? "fill-current" : ""}
              />
              {exercise.likes_count || 0}
            </button>
            <span className="flex items-center gap-1">
              <Eye size={12} /> {exercise.views_count || 0}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================
// MAIN EXERCISES PAGE
// ============================================================

export default function ExercisesPage() {
  const [activeCategory, setActiveCategory] = useState<
    ExerciseCategory | "all"
  >("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [ageFilter, setAgeFilter] = useState<AgeGroup | "all">("all");
  const [difficultyFilter, setDifficultyFilter] = useState<Difficulty | "all">(
    "all",
  );
  const [showFilters, setShowFilters] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedExercise, setSelectedExercise] =
    useState<ExerciseWithAuthor | null>(null);

  const filters = useMemo(
    () => ({
      category: activeCategory,
      age_group: ageFilter,
      difficulty: difficultyFilter,
      search: searchQuery,
    }),
    [activeCategory, ageFilter, difficultyFilter, searchQuery],
  );

  const {
    data: exercises,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useExercises(filters);
  const setupRealtime = useExercisesRealtime();

  useEffect(() => {
    const cleanup = setupRealtime();
    return cleanup;
  }, [setupRealtime]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="font-display text-2xl font-bold text-foreground">
          Exercise Library
        </h1>
        <div className="flex gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search exercises..."
              className="pl-9 bg-secondary border-border text-foreground placeholder:text-muted-foreground"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2.5 rounded-lg border transition-colors ${
              showFilters
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-secondary border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            <Search size={16} />
          </button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => refetch()}
            disabled={isRefetching}
            className="text-muted-foreground hover:text-foreground"
          >
            <RefreshCw
              size={16}
              className={isRefetching ? "animate-spin" : ""}
            />
          </Button>
          <Button
            size="sm"
            onClick={() => setCreateOpen(true)}
            className="bg-primary text-primary-foreground hover:bg-primary/90 gap-1"
          >
            <Plus size={16} /> <span className="hidden sm:inline">Create</span>
          </Button>
        </div>
      </motion.div>

      {/* Extended Filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="glass-card p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-foreground">
                Filters
              </span>
              <button
                onClick={() => {
                  setAgeFilter("all");
                  setDifficultyFilter("all");
                  setSearchQuery("");
                }}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Clear all
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">
                  Age Group
                </label>
                <Select
                  value={ageFilter}
                  onValueChange={(v) => setAgeFilter(v as AgeGroup | "all")}
                >
                  <SelectTrigger className="bg-secondary border-border text-foreground h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ageGroups.map((ag) => (
                      <SelectItem key={ag.value} value={ag.value}>
                        {ag.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">
                  Difficulty
                </label>
                <Select
                  value={difficultyFilter}
                  onValueChange={(v) =>
                    setDifficultyFilter(v as Difficulty | "all")
                  }
                >
                  <SelectTrigger className="bg-secondary border-border text-foreground h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {difficulties.map((d) => (
                      <SelectItem key={d.value} value={d.value}>
                        {d.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Categories */}
      <motion.div
        className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        {categoryKeys.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat as ExerciseCategory | "all")}
            className={`px-3 py-1.5 rounded-full text-xs sm:px-4 sm:py-2 sm:text-sm font-medium whitespace-nowrap transition-colors ${
              activeCategory === cat
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            {categoryConfig[cat].icon} {categoryConfig[cat].label}
          </button>
        ))}
      </motion.div>

      {/* Results count */}
      {exercises && (
        <div className="text-sm text-muted-foreground">
          {exercises.length} exercise{exercises.length !== 1 ? "s" : ""} found
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="glass-card p-8 flex flex-col items-center justify-center gap-3">
          <Loader2 className="animate-spin text-primary" size={24} />
          <p className="text-sm text-muted-foreground">Loading exercises...</p>
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="glass-card p-8 flex flex-col items-center justify-center gap-3">
          <p className="text-sm text-destructive">
            Failed to load exercises. Please try again.
          </p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw size={14} className="mr-2" />
            Retry
          </Button>
        </div>
      )}

      {/* Grid */}
      {exercises && exercises.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {exercises.map((exercise, i) => (
            <ExerciseCard
              key={exercise.id}
              exercise={exercise}
              index={i}
              onOpenDetail={setSelectedExercise}
            />
          ))}
        </div>
      ) : (
        !isLoading &&
        !error && (
          <motion.div
            className="glass-card p-8 flex flex-col items-center justify-center gap-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <p className="text-muted-foreground text-sm">
              {searchQuery || activeCategory !== "all"
                ? "No exercises match your filters. Try adjusting your search."
                : "No exercises yet. Be the first to create one!"}
            </p>
          </motion.div>
        )
      )}

      {/* Create Exercise Dialog */}
      <CreateExerciseDialog open={createOpen} onOpenChange={setCreateOpen} />

      {/* Exercise Detail Modal */}
      <ExerciseDetailModal
        exercise={selectedExercise}
        isOpen={!!selectedExercise}
        onClose={() => setSelectedExercise(null)}
      />
    </div>
  );
}
