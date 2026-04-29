import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

const indexHtml = read("index.html");
const manifest = JSON.parse(read("public/manifest.json")) as { start_url?: string; icons?: { src?: string }[] };
const serviceWorker = read("public/sw.js");
const buildFreshness = read("src/lib/buildFreshness.ts");

describe("TW-030 — PWA freshness hardening", () => {
  it("opens installed PWAs directly on the authenticated calendar route", () => {
    expect(manifest.start_url).toBe("/dashboard");
  });

  it("keeps manifest and icon URLs versioned so install metadata refreshes", () => {
    expect(indexHtml).toContain("/manifest.json?v=20260429a");
    expect(indexHtml).toContain("/favicon.png?v=20260429a");
    expect(indexHtml).toContain("/icons/apple-touch-icon-180.png?v=20260429a");
    expect(manifest.icons?.every((icon) => icon.src?.includes("?v=20260429a"))).toBe(true);
  });

  it("runs a pre-React HTML build sentinel before loading the app module", () => {
    const sentinelIndex = indexHtml.indexOf("window.__vectoFreshnessReady");
    const moduleIndex = indexHtml.indexOf('type="module" src="/src/main.tsx"');
    expect(sentinelIndex).toBeGreaterThan(-1);
    expect(moduleIndex).toBeGreaterThan(sentinelIndex);
    expect(indexHtml).toContain("/build-id.json?t=");
    expect(indexHtml).toContain("cache: \"no-store\"");
    expect(indexHtml).toContain("caches.keys()");
    expect(indexHtml).toContain("navigator.serviceWorker.getRegistrations()");
    expect(indexHtml).toContain("vecto_fresh");
  });

  it("keeps the push-only service worker network-first for app-shell resources", () => {
    expect(serviceWorker).toContain("isFreshShellRequest");
    expect(serviceWorker).toContain("req.mode === 'navigate'");
    expect(serviceWorker).toContain("url.pathname === '/build-id.json'");
    expect(serviceWorker).toContain("url.pathname === '/manifest.json'");
    expect(serviceWorker).toContain("url.pathname === '/sw.js'");
    expect(serviceWorker).toContain("url.pathname.startsWith('/assets/')");
    expect(serviceWorker).toContain("cache: 'no-store'");
  });

  it("still blocks service workers in preview and iframe contexts", () => {
    expect(buildFreshness).toContain("isInIframe");
    expect(buildFreshness).toContain("isPreviewHost");
    expect(buildFreshness).toContain("lovableproject.com");
    expect(buildFreshness).toContain("unregisterPreviewServiceWorkers");
  });
});