import { NavLink } from 'react-router-dom';
import { useAuth } from '../../auth/useAuth';

const linkClass = ({ isActive }) =>
  `block rounded-lg px-3 py-2 text-sm font-medium ${isActive ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700 hover:bg-gray-100'}`;

export function Sidebar() {
  const { isAdmin } = useAuth();

  return (
    <aside className="w-64 border-r bg-white p-4">
      <nav className="space-y-1">
        <NavLink to="/dashboard" className={linkClass}>Dashboard</NavLink>
        <NavLink to="/profile" className={linkClass}>Profile</NavLink>
        <NavLink to="/profile/change-password" className={linkClass}>Change Password</NavLink>
        <NavLink to="/test-items" className={linkClass}>Test Items</NavLink>
        {isAdmin && (
          <>
            <div className="pt-4 pb-1 text-xs font-semibold uppercase text-gray-400">Admin</div>
            <NavLink to="/admin/users" className={linkClass}>User Management</NavLink>
          </>
        )}
      </nav>
    </aside>
  );
}
