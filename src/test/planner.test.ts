import { describe, it, expect } from "vitest";
import {
    getWeekDates,
    formatDate,
    formatWeekRange,
    getWeekNumber,
    calculateDuration,
} from "@/hooks/use-planner";

// ============================================================
// GET WEEK DATES TESTS
// ============================================================

describe("Planner - getWeekDates", () => {
    it("should return 7 dates", () => {
        const dates = getWeekDates(0);
        expect(dates).toHaveLength(7);
    });

    it("should return dates starting from Monday", () => {
        const dates = getWeekDates(0);
        const monday = dates[0];
        // Monday is day 1 (0 = Sunday)
        expect(monday.getDay()).toBe(1);
    });

    it("should return consecutive dates", () => {
        const dates = getWeekDates(0);
        for (let i = 1; i < 7; i++) {
            const diff = dates[i].getTime() - dates[i - 1].getTime();
            const oneDay = 24 * 60 * 60 * 1000;
            expect(diff).toBe(oneDay);
        }
    });

    it("should offset by weeks correctly", () => {
        const thisWeek = getWeekDates(0);
        const nextWeek = getWeekDates(1);
        const diff = nextWeek[0].getTime() - thisWeek[0].getTime();
        const oneWeek = 7 * 24 * 60 * 60 * 1000;
        expect(diff).toBe(oneWeek);
    });

    it("should handle negative offsets (previous weeks)", () => {
        const thisWeek = getWeekDates(0);
        const lastWeek = getWeekDates(-1);
        const diff = thisWeek[0].getTime() - lastWeek[0].getTime();
        const oneWeek = 7 * 24 * 60 * 60 * 1000;
        expect(diff).toBe(oneWeek);
    });

    it("each date should have time set to midnight", () => {
        const dates = getWeekDates(0);
        for (const date of dates) {
            expect(date.getHours()).toBe(0);
            expect(date.getMinutes()).toBe(0);
            expect(date.getSeconds()).toBe(0);
            expect(date.getMilliseconds()).toBe(0);
        }
    });
});

// ============================================================
// FORMAT DATE TESTS
// ============================================================

describe("Planner - formatDate", () => {
    it("should format a date as YYYY-MM-DD", () => {
        const date = new Date(2026, 0, 15); // Jan 15, 2026
        const result = formatDate(date);
        expect(result).toBe("2026-01-15");
    });

    it("should pad single-digit months and days", () => {
        const date = new Date(2026, 2, 5); // Mar 5, 2026
        const result = formatDate(date);
        expect(result).toBe("2026-03-05");
    });

    it("should handle December 31", () => {
        const date = new Date(2026, 11, 31);
        const result = formatDate(date);
        expect(result).toBe("2026-12-31");
    });
});

// ============================================================
// FORMAT WEEK RANGE TESTS
// ============================================================

describe("Planner - formatWeekRange", () => {
    it("should return empty string for empty array", () => {
        expect(formatWeekRange([])).toBe("");
    });

    it("should format a week range with month day - month day, year", () => {
        // Create a known week
        const dates: Date[] = [];
        for (let i = 0; i < 7; i++) {
            dates.push(new Date(2026, 0, 5 + i)); // Jan 5-11, 2026
        }
        const result = formatWeekRange(dates);
        expect(result).toContain("Jan 5");
        expect(result).toContain("Jan 11");
        expect(result).toContain("2026");
    });
});

// ============================================================
// GET WEEK NUMBER TESTS
// ============================================================

describe("Planner - getWeekNumber", () => {
    it("should return 1 for empty array", () => {
        expect(getWeekNumber([])).toBe(1);
    });

    it("should return a number between 1 and 53", () => {
        const dates = getWeekDates(0);
        const weekNum = getWeekNumber(dates);
        expect(weekNum).toBeGreaterThanOrEqual(1);
        expect(weekNum).toBeLessThanOrEqual(53);
    });
});

// ============================================================
// CALCULATE DURATION TESTS
// ============================================================

describe("Planner - calculateDuration", () => {
    it("should return empty string when start time is null", () => {
        expect(calculateDuration(null, "11:30")).toBe("");
    });

    it("should return empty string when end time is null", () => {
        expect(calculateDuration("10:00", null)).toBe("");
    });

    it("should calculate duration correctly for 90 minutes", () => {
        expect(calculateDuration("10:00", "11:30")).toBe("90min");
    });

    it("should calculate duration correctly for 60 minutes", () => {
        expect(calculateDuration("10:00", "11:00")).toBe("60min");
    });

    it("should calculate duration correctly for 45 minutes", () => {
        expect(calculateDuration("10:00", "10:45")).toBe("45min");
    });

    it("should return empty string when end is before start", () => {
        expect(calculateDuration("11:30", "10:00")).toBe("");
    });

    it("should return empty string when times are equal", () => {
        expect(calculateDuration("10:00", "10:00")).toBe("");
    });

    it("should handle cross-hour durations", () => {
        expect(calculateDuration("09:30", "11:15")).toBe("105min");
    });

    it("should handle short durations", () => {
        expect(calculateDuration("10:00", "10:15")).toBe("15min");
    });
});