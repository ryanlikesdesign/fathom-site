import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site-meta";

const base = SITE_URL;
const routes = ["", "/support", "/feedback", "/release-notes", "/privacy", "/terms", "/accessibility"];

export default function sitemap(): MetadataRoute.Sitemap {
  return routes.map((r) => ({ url: `${base}${r}`, changeFrequency: "monthly", priority: r === "" ? 1 : 0.7 }));
}
