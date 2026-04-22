import { useEffect } from "react";

/**
 * TW-017: Track on-screen keyboard height via VisualViewport API and expose
 * it as the CSS variable `--kb-inset` on <html>. Used by `.dialog-wrapper`
 * to recenter modals above the keyboard instead of being overlapped by it.
 *
 * Falls back to 0 when VisualViewport is unsupported (older browsers / iOS <13).
 * No-op on devices that don't fire viewport changes (desktop) — value stays 0.
 */
export const useKeyboardInset = () => {
  useEffect(() => {
    const vv = typeof window !== "undefined" ? window.visualViewport : null;
    if (!vv) return;

    const root = document.documentElement;

    const update = () => {
      // Keyboard inset = how much of the layout viewport is hidden at the bottom.
      // window.innerHeight is the layout viewport; vv.height shrinks when keyboard opens.
      const inset = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      // Only update when meaningful to avoid layout thrash.
      const current = parseFloat(root.style.getPropertyValue("--kb-inset")) || 0;
      if (Math.abs(current - inset) > 1) {
        root.style.setProperty("--kb-inset", `${inset}px`);
      }
    };

    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
      root.style.setProperty("--kb-inset", "0px");
    };
  }, []);
};