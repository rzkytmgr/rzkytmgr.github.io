import { describe, expect, it } from "vitest";
import { isNavActive, NAV_ITEMS } from "@/src/navigation";

describe("isNavActive", () => {
    it("matches home only on the root path", () => {
        expect(isNavActive("/", "/")).toBe(true);
        expect(isNavActive("/", "/blog/")).toBe(false);
    });

    it("matches a section and every page inside it", () => {
        expect(isNavActive("/blog/", "/blog/")).toBe(true);
        expect(isNavActive("/blog/", "/blog/some-post/")).toBe(true);
        expect(isNavActive("/blog/", "/blog")).toBe(true);
        expect(isNavActive("/blog/", "/bookmarks/")).toBe(false);
    });

    it("uses trailing slashes for every navigation link", () => {
        expect(NAV_ITEMS.every(({ href }) => href.endsWith("/"))).toBe(true);
    });
});
