import { getCollection } from "astro:content";
import { config } from "../config";

export type OgPage = {
    path: string;
    title: string;
    description: string;
    section: string;
    tag?: string;
};

export async function getOgPages(): Promise<OgPage[]> {
    const { home, pages } = config.ui;

    const staticPages: OgPage[] = [
        {
            path: "index",
            title: home.hero.heading,
            description: config.description,
            section: "Home",
        },
        {
            path: "about",
            title: pages.about.heading,
            description: pages.about.description,
            section: "About",
        },
        {
            path: "blog",
            title: pages.writeups.heading,
            description: pages.writeups.description,
            section: "Writeups",
        },
        {
            path: "showcase",
            title: pages.showcase.heading,
            description: pages.showcase.description,
            section: "Showcase",
        },
        {
            path: "lab",
            title: pages.laboratory.heading,
            description: pages.laboratory.description,
            section: "Laboratory",
        },
        {
            path: "bookmarks",
            title: pages.bookmarks.heading,
            description: pages.bookmarks.description,
            section: "Bookmarks",
        },
        {
            path: "404",
            title: "This page could not be found",
            description:
                "The page you are looking for might have been moved, renamed, or does not exist.",
            section: "404",
        },
    ];

    const [writeups, showcases, experiments] = await Promise.all([
        getCollection("writeups"),
        getCollection("showcase"),
        getCollection("laboratory"),
    ]);

    return [
        ...staticPages,
        ...writeups.map(({ data }) => ({
            path: `blog/${data.slug}`,
            title: data.title,
            description: data.description,
            section: "Writeup",
            tag: data.tag,
        })),
        ...showcases.map(({ data }) => ({
            path: `showcase/${data.slug}`,
            title: data.title,
            description: data.description,
            section: "Showcase",
            tag: data.category,
        })),
        ...experiments.map(({ data }) => ({
            path: `lab/${data.slug}`,
            title: data.title,
            description: data.description,
            section: "Laboratory",
            tag: data.category,
        })),
    ];
}
