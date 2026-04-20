import { useEffect } from "react";
import { useAuthStore } from "@/stores/authStore";
import { gql } from "@/lib/graphql";
import { ME_QUERY } from "@/lib/queries";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { MainLayout } from "./components/layout/MainLayout";
import { ProtectedRoute, RedirectIfAuthed } from "./components/ProtectedRoute";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import MentorsPage from "./pages/MentorsPage";
import UserDashboardPage from "./pages/UserDashboardPage";
import MentorDashboardPage from "./pages/MentorDashboardPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import NotFound from "./pages/NotFound";
import { User } from "@/types";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { refetchOnWindowFocus: false, retry: 1 },
  },
});

const App = () => {
  const { setAuth, clearAuth, setInitializing, isInitializing } = useAuthStore();

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem("free_mentors_token");
      if (!token) {
        clearAuth();
        return;
      }
      try {
        const data = await gql<{ me: User | null }>(ME_QUERY);
        if (data.me) {
          setAuth(data.me, token);
        } else {
          clearAuth();
        }
      } catch (err) {
        console.error("Session check failed", err);
        clearAuth();
      } finally {
        setInitializing(false);
      }
    };
    initAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isInitializing) {
    return (
      <div className="h-screen w-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route element={<MainLayout />}>
              <Route path="/" element={<LandingPage />} />
              <Route
                path="/login"
                element={
                  <RedirectIfAuthed>
                    <LoginPage />
                  </RedirectIfAuthed>
                }
              />
              <Route
                path="/register"
                element={
                  <RedirectIfAuthed>
                    <RegisterPage />
                  </RedirectIfAuthed>
                }
              />

              <Route
                path="/mentors"
                element={
                  <ProtectedRoute>
                    <MentorsPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/dashboard/user"
                element={
                  <ProtectedRoute requiredRole="USER">
                    <UserDashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/mentor"
                element={
                  <ProtectedRoute requiredRole="MENTOR">
                    <MentorDashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/admin"
                element={
                  <ProtectedRoute requiredRole="ADMIN">
                    <AdminDashboardPage />
                  </ProtectedRoute>
                }
              />

              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
