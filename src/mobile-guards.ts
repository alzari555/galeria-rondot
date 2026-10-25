/**
 * Mobile and Browser Safeguards
 * 
 * Protects visitors on mobile devices (especially pre-installed browsers like Samsung Internet
 * and Chrome Mobile) from disruptive default behaviors:
 * 1. Blocks browser-level pinch-to-zoom scaling the whole page layout (defeating Samsung Internet's zoom override)
 * 2. Blocks accidental double-tap auto-zoom on buttons, text and UI cards
 * 3. Blocks iOS Safari gesture zooming
 * 4. Flags Samsung Internet for defensive color/rendering overrides
 */

export function setupMobileSafeguards(): () => void {
  if (typeof window === "undefined") return () => {};

  // Flag Samsung Internet on <html> for CSS defensive rules
  if (navigator.userAgent && /SamsungBrowser/i.test(navigator.userAgent)) {
    document.documentElement.classList.add("samsung-browser");
  }

  // 1. Prevent browser multi-touch pinch-to-zoom on the HTML viewport
  // In WebGL canvas, 3D zoom reads e.touches positions directly; e.preventDefault() prevents the browser from scaling the page.
  const onTouchMove = (e: TouchEvent) => {
    if (e.touches.length > 1 && e.cancelable) {
      e.preventDefault();
    }
  };

  // 2. Prevent iOS Safari gesture zooming
  const onGesture = (e: Event) => {
    if (e.cancelable) {
      e.preventDefault();
    }
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

  // 4. Prevent Ctrl + Wheel zoom on desktop trackpads / mice outside canvas
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
