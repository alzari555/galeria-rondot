import { useIsTouchDevice } from "~/src/use-is-touch-device";
import styles from "./style.module.css";

export function ControlsGuide({ hidden }: { hidden: boolean }) {
  const isTouchDevice = useIsTouchDevice();

  return (
    <footer className={`${styles.controlsFooter} ${hidden ? styles.controlsFooterHidden : ""}`}>
      <div className={styles.controlsBar}>
        {isTouchDevice ? (
          <>
            <span>
              <b>Arrastrar</b> Desplazar
            </span>
            <span>·</span>
            <span>
              <b>Pellizcar</b> Zoom
            </span>
            <span>·</span>
            <span>
              <b>Tap o Mirar fijo</b> Abrir ficha de obra
            </span>
          </>
        ) : (
          <>
            <span>
              <b>Arrastrar / WASD / QE</b> Navegar
            </span>
            <span>·</span>
            <span>
              <b>Rueda / Pellizco Trackpad</b> Zoom
            </span>
            <span>·</span>
            <span>
              <b>Clic o Mirar fijo</b> Enfocar obra
            </span>
          </>
        )}
      </div>
    </footer>
  );
}
