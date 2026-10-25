import { Search } from "lucide-react";
import styles from "./style.module.css";

export function Header({
  hidden,
  onOpenSearch,
}: {
  coords?: { x: number; y: number; z: number };
  hidden: boolean;
  onOpenSearch: () => void;
}) {
  return (
    <header className={`${styles.header} ${hidden ? styles.headerHidden : ""}`}>
      <div />
      <div className={styles.actionsCluster}>
        <button type="button" className={styles.searchButton} onClick={onOpenSearch}>
          <Search size={14} />
          <span>Buscar obra o "vibe"</span>
          <span className={styles.searchKbd}>⌘K</span>
        </button>
      </div>
    </header>
  );
}
