export function metaImagePath(pathname: string): string {
    const route = pathname.replace(/\.html$/, "").replace(/^\/+|\/+$/g, "");

    return `/assets/meta/${route || "index"}.jpg`;
}
