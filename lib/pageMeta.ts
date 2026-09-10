import type { Metadata } from "next";

const SITE = "https://fathomvision.app";

/**
 * Metadata for the subpages. The layout's title template appends " | Fathom"
 * to the document title; Open Graph titles skip the template, so the suffix
 * is spelled out here to keep link previews and tabs reading the same.
 */
export function pageMeta(title: string, description: string, path: string): Metadata {
  return {
    title,
    description,
    openGraph: { title: `${title} | Fathom`, description, url: `${SITE}${path}` },
    twitter: { title, description },
    alternates: { canonical: path },
  };
}
