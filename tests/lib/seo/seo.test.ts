import {
    existsSync,
    mkdirSync,
    mkdtempSync,
    readdirSync,
    readFileSync,
    rmSync,
    statSync,
    writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { contentLastModified } from "@/lib/seo/content-dates";

const SITE = "https://rzkytmgr.github.io";
const distDir = path.resolve(__dirname, "../../..", "dist");
const hasDist = existsSync(path.join(distDir, "index.html"));
const NOINDEX = new Set(["/bookmarks/", "/404.html"]);

function htmlFiles(dir: string): string[] {
    return readdirSync(dir).flatMap((name) => {
        const full = path.join(dir, name);

        if (statSync(full).isDirectory()) {
            return htmlFiles(full);
        }

        return name.endsWith(".html") ? [full] : [];
    });
}

function routeOf(file: string): string {
    const relative = path.relative(distDir, file).split(path.sep).join("/");

    return relative.endsWith("index.html")
        ? `/${relative.slice(0, -"index.html".length)}`
        : `/${relative}`;
}

function read(html: string, pattern: RegExp): string | undefined {
    return pattern.exec(html)?.[1];
}

const FIXTURES: Record<string, Record<string, string>> = {
    writeups: {
        "20240105_older-post.mdx": 'slug: older-post\ndate: "Jan 05, 2024"',
        "20250318_newer-post.mdx": 'slug: newer-post\ndate: "Mar 18, 2025"',
        "20250401_undated-post.mdx": "slug: undated-post",
        "notes.txt": 'slug: not-an-article\ndate: "Dec 31, 2025"',
    },
    showcase: {
        "20250702_some-project.mdx": 'slug: some-project\ndate: "Jul 02, 2025"',
    },
    laboratory: {
        "20250211_some-experiment.mdx":
            'slug: some-experiment\ndate: "Feb 11, 2025"',
    },
};

describe("contentLastModified", () => {
    let contentDir: string;
    let dates: Map<string, string>;

    beforeAll(() => {
        contentDir = mkdtempSync(path.join(tmpdir(), "content-dates-"));

        for (const [folder, files] of Object.entries(FIXTURES)) {
            mkdirSync(path.join(contentDir, folder));

            for (const [name, frontmatter] of Object.entries(files)) {
                writeFileSync(
                    path.join(contentDir, folder, name),
                    `---\n${frontmatter}\n---\n\nBody.\n`,
                );
            }
        }

        dates = contentLastModified(contentDir);
    });

    afterAll(() => {
        rmSync(contentDir, { recursive: true, force: true });
    });

    it("dates every article from its frontmatter", () => {
        expect(dates.get("/blog/older-post/")).toBe("2024-01-05");
        expect(dates.get("/blog/newer-post/")).toBe("2025-03-18");
        expect(dates.get("/lab/some-experiment/")).toBe("2025-02-11");
    });

    it("skips entries without a date and non-MDX files", () => {
        expect(dates.has("/blog/undated-post/")).toBe(false);
        expect(dates.has("/blog/not-an-article/")).toBe(false);
    });

    it("dates listings and home by their newest entry", () => {
        expect(dates.get("/blog/")).toBe("2025-03-18");
        expect(dates.get("/lab/")).toBe("2025-02-11");
        expect(dates.get("/showcase/")).toBe("2025-07-02");
        expect(dates.get("/")).toBe("2025-07-02");
    });
});

describe.skipIf(!hasDist)("SEO metadata (bundled)", () => {
    const pages = htmlFiles(distDir).map((file) => ({
        route: routeOf(file),
        html: readFileSync(file, "utf8"),
    }));

    it("gives every page a unique, branded title", () => {
        const titles = pages.map(({ route, html }) => {
            const title = read(html, /<title>([^<]*)<\/title>/)!;

            if (route === "/") {
                expect(title.startsWith("rzkytmgr — ")).toBe(true);
            } else {
                expect(title.endsWith(" · rzkytmgr"), route).toBe(true);
            }

            return title;
        });

        expect(new Set(titles).size).toBe(titles.length);
    });

    it("keeps meta descriptions within 160 characters", () => {
        for (const { route, html } of pages) {
            const description = read(
                html,
                /<meta name="description" content="([^"]*)"/,
            );

            expect(description, route).toBeTruthy();
            expect(description!.length, route).toBeLessThanOrEqual(160);
        }
    });

    it("canonicalises indexable pages and noindexes the rest", () => {
        for (const { route, html } of pages) {
            const canonical = read(
                html,
                /<link rel="canonical" href="([^"]*)"/,
            );
            const robots = read(html, /<meta name="robots" content="([^"]*)"/);

            if (NOINDEX.has(route)) {
                expect(robots, route).toContain("noindex");
                expect(canonical, route).toBeUndefined();
            } else {
                expect(robots, route).toBeUndefined();
                expect(canonical, route).toBe(`${SITE}${route}`);
            }
        }
    });

    it("marks articles up as articles with structured data", () => {
        for (const { route, html } of pages) {
            const section = /^\/(blog|lab|showcase)\/[^/]+\/$/.exec(route)?.[1];
            const ldJson = read(
                html,
                /<script type="application\/ld\+json">([\s\S]*?)<\/script>/,
            );

            if (!section) {
                continue;
            }

            const data = JSON.parse(ldJson!);

            expect(
                read(html, /<meta property="og:type" content="([^"]*)"/),
            ).toBe("article");
            expect(data["@type"]).toBe(
                section === "blog" ? "BlogPosting" : "Article",
            );
            expect(data.datePublished).toMatch(/^\d{4}-\d{2}-\d{2}$/);
            expect(data.url).toBe(`${SITE}${route}`);
            expect(html).toContain('property="article:published_time"');
        }
    });

    it("describes the site and its author on the home page", () => {
        const home = pages.find(({ route }) => route === "/")!;
        const data = JSON.parse(
            read(
                home.html,
                /<script type="application\/ld\+json">([\s\S]*?)<\/script>/,
            )!,
        );

        expect(data.map((item: { "@type": string }) => item["@type"])).toEqual([
            "WebSite",
            "Person",
        ]);
    });

    it("links internal pages with trailing slashes", () => {
        for (const { route, html } of pages) {
            const links = [...html.matchAll(/href="(\/[^"#?]*)"/g)].map(
                (match) => match[1],
            );
            const pageLinks = links.filter(
                (href) => !/\.[a-z0-9]+$/i.test(href),
            );

            for (const href of pageLinks) {
                expect(href.endsWith("/"), `${href} on ${route}`).toBe(true);
            }
        }
    });

    it("points robots.txt at a sitemap that exists and is complete", () => {
        const robots = readFileSync(path.join(distDir, "robots.txt"), "utf8");
        const sitemap = readFileSync(
            path.join(distDir, "sitemap-0.xml"),
            "utf8",
        );
        const entries = [
            ...sitemap.matchAll(
                /<url><loc>([^<]+)<\/loc>(<lastmod>[^<]+<\/lastmod>)?/g,
            ),
        ];

        expect(robots).toContain(`Sitemap: ${SITE}/sitemap-index.xml`);
        expect(existsSync(path.join(distDir, "sitemap-index.xml"))).toBe(true);
        expect(sitemap).not.toContain("/bookmarks/");

        for (const [, loc, lastmod] of entries) {
            if (/\/(blog|lab|showcase)\/[^/]+\/$/.test(loc)) {
                expect(lastmod, loc).toBeTruthy();
            }
        }
    });
});
