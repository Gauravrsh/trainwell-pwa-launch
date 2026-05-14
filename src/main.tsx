import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { installBuildFreshnessGuard, registerAppServiceWorker } from "./lib/buildFreshness";
import { reportClientError } from "./lib/errorReporter";

registerAppServiceWorker();
installBuildFreshnessGuard();

// TW-033: capture errors that escape the React tree (module-init, async,
// service worker, third-party scripts) so we can persist a stack to
// `client_error_reports` and actually debug crashes the user sees.
if (typeof window !== "undefined") {
  window.addEventListener("error", (event) => {
    const err = event?.error;
    void reportClientError({
      message: err?.message ?? event?.message ?? "window.error",
      stack: err?.stack ?? null,
      source: "window-error",
    });
  });
  window.addEventListener("unhandledrejection", (event) => {
    const reason = event?.reason;
    const message =
      typeof reason === "string"
        ? reason
        : reason?.message ?? "unhandledrejection";
    void reportClientError({
      message,
      stack: reason?.stack ?? null,
      source: "unhandled-rejection",
    });
  });
}

createRoot(document.getElementById("root")!).render(<App />);
