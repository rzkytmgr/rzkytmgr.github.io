import { describe, expect, it } from "vitest";
import { Window } from "happy-dom";
import type { Element as HappyElement } from "happy-dom";
import { bindSearchShortcut } from "@/src/scripts/search-shortcut";

function setup() {
    const window = new Window();
    const document = window.document;

    document.body.innerHTML = `
        <input type="search" data-search-shortcut />
        <textarea></textarea>
        <button type="button">Other</button>
    `;
    bindSearchShortcut(document as unknown as Document);

    const press = (target: HappyElement, init: Record<string, unknown> = {}) =>
        target.dispatchEvent(
            new window.KeyboardEvent("keydown", {
                key: "/",
                bubbles: true,
                cancelable: true,
                ...init,
            }),
        );

    return {
        document,
        search: document.querySelector("[data-search-shortcut]")!,
        textarea: document.querySelector("textarea")!,
        button: document.querySelector("button")!,
        press,
    };
}

describe("bindSearchShortcut", () => {
    it("focuses the search field when / is pressed", () => {
        const { document, search, button, press } = setup();

        press(button);

        expect(document.activeElement).toBe(search);
    });

    it("does not steal / while typing in another field", () => {
        const { document, textarea, press } = setup();

        textarea.focus();
        press(textarea);

        expect(document.activeElement).toBe(textarea);
    });

    it("ignores / combined with a modifier key", () => {
        const { document, search, button, press } = setup();

        press(button, { ctrlKey: true });
        press(button, { metaKey: true });

        expect(document.activeElement).not.toBe(search);
    });

    it("does nothing on pages without a search field", () => {
        const window = new Window();
        const document = window.document;

        expect(() =>
            bindSearchShortcut(document as unknown as Document),
        ).not.toThrow();
    });
});
