import { lazy, ComponentType } from "react";
import { logError } from "@/lib/errorUtils";

// TW-036 — Vite content-hashes every chunk. After a deploy, the user's
// already-loaded index.html still references the OLD chunk filenames; the
// first lazy `import()` to a renamed chunk throws
// "Failed to fetch dynamically imported module" and the ErrorBoundary
// renders the crash screen. This wrapper catches that specific class of
// failure and hard-reloads the page exactly once per session per chunk
// path so the browser picks up the new index.html and the new asset
// names. A sessionStorage guard prevents a true CDN/network failure from
// causing refresh thrash — the second attempt falls through and lets the
// ErrorBoundary handle it.

const RELOAD_KEY = "vecto:chunk-reload-attempted";

const isChunkLoadError = (err: unknown): boolean => {
  if (!err) return false;
  const msg = (err as { message?: string }).message ?? String(err);
  return (
    /Failed to fetch dynamically imported module/i.test(msg) ||
    /Importing a module script failed/i.test(msg) ||
    /error loading dynamically imported module/i.test(msg) ||
    /Loading chunk \d+ failed/i.test(msg) ||
    /Loading CSS chunk/i.test(msg)
  );
};

const extractUrl = (err: unknown): string => {
  const msg = (err as { message?: string })?.message ?? String(err ?? "");
  const m = msg.match(/https?:\/\/\S+?\.js/);
  return m ? m[0] : "unknown";
};

export const lazyWithReload = <T extends ComponentType<unknown>>(
  factory: () => Promise<{ default: T }>
) => {
  return lazy(async () => {
    try {
      return await factory();
    } catch (err) {
      if (!isChunkLoadError(err)) throw err;

      const url = extractUrl(err);
      let attempted: string[] = [];
      try {
        attempted = JSON.parse(sessionStorage.getItem(RELOAD_KEY) ?? "[]");
      } catch {
        attempted = [];
      }
      if (attempted.includes(url)) {
        // Already tried reloading for this chunk — real failure, let it bubble.
        logError("lazyWithReload.repeatFailure", { url, err });
        throw err;
      }
      attempted.push(url);
      try {
        sessionStorage.setItem(RELOAD_KEY, JSON.stringify(attempted));
      } catch {
        /* ignore quota */
      }

      logError("lazyWithReload.staleChunkReload", { url });
      window.location.reload();
      // Return a never-resolving promise so Suspense holds the fallback
      // while the reload happens — avoids rendering an error in the gap.
      return new Promise<{ default: T }>(() => {});
    }
  });
};
