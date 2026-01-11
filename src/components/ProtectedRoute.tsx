import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: "admin" | "sales_rep";
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, loading, isAdmin, isSalesRep, roles } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Check if user has any role
  if (roles.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md px-4">
          <h1 className="text-2xl font-bold mb-4">Várakozás jóváhagyásra</h1>
          <p className="text-muted-foreground">
            A fiókod még nincs jóváhagyva. Kérlek várd meg, amíg egy admin hozzárendel egy szerepkört.
          </p>
        </div>
      </div>
    );
  }

  // Check specific role if required
  if (requiredRole === "admin" && !isAdmin) {
    return <Navigate to="/sales" replace />;
  }

  if (requiredRole === "sales_rep" && !isSalesRep && !isAdmin) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}
