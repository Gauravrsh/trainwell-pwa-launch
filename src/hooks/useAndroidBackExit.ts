import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { toast } from "sonner";

/**
 * TW-014: Android back button does not exit installed PWA from root screens.
 *
 * Standalone Android PWAs only exit when the history stack is at its first
 * entry. Stray pushes from route guards / redirects trap users on the home
 * screen (back button does nothing visible).
 *
 * Strategy:
 *  - Only active in display-mode: standalone (installed PWA). Browser tabs
 *    keep their default back behaviour.
 *  - On root routes (`/`, `/dashboard`, `/auth`), push a sentinel state
 *    entry. When the user pops back to it, intercept once and show
 *    "Press back again to exit". A second back within 2s allows the pop,
 *    which exits the PWA because there's nothing left in history.
 *  - On non-root routes, behave normally (back navigates within the app).
 */

const ROOT_ROUTES = new Set(["/", "/dashboard", "/auth"]);
const SENTINEL = { __vectoBackSentinel: true } as const;
const EXIT_WINDOW_MS = 2000;

const isStandalone = () => {
  if (typeof window === "undefined") return false;
  // iOS Safari uses navigator.standalone; Android/desktop use display-mode.
  const mql = window.matchMedia?.("(display-mode: standalone)");
  // @ts-expect-error - non-standard iOS property
  return Boolean(mql?.matches || window.navigator.standalone);
};

export const useAndroidBackExit = () => {
  const location = useLocation();
  const armedRef = useRef(false);
  const exitPromptAtRef = useRef<number>(0);

  useEffect(() => {
    if (!isStandalone()) return;
    if (!ROOT_ROUTES.has(location.pathname)) {
      armedRef.current = false;
      return;
    }

    // Push sentinel so the next back press lands here instead of exiting.
    try {
      window.history.pushState(SENTINEL, "");
      armedRef.current = true;
    } catch {
      armedRef.current = false;
      return;
    }

    const onPopState = () => {
      if (!armedRef.current) return;
      // Only intercept while still on a root route.
      if (!ROOT_ROUTES.has(window.location.pathname)) {
        armedRef.current = false;
        return;
      }

      const now = Date.now();
      if (now - exitPromptAtRef.current < EXIT_WINDOW_MS) {
        // Second tap within window — let the pop happen (exits PWA).
        armedRef.current = false;
        return;
      }

      // First tap — re-push sentinel and prompt.
      exitPromptAtRef.current = now;
      try {
        window.history.pushState(SENTINEL, "");
      } catch {
        // If we can't re-push, drop guard so a subsequent back can exit.
        armedRef.current = false;
        return;
      }
      toast("Press back again to exit", { duration: EXIT_WINDOW_MS });
    };

    window.addEventListener("popstate", onPopState);
    return () => {
      window.removeEventListener("popstate", onPopState);
    };
  }, [location.pathname]);
};