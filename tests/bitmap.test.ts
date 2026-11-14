import { describe, expect, it } from "vitest";
import {
    createBayerMatrix,
    ditherThreshold,
    particlePitch,
    radialGlowCells,
    sampleGlyphCells,
} from "@/src/scripts/bitmap";

function solidMask(cols: number, rows: number): Uint8ClampedArray {
    const rgba = new Uint8ClampedArray(cols * rows * 4);

    for (let i = 3; i < rgba.length; i += 4) {
        rgba[i] = 255;
    }

    return rgba;
}

describe("createBayerMatrix", () => {
    it("builds the classic 2×2 matrix", () => {
        expect(createBayerMatrix(2)).toEqual([
            [0.125, 0.625],
            [0.875, 0.375],
        ]);
    });

    it("uses every rank exactly once in an 8×8 matrix", () => {
        const ranks = createBayerMatrix(8)
            .flat()
            .map((value) => value * 64 - 0.5)
            .sort((a, b) => a - b);

        expect(ranks).toEqual(Array.from({ length: 64 }, (_, i) => i));
    });

    it("rejects orders that are not a power of two", () => {
        expect(() => createBayerMatrix(6)).toThrow(RangeError);
        expect(() => createBayerMatrix(1)).toThrow(RangeError);
    });
});

describe("ditherThreshold", () => {
    it("stays inside (0, 1) and tiles every 8 cells", () => {
        for (let y = 0; y < 16; y++) {
            for (let x = 0; x < 16; x++) {
                const value = ditherThreshold(x, y);

                expect(value).toBeGreaterThan(0);
                expect(value).toBeLessThan(1);
                expect(value).toBe(ditherThreshold(x + 8, y + 8));
            }
        }
    });
});

describe("particlePitch", () => {
    it("leaves a 1 px gap between particles", () => {
        expect(particlePitch(1)).toBe(2);
        expect(particlePitch(2)).toBe(3);
    });
});

describe("sampleGlyphCells", () => {
    it("never places particles outside the glyph mask", () => {
        const cols = 16;
        const rows = 16;
        const rgba = solidMask(cols, rows);

        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols / 2; x++) {
                rgba[(y * cols + x) * 4 + 3] = 0;
            }
        }

        const cells = sampleGlyphCells(rgba, cols, rows);

        expect(cells.length).toBeGreaterThan(0);
        expect(cells.every(([x]) => x >= cols / 2)).toBe(true);
    });

    it("is denser at the top than at the bottom", () => {
        const cols = 32;
        const rows = 32;
        const cells = sampleGlyphCells(solidMask(cols, rows), cols, rows);
        const top = cells.filter(([, y]) => y < rows / 4).length;
        const bottom = cells.filter(([, y]) => y >= (rows * 3) / 4).length;

        expect(top).toBeGreaterThan(bottom);
    });
});

describe("radialGlowCells", () => {
    it("is densest at the centre and empty in the corners", () => {
        const n = 40;
        const cells = radialGlowCells(n);
        const has = (x: number, y: number) =>
            cells.some(([cx, cy]) => cx === x && cy === y);

        expect(has(n / 2, n / 2)).toBe(true);
        expect(has(0, 0)).toBe(false);
        expect(has(n - 1, n - 1)).toBe(false);
    });

    it("stays inside the grid", () => {
        const n = 53;

        expect(
            radialGlowCells(n).every(
                ([x, y]) => x >= 0 && y >= 0 && x < n && y < n,
            ),
        ).toBe(true);
    });
});
