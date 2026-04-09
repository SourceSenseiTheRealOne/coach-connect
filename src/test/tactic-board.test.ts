import { describe, it, expect } from "vitest";
import { z } from "zod";
import { createDefaultBoardData, formations } from "@/hooks/use-tactic-board";
import {
    createTacticBoardSchema,
    updateTacticBoardSchema,
} from "@/shared/validators";

// ============================================================
// FORMATION DATA TESTS
// ============================================================

describe("Tactic Board - Formations", () => {
    it("should have 5 formation presets", () => {
        expect(Object.keys(formations)).toHaveLength(5);
    });

    it("should include standard formations", () => {
        expect(formations).toHaveProperty("4-3-3");
        expect(formations).toHaveProperty("4-4-2");
        expect(formations).toHaveProperty("3-5-2");
        expect(formations).toHaveProperty("4-2-3-1");
        expect(formations).toHaveProperty("4-1-4-1");
    });

    it("each formation should have 11 players", () => {
        for (const [key, formation] of Object.entries(formations)) {
            expect(formation.players).toHaveLength(11);
        }
    });

    it("each formation player should have x, y coordinates and a label", () => {
        for (const [key, formation] of Object.entries(formations)) {
            for (const player of formation.players) {
                expect(player).toHaveProperty("x");
                expect(player).toHaveProperty("y");
                expect(player).toHaveProperty("label");
                expect(typeof player.x).toBe("number");
                expect(typeof player.y).toBe("number");
                expect(typeof player.label).toBe("string");
                expect(player.x).toBeGreaterThanOrEqual(0);
                expect(player.x).toBeLessThanOrEqual(100);
                expect(player.y).toBeGreaterThanOrEqual(0);
                expect(player.y).toBeLessThanOrEqual(100);
            }
        }
    });

    it("each formation should have a GK at x=10", () => {
        for (const formation of Object.values(formations)) {
            const gk = formation.players[0];
            expect(gk.label).toBe("GK");
            expect(gk.x).toBe(10);
        }
    });
});

// ============================================================
// CREATE DEFAULT BOARD DATA TESTS
// ============================================================

describe("Tactic Board - createDefaultBoardData", () => {
    it("should create board data with 4-3-3 formation by default", () => {
        const data = createDefaultBoardData();
        expect(data.formation).toBe("4-3-3");
        expect(data.players).toHaveLength(22); // 11 home + 11 away
        expect(data.arrows).toHaveLength(0);
        expect(data.is_public).toBe(false);
    });

    it("should create board data with specified formation", () => {
        const data = createDefaultBoardData("4-4-2");
        expect(data.formation).toBe("4-4-2");
        expect(data.players).toHaveLength(22);
    });

    it("should fall back to 4-3-3 for unknown formation", () => {
        const data = createDefaultBoardData("unknown");
        expect(data.formation).toBe("4-3-3");
    });

    it("should have 11 home players and 11 away players", () => {
        const data = createDefaultBoardData();
        const homePlayers = data.players.filter((p) => p.team === "home");
        const awayPlayers = data.players.filter((p) => p.team === "away");
        expect(homePlayers).toHaveLength(11);
        expect(awayPlayers).toHaveLength(11);
    });

    it("should have unique IDs for all players", () => {
        const data = createDefaultBoardData();
        const ids = data.players.map((p) => p.id);
        const uniqueIds = new Set(ids);
        expect(uniqueIds.size).toBe(ids.length);
    });

    it("home players should have IDs starting with 'home-'", () => {
        const data = createDefaultBoardData();
        const homePlayers = data.players.filter((p) => p.team === "home");
        for (const p of homePlayers) {
            expect(p.id).toMatch(/^home-\d+$/);
        }
    });

    it("away players should have IDs starting with 'away-'", () => {
        const data = createDefaultBoardData();
        const awayPlayers = data.players.filter((p) => p.team === "away");
        for (const p of awayPlayers) {
            expect(p.id).toMatch(/^away-\d+$/);
        }
    });

    it("each player should have all required properties", () => {
        const data = createDefaultBoardData();
        for (const player of data.players) {
            expect(player).toHaveProperty("id");
            expect(player).toHaveProperty("x");
            expect(player).toHaveProperty("y");
            expect(player).toHaveProperty("label");
            expect(player).toHaveProperty("team");
            expect(["home", "away"]).toContain(player.team);
        }
    });
});

// ============================================================
// VALIDATOR TESTS
// ============================================================

describe("Tactic Board - Validators", () => {
    it("createTacticBoardSchema should validate valid input", () => {
        const validInput = {
            title: "My Tactic Board",
            board_data: { formation: "4-3-3", players: [] },
            animation_data: null,
            thumbnail_url: null,
        };
        const result = createTacticBoardSchema.safeParse(validInput);
        expect(result.success).toBe(true);
    });

    it("createTacticBoardSchema should reject empty title", () => {
        const invalidInput = {
            title: "",
            board_data: { formation: "4-3-3" },
            animation_data: null,
            thumbnail_url: null,
        };
        const result = createTacticBoardSchema.safeParse(invalidInput);
        expect(result.success).toBe(false);
    });

    it("createTacticBoardSchema should reject title under 3 chars", () => {
        const invalidInput = {
            title: "AB",
            board_data: { formation: "4-3-3" },
            animation_data: null,
            thumbnail_url: null,
        };
        const result = createTacticBoardSchema.safeParse(invalidInput);
        expect(result.success).toBe(false);
    });

    it("createTacticBoardSchema should reject title over 200 chars", () => {
        const invalidInput = {
            title: "A".repeat(201),
            board_data: { formation: "4-3-3" },
            animation_data: null,
            thumbnail_url: null,
        };
        const result = createTacticBoardSchema.safeParse(invalidInput);
        expect(result.success).toBe(false);
    });

    it("createTacticBoardSchema should validate with valid thumbnail URL", () => {
        const validInput = {
            title: "My Board",
            board_data: {},
            animation_data: null,
            thumbnail_url: "https://example.com/thumb.png",
        };
        const result = createTacticBoardSchema.safeParse(validInput);
        expect(result.success).toBe(true);
    });

    it("createTacticBoardSchema should reject invalid thumbnail URL", () => {
        const invalidInput = {
            title: "My Board",
            board_data: {},
            animation_data: null,
            thumbnail_url: "not-a-url",
        };
        const result = createTacticBoardSchema.safeParse(invalidInput);
        expect(result.success).toBe(false);
    });

    it("updateTacticBoardSchema should accept partial updates", () => {
        const partialTitle = { title: "Updated Title" };
        const result1 = updateTacticBoardSchema.safeParse(partialTitle);
        expect(result1.success).toBe(true);

        const partialBoard = {
            board_data: { formation: "4-4-2", players: [] },
        };
        const result2 = updateTacticBoardSchema.safeParse(partialBoard);
        expect(result2.success).toBe(true);
    });

    it("updateTacticBoardSchema should accept empty object", () => {
        const result = updateTacticBoardSchema.safeParse({});
        expect(result.success).toBe(true);
    });
});