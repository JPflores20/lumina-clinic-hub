import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Role } from "@/types/auth";

interface ProtectedRouteProps {
  allowedRoles?: Role[];
}

export const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center">Cargando...</div>;
  }

  if (!user) {
    // Usuario no autenticado
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Usuario autenticado pero sin el rol correcto
    return <Navigate to="/unauthorized" replace />;
  }

  // Usuario autorizado, renderizar rutas hijas
  return <Outlet />;
};
