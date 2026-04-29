import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { trpc } from "@/lib/trpc";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import type { TacticBoard } from "@/shared/types";
import { useCallback, useRef } from "react";

// ============================================================
// TYPES
// ============================================================

export interface PlayerPosition {
    id: string;
    x: number; // percentage 0-100
    y: number; // percentage 0-100
    label: string;
    team: "home" | "away";
}

export interface Arrow {
    id: string;
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    color: string;
    type: "solid" | "dashed" | "curved";
}

export interface BoardData {
    formation: string;
    players: PlayerPosition[];
    arrows: Arrow[];
    is_public: boolean;
}

// ============================================================
// FORMATION PRESETS
// ============================================================

export const formations: Record<string, { label: string; players: Omit<PlayerPosition, "id" | "team">[] }> = {
    "4-3-3": {
        label: "4-3-3",
        players: [
            { x: 10, y: 50, label: "GK" },
            { x: 25, y: 15, label: "LB" },
            { x: 25, y: 38, label: "CB" },
            { x: 25, y: 62, label: "CB" },
            { x: 25, y: 85, label: "RB" },
            { x: 45, y: 25, label: "CM" },
            { x: 45, y: 50, label: "CM" },
            { x: 45, y: 75, label: "CM" },
            { x: 70, y: 15, label: "LW" },
            { x: 75, y: 50, label: "ST" },
            { x: 70, y: 85, label: "RW" },
        ],
    },
    "4-4-2": {
        label: "4-4-2",
        players: [
            { x: 10, y: 50, label: "GK" },
            { x: 25, y: 15, label: "LB" },
            { x: 25, y: 38, label: "CB" },
            { x: 25, y: 62, label: "CB" },
            { x: 25, y: 85, label: "RB" },
            { x: 50, y: 15, label: "LM" },
            { x: 50, y: 38, label: "CM" },
            { x: 50, y: 62, label: "CM" },
            { x: 50, y: 85, label: "RM" },
            { x: 75, y: 38, label: "ST" },
            { x: 75, y: 62, label: "ST" },
        ],
    },
    "3-5-2": {
        label: "3-5-2",
        players: [
            { x: 10, y: 50, label: "GK" },
            { x: 25, y: 25, label: "CB" },
            { x: 25, y: 50, label: "CB" },
            { x: 25, y: 75, label: "CB" },
            { x: 45, y: 10, label: "LWB" },
            { x: 45, y: 35, label: "CM" },
            { x: 45, y: 50, label: "CM" },
            { x: 45, y: 65, label: "CM" },
            { x: 45, y: 90, label: "RWB" },
            { x: 70, y: 38, label: "ST" },
            { x: 70, y: 62, label: "ST" },
        ],
    },
    "4-2-3-1": {
        label: "4-2-3-1",
        players: [
            { x: 10, y: 50, label: "GK" },
            { x: 25, y: 15, label: "LB" },
            { x: 25, y: 38, label: "CB" },
            { x: 25, y: 62, label: "CB" },
            { x: 25, y: 85, label: "RB" },
            { x: 42, y: 38, label: "CDM" },
            { x: 42, y: 62, label: "CDM" },
            { x: 60, y: 15, label: "LW" },
            { x: 60, y: 50, label: "CAM" },
            { x: 60, y: 85, label: "RW" },
            { x: 78, y: 50, label: "ST" },
        ],
    },
    "4-1-4-1": {
        label: "4-1-4-1",
        players: [
            { x: 10, y: 50, label: "GK" },
            { x: 25, y: 15, label: "LB" },
            { x: 25, y: 38, label: "CB" },
            { x: 25, y: 62, label: "CB" },
            { x: 25, y: 85, label: "RB" },
            { x: 40, y: 50, label: "CDM" },
            { x: 55, y: 15, label: "LM" },
            { x: 55, y: 38, label: "CM" },
            { x: 55, y: 62, label: "CM" },
            { x: 55, y: 85, label: "RM" },
            { x: 78, y: 50, label: "ST" },
        ],
    },
};

const OPPOSING_FORMATION: Omit<PlayerPosition, "id" | "team">[] = [
    { x: 90, y: 50, label: "GK" },
    { x: 75, y: 85, label: "LB" },
    { x: 75, y: 62, label: "CB" },
    { x: 75, y: 38, label: "CB" },
    { x: 75, y: 15, label: "RB" },
    { x: 55, y: 75, label: "CM" },
    { x: 55, y: 50, label: "CM" },
    { x: 55, y: 25, label: "CM" },
    { x: 35, y: 85, label: "LW" },
    { x: 30, y: 50, label: "ST" },
    { x: 35, y: 15, label: "RW" },
];

// ============================================================
// HELPER: CREATE BOARD DATA
// ============================================================

export function createDefaultBoardData(formation: string = "4-3-3"): BoardData {
    const resolvedFormation = formations[formation] ? formation : "4-3-3";
    const formationData = formations[resolvedFormation];
    const homePlayers: PlayerPosition[] = formationData.players.map((p, i) => ({
        ...p,
        id: `home-${i}`,
        team: "home" as const,
    }));
    const awayPlayers: PlayerPosition[] = OPPOSING_FORMATION.map((p, i) => ({
        ...p,
        id: `away-${i}`,
        team: "away" as const,
    }));

    return {
        formation: resolvedFormation,
        players: [...homePlayers, ...awayPlayers],
        arrows: [],
        is_public: false,
    };
}

// ============================================================
// QUERY KEYS
// ============================================================

const tacticBoardKeys = {
    all: ["tacticBoards"] as const,
    lists: () => [...tacticBoardKeys.all, "list"] as const,
    detail: (id: string) => [...tacticBoardKeys.all, "detail", id] as const,
};

// ============================================================
// HOOKS
// ============================================================

/**
 * Hook to fetch all tactic boards for the current user
 */
export function useTacticBoards() {
    const { user } = useAuth();

    return trpc.tacticBoard.list.useQuery(undefined, {
        enabled: !!user,
        staleTime: 30 * 1000,
    });
}
/**
 * Hook to fetch a single tactic board by ID
 */
export function useTacticBoard(id: string | null) {
    return trpc.tacticBoard.getById.useQuery(id || "", {
        enabled: !!id,
        staleTime: 30 * 1000,
    });
}

/**
 * Hook to create a new tactic board
 */
export function useCreateTacticBoard() {
    const queryClient = useQueryClient();

    return trpc.tacticBoard.create.useMutation({
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: tacticBoardKeys.all });
        },
    });
}

/**
 * Hook to update a tactic board
 */
export function useUpdateTacticBoard() {
    const queryClient = useQueryClient();

    return trpc.tacticBoard.update.useMutation({
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: tacticBoardKeys.all });
            queryClient.invalidateQueries({ queryKey: tacticBoardKeys.detail(data.id) });
        },
    });
}

/**
 * Hook to delete a tactic board
 */
export function useDeleteTacticBoard() {
    const queryClient = useQueryClient();

    return trpc.tacticBoard.delete.useMutation({
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: tacticBoardKeys.all });
        },
    });
}

// ============================================================
// AUTO-SAVE HOOK
// ============================================================

/**
 * Hook that provides debounced auto-save for tactic boards
 */
export function useAutoSave(boardId: string | null) {
    const updateMutation = useUpdateTacticBoard();
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const save = useCallback(
        (boardData: BoardData) => {
            if (!boardId) return;

            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }

            timeoutRef.current = setTimeout(() => {
                updateMutation.mutate({ id: boardId, board_data: boardData as unknown as Record<string, unknown> });
            }, 1500);
        },
        [boardId, updateMutation]
    );

    const saveNow = useCallback(
        (boardData: BoardData) => {
            if (!boardId) return;
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
            updateMutation.mutate({ id: boardId, board_data: boardData as unknown as Record<string, unknown> });
        },
        [boardId, updateMutation]
    );

    return { save, saveNow, isSaving: updateMutation.isPending };
}

// ============================================================
// REAL-TIME SUBSCRIPTION
// ============================================================

export function useTacticBoardRealtime() {
    const queryClient = useQueryClient();

    const setupSubscription = useCallback(() => {
        const channel = supabase
            .channel("tactic-boards-realtime")
            .on(
                "postgres_changes",
                { event: "INSERT", schema: "public", table: "tactic_boards" },
                () => {
                    queryClient.invalidateQueries({ queryKey: tacticBoardKeys.all });
                }
            )
            .on(
                "postgres_changes",
                { event: "UPDATE", schema: "public", table: "tactic_boards" },
                () => {
                    queryClient.invalidateQueries({ queryKey: tacticBoardKeys.all });
                }
            )
            .on(
                "postgres_changes",
                { event: "DELETE", schema: "public", table: "tactic_boards" },
                () => {
                    queryClient.invalidateQueries({ queryKey: tacticBoardKeys.all });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [queryClient]);

    return setupSubscription;
}