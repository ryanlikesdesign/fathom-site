import type { Metadata } from "next";
import { OG_BASE, OG_IMAGE, SITE_NAME, SITE_URL } from "@/lib/site-meta";

/**
 * Metadata for the subpages. The layout's title template appends " | fathom"
 * to the document title; Open Graph and Twitter titles skip the template, so
 * the suffix is spelled out here to keep link previews and tabs reading the
 * same.
 *
 * A page's openGraph and twitter replace the layout's whole (Next merges
 * metadata shallowly), so the shared fields, the preview image among them,
 * are spread back in here.
 */
export function pageMeta(title: string, description: string, path: string): Metadata {
  const shared = `${title} | ${SITE_NAME}`;
  return {
    title,
    description,
    openGraph: {
      ...OG_BASE,
      images: [...OG_BASE.images],
      title: shared,
      description,
      url: `${SITE_URL}${path}`,
    },
    twitter: { card: "summary_large_image", title: shared, description, images: [OG_IMAGE] },
    alternates: { canonical: path },
  };
}
