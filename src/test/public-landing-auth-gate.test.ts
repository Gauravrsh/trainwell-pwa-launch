import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const appSource = readFileSync(resolve(process.cwd(), "src/App.tsx"), "utf8");

const sliceFn = (signature: string) => {
  const start = appSource.indexOf(signature);
  if (start < 0) throw new Error(`Could not find ${signature} in App.tsx`);
  // Grab a generous window — enough to cover the function body.
  return appSource.slice(start, start + 1200);
};

describe("TW-026 — public landing/auth routes wait for auth bootstrap", () => {
  it("PublicLandingRoute reads `loading` from useAuth and short-circuits while loading", () => {
    const block = sliceFn("const PublicLandingRoute");
    expect(block).toMatch(/useAuth\(\)\s*;[\s\S]*loading/);
    // Must early-return null while loading so the splash stays up.
    expect(block).toMatch(/if\s*\(\s*loading\s*\)\s*{[\s\S]*return\s+null/);
    // Still redirects authenticated users to /dashboard.
    expect(block).toContain('to="/dashboard"');
    expect(block).toContain("<Landing />");
  });

  it("AuthRoute also waits for auth to resolve before deciding", () => {
    const block = sliceFn("const AuthRoute");
    expect(block).toMatch(/loading/);
    expect(block).toMatch(/if\s*\(\s*loading\s*\)\s*{[\s\S]*return\s+null/);
    expect(block).toContain('to="/dashboard"');
  });

  it("AppContent.isPublicRoute does NOT whitelist `/` (regression guard)", () => {
    const block = appSource.slice(
      appSource.indexOf("const isPublicRoute"),
      appSource.indexOf("const isPublicRoute") + 400
    );
    expect(block).not.toMatch(/location\.pathname\s*===\s*["']\/["']/);
    // The genuinely public routes must still be listed.
    expect(block).toContain('"/auth"');
    expect(block).toContain('"/reset-password"');
    expect(block).toContain('"/terms"');
    expect(block).toContain('"/pitch"');
  });

  it("SPLASH_MAX_MS safety cap is preserved so a wedged auth call cannot strand the splash", () => {
    expect(appSource).toMatch(/SPLASH_MAX_MS\s*=\s*\d+/);
    expect(appSource).toContain("setMaxTimeReached(true)");
  });
});