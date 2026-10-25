/**
 * Mobile and Browser Safeguards
 * 
 * Prevents aggressive or unwanted mobile browser behaviors:
 * 1. Pinch-to-zoom scaling the whole web app layout (e.g. Samsung Internet ignoring user-scalable=no)
 * 2. Unwanted double-tap zooming on UI elements
 * 3. iOS Safari gesture zoom
 * 4. Detection of Samsung Internet forced dark mode overrides
 */

export function setupMobileSafeguards(): () => void {
  if (typeof window === "undefined") return () => {};

  // 1. Prevent browser multi-touch pinch-to-zoom on the viewport (outside canvas which handles 3D zoom internally)
  const onTouchMove = (e: TouchEvent) => {
    // If more than 1 finger and inside non-pinchable DOM (or target is not a custom canvas gesture handler)
    if (e.touches.length > 1) {
      const target = e.target as HTMLElement | null;
      // If the target is the WebGL canvas, the canvas has its own touch listeners and calls preventDefault
      // For any other element (editorial, headers, search modal), prevent browser viewport zoom
      if (!target?.closest("canvas")) {
        if (e.cancelable) {
          e.preventDefault();
        }
      }
    }
  };

  // 2. Prevent iOS Safari gesture zooming
  const onGesture = (e: Event) => {
    e.preventDefault();
  };

  // 3. Prevent rapid double-tap to zoom on UI buttons, text, and cards
  let lastTouchEnd = 0;
  const onTouchEnd = (e: TouchEvent) => {
    const now = Date.now();
    if (now - lastTouchEnd <= 300) {
      const target = e.target as HTMLElement | null;
      // Allow natural focus/tap on input fields
      if (!target || !["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) {
        if (e.cancelable) {
          e.preventDefault();
        }
      }
    }
    lastTouchEnd = now;
  };

  // 4. Prevent Ctrl + Wheel zoom on desktop trackpads / mice
  const onWheel = (e: WheelEvent) => {
    if (e.ctrlKey) {
      const target = e.target as HTMLElement | null;
      if (!target?.closest("canvas")) {
        e.preventDefault();
      }
    }
  };

  window.addEventListener("touchmove", onTouchMove, { passive: false });
  window.addEventListener("gesturestart", onGesture, { passive: false });
  window.addEventListener("gesturechange", onGesture, { passive: false });
  window.addEventListener("gestureend", onGesture, { passive: false });
  window.addEventListener("touchend", onTouchEnd, { passive: false });
  window.addEventListener("wheel", onWheel, { passive: false });

  return () => {
    window.removeEventListener("touchmove", onTouchMove);
    window.removeEventListener("gesturestart", onGesture);
    window.removeEventListener("gesturechange", onGesture);
    window.removeEventListener("gestureend", onGesture);
    window.removeEventListener("touchend", onTouchEnd);
    window.removeEventListener("wheel", onWheel);
  };
}

/**
 * Checks if the user is running Samsung Internet with its aggressive
 * "Dark mode for websites" feature enabled, which forcibly inverts colors.
 */
export function checkSamsungForcedDarkMode(): boolean {
  if (typeof window === "undefined" || !navigator.userAgent) return false;
  const isSamsung = /SamsungBrowser/i.test(navigator.userAgent);
  if (!isSamsung) return false;

  try {
    const testEl = document.createElement("div");
    testEl.style.cssText =
      "position:absolute;left:-9999px;top:-9999px;width:10px;height:10px;background-color:#ffffff;color:#000000;opacity:0;pointer-events:none;";
    document.body.appendChild(testEl);
    const comp = window.getComputedStyle(testEl);
    const bg = comp.backgroundColor;
    document.body.removeChild(testEl);

    // If Samsung Internet forced dark mode is active, pure #ffffff is rewritten to dark (rgb(18, 18, 18) etc.)
    const match = bg.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (match) {
      const r = parseInt(match[1], 10);
      const g = parseInt(match[2], 10);
      const b = parseInt(match[3], 10);
      if (r < 180 && g < 180 && b < 180) {
        return true;
      }
    }
  } catch {
    // Ignore test errors
  }

  return false;
}
