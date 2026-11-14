import type { APIRoute, GetStaticPaths } from "astro";
import { getOgPages, type OgPage } from "../../og/pages";
import { renderOgImage } from "../../og/render";

export const getStaticPaths = (async () =>
    (await getOgPages()).map((page) => ({
        params: { path: page.path },
        props: { page },
    }))) satisfies GetStaticPaths;

export const GET: APIRoute<{ page: OgPage }> = async ({ props }) =>
    new Response(await renderOgImage(props.page), {
        headers: { "Content-Type": "image/png" },
    });
