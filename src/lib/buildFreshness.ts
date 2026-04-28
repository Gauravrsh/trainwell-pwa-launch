import { logError } from "@/lib/errorUtils";

declare const __APP_BUILD_ID__: string;

const BUILD_REFRESH_KEY = "vecto:build-refresh-attempted";
const SERVICE_WORKER_URL = "/sw.js";
const BUILD_ID_URL = "/build-id.json";

export const activeBuildId = __APP_BUILD_ID__;

let controllerChangeReloadBound = false;
let visibilityCheckBound = false;
let freshnessCheckInFlight = false;

const isInIframe = (): boolean => {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
};

const isPreviewHost = (): boolean => {
  const host = window.location.hostname;
  return host.includes("id-preview--") || host.includes("lovableproject.com");
};

export const isServiceWorkerAllowed = (): boolean => {
  if (typeof window === "undefined" || typeof navigator === "undefined") return false;
  if (import.meta.env.DEV) return false;
  if (!("serviceWorker" in navigator)) return false;
  return !isInIframe() && !isPreviewHost();
};

export const clearBrowserCaches = async ({ unregisterServiceWorkers = true } = {}) => {
  if ("caches" in window) {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)));
  }

  if (unregisterServiceWorkers && "serviceWorker" in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map((registration) => registration.unregister()));
  }
};

const unregisterPreviewServiceWorkers = () => {
  if (!("serviceWorker" in navigator)) return;
  navigator.serviceWorker
    .getRegistrations()
    .then((registrations) => registrations.forEach((registration) => registration.unregister()))
    .catch((error) => logError("buildFreshness.unregisterPreviewServiceWorkers", error));
};

export const registerAppServiceWorker = () => {
  if (!isServiceWorkerAllowed()) {
    if (typeof window !== "undefined" && (isPreviewHost() || isInIframe())) {
      unregisterPreviewServiceWorkers();
    }
    return;
  }

  // Auto-reload as soon as a new SW takes control of this page.
  if (!controllerChangeReloadBound && "serviceWorker" in navigator) {
    controllerChangeReloadBound = true;
    let reloaded = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (reloaded) return;
      reloaded = true;
      window.location.reload();
    });
  }

  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register(SERVICE_WORKER_URL, { scope: "/", updateViaCache: "none" })
      .then((registration) => {
        const promoteWaiting = (worker: ServiceWorker | null) => {
          if (worker && navigator.serviceWorker.controller) {
            worker.postMessage({ type: "SKIP_WAITING" });
          }
        };

        if (registration.waiting) {
          promoteWaiting(registration.waiting);
        }

        registration.addEventListener("updatefound", () => {
          const installing = registration.installing;
          if (!installing) return;
          installing.addEventListener("statechange", () => {
            if (installing.state === "installed") {
              promoteWaiting(installing);
            }
          });
        });

        return registration.update();
      })
      .catch((error) => logError("buildFreshness.registerAppServiceWorker", error));
  });
};

const runFreshnessCheck = async () => {
  if (freshnessCheckInFlight) return;
  freshnessCheckInFlight = true;
  try {
    const response = await fetch(`${BUILD_ID_URL}?t=${Date.now()}`, {
      cache: "no-store",
      headers: { "cache-control": "no-cache" },
    });
    if (!response.ok) return;

    const payload = (await response.json()) as { buildId?: string };
    const latestBuildId = payload.buildId;

    if (!latestBuildId || latestBuildId === activeBuildId) return;
    if (sessionStorage.getItem(BUILD_REFRESH_KEY) === latestBuildId) return;

    sessionStorage.setItem(BUILD_REFRESH_KEY, latestBuildId);

    // Ask any controlling SW to update + activate before we reload.
    if ("serviceWorker" in navigator) {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(
          registrations.map(async (registration) => {
            await registration.update().catch(() => undefined);
            if (registration.waiting) {
              registration.waiting.postMessage({ type: "SKIP_WAITING" });
            }
          })
        );
      } catch (error) {
        logError("buildFreshness.runFreshnessCheck.swUpdate", error);
      }
    }

    await clearBrowserCaches({ unregisterServiceWorkers: false });
    window.location.replace(
      `${window.location.pathname}${window.location.search}${window.location.hash}`
    );
  } catch (error) {
    logError("buildFreshness.runFreshnessCheck", error);
  } finally {
    freshnessCheckInFlight = false;
  }
};

export const installBuildFreshnessGuard = () => {
  if (!isServiceWorkerAllowed()) return;

  // Initial check shortly after boot.
  window.setTimeout(() => {
    runFreshnessCheck();
  }, 3000);

  // Re-check whenever the app comes back to the foreground (PWA resume,
  // tab switch). This is the path that previously required the user to
  // kill and relaunch the app.
  if (!visibilityCheckBound) {
    visibilityCheckBound = true;
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") {
        runFreshnessCheck();
      }
    });
    window.addEventListener("focus", () => {
      runFreshnessCheck();
    });
  }
};