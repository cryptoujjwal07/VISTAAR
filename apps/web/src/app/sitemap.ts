import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://vistaar.ncpor.res.in";
  const routes = [
    "",
    "/explore",
    "/stations",
    "/expeditions",
    "/datasets",
    "/research",
    "/weather",
    "/education",
    "/media",
    "/documents",
    "/about",
  ];

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: route === "" ? 1.0 : 0.8,
  }));
}
