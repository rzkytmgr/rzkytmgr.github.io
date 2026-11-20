import { describe, expect, it } from "vitest";
import { Window } from "happy-dom";
import type { Element as HappyElement } from "happy-dom";
import { bindImageProtection } from "@/scripts/protect-images";

function setup() {
    const window = new Window();
    const document = window.document;

    document.body.innerHTML = `
        <img src="data:," alt="" />
        <canvas></canvas>
        <p>Text</p>
    `;
    bindImageProtection(document as unknown as Document);

    const fire = (target: HappyElement, type: "contextmenu" | "dragstart") => {
        const event = new window.Event(type, {
            bubbles: true,
            cancelable: true,
        });

        target.dispatchEvent(event);

        return event.defaultPrevented;
    };

    return {
        fire,
        img: document.querySelector("img")!,
        canvas: document.querySelector("canvas")!,
        text: document.querySelector("p")!,
    };
}

describe("bindImageProtection", () => {
    it.each(["contextmenu", "dragstart"] as const)(
        "blocks %s on images and canvases",
        (type) => {
            const { fire, img, canvas } = setup();

            expect(fire(img, type)).toBe(true);
            expect(fire(canvas, type)).toBe(true);
        },
    );

    it.each(["contextmenu", "dragstart"] as const)(
        "leaves %s on other elements alone",
        (type) => {
            const { fire, text } = setup();

            expect(fire(text, type)).toBe(false);
        },
    );
});
