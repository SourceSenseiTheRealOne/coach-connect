import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Clock,
  X,
  Loader2,
  Dumbbell,
  MoreVertical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import {
  useSeasonPlans,
  useTrainingSessions,
  useSessionExercises,
  useCreateSeasonPlan,
  useCreateTrainingSession,
  useUpdateTrainingSession,
  useDeleteTrainingSession,
  useDeleteSeasonPlan,
  useRemoveExerciseFromSession,
  usePlannerRealtime,
  getWeekDates,
  formatDate,
  formatWeekRange,
  getWeekNumber,
  calculateDuration,
} from "@/hooks/use-planner";
import type { TrainingSession } from "@/shared/types";

// ============================================================
// CONSTANTS
// ============================================================

const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const ageGroups = [
  "U7",
  "U8",
  "U9",
  "U10",
  "U11",
  "U12",
  "U13",
  "U14",
  "U15",
  "U16",
  "U17",
  "U18",
  "U19",
  "senior",
] as const;

export type AgeGroup = (typeof ageGroups)[number];
const planTypes = [
  { value: "2_week", label: "2 Weeks" },
  { value: "month", label: "1 Month" },
  { value: "3_month", label: "3 Months" },
  { value: "full_season", label: "Full Season" },
] as const;

export type PlanType = (typeof planTypes)[number]["value"];

// ============================================================
// SESSION COLOR HELPER
// ============================================================

function getSessionColor(index: number): string {
  const colors = [
    "bg-primary/15 border-primary/30 text-primary",
    "bg-secondary/15 border-secondary/30 text-secondary",
    "bg-amber-500/15 border-amber-500/30 text-amber-600 dark:text-amber-300",
    "bg-rose-500/15 border-rose-500/30 text-rose-600 dark:text-rose-300",
    "bg-purple-500/15 border-purple-500/30 text-purple-600 dark:text-purple-300",
    "bg-sky-500/15 border-sky-500/30 text-sky-600 dark:text-sky-300",
  ];
  return colors[index % colors.length];
}

// ============================================================
// CREATE PLAN DIALOG
// ============================================================

function CreatePlanDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [title, setTitle] = useState("");
  const [ageGroup, setAgeGroup] = useState<AgeGroup>("U15");
  const [planType, setPlanType] = useState<PlanType>("full_season");
  const [seasonStart, setSeasonStart] = useState("");
  const [seasonEnd, setSeasonEnd] = useState("");
  const createPlan = useCreateSeasonPlan();

  // Default dates
  useEffect(() => {
    if (open && !seasonStart) {
      const now = new Date();
      const start = new Date(now.getFullYear(), 8, 1); // Sep 1
      const end = new Date(now.getFullYear() + 1, 5, 30); // Jun 30
      setSeasonStart(formatDate(start));
      setSeasonEnd(formatDate(end));
    }
  }, [open, seasonStart]);

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast({ title: "Please enter a plan title", variant: "destructive" });
      return;
    }
    try {
      await createPlan.mutateAsync({
        title: title.trim(),
        age_group: ageGroup,
        season_start: seasonStart,
        season_end: seasonEnd,
        plan_type: planType,
        club_id: null,
      });
      toast({ title: "Season plan created!" });
      setTitle("");
      onOpenChange(false);
    } catch (error) {
      console.error("Error creating plan:", error);
      toast({ title: "Failed to create plan", variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border text-foreground">
        <DialogHeader>
          <DialogTitle className="font-display">New Season Plan</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label className="text-muted-foreground">Plan Title</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. U15 Season 2025/26"
              className="bg-muted/40 border-border text-foreground"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-muted-foreground">Age Group</Label>
              <Select
                value={ageGroup}
                onValueChange={(value) => setAgeGroup(value as AgeGroup)}
              >
                <SelectTrigger className="bg-muted/40 border-border text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ageGroups.map((ag) => (
                    <SelectItem key={ag} value={ag}>
                      {ag}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground">Plan Type</Label>
              <Select
                value={planType}
                onValueChange={(value) => setPlanType(value as PlanType)}
              >
                <SelectTrigger className="bg-muted/40 border-border text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {planTypes.map((pt) => (
                    <SelectItem key={pt.value} value={pt.value}>
                      {pt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-muted-foreground">Season Start</Label>
              <Input
                type="date"
                value={seasonStart}
                onChange={(e) => setSeasonStart(e.target.value)}
                className="bg-muted/40 border-border text-foreground"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground">Season End</Label>
              <Input
                type="date"
                value={seasonEnd}
                onChange={(e) => setSeasonEnd(e.target.value)}
                className="bg-muted/40 border-border text-foreground"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createPlan.isPending}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {createPlan.isPending ? (
                <Loader2 size={14} className="animate-spin mr-2" />
              ) : null}
              Create Plan
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// SESSION DIALOG (CREATE / EDIT)
// ============================================================

function SessionDialog({
  mode,
  planId,
  session,
  defaultDate,
  open,
  onOpenChange,
}: {
  mode: "create" | "edit";
  planId: string;
  session?: TrainingSession;
  defaultDate?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  // planId is used in the mutation below
  void planId;
  const [title, setTitle] = useState(session?.title || "");
  const [scheduledDate, setScheduledDate] = useState(
    session?.scheduled_date || defaultDate || formatDate(new Date()),
  );
  const [startTime, setStartTime] = useState(session?.start_time || "10:00");
  const [endTime, setEndTime] = useState(session?.end_time || "11:30");
  const [notes, setNotes] = useState(session?.notes || "");

  const createSession = useCreateTrainingSession();
  const updateSession = useUpdateTrainingSession();

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setTitle(session?.title || "");
      setScheduledDate(
        session?.scheduled_date || defaultDate || formatDate(new Date()),
      );
      setStartTime(session?.start_time || "10:00");
      setEndTime(session?.end_time || "11:30");
      setNotes(session?.notes || "");
    }
  }, [open, session, defaultDate]);

  const handleSubmit = async () => {
    try {
      if (mode === "create") {
        await createSession.mutateAsync({
          title: title || null,
          plan_id: planId,
          scheduled_date: scheduledDate,
          start_time: startTime || null,
          end_time: endTime || null,
          notes: notes || null,
        });
        toast({ title: "Training session created!" });
      } else if (session) {
        await updateSession.mutateAsync({
          id: session.id,
          title: title || null,
          scheduled_date: scheduledDate,
          start_time: startTime || null,
          end_time: endTime || null,
          notes: notes || null,
        });
        toast({ title: "Training session updated!" });
      }
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving session:", error);
      toast({ title: "Failed to save session", variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border text-foreground">
        <DialogHeader>
          <DialogTitle className="font-display">
            {mode === "create"
              ? "New Training Session"
              : "Edit Training Session"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label className="text-muted-foreground">Title</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Passing & Movement"
              className="bg-muted/40 border-border text-foreground"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-muted-foreground">Date</Label>
            <Input
              type="date"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              className="bg-muted/40 border-border text-foreground"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-muted-foreground">Start Time</Label>
              <Input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="bg-muted/40 border-border text-foreground"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground">End Time</Label>
              <Input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="bg-muted/40 border-border text-foreground"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-muted-foreground">Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Session focus, objectives..."
              className="bg-muted/40 border-border text-foreground resize-none min-h-[60px]"
            />
          </div>
          {startTime && endTime && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock size={14} />
              <span>Duration: {calculateDuration(startTime, endTime)}</span>
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createSession.isPending || updateSession.isPending}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {createSession.isPending || updateSession.isPending ? (
                <Loader2 size={14} className="animate-spin mr-2" />
              ) : null}
              {mode === "create" ? "Create Session" : "Save Changes"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// SESSION DETAIL DRAWER
// ============================================================

function SessionDetail({
  session,
  planId,
  onClose,
}: {
  session: TrainingSession;
  planId: string;
  onClose: () => void;
}) {
  // planId is used in the delete mutation below
  void planId;
  const { data: exercises, isLoading: loadingExercises } = useSessionExercises(
    session.id,
  );
  const removeExercise = useRemoveExerciseFromSession();
  const deleteSession = useDeleteTrainingSession();

  const handleDeleteSession = async () => {
    try {
      await deleteSession.mutateAsync(session.id);
      toast({ title: "Session deleted" });
      onClose();
    } catch (error) {
      console.error("Error deleting session:", error);
      toast({ title: "Failed to delete session", variant: "destructive" });
    }
  };

  const handleRemoveExercise = async (sessionExerciseId: string) => {
    try {
      await removeExercise.mutateAsync(sessionExerciseId);
      toast({ title: "Exercise removed" });
    } catch (error) {
      console.error("Error removing exercise:", error);
      toast({ title: "Failed to remove exercise", variant: "destructive" });
    }
  };

  const duration = calculateDuration(session.start_time, session.end_time);

  return (
    <motion.div
      className="glass-card p-4 space-y-4"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
    >
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-display font-semibold text-foreground">
            {session.title || "Training Session"}
          </h3>
          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
            <span>{session.scheduled_date}</span>
            {session.start_time && <span>{session.start_time}</span>}
            {duration && (
              <span className="flex items-center gap-1">
                <Clock size={10} /> {duration}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X size={14} />
          </Button>
        </div>
      </div>

      {session.notes && (
        <p className="text-xs text-muted-foreground bg-muted/50 p-2 rounded-md">
          {session.notes}
        </p>
      )}

      {/* Exercises */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
            <Dumbbell size={12} /> Exercises
          </h4>
        </div>

        {loadingExercises ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 size={16} className="animate-spin text-muted-foreground" />
          </div>
        ) : exercises && exercises.length > 0 ? (
          <div className="space-y-1.5">
            {exercises.map((ex) => (
              <div
                key={ex.id}
                className="flex items-center justify-between bg-muted/50 rounded-md px-3 py-2"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-foreground truncate">
                    {ex.exercise.title}
                  </div>
                  <div className="text-[10px] text-muted-foreground flex items-center gap-2">
                    <span className="capitalize">{ex.exercise.category}</span>
                    {ex.duration_minutes && (
                      <span>{ex.duration_minutes}min</span>
                    )}
                    {ex.exercise.difficulty && (
                      <span>
                        {ex.exercise.difficulty.charAt(0).toUpperCase() +
                          ex.exercise.difficulty.slice(1)}
                      </span>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveExercise(ex.id)}
                  className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                >
                  <X size={12} />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground text-center py-2">
            No exercises added yet
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-2 border-t border-border">
        <Button
          variant="destructive"
          size="sm"
          onClick={handleDeleteSession}
          disabled={deleteSession.isPending}
          className="gap-1"
        >
          {deleteSession.isPending ? (
            <Loader2 size={12} className="animate-spin" />
          ) : (
            <Trash2 size={12} />
          )}
          Delete Session
        </Button>
      </div>
    </motion.div>
  );
}

// ============================================================
// MAIN PLANNER PAGE
// ============================================================

export default function PlannerPage() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [createPlanOpen, setCreatePlanOpen] = useState(false);
  const [sessionDialogMode, setSessionDialogMode] = useState<"create" | "edit">(
    "create",
  );
  const [sessionDialogOpen, setSessionDialogOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<
    TrainingSession | undefined
  >(undefined);
  const [defaultSessionDate, setDefaultSessionDate] = useState<string>("");
  const [selectedSession, setSelectedSession] =
    useState<TrainingSession | null>(null);

  const setupRealtime = usePlannerRealtime();

  // Real-time
  useEffect(() => {
    const cleanup = setupRealtime();
    return cleanup;
  }, [setupRealtime]);

  // Data hooks
  const { data: plans, isLoading: loadingPlans } = useSeasonPlans();
  const { data: sessions, isLoading: loadingSessions } =
    useTrainingSessions(selectedPlanId);

  // Auto-select first plan
  useEffect(() => {
    if (plans && plans.length > 0 && !selectedPlanId) {
      setSelectedPlanId(plans[0].id);
    }
  }, [plans, selectedPlanId]);

  const deletePlan = useDeleteSeasonPlan();

  const weekDates = getWeekDates(weekOffset);
  const weekNum = getWeekNumber(weekDates);
  const weekRange = formatWeekRange(weekDates);

  // Map sessions to their dates for quick lookup
  const sessionsByDate = new Map<string, TrainingSession[]>();
  if (sessions) {
    for (const s of sessions) {
      const existing = sessionsByDate.get(s.scheduled_date) || [];
      sessionsByDate.set(s.scheduled_date, [...existing, s]);
    }
  }

  const selectedPlan = plans?.find((p) => p.id === selectedPlanId);

  const handleCreateSession = (date: string) => {
    if (!selectedPlanId) {
      toast({ title: "Select or create a plan first", variant: "destructive" });
      return;
    }
    setSessionDialogMode("create");
    setEditingSession(undefined);
    setDefaultSessionDate(date);
    setSessionDialogOpen(true);
  };

  const handleDeletePlan = async (planId: string) => {
    try {
      await deletePlan.mutateAsync(planId);
      if (selectedPlanId === planId) {
        setSelectedPlanId(plans?.[0]?.id || null);
      }
      toast({ title: "Plan deleted" });
    } catch (error) {
      console.error("Error deleting plan:", error);
      toast({ title: "Failed to delete plan", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        className="flex items-center justify-between"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="font-display text-2xl font-bold text-foreground">
          Season Planner
        </h1>
        <Button
          size="sm"
          onClick={() => setCreatePlanOpen(true)}
          className="bg-primary text-primary-foreground hover:bg-primary/90 gap-1"
        >
          <Plus size={14} /> New Plan
        </Button>
      </motion.div>

      {/* Plan selector */}
      <motion.div
        className="flex items-center gap-2 flex-wrap"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        {loadingPlans ? (
          <div className="flex items-center gap-2">
            <Loader2 size={16} className="animate-spin text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Loading plans...
            </span>
          </div>
        ) : plans && plans.length > 0 ? (
          plans.map((plan) => (
            <div key={plan.id} className="relative group">
              <button
                onClick={() => setSelectedPlanId(plan.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  selectedPlanId === plan.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/40 text-muted-foreground hover:bg-muted/70"
                }`}
              >
                {plan.title}
              </button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-muted rounded-full p-0.5">
                    <MoreVertical size={10} className="text-muted-foreground" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => handleDeletePlan(plan.id)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 size={12} className="mr-2" />
                    Delete Plan
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">
            No plans yet. Create your first season plan!
          </p>
        )}
      </motion.div>

      {/* Plan info badge */}
      {selectedPlan && (
        <motion.div
          className="flex items-center gap-2 flex-wrap"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <Badge variant="outline" className="text-xs border-border">
            {selectedPlan.age_group}
          </Badge>
          <Badge variant="outline" className="text-xs border-border">
            {planTypes.find((pt) => pt.value === selectedPlan.plan_type)
              ?.label || selectedPlan.plan_type}
          </Badge>
          <Badge variant="outline" className="text-xs border-border">
            {selectedPlan.season_start} → {selectedPlan.season_end}
          </Badge>
        </motion.div>
      )}

      {/* Week navigation */}
      <motion.div
        className="glass-card p-4 flex items-center justify-between"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <button
          onClick={() => setWeekOffset((w) => w - 1)}
          className="p-2 rounded-lg hover:bg-muted/60 text-muted-foreground"
        >
          <ChevronLeft size={18} />
        </button>
        <div className="flex items-center gap-2">
          <CalendarIcon size={16} className="text-primary" />
          <span className="font-display font-semibold text-foreground">
            Week {weekNum} — {weekRange}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setWeekOffset(0)}
            className="px-2 py-1 text-xs rounded-md hover:bg-muted/60 text-muted-foreground"
          >
            Today
          </button>
          <button
            onClick={() => setWeekOffset((w) => w + 1)}
            className="p-2 rounded-lg hover:bg-muted/60 text-muted-foreground"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </motion.div>

      {/* Loading sessions */}
      {loadingSessions && selectedPlanId && (
        <div className="glass-card p-8 flex flex-col items-center justify-center gap-3">
          <Loader2 className="animate-spin text-primary" size={24} />
          <p className="text-sm text-muted-foreground">Loading sessions...</p>
        </div>
      )}

      {/* Weekly grid */}
      <motion.div
        className="grid grid-cols-7 gap-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        {weekDates.map((date, i) => {
          const dateStr = formatDate(date);
          const daySessions = sessionsByDate.get(dateStr) || [];
          const isToday = formatDate(new Date()) === dateStr;

          return (
            <div key={dateStr} className="space-y-1.5">
              <div className="text-center space-y-0.5">
                <div
                  className={`text-xs font-medium ${isToday ? "text-primary" : "text-muted-foreground"} py-1`}
                >
                  {dayNames[i]}
                </div>
                <div
                  className={`text-[10px] ${isToday ? "text-primary font-bold" : "text-muted-foreground/60"}`}
                >
                  {date.getDate()}
                </div>
              </div>
              <div
                className={`glass-card min-h-[140px] p-2 transition-all cursor-pointer hover:border-primary/30 ${
                  isToday ? "border-primary/40" : ""
                }`}
                onClick={() => {
                  if (daySessions.length > 0) {
                    setSelectedSession(daySessions[0]);
                  } else {
                    handleCreateSession(dateStr);
                  }
                }}
              >
                {daySessions.length > 0 ? (
                  <div className="space-y-1.5">
                    {daySessions.map((s, si) => (
                      <div
                        key={s.id}
                        className={`rounded-md p-2 border ${getSessionColor(si)} cursor-pointer`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedSession(s);
                        }}
                      >
                        {s.start_time && (
                          <div className="text-[10px] opacity-80">
                            {s.start_time}
                          </div>
                        )}
                        <div className="text-xs font-medium leading-tight">
                          {s.title || "Training"}
                        </div>
                        {s.start_time && s.end_time && (
                          <div className="text-[10px] opacity-60">
                            {calculateDuration(s.start_time, s.end_time)}
                          </div>
                        )}
                      </div>
                    ))}
                    <button
                      className="w-full flex items-center justify-center py-1 text-muted-foreground/40 hover:text-primary transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCreateSession(dateStr);
                      }}
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full opacity-30 hover:opacity-60 transition-opacity">
                    <Plus size={16} className="text-muted-foreground" />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </motion.div>

      {/* Session detail panel */}
      <AnimatePresence>
        {selectedSession && selectedPlanId && (
          <SessionDetail
            session={selectedSession}
            planId={selectedPlanId}
            onClose={() => setSelectedSession(null)}
          />
        )}
      </AnimatePresence>

      {/* No plan selected message */}
      {!selectedPlanId && !loadingPlans && plans && plans.length === 0 && (
        <motion.div
          className="glass-card p-8 flex flex-col items-center justify-center gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <CalendarIcon size={32} className="text-muted-foreground/30" />
          <div className="text-center">
            <h3 className="font-display font-semibold text-foreground mb-1">
              Start Planning Your Season
            </h3>
            <p className="text-sm text-muted-foreground max-w-md">
              Create a season plan to organize your training sessions week by
              week. Add exercises, set schedules, and track your team's
              development.
            </p>
          </div>
          <Button
            onClick={() => setCreatePlanOpen(true)}
            className="bg-primary text-primary-foreground hover:bg-primary/90 gap-1"
          >
            <Plus size={14} /> Create Your First Plan
          </Button>
        </motion.div>
      )}

      {/* Dialogs */}
      <CreatePlanDialog
        open={createPlanOpen}
        onOpenChange={setCreatePlanOpen}
      />
      {selectedPlanId && (
        <SessionDialog
          mode={sessionDialogMode}
          planId={selectedPlanId}
          session={editingSession}
          defaultDate={defaultSessionDate}
          open={sessionDialogOpen}
          onOpenChange={setSessionDialogOpen}
        />
      )}
    </div>
  );
}
