export function bindSearchShortcut(doc: Document = document) {
    const input = doc.querySelector<HTMLInputElement>("[data-search-shortcut]");

    if (!input) {
        return;
    }

    doc.addEventListener("keydown", (event) => {
        const target = event.target as Element | null;

        if (
            event.key === "/" &&
            !event.metaKey &&
            !event.ctrlKey &&
            !event.altKey &&
            !target?.closest?.("input, textarea, select, [contenteditable]")
        ) {
            event.preventDefault();
            input.focus();
        }
    });
}
