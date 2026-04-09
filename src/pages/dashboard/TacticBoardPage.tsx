import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useCallback, useEffect } from "react";
import {
  Plus,
  Save,
  Trash2,
  Copy,
  ChevronDown,
  Pencil,
  ArrowRight,
  Undo2,
  Check,
  X,
  FolderOpen,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  useTacticBoards,
  useCreateTacticBoard,
  useUpdateTacticBoard,
  useDeleteTacticBoard,
  useDuplicateTacticBoard,
  useAutoSave,
  createDefaultBoardData,
  formations,
  type BoardData,
  type PlayerPosition,
  type Arrow,
} from "@/hooks/use-tactic-board";
import type { TacticBoard } from "@/shared/types";

// ============================================================
// ARROW COLORS
// ============================================================
const ARROW_COLORS = [
  { value: "#ef4444", label: "Red" },
  { value: "#3b82f6", label: "Blue" },
  { value: "#22c55e", label: "Green" },
  { value: "#f59e0b", label: "Yellow" },
  { value: "#ffffff", label: "White" },
];

type Tool = "move" | "arrow";

export default function TacticBoardPage() {
  const { toast } = useToast();
  const { data: boards = [], isLoading: boardsLoading } = useTacticBoards();
  const createMutation = useCreateTacticBoard();
  const deleteMutation = useDeleteTacticBoard();
  const duplicateMutation = useDuplicateTacticBoard();
  const updateMutation = useUpdateTacticBoard();

  // Current board state
  const [activeBoardId, setActiveBoardId] = useState<string | null>(null);
  const [boardData, setBoardData] = useState<BoardData>(
    createDefaultBoardData("4-3-3"),
  );
  const [boardTitle, setBoardTitle] = useState("Untitled Board");
  const [isDirty, setIsDirty] = useState(false);

  // Tool state
  const [activeTool, setActiveTool] = useState<Tool>("move");
  const [arrowColor, setArrowColor] = useState("#ef4444");

  // Arrow drawing state
  const [isDrawingArrow, setIsDrawingArrow] = useState(false);
  const [arrowStart, setArrowStart] = useState<{ x: number; y: number } | null>(
    null,
  );
  const [currentArrowEnd, setCurrentArrowEnd] = useState<{
    x: number;
    y: number;
  } | null>(null);

  // Dragging state
  const [draggingPlayer, setDraggingPlayer] = useState<string | null>(null);

  // Editing state
  const [editingPlayer, setEditingPlayer] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState("");

  // Dialog state
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newFormation, setNewFormation] = useState("4-3-3");

  // Delete confirm
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Board container ref for coordinate calculation
  const fieldRef = useRef<HTMLDivElement>(null);
  const autoSaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-save hook
  const { save: autoSave, saveNow, isSaving } = useAutoSave(activeBoardId);

  // Load board from list
  const handleLoadBoard = useCallback(
    (board: TacticBoard) => {
      // Save current board first if dirty
      if (isDirty && activeBoardId) {
        saveNow(boardData);
      }

      const data =
        (board.board_data as unknown as BoardData) ||
        createDefaultBoardData("4-3-3");
      setBoardData(data);
      setBoardTitle(board.title);
      setActiveBoardId(board.id);
      setIsDirty(false);
    },
    [activeBoardId, boardData, isDirty, saveNow],
  );

  // Create new board
  const handleCreateBoard = useCallback(() => {
    if (!newTitle.trim()) return;
    const data = createDefaultBoardData(newFormation);
    createMutation.mutate(
      { title: newTitle.trim(), board_data: data },
      {
        onSuccess: (board) => {
          setBoardData(data);
          setBoardTitle(board.title);
          setActiveBoardId(board.id);
          setIsDirty(false);
          setCreateDialogOpen(false);
          setNewTitle("");
          toast({
            title: "Board created",
            description: `"${board.title}" is ready`,
          });
        },
        onError: () => {
          toast({
            title: "Error",
            description: "Failed to create board",
            variant: "destructive",
          });
        },
      },
    );
  }, [newTitle, newFormation, createMutation, toast]);

  // Save current board
  const handleSave = useCallback(() => {
    if (!activeBoardId) return;
    updateMutation.mutate(
      { id: activeBoardId, title: boardTitle, board_data: boardData },
      {
        onSuccess: () => {
          setIsDirty(false);
          toast({ title: "Saved", description: "Board saved successfully" });
        },
        onError: () => {
          toast({
            title: "Error",
            description: "Failed to save board",
            variant: "destructive",
          });
        },
      },
    );
  }, [activeBoardId, boardTitle, boardData, updateMutation, toast]);

  // Delete board
  const handleDeleteBoard = useCallback(
    (id: string) => {
      deleteMutation.mutate(id, {
        onSuccess: () => {
          if (activeBoardId === id) {
            setActiveBoardId(null);
            setBoardData(createDefaultBoardData("4-3-3"));
            setBoardTitle("Untitled Board");
          }
          setDeleteConfirmId(null);
          toast({ title: "Deleted", description: "Board deleted" });
        },
        onError: () => {
          toast({
            title: "Error",
            description: "Failed to delete",
            variant: "destructive",
          });
        },
      });
    },
    [activeBoardId, deleteMutation, toast],
  );

  // Duplicate board
  const handleDuplicate = useCallback(
    (id: string) => {
      duplicateMutation.mutate(id, {
        onSuccess: () => {
          toast({ title: "Duplicated", description: "Board duplicated" });
        },
        onError: () => {
          toast({
            title: "Error",
            description: "Failed to duplicate",
            variant: "destructive",
          });
        },
      });
    },
    [duplicateMutation, toast],
  );

  // Change formation
  const handleFormationChange = useCallback(
    (formation: string) => {
      const newData = createDefaultBoardData(formation);
      // Preserve arrows
      newData.arrows = boardData.arrows;
      setBoardData(newData);
      setIsDirty(true);
      if (activeBoardId) autoSave(newData);
    },
    [boardData.arrows, activeBoardId, autoSave],
  );

  // Update board data with auto-save
  const updateBoardData = useCallback(
    (newData: BoardData) => {
      setBoardData(newData);
      setIsDirty(true);
      if (activeBoardId) autoSave(newData);
    },
    [activeBoardId, autoSave],
  );

  // Get relative position from mouse event
  const getRelativePos = useCallback(
    (e: React.MouseEvent | MouseEvent): { x: number; y: number } | null => {
      if (!fieldRef.current) return null;
      const rect = fieldRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      return {
        x: Math.max(0, Math.min(100, x)),
        y: Math.max(0, Math.min(100, y)),
      };
    },
    [],
  );

  // Mouse handlers for dragging players
  const handlePlayerMouseDown = useCallback(
    (e: React.MouseEvent, playerId: string) => {
      if (activeTool !== "move") return;
      e.preventDefault();
      e.stopPropagation();
      setDraggingPlayer(playerId);
    },
    [activeTool],
  );

  const handleFieldMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (draggingPlayer) {
        const pos = getRelativePos(e);
        if (!pos) return;

        setBoardData((prev) => ({
          ...prev,
          players: prev.players.map((p) =>
            p.id === draggingPlayer ? { ...p, x: pos.x, y: pos.y } : p,
          ),
        }));
      }

      if (isDrawingArrow && arrowStart) {
        const pos = getRelativePos(e);
        if (pos) setCurrentArrowEnd(pos);
      }
    },
    [draggingPlayer, isDrawingArrow, arrowStart, getRelativePos],
  );

  const handleFieldMouseUp = useCallback(
    (e: React.MouseEvent) => {
      if (draggingPlayer) {
        const pos = getRelativePos(e);
        if (pos) {
          const newData = {
            ...boardData,
            players: boardData.players.map((p) =>
              p.id === draggingPlayer ? { ...p, x: pos.x, y: pos.y } : p,
            ),
          };
          updateBoardData(newData);
        }
        setDraggingPlayer(null);
      }
    },
    [draggingPlayer, boardData, updateBoardData, getRelativePos],
  );

  // Arrow drawing handlers
  const handleFieldMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (activeTool === "arrow") {
        const pos = getRelativePos(e);
        if (pos) {
          setIsDrawingArrow(true);
          setArrowStart(pos);
          setCurrentArrowEnd(pos);
        }
      }
    },
    [activeTool, getRelativePos],
  );

  const handleFieldMouseUpArrow = useCallback(() => {
    if (isDrawingArrow && arrowStart && currentArrowEnd) {
      const dx = currentArrowEnd.x - arrowStart.x;
      const dy = currentArrowEnd.y - arrowStart.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > 3) {
        const newArrow: Arrow = {
          id: `arrow-${Date.now()}`,
          startX: arrowStart.x,
          startY: arrowStart.y,
          endX: currentArrowEnd.x,
          endY: currentArrowEnd.y,
          color: arrowColor,
          type: "solid",
        };
        const newData = {
          ...boardData,
          arrows: [...boardData.arrows, newArrow],
        };
        updateBoardData(newData);
      }
    }
    setIsDrawingArrow(false);
    setArrowStart(null);
    setCurrentArrowEnd(null);
  }, [
    isDrawingArrow,
    arrowStart,
    currentArrowEnd,
    arrowColor,
    boardData,
    updateBoardData,
  ]);

  const handleUndoArrow = useCallback(() => {
    if (boardData.arrows.length === 0) return;
    const newData = {
      ...boardData,
      arrows: boardData.arrows.slice(0, -1),
    };
    updateBoardData(newData);
  }, [boardData, updateBoardData]);

  const handleClearArrows = useCallback(() => {
    const newData = {
      ...boardData,
      arrows: [],
    };
    updateBoardData(newData);
  }, [boardData, updateBoardData]);

  // Player label editing
  const handleStartEditLabel = useCallback((player: PlayerPosition) => {
    setEditingPlayer(player.id);
    setEditLabel(player.label);
  }, []);

  const handleSaveLabel = useCallback(() => {
    if (!editingPlayer) return;
    const newData = {
      ...boardData,
      players: boardData.players.map((p) =>
        p.id === editingPlayer ? { ...p, label: editLabel || p.label } : p,
      ),
    };
    updateBoardData(newData);
    setEditingPlayer(null);
    setEditLabel("");
  }, [editingPlayer, editLabel, boardData, updateBoardData]);

  // Title editing
  const handleStartEditTitle = useCallback(() => {
    setTitleInput(boardTitle);
    setEditingTitle(true);
  }, [boardTitle]);

  const handleSaveTitle = useCallback(() => {
    if (!titleInput.trim()) return;
    setBoardTitle(titleInput.trim());
    setIsDirty(true);
    setEditingTitle(false);
    if (activeBoardId) {
      updateMutation.mutate({ id: activeBoardId, title: titleInput.trim() });
    }
  }, [titleInput, activeBoardId, updateMutation]);

  // Combined mouse up handler
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDrawingArrow) {
        handleFieldMouseUpArrow();
      }
      if (draggingPlayer) {
        setDraggingPlayer(null);
      }
    };
    window.addEventListener("mouseup", handleGlobalMouseUp);
    return () => window.removeEventListener("mouseup", handleGlobalMouseUp);
  }, [isDrawingArrow, draggingPlayer, handleFieldMouseUpArrow]);

  // Keyboard shortcut: Ctrl+Z for undo arrow
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        e.preventDefault();
        handleUndoArrow();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleUndoArrow, handleSave]);

  // Format relative time
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] gap-0">
      {/* Sidebar - Board List */}
      <div className="w-72 border-r border-border/50 flex flex-col bg-card/30 shrink-0">
        <div className="p-4 border-b border-border/50">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-lg font-bold text-foreground">
              My Boards
            </h2>
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1.5">
                  <Plus className="h-4 w-4" /> New
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Tactic Board</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Board Name</label>
                    <Input
                      placeholder="e.g. Match vs Barcelona"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      onKeyDown={(e) =>
                        e.key === "Enter" && handleCreateBoard()
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Formation</label>
                    <Select
                      value={newFormation}
                      onValueChange={setNewFormation}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(formations).map(([key, f]) => (
                          <SelectItem key={key} value={key}>
                            {f.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    onClick={handleCreateBoard}
                    disabled={!newTitle.trim() || createMutation.isPending}
                  >
                    {createMutation.isPending && (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    )}
                    Create Board
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2">
            {boardsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : boards.length === 0 ? (
              <div className="text-center py-8 px-4">
                <FolderOpen className="h-10 w-10 mx-auto text-muted-foreground/50 mb-2" />
                <p className="text-sm text-muted-foreground">No boards yet</p>
                <p className="text-xs text-muted-foreground/70 mt-1">
                  Create your first tactic board
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {boards.map((board) => {
                  const data = board.board_data as unknown as BoardData;
                  const formation = data?.formation || "—";
                  const isActive = board.id === activeBoardId;
                  const isDeleting = deleteConfirmId === board.id;

                  return (
                    <div
                      key={board.id}
                      className={`group relative rounded-lg p-3 cursor-pointer transition-colors ${
                        isActive
                          ? "bg-primary/10 border border-primary/30"
                          : "hover:bg-muted/50 border border-transparent"
                      }`}
                      onClick={() => {
                        if (!isDeleting) handleLoadBoard(board);
                      }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-sm font-medium truncate ${
                              isActive ? "text-primary" : "text-foreground"
                            }`}
                          >
                            {board.title}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge
                              variant="outline"
                              className="text-[10px] px-1.5 py-0"
                            >
                              {formation}
                            </Badge>
                            <span className="text-[10px] text-muted-foreground">
                              {formatTime(board.updated_at)}
                            </span>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <ChevronDown className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <DropdownMenuItem
                              onClick={() => handleDuplicate(board.id)}
                            >
                              <Copy className="h-4 w-4 mr-2" /> Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => setDeleteConfirmId(board.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {/* Delete confirmation */}
                      <AnimatePresence>
                        {isDeleting && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-2 pt-2 border-t border-border/50"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <p className="text-xs text-muted-foreground mb-2">
                              Delete this board?
                            </p>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="destructive"
                                className="h-7 text-xs flex-1"
                                onClick={() => handleDeleteBoard(board.id)}
                                disabled={deleteMutation.isPending}
                              >
                                Delete
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 text-xs flex-1"
                                onClick={() => setDeleteConfirmId(null)}
                              >
                                Cancel
                              </Button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Main content - Tactic Board */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Toolbar */}
        <div className="border-b border-border/50 px-4 py-3 flex items-center gap-3 flex-wrap">
          {/* Title */}
          <div className="flex items-center gap-2 mr-4">
            {editingTitle ? (
              <div className="flex items-center gap-1">
                <Input
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveTitle();
                    if (e.key === "Escape") setEditingTitle(false);
                  }}
                  className="h-8 w-48 text-sm"
                  autoFocus
                />
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  onClick={handleSaveTitle}
                >
                  <Check className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  onClick={() => setEditingTitle(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div
                className="flex items-center gap-1.5 cursor-pointer hover:bg-muted/50 rounded px-2 py-1 transition-colors"
                onClick={handleStartEditTitle}
              >
                <h1 className="font-display text-lg font-bold text-foreground">
                  {boardTitle}
                </h1>
                <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
            )}
            {isDirty && (
              <Badge variant="secondary" className="text-[10px]">
                Unsaved
              </Badge>
            )}
            {isSaving && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" /> Saving...
              </span>
            )}
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* Formation selector */}
          <Select
            value={boardData.formation}
            onValueChange={handleFormationChange}
          >
            <SelectTrigger className="w-32 h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(formations).map(([key, f]) => (
                <SelectItem key={key} value={key}>
                  {f.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Separator orientation="vertical" className="h-6" />

          {/* Tools */}
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant={activeTool === "move" ? "default" : "ghost"}
              className="h-8 gap-1.5 text-xs"
              onClick={() => setActiveTool("move")}
            >
              Move
            </Button>
            <Button
              size="sm"
              variant={activeTool === "arrow" ? "default" : "ghost"}
              className="h-8 gap-1.5 text-xs"
              onClick={() => setActiveTool("arrow")}
            >
              <ArrowRight className="h-3.5 w-3.5" /> Draw
            </Button>
          </div>

          {/* Arrow color picker */}
          {activeTool === "arrow" && (
            <div className="flex items-center gap-1">
              {ARROW_COLORS.map((c) => (
                <button
                  key={c.value}
                  className={`w-5 h-5 rounded-full border-2 transition-transform ${
                    arrowColor === c.value
                      ? "border-foreground scale-110"
                      : "border-transparent hover:scale-105"
                  }`}
                  style={{ backgroundColor: c.value }}
                  onClick={() => setArrowColor(c.value)}
                  title={c.label}
                />
              ))}
            </div>
          )}

          <div className="flex-1" />

          {/* Actions */}
          <Button
            size="sm"
            variant="ghost"
            className="h-8 gap-1.5 text-xs"
            onClick={handleUndoArrow}
            disabled={boardData.arrows.length === 0}
          >
            <Undo2 className="h-3.5 w-3.5" /> Undo
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 gap-1.5 text-xs"
            onClick={handleClearArrows}
            disabled={boardData.arrows.length === 0}
          >
            <X className="h-3.5 w-3.5" /> Clear Arrows
          </Button>
          <Button
            size="sm"
            className="h-8 gap-1.5"
            onClick={handleSave}
            disabled={!activeBoardId || updateMutation.isPending}
          >
            {updateMutation.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5" />
            )}
            Save
          </Button>
        </div>

        {/* Football Pitch */}
        <div className="flex-1 p-4 overflow-hidden">
          <motion.div
            className="glass-card w-full h-full relative overflow-hidden rounded-lg select-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            ref={fieldRef}
            onMouseDown={
              activeTool === "arrow" ? handleFieldMouseDown : undefined
            }
            onMouseMove={handleFieldMouseMove}
            onMouseUp={activeTool === "move" ? handleFieldMouseUp : undefined}
            style={{
              cursor:
                activeTool === "arrow"
                  ? "crosshair"
                  : draggingPlayer
                    ? "grabbing"
                    : "default",
            }}
          >
            {/* Field background */}
            <div className="absolute inset-0 bg-gradient-to-br from-green-900/80 to-green-800/60">
              {/* Field stripes */}
              <div className="absolute inset-0 flex">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div
                    key={i}
                    className={`flex-1 ${i % 2 === 0 ? "bg-green-800/10" : "bg-green-700/10"}`}
                  />
                ))}
              </div>
            </div>

            {/* Field markings */}
            <div className="absolute inset-6 sm:inset-8 border-2 border-white/40 rounded-lg">
              {/* Halfway line */}
              <div className="absolute top-0 bottom-0 left-1/2 w-px bg-white/40" />
              {/* Center circle */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 sm:w-24 sm:h-24 border-2 border-white/40 rounded-full" />
              {/* Center dot */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-white/40 rounded-full" />
              {/* Left penalty area */}
              <div className="absolute top-1/2 -translate-y-1/2 left-0 w-14 sm:w-20 h-28 sm:h-40 border-2 border-l-0 border-white/40" />
              {/* Right penalty area */}
              <div className="absolute top-1/2 -translate-y-1/2 right-0 w-14 sm:w-20 h-28 sm:h-40 border-2 border-r-0 border-white/40" />
              {/* Left goal area */}
              <div className="absolute top-1/2 -translate-y-1/2 left-0 w-6 sm:w-8 h-14 sm:h-20 border-2 border-l-0 border-white/40" />
              {/* Right goal area */}
              <div className="absolute top-1/2 -translate-y-1/2 right-0 w-6 sm:w-8 h-14 sm:h-20 border-2 border-r-0 border-white/40" />
              {/* Corner arcs */}
              <div className="absolute top-0 left-0 w-4 h-4 border-b-2 border-r-2 border-white/40 rounded-br-lg" />
              <div className="absolute top-0 right-0 w-4 h-4 border-b-2 border-l-2 border-white/40 rounded-bl-lg" />
              <div className="absolute bottom-0 left-0 w-4 h-4 border-t-2 border-r-2 border-white/40 rounded-tr-lg" />
              <div className="absolute bottom-0 right-0 w-4 h-4 border-t-2 border-l-2 border-white/40 rounded-tl-lg" />
            </div>

            {/* Arrows SVG */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none z-10"
              style={{ padding: "1.5rem" }}
            >
              <defs>
                <marker
                  id="arrowhead"
                  markerWidth="8"
                  markerHeight="6"
                  refX="8"
                  refY="3"
                  orient="auto"
                >
                  <polygon points="0 0, 8 3, 0 6" fill="currentColor" />
                </marker>
              </defs>
              {boardData.arrows.map((arrow) => (
                <line
                  key={arrow.id}
                  x1={`${arrow.startX}%`}
                  y1={`${arrow.startY}%`}
                  x2={`${arrow.endX}%`}
                  y2={`${arrow.endY}%`}
                  stroke={arrow.color}
                  strokeWidth={2.5}
                  strokeDasharray={arrow.type === "dashed" ? "8,4" : undefined}
                  markerEnd="url(#arrowhead)"
                  className="drop-shadow-lg"
                  style={{ color: arrow.color }}
                />
              ))}
              {/* Current arrow being drawn */}
              {isDrawingArrow && arrowStart && currentArrowEnd && (
                <line
                  x1={`${arrowStart.x}%`}
                  y1={`${arrowStart.y}%`}
                  x2={`${currentArrowEnd.x}%`}
                  y2={`${currentArrowEnd.y}%`}
                  stroke={arrowColor}
                  strokeWidth={2.5}
                  strokeDasharray="8,4"
                  opacity={0.7}
                  className="pointer-events-none"
                />
              )}
            </svg>

            {/* Players */}
            <div
              className="absolute inset-0 z-20"
              style={{ padding: "1.5rem" }}
            >
              {boardData.players.map((player) => {
                const isHome = player.team === "home";
                const isDragging = draggingPlayer === player.id;
                const isEditing = editingPlayer === player.id;

                return (
                  <div
                    key={player.id}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 group/player ${
                      activeTool === "move" ? "cursor-grab" : ""
                    } ${isDragging ? "cursor-grabbing z-50 scale-125" : ""}`}
                    style={{
                      left: `${player.x}%`,
                      top: `${player.y}%`,
                      transition: isDragging ? "none" : "transform 0.1s ease",
                    }}
                    onMouseDown={(e) => handlePlayerMouseDown(e, player.id)}
                  >
                    {/* Player circle */}
                    <div
                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-[8px] sm:text-[9px] font-bold shadow-lg transition-transform ${
                        isHome
                          ? "bg-blue-600 text-white hover:scale-110"
                          : "bg-red-600 text-white hover:scale-110"
                      } ${isDragging ? "ring-2 ring-white scale-110" : ""}`}
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        handleStartEditLabel(player);
                      }}
                    >
                      {isEditing ? (
                        <input
                          className="w-10 h-5 text-center text-[9px] bg-white text-black rounded px-1 border-0 outline-none"
                          value={editLabel}
                          onChange={(e) =>
                            setEditLabel(e.target.value.toUpperCase())
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSaveLabel();
                            if (e.key === "Escape") {
                              setEditingPlayer(null);
                              setEditLabel("");
                            }
                          }}
                          onBlur={handleSaveLabel}
                          autoFocus
                          onClick={(e) => e.stopPropagation()}
                          maxLength={4}
                        />
                      ) : (
                        <span className="truncate px-0.5">{player.label}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Instructions overlay */}
            {!activeBoardId && (
              <div className="absolute inset-0 flex items-center justify-center z-30">
                <div className="text-center">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-card p-6 max-w-sm"
                  >
                    <h3 className="font-display text-lg font-bold text-foreground mb-2">
                      Create or Select a Board
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Create a new tactic board from the sidebar or select an
                      existing one to start editing.
                    </p>
                  </motion.div>
                </div>
              </div>
            )}

            {/* Tool indicator */}
            <div className="absolute top-2 left-2 z-30">
              <Badge
                variant="secondary"
                className={`text-[10px] ${
                  activeTool === "arrow"
                    ? "bg-red-500/20 text-red-400"
                    : "bg-blue-500/20 text-blue-400"
                }`}
              >
                {activeTool === "move" ? "✋ Move" : "➡️ Draw Arrow"}
              </Badge>
            </div>

            {/* Help text */}
            <div className="absolute bottom-2 left-2 z-30">
              <p className="text-[10px] text-white/40">
                {activeTool === "move"
                  ? "Drag players to reposition • Double-click to rename"
                  : "Click & drag to draw arrows • Ctrl+Z to undo"}
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
