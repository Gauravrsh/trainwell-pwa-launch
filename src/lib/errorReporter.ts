import { supabase } from "@/integrations/supabase/client";

interface ReportInput {
  message: string;
  stack?: string | null;
  componentStack?: string | null;
  source?: string;
}

/**
 * Best-effort persistence of a client-side crash into `client_error_reports`.
 * Never throws. Silent on failure (we are already in an error path).
 * RLS: only authenticated inserts succeed; anonymous failures are ignored.
 */
export async function reportClientError(input: ReportInput): Promise<void> {
  try {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id ?? null;
    if (!userId) return; // can't insert under RLS without auth — drop silently

    let profileId: string | null = null;
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();
      profileId = profile?.id ?? null;
    } catch {
      /* profile lookup is optional */
    }

    const buildId =
      typeof localStorage !== "undefined"
        ? localStorage.getItem("vecto:html-build-id")
        : null;

    await supabase.from("client_error_reports").insert({
      user_id: userId,
      profile_id: profileId,
      message: String(input.message ?? "").slice(0, 2000),
      stack: (input.stack ?? "").slice(0, 8000) || null,
      component_stack: (input.componentStack ?? "").slice(0, 8000) || null,
      route:
        typeof window !== "undefined"
          ? `${window.location.pathname}${window.location.search}${window.location.hash}`
          : null,
      user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
      build_id: buildId,
    });
  } catch {
    // swallow — we are inside an error path, do not cascade
  }
}

export function formatErrorForCopy(input: ReportInput): string {
  return [
    `Vecto crash report`,
    `Time: ${new Date().toISOString()}`,
    `Route: ${typeof window !== "undefined" ? window.location.href : "n/a"}`,
    `UA: ${typeof navigator !== "undefined" ? navigator.userAgent : "n/a"}`,
    `Source: ${input.source ?? "react"}`,
    ``,
    `Message:`,
    input.message,
    ``,
    `Stack:`,
    input.stack ?? "(none)",
    ``,
    `Component stack:`,
    input.componentStack ?? "(none)",
  ].join("\n");
}