import { readFile } from "node:fs/promises";
import path from "node:path";
import { Resvg } from "@resvg/resvg-js";
import satori from "satori";
import sharp from "sharp";
import { config } from "../config";
import { truncate } from "../utils/text";
import type { OgPage } from "./pages";

export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;

const COLORS = {
    background: "#f8fafc",
    ink: "#0f172a",
    heading: "#09090b",
    text: "#475569",
    muted: "#64748b",
    tag: "#d96e14",
    accent: "#f38020",
};

const WHALE = { width: 1472, height: 514 };
const WHALE_HEIGHT = OG_HEIGHT / 2;

type Style = Record<string, string | number>;
type Node = {
    type: string;
    props: Record<string, unknown> & { style: Style; children?: unknown };
};

function h(
    type: string,
    style: Style,
    children?: Node | string | (Node | string)[],
    props: Record<string, unknown> = {},
): Node {
    return { type, props: { ...props, style, children } };
}

export function titleSize(title: string): number {
    if (title.length <= 30) {
        return 72;
    }

    if (title.length <= 55) {
        return 66;
    }

    if (title.length <= 80) {
        return 56;
    }

    return 48;
}

type Assets = {
    fonts: { name: string; data: Buffer; weight: 400 | 500 | 700 }[];
    icon: string;
    whale: string;
};

let assets: Promise<Assets> | undefined;

function loadAssets(): Promise<Assets> {
    assets ??= (async () => {
        const font = (weight: number) =>
            readFile(
                path.resolve(
                    "node_modules/@fontsource/mona-sans/files",
                    `mona-sans-latin-${weight}-normal.woff`,
                ),
            );
        const dataUri = (data: Buffer) =>
            `data:image/png;base64,${data.toString("base64")}`;

        const [regular, medium, bold, icon, whale] = await Promise.all([
            font(400),
            font(500),
            font(700),
            readFile(path.resolve("public/assets/favicon.png")),
            readFile(path.resolve("public/assets/whale-bitmap.webp")).then(
                (webp) => sharp(webp).png().toBuffer(),
            ),
        ]);

        return {
            fonts: [
                { name: "Mona Sans", data: regular, weight: 400 },
                { name: "Mona Sans", data: medium, weight: 500 },
                { name: "Mona Sans", data: bold, weight: 700 },
            ],
            icon: dataUri(icon),
            whale: dataUri(whale),
        };
    })();

    return assets;
}

function layout(page: OgPage, { icon, whale }: Assets): Node {
    const domain = new URL(config.url).hostname;
    const whaleWidth = Math.round((WHALE_HEIGHT * WHALE.width) / WHALE.height);

    return h(
        "div",
        {
            width: OG_WIDTH,
            height: OG_HEIGHT,
            display: "flex",
            position: "relative",
            overflow: "hidden",
            backgroundColor: COLORS.background,
            color: COLORS.ink,
            fontFamily: "Mona Sans",
        },
        [
            h(
                "img",
                {
                    position: "absolute",
                    right: -Math.round(whaleWidth * 0.18),
                    bottom: -Math.round(WHALE_HEIGHT * 0.22),
                    width: whaleWidth,
                    height: WHALE_HEIGHT,
                    opacity: 0.12,
                },
                undefined,
                { src: whale, width: whaleWidth, height: WHALE_HEIGHT },
            ),
            h(
                "div",
                {
                    display: "flex",
                    flexDirection: "column",
                    flexGrow: 1,
                    padding: "64px 72px",
                },
                [
                    h(
                        "div",
                        {
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                        },
                        [
                            h(
                                "div",
                                {
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 20,
                                },
                                [
                                    h(
                                        "img",
                                        {
                                            width: 56,
                                            height: 56,
                                            borderRadius: 12,
                                        },
                                        undefined,
                                        { src: icon, width: 56, height: 56 },
                                    ),
                                    h(
                                        "div",
                                        {
                                            fontSize: 34,
                                            fontWeight: 700,
                                            letterSpacing: "-0.02em",
                                        },
                                        config.title,
                                    ),
                                ],
                            ),
                            h(
                                "div",
                                {
                                    fontSize: 28,
                                    fontWeight: 500,
                                    color: COLORS.muted,
                                },
                                page.section,
                            ),
                        ],
                    ),
                    h(
                        "div",
                        {
                            display: "flex",
                            flexDirection: "column",
                            gap: 28,
                            marginTop: 56,
                            maxWidth: 1000,
                        },
                        [
                            h(
                                "div",
                                {
                                    fontSize: titleSize(page.title),
                                    fontWeight: 700,
                                    lineHeight: 1.1,
                                    letterSpacing: "-0.03em",
                                    color: COLORS.heading,
                                },
                                truncate(page.title, 110),
                            ),
                            h(
                                "div",
                                {
                                    fontSize: 30,
                                    lineHeight: 1.45,
                                    color: COLORS.text,
                                    maxWidth: 940,
                                },
                                truncate(page.description, 170),
                            ),
                        ],
                    ),
                    h(
                        "div",
                        {
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            marginTop: "auto",
                        },
                        [
                            h(
                                "div",
                                {
                                    fontSize: 28,
                                    fontWeight: 500,
                                    color: COLORS.tag,
                                },
                                page.tag ?? "",
                            ),
                            h(
                                "div",
                                {
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 20,
                                },
                                [
                                    h(
                                        "div",
                                        {
                                            fontSize: 28,
                                            fontWeight: 500,
                                            color: COLORS.muted,
                                        },
                                        domain,
                                    ),
                                    h("div", {
                                        width: 72,
                                        height: 8,
                                        borderRadius: 4,
                                        backgroundColor: COLORS.accent,
                                    }),
                                ],
                            ),
                        ],
                    ),
                ],
            ),
        ],
    );
}

export async function renderOgImage(
    page: OgPage,
): Promise<Uint8Array<ArrayBuffer>> {
    const loaded = await loadAssets();
    const svg = await satori(
        layout(page, loaded) as Parameters<typeof satori>[0],
        {
            width: OG_WIDTH,
            height: OG_HEIGHT,
            fonts: loaded.fonts,
        },
    );

    return Uint8Array.from(new Resvg(svg).render().asPng());
}
