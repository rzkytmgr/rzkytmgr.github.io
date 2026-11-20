import type { APIRoute, GetStaticPaths } from "astro";
import { getMetaImagePages, type MetaImagePage } from "@/lib/meta/image-pages";
import { renderMetaImage } from "@/lib/meta/image-render";

export const getStaticPaths = (async () =>
    (await getMetaImagePages()).map((page) => ({
        params: { path: page.path },
        props: { page },
    }))) satisfies GetStaticPaths;

export const GET: APIRoute<{ page: MetaImagePage }> = async ({ props }) =>
    new Response(await renderMetaImage(props.page), {
        headers: { "Content-Type": "image/jpeg" },
    });
