import { Search, Sparkles, X } from "lucide-react";
import * as React from "react";
import type { ArtworkItem } from "~/src/canvas/types";
import styles from "./style.module.css";

const normalizeText = (str: string) =>
  str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

export function SearchModal({
  open,
  artworks,
  initialVibe,
  onClose,
  onSelectArtworkIndex,
}: {
  open: boolean;
  artworks: ArtworkItem[];
  initialVibe?: string | null;
  onClose: () => void;
  onSelectArtworkIndex: (index: number) => void;
}) {
  const [query, setQuery] = React.useState("");
  const [selectedVibe, setSelectedVibe] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (open) {
      setSelectedVibe(initialVibe ?? null);
      setQuery("");
      setTimeout(() => inputRef.current?.focus(), 40);
    }
  }, [open, initialVibe]);

  React.useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const allVibes = React.useMemo(() => {
    const set = new Set<string>();
    for (const art of artworks) {
      for (const v of art.vibes) {
        set.add(v);
      }
    }
    return Array.from(set);
  }, [artworks]);

  const filtered = React.useMemo(() => {
    const q = normalizeText(query.trim());

    return artworks
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => {
        if (selectedVibe && !item.vibes.includes(selectedVibe)) {
          return false;
        }

        if (!q) return true;

        const inTitle = normalizeText(item.title).includes(q);
        const inCode = normalizeText(item.catalogCode).includes(q);
        const inTech = normalizeText(item.technique).includes(q);
        const inTags = item.tags.some((t) => normalizeText(t).includes(q));
        const inVibes = item.vibes.some((v) => normalizeText(v).includes(q));

        return inTitle || inCode || inTech || inTags || inVibes;
      });
  }, [artworks, query, selectedVibe]);

  if (!open) {
    return null;
  }

  return (
    <div
      className={styles.modalBackdrop}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={styles.modalCard} role="dialog" aria-modal="true" aria-label="Buscar obra o atmósfera">
        <div className={styles.searchHeader}>
          <Search size={18} className={styles.searchIcon} />
          <input
            ref={inputRef}
            type="text"
            className={styles.searchInput}
            placeholder="Escribe el nombre de un cuadro, color, sensación o técnica…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button type="button" className={styles.closeModalBtn} onClick={onClose} aria-label="Cerrar buscador">
            <X size={15} />
          </button>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.vibesSection}>
            <h3 className={styles.modalSectionTitle}>Explorar por "Vibes" (Atmósfera)</h3>
            <div className={styles.vibeChipsWrap}>
              {allVibes.map((vibe) => {
                const isActive = selectedVibe === vibe;
                return (
                  <button
                    key={vibe}
                    type="button"
                    className={`${styles.vibeChipBtn} ${isActive ? styles.vibeChipBtnActive : ""}`}
                    onClick={() => setSelectedVibe(isActive ? null : vibe)}
                  >
                    <Sparkles size={11} />
                    <span>{vibe}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className={styles.vibesSection}>
            <h3 className={styles.modalSectionTitle}>
              Obras en el Espacio 3D ({filtered.length})
            </h3>

            {filtered.length === 0 ? (
              <div className={styles.emptyState}>
                No encontramos obras que coincidan con esa búsqueda. Prueba con otra "vibe" o palabra clave.
              </div>
            ) : (
              <div className={styles.resultsList}>
                {filtered.map(({ item, index }) => (
                  <button
                    key={item.id}
                    type="button"
                    className={styles.resultItem}
                    onClick={() => {
                      onSelectArtworkIndex(index);
                      onClose();
                    }}
                  >
                    <img src={item.url} alt={item.title} className={styles.resultThumb} loading="lazy" />
                    <div className={styles.resultInfo}>
                      <div className={styles.resultTitle}>{item.title}</div>
                      <div className={styles.resultMeta}>
                        <span>#{item.catalogCode}</span>
                        <span>·</span>
                        <span>{item.dimensions}</span>
                        <span>·</span>
                        <span>{item.vibes.slice(0, 3).join(", ")}</span>
                      </div>
                    </div>
                    <span className={styles.resultFlyLabel}>Volar a obra →</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
