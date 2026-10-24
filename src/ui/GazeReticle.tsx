import type { GazeStatus } from "~/src/canvas/types";
import styles from "./style.module.css";

const RADIUS = 8;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function GazeReticle({ gaze }: { gaze: GazeStatus }) {
  const isVisible = gaze.progress > 0.08 && gaze.artwork !== null;
  const dashOffset = CIRCUMFERENCE * (1 - gaze.progress);

  return (
    <div className={`${styles.gazeContainer} ${isVisible ? styles.gazeVisible : ""}`}>
      {gaze.artwork && (
        <div className={styles.gazePill}>
          <svg className={styles.gazeRingSvg} viewBox="0 0 20 20">
            <circle className={styles.gazeRingTrack} cx="10" cy="10" r={RADIUS} />
            <circle
              className={styles.gazeRingFill}
              cx="10"
              cy="10"
              r={RADIUS}
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={dashOffset}
            />
          </svg>
          <span>Enfocando «{gaze.artwork.title}»…</span>
        </div>
      )}
    </div>
  );
}
