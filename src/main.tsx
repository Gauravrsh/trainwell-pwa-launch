import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { installBuildFreshnessGuard, registerAppServiceWorker } from "./lib/buildFreshness";

registerAppServiceWorker();
installBuildFreshnessGuard();

createRoot(document.getElementById("root")!).render(<App />);
