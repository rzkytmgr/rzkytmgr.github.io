import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { metaImagePath } from "@/lib/meta/image-paths";
import { truncate } from "@/lib/utils/text";

const distDir = path.resolve(__dirname, "../../..", "dist");
const hasDist = existsSync(path.join(distDir, "assets", "meta", "index.jpg"));

function htmlFiles(dir: string): string[] {
    return readdirSync(dir).flatMap((name) => {
        const full = path.join(dir, name);

        if (statSync(full).isDirectory()) {
            return htmlFiles(full);
        }

        return name.endsWith(".html") ? [full] : [];
    });
}

function jpegSize(file: string) {
    const data = readFileSync(file);
    const isJpeg = data[0] === 0xff && data[1] === 0xd8;
    const startOfFrame = [
        0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce,
        0xcf,
    ];
    let offset = 2;

    while (isJpeg && offset < data.length) {
        const marker = data[offset + 1];

        if (startOfFrame.includes(marker)) {
            return {
                isJpeg,
                width: data.readUInt16BE(offset + 7),
                height: data.readUInt16BE(offset + 5),
            };
        }

        offset += 2 + data.readUInt16BE(offset + 2);
    }

    return { isJpeg, width: 0, height: 0 };
}

describe("metaImagePath", () => {
    it("maps page URLs to their generated image", () => {
        expect(metaImagePath("/")).toBe("/assets/meta/index.jpg");
        expect(metaImagePath("/about")).toBe("/assets/meta/about.jpg");
        expect(metaImagePath("/blog/")).toBe("/assets/meta/blog.jpg");
        expect(metaImagePath("/blog/some-post/")).toBe(
            "/assets/meta/blog/some-post.jpg",
        );
        expect(metaImagePath("/404.html")).toBe("/assets/meta/404.jpg");
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

describe.skipIf(!hasDist)("generated meta images (bundled)", () => {
    const pages = htmlFiles(distDir);

    it("covers every page with its own 1200×630 JPEG", () => {
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
            expect(jpegSize(file)).toEqual({
                isJpeg: true,
                width: 1200,
                height: 630,
            });

            images.add(url.pathname);
        }

        expect(images.size).toBe(pages.length);
    });
});
