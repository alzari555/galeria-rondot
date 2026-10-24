import * as React from "react";
import styles from "./style.module.css";

export function PageLoader({ progress }: { progress: number }) {
  const [show, setShow] = React.useState(true);
  const [minTimeElapsed, setMinTimeElapsed] = React.useState(false);
  const visualRef = React.useRef(0);
  const [visualProgress, setVisualProgress] = React.useState(0);

  React.useEffect(() => {
    const timer = setTimeout(() => setMinTimeElapsed(true), 900);
    return () => clearTimeout(timer);
  }, []);

  React.useEffect(() => {
    let raf: number;

    const animate = () => {
      const target = Math.max(progress, minTimeElapsed ? 100 : 35);
      const diff = target - visualRef.current;

      if (diff > 0.2) {
        visualRef.current += diff * 0.12;
        setVisualProgress(visualRef.current);
        raf = requestAnimationFrame(animate);
      } else {
        visualRef.current = target;
        setVisualProgress(target);
      }
    };

    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [progress, minTimeElapsed]);

  React.useEffect(() => {
    if (minTimeElapsed && visualProgress >= 99) {
      const t = setTimeout(() => setShow(false), 260);
      return () => clearTimeout(t);
    }
  }, [minTimeElapsed, visualProgress]);

  if (!show) {
    return null;
  }

  const isHidden = minTimeElapsed && visualProgress >= 99;

  return (
    <div className={`${styles.loaderOverlay} ${isHidden ? styles.loaderHidden : ""}`}>
      <div className={styles.loaderBrand}>Galería Rondot</div>
      <div className={styles.loaderTrack}>
        <div className={styles.loaderFill} style={{ transform: `scaleX(${visualProgress / 100})` }} />
      </div>
    </div>
  );
}
