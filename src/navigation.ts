export interface NavItemType {
    href: string;
    label: string;
}

export const NAV_ITEMS: NavItemType[] = [
    { href: "/", label: "Home" },
    { href: "/about/", label: "About" },
    { href: "/blog/", label: "Writeups" },
    { href: "/showcase/", label: "Showcase" },
    { href: "/lab/", label: "Laboratory" },
];

export function isNavActive(href: string, pathname: string): boolean {
    const current = pathname.endsWith("/") ? pathname : `${pathname}/`;

    return href === "/" ? current === "/" : current.startsWith(href);
}
