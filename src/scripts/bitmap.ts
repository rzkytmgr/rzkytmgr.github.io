export type Cell = readonly [x: number, y: number];

const BAYER_BASE = [
    [0, 2],
    [3, 1],
] as const;

export function createBayerMatrix(order: number): number[][] {
    if (order < 2 || (order & (order - 1)) !== 0) {
        throw new RangeError(
            `Bayer matrix order must be a power of two ≥ 2, got ${order}`,
        );
    }

    let matrix: number[][] = BAYER_BASE.map((row) => [...row]);

    for (let size = 2; size < order; size *= 2) {
        const next: number[][] = [];

        for (let y = 0; y < size * 2; y++) {
            const row: number[] = [];

            for (let x = 0; x < size * 2; x++) {
                const quadrant =
                    BAYER_BASE[Math.floor(y / size)][Math.floor(x / size)];
                row.push(4 * matrix[y % size][x % size] + quadrant);
            }

            next.push(row);
        }

        matrix = next;
    }

    const cells = order * order;

    return matrix.map((row) => row.map((value) => (value + 0.5) / cells));
}

const BAYER_8 = createBayerMatrix(8);

export function ditherThreshold(x: number, y: number): number {
    return BAYER_8[y & 7][x & 7];
}

export function particlePitch(size: number): number {
    return size + 1;
}

export function sampleGlyphCells(
    rgba: ArrayLike<number>,
    cols: number,
    rows: number,
): Cell[] {
    const cells: Cell[] = [];

    for (let y = 0; y < rows; y++) {
        const tone = 0.42 + 0.5 * (1 - y / rows);

        for (let x = 0; x < cols; x++) {
            if (rgba[(y * cols + x) * 4 + 3] < 128) {
                continue;
            }

            if (tone > ditherThreshold(x, y)) {
                cells.push([x, y]);
            }
        }
    }

    return cells;
}

export function radialGlowCells(n: number): Cell[] {
    const cells: Cell[] = [];
    const half = n / 2;

    for (let y = 0; y < n; y++) {
        for (let x = 0; x < n; x++) {
            const distance = Math.hypot(x + 0.5 - half, y + 0.5 - half) / half;
            const density = Math.pow(Math.max(0, 1 - distance), 1.5) * 0.95;

            if (density > ditherThreshold(x, y)) {
                cells.push([x, y]);
            }
        }
    }

    return cells;
}

type DrawOptions = {
    size: number;
    dpr: number;
    offset?: number;
};

function drawCells(
    ctx: CanvasRenderingContext2D,
    cells: readonly Cell[],
    { size, dpr, offset = 0 }: DrawOptions,
) {
    const pitch = particlePitch(size);
    const pad = (pitch - size) / 2;
    const square = Math.max(1, Math.round(size * dpr));

    for (const [x, y] of cells) {
        ctx.fillRect(
            Math.round((offset + x * pitch + pad) * dpr),
            Math.round((offset + y * pitch + pad) * dpr),
            square,
            square,
        );
    }
}

function cappedDevicePixelRatio(): number {
    return Math.min(2, window.devicePixelRatio || 1);
}

type MaskOptions = {
    size: number;
    color: string;
    drawMask: (
        ctx: CanvasRenderingContext2D,
        cols: number,
        rows: number,
    ) => void;
};

function renderMaskBitmap(
    canvas: HTMLCanvasElement,
    { size, color, drawMask }: MaskOptions,
) {
    const rect = canvas.getBoundingClientRect();

    if (!rect.width || !rect.height) {
        return;
    }

    const dpr = cappedDevicePixelRatio();
    const pitch = particlePitch(size);
    const cols = Math.floor(rect.width / pitch);
    const rows = Math.floor(rect.height / pitch);

    const mask = document.createElement("canvas");
    mask.width = cols;
    mask.height = rows;
    const maskCtx = mask.getContext("2d", { willReadFrequently: true });
    const ctx = canvas.getContext("2d");

    if (!maskCtx || !ctx || !cols || !rows) {
        return;
    }

    maskCtx.fillStyle = "#fff";
    maskCtx.strokeStyle = "#fff";
    drawMask(maskCtx, cols, rows);

    const pixels = maskCtx.getImageData(0, 0, cols, rows).data;

    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = color;
    drawCells(ctx, sampleGlyphCells(pixels, cols, rows), { size, dpr });
}

type GlyphOptions = {
    text: string;
    size: number;
    color: string;
    font: (px: number) => string;
};

export function renderGlyphBitmap(
    canvas: HTMLCanvasElement,
    { text, size, color, font }: GlyphOptions,
) {
    renderMaskBitmap(canvas, {
        size,
        color,
        drawMask: (ctx, cols, rows) => {
            let fontSize = rows * 1.08;
            ctx.font = font(fontSize);
            const measured = ctx.measureText(text).width;

            if (measured > cols * 0.96) {
                fontSize *= (cols * 0.96) / measured;
                ctx.font = font(fontSize);
            }

            ctx.textAlign = "center";
            ctx.textBaseline = "alphabetic";
            ctx.fillText(text, cols / 2, rows / 2 + fontSize * 0.34);
        },
    });
}

type GlowOptions = {
    size: number;
    color: string;
    cssSize?: number;
};

export function createGlowTexture({
    size,
    color,
    cssSize = 160,
}: GlowOptions): string | null {
    const dpr = cappedDevicePixelRatio();
    const pitch = particlePitch(size);
    const n = Math.floor(cssSize / pitch);
    const offset = (cssSize - n * pitch) / 2;

    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = Math.round(cssSize * dpr);
    const ctx = canvas.getContext("2d");

    if (!ctx) {
        return null;
    }

    ctx.fillStyle = color;
    drawCells(ctx, radialGlowCells(n), { size, dpr, offset });

    return canvas.toDataURL();
}
