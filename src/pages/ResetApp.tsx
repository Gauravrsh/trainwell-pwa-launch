import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { clearBrowserCaches } from "@/lib/buildFreshness";
import { logError } from "@/lib/errorUtils";

const ResetApp = () => {
  const [status, setStatus] = useState<"running" | "done" | "failed">("running");

  useEffect(() => {
    let mounted = true;

    const reset = async () => {
      try {
        await clearBrowserCaches({ unregisterServiceWorkers: true });
        localStorage.clear();
        sessionStorage.clear();
        if (mounted) setStatus("done");
      } catch (error) {
        logError("ResetApp.reset", error);
        if (mounted) setStatus("failed");
      }
    };

    reset();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <main className="min-h-screen bg-background text-foreground flex items-center justify-center px-6">
      <section className="w-full max-w-sm text-center space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-normal">
            <span className="text-primary">V</span>ECTO
          </h1>
          <p className="text-sm text-muted-foreground">
            {status === "running" && "Resetting local app state…"}
            {status === "done" && "Clean state ready."}
            {status === "failed" && "Reset was incomplete. Try again."}
          </p>
        </div>

        {status !== "running" && (
          <Button className="w-full" onClick={() => window.location.replace("/")}>
            Open VECTO
          </Button>
        )}
      </section>
    </main>
  );
};

export default ResetApp;