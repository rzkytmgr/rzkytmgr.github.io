export function ogImagePath(pathname: string): string {
    const route = pathname.replace(/\.html$/, "").replace(/^\/+|\/+$/g, "");

    return `/og/${route || "index"}.png`;
}
