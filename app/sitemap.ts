import type { MetadataRoute } from "next";

const base = "https://fathomvision.app";
const routes = ["", "/support", "/feedback", "/release-notes", "/privacy", "/terms"];

export default function sitemap(): MetadataRoute.Sitemap {
  return routes.map((r) => ({ url: `${base}${r}`, changeFrequency: "monthly", priority: r === "" ? 1 : 0.7 }));
}
