import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { ogImagePath } from "@/src/og/paths";
import { titleSize } from "@/src/og/render";
import { truncate } from "@/src/utils/text";

const distDir = path.resolve(__dirname, "..", "dist");
const hasDist = existsSync(path.join(distDir, "og", "index.png"));

function htmlFiles(dir: string): string[] {
    return readdirSync(dir).flatMap((name) => {
        const full = path.join(dir, name);

        if (statSync(full).isDirectory()) {
            return htmlFiles(full);
        }

        return name.endsWith(".html") ? [full] : [];
    });
}

function pngSize(file: string) {
    const data = readFileSync(file);

    return {
        isPng: data.subarray(1, 4).toString() === "PNG",
        width: data.readUInt32BE(16),
        height: data.readUInt32BE(20),
    };
}

describe("ogImagePath", () => {
    it("maps page URLs to their generated image", () => {
        expect(ogImagePath("/")).toBe("/og/index.png");
        expect(ogImagePath("/about")).toBe("/og/about.png");
        expect(ogImagePath("/blog/")).toBe("/og/blog.png");
        expect(ogImagePath("/blog/some-post/")).toBe("/og/blog/some-post.png");
        expect(ogImagePath("/404.html")).toBe("/og/404.png");
    });
});

describe("truncate", () => {
    it("keeps short text untouched", () => {
        expect(truncate("Short text", 20)).toBe("Short text");
    });

    it("cuts long text at a word boundary with an ellipsis", () => {
        const result = truncate("one two three four five six", 15);

        expect(result).toBe("one two three…");
        expect(result.length).toBeLessThanOrEqual(15);
    });
});

describe("titleSize", () => {
    it("shrinks the font as the title grows", () => {
        const sizes = [20, 50, 75, 110].map((length) =>
            titleSize("x".repeat(length)),
        );

        expect(sizes).toEqual([...sizes].sort((a, b) => b - a));
        expect(new Set(sizes).size).toBe(4);
    });
});

describe.skipIf(!hasDist)("generated Open Graph images (bundled)", () => {
    const pages = htmlFiles(distDir);

    it("covers every page with its own 1200×630 PNG", () => {
        const images = new Set<string>();

        expect(pages.length).toBeGreaterThan(0);

        for (const page of pages) {
            const html = readFileSync(page, "utf8");
            const match = html.match(
                /<meta property="og:image" content="([^"]+)"/,
            );

            expect(match, `og:image in ${page}`).toBeTruthy();

            const url = new URL(match![1]);
            const file = path.join(distDir, url.pathname);

            expect(url.origin).toBe("https://rzkytmgr.github.io");
            expect(existsSync(file), `${url.pathname} for ${page}`).toBe(true);
            expect(pngSize(file)).toEqual({
                isPng: true,
                width: 1200,
                height: 630,
            });

            images.add(url.pathname);
        }

        expect(images.size).toBe(pages.length);
    });
});
