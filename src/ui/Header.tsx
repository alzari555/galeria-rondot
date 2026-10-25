import { Compass, Search } from "lucide-react";
import styles from "./style.module.css";
import tutorialStyles from "./tutorial.module.css";

export function Header({
  hidden,
  onOpenSearch,
  onOpenTutorial,
}: {
  coords?: { x: number; y: number; z: number };
  hidden: boolean;
  onOpenSearch: () => void;
  onOpenTutorial?: () => void;
}) {
  return (
    <header className={`${styles.header} ${hidden ? styles.headerHidden : ""}`}>
      <div />
      <div className={styles.actionsCluster}>
        {onOpenTutorial && (
          <button
            type="button"
            className={tutorialStyles.tutorialHeaderBtn}
            onClick={onOpenTutorial}
            title="Ver guía y tutoriales"
            aria-label="Ver guía de navegación y tutoriales"
          >
            <Compass size={14} />
            <span>Guía</span>
          </button>
        )}
        <button type="button" className={styles.searchButton} onClick={onOpenSearch}>
          <Search size={14} />
          <span>Buscar obra o "vibe"</span>
        </button>
      </div>
    </header>
  );
}
