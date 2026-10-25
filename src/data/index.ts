import type { ArtworkItem } from "~/src/canvas/types";
import artworksFallback from "./artworks.json";

const artworkModules = import.meta.glob<ArtworkItem | { default: ArtworkItem }>(
  "./artworks/*.json",
  { eager: true }
);

export const getArtworks = (): ArtworkItem[] => {
  const list: ArtworkItem[] = [];

  for (const path in artworkModules) {
    const mod = artworkModules[path];
    if (mod) {
      const item = "default" in mod ? mod.default : mod;
      list.push(item);
    }
  }

  if (list.length > 0) {
    list.sort((a, b) => (a.catalogCode || "").localeCompare(b.catalogCode || ""));
    return list;
  }

  const raw = artworksFallback as ArtworkItem[] | { items?: ArtworkItem[] };
  return Array.isArray(raw) ? raw : (raw.items ?? []);
};
