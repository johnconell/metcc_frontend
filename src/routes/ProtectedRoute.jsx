import { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import { Spinner } from '../components/ui/Spinner';

const ADMIN_ONLY_MESSAGE =
  'Admin access only. Proctor accounts use the mobile examination application.';

/**
 * Web dashboard gate: authenticated Admin only.
 * Proctors use the mobile examination app and must not access this site.
 */
export function ProtectedRoute() {
  const { user, loading, isAdmin, logout } = useAuth();
  const location = useLocation();
  const [deniedNonAdmin, setDeniedNonAdmin] = useState(false);

  useEffect(() => {
    if (loading || !user || isAdmin || deniedNonAdmin) return;

    setDeniedNonAdmin(true);
    logout().catch(() => {});
  }, [user, loading, isAdmin, logout, deniedNonAdmin]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (deniedNonAdmin || (user && !isAdmin)) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ message: ADMIN_ONLY_MESSAGE }}
      />
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
