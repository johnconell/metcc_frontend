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
        <div className="pt-4 pb-1 text-xs font-semibold uppercase text-gray-400">Management</div>
        <NavLink to="/management/schedules" className={linkClass}>Examination / Schedules</NavLink>
        <NavLink to="/management/question-bank" className={linkClass}>Question Bank</NavLink>
        <NavLink to="/management/students" className={linkClass}>Student List</NavLink>
        <NavLink to="/management/proctors" className={linkClass}>Proctor</NavLink>
        {isAdmin && <NavLink to="/management/users" className={linkClass}>User Management</NavLink>}
        <NavLink to="/management/lobby" className={linkClass}>Lobby</NavLink>
        <div className="pt-4 pb-1 text-xs font-semibold uppercase text-gray-400">Account</div>
        <NavLink to="/profile" className={linkClass}>Profile</NavLink>
        <NavLink to="/profile/change-password" className={linkClass}>Change Password</NavLink>
        <NavLink to="/test-items" className={linkClass}>Test Items</NavLink>
      </nav>
    </aside>
  );
}
