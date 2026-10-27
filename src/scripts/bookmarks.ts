type BookmarkEntry = {
    href: string;
    title: string;
    description: string;
    tag: string;
    savedAt: string;
};

const BOOKMARKS_STORAGE_KEY = "bookmarks";

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
        // Storage may be unavailable (private mode, quota) — best-effort only.
    }
}

const list = document.querySelector<HTMLElement>("[data-bookmark-list]");
const count = document.querySelector<HTMLElement>("[data-bookmark-count]");
const emptyMessage = document.querySelector<HTMLElement>(
    "[data-empty-message]",
);
const searchInput = document.querySelector<HTMLInputElement>(
    "[data-bookmarks-search]",
);
const clearSearch = document.querySelector<HTMLButtonElement>(
    "[data-clear-search]",
);

const EMPTY_NO_BOOKMARKS =
    "No bookmarks yet. Open any article on this site and hit the bookmark icon to save it here.";
const EMPTY_NO_MATCH = "No bookmarks match your search.";

if (list) {
    const formatDate = new Intl.DateTimeFormat("en", {
        dateStyle: "medium",
        timeStyle: "short",
    });

    const escapeHtml = (value: string) =>
        value
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");

    const renderEntries = (entries: BookmarkEntry[]) => {
        list.innerHTML = "";

        if (count) {
            count.textContent = String(entries.length);
        }

        if (emptyMessage) {
            emptyMessage.hidden = entries.length > 0;
        }

        for (const entry of entries) {
            const item = document.createElement("article");

            item.className =
                "group relative h-full rounded-md border border-smooth-border bg-surface p-6 transition-colors duration-100 hover:border-journal-accent/60";
            item.innerHTML = `
                <div class="relative flex h-full flex-col gap-1.5">
                    <div class="flex min-h-7 flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs word-spacing-wide font-medium text-neutral-500">
                        <time datetime="${escapeHtml(entry.savedAt)}">Saved ${escapeHtml(formatDate.format(new Date(entry.savedAt)))}</time>
                        <button
                            type="button"
                            data-bookmark-remove="${escapeHtml(entry.href)}"
                            aria-label="Remove bookmark"
                            title="Remove bookmark"
                            class="shrink-0 cursor-pointer rounded-md p-1.5 text-neutral-400 transition-colors duration-100 hover:text-journal-accent-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-journal-accent"
                        >
                            <svg aria-hidden="true" viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-3.5"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                        </button>
                    </div>

                    <div class="mb-2 flex flex-col gap-1.5">
                        <h3 class="line-clamp-2 text-lg font-semibold">
                            <a
                                href="${escapeHtml(entry.href)}"
                                class="transition-colors duration-100 hover:text-journal-accent-text focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-journal-accent"
                            >
                                ${escapeHtml(entry.title)}
                            </a>
                        </h3>

                        <p class="max-w-3xl line-clamp-3 text-sm text-neutral-500">
                            ${escapeHtml(entry.description)}
                        </p>
                    </div>

                    <div class="mt-auto flex items-center justify-between gap-3 border-t border-smooth-border pt-4">
                        <span class="truncate text-xs word-spacing-wide font-medium text-journal-accent-text">
                            ${escapeHtml(entry.tag)}
                        </span>

                        <a
                            href="${escapeHtml(entry.href)}"
                            aria-label="Read ${escapeHtml(entry.title)}"
                            class="inline-flex shrink-0 items-center gap-1 text-xs word-spacing-wide font-medium text-neutral-600 underline transition-colors duration-100 hover:text-journal-accent-text focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-journal-accent"
                        >
                            read more
                        </a>
                    </div>
                </div>
            `;

            list.appendChild(item);
        }
    };

    let allBookmarks = readBookmarks();

    const visibleBookmarks = (): BookmarkEntry[] => {
        const query = searchInput?.value.trim().toLowerCase() ?? "";

        if (!query) {
            return allBookmarks;
        }

        return allBookmarks.filter((entry) =>
            `${entry.title} ${entry.description} ${entry.tag}`
                .toLowerCase()
                .includes(query),
        );
    };

    const refresh = () => {
        renderEntries(visibleBookmarks());

        if (emptyMessage) {
            emptyMessage.textContent =
                allBookmarks.length === 0 ? EMPTY_NO_BOOKMARKS : EMPTY_NO_MATCH;
        }
    };

    searchInput?.addEventListener("input", () => {
        if (clearSearch) {
            clearSearch.hidden = !searchInput.value;
        }

        refresh();
    });

    clearSearch?.addEventListener("click", () => {
        if (searchInput) {
            searchInput.value = "";
        }

        if (clearSearch) {
            clearSearch.hidden = true;
        }

        searchInput?.focus();
        refresh();
    });

    list.addEventListener("click", (event) => {
        const button = (event.target as HTMLElement | null)?.closest(
            "button[data-bookmark-remove]",
        );

        if (!button) {
            return;
        }

        const href = button.getAttribute("data-bookmark-remove");

        if (!href) {
            return;
        }

        allBookmarks = allBookmarks.filter((entry) => entry.href !== href);
        writeBookmarks(allBookmarks);
        refresh();
    });

    refresh();
}

export {};
