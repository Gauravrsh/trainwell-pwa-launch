import { logError } from "@/lib/errorUtils";

const BUILD_REFRESH_KEY = "vecto:build-refresh-attempted";
const SERVICE_WORKER_URL = "/sw.js";
const BUILD_ID_URL = "/build-id.json";

export const activeBuildId = __APP_BUILD_ID__;

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

  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register(SERVICE_WORKER_URL, { scope: "/", updateViaCache: "none" })
      .then((registration) => {
        if (registration.waiting) {
          registration.waiting.postMessage({ type: "SKIP_WAITING" });
        }
        return registration.update();
      })
      .catch((error) => logError("buildFreshness.registerAppServiceWorker", error));
  });
};

export const installBuildFreshnessGuard = () => {
  if (!isServiceWorkerAllowed()) return;

  window.setTimeout(async () => {
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
      await clearBrowserCaches({ unregisterServiceWorkers: true });
      window.location.replace(`${window.location.pathname}${window.location.search}${window.location.hash}`);
    } catch (error) {
      logError("buildFreshness.installBuildFreshnessGuard", error);
    }
  }, 3000);
};