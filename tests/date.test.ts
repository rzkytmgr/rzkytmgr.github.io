import { describe, expect, it } from "vitest";
import { parsePublishDate, toIsoDate } from "@/src/utils/date";

describe("parsePublishDate", () => {
    it("splits a publish date into month, day and year", () => {
        expect(parsePublishDate("Oct 30, 2026")).toEqual({
            month: "Oct",
            day: "30",
            year: "2026",
            label: "Oct 30",
            full: "30 Oct 2026",
        });
    });

    it("keeps the day unpadded in the compact label but padded in full", () => {
        expect(parsePublishDate("Feb 10, 2026").day).toBe("10");
        expect(parsePublishDate("Mar 7, 2025").day).toBe("7");
        expect(parsePublishDate("Mar 7, 2025").full).toBe("07 Mar 2025");
    });

    it("keeps a stable result regardless of the host timezone", () => {
        expect(parsePublishDate("Dec 31, 2024")).toEqual({
            month: "Dec",
            day: "31",
            year: "2024",
            label: "Dec 31",
            full: "31 Dec 2024",
        });
    });

    it("falls back to the raw value when the date cannot be parsed", () => {
        expect(parsePublishDate("someday")).toEqual({
            month: "someday",
            day: "",
            year: "",
            label: "someday",
            full: "someday",
        });
    });
});

describe("toIsoDate", () => {
    it("converts publish dates to ISO 8601 calendar dates", () => {
        expect(toIsoDate("Oct 30, 2026")).toBe("2026-10-30");
        expect(toIsoDate("Mar 7, 2025")).toBe("2025-03-07");
        expect(toIsoDate("December 1, 2024")).toBe("2024-12-01");
    });

    it("returns null for dates it cannot read", () => {
        expect(toIsoDate("soon")).toBeNull();
        expect(toIsoDate("Foo 10, 2026")).toBeNull();
        expect(toIsoDate("Oct 40, 2026")).toBeNull();
    });
});
