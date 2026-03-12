import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { AppLayout } from "@/components/layout/AppLayout";
import { AnimatePresence } from "framer-motion";
import SplashScreen from "@/components/SplashScreen";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import RoleSelection from "./pages/RoleSelection";
import ProfileSetup from "./pages/ProfileSetup";
import Home from "./pages/Home";
import Calendar from "./pages/Calendar";
import Landing from "./pages/Landing";
import Plans from "./pages/Plans";
import Progress from "./pages/Progress";
import Refer from "./pages/Refer";
import Profile from "./pages/Profile";
import Terms from "./pages/Terms";
import NotFound from "./pages/NotFound";

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

  // Redirect to role selection if profile doesn't exist yet
  if (needsRoleSelection) {
    return <Navigate to="/role-selection" replace />;
  }

  // Redirect to profile setup if profile exists but not complete
  if (needsProfileSetup) {
    return <Navigate to="/profile-setup" replace />;
  }

  return <AppLayout>{children}</AppLayout>;
};

const RoleSelectionRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useProfile();

  if (authLoading || profileLoading) {
    return null; // Let splash screen handle loading state
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // If profile already exists, go to home
  if (profile) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

const ProfileSetupRoute = () => {
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useProfile();

  if (authLoading || profileLoading) {
    return null; // Let splash screen handle loading state
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // If no profile, go to role selection
  if (!profile) {
    return <Navigate to="/role-selection" replace />;
  }

  // If profile is complete, go to home
  if (profile.profile_complete) {
    return <Navigate to="/dashboard" replace />;
  }

  // Get role from profile
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

const AppRoutes = () => (
  <Routes>
    <Route
      path="/auth"
      element={
        <AuthRoute>
          <Auth />
        </AuthRoute>
      }
    />
    <Route
      path="/reset-password"
      element={<ResetPassword />}
    />
    <Route
      path="/role-selection"
      element={
        <RoleSelectionRoute>
          <RoleSelection />
        </RoleSelectionRoute>
      }
    />
    <Route
      path="/profile-setup"
      element={<ProfileSetupRoute />}
    />
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
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const AppContent = () => {
  const { loading: authLoading } = useAuth();
  const { loading: profileLoading } = useProfile();
  const location = useLocation();
  const [showSplash, setShowSplash] = useState(true);
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);

  // Never block invite/signup flows behind the splash if auth initialization is slow.
  const isPublicRoute =
    location.pathname.startsWith("/auth") ||
    location.pathname.startsWith("/reset-password");

  // Show splash for at least 2 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setMinTimeElapsed(true);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  // Hide splash when loading is done AND minimum time has elapsed
  useEffect(() => {
    if (minTimeElapsed && (isPublicRoute || (!authLoading && !profileLoading))) {
      setShowSplash(false);
    }
  }, [authLoading, profileLoading, minTimeElapsed, isPublicRoute]);

  return (
    <>
      <AnimatePresence mode="wait">
        {showSplash && <SplashScreen key="splash" />}
      </AnimatePresence>
      {!showSplash && <AppRoutes />}
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
          <AppContent />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
