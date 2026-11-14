import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { toIsoDate } from "../utils/date";

const SECTIONS = {
    writeups: "blog",
    showcase: "showcase",
    laboratory: "lab",
} as const;

export function contentLastModified(
    contentDir = path.resolve("contents"),
): Map<string, string> {
    const dates = new Map<string, string>();
    const newestPerSection: string[] = [];

    for (const [folder, route] of Object.entries(SECTIONS)) {
        let newest = "";

        for (const file of fs.readdirSync(path.join(contentDir, folder))) {
            if (!file.endsWith(".mdx")) {
                continue;
            }

            const { data } = matter(
                fs.readFileSync(path.join(contentDir, folder, file), "utf8"),
            );
            const iso = toIsoDate(String(data.date ?? ""));

            if (!iso || typeof data.slug !== "string") {
                continue;
            }

            dates.set(`/${route}/${data.slug}/`, iso);
            newest = iso > newest ? iso : newest;
        }

        if (newest) {
            dates.set(`/${route}/`, newest);
            newestPerSection.push(newest);
        }
    }

    const newestOverall = newestPerSection.sort().at(-1);

    if (newestOverall) {
        dates.set("/", newestOverall);
    }

    return dates;
}
