import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';

export function RoleRoute({ roles }) {
  const { user } = useAuth();
  if (!user?.role?.slug || !roles.includes(user.role.slug)) {
    return <Navigate to="/403" replace />;
  }
  return <Outlet />;
}
