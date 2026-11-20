const PROTECTED_SELECTOR = "img, canvas";

export function bindImageProtection(doc: Document = document) {
    const block = (event: Event) => {
        const target = event.target as Element | null;

        if (target?.closest?.(PROTECTED_SELECTOR)) {
            event.preventDefault();
        }
    };

    doc.addEventListener("contextmenu", block);
    doc.addEventListener("dragstart", block);
}
