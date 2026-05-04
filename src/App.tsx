import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth-context";
import { ThemeProvider } from "@/lib/theme-context";
import { queryClient } from "@/lib/react-query";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import PublicLayout from "@/components/layout/PublicLayout";
import DashboardLayout from "@/components/layout/DashboardLayout";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import LandingPage from "@/pages/LandingPage";
import AboutPage from "@/pages/AboutPage";
import FeaturesPage from "@/pages/FeaturesPage";
import PricingPage from "@/pages/PricingPage";
import LoginPage from "@/pages/LoginPage";
import SignupPage from "@/pages/SignupPage";
import ForgotPasswordPage from "@/pages/ForgotPasswordPage";
import ResetPasswordPage from "@/pages/ResetPasswordPage";
import AuthCallbackPage from "@/pages/AuthCallbackPage";
import SubscriptionSuccessPage from "@/pages/SubscriptionSuccessPage";
import SubscriptionCanceledPage from "@/pages/SubscriptionCanceledPage";
import FeedPage from "@/pages/dashboard/FeedPage";
import ExercisesPage from "@/pages/dashboard/ExercisesPage";
import ProfilePage from "@/pages/dashboard/ProfilePage";
import MessagesPage from "@/pages/dashboard/MessagesPage";
import JobsPage from "@/pages/dashboard/JobsPage";
import SettingsPage from "@/pages/dashboard/SettingsPage";
import TacticBoardPage from "@/pages/dashboard/TacticBoardPage";
import PlannerPage from "@/pages/dashboard/PlannerPage";
import MarketplacePage from "@/pages/dashboard/MarketplacePage";
import ForumPage from "@/pages/dashboard/ForumPage";
import NotFound from "@/pages/NotFound";

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AuthProvider>
              <Routes>
                {/* Public pages */}
                <Route element={<PublicLayout />}>
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/about" element={<AboutPage />} />
                  <Route path="/features" element={<FeaturesPage />} />
                  <Route path="/pricing" element={<PricingPage />} />
                </Route>

                {/* Auth pages */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />
                <Route
                  path="/forgot-password"
                  element={<ForgotPasswordPage />}
                />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                <Route path="/auth/callback" element={<AuthCallbackPage />} />

                {/* Subscription pages */}
                <Route
                  path="/subscription/success"
                  element={<SubscriptionSuccessPage />}
                />
                <Route
                  path="/subscription/canceled"
                  element={<SubscriptionCanceledPage />}
                />

                {/* Dashboard - Protected routes */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <DashboardLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route
                    index
                    element={<Navigate to="/dashboard/feed" replace />}
                  />
                  <Route path="feed" element={<FeedPage />} />
                  <Route path="exercises" element={<ExercisesPage />} />
                  <Route path="tactic-board" element={<TacticBoardPage />} />
                  <Route path="planner" element={<PlannerPage />} />
                  <Route path="messages" element={<MessagesPage />} />
                  <Route path="jobs" element={<JobsPage />} />
                  <Route path="marketplace" element={<MarketplacePage />} />
                  <Route path="forum" element={<ForumPage />} />
                  <Route path="profile" element={<ProfilePage />} />
                  <Route path="settings" element={<SettingsPage />} />
                </Route>

                <Route path="*" element={<NotFound />} />
              </Routes>
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
