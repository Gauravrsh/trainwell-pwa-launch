import { useState, useEffect, lazy, Suspense, useRef } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { ProfileProvider, useProfile } from "@/hooks/useProfile";
import { AppLayout } from "@/components/layout/AppLayout";
import { AnimatePresence } from "framer-motion";
import SplashScreen from "@/components/SplashScreen";
import ErrorBoundary from "@/components/ErrorBoundary";
import { useAndroidBackExit } from "@/hooks/useAndroidBackExit";
import { useKeyboardInset } from "@/hooks/useKeyboardInset";
import { LoadingQuote } from "@/components/LoadingQuote";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { logError } from "@/lib/errorUtils";

// Auth + Landing are eager (entry routes the user hits cold)
import Auth from "./pages/Auth";
import Landing from "./pages/Landing";

// Everything else is code-split so we don't ship the full app on first paint.
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const RoleSelection = lazy(() => import("./pages/RoleSelection"));
const ProfileSetup = lazy(() => import("./pages/ProfileSetup"));
const Home = lazy(() => import("./pages/Home"));
const Calendar = lazy(() => import("./pages/Calendar"));
const Plans = lazy(() => import("./pages/Plans"));
const Progress = lazy(() => import("./pages/Progress"));
const Refer = lazy(() => import("./pages/Refer"));
const Profile = lazy(() => import("./pages/Profile"));
const Terms = lazy(() => import("./pages/Terms"));
const MyTrainer = lazy(() => import("./pages/MyTrainer"));
const ResetApp = lazy(() => import("./pages/ResetApp"));
const Pitch = lazy(() => import("./pages/Pitch"));
const NotFound = lazy(() => import("./pages/NotFound"));
const IconReview = lazy(() => import("./pages/IconReview"));
const FlywheelReview = lazy(() => import("./pages/FlywheelReview"));

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading, needsRoleSelection, needsProfileSetup } = useProfile();

  if (authLoading || profileLoading) {
    return null; // Let splash screen handle loading state
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (needsRoleSelection) {
    return <Navigate to="/role-selection" replace />;
  }

  if (needsProfileSetup) {
    return <Navigate to="/profile-setup" replace />;
  }

  return <AppLayout>{children}</AppLayout>;
};

const RoleSelectionRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading, refetchProfile } = useProfile();
  const inviteCode = typeof window !== "undefined" ? localStorage.getItem("inviteTrainerCode") : null;
  const autoLinkAttempted = useRef(false);
  const [autoLinkError, setAutoLinkError] = useState<string | null>(null);

  // TW-020: invited clients must NEVER see the role tiles. As soon as we
  // know there's an authenticated user with no profile and a stored invite
  // code, do the role assignment server-side and redirect to /profile-setup.
  // The full RPC chain (generate id, lookup trainer, upsert profile) lives
  // here so the route never renders <RoleSelection /> for invited clients.
  useEffect(() => {
    if (authLoading || profileLoading) return;
    if (!user || profile || !inviteCode) return;
    if (autoLinkAttempted.current) return;
    autoLinkAttempted.current = true;

    (async () => {
      try {
        const { data: newId, error: idError } = await supabase
          .rpc("generate_unique_id", { p_role: "client" });
        if (idError) throw idError;

        const { data: trainerData, error: lookupErr } = await supabase
          .rpc("lookup_trainer_by_unique_id", { p_unique_id: inviteCode });
        if (lookupErr) throw lookupErr;
        const trainerId = trainerData && trainerData.length > 0 ? trainerData[0].id : null;

        const profilePayload = {
          user_id: user.id,
          role: "client" as const,
          unique_id: newId as string,
          ...(trainerId ? { trainer_id: trainerId as string } : {}),
        };

        const { error: upsertError } = await supabase
          .from("profiles")
          .upsert(profilePayload, { onConflict: "user_id" });
        if (upsertError) throw upsertError;

        localStorage.setItem("selectedRole", "client");
        await refetchProfile();
      } catch (err) {
        logError("RoleSelectionRoute.autoLinkInvitedClient", err);
        autoLinkAttempted.current = false; // allow Retry
        setAutoLinkError("link_failed");
        toast.error("Couldn't link to your trainer right now.", {
          action: {
            label: "Retry",
            onClick: () => {
              setAutoLinkError(null);
              autoLinkAttempted.current = false;
              // re-trigger by touching state — useEffect deps will re-run
              // because autoLinkAttempted is a ref, force a no-op state update
              setAutoLinkError((v) => v); // trigger re-render
            },
          },
          duration: 8000,
        });
      }
    })();
  }, [authLoading, profileLoading, user, profile, inviteCode, refetchProfile]);

  if (authLoading || profileLoading) {
    return null;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (profile) {
    return <Navigate to="/dashboard" replace />;
  }

  // TW-020: invited clients never see the role tiles. While the auto-link
  // RPC is in flight (or after a transient failure waiting for Retry),
  // render a minimal status surface — NEVER the role-selection UI.
  if (inviteCode) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background p-6 text-center">
        <h1 className="text-3xl font-bold text-foreground mb-3">
          <span className="text-primary">V</span>ECTO
        </h1>
        <p className="text-sm text-muted-foreground">
          {autoLinkError
            ? "Couldn't link to your trainer. Tap Retry in the toast."
            : "Linking you to your trainer\u2026"}
        </p>
      </div>
    );
  }

  return <>{children}</>;
};

const ProfileSetupRoute = () => {
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useProfile();

  if (authLoading || profileLoading) {
    return null;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!profile) {
    return <Navigate to="/role-selection" replace />;
  }

  if (profile.profile_complete) {
    return <Navigate to="/dashboard" replace />;
  }

  return <ProfileSetup role={profile.role} />;
};

const AuthRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

const PublicLandingRoute = () => {
  const { user } = useAuth();

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Landing />;
};

/**
 * Global invite/referral context capture.
 * Runs on EVERY route change, regardless of auth state.
 * Fix for TW-011: previously only Auth.tsx captured ?trainer=/?ref=, but
 * AuthRoute redirects authenticated users away before Auth mounts, losing context.
 */
const InviteContextCapture = () => {
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const trainerCode = params.get("trainer");
    const referralCode = params.get("ref");

    // TW-014: idempotent — only write if value actually changed, to avoid
    // any chance of triggering downstream effects on every render.
    if (trainerCode && localStorage.getItem("inviteTrainerCode") !== trainerCode) {
      localStorage.setItem("inviteTrainerCode", trainerCode);
    }
    if (referralCode && localStorage.getItem("referralTrainerCode") !== referralCode) {
      localStorage.setItem("referralTrainerCode", referralCode);
    }
  }, [location.search]);

  return null;
};

const RouteFallback = () => (
  <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background">
    <LoadingQuote />
  </div>
);

const AppRoutes = () => (
  <Suspense fallback={<RouteFallback />}>
    <Routes>
      <Route
        path="/auth"
        element={
          <AuthRoute>
            <Auth />
          </AuthRoute>
        }
      />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route
        path="/role-selection"
        element={
          <RoleSelectionRoute>
            <RoleSelection />
          </RoleSelectionRoute>
        }
      />
      <Route path="/profile-setup" element={<ProfileSetupRoute />} />
      <Route path="/" element={<PublicLandingRoute />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Calendar />
          </ProtectedRoute>
        }
      />
      <Route
        path="/home"
        element={
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        }
      />
      <Route
        path="/plans"
        element={
          <ProtectedRoute>
            <Plans />
          </ProtectedRoute>
        }
      />
      <Route
        path="/progress"
        element={
          <ProtectedRoute>
            <Progress />
          </ProtectedRoute>
        }
      />
      <Route
        path="/refer"
        element={
          <ProtectedRoute>
            <Refer />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />
      <Route path="/terms" element={<Terms />} />
      <Route path="/reset-app" element={<ResetApp />} />
      <Route
        path="/my-trainer"
        element={
          <ProtectedRoute>
            <MyTrainer />
          </ProtectedRoute>
        }
      />
      <Route path="/pitch" element={<Pitch />} />
      <Route path="/icon-review" element={<IconReview />} />
      <Route path="/flywheel-review" element={<FlywheelReview />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  </Suspense>
);

const SPLASH_MAX_MS = 1200; // hard cap; never strand the user on the splash

const AppContent = () => {
  const { loading: authLoading } = useAuth();
  const { loading: profileLoading } = useProfile();
  const location = useLocation();
  const [showSplash, setShowSplash] = useState(true);
  const [maxTimeReached, setMaxTimeReached] = useState(false);

  // TW-014: Android PWA back-button exit guard.
  useAndroidBackExit();

  // TW-017: track on-screen keyboard height so modals stay above it.
  useKeyboardInset();

  // Public auth routes never block on profile fetch.
  const isPublicRoute =
    location.pathname.startsWith("/auth") ||
    location.pathname.startsWith("/reset-password") ||
    location.pathname === "/" ||
    location.pathname === "/terms" ||
    location.pathname === "/pitch";

  useEffect(() => {
    const timer = setTimeout(() => setMaxTimeReached(true), SPLASH_MAX_MS);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const ready = isPublicRoute || (!authLoading && !profileLoading);
    if (ready || maxTimeReached) {
      setShowSplash(false);
    }
  }, [authLoading, profileLoading, isPublicRoute, maxTimeReached]);

  return (
    <>
      <InviteContextCapture />
      <AnimatePresence mode="wait">
        {showSplash && <SplashScreen key="splash" />}
      </AnimatePresence>
      {!showSplash && <ErrorBoundary><AppRoutes /></ErrorBoundary>}
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <ProfileProvider>
            <AppContent />
          </ProfileProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
