import { describe, it, expect } from "vitest";
import {
    formatMessageTime,
    formatConversationTime,
    getInitials,
    messagingKeys,
} from "@/hooks/use-messaging";

// ============================================================
// FORMAT MESSAGE TIME TESTS
// ============================================================

describe("Messaging - formatMessageTime", () => {
    it("should format a date string as HH:MM", () => {
        const date = new Date(2026, 0, 15, 14, 30);
        const result = formatMessageTime(date.toISOString());
        expect(result).toBe("14:30");
    });

    it("should pad single-digit hours and minutes", () => {
        const date = new Date(2026, 0, 15, 9, 5);
        const result = formatMessageTime(date.toISOString());
        expect(result).toBe("09:05");
    });

    it("should handle midnight", () => {
        const date = new Date(2026, 0, 15, 0, 0);
        const result = formatMessageTime(date.toISOString());
        expect(result).toBe("00:00");
    });

    it("should handle end of day", () => {
        const date = new Date(2026, 0, 15, 23, 59);
        const result = formatMessageTime(date.toISOString());
        expect(result).toBe("23:59");
    });
});

// ============================================================
// FORMAT CONVERSATION TIME TESTS
// ============================================================

describe("Messaging - formatConversationTime", () => {
    it("should return 'now' for less than 1 minute ago", () => {
        const date = new Date(Date.now() - 30 * 1000);
        const result = formatConversationTime(date.toISOString());
        expect(result).toBe("now");
    });

    it("should return minutes for less than 60 minutes ago", () => {
        const date = new Date(Date.now() - 15 * 60 * 1000);
        const result = formatConversationTime(date.toISOString());
        expect(result).toBe("15m");
    });

    it("should return hours for less than 24 hours ago", () => {
        const date = new Date(Date.now() - 3 * 60 * 60 * 1000);
        const result = formatConversationTime(date.toISOString());
        expect(result).toBe("3h");
    });

    it("should return days for less than 7 days ago", () => {
        const date = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
        const result = formatConversationTime(date.toISOString());
        expect(result).toBe("3d");
    });

    it("should return formatted date for more than 7 days ago", () => {
        const date = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
        const result = formatConversationTime(date.toISOString());
        // Should return a date string (format varies by locale)
        expect(result).toBeTruthy();
        expect(result).not.toBe("now");
        expect(result).not.toMatch(/^\d+m$/);
        expect(result).not.toMatch(/^\d+h$/);
        expect(result).not.toMatch(/^\d+d$/);
    });

    it("should return '1m' for exactly 1 minute ago", () => {
        const date = new Date(Date.now() - 60 * 1000);
        const result = formatConversationTime(date.toISOString());
        expect(result).toBe("1m");
    });

    it("should return '1h' for exactly 1 hour ago", () => {
        const date = new Date(Date.now() - 60 * 60 * 1000);
        const result = formatConversationTime(date.toISOString());
        expect(result).toBe("1h");
    });

    it("should return '1d' for exactly 1 day ago", () => {
        const date = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const result = formatConversationTime(date.toISOString());
        expect(result).toBe("1d");
    });
});

// ============================================================
// GET INITIALS TESTS
// ============================================================

describe("Messaging - getInitials", () => {
    it("should return initials for a full name", () => {
        expect(getInitials("João Silva")).toBe("JS");
    });

    it("should return initials for a three-word name", () => {
        expect(getInitials("Maria Santos Costa")).toBe("MS");
    });

    it("should return uppercase initials", () => {
        expect(getInitials("pedro costa")).toBe("PC");
    });

    it("should handle single name", () => {
        expect(getInitials("João")).toBe("J");
    });

    it("should handle empty string", () => {
        expect(getInitials("")).toBe("");
    });

    it("should handle name with extra spaces", () => {
        expect(getInitials("  Ana  Ferreira  ")).toBe("AF");
    });

    it("should truncate to max 2 characters", () => {
        expect(getInitials("João Pedro Miguel")).toBe("JP");
    });
});

// ============================================================
// MESSAGING KEYS TESTS
// ============================================================

describe("Messaging - messagingKeys", () => {
    it("should have correct 'all' key", () => {
        expect(messagingKeys.all).toEqual(["messaging"]);
    });

    it("should have correct 'conversations' key", () => {
        expect(messagingKeys.conversations()).toEqual([
            "messaging",
            "conversations",
        ]);
    });

    it("should have correct 'messages' key with conversation ID", () => {
        expect(messagingKeys.messages("conv-123")).toEqual([
            "messaging",
            "messages",
            "conv-123",
        ]);
    });

    it("should generate unique keys for different conversation IDs", () => {
        const key1 = messagingKeys.messages("conv-1");
        const key2 = messagingKeys.messages("conv-2");
        expect(key1).not.toEqual(key2);
    });
});