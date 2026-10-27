const CLAPS_STORAGE_KEY = "claps";

function readClaps(): string[] {
    try {
        const raw = localStorage.getItem(CLAPS_STORAGE_KEY);

        if (!raw) {
            return [];
        }

        const parsed: unknown = JSON.parse(raw);

        if (!Array.isArray(parsed)) {
            return [];
        }

        return parsed.filter(
            (entry): entry is string => typeof entry === "string",
        );
    } catch {
        return [];
    }
}

function writeClaps(hrefs: string[]) {
    try {
        localStorage.setItem(CLAPS_STORAGE_KEY, JSON.stringify(hrefs));
    } catch {
        // Storage may be unavailable (private mode, quota) — best-effort only.
    }
}

function setupArticleClap() {
    const actions = document.querySelector<HTMLElement>(
        "[data-article-actions]",
    );

    if (!actions) {
        return;
    }

    const button = actions.querySelector<HTMLButtonElement>("[data-clap]");

    if (!button) {
        return;
    }

    const href = window.location.pathname;

    const applyState = () => {
        const clapped = readClaps().includes(href);

        button.setAttribute("data-clapped", String(clapped));
        button.setAttribute("aria-pressed", String(clapped));
    };

    button.addEventListener("click", () => {
        const likes = readClaps();

        if (!likes.includes(href)) {
            writeClaps([...likes, href]);
        }

        applyState();
    });

    applyState();
}

const BOOKMARKS_STORAGE_KEY = "bookmarks";

type BookmarkEntry = {
    href: string;
    title: string;
    description: string;
    tag: string;
    savedAt: string;
};

function readBookmarks(): BookmarkEntry[] {
    try {
        const raw = localStorage.getItem(BOOKMARKS_STORAGE_KEY);

        if (!raw) {
            return [];
        }

        const parsed: unknown = JSON.parse(raw);

        if (!Array.isArray(parsed)) {
            return [];
        }

        return parsed.filter(
            (entry): entry is BookmarkEntry =>
                Boolean(entry) &&
                typeof entry === "object" &&
                typeof (entry as BookmarkEntry).href === "string" &&
                typeof (entry as BookmarkEntry).title === "string" &&
                typeof (entry as BookmarkEntry).savedAt === "string",
        );
    } catch {
        return [];
    }
}

function writeBookmarks(entries: BookmarkEntry[]) {
    try {
        localStorage.setItem(BOOKMARKS_STORAGE_KEY, JSON.stringify(entries));
    } catch {
        // Storage may be unavailable (private mode, quota) — bookmarking is
        // best-effort, so fail silently.
    }
}

function getBookmarkActions() {
    return {
        list: readBookmarks,
        set: writeBookmarks,
    };
}

function setupArticleBookmark() {
    const actions = document.querySelector<HTMLElement>(
        "[data-article-actions]",
    );

    if (!actions) {
        return;
    }

    const button = actions.querySelector<HTMLButtonElement>("[data-bookmark]");

    if (!button) {
        return;
    }

    const { list, set } = getBookmarkActions();
    const href = window.location.pathname;

    const applyState = () => {
        const bookmarked = list().some((entry) => entry.href === href);

        button.setAttribute("aria-pressed", String(bookmarked));
        button.setAttribute(
            "aria-label",
            bookmarked ? "Remove bookmark" : "Bookmark article",
        );
        button.title = bookmarked ? "Remove bookmark" : "Bookmark article";
    };

    button.addEventListener("click", () => {
        const entries = list();

        if (entries.some((entry) => entry.href === href)) {
            set(entries.filter((entry) => entry.href !== href));
        } else {
            set([
                ...entries,
                {
                    href,
                    title: button.dataset.bookmarkTitle ?? document.title,
                    description: button.dataset.bookmarkDescription ?? "",
                    tag: button.dataset.bookmarkTag ?? "",
                    savedAt: new Date().toISOString(),
                },
            ]);
        }

        applyState();
    });

    applyState();
}

const tocNav = document.querySelector<HTMLElement>("[data-toc-for]");

if (tocNav) {
    const links = Array.from(
        tocNav.querySelectorAll<HTMLAnchorElement>("[data-toc-link]"),
    );
    const elements = links
        .map((link) => document.getElementById(link.dataset.tocLink ?? ""))
        .filter((el): el is HTMLElement => el !== null);

    const SCROLL_OFFSET = 96;

    if (elements.length > 0) {
        let ticking = false;

        const update = () => {
            ticking = false;

            let currentId: string | null = null;

            for (const element of elements) {
                if (element.getBoundingClientRect().top <= SCROLL_OFFSET) {
                    currentId = element.id;
                }
            }

            links.forEach((link) => {
                const isActive = link.dataset.tocLink === currentId;
                link.setAttribute(
                    "aria-current",
                    isActive ? "location" : "false",
                );

                const marker =
                    link.querySelector<HTMLElement>("[data-toc-marker]");

                if (marker) {
                    marker.style.opacity = isActive ? "1" : "0";
                }

                if (isActive) {
                    link.classList.add("text-journal-accent-text");
                    link.classList.remove("text-zinc-500");
                } else {
                    link.classList.remove("text-journal-accent-text");
                    link.classList.add("text-zinc-500");
                }
            });
        };

        const onScroll = () => {
            if (!ticking) {
                ticking = true;
                requestAnimationFrame(update);
            }
        };

        update();
        window.addEventListener("scroll", onScroll, { passive: true });
        window.addEventListener("resize", onScroll, { passive: true });
    }
}

const actions = document.querySelector<HTMLElement>("[data-article-actions]");

if (actions) {
    actions
        .querySelector<HTMLElement>("[data-share]")
        ?.addEventListener("click", () => {
            const url = window.location.href;
            const title = document.title;

            if (navigator.share) {
                navigator.share({ title, url }).catch(() => {});
                return;
            }

            navigator.clipboard?.writeText(url);
        });
}

setupArticleBookmark();
setupArticleClap();

export {};
