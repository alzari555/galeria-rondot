import { Compass, Search } from "lucide-react";
import styles from "./style.module.css";

export function Header({
  coords,
  hidden,
  onOpenSearch,
}: {
  coords: { x: number; y: number; z: number };
  hidden: boolean;
  onOpenSearch: () => void;
}) {
  return (
    <header className={`${styles.header} ${hidden ? styles.headerHidden : ""}`}>
      <div className={styles.brandCluster}>
        <h1 className={styles.brandTitle}>Galería Rondot</h1>
        <span className={styles.brandSub}>Archivo 3D Infinito</span>
      </div>

      <div className={styles.actionsCluster}>
        <div className={styles.coordsChip} title="Coordenadas actuales en el espacio 3D">
          <Compass size={13} />
          <span>
            X {coords.x} · Y {coords.y} · Z {coords.z}
          </span>
        </div>

        <button type="button" className={styles.searchButton} onClick={onOpenSearch}>
          <Search size={14} />
          <span>Buscar obra o "vibe"</span>
          <span className={styles.searchKbd}>⌘K</span>
        </button>
      </div>
    </header>
  );
}
