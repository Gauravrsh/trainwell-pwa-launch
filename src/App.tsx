import { useState, useEffect, lazy, Suspense } from "react";
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
  const { profile, loading: profileLoading } = useProfile();

  if (authLoading || profileLoading) {
    return null;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (profile) {
    return <Navigate to="/dashboard" replace />;
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

const RouteFallback = () => (
  <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background">
    <div className="flex flex-col items-center gap-6">
      <h1 className="text-6xl font-bold text-foreground tracking-tight">
        <span className="text-primary">V</span>ECTO
      </h1>
      <p className="text-lg text-muted-foreground">
        Effort | Direction | Discipline
      </p>
    </div>
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
