export function truncate(text: string, max: number): string {
    if (text.length <= max) {
        return text;
    }

    const cut = text.slice(0, max - 1);
    const lastSpace = cut.lastIndexOf(" ");

    return `${(lastSpace > 0 ? cut.slice(0, lastSpace) : cut).replace(/[\s,.;:—-]+$/, "")}…`;
}
