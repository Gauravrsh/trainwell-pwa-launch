import { useState, useEffect, Suspense, useRef } from "react";
import { lazyWithReload } from "@/lib/lazyWithReload";
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
// TW-036 — lazyWithReload auto-recovers from "Failed to fetch dynamically
// imported module" after a new deploy renames chunk hashes.
const ResetPassword = lazyWithReload(() => import("./pages/ResetPassword"));
const RoleSelection = lazyWithReload(() => import("./pages/RoleSelection"));
const ProfileSetup = lazyWithReload(() => import("./pages/ProfileSetup"));
const Home = lazyWithReload(() => import("./pages/Home"));
const Calendar = lazyWithReload(() => import("./pages/Calendar"));
const Plans = lazyWithReload(() => import("./pages/Plans"));
const Progress = lazyWithReload(() => import("./pages/Progress"));
const Refer = lazyWithReload(() => import("./pages/Refer"));
const Profile = lazyWithReload(() => import("./pages/Profile"));
const Terms = lazyWithReload(() => import("./pages/Terms"));
const MyTrainer = lazyWithReload(() => import("./pages/MyTrainer"));
const ResetApp = lazyWithReload(() => import("./pages/ResetApp"));
const Pitch = lazyWithReload(() => import("./pages/Pitch"));
const NotFound = lazyWithReload(() => import("./pages/NotFound"));
const IconReview = lazyWithReload(() => import("./pages/IconReview"));
const FlywheelReview = lazyWithReload(() => import("./pages/FlywheelReview"));
const VectoVsTrainerize = lazyWithReload(() => import("./pages/VectoVsTrainerize"));

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
  const referralCode = typeof window !== "undefined" ? localStorage.getItem("referralTrainerCode") : null;
  const autoLinkAttempted = useRef(false);
  const [autoLinkError, setAutoLinkError] = useState<string | null>(null);

  // TW-020 / TW-038: invited clients AND referred trainers must NEVER see
  // the role tiles. As soon as we know there's an authenticated user with
  // no profile and either a stored invite code (client) or referral code
  // (trainer), do the role assignment server-side and redirect to
  // /profile-setup. The full RPC chain lives here so the route never
  // renders <RoleSelection /> for these flows.
  useEffect(() => {
    if (authLoading || profileLoading) return;
    if (!user || profile) return;
    if (!inviteCode && !referralCode) return;
    if (autoLinkAttempted.current) return;
    autoLinkAttempted.current = true;

    (async () => {
      try {
        const role: "client" | "trainer" = inviteCode ? "client" : "trainer";
        const lookupCode = (inviteCode ?? referralCode) as string;

        const { data: newId, error: idError } = await supabase
          .rpc("generate_unique_id", { p_role: role });
        if (idError) throw idError;

        const { data: trainerData, error: lookupErr } = await supabase
          .rpc("lookup_trainer_by_unique_id", { p_unique_id: lookupCode });
        if (lookupErr) throw lookupErr;
        const matchedTrainerId = trainerData && trainerData.length > 0 ? trainerData[0].id : null;

        const profilePayload = {
          user_id: user.id,
          role,
          unique_id: newId as string,
          ...(role === "client" && matchedTrainerId
            ? { trainer_id: matchedTrainerId as string }
            : {}),
          ...(role === "trainer" && matchedTrainerId
            ? { referred_by_trainer_id: matchedTrainerId as string }
            : {}),
        };

        const { error: upsertError } = await supabase
          .from("profiles")
          .upsert(profilePayload, { onConflict: "user_id" });
        if (upsertError) throw upsertError;

        // For referred trainers, also create the pending referral record
        // so the referrer's stats reflect the new signup.
        if (role === "trainer" && matchedTrainerId) {
          const { data: newProfile } = await supabase
            .from("profiles")
            .select("id")
            .eq("user_id", user.id)
            .single();
          if (newProfile) {
            await supabase
              .from("trainer_referrals")
              .insert({
                referrer_id: matchedTrainerId as string,
                referee_id: newProfile.id,
                status: "pending",
              });
          }
        }

        localStorage.setItem("selectedRole", role);
        await refetchProfile();
      } catch (err) {
        logError("RoleSelectionRoute.autoLinkInvitedClient", err);
        autoLinkAttempted.current = false; // allow Retry
        setAutoLinkError("link_failed");
        toast.error(
          inviteCode
            ? "Couldn't link to your trainer right now."
            : "Couldn't apply your referral right now.",
          {
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
          }
        );
      }
    })();
  }, [authLoading, profileLoading, user, profile, inviteCode, referralCode, refetchProfile]);

  if (authLoading || profileLoading) {
    return null;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (profile) {
    return <Navigate to="/dashboard" replace />;
  }

  // TW-020 / TW-038: invited clients and referred trainers never see the
  // role tiles. While the auto-link RPC is in flight (or after a transient
  // failure waiting for Retry), render a minimal status surface — NEVER
  // the role-selection UI.
  if (inviteCode || referralCode) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background p-6 text-center">
        <h1 className="text-3xl font-bold text-foreground mb-3">
          <span className="text-primary">V</span>ECTO
        </h1>
        <p className="text-sm text-muted-foreground">
          {autoLinkError
            ? (inviteCode
                ? "Couldn't link to your trainer. Tap Retry in the toast."
                : "Couldn't apply your referral. Tap Retry in the toast.")
            : (inviteCode
                ? "Linking you to your trainer\u2026"
                : "Setting up your trainer account\u2026")}
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
  const { user, loading } = useAuth();

  // TW-026: wait for Supabase to restore the session before deciding.
  // Otherwise an already-signed-in user briefly sees the login form on cold boot.
  if (loading) {
    return null;
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

const PublicLandingRoute = () => {
  const { user, loading } = useAuth();

  // TW-026: must wait for auth to resolve. If we render <Landing /> while
  // `loading` is still true and the user actually has a session in storage,
  // the marketing page flashes for ~300-700ms before the redirect to
  // /dashboard fires. The splash gate in AppContent already holds the
  // splash for `/` until auth settles, so returning null here is safe.
  if (loading) {
    return null;
  }

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
      <Route path="/vecto-vs-trainerize" element={<VectoVsTrainerize />} />
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
  // TW-026: `/` is intentionally NOT in this list. The root route renders
  // either <Landing /> or a redirect to /dashboard depending on auth state,
  // so the splash MUST hold until `authLoading` resolves. The 1200ms
  // SPLASH_MAX_MS cap below guarantees we never strand a visitor.
  const isPublicRoute =
    location.pathname.startsWith("/auth") ||
    location.pathname.startsWith("/reset-password") ||
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
