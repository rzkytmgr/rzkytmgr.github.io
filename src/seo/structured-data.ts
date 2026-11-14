import { config } from "../config";

export type ArticleMeta = {
    kind: "BlogPosting" | "Article";
    published: string;
    section: string;
    tags: string[];
};

type ArticleInput = {
    meta: ArticleMeta;
    title: string;
    description: string;
    url: string;
    image: string;
};

const CONTEXT = "https://schema.org";

function person() {
    return {
        "@type": "Person",
        name: config.author.name,
        url: config.url,
        jobTitle: config.author.title,
        sameAs: config.author.social
            .map(({ href }) => href)
            .filter((href) => href.startsWith("http")),
    };
}

export function homeStructuredData(siteUrl: string) {
    return [
        {
            "@context": CONTEXT,
            "@type": "WebSite",
            name: config.title,
            url: siteUrl,
            description: config.description,
            inLanguage: "en",
            author: person(),
        },
        { "@context": CONTEXT, ...person() },
    ];
}

export function articleStructuredData({
    meta,
    title,
    description,
    url,
    image,
}: ArticleInput) {
    return [
        {
            "@context": CONTEXT,
            "@type": meta.kind,
            headline: title,
            description,
            url,
            mainEntityOfPage: url,
            image,
            datePublished: meta.published,
            dateModified: meta.published,
            articleSection: meta.section,
            keywords: meta.tags.join(", "),
            inLanguage: "en",
            author: person(),
            publisher: person(),
        },
    ];
}

export function serializeStructuredData(data: unknown): string {
    return JSON.stringify(data).replace(/</g, "\\u003c");
}
