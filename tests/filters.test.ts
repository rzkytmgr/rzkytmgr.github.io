import { readFileSync } from "node:fs";
import path from "node:path";
import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { Window } from "happy-dom";
import type { HTMLElement, HTMLInputElement } from "happy-dom";

const distDir = path.resolve(__dirname, "..", "dist");

function loadPage(pagePath: string) {
    const html = readFileSync(path.join(distDir, pagePath), "utf8");
    const window = new Window({ url: `https://example.com/${pagePath}` });
    window.document.write(html);

    const scripts = Array.from(
        window.document.querySelectorAll("script[type='module']"),
    ).map((script) => script.textContent ?? "");

    for (const code of scripts) {
        window.eval(code);
    }

    return window;
}

function clickPills(window: Window, key: string) {
    const pill = window.document.querySelector<HTMLElement>(
        `[data-filter-key="${key}"]`,
    );
    expect(pill, `pill "${key}" should exist`).toBeTruthy();
    pill!.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
}

function visibleCount(elements: HTMLElement[]) {
    return elements.filter((element) => !element.hasAttribute("hidden")).length;
}

const PILL_ACTIVE = ["text-zinc-950", "dark:text-zinc-50"];
const PILL_IDLE = [
    "text-zinc-700",
    "hover:text-zinc-950",
    "dark:text-zinc-300",
    "dark:hover:text-zinc-50",
];

function expectPillState(window: Window, key: string, active: boolean) {
    const pill = window.document.querySelector<HTMLElement>(
        `[data-filter-key="${key}"]`,
    )!;
    const activeClasses = PILL_ACTIVE.filter((cls) =>
        pill.classList.contains(cls),
    );
    const idleClasses = PILL_IDLE.filter((cls) => pill.classList.contains(cls));

    expect(pill.getAttribute("aria-pressed"), `aria-pressed for ${key}`).toBe(
        String(active),
    );
    expect(activeClasses.length > 0, `active classes on ${key}`).toBe(active);
    expect(idleClasses.length > 0, `idle classes on ${key}`).toBe(!active);
}

const hasDist = existsSync(path.join(distDir, "blog", "index.html"));

describe.skipIf(!hasDist)("blog filter (bundled)", () => {
    it("filters cards by category pill and restores on second click", () => {
        const window = loadPage("blog/index.html");
        const document = window.document;

        const cards = Array.from(
            document.querySelectorAll<HTMLElement>(".writeup-card"),
        );
        expect(cards.length).toBe(11);
        expect(visibleCount(cards)).toBe(11);

        clickPills(window, "Performance");

        const performance = cards.filter(
            (card) => card.dataset.tag === "Performance",
        );
        expect(performance.length).toBe(2);
        expect(visibleCount(cards)).toBe(2);

        const pill = document.querySelector<HTMLElement>(
            "[data-filter-key='Performance']",
        )!;
        expect(pill.getAttribute("aria-pressed")).toBe("true");
        expectPillState(window, "Performance", true);
        expectPillState(window, "all", false);

        const indicator = document.querySelector<HTMLElement>(
            "[data-filter-indicator]",
        )!;
        expect(indicator.style.opacity).toBe("1");
        expect(indicator.style.width).not.toBe("");

        clickPills(window, "Performance");
        expect(visibleCount(cards)).toBe(11);
        expectPillState(window, "Performance", false);
        expectPillState(window, "all", true);
    });

    it("combines category filter with search and shows empty message", () => {
        const window = loadPage("blog/index.html");
        const document = window.document;

        const cards = Array.from(
            document.querySelectorAll<HTMLElement>(".writeup-card"),
        );
        const search =
            document.querySelector<HTMLInputElement>("#writeups-search")!;
        const empty = document.querySelector<HTMLElement>(
            "[data-empty-message]",
        )!;

        clickPills(window, "Performance");
        search.value = "zzz-no-match";
        search.dispatchEvent(new window.Event("input", { bubbles: true }));

        expect(visibleCount(cards)).toBe(0);
        expect(empty.hasAttribute("hidden")).toBe(false);

        const clear = document.querySelector<HTMLElement>(
            "[data-clear-search]",
        )!;
        clear.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));

        expect(visibleCount(cards)).toBe(2);
        expect(empty.hasAttribute("hidden")).toBe(true);
    });
});

describe.skipIf(!hasDist)("showcase filter (bundled)", () => {
    it("filters cards by category pill", () => {
        const window = loadPage("showcase/index.html");
        const document = window.document;

        const rows = Array.from(
            document.querySelectorAll<HTMLElement>("[data-showcase-row]"),
        );
        expect(rows.length).toBe(4);

        expect(document.querySelectorAll("[data-preview-panel]").length).toBe(
            4,
        );

        const categoryKey = document.querySelector<HTMLElement>(
            "[data-filter-key]:not([data-filter-key='all'])",
        )!.dataset.filterKey!;
        clickPills(window, categoryKey);

        const inCategory = rows.filter(
            (row) => row.dataset.filterTag === categoryKey,
        );
        expect(inCategory.length).toBeGreaterThan(0);
        expect(visibleCount(rows)).toBe(inCategory.length);
        expectPillState(window, categoryKey, true);
        expectPillState(window, "all", false);

        clickPills(window, categoryKey);
        expect(visibleCount(rows)).toBe(4);
        expectPillState(window, categoryKey, false);
        expectPillState(window, "all", true);
    });

    it("combines category filter with search and shows empty message", () => {
        const window = loadPage("showcase/index.html");
        const document = window.document;

        const rows = Array.from(
            document.querySelectorAll<HTMLElement>("[data-showcase-row]"),
        );
        const search = document.querySelector<HTMLInputElement>(
            "[data-showcase-search]",
        )!;
        const empty = document.querySelector<HTMLElement>(
            "[data-empty-message]",
        )!;

        clickPills(window, "all");
        const firstTitle = rows[0].dataset.search!.split(" ")[0];
        search.value = firstTitle;
        search.dispatchEvent(new window.Event("input", { bubbles: true }));

        expect(visibleCount(rows)).toBeGreaterThan(0);
        expect(
            rows.filter(
                (row) =>
                    !row.hasAttribute("hidden") &&
                    !(row.dataset.search ?? "").includes(firstTitle),
            ).length,
        ).toBe(0);

        search.value = "zzz-no-match";
        search.dispatchEvent(new window.Event("input", { bubbles: true }));
        expect(visibleCount(rows)).toBe(0);
        expect(empty.hasAttribute("hidden")).toBe(false);

        const clear = document.querySelector<HTMLElement>(
            "[data-clear-search]",
        )!;
        clear.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));

        expect(visibleCount(rows)).toBe(4);
        expect(empty.hasAttribute("hidden")).toBe(true);
    });

    it("previews the hovered row and hides the preview when nothing matches", () => {
        const window = loadPage("showcase/index.html");
        const document = window.document;

        const rows = Array.from(
            document.querySelectorAll<HTMLElement>("[data-showcase-row]"),
        );
        const panels = Array.from(
            document.querySelectorAll<HTMLElement>("[data-preview-panel]"),
        );
        const shownPanel = () =>
            panels.filter((panel) => !panel.hasAttribute("hidden"));

        expect(shownPanel().map((panel) => panel.dataset.previewPanel)).toEqual(
            [rows[0].dataset.projectId],
        );
        expect(
            rows[0]
                .querySelector<HTMLElement>("[data-row-title]")!
                .classList.contains("text-zinc-950"),
        ).toBe(true);

        rows[2].dispatchEvent(new window.MouseEvent("mouseenter"));
        expect(shownPanel().map((panel) => panel.dataset.previewPanel)).toEqual(
            [rows[2].dataset.projectId],
        );
        expect(
            rows[0]
                .querySelector<HTMLElement>("[data-row-title]")!
                .classList.contains("text-zinc-950"),
        ).toBe(false);

        const search = document.querySelector<HTMLInputElement>(
            "[data-showcase-search]",
        )!;
        search.value = "zzz-no-match";
        search.dispatchEvent(new window.Event("input", { bubbles: true }));
        expect(shownPanel().length).toBe(0);
    });

    it("shows a single external link per preview, repository first", () => {
        const window = loadPage("showcase/index.html");
        const panels = Array.from(
            window.document.querySelectorAll<HTMLElement>(
                "[data-preview-panel]",
            ),
        );

        for (const panel of panels) {
            const external = panel.querySelectorAll("a[target='_blank']");
            expect(external.length).toBeLessThanOrEqual(1);
        }
    });
});

describe.skipIf(!hasDist)("lab filter (bundled)", () => {
    it("filters experiments by category pill", () => {
        const window = loadPage("lab/index.html");
        const document = window.document;

        const rows = Array.from(
            document.querySelectorAll<HTMLElement>("[data-lab-row]"),
        );
        expect(rows.length).toBe(4);

        const categoryKey = document.querySelector<HTMLElement>(
            "[data-filter-key]:not([data-filter-key='all'])",
        )!.dataset.filterKey!;
        const inCategory = rows.filter(
            (row) => row.dataset.filterTag === categoryKey,
        );
        expect(inCategory.length).toBeGreaterThan(0);

        clickPills(window, categoryKey);
        expect(visibleCount(rows)).toBe(inCategory.length);

        clickPills(window, "all");
        expect(visibleCount(rows)).toBe(4);
    });

    it("filters by search query", () => {
        const window = loadPage("lab/index.html");
        const document = window.document;

        const rows = Array.from(
            document.querySelectorAll<HTMLElement>("[data-lab-row]"),
        );
        const search =
            document.querySelector<HTMLInputElement>("[data-lab-search]")!;

        const firstTitle = rows[0].dataset.search!.split(" ")[0];
        search.value = firstTitle;
        search.dispatchEvent(new window.Event("input", { bubbles: true }));

        expect(visibleCount(rows)).toBeLessThanOrEqual(4);
        expect(
            rows.filter(
                (row) =>
                    !row.hasAttribute("hidden") &&
                    !(row.dataset.search ?? "").includes(firstTitle),
            ).length,
        ).toBe(0);
    });
});

describe.skipIf(!hasDist)("search hint (bundled)", () => {
    const pages = [
        ["blog/index.html", "#writeups-search"],
        ["lab/index.html", "[data-lab-search]"],
        ["showcase/index.html", "[data-showcase-search]"],
    ] as const;

    it.each(pages)("hides the / hint while typing in %s", (page, selector) => {
        const window = loadPage(page);
        const document = window.document;
        const search = document.querySelector<HTMLInputElement>(selector)!;
        const hint = document.querySelector<HTMLElement>("[data-search-hint]")!;

        expect(hint.hasAttribute("hidden")).toBe(false);

        search.value = "x";
        search.dispatchEvent(new window.Event("input", { bubbles: true }));
        expect(hint.hasAttribute("hidden")).toBe(true);

        search.value = "";
        search.dispatchEvent(new window.Event("input", { bubbles: true }));
        expect(hint.hasAttribute("hidden")).toBe(false);
    });
});
