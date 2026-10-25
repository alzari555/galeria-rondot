import * as React from "react";
import styles from "./tutorial.module.css";

export type GestureType = "swipe" | "pinch" | "tap" | "search";

interface TutorialMediaPlaceholderProps {
  gestureType: GestureType;
  candidateSources: string[];
  recommendedPath: string;
  alt: string;
}

export function TutorialMediaPlaceholder({
  gestureType,
  candidateSources,
  recommendedPath,
  alt,
}: TutorialMediaPlaceholderProps) {
  const [activeSrc, setActiveSrc] = React.useState<string | null>(null);

  // Try loading provided candidate paths (e.g. .webp, .apng)
  React.useEffect(() => {
    let cancelled = false;
    setActiveSrc(null);

    const tryLoadNext = (index: number) => {
      if (index >= candidateSources.length || cancelled) {
        return;
      }
      const testSrc = candidateSources[index];
      if (!testSrc) return;

      const img = new Image();
      img.onload = () => {
        if (!cancelled) {
          setActiveSrc(testSrc);
        }
      };
      img.onerror = () => {
        if (!cancelled) {
          tryLoadNext(index + 1);
        }
      };
      img.src = testSrc;
    };

    tryLoadNext(0);

    return () => {
      cancelled = true;
    };
  }, [candidateSources]);

  return (
    <div className={styles.mediaSlot}>
      {activeSrc ? (
        <img src={activeSrc} alt={alt} className={styles.userAnimationImg} />
      ) : (
        <div className={styles.svgGestureWrapper} aria-label={alt}>
          {gestureType === "swipe" && <SwipeGestureSvg />}
          {gestureType === "pinch" && <PinchGestureSvg />}
          {gestureType === "tap" && <TapGestureSvg />}
          {gestureType === "search" && <SearchGestureSvg />}

          <div className={styles.placeholderNotice}>
            <span>Placeholder interactivo</span>
            <span>
              Sube tu animación a: <code className={styles.placeholderCode}>{recommendedPath}</code>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function SwipeGestureSvg() {
  return (
    <svg className={styles.gestureSvg} viewBox="0 0 320 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="swipeTouchGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#5b3fd6" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#5b3fd6" stopOpacity="0" />
        </radialGradient>
        <filter id="shadowSwipe" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="4" floodOpacity="0.12" />
        </filter>
      </defs>

      {/* Track line & arrows */}
      <line x1="60" y1="100" x2="260" y2="100" stroke="#d5d7e3" strokeWidth="2" strokeDasharray="4 4" />
      <path d="M 66 94 L 58 100 L 66 106" stroke="#9498a8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M 254 94 L 262 100 L 254 106" stroke="#9498a8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

      {/* Reference artworks floating in background */}
      <rect x="70" y="45" width="46" height="34" rx="4" fill="#ffffff" stroke="#e2e4ee" strokeWidth="1.5" />
      <rect x="136" y="38" width="54" height="40" rx="4" fill="#ffffff" stroke="#e2e4ee" strokeWidth="1.5" />
      <rect x="210" y="45" width="46" height="34" rx="4" fill="#ffffff" stroke="#e2e4ee" strokeWidth="1.5" />

      {/* Sliding Hand / Finger group */}
      <g className={styles.animSwipe} transform="translate(160, 100)">
        {/* Glow */}
        <circle cx="0" cy="0" r="28" fill="url(#swipeTouchGlow)" />
        {/* Touch point */}
        <circle cx="0" cy="0" r="14" fill="#5b3fd6" filter="url(#shadowSwipe)" />
        <circle cx="0" cy="0" r="5" fill="#ffffff" />
        {/* Stylized Finger / pointer vector */}
        <path
          d="M 0 14 C 4 28, 16 54, 26 72 C 28 76, 26 80, 20 80 C 12 80, -2 46, -10 32"
          stroke="#16181f"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="#fbfbfe"
        />
      </g>
    </svg>
  );
}

function PinchGestureSvg() {
  return (
    <svg className={styles.gestureSvg} viewBox="0 0 320 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="pinchGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#5b3fd6" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#5b3fd6" stopOpacity="0" />
        </radialGradient>
        <filter id="shadowPinch" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="3" stdDeviation="3" floodOpacity="0.14" />
        </filter>
      </defs>

      {/* Concentric depth perspective rings */}
      <circle cx="160" cy="100" r="70" stroke="#e4e6f0" strokeWidth="1.5" strokeDasharray="6 6" />
      <circle cx="160" cy="100" r="42" stroke="#d5d8e6" strokeWidth="1.5" />
      <circle cx="160" cy="100" r="18" stroke="#5b3fd6" strokeWidth="1.5" opacity="0.3" />

      {/* Pulsing ripple in center */}
      <circle cx="160" cy="100" r="30" stroke="#5b3fd6" strokeWidth="2" className={styles.animRipple} />

      {/* Guide line between pinch points */}
      <line
        x1="126"
        y1="68"
        x2="194"
        y2="132"
        stroke="#5b3fd6"
        strokeWidth="2"
        strokeDasharray="4 4"
        className={styles.animPinchGuide}
      />

      {/* Finger 1 (Top-Left, index finger) */}
      <g className={styles.animPinchTop} transform="translate(132, 74)">
        <circle cx="0" cy="0" r="24" fill="url(#pinchGlow)" />
        <circle cx="0" cy="0" r="13" fill="#5b3fd6" filter="url(#shadowPinch)" />
        <circle cx="0" cy="0" r="4.5" fill="#ffffff" />
        <path
          d="M -6 -8 C -18 -22, -36 -42, -52 -54"
          stroke="#16181f"
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
        />
      </g>

      {/* Finger 2 (Bottom-Right, thumb) */}
      <g className={styles.animPinchBottom} transform="translate(188, 126)">
        <circle cx="0" cy="0" r="24" fill="url(#pinchGlow)" />
        <circle cx="0" cy="0" r="13" fill="#5b3fd6" filter="url(#shadowPinch)" />
        <circle cx="0" cy="0" r="4.5" fill="#ffffff" />
        <path
          d="M 6 8 C 18 24, 38 46, 54 58"
          stroke="#16181f"
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
        />
      </g>
    </svg>
  );
}

function TapGestureSvg() {
  return (
    <svg className={styles.gestureSvg} viewBox="0 0 320 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="tapGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#5b3fd6" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#5b3fd6" stopOpacity="0" />
        </radialGradient>
        <filter id="shadowTap" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="5" floodOpacity="0.15" />
        </filter>
      </defs>

      {/* Framed Artwork in background */}
      <rect x="95" y="40" width="130" height="96" rx="6" fill="#ffffff" stroke="#16181f" strokeWidth="2.5" />
      <rect x="105" y="50" width="110" height="76" rx="3" fill="#f0f1f7" />
      {/* Artwork abstract painting shapes */}
      <circle cx="140" cy="84" r="22" fill="#e2def2" />
      <path d="M 120 114 Q 150 78 185 110 L 205 124 L 110 124 Z" fill="#c3bedc" />

      {/* Tap Ripple Effect */}
      <circle cx="160" cy="95" r="28" stroke="#5b3fd6" strokeWidth="2" className={styles.animRipple} />

      {/* Tapping Finger */}
      <g className={styles.animTap} transform="translate(160, 95)">
        <circle cx="0" cy="0" r="22" fill="url(#tapGlow)" />
        <circle cx="0" cy="0" r="12" fill="#5b3fd6" filter="url(#shadowTap)" />
        <circle cx="0" cy="0" r="4.5" fill="#ffffff" />
        <path
          d="M 0 12 C 4 30, 14 62, 22 84"
          stroke="#16181f"
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
        />
      </g>
    </svg>
  );
}

function SearchGestureSvg() {
  return (
    <svg className={styles.gestureSvg} viewBox="0 0 320 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="shadowSearch" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="3" stdDeviation="4" floodOpacity="0.08" />
        </filter>
      </defs>

      {/* Search Input bar representation */}
      <g className={styles.animFloat} transform="translate(45, 45)">
        <rect x="0" y="0" width="230" height="40" rx="10" fill="#ffffff" stroke="#dcdfe9" strokeWidth="1.5" filter="url(#shadowSearch)" />
        <circle cx="22" cy="20" r="6" stroke="#6b6f7b" strokeWidth="2" />
        <line x1="26.5" y1="24.5" x2="31" y2="29" stroke="#6b6f7b" strokeWidth="2" strokeLinecap="round" />
        <rect x="42" y="16" width="90" height="8" rx="4" fill="#ebedf4" />
      </g>

      {/* Floating Vibe Pills */}
      <g transform="translate(55, 110)">
        <rect x="0" y="0" width="68" height="26" rx="13" fill="#e6e2f7" />
        <text x="12" y="17" fill="#5b3fd6" fontSize="11" fontFamily="sans-serif" fontWeight="500">Místico</text>
      </g>

      <g transform="translate(132, 105)">
        <rect x="0" y="0" width="76" height="26" rx="13" fill="#f0f2f8" stroke="#e0e3ed" strokeWidth="1" />
        <text x="12" y="17" fill="#3b3e49" fontSize="11" fontFamily="sans-serif" fontWeight="500">Silencio</text>
      </g>

      <g transform="translate(90, 145)">
        <rect x="0" y="0" width="94" height="26" rx="13" fill="#f0f2f8" stroke="#e0e3ed" strokeWidth="1" />
        <text x="12" y="17" fill="#3b3e49" fontSize="11" fontFamily="sans-serif" fontWeight="500">Geometría</text>
      </g>
    </svg>
  );
}
