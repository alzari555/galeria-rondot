import { ArrowDown, ArrowLeft, ArrowUp, Check, Copy, Mail, MessageCircle } from "lucide-react";
import * as React from "react";
import type { ArtworkStatus, FocusedTarget } from "~/src/canvas/types";
import styles from "./style.module.css";

const STATUS_CONFIG: Record<
  ArtworkStatus,
  { label: string; dotClass: string; ctaLabel: string }
> = {
  disponible: {
    label: "Disponible para adquisición",
    dotClass: styles.statusAvailable ?? "",
    ctaLabel: "Consultar adquisición por WhatsApp",
  },
  reservado: {
    label: "Obra actualmente reservada",
    dotClass: styles.statusReserved ?? "",
    ctaLabel: "Consultar lista de espera por WhatsApp",
  },
  coleccion_privada: {
    label: "En colección privada",
    dotClass: styles.statusPrivate ?? "",
    ctaLabel: "Consultar por obra similar o encargo",
  },
};

export function EditorialView({
  target,
  visible,
  onReturnTo3D,
  onSelectVibe,
}: {
  target: FocusedTarget | null;
  visible: boolean;
  onReturnTo3D: () => void;
  onSelectVibe: (vibe: string) => void;
}) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const sheetRef = React.useRef<HTMLElement>(null);
  const hasScrolledDownRef = React.useRef(false);
  const touchStartYRef = React.useRef<number | null>(null);
  const [copied, setCopied] = React.useState(false);

  const lastArtworkRef = React.useRef(target?.artwork ?? null);
  if (target?.artwork) {
    lastArtworkRef.current = target.artwork;
  }
  const artwork = target?.artwork ?? lastArtworkRef.current;

  React.useEffect(() => {
    if (visible && containerRef.current) {
      containerRef.current.scrollTop = 0;
      hasScrolledDownRef.current = false;
    }
  }, [visible, target?.planeId]);

  // Escape key returns to 3D
  React.useEffect(() => {
    if (!visible) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onReturnTo3D();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [visible, onReturnTo3D]);

  // Detect scroll up to top or wheel up at top to return to 3D space naturally
  React.useEffect(() => {
    const el = containerRef.current;
    if (!el || !visible) return;

    const onScroll = () => {
      if (el.scrollTop > 90) {
        hasScrolledDownRef.current = true;
      } else if (hasScrolledDownRef.current && el.scrollTop <= 2) {
        hasScrolledDownRef.current = false;
        onReturnTo3D();
      }
    };

    const onWheel = (e: WheelEvent) => {
      if (el.scrollTop <= 2 && e.deltaY < -28) {
        onReturnTo3D();
      }
    };

    const onTouchStart = (e: TouchEvent) => {
      if (el.scrollTop <= 2 && e.touches[0]) {
        touchStartYRef.current = e.touches[0].clientY;
      } else {
        touchStartYRef.current = null;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (touchStartYRef.current !== null && el.scrollTop <= 2 && e.touches[0]) {
        const pullDelta = e.touches[0].clientY - touchStartYRef.current;
        if (pullDelta > 65) {
          touchStartYRef.current = null;
          onReturnTo3D();
        }
      }
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    el.addEventListener("wheel", onWheel, { passive: true });
    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: true });

    return () => {
      el.removeEventListener("scroll", onScroll);
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
    };
  }, [visible, onReturnTo3D]);

  const handleScrollToSpecs = () => {
    sheetRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleScrollUpAndReturn = () => {
    const el = containerRef.current;
    if (el && el.scrollTop > 20) {
      el.scrollTo({ top: 0, behavior: "smooth" });
      setTimeout(() => {
        onReturnTo3D();
      }, 360);
    } else {
      onReturnTo3D();
    }
  };

  const handleCopyReference = () => {
    if (!artwork) return;
    const text = `${artwork.title} (${artwork.catalogCode}) — ${artwork.dimensions}`;
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  if (!artwork) {
    return null;
  }

  const statusInfo = STATUS_CONFIG[artwork.status];
  const whatsappMessage = encodeURIComponent(
    `Hola! Estuve recorriendo la Galería Rondot 3D y me gustaría consultar por la obra "${artwork.title}" (Ref: ${artwork.catalogCode}, ${artwork.dimensions}).`
  );
  const whatsappUrl = `https://wa.me/?text=${whatsappMessage}`;
  const mailtoUrl = `mailto:contacto@galeriarondot.art?subject=${encodeURIComponent(
    `Consulta de Obra: ${artwork.title} (${artwork.catalogCode})`
  )}&body=${whatsappMessage}`;

  return (
    <div
      ref={containerRef}
      className={`${styles.overlay} ${visible ? styles.overlayVisible : ""}`}
      aria-hidden={!visible}
    >
      <div className={styles.topBar}>
        <button type="button" className={styles.backPill} onClick={handleScrollUpAndReturn}>
          <ArrowLeft size={15} />
          <span>Volver al espacio 3D</span>
          <span className={styles.kbdHint}>Esc</span>
        </button>
      </div>

      {/* Stage 1: Framed 3D painting in the center with prompt to scroll down */}
      <div className={styles.heroStage}>
        <button type="button" className={styles.scrollPrompt} onClick={handleScrollToSpecs}>
          <div className={styles.scrollPromptMeta}>
            <span>#{artwork.catalogCode}</span>
            <span>·</span>
            <span>{artwork.dimensions}</span>
          </div>
          <div className={styles.scrollPromptTitle}>{artwork.title}</div>
          <div className={styles.scrollPromptAction}>
            <span>Deslizar hacia abajo para ficha técnica y disponibilidad</span>
            <ArrowDown size={14} />
          </div>
        </button>
      </div>

      {/* Stage 2: Editorial Scroll Sheet (Kugiri Typography & Layout) */}
      <section ref={sheetRef} className={styles.editorialSheet}>
        <div className={styles.editorialContainer}>
          <header className={styles.masthead}>
            <div className={styles.metaRow}>
              <span className={styles.catalogChip}>CATÁLOGO #{artwork.catalogCode}</span>
              <span className={styles.statusBadge}>
                <span className={`${styles.statusDot} ${statusInfo.dotClass}`} />
                {statusInfo.label}
              </span>
            </div>

            <h1 className={styles.title}>{artwork.title}</h1>

            <p className={styles.artistLine}>
              Por <strong>{artwork.artist}</strong> — {artwork.year}
            </p>
          </header>

          <div className={styles.contentGrid}>
            <div className={styles.storyColumn}>
              <h2 className={styles.sectionLabel}>Nota Curatorial</h2>
              <p className={styles.lede}>{artwork.story}</p>
              <p className={styles.curatorialNote}>
                Cada pieza de la colección Galería Rondot se entrega con certificado de autenticidad firmado por el
                autor y registro en el archivo permanente de la galería. El montaje y enmarcado de conservación pueden
                coordinarse de acuerdo con el espacio de destino.
              </p>

              <div className={styles.artworkPreviewCard}>
                <img
                  src={artwork.url}
                  alt={artwork.title}
                  className={styles.artworkPreviewImg}
                  loading="lazy"
                />
                <div className={styles.artworkPreviewCaption}>
                  <span>Vista completa sin recorte</span>
                  <span>
                    {artwork.width} × {artwork.height} px (proporción original)
                  </span>
                </div>
              </div>
            </div>

            <aside className={styles.specsColumn}>
              <div className={styles.specsCard}>
                <h2 className={styles.sectionLabel}>Especificaciones de la Obra</h2>

                <dl className={styles.specList}>
                  <div className={styles.specItem}>
                    <dt className={styles.specTerm}>Dimensiones</dt>
                    <dd className={styles.specDescMono}>{artwork.dimensions}</dd>
                  </div>

                  <div className={styles.specItem}>
                    <dt className={styles.specTerm}>Técnica y Soporte</dt>
                    <dd className={styles.specDesc}>{artwork.technique}</dd>
                  </div>

                  <div className={styles.specItem}>
                    <dt className={styles.specTerm}>Año de Realización</dt>
                    <dd className={styles.specDescMono}>{artwork.year}</dd>
                  </div>

                  <div className={styles.specItem}>
                    <dt className={styles.specTerm}>Disponibilidad y Valor</dt>
                    <dd className={styles.specDescMono}>
                      {statusInfo.label} · {artwork.price}
                    </dd>
                  </div>

                  <div className={styles.specItem}>
                    <dt className={styles.specTerm}>Atmósfera / Vibes</dt>
                    <dd className={styles.vibesList}>
                      {artwork.vibes.map((vibe) => (
                        <button
                          key={vibe}
                          type="button"
                          className={styles.vibePill}
                          onClick={() => onSelectVibe(vibe)}
                          title={`Explorar otra obra con atmósfera "${vibe}"`}
                        >
                          #{vibe}
                        </button>
                      ))}
                    </dd>
                  </div>
                </dl>

                <div className={styles.ctaGroup}>
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.primaryButton}
                  >
                    <MessageCircle size={17} />
                    <span>{statusInfo.ctaLabel}</span>
                  </a>

                  <div className={styles.secondaryActions}>
                    <a href={mailtoUrl} className={styles.secondaryButton}>
                      <Mail size={15} />
                      <span>Consultar por Correo</span>
                    </a>

                    <button
                      type="button"
                      className={styles.secondaryButton}
                      onClick={handleCopyReference}
                      title="Copiar referencia de la obra"
                    >
                      {copied ? <Check size={15} /> : <Copy size={15} />}
                      <span>{copied ? "Copiado" : "Ref"}</span>
                    </button>
                  </div>
                </div>
              </div>
            </aside>
          </div>

          {/* Bottom accessibility button to scroll back up and return to the 3D gallery */}
          <div className={styles.bottomReturnSection}>
            <p className={styles.bottomReturnHint}>
              Fin de la ficha de obra · Haz scroll hacia arriba o usa el botón para reanudar el vuelo
            </p>
            <button
              type="button"
              className={styles.return3DButton}
              onClick={handleScrollUpAndReturn}
            >
              <ArrowUp size={17} />
              <span>Volver a la Galería en 3D</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
