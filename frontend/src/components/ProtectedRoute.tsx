import { Navigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { Role } from "@/types";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: Role | Role[];
}

export const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole) {
    const allowed = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    if (!allowed.includes(user.role)) {
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
};

export const RedirectIfAuthed = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, user } = useAuthStore();
  if (isAuthenticated && user) {
    const path =
      user.role === "ADMIN"
        ? "/dashboard/admin"
        : user.role === "MENTOR"
          ? "/dashboard/mentor"
          : "/dashboard/user";
    return <Navigate to={path} replace />;
  }
  return <>{children}</>;
};
