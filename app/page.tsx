import type { Metadata } from "next";
import { FathomLanding } from "@/components/FathomLanding";
import { COPY_13 } from "@/lib/copy-13";
import { homePageJsonLd, jsonLdScript } from "@/lib/site-meta";

export const metadata: Metadata = {
  // absolute: the homepage title is the whole line; the layout template
  // would otherwise append "| fathom" to it.
  title: { absolute: COPY_13.meta.title },
  description: COPY_13.meta.description,
  // Resolved against metadataBase (SITE_URL, www), as every subpage's is.
  alternates: { canonical: "/" },
};

export default function Home() {
  return (
    <>
      {/* The homepage's own node; the layout carries the app's. */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(homePageJsonLd) }} />
      <FathomLanding />
    </>
  );
}
