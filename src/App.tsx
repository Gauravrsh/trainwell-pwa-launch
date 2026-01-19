import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { AppLayout } from "@/components/layout/AppLayout";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import RoleSelection from "./pages/RoleSelection";
import ProfileSetup from "./pages/ProfileSetup";
import Home from "./pages/Home";
import Calendar from "./pages/Calendar";
import Plans from "./pages/Plans";
import Refer from "./pages/Refer";
import Profile from "./pages/Profile";
import Terms from "./pages/Terms";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading, needsRoleSelection, needsProfileSetup } = useProfile();

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
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
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // If profile already exists, go to home
  if (profile) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

const ProfileSetupRoute = () => {
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useProfile();

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
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
    return <Navigate to="/" replace />;
  }

  // Get role from profile
  return <ProfileSetup role={profile.role} />;
};

const AuthRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
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
    <Route
      path="/"
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
    <Route
      path="/terms"
      element={
        <ProtectedRoute>
          <Terms />
        </ProtectedRoute>
      }
    />
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;