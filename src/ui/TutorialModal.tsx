import { ArrowLeft, ArrowRight, Compass, Info, Sparkles, X } from "lucide-react";
import * as React from "react";
import styles from "./tutorial.module.css";
import { type GestureType, TutorialMediaPlaceholder } from "./TutorialMediaPlaceholder";

export interface TutorialCardData {
  id: string;
  tag: string;
  title: string;
  description: string;
  tip?: string;
  gestureType: GestureType;
  candidateSources: string[];
  recommendedPath: string;
  alt: string;
}

const TUTORIAL_CARDS: TutorialCardData[] = [
  {
    id: "swipe",
    tag: "Tutorial 01",
    title: "Explora el lienzo infinito",
    description:
      "Desliza con un dedo sobre la pantalla o mantén pulsado y arrastra con el ratón para moverte con total libertad a través del espacio 3D.",
    tip: "En computadora también puedes usar las teclas W, A, S, D o flechas del teclado para desplazarte.",
    gestureType: "swipe",
    candidateSources: [
      "/tutorial/deslizar.webp",
      "/tutorial/deslizar.apng",
      "/tutorial/swipe.webp",
      "/tutorial/swipe.apng",
    ],
    recommendedPath: "/tutorial/deslizar.webp",
    alt: "Animación de deslizar con un dedo para navegar",
  },
  {
    id: "pinch",
    tag: "Tutorial 02",
    title: "Viaja en profundidad",
    description:
      "Haz el gesto de la pinza con dos dedos (juntar o separar) en tu dispositivo para sumergirte entre las capas de obras. En PC, usa la rueda del ratón o el trackpad.",
    tip: "Al acercarte a cada obra descubrirás la riqueza del trazo, la luz y las capas de materia.",
    gestureType: "pinch",
    candidateSources: [
      "/tutorial/pincita.webp",
      "/tutorial/pincita.apng",
      "/tutorial/pinch.webp",
      "/tutorial/pinch.apng",
    ],
    recommendedPath: "/tutorial/pincita.webp",
    alt: "Animación haciendo la pinza con dos dedos para acercar y alejar",
  },
  {
    id: "tap",
    tag: "Tutorial 03",
    title: "Detalles y Lectura Curatorial",
    description:
      "Toca o haz clic sobre cualquier pintura para enfocarla y abrir su ficha técnica, texto curatorial e historia de la pieza.",
    tip: "Para regresar a la galería infinita, presiona la flecha de volver.",
    gestureType: "tap",
    candidateSources: [
      "/tutorial/tocar.webp",
      "/tutorial/tocar.apng",
      "/tutorial/tap.webp",
      "/tutorial/tap.apng",
    ],
    recommendedPath: "/tutorial/tocar.webp",
    alt: "Animación tocando una obra para abrir detalles",
  },
  {
    id: "search",
    tag: "Recomendaciones",
    title: "Búsqueda y Atmósferas",
    description:
      "Pulsa el botón 'Buscar' para filtrar por vibras conceptuales (místico, silencio, nocturno, etc.), paletas o títulos recomendados.",
    tip: "En la ficha de cualquier obra puedes hacer clic en una vibra para volar directamente a obras afines.",
    gestureType: "search",
    candidateSources: [
      "/tutorial/recomendaciones.webp",
      "/tutorial/recomendaciones.apng",
    ],
    recommendedPath: "/tutorial/recomendaciones.webp",
    alt: "Recomendaciones de búsqueda y exploración por vibras",
  },
];

const TUTORIAL_STORAGE_KEY = "galeria_rondot_tutorial_seen";

export function TutorialModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const touchStartXRef = React.useRef<number | null>(null);

  // Reset to first slide when opening
  React.useEffect(() => {
    if (open) {
      setCurrentIndex(0);
    }
  }, [open]);

  // Handle keyboard navigation
  React.useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleDismiss();
      } else if (e.key === "ArrowRight") {
        setCurrentIndex((prev) => Math.min(prev + 1, TUTORIAL_CARDS.length - 1));
      } else if (e.key === "ArrowLeft") {
        setCurrentIndex((prev) => Math.max(prev - 1, 0));
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const handleDismiss = () => {
    try {
      localStorage.setItem(TUTORIAL_STORAGE_KEY, "true");
    } catch {
      // ignore storage errors
    }
    onClose();
  };

  const handleNext = () => {
    if (currentIndex < TUTORIAL_CARDS.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      handleDismiss();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  // Touch swipe support for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0]?.clientX ?? null;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null) return;
    const touchEndX = e.changedTouches[0]?.clientX ?? touchStartXRef.current;
    const diff = touchStartXRef.current - touchEndX;

    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        // Swiped left -> next
        handleNext();
      } else {
        // Swiped right -> prev
        handlePrev();
      }
    }
    touchStartXRef.current = null;
  };

  if (!open) return null;

  const currentCard = TUTORIAL_CARDS[currentIndex]!;
  const isLast = currentIndex === TUTORIAL_CARDS.length - 1;

  return (
    <div
      className={styles.backdrop}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleDismiss();
      }}
    >
      <div
        className={styles.modalCard}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tutorial-dialog-title"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Header */}
        <div className={styles.modalHeader}>
          <div className={styles.headerTitleGroup}>
            <div className={styles.headerIconBadge}>
              <Compass size={16} />
            </div>
            <h2 id="tutorial-dialog-title" className={styles.headerTitle}>
              Guía de Navegación
            </h2>
          </div>
          <button
            type="button"
            className={styles.closeButton}
            onClick={handleDismiss}
            aria-label="Cerrar guía"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className={styles.modalBody}>
          <TutorialMediaPlaceholder
            key={currentCard.id}
            gestureType={currentCard.gestureType}
            candidateSources={currentCard.candidateSources}
            recommendedPath={currentCard.recommendedPath}
            alt={currentCard.alt}
          />

          <div className={styles.cardMeta}>
            <div className={styles.tagRow}>
              <span className={styles.stepTag}>{currentCard.tag}</span>
              <span className={styles.stepCounter}>
                {currentIndex + 1} de {TUTORIAL_CARDS.length}
              </span>
            </div>

            <h3 className={styles.cardTitle}>{currentCard.title}</h3>
            <p className={styles.cardDescription}>{currentCard.description}</p>

            {currentCard.tip && (
              <div className={styles.tipBox}>
                <Info size={15} className={styles.tipIcon} />
                <span>{currentCard.tip}</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className={styles.modalFooter}>
          <div className={styles.dotsWrapper} aria-label="Indicador de paso">
            {TUTORIAL_CARDS.map((card, idx) => (
              <button
                key={card.id}
                type="button"
                className={`${styles.dot} ${idx === currentIndex ? styles.dotActive : ""}`}
                onClick={() => setCurrentIndex(idx)}
                aria-label={`Ir al paso ${idx + 1}: ${card.title}`}
              />
            ))}
          </div>

          <div className={styles.footerActions}>
            <button
              type="button"
              className={styles.btnSecondary}
              onClick={handlePrev}
              disabled={currentIndex === 0}
              aria-label="Paso anterior"
            >
              <ArrowLeft size={14} />
              <span>Anterior</span>
            </button>

            <button
              type="button"
              className={styles.btnPrimary}
              onClick={handleNext}
              aria-label={isLast ? "Comenzar a explorar" : "Siguiente paso"}
            >
              <span>{isLast ? "Comenzar a explorar" : "Siguiente"}</span>
              {isLast ? <Sparkles size={14} /> : <ArrowRight size={14} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Utility to check if user has previously seen tutorial */
export function hasSeenTutorial(): boolean {
  try {
    return localStorage.getItem(TUTORIAL_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}
